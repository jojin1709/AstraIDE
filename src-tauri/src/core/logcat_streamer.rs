use crate::core::adb_client::AdbClient;
use crate::core::process_utils::{hidden_command, hidden_tokio_command};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogcatEntry {
    pub raw: String,
    pub timestamp: String,
    pub pid: String,
    pub tid: String,
    pub level: String, // "V", "D", "I", "W", "E", "F"
    pub tag: String,
    pub message: String,
}

pub struct LogcatStreamer {
    active_sessions: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

impl LogcatStreamer {
    pub fn new() -> Self {
        Self {
            active_sessions: Mutex::new(HashMap::new()),
        }
    }

    pub fn parse_logcat_line(line: &str) -> LogcatEntry {
        // Sample standard threadtime format:
        // 10-16 22:30:15.123  1234  5678 I ActivityTaskManager: Displayed com.example.app/...
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 6 {
            let timestamp = format!("{} {}", parts[0], parts[1]);
            let pid = parts[2].to_string();
            let tid = parts[3].to_string();
            let level_char = parts[4];
            let level = match level_char {
                "V" => "VERBOSE",
                "D" => "DEBUG",
                "I" => "INFO",
                "W" => "WARN",
                "E" => "ERROR",
                "F" => "FATAL",
                _ => level_char,
            }
            .to_string();

            let tag_part = parts[5].trim_end_matches(':').to_string();
            let msg_start_idx = line
                .find(&parts[5])
                .map(|idx| idx + parts[5].len())
                .unwrap_or(0);
            let message = line[msg_start_idx..].trim_start_matches(':').trim().to_string();

            LogcatEntry {
                raw: line.to_string(),
                timestamp,
                pid,
                tid,
                level,
                tag: tag_part,
                message,
            }
        } else {
            LogcatEntry {
                raw: line.to_string(),
                timestamp: "".to_string(),
                pid: "".to_string(),
                tid: "".to_string(),
                level: "INFO".to_string(),
                tag: "System".to_string(),
                message: line.to_string(),
            }
        }
    }

    pub fn stop_session(&self, serial: &str) {
        let mut sessions = self.active_sessions.lock().unwrap();
        if let Some(stop_flag) = sessions.remove(serial) {
            stop_flag.store(true, Ordering::SeqCst);
        }
    }

    pub fn clear_logcat(&self, custom_sdk: Option<&str>, serial: &str) -> Result<(), String> {
        let adb = AdbClient::get_adb_binary(custom_sdk)?;
        let _ = hidden_command(adb)
            .args(["-s", serial, "logcat", "-c"])
            .output()
            .map_err(|e| format!("Failed to clear logcat: {}", e))?;
        Ok(())
    }

    pub async fn start_session(
        &self,
        app_handle: AppHandle,
        custom_sdk: Option<String>,
        serial: String,
    ) -> Result<(), String> {
        self.stop_session(&serial);

        let adb = AdbClient::get_adb_binary(custom_sdk.as_deref())?;
        let stop_flag = Arc::new(AtomicBool::new(false));
        {
            let mut sessions = self.active_sessions.lock().unwrap();
            sessions.insert(serial.clone(), stop_flag.clone());
        }

        let serial_clone = serial.clone();
        tokio::spawn(async move {
            let mut cmd = hidden_tokio_command(adb);
            cmd.args(["-s", &serial_clone, "logcat", "-v", "threadtime"]);
            cmd.stdout(Stdio::piped());
            cmd.stderr(Stdio::null());

            if let Ok(mut child) = cmd.spawn() {
                if let Some(stdout) = child.stdout.take() {
                    let mut reader = BufReader::new(stdout).lines();
                    let mut buffer: Vec<LogcatEntry> = Vec::with_capacity(30);
                    let mut last_flush = std::time::Instant::now();

                    while !stop_flag.load(Ordering::SeqCst) {
                        tokio::select! {
                            line_res = reader.next_line() => {
                                match line_res {
                                    Ok(Some(line)) => {
                                        let entry = Self::parse_logcat_line(&line);
                                        buffer.push(entry);

                                        if buffer.len() >= 25 || last_flush.elapsed().as_millis() > 100 {
                                            let _ = app_handle.emit("logcat-batch", &buffer);
                                            buffer.clear();
                                            last_flush = std::time::Instant::now();
                                        }
                                    }
                                    Ok(None) => break,
                                    Err(_) => break,
                                }
                            }
                            _ = tokio::time::sleep(tokio::time::Duration::from_millis(50)) => {
                                if !buffer.is_empty() {
                                    let _ = app_handle.emit("logcat-batch", &buffer);
                                    buffer.clear();
                                    last_flush = std::time::Instant::now();
                                }
                            }
                        }
                    }

                    if !buffer.is_empty() {
                        let _ = app_handle.emit("logcat-batch", &buffer);
                    }
                }
                let _ = child.kill().await;
            }
        });

        Ok(())
    }
}
