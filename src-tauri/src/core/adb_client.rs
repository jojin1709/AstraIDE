use crate::core::process_utils::hidden_command;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AndroidDevice {
    pub serial: String,
    pub state: String, // "device", "unauthorized", "offline", "bootloader"
    pub model: String,
    pub product: String,
    pub android_version: Option<String>,
    pub api_level: Option<String>,
    pub connection_type: String, // "USB" or "Emulator" or "WiFi"
    pub is_authorized: bool,
    pub transport_id: Option<String>,
    pub is_graphene_os: bool,
    pub os_variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbCommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

pub struct AdbClient;

impl AdbClient {
    pub fn get_adb_binary(custom_sdk: Option<&str>) -> Result<PathBuf, String> {
        if let Some(sdk) = custom_sdk {
            let p = Path::new(sdk).join("platform-tools").join("adb.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        if let Ok(sdk_env) = std::env::var("ANDROID_HOME") {
            let p = PathBuf::from(sdk_env).join("platform-tools").join("adb.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let p = PathBuf::from(local_app_data)
                .join("Android")
                .join("Sdk")
                .join("platform-tools")
                .join("adb.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        // Fallback to where.exe adb
        if let Ok(out) = hidden_command("where.exe").arg("adb").output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout);
                if let Some(line) = s.lines().next() {
                    let p = PathBuf::from(line.trim());
                    if p.exists() {
                        return Ok(p);
                    }
                }
            }
        }

        Err("ADB binary not found. Please configure Android SDK in AstraIDE Settings.".to_string())
    }

    pub fn list_devices(custom_sdk: Option<&str>) -> Result<Vec<AndroidDevice>, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let output = hidden_command(&adb)
            .arg("devices")
            .arg("-l")
            .output()
            .map_err(|e| format!("Failed to execute adb devices: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "ADB devices command failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut devices = Vec::new();

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() || trimmed.starts_with("List of devices") || trimmed.starts_with("* daemon") {
                continue;
            }

            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.is_empty() {
                continue;
            }

            let serial = parts[0].to_string();
            let raw_state = if parts.len() > 1 { parts[1] } else { "unknown" };
            let is_authorized = raw_state == "device";

            let mut model = "Android Device".to_string();
            let mut product = "Generic".to_string();
            let mut transport_id = None;

            for part in &parts[2..] {
                if let Some(val) = part.strip_prefix("model:") {
                    model = val.replace('_', " ");
                } else if let Some(val) = part.strip_prefix("product:") {
                    product = val.to_string();
                } else if let Some(val) = part.strip_prefix("transport_id:") {
                    transport_id = Some(val.to_string());
                }
            }

            let connection_type = if serial.starts_with("emulator-") {
                "Emulator".to_string()
            } else if serial.contains(':') {
                "WiFi (TCP/IP)".to_string()
            } else {
                "USB".to_string()
            };

            let mut android_version = None;
            let mut api_level = None;
            let mut is_graphene_os = false;
            let mut os_variant = None;

            if is_authorized {
                // Query properties
                if let Ok(ver_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.build.version.release"])
                    .output()
                {
                    if ver_out.status.success() {
                        let v = String::from_utf8_lossy(&ver_out.stdout).trim().to_string();
                        if !v.is_empty() {
                            android_version = Some(format!("Android {}", v));
                        }
                    }
                }
                if let Ok(api_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.build.version.sdk"])
                    .output()
                {
                    if api_out.status.success() {
                        let a = String::from_utf8_lossy(&api_out.stdout).trim().to_string();
                        if !a.is_empty() {
                            api_level = Some(format!("API {}", a));
                        }
                    }
                }
                if let Ok(model_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.product.model"])
                    .output()
                {
                    if model_out.status.success() {
                        let m = String::from_utf8_lossy(&model_out.stdout).trim().to_string();
                        if !m.is_empty() {
                            model = m;
                        }
                    }
                }

                // Check for GrapheneOS
                if let Ok(flavor_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.build.flavor"])
                    .output()
                {
                    if flavor_out.status.success() {
                        let flv = String::from_utf8_lossy(&flavor_out.stdout).to_lowercase();
                        if flv.contains("graphene") {
                            is_graphene_os = true;
                        }
                    }
                }

                if let Ok(g_ver_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.grapheneos.version"])
                    .output()
                {
                    if g_ver_out.status.success() {
                        let gv = String::from_utf8_lossy(&g_ver_out.stdout).trim().to_string();
                        if !gv.is_empty() {
                            is_graphene_os = true;
                            os_variant = Some(format!("GrapheneOS {}", gv));
                        }
                    }
                }

                if let Ok(disp_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.build.display.id"])
                    .output()
                {
                    if disp_out.status.success() {
                        let disp = String::from_utf8_lossy(&disp_out.stdout).trim().to_string();
                        if disp.to_lowercase().contains("graphene") {
                            is_graphene_os = true;
                            if os_variant.is_none() {
                                os_variant = Some(disp);
                            }
                        }
                    }
                }

                if is_graphene_os && os_variant.is_none() {
                    os_variant = Some("GrapheneOS (Hardened)".to_string());
                }
            }

            let display_state = match raw_state {
                "device" => "Authorized".to_string(),
                "unauthorized" => "Unauthorized (Accept USB debugging prompt on device)".to_string(),
                "offline" => "Offline".to_string(),
                "bootloader" => "Bootloader".to_string(),
                _ => raw_state.to_string(),
            };

            devices.push(AndroidDevice {
                serial,
                state: display_state,
                model,
                product,
                android_version,
                api_level,
                connection_type,
                is_authorized,
                transport_id,
                is_graphene_os,
                os_variant,
            });
        }

        Ok(devices)
    }

    pub fn install_apk(
        custom_sdk: Option<&str>,
        serial: &str,
        apk_path: &str,
    ) -> Result<AdbCommandResult, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let apk = Path::new(apk_path);
        if !apk.exists() {
            return Err(format!("APK file does not exist at path: {}", apk_path));
        }

        let out = hidden_command(&adb)
            .args(["-s", serial, "install", "-r", apk_path])
            .output()
            .map_err(|e| format!("Failed to run adb install: {}", e))?;

        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let stderr = String::from_utf8_lossy(&out.stderr).to_string();
        let success = out.status.success() && stdout.contains("Success");

        Ok(AdbCommandResult {
            success,
            stdout,
            stderr,
            exit_code: out.status.code(),
        })
    }

    pub fn uninstall_app(
        custom_sdk: Option<&str>,
        serial: &str,
        package_name: &str,
    ) -> Result<AdbCommandResult, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let out = hidden_command(&adb)
            .args(["-s", serial, "uninstall", package_name])
            .output()
            .map_err(|e| format!("Failed to run adb uninstall: {}", e))?;

        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let stderr = String::from_utf8_lossy(&out.stderr).to_string();
        let success = out.status.success() && stdout.contains("Success");

        Ok(AdbCommandResult {
            success,
            stdout,
            stderr,
            exit_code: out.status.code(),
        })
    }

    pub fn launch_app(
        custom_sdk: Option<&str>,
        serial: &str,
        component: &str, // e.g. "com.example.myapp/.MainActivity"
    ) -> Result<AdbCommandResult, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let out = hidden_command(&adb)
            .args(["-s", serial, "shell", "am", "start", "-n", component])
            .output()
            .map_err(|e| format!("Failed to run adb am start: {}", e))?;

        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        let stderr = String::from_utf8_lossy(&out.stderr).to_string();
        let success = out.status.success() && !stdout.contains("Error:");

        Ok(AdbCommandResult {
            success,
            stdout,
            stderr,
            exit_code: out.status.code(),
        })
    }

    pub fn restart_server(custom_sdk: Option<&str>) -> Result<AdbCommandResult, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let _ = hidden_command(&adb).arg("kill-server").output();
        let out = hidden_command(&adb)
            .arg("start-server")
            .output()
            .map_err(|e| format!("Failed to start adb server: {}", e))?;

        Ok(AdbCommandResult {
            success: out.status.success(),
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
            exit_code: out.status.code(),
        })
    }

    pub fn take_screenshot_base64(
        custom_sdk: Option<&str>,
        serial: &str,
    ) -> Result<String, String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let out = hidden_command(&adb)
            .args(["-s", serial, "exec-out", "screencap", "-p"])
            .output()
            .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

        if !out.status.success() || out.stdout.is_empty() {
            return Err("Failed to capture screenshot from device via ADB".to_string());
        }

        // Convert PNG bytes to base64
        let b64 = base64_encode(&out.stdout);
        Ok(format!("data:image/png;base64,{}", b64))
    }
}

fn base64_encode(input: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((input.len() + 2) / 3 * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        let n = ((b0 as u32) << 16) | ((b1 as u32) << 8) | (b2 as u32);
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        if chunk.len() > 1 {
            out.push(TABLE[((n >> 6) & 63) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(TABLE[(n & 63) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}
