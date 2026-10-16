use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageCategory {
    pub name: String,
    pub path: String,
    pub exists: bool,
    pub size_mb: f64,
    pub size_gb: f64,
    pub description: String,
    pub safe_to_clean: bool,
    pub clean_impact: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageAnalysisReport {
    pub total_dev_storage_gb: f64,
    pub categories: Vec<StorageCategory>,
}

pub struct StorageAnalyzer;

impl StorageAnalyzer {
    fn calculate_dir_size_mb(path: &Path) -> f64 {
        if !path.exists() {
            return 0.0;
        }
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

    pub fn analyze(custom_sdk: Option<&str>, current_project: Option<&str>) -> StorageAnalysisReport {
        let mut categories = Vec::new();

        // 1. Android SDK
        let sdk_path = custom_sdk
            .map(PathBuf::from)
            .or_else(|| env::var("ANDROID_HOME").ok().map(PathBuf::from))
            .or_else(|| {
                env::var("LOCALAPPDATA")
                    .ok()
                    .map(|d| PathBuf::from(d).join("Android").join("Sdk"))
            });

        if let Some(sdk) = sdk_path {
            let size_mb = Self::calculate_dir_size_mb(&sdk);
            categories.push(StorageCategory {
                name: "Android SDK (Platforms, Tools, Images)".to_string(),
                path: sdk.to_string_lossy().to_string(),
                exists: sdk.exists(),
                size_mb,
                size_gb: (size_mb / 1024.0 * 100.0).round() / 100.0,
                description: "Contains platforms, build-tools, system-images and emulator files.".to_string(),
                safe_to_clean: false,
                clean_impact: "Requires manual removal of unused platform versions via SDK Manager.".to_string(),
            });
        }

        // 2. Gradle Cache
        if let Ok(user_home) = env::var("USERPROFILE") {
            let gradle_caches = PathBuf::from(&user_home).join(".gradle").join("caches");
            let size_mb = Self::calculate_dir_size_mb(&gradle_caches);
            categories.push(StorageCategory {
                name: "Gradle Cache & Dependencies".to_string(),
                path: gradle_caches.to_string_lossy().to_string(),
                exists: gradle_caches.exists(),
                size_mb,
                size_gb: (size_mb / 1024.0 * 100.0).round() / 100.0,
                description: "Downloaded Maven/Google dependencies, plugin jars, and compilation caches.".to_string(),
                safe_to_clean: true,
                clean_impact: "Clearing will reclaim disk space; next build will re-download needed libraries.".to_string(),
            });

            // 3. Android Virtual Devices (Emulators)
            let avd_dir = PathBuf::from(&user_home).join(".android").join("avd");
            let avd_mb = Self::calculate_dir_size_mb(&avd_dir);
            categories.push(StorageCategory {
                name: "Android Emulator AVD Snapshots".to_string(),
                path: avd_dir.to_string_lossy().to_string(),
                exists: avd_dir.exists(),
                size_mb: avd_mb,
                size_gb: (avd_mb / 1024.0 * 100.0).round() / 100.0,
                description: "Disk images and user data for Android Virtual Devices (AVD).".to_string(),
                safe_to_clean: false,
                clean_impact: "Deletes emulator user state and apps installed on virtual devices.".to_string(),
            });
        }

        // 4. Current Project build directory
        if let Some(proj) = current_project {
            let p = Path::new(proj);
            let app_build = p.join("app").join("build");
            if app_build.exists() {
                let size_mb = Self::calculate_dir_size_mb(&app_build);
                categories.push(StorageCategory {
                    name: "Active Project Build Outputs (app/build)".to_string(),
                    path: app_build.to_string_lossy().to_string(),
                    exists: true,
                    size_mb,
                    size_gb: (size_mb / 1024.0 * 100.0).round() / 100.0,
                    description: "Intermediate DEX, class files, and generated APKs for the active project.".to_string(),
                    safe_to_clean: true,
                    clean_impact: "Completely safe to clean; running 'Clean' rebuilds cleanly.".to_string(),
                });
            }
        }

        let total_mb: f64 = categories.iter().map(|c| c.size_mb).sum();
        let total_dev_storage_gb = (total_mb / 1024.0 * 100.0).round() / 100.0;

        StorageAnalysisReport {
            total_dev_storage_gb,
            categories,
        }
    }

    pub fn clean_project_build(project_path: &str) -> Result<String, String> {
        let p = Path::new(project_path).join("app").join("build");
        if p.exists() {
            fs::remove_dir_all(&p).map_err(|e| format!("Failed to remove build dir: {}", e))?;
            Ok("Project app/build outputs cleaned successfully.".to_string())
        } else {
            Ok("No app/build directory found to clean.".to_string())
        }
    }
}
