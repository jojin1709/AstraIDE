use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalLineEvent {
    pub session_id: String,
    pub line: String,
    pub is_error: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalCommandResult {
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

pub struct TerminalManager {
    running_processes: Mutex<HashMap<String, Arc<AtomicBool>>>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            running_processes: Mutex::new(HashMap::new()),
        }
    }

    pub async fn run_command(
        &self,
        app_handle: AppHandle,
        session_id: String,
        cwd: String,
        command_str: String,
        shell_type: String, // "powershell" or "cmd"
    ) -> Result<TerminalCommandResult, String> {
        let work_dir = Path::new(&cwd);
        if !work_dir.exists() {
            return Err(format!("Working directory does not exist: {}", cwd));
        }

        let mut cmd = if shell_type.to_lowercase() == "cmd" {
            let mut c = TokioCommand::new("cmd.exe");
            c.arg("/C").arg(&command_str);
            c
        } else {
            let mut c = TokioCommand::new("powershell.exe");
            c.arg("-NoProfile").arg("-Command").arg(&command_str);
            c
        };

        cmd.current_dir(work_dir);
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn shell command: {}", e))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let app_handle_out = app_handle.clone();
        let sess_out = session_id.clone();
        let out_handle = tokio::spawn(async move {
            let mut captured = Vec::new();
            if let Some(stream) = stdout {
                let mut reader = BufReader::new(stream).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    captured.push(line.clone());
                    let _ = app_handle_out.emit(
                        "terminal-line",
                        TerminalLineEvent {
                            session_id: sess_out.clone(),
                            line,
                            is_error: false,
                        },
                    );
                }
            }
            captured.join("\n")
        });

        let app_handle_err = app_handle.clone();
        let sess_err = session_id.clone();
        let err_handle = tokio::spawn(async move {
            let mut captured = Vec::new();
            if let Some(stream) = stderr {
                let mut reader = BufReader::new(stream).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    captured.push(line.clone());
                    let _ = app_handle_err.emit(
                        "terminal-line",
                        TerminalLineEvent {
                            session_id: sess_err.clone(),
                            line,
                            is_error: true,
                        },
                    );
                }
            }
            captured.join("\n")
        });

        let status = child
            .wait()
            .await
            .map_err(|e| format!("Process error: {}", e))?;

        let stdout_str = out_handle.await.unwrap_or_default();
        let stderr_str = err_handle.await.unwrap_or_default();

        Ok(TerminalCommandResult {
            exit_code: status.code(),
            stdout: stdout_str,
            stderr: stderr_str,
        })
    }
}
