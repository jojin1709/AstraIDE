use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SdkComponent {
    pub name: String,
    pub category: String,
    pub path: String,
    pub version: String,
    pub size_mb: f64,
    pub is_installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SdkPackagesReport {
    pub sdk_root: String,
    pub total_size_mb: f64,
    pub installed_platforms: Vec<SdkComponent>,
    pub installed_build_tools: Vec<SdkComponent>,
    pub platform_tools: Option<SdkComponent>,
    pub cmdline_tools: Vec<SdkComponent>,
    pub emulator: Option<SdkComponent>,
    pub system_images: Vec<SdkComponent>,
    pub ndk: Vec<SdkComponent>,
}

pub struct SdkManager;

impl SdkManager {
    fn dir_size_mb(path: &Path) -> f64 {
        let mut total_bytes: u64 = 0;
        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Ok(meta) = entry.metadata() {
                    total_bytes += meta.len();
                }
            }
        }
        let mb = total_bytes as f64 / (1024.0 * 1024.0);
        (mb * 10.0).round() / 10.0
    }

    pub fn inspect_sdk(sdk_root_path: &str) -> Result<SdkPackagesReport, String> {
        let root = Path::new(sdk_root_path);
        if !root.exists() {
            return Err(format!("Android SDK directory does not exist: {}", sdk_root_path));
        }

        let mut installed_platforms = Vec::new();
        let platforms_dir = root.join("platforms");
        if platforms_dir.exists() {
            if let Ok(entries) = fs::read_dir(&platforms_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let size = Self::dir_size_mb(&p);
                        let api_level = name.replace("android-", "");
                        installed_platforms.push(SdkComponent {
                            name: format!("Android API {}", api_level),
                            category: "Platform".to_string(),
                            path: p.to_string_lossy().to_string(),
                            version: name,
                            size_mb: size,
                            is_installed: true,
                        });
                    }
                }
            }
        }
        installed_platforms.sort_by(|a, b| b.version.cmp(&a.version));

        let mut installed_build_tools = Vec::new();
        let bt_dir = root.join("build-tools");
        if bt_dir.exists() {
            if let Ok(entries) = fs::read_dir(&bt_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let size = Self::dir_size_mb(&p);
                        installed_build_tools.push(SdkComponent {
                            name: format!("Build-Tools {}", name),
                            category: "Build Tools".to_string(),
                            path: p.to_string_lossy().to_string(),
                            version: name,
                            size_mb: size,
                            is_installed: true,
                        });
                    }
                }
            }
        }
        installed_build_tools.sort_by(|a, b| b.version.cmp(&a.version));

        let mut platform_tools = None;
        let pt_dir = root.join("platform-tools");
        if pt_dir.exists() {
            let size = Self::dir_size_mb(&pt_dir);
            platform_tools = Some(SdkComponent {
                name: "Android SDK Platform-Tools (adb, fastboot)".to_string(),
                category: "Platform Tools".to_string(),
                path: pt_dir.to_string_lossy().to_string(),
                version: "Latest".to_string(),
                size_mb: size,
                is_installed: true,
            });
        }

        let mut cmdline_tools = Vec::new();
        let cmd_dir = root.join("cmdline-tools");
        if cmd_dir.exists() {
            if let Ok(entries) = fs::read_dir(&cmd_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let size = Self::dir_size_mb(&p);
                        cmdline_tools.push(SdkComponent {
                            name: format!("Command-Line Tools ({})", name),
                            category: "Cmdline Tools".to_string(),
                            path: p.to_string_lossy().to_string(),
                            version: name,
                            size_mb: size,
                            is_installed: true,
                        });
                    }
                }
            }
        }

        let mut emulator = None;
        let emu_dir = root.join("emulator");
        if emu_dir.exists() {
            let size = Self::dir_size_mb(&emu_dir);
            emulator = Some(SdkComponent {
                name: "Android Emulator Engine".to_string(),
                category: "Emulator".to_string(),
                path: emu_dir.to_string_lossy().to_string(),
                version: "Standalone".to_string(),
                size_mb: size,
                is_installed: true,
            });
        }

        let mut system_images = Vec::new();
        let sys_dir = root.join("system-images");
        if sys_dir.exists() {
            if let Ok(entries) = fs::read_dir(&sys_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let size = Self::dir_size_mb(&p);
                        system_images.push(SdkComponent {
                            name: format!("System Image ({})", name),
                            category: "System Image".to_string(),
                            path: p.to_string_lossy().to_string(),
                            version: name,
                            size_mb: size,
                            is_installed: true,
                        });
                    }
                }
            }
        }

        let mut ndk = Vec::new();
        let ndk_dir = root.join("ndk");
        if ndk_dir.exists() {
            if let Ok(entries) = fs::read_dir(&ndk_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let size = Self::dir_size_mb(&p);
                        ndk.push(SdkComponent {
                            name: format!("NDK {}", name),
                            category: "NDK".to_string(),
                            path: p.to_string_lossy().to_string(),
                            version: name,
                            size_mb: size,
                            is_installed: true,
                        });
                    }
                }
            }
        }

        let total_size_mb = installed_platforms.iter().map(|c| c.size_mb).sum::<f64>()
            + installed_build_tools.iter().map(|c| c.size_mb).sum::<f64>()
            + platform_tools.as_ref().map(|c| c.size_mb).unwrap_or(0.0)
            + cmdline_tools.iter().map(|c| c.size_mb).sum::<f64>()
            + emulator.as_ref().map(|c| c.size_mb).unwrap_or(0.0)
            + system_images.iter().map(|c| c.size_mb).sum::<f64>()
            + ndk.iter().map(|c| c.size_mb).sum::<f64>();

        Ok(SdkPackagesReport {
            sdk_root: sdk_root_path.to_string(),
            total_size_mb: (total_size_mb * 10.0).round() / 10.0,
            installed_platforms,
            installed_build_tools,
            platform_tools,
            cmdline_tools,
            emulator,
            system_images,
            ndk,
        })
    }
}
