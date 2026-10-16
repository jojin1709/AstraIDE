use serde::{Deserialize, Serialize};
use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;
use sysinfo::{Disks, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolStatus {
    pub detected: bool,
    pub name: String,
    pub path: Option<String>,
    pub version: Option<String>,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfoReport {
    pub os_name: String,
    pub os_version: String,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub total_memory_mb: u64,
    pub free_memory_mb: u64,
    pub disks: Vec<DiskReport>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskReport {
    pub mount_point: String,
    pub total_space_gb: f64,
    pub free_space_gb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AndroidEnvironmentReport {
    pub system_info: SystemInfoReport,
    pub java: ToolStatus,
    pub android_sdk: ToolStatus,
    pub adb: ToolStatus,
    pub build_tools: ToolStatus,
    pub gradle: ToolStatus,
    pub git: ToolStatus,
    pub emulator: ToolStatus,
}

pub struct EnvDetector;

impl EnvDetector {
    pub fn detect_all() -> AndroidEnvironmentReport {
        let system_info = Self::detect_system_info();
        let java = Self::detect_java();
        let android_sdk = Self::detect_android_sdk();
        let adb = Self::detect_adb(android_sdk.path.as_deref());
        let build_tools = Self::detect_build_tools(android_sdk.path.as_deref());
        let gradle = Self::detect_gradle();
        let git = Self::detect_git();
        let emulator = Self::detect_emulator(android_sdk.path.as_deref());

        AndroidEnvironmentReport {
            system_info,
            java,
            android_sdk,
            adb,
            build_tools,
            gradle,
            git,
            emulator,
        }
    }

    pub fn detect_system_info() -> SystemInfoReport {
        let mut sys = System::new_all();
        sys.refresh_all();

        let os_name = System::name().unwrap_or_else(|| "Windows".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "10/11".to_string());
        let cpu_brand = sys
            .cpus()
            .first()
            .map(|c| c.brand().trim().to_string())
            .unwrap_or_else(|| "x86_64 Processor".to_string());
        let cpu_cores = sys.cpus().len();
        let total_memory_mb = sys.total_memory() / 1024 / 1024;
        let free_memory_mb = sys.available_memory() / 1024 / 1024;

        let disks_data = Disks::new_with_refreshed_list();
        let mut disks = Vec::new();
        for disk in &disks_data {
            let total = disk.total_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            let free = disk.available_space() as f64 / (1024.0 * 1024.0 * 1024.0);
            disks.push(DiskReport {
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_space_gb: (total * 10.0).round() / 10.0,
                free_space_gb: (free * 10.0).round() / 10.0,
            });
        }

        SystemInfoReport {
            os_name,
            os_version,
            cpu_brand,
            cpu_cores,
            total_memory_mb,
            free_memory_mb,
            disks,
        }
    }

    pub fn detect_java() -> ToolStatus {
        let mut candidate_paths: Vec<PathBuf> = Vec::new();

        if let Ok(jh) = env::var("JAVA_HOME") {
            let p = PathBuf::from(&jh).join("bin").join("java.exe");
            if p.exists() {
                candidate_paths.push(p);
            }
        }

        if let Ok(out) = Command::new("where.exe").arg("java").output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout);
                for line in s.lines() {
                    let p = PathBuf::from(line.trim());
                    if p.exists() && !candidate_paths.contains(&p) {
                        candidate_paths.push(p);
                    }
                }
            }
        }

        let java_path = candidate_paths.first();
        if let Some(path) = java_path {
            let version_output = Command::new(path).arg("-version").output();
            let mut ver_str = None;
            let mut details = None;
            if let Ok(res) = version_output {
                let text = format!(
                    "{}\n{}",
                    String::from_utf8_lossy(&res.stdout),
                    String::from_utf8_lossy(&res.stderr)
                );
                for line in text.lines() {
                    if line.contains("version") || line.contains("openjdk") || line.contains("HotSpot") {
                        if ver_str.is_none() {
                            ver_str = Some(line.trim().to_string());
                        }
                    }
                }
                details = Some(text.lines().take(3).collect::<Vec<_>>().join(" | "));
            }

            ToolStatus {
                detected: true,
                name: "Java JDK".to_string(),
                path: Some(path.to_string_lossy().to_string()),
                version: ver_str.or_else(|| Some("JDK Installed".to_string())),
                details,
            }
        } else {
            ToolStatus {
                detected: false,
                name: "Java JDK".to_string(),
                path: None,
                version: None,
                details: Some("Java not found in PATH or JAVA_HOME. JDK 17 or 21 recommended for Android Gradle builds.".to_string()),
            }
        }
    }

    pub fn detect_android_sdk() -> ToolStatus {
        let mut candidates = Vec::new();

        if let Ok(val) = env::var("ANDROID_HOME") {
            let p = PathBuf::from(val);
            if p.exists() {
                candidates.push(p);
            }
        }
        if let Ok(val) = env::var("ANDROID_SDK_ROOT") {
            let p = PathBuf::from(val);
            if p.exists() && !candidates.contains(&p) {
                candidates.push(p);
            }
        }
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            let p = PathBuf::from(local_app_data).join("Android").join("Sdk");
            if p.exists() && !candidates.contains(&p) {
                candidates.push(p);
            }
        }

        if let Some(sdk_path) = candidates.first() {
            let mut components = Vec::new();
            if sdk_path.join("platform-tools").exists() {
                components.push("Platform Tools");
            }
            if sdk_path.join("build-tools").exists() {
                components.push("Build Tools");
            }
            if sdk_path.join("platforms").exists() {
                components.push("Platforms");
            }
            if sdk_path.join("cmdline-tools").exists() {
                components.push("Cmdline Tools");
            }

            ToolStatus {
                detected: true,
                name: "Android SDK".to_string(),
                path: Some(sdk_path.to_string_lossy().to_string()),
                version: Some(format!("{} components verified", components.len())),
                details: Some(format!("Installed: {}", components.join(", "))),
            }
        } else {
            ToolStatus {
                detected: false,
                name: "Android SDK".to_string(),
                path: None,
                version: None,
                details: Some("Android SDK directory not found in ANDROID_HOME or AppData/Local/Android/Sdk.".to_string()),
            }
        }
    }

    pub fn detect_adb(sdk_path: Option<&str>) -> ToolStatus {
        let mut adb_path: Option<PathBuf> = None;

        if let Some(sdk) = sdk_path {
            let p = Path::new(sdk).join("platform-tools").join("adb.exe");
            if p.exists() {
                adb_path = Some(p);
            }
        }

        if adb_path.is_none() {
            if let Ok(out) = Command::new("where.exe").arg("adb").output() {
                if out.status.success() {
                    let s = String::from_utf8_lossy(&out.stdout);
                    if let Some(first_line) = s.lines().next() {
                        let p = PathBuf::from(first_line.trim());
                        if p.exists() {
                            adb_path = Some(p);
                        }
                    }
                }
            }
        }

        if let Some(path) = adb_path {
            let mut version_str = None;
            if let Ok(out) = Command::new(&path).arg("version").output() {
                let s = String::from_utf8_lossy(&out.stdout);
                for line in s.lines() {
                    if line.contains("Android Debug Bridge") || line.contains("Version") {
                        version_str = Some(line.trim().to_string());
                        break;
                    }
                }
            }

            ToolStatus {
                detected: true,
                name: "ADB (Android Debug Bridge)".to_string(),
                path: Some(path.to_string_lossy().to_string()),
                version: version_str.or_else(|| Some("Detected".to_string())),
                details: Some("Ready for physical devices and emulators".to_string()),
            }
        } else {
            ToolStatus {
                detected: false,
                name: "ADB (Android Debug Bridge)".to_string(),
                path: None,
                version: None,
                details: Some("adb.exe not found. Install Android SDK Platform-Tools.".to_string()),
            }
        }
    }

    pub fn detect_build_tools(sdk_path: Option<&str>) -> ToolStatus {
        if let Some(sdk) = sdk_path {
            let bt_dir = Path::new(sdk).join("build-tools");
            if bt_dir.exists() && bt_dir.is_dir() {
                let mut versions = Vec::new();
                if let Ok(entries) = std::fs::read_dir(&bt_dir) {
                    for entry in entries.flatten() {
                        if entry.path().is_dir() {
                            if let Some(name) = entry.file_name().to_str() {
                                versions.push(name.to_string());
                            }
                        }
                    }
                }
                versions.sort();
                if let Some(latest) = versions.last() {
                    return ToolStatus {
                        detected: true,
                        name: "Android Build Tools".to_string(),
                        path: Some(bt_dir.join(latest).to_string_lossy().to_string()),
                        version: Some(latest.clone()),
                        details: Some(format!("Available versions: {}", versions.join(", "))),
                    };
                }
            }
        }

        ToolStatus {
            detected: false,
            name: "Android Build Tools".to_string(),
            path: None,
            version: None,
            details: Some("No build-tools directory detected in Android SDK.".to_string()),
        }
    }

    pub fn detect_gradle() -> ToolStatus {
        if let Ok(out) = Command::new("where.exe").arg("gradle").output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout);
                if let Some(first_line) = s.lines().next() {
                    let p = PathBuf::from(first_line.trim());
                    if p.exists() {
                        let mut ver = None;
                        if let Ok(v_out) = Command::new(&p).arg("--version").output() {
                            let text = String::from_utf8_lossy(&v_out.stdout);
                            for line in text.lines() {
                                if line.starts_with("Gradle ") {
                                    ver = Some(line.trim().to_string());
                                    break;
                                }
                            }
                        }
                        return ToolStatus {
                            detected: true,
                            name: "Gradle (System)".to_string(),
                            path: Some(p.to_string_lossy().to_string()),
                            version: ver.or_else(|| Some("System Gradle".to_string())),
                            details: Some("System Gradle found. Projects will use their own gradlew wrapper by default.".to_string()),
                        };
                    }
                }
            }
        }

        ToolStatus {
            detected: false,
            name: "Gradle (System)".to_string(),
            path: None,
            version: None,
            details: Some("System Gradle not installed in PATH. AstraIDE uses Gradle Wrapper (gradlew) per project.".to_string()),
        }
    }

    pub fn detect_git() -> ToolStatus {
        if let Ok(out) = Command::new("where.exe").arg("git").output() {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout);
                if let Some(first_line) = s.lines().next() {
                    let p = PathBuf::from(first_line.trim());
                    if p.exists() {
                        let mut ver = None;
                        if let Ok(v_out) = Command::new(&p).arg("--version").output() {
                            let text = String::from_utf8_lossy(&v_out.stdout);
                            ver = Some(text.trim().to_string());
                        }
                        return ToolStatus {
                            detected: true,
                            name: "Git".to_string(),
                            path: Some(p.to_string_lossy().to_string()),
                            version: ver,
                            details: Some("Version control ready".to_string()),
                        };
                    }
                }
            }
        }

        ToolStatus {
            detected: false,
            name: "Git".to_string(),
            path: None,
            version: None,
            details: Some("git.exe not detected in PATH. Install Git for Windows.".to_string()),
        }
    }

    pub fn detect_emulator(sdk_path: Option<&str>) -> ToolStatus {
        if let Some(sdk) = sdk_path {
            let p = Path::new(sdk).join("emulator").join("emulator.exe");
            if p.exists() {
                return ToolStatus {
                    detected: true,
                    name: "Android Emulator".to_string(),
                    path: Some(p.to_string_lossy().to_string()),
                    version: Some("Installed".to_string()),
                    details: Some("Emulator binary found in SDK/emulator".to_string()),
                };
            }
        }

        ToolStatus {
            detected: false,
            name: "Android Emulator".to_string(),
            path: None,
            version: None,
            details: Some("Emulator not installed in SDK directory. (AstraIDE prioritizes physical USB devices for lightweight development)".to_string()),
        }
    }
}
