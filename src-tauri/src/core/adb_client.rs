use crate::core::process_utils::hidden_command;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AndroidDevice {
    pub serial: String,
    pub state: String, // "device", "unauthorized", "offline", "bootloader"
    pub model: String,
    pub product: String,
    pub manufacturer: Option<String>,
    pub android_version: Option<String>,
    pub api_level: Option<String>,
    pub battery_level: Option<i32>,
    pub screen_size: Option<String>,
    pub cpu_abi: Option<String>,
    pub connection_type: String, // "USB" or "Emulator" or "WiFi"
    pub is_authorized: bool,
    pub transport_id: Option<String>,
    pub is_graphene_os: bool,
    pub os_variant: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvdInfo {
    pub name: String,
    pub path: Option<String>,
    pub target: Option<String>,
    pub abi: Option<String>,
    pub device_name: Option<String>,
    pub is_running: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemImageInfo {
    pub tag: String,
    pub api_level: String,
    pub abi: String,
    pub relative_path: String,
    pub full_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAvdRequest {
    pub name: String,
    pub device_profile: String,
    pub system_image_path: String,
    pub abi: String,
    pub ram_mb: u32,
    pub screen_width: u32,
    pub screen_height: u32,
    pub screen_density: u32,
    pub is_graphene_os: bool,
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

            let mut manufacturer = None;
            let mut android_version = None;
            let mut api_level = None;
            let mut battery_level = None;
            let mut screen_size = None;
            let mut cpu_abi = None;
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

                if let Ok(mfg_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.product.manufacturer"])
                    .output()
                {
                    if mfg_out.status.success() {
                        let m = String::from_utf8_lossy(&mfg_out.stdout).trim().to_string();
                        if !m.is_empty() {
                            manufacturer = Some(m);
                        }
                    }
                }

                if let Ok(abi_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "getprop", "ro.product.cpu.abi"])
                    .output()
                {
                    if abi_out.status.success() {
                        let a = String::from_utf8_lossy(&abi_out.stdout).trim().to_string();
                        if !a.is_empty() {
                            cpu_abi = Some(a);
                        }
                    }
                }

                if let Ok(wm_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "wm", "size"])
                    .output()
                {
                    if wm_out.status.success() {
                        let w = String::from_utf8_lossy(&wm_out.stdout);
                        if let Some(sz) = w.lines().find(|l| l.contains("Physical size:")) {
                            screen_size = Some(sz.replace("Physical size:", "").trim().to_string());
                        }
                    }
                }

                if let Ok(bat_out) = hidden_command(&adb)
                    .args(["-s", &serial, "shell", "dumpsys", "battery"])
                    .output()
                {
                    if bat_out.status.success() {
                        let b = String::from_utf8_lossy(&bat_out.stdout);
                        for line in b.lines() {
                            if let Some(lvl_str) = line.trim().strip_prefix("level:") {
                                if let Ok(lvl) = lvl_str.trim().parse::<i32>() {
                                    battery_level = Some(lvl);
                                    break;
                                }
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
                manufacturer,
                android_version,
                api_level,
                battery_level,
                screen_size,
                cpu_abi,
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

    pub fn get_emulator_binary(custom_sdk: Option<&str>) -> Result<PathBuf, String> {
        if let Some(sdk) = custom_sdk {
            let p = Path::new(sdk).join("emulator").join("emulator.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        if let Ok(sdk_env) = std::env::var("ANDROID_HOME") {
            let p = PathBuf::from(sdk_env).join("emulator").join("emulator.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let p = PathBuf::from(local_app_data)
                .join("Android")
                .join("Sdk")
                .join("emulator")
                .join("emulator.exe");
            if p.exists() {
                return Ok(p);
            }
        }
        if let Ok(out) = hidden_command("where.exe").arg("emulator").output() {
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
        Err("Android emulator binary not found in SDK or PATH.".to_string())
    }

    pub fn list_avds(custom_sdk: Option<&str>) -> Vec<AvdInfo> {
        let mut avd_names: Vec<String> = Vec::new();

        // Method 1: emulator.exe -list-avds
        if let Ok(emu) = Self::get_emulator_binary(custom_sdk) {
            if let Ok(out) = hidden_command(&emu).arg("-list-avds").output() {
                if out.status.success() {
                    for line in String::from_utf8_lossy(&out.stdout).lines() {
                        let name = line.trim();
                        if !name.is_empty() && !avd_names.iter().any(|n| n == name) {
                            avd_names.push(name.to_string());
                        }
                    }
                }
            }
        }

        // Method 2: Inspect ~/.android/avd/*.ini
        if let Ok(user_profile) = std::env::var("USERPROFILE") {
            let avd_dir = PathBuf::from(user_profile).join(".android").join("avd");
            if let Ok(entries) = std::fs::read_dir(&avd_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_file() && path.extension().map(|e| e == "ini").unwrap_or(false) {
                        if let Some(file_stem) = path.file_stem().and_then(|s| s.to_str()) {
                            let name = file_stem.to_string();
                            if !avd_names.contains(&name) {
                                avd_names.push(name);
                            }
                        }
                    }
                }
            }
        }

        // Query active running devices to check if any AVD is running
        let running_devices = Self::list_devices(custom_sdk).unwrap_or_default();
        let any_emulator_running = running_devices.iter().any(|d| d.connection_type == "Emulator");

        let mut result = Vec::new();
        for name in avd_names {
            let mut abi = None;
            let mut device_name = None;
            let mut target = None;
            let mut avd_folder = None;

            if let Ok(user_profile) = std::env::var("USERPROFILE") {
                let avd_dir = PathBuf::from(&user_profile).join(".android").join("avd");
                let ini_file = avd_dir.join(format!("{}.ini", name));
                if let Ok(ini_content) = std::fs::read_to_string(&ini_file) {
                    for line in ini_content.lines() {
                        if let Some(p) = line.strip_prefix("path=") {
                            avd_folder = Some(p.trim().to_string());
                        } else if let Some(t) = line.strip_prefix("target=") {
                            target = Some(t.trim().to_string());
                        }
                    }
                }

                let folder_path = avd_folder.as_ref().map(PathBuf::from).unwrap_or_else(|| avd_dir.join(format!("{}.avd", name)));
                let config_file = folder_path.join("config.ini");
                if let Ok(cfg_content) = std::fs::read_to_string(config_file) {
                    for line in cfg_content.lines() {
                        if let Some(a) = line.strip_prefix("abi.type=") {
                            abi = Some(a.trim().to_string());
                        } else if let Some(d) = line.strip_prefix("hw.device.name=") {
                            device_name = Some(d.trim().to_string());
                        } else if let Some(img) = line.strip_prefix("image.sysdir.1=") {
                            if target.is_none() {
                                target = Some(img.trim().replace('\\', "/"));
                            }
                        }
                    }
                }
            }

            result.push(AvdInfo {
                name,
                path: avd_folder,
                target,
                abi,
                device_name,
                is_running: any_emulator_running,
            });
        }

        result
    }

    pub fn launch_avd(custom_sdk: Option<&str>, avd_name: &str) -> Result<String, String> {
        let emu = Self::get_emulator_binary(custom_sdk)?;
        // Spawn emulator completely detached with Direct3D/Host GPU acceleration
        hidden_command(&emu)
            .args(["-avd", avd_name, "-gpu", "host"])
            .spawn()
            .map_err(|e| format!("Failed to spawn Android emulator process: {}", e))?;

        Ok(format!("Emulator '{}' launched with Direct3D / Host GPU acceleration.", avd_name))
    }

    pub fn list_system_images(custom_sdk: Option<&str>) -> Vec<SystemImageInfo> {
        let mut sdk_roots = Vec::new();
        if let Some(sdk) = custom_sdk {
            sdk_roots.push(PathBuf::from(sdk));
        }
        if let Ok(sdk_env) = std::env::var("ANDROID_HOME") {
            sdk_roots.push(PathBuf::from(sdk_env));
        }
        if let Ok(local) = std::env::var("LOCALAPPDATA") {
            sdk_roots.push(PathBuf::from(local).join("Android").join("Sdk"));
        }

        let mut results = Vec::new();
        for root in sdk_roots {
            let sys_dir = root.join("system-images");
            if !sys_dir.exists() {
                continue;
            }

            if let Ok(api_entries) = std::fs::read_dir(&sys_dir) {
                for api_entry in api_entries.flatten() {
                    let api_path = api_entry.path();
                    if !api_path.is_dir() { continue; }
                    let api_name = api_path.file_name().unwrap_or_default().to_string_lossy().to_string();

                    if let Ok(tag_entries) = std::fs::read_dir(&api_path) {
                        for tag_entry in tag_entries.flatten() {
                            let tag_path = tag_entry.path();
                            if !tag_path.is_dir() { continue; }
                            let tag_name = tag_path.file_name().unwrap_or_default().to_string_lossy().to_string();

                            if let Ok(abi_entries) = std::fs::read_dir(&tag_path) {
                                for abi_entry in abi_entries.flatten() {
                                    let abi_path = abi_entry.path();
                                    if !abi_path.is_dir() { continue; }
                                    let abi_name = abi_path.file_name().unwrap_or_default().to_string_lossy().to_string();

                                    let rel = format!("system-images/{}/{}/{}/", api_name, tag_name, abi_name);
                                    results.push(SystemImageInfo {
                                        tag: tag_name.clone(),
                                        api_level: api_name.replace("android-", "API "),
                                        abi: abi_name,
                                        relative_path: rel,
                                        full_path: abi_path.to_string_lossy().to_string(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        results
    }

    pub fn create_avd(_custom_sdk: Option<&str>, req: CreateAvdRequest) -> Result<String, String> {
        let user_profile = std::env::var("USERPROFILE").map_err(|e| format!("Missing USERPROFILE: {}", e))?;
        let avd_root = PathBuf::from(&user_profile).join(".android").join("avd");
        std::fs::create_dir_all(&avd_root).map_err(|e| format!("Failed to create AVD directory: {}", e))?;

        let safe_name = req.name.trim().replace(' ', "_");
        let avd_folder = avd_root.join(format!("{}.avd", safe_name));
        std::fs::create_dir_all(&avd_folder).map_err(|e| format!("Failed to create emulator folder: {}", e))?;

        let ini_file = avd_root.join(format!("{}.ini", safe_name));
        let ini_content = format!(
            "avd.ini.encoding=UTF-8\r\npath={}\r\npath.rel=avd\\{}.avd\r\ntarget=android-0\r\n",
            avd_folder.to_string_lossy(),
            safe_name
        );
        std::fs::write(&ini_file, ini_content).map_err(|e| format!("Failed to write {}.ini: {}", safe_name, e))?;

        let config_file = avd_folder.join("config.ini");
        let tag_id = if req.is_graphene_os { "graphene_os" } else { "google_apis" };
        let tag_display = if req.is_graphene_os { "GrapheneOS Hardened" } else { "Google APIs" };

        let config_content = format!(
            "PlayStore.enabled=no\r\n\
            abi.type={}\r\n\
            avd.id={}\r\n\
            avd.ini.encoding=UTF-8\r\n\
            avd.name={}\r\n\
            disk.dataPartition.size=4096M\r\n\
            fastboot.forceChosenSnapshotBoot=no\r\n\
            fastboot.forceColdBoot=no\r\n\
            fastboot.forceFastBoot=yes\r\n\
            hw.accelerometer=yes\r\n\
            hw.audioInput=yes\r\n\
            hw.battery=yes\r\n\
            hw.camera.back=virtualscene\r\n\
            hw.camera.front=emulated\r\n\
            hw.cpu.ncore=4\r\n\
            hw.dPad=no\r\n\
            hw.device.name={}\r\n\
            hw.gps=yes\r\n\
            hw.gpu.enabled=yes\r\n\
            hw.gpu.mode=host\r\n\
            hw.initialOrientation=portrait\r\n\
            hw.keyboard=yes\r\n\
            hw.lcd.density={}\r\n\
            hw.lcd.height={}\r\n\
            hw.lcd.width={}\r\n\
            hw.mainKeys=no\r\n\
            hw.ramSize={}\r\n\
            hw.sdCard=yes\r\n\
            image.sysdir.1={}\r\n\
            tag.display={}\r\n\
            tag.id={}\r\n",
            req.abi,
            safe_name,
            safe_name,
            req.device_profile,
            req.screen_density,
            req.screen_height,
            req.screen_width,
            req.ram_mb,
            req.system_image_path,
            tag_display,
            tag_id
        );
        std::fs::write(&config_file, config_content).map_err(|e| format!("Failed to write config.ini: {}", e))?;

        Ok(format!("Custom Virtual Device '{}' created successfully! Ready to run.", safe_name))
    }

    pub fn send_touch_tap(custom_sdk: Option<&str>, serial: &str, x: i32, y: i32) -> Result<(), String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        hidden_command(&adb)
            .args(["-s", serial, "shell", "input", "tap", &x.to_string(), &y.to_string()])
            .output()
            .map_err(|e| format!("Failed to send tap: {}", e))?;
        Ok(())
    }

    pub fn send_touch_swipe(
        custom_sdk: Option<&str>,
        serial: &str,
        x1: i32,
        y1: i32,
        x2: i32,
        y2: i32,
        duration_ms: i32,
    ) -> Result<(), String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        hidden_command(&adb)
            .args([
                "-s",
                serial,
                "shell",
                "input",
                "swipe",
                &x1.to_string(),
                &y1.to_string(),
                &x2.to_string(),
                &y2.to_string(),
                &duration_ms.to_string(),
            ])
            .output()
            .map_err(|e| format!("Failed to send swipe: {}", e))?;
        Ok(())
    }

    pub fn send_key_event(custom_sdk: Option<&str>, serial: &str, keycode: i32) -> Result<(), String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        hidden_command(&adb)
            .args(["-s", serial, "shell", "input", "keyevent", &keycode.to_string()])
            .output()
            .map_err(|e| format!("Failed to send keyevent: {}", e))?;
        Ok(())
    }

    pub fn send_input_text(custom_sdk: Option<&str>, serial: &str, text: &str) -> Result<(), String> {
        let adb = Self::get_adb_binary(custom_sdk)?;
        let sanitized = text.replace(' ', "%s");
        hidden_command(&adb)
            .args(["-s", serial, "shell", "input", "text", &sanitized])
            .output()
            .map_err(|e| format!("Failed to send text: {}", e))?;
        Ok(())
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
