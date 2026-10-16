use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradleBuildLineEvent {
    pub task: String,
    pub line: String,
    pub is_error: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradleBuildResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub task: String,
    pub apk_path: Option<String>,
    pub apk_size_mb: Option<f64>,
    pub duration_seconds: f64,
    pub error_message: Option<String>,
}

pub struct GradleRunner;

impl GradleRunner {
    pub fn find_gradle_executable(project_path: &str) -> Result<(PathBuf, bool), String> {
        let p = Path::new(project_path);
        if !p.exists() {
            return Err(format!("Project directory does not exist: {}", project_path));
        }

        // 1. Prefer Gradle wrapper
        let gradlew_bat = p.join("gradlew.bat");
        if gradlew_bat.exists() {
            return Ok((gradlew_bat, true));
        }

        let gradlew = p.join("gradlew");
        if gradlew.exists() {
            return Ok((gradlew, true));
        }

        // 2. Fallback to system gradle
        if let Ok(out) = std::process::Command::new("where.exe").arg("gradle").output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout);
                if let Some(line) = s.lines().next() {
                    let path = PathBuf::from(line.trim());
                    if path.exists() {
                        return Ok((path, false));
                    }
                }
            }
        }

        Err("No Gradle wrapper (gradlew.bat) or system Gradle found in project or PATH.".to_string())
    }

    pub fn scan_for_apk(project_path: &str, build_type: &str) -> Option<(String, f64)> {
        let root = Path::new(project_path);
        // Look in app/build/outputs/apk/<build_type>/
        let candidates = [
            root.join("app").join("build").join("outputs").join("apk").join(build_type),
            root.join("app").join("build").join("outputs").join("apk"),
            root.join("build").join("outputs").join("apk"),
        ];

        for dir in &candidates {
            if dir.exists() {
                for entry in WalkDir::new(dir).max_depth(3).into_iter().filter_map(|e| e.ok()) {
                    if entry.file_type().is_file() {
                        if let Some(ext) = entry.path().extension() {
                            if ext.to_string_lossy().eq_ignore_ascii_case("apk") {
                                if let Ok(meta) = entry.metadata() {
                                    let mb = meta.len() as f64 / (1024.0 * 1024.0);
                                    let rounded_mb = (mb * 100.0).round() / 100.0;
                                    return Some((entry.path().to_string_lossy().to_string(), rounded_mb));
                                }
                            }
                        }
                    }
                }
            }
        }
        None
    }

    pub async fn run_task(
        app_handle: AppHandle,
        project_path: String,
        task_name: String,
        extra_args: Vec<String>,
        custom_sdk: Option<String>,
        custom_jdk: Option<String>,
    ) -> Result<GradleBuildResult, String> {
        let (gradle_cmd, _is_wrapper) = Self::find_gradle_executable(&project_path)?;
        let start_time = Instant::now();

        let mut cmd = TokioCommand::new(&gradle_cmd);
        cmd.current_dir(&project_path);

        // Supply task argument and extra flags
        cmd.arg(&task_name);
        for arg in &extra_args {
            cmd.arg(arg);
        }

        // Configure environment variables
        if let Some(sdk) = custom_sdk {
            cmd.env("ANDROID_HOME", &sdk);
            cmd.env("ANDROID_SDK_ROOT", &sdk);
        }
        if let Some(jdk) = custom_jdk {
            cmd.env("JAVA_HOME", &jdk);
        }

        // Disable daemon idle crash if running in tight memory
        cmd.arg("--no-daemon");

        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to spawn Gradle process ({}): {}", gradle_cmd.display(), e))?;

        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let app_handle_stdout = app_handle.clone();
        let task_name_stdout = task_name.clone();
        let stdout_handle = tokio::spawn(async move {
            if let Some(stream) = stdout {
                let mut reader = BufReader::new(stream).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    let _ = app_handle_stdout.emit(
                        "gradle-build-line",
                        GradleBuildLineEvent {
                            task: task_name_stdout.clone(),
                            line,
                            is_error: false,
                        },
                    );
                }
            }
        });

        let app_handle_stderr = app_handle.clone();
        let task_name_stderr = task_name.clone();
        let mut error_summary = None;
        let stderr_handle = tokio::spawn(async move {
            let mut err_lines = Vec::new();
            if let Some(stream) = stderr {
                let mut reader = BufReader::new(stream).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    if line.contains("FAILURE") || line.contains("ERROR") || line.contains("Exception") {
                        err_lines.push(line.clone());
                    }
                    let _ = app_handle_stderr.emit(
                        "gradle-build-line",
                        GradleBuildLineEvent {
                            task: task_name_stderr.clone(),
                            line,
                            is_error: true,
                        },
                    );
                }
            }
            if !err_lines.is_empty() {
                Some(err_lines.join("\n"))
            } else {
                None
            }
        });

        let status = child
            .wait()
            .await
            .map_err(|e| format!("Failed waiting for Gradle process: {}", e))?;

        let _ = stdout_handle.await;
        if let Ok(err) = stderr_handle.await {
            error_summary = err;
        }

        let duration_seconds = (start_time.elapsed().as_millis() as f64 / 1000.0 * 100.0).round() / 100.0;
        let success = status.success();

        // Scan for built APK if it was an assemble or build task
        let mut apk_path = None;
        let mut apk_size_mb = None;

        if success && (task_name.contains("assemble") || task_name.contains("build")) {
            let build_type = if task_name.to_lowercase().contains("release") {
                "release"
            } else {
                "debug"
            };
            if let Some((apk, size)) = Self::scan_for_apk(&project_path, build_type) {
                apk_path = Some(apk);
                apk_size_mb = Some(size);
            }
        }

        Ok(GradleBuildResult {
            success,
            exit_code: status.code(),
            task: task_name,
            apk_path,
            apk_size_mb,
            duration_seconds,
            error_message: if !success {
                error_summary.or_else(|| Some("Build failed. Check build logs for details.".to_string()))
            } else {
                None
            },
        })
    }
}
