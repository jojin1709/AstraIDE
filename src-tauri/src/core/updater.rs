use crate::core::process_utils::hidden_command;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub current_version: String,
    pub latest_version: String,
    pub update_available: bool,
    pub release_name: String,
    pub release_notes: String,
    pub published_at: String,
    pub html_url: String,
    pub download_url: Option<String>,
    pub asset_name: Option<String>,
    pub asset_size_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgressEvent {
    pub percent: u32,
    pub status: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
}

pub struct UpdateCenter;

impl UpdateCenter {
    pub fn check_for_updates() -> Result<UpdateInfo, String> {
        let current_version = env!("CARGO_PKG_VERSION").to_string();

        // Query GitHub API for the latest release
        let out = hidden_command("curl.exe")
            .args([
                "-s",
                "-H",
                "User-Agent: AstraIDE-Desktop",
                "https://api.github.com/repos/jojin1709/AstraIDE/releases/latest",
            ])
            .output()
            .map_err(|e| format!("Failed to check updates via curl: {}", e))?;

        if !out.status.success() {
            return Err("Failed to query GitHub Releases API".to_string());
        }

        let body_str = String::from_utf8_lossy(&out.stdout);
        let json: serde_json::Value = serde_json::from_str(&body_str)
            .map_err(|e| format!("Failed to parse release response: {}", e))?;

        if let Some(msg) = json.get("message").and_then(|m| m.as_str()) {
            if msg.contains("API rate limit") || msg.contains("Not Found") {
                return Err(format!("GitHub API notice: {}", msg));
            }
        }

        let raw_tag = json
            .get("tag_name")
            .and_then(|t| t.as_str())
            .unwrap_or("0.0.0");
        let latest_version = raw_tag.trim_start_matches('v').to_string();
        let release_name = json
            .get("name")
            .and_then(|n| n.as_str())
            .unwrap_or("Latest Release")
            .to_string();
        let release_notes = json
            .get("body")
            .and_then(|b| b.as_str())
            .unwrap_or("")
            .to_string();
        let published_at = json
            .get("published_at")
            .and_then(|p| p.as_str())
            .unwrap_or("")
            .to_string();
        let html_url = json
            .get("html_url")
            .and_then(|u| u.as_str())
            .unwrap_or("https://github.com/jojin1709/AstraIDE/releases")
            .to_string();

        let mut download_url = None;
        let mut asset_name = None;
        let mut asset_size_bytes = None;

        if let Some(assets) = json.get("assets").and_then(|a| a.as_array()) {
            // Prefer setup installer (.exe with -setup or setup), fallback to any .exe
            let setup_asset = assets.iter().find(|a| {
                a.get("name")
                    .and_then(|n| n.as_str())
                    .map(|n| n.ends_with(".exe") && (n.contains("setup") || n.contains("Setup")))
                    .unwrap_or(false)
            });

            let chosen_asset = setup_asset.or_else(|| {
                assets.iter().find(|a| {
                    a.get("name")
                        .and_then(|n| n.as_str())
                        .map(|n| n.ends_with(".exe"))
                        .unwrap_or(false)
                })
            });

            if let Some(asset) = chosen_asset {
                asset_name = asset.get("name").and_then(|n| n.as_str()).map(String::from);
                download_url = asset
                    .get("browser_download_url")
                    .and_then(|u| u.as_str())
                    .map(String::from);
                asset_size_bytes = asset.get("size").and_then(|s| s.as_u64());
            }
        }

        let update_available = Self::is_newer_version(&latest_version, &current_version);

        Ok(UpdateInfo {
            current_version: format!("v{}", current_version),
            latest_version: format!("v{}", latest_version),
            update_available,
            release_name,
            release_notes,
            published_at,
            html_url,
            download_url,
            asset_name,
            asset_size_bytes,
        })
    }

    pub fn is_newer_version(latest: &str, current: &str) -> bool {
        let parse_parts = |s: &str| -> Vec<u32> {
            s.split('.')
                .filter_map(|p| {
                    p.chars()
                        .take_while(|c| c.is_ascii_digit())
                        .collect::<String>()
                        .parse()
                        .ok()
                })
                .collect()
        };

        let l_parts = parse_parts(latest);
        let c_parts = parse_parts(current);

        for (l, c) in l_parts.iter().zip(c_parts.iter()) {
            if l > c {
                return true;
            } else if l < c {
                return false;
            }
        }
        l_parts.len() > c_parts.len()
    }

    pub fn download_and_install_update(
        app: &AppHandle,
        download_url: &str,
        asset_name: &str,
    ) -> Result<String, String> {
        let base = env::var("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("C:\\AstraIDE"));
        let update_dir = base.join("AstraIDE").join("updates");
        let _ = fs::create_dir_all(&update_dir);

        let target_file = update_dir.join(asset_name);

        let _ = app.emit(
            "update-progress",
            UpdateProgressEvent {
                percent: 15,
                status: format!("Downloading {} from GitHub Releases...", asset_name),
                downloaded_bytes: 0,
                total_bytes: 0,
            },
        );

        // Download installer using curl natively
        let out = hidden_command("curl.exe")
            .args([
                "-L",
                "--fail",
                "-s",
                "-o",
                &target_file.to_string_lossy(),
                download_url,
            ])
            .output()
            .map_err(|e| format!("Download execution failed: {}", e))?;

        if !out.status.success() || !target_file.exists() {
            return Err("Failed to download update binary from GitHub".to_string());
        }

        let downloaded_bytes = target_file.metadata().map(|m| m.len()).unwrap_or(0);

        let _ = app.emit(
            "update-progress",
            UpdateProgressEvent {
                percent: 90,
                status: "Download completed! Launching installer...".to_string(),
                downloaded_bytes,
                total_bytes: downloaded_bytes,
            },
        );

        // Launch installer executable
        let run_res = std::process::Command::new(&target_file)
            .spawn()
            .map_err(|e| format!("Failed to launch installer {}: {}", target_file.display(), e))?;

        let _ = app.emit(
            "update-progress",
            UpdateProgressEvent {
                percent: 100,
                status: "Installer launched! Please complete the installation to update AstraIDE."
                    .to_string(),
                downloaded_bytes,
                total_bytes: downloaded_bytes,
            },
        );

        Ok(format!(
            "Installer launched successfully (Process PID: {})",
            run_res.id()
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_comparison() {
        assert!(UpdateCenter::is_newer_version("0.1.1", "0.1.0"));
        assert!(UpdateCenter::is_newer_version("0.2.0", "0.1.9"));
        assert!(UpdateCenter::is_newer_version("1.0.0", "0.9.9"));
        assert!(!UpdateCenter::is_newer_version("0.1.0", "0.1.0"));
        assert!(!UpdateCenter::is_newer_version("0.1.0", "0.1.1"));
    }
}
