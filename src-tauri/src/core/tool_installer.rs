use crate::core::process_utils::hidden_command;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use zip::ZipArchive;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgressEvent {
    pub component: String,
    pub stage: String,
    pub percent: u32,
    pub message: String,
    pub error: Option<String>,
}

pub struct ToolInstaller;

impl ToolInstaller {
    fn emit_progress(
        app: &AppHandle,
        component: &str,
        stage: &str,
        percent: u32,
        message: &str,
        error: Option<String>,
    ) {
        let _ = app.emit(
            "tool-install-progress",
            InstallProgressEvent {
                component: component.to_string(),
                stage: stage.to_string(),
                percent,
                message: message.to_string(),
                error,
            },
        );
    }

    fn get_astra_appdata() -> PathBuf {
        let base = env::var("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("C:\\AstraIDE"));
        let p = base.join("AstraIDE");
        let _ = fs::create_dir_all(&p);
        p
    }

    fn get_android_sdk_dir() -> PathBuf {
        if let Ok(h) = env::var("ANDROID_HOME") {
            let p = PathBuf::from(h);
            if p.exists() {
                return p;
            }
        }
        let base = env::var("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("C:\\Android\\Sdk"));
        let p = base.join("Android").join("Sdk");
        let _ = fs::create_dir_all(&p);
        p
    }

    pub fn append_to_user_path(new_path: &Path) -> Result<(), String> {
        let p_str = new_path.to_string_lossy().to_string();
        
        // Use PowerShell with hidden_command to safely update HKCU PATH and broadcast WM_SETTINGCHANGE
        let script = format!(
            "$target = '{p_str}'; \
             $current = [Environment]::GetEnvironmentVariable('Path', 'User'); \
             if (-not ($current -split ';' | Where-Object {{ $_.Trim() -eq $target }})) {{ \
                 $newVal = if ($current) {{ \"$current;$target\" }} else {{ $target }}; \
                 [Environment]::SetEnvironmentVariable('Path', $newVal, 'User'); \
             }}",
            p_str = p_str.replace('\'', "''")
        );

        let out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| format!("Failed to update PATH: {}", e))?;

        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).to_string());
        }

        // Also add to current process PATH so current IDE session recognizes it immediately
        if let Ok(cur) = env::var("PATH") {
            if !cur.contains(&p_str) {
                env::set_var("PATH", format!("{};{}", p_str, cur));
            }
        }

        Ok(())
    }

    pub fn set_user_env_var(key: &str, val: &str) -> Result<(), String> {
        let script = format!(
            "[Environment]::SetEnvironmentVariable('{k}', '{v}', 'User')",
            k = key.replace('\'', "''"),
            v = val.replace('\'', "''")
        );

        let out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| format!("Failed to set {}: {}", key, e))?;

        if !out.status.success() {
            return Err(String::from_utf8_lossy(&out.stderr).to_string());
        }

        env::set_var(key, val);
        Ok(())
    }

    fn download_file(url: &str, dest: &Path) -> Result<(), String> {
        if let Some(parent) = dest.parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Windows 10/11 includes curl.exe natively
        let out = hidden_command("curl.exe")
            .args(["-L", "--fail", "-s", "-o", &dest.to_string_lossy(), url])
            .output();

        if let Ok(res) = out {
            if res.status.success() && dest.exists() && dest.metadata().map(|m| m.len() > 1000).unwrap_or(false) {
                return Ok(());
            }
        }

        // Fallback to PowerShell Invoke-WebRequest if curl fails
        let script = format!(
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
             Invoke-WebRequest -Uri '{url}' -OutFile '{dest}' -UseBasicParsing",
            url = url.replace('\'', "''"),
            dest = dest.to_string_lossy().replace('\'', "''")
        );

        let ps_out = hidden_command("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .output()
            .map_err(|e| format!("Download error: {}", e))?;

        if !ps_out.status.success() || !dest.exists() {
            return Err(format!(
                "Failed to download from {}: {}",
                url,
                String::from_utf8_lossy(&ps_out.stderr)
            ));
        }

        Ok(())
    }

    fn extract_zip(zip_path: &Path, extract_to: &Path) -> Result<(), String> {
        let file = File::open(zip_path).map_err(|e| format!("Open zip failed: {}", e))?;
        let mut archive = ZipArchive::new(file).map_err(|e| format!("Parse zip failed: {}", e))?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| format!("Zip entry error: {}", e))?;
            let outpath = match file.enclosed_name() {
                Some(path) => extract_to.join(path),
                None => continue,
            };

            if file.is_dir() {
                fs::create_dir_all(&outpath).map_err(|e| format!("Dir create error: {}", e))?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        fs::create_dir_all(p).map_err(|e| format!("Dir create error: {}", e))?;
                    }
                }
                let mut outfile = File::create(&outpath).map_err(|e| format!("File create error: {}", e))?;
                io::copy(&mut file, &mut outfile).map_err(|e| format!("Copy error: {}", e))?;
            }
        }

        Ok(())
    }

    pub fn install_adb_platform_tools(app: &AppHandle) -> Result<String, String> {
        Self::emit_progress(app, "adb", "downloading", 15, "Downloading Android Platform-Tools (ADB & Fastboot)...", None);

        let dl_dir = Self::get_astra_appdata().join("downloads");
        let zip_dest = dl_dir.join("platform-tools.zip");
        let url = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip";

        Self::download_file(url, &zip_dest)?;

        Self::emit_progress(app, "adb", "extracting", 60, "Extracting Platform-Tools...", None);

        let sdk_root = Self::get_android_sdk_dir();
        // Extract directly into sdk_root (the zip root contains folder 'platform-tools')
        Self::extract_zip(&zip_dest, &sdk_root)?;

        let pt_dir = sdk_root.join("platform-tools");
        let adb_bin = pt_dir.join("adb.exe");

        if !adb_bin.exists() {
            return Err("platform-tools extracted but adb.exe was not found.".to_string());
        }

        Self::emit_progress(app, "adb", "configuring", 85, "Configuring ANDROID_HOME and PATH...", None);

        let _ = Self::set_user_env_var("ANDROID_HOME", &sdk_root.to_string_lossy());
        let _ = Self::append_to_user_path(&pt_dir);

        // Clean up download zip
        let _ = fs::remove_file(zip_dest);

        Self::emit_progress(app, "adb", "done", 100, "Android Platform-Tools (ADB) installed successfully!", None);

        Ok(pt_dir.to_string_lossy().to_string())
    }

    pub fn install_java_jdk(app: &AppHandle) -> Result<String, String> {
        Self::emit_progress(app, "java", "downloading", 15, "Downloading OpenJDK 17 LTS (Eclipse Temurin)...", None);

        let dl_dir = Self::get_astra_appdata().join("downloads");
        let zip_dest = dl_dir.join("openjdk17.zip");
        let url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip";

        Self::download_file(url, &zip_dest)?;

        Self::emit_progress(app, "java", "extracting", 65, "Extracting JDK 17 to AstraIDE toolchain...", None);

        let target_dir = Self::get_astra_appdata().join("jdk-17");
        let _ = fs::create_dir_all(&target_dir);
        Self::extract_zip(&zip_dest, &target_dir)?;

        // Find the inner extracted folder (e.g., jdk-17.0.10+7)
        let mut jdk_home = target_dir.clone();
        if let Ok(entries) = fs::read_dir(&target_dir) {
            for e in entries.flatten() {
                if e.path().is_dir() && e.path().join("bin").join("java.exe").exists() {
                    jdk_home = e.path();
                    break;
                }
            }
        }

        let java_bin = jdk_home.join("bin").join("java.exe");
        if !java_bin.exists() {
            return Err("JDK extracted but java.exe was not found.".to_string());
        }

        Self::emit_progress(app, "java", "configuring", 85, "Configuring JAVA_HOME and PATH...", None);

        let _ = Self::set_user_env_var("JAVA_HOME", &jdk_home.to_string_lossy());
        let _ = Self::append_to_user_path(&jdk_home.join("bin"));

        let _ = fs::remove_file(zip_dest);

        Self::emit_progress(app, "java", "done", 100, "Java JDK 17 configured and added to environment!", None);

        Ok(jdk_home.to_string_lossy().to_string())
    }

    pub fn install_git(app: &AppHandle) -> Result<String, String> {
        Self::emit_progress(app, "git", "downloading", 20, "Downloading Git for Windows (Portable MinGit)...", None);

        let dl_dir = Self::get_astra_appdata().join("downloads");
        let zip_dest = dl_dir.join("mingit.zip");
        let url = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip";

        Self::download_file(url, &zip_dest)?;

        Self::emit_progress(app, "git", "extracting", 65, "Extracting Git components...", None);

        let target_dir = Self::get_astra_appdata().join("git");
        let _ = fs::create_dir_all(&target_dir);
        Self::extract_zip(&zip_dest, &target_dir)?;

        let git_cmd_dir = target_dir.join("cmd");
        let git_bin = git_cmd_dir.join("git.exe");

        if !git_bin.exists() {
            return Err("MinGit extracted but git.exe was not found.".to_string());
        }

        Self::emit_progress(app, "git", "configuring", 85, "Adding Git to Windows PATH...", None);

        let _ = Self::append_to_user_path(&git_cmd_dir);
        let _ = fs::remove_file(zip_dest);

        Self::emit_progress(app, "git", "done", 100, "Git installed and ready for version control!", None);

        Ok(git_bin.to_string_lossy().to_string())
    }

    pub fn install_android_cmdline_tools(app: &AppHandle) -> Result<String, String> {
        Self::emit_progress(app, "cmdline_tools", "downloading", 20, "Downloading Android SDK Command-line Tools...", None);

        let dl_dir = Self::get_astra_appdata().join("downloads");
        let zip_dest = dl_dir.join("cmdline-tools.zip");
        let url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip";

        Self::download_file(url, &zip_dest)?;

        Self::emit_progress(app, "cmdline_tools", "extracting", 65, "Extracting Command-line Tools...", None);

        let sdk_root = Self::get_android_sdk_dir();
        let cmdline_target = sdk_root.join("cmdline-tools").join("latest");
        let _ = fs::create_dir_all(&cmdline_target);

        // Google's zip unpacks into 'cmdline-tools', so extract to temp and move contents
        let temp_extract = dl_dir.join("temp_cmdline");
        let _ = fs::create_dir_all(&temp_extract);
        Self::extract_zip(&zip_dest, &temp_extract)?;

        let inner_tools = temp_extract.join("cmdline-tools");
        if inner_tools.exists() {
            for entry in fs::read_dir(&inner_tools).map_err(|e| e.to_string())?.flatten() {
                let dest_file = cmdline_target.join(entry.file_name());
                let _ = fs::rename(entry.path(), dest_file);
            }
        }
        let _ = fs::remove_dir_all(temp_extract);
        let _ = fs::remove_file(zip_dest);

        Self::emit_progress(app, "cmdline_tools", "configuring", 90, "Configuring SDK Manager tools...", None);

        let _ = Self::append_to_user_path(&cmdline_target.join("bin"));

        Self::emit_progress(app, "cmdline_tools", "done", 100, "Android Command-line Tools installed successfully!", None);

        Ok(cmdline_target.to_string_lossy().to_string())
    }

    pub fn install_all_missing(app: &AppHandle, missing: Vec<String>) -> Result<Vec<String>, String> {
        let mut results = Vec::new();

        for comp in missing {
            match comp.as_str() {
                "java" => {
                    let res = Self::install_java_jdk(app)?;
                    results.push(format!("Java JDK installed: {}", res));
                }
                "adb" | "android_sdk" | "platform_tools" => {
                    let res = Self::install_adb_platform_tools(app)?;
                    results.push(format!("Platform Tools installed: {}", res));
                }
                "git" => {
                    let res = Self::install_git(app)?;
                    results.push(format!("Git installed: {}", res));
                }
                "cmdline_tools" => {
                    let res = Self::install_android_cmdline_tools(app)?;
                    results.push(format!("Command-line Tools installed: {}", res));
                }
                _ => {}
            }
        }

        Ok(results)
    }
}
