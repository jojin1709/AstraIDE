use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub name: String,
    pub path: String,
    pub last_opened: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstraIdeConfig {
    pub recent_projects: Vec<RecentProject>,
    pub theme: String, // "dark" or "light"
    pub custom_sdk_path: Option<String>,
    pub custom_jdk_path: Option<String>,
    pub preferred_device_serial: Option<String>,
    pub editor_font_size: u32,
    pub editor_tab_size: u32,
    pub editor_word_wrap: bool,
    pub terminal_shell: String, // "powershell" or "cmd"
    pub telemetry_enabled: bool,
    pub auto_save: bool,
}

impl Default for AstraIdeConfig {
    fn default() -> Self {
        Self {
            recent_projects: Vec::new(),
            theme: "dark".to_string(),
            custom_sdk_path: None,
            custom_jdk_path: None,
            preferred_device_serial: None,
            editor_font_size: 14,
            editor_tab_size: 4,
            editor_word_wrap: false,
            terminal_shell: "powershell".to_string(),
            telemetry_enabled: false, // Strictly disabled by default
            auto_save: true,
        }
    }
}

pub struct ConfigStore;

impl ConfigStore {
    fn config_path() -> PathBuf {
        if let Ok(app_data) = env::var("APPDATA") {
            let dir = PathBuf::from(app_data).join("AstraIDE");
            let _ = fs::create_dir_all(&dir);
            return dir.join("config.json");
        }
        PathBuf::from("astraide_config.json")
    }

    pub fn load_config() -> AstraIdeConfig {
        let p = Self::config_path();
        if p.exists() {
            if let Ok(content) = fs::read_to_string(&p) {
                if let Ok(cfg) = serde_json::from_str::<AstraIdeConfig>(&content) {
                    return cfg;
                }
            }
        }
        AstraIdeConfig::default()
    }

    pub fn save_config(cfg: &AstraIdeConfig) -> Result<(), String> {
        let p = Self::config_path();
        let content = serde_json::to_string_pretty(cfg)
            .map_err(|e| format!("Serialization error: {}", e))?;
        fs::write(p, content).map_err(|e| format!("Failed to save config: {}", e))
    }

    pub fn add_recent_project(name: &str, path: &str) {
        let mut cfg = Self::load_config();
        // Remove duplicate if exists
        cfg.recent_projects.retain(|p| p.path != path);

        let now = chrono::Local::now().format("%Y-%m-%d %H:%M").to_string();
        cfg.recent_projects.insert(
            0,
            RecentProject {
                name: name.to_string(),
                path: path.to_string(),
                last_opened: now,
            },
        );
        if cfg.recent_projects.len() > 10 {
            cfg.recent_projects.truncate(10);
        }
        let _ = Self::save_config(&cfg);
    }
}
