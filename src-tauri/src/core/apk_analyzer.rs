use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::File;
use std::path::{Path, PathBuf};
use std::process::Command;
use zip::ZipArchive;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DexFileInfo {
    pub name: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeLibAbiInfo {
    pub abi: String,
    pub files: Vec<String>,
    pub total_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApkAnalysisReport {
    pub file_name: String,
    pub file_path: String,
    pub file_size_mb: f64,
    pub uncompressed_size_mb: f64,
    pub compression_ratio_pct: f64,
    
    // Manifest badging
    pub package_name: Option<String>,
    pub version_name: Option<String>,
    pub version_code: Option<String>,
    pub min_sdk: Option<String>,
    pub target_sdk: Option<String>,
    pub application_label: Option<String>,
    
    // Components
    pub permissions: Vec<String>,
    pub activities: Vec<String>,
    pub services: Vec<String>,
    pub receivers: Vec<String>,
    
    // Binary contents
    pub dex_files: Vec<DexFileInfo>,
    pub native_abis: Vec<NativeLibAbiInfo>,
    pub res_count: usize,
    pub res_size_mb: f64,
    pub assets_count: usize,
    pub assets_size_mb: f64,
    pub signature_schemes: Vec<String>,
}

pub struct ApkAnalyzer;

impl ApkAnalyzer {
    pub fn find_aapt_binary(custom_sdk: Option<&str>) -> Option<PathBuf> {
        let mut sdk_dirs = Vec::new();
        if let Some(sdk) = custom_sdk {
            sdk_dirs.push(PathBuf::from(sdk));
        }
        if let Ok(sdk_env) = std::env::var("ANDROID_HOME") {
            sdk_dirs.push(PathBuf::from(sdk_env));
        }
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            sdk_dirs.push(PathBuf::from(local_app_data).join("Android").join("Sdk"));
        }

        for sdk in sdk_dirs {
            let bt = sdk.join("build-tools");
            if bt.exists() {
                if let Ok(entries) = std::fs::read_dir(&bt) {
                    let mut versions: Vec<PathBuf> = entries
                        .filter_map(|e| e.ok())
                        .map(|e| e.path())
                        .filter(|p| p.is_dir())
                        .collect();
                    versions.sort();
                    versions.reverse();

                    for ver_dir in versions {
                        let aapt = ver_dir.join("aapt.exe");
                        if aapt.exists() {
                            return Some(aapt);
                        }
                    }
                }
            }
        }
        None
    }

    pub fn analyze(apk_path: &str, custom_sdk: Option<&str>) -> Result<ApkAnalysisReport, String> {
        let path = Path::new(apk_path);
        if !path.exists() {
            return Err(format!("APK file not found: {}", apk_path));
        }

        let file = File::open(path).map_err(|e| format!("Failed to open APK: {}", e))?;
        let file_size = file.metadata().map_err(|e| e.to_string())?.len();
        let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid APK/ZIP archive: {}", e))?;

        let mut uncompressed_bytes: u64 = 0;
        let mut dex_files = Vec::new();
        let mut native_map: std::collections::HashMap<String, (Vec<String>, u64)> = std::collections::HashMap::new();
        let mut res_count = 0;
        let mut res_bytes: u64 = 0;
        let mut assets_count = 0;
        let mut assets_bytes: u64 = 0;
        let mut sig_schemes = HashSet::new();

        for i in 0..zip.len() {
            if let Ok(entry) = zip.by_index(i) {
                let name = match entry.name() {
                    Ok(n) => n.to_string(),
                    Err(_) => continue,
                };
                let size = entry.size();
                uncompressed_bytes += size;

                if name.ends_with(".dex") {
                    dex_files.push(DexFileInfo {
                        name: name.clone(),
                        size_bytes: size,
                    });
                } else if name.starts_with("lib/") {
                    let parts: Vec<&str> = name.split('/').collect();
                    if parts.len() >= 2 {
                        let abi = parts[1].to_string();
                        let lib_name = parts.last().unwrap_or(&"lib.so").to_string();
                        let entry = native_map.entry(abi).or_insert_with(|| (Vec::new(), 0));
                        entry.0.push(lib_name);
                        entry.1 += size;
                    }
                } else if name.starts_with("res/") || name == "resources.arsc" {
                    res_count += 1;
                    res_bytes += size;
                } else if name.starts_with("assets/") {
                    assets_count += 1;
                    assets_bytes += size;
                } else if name.starts_with("META-INF/") {
                    if name.ends_with(".RSA") || name.ends_with(".DSA") || name.ends_with(".EC") {
                        sig_schemes.insert("v1 (JAR Signature)".to_string());
                    }
                }
            }
        }

        let mut native_abis: Vec<NativeLibAbiInfo> = native_map
            .into_iter()
            .map(|(abi, (files, total_size_bytes))| NativeLibAbiInfo {
                abi,
                files,
                total_size_bytes,
            })
            .collect();
        native_abis.sort_by(|a, b| a.abi.cmp(&b.abi));

        let mut package_name = None;
        let mut version_name = None;
        let mut version_code = None;
        let mut min_sdk = None;
        let mut target_sdk = None;
        let mut application_label = None;
        let mut permissions = Vec::new();
        let mut activities = Vec::new();
        let mut services = Vec::new();
        let mut receivers = Vec::new();

        // Check if aapt exists for deep badging
        if let Some(aapt_bin) = Self::find_aapt_binary(custom_sdk) {
            if let Ok(out) = Command::new(&aapt_bin).args(["dump", "badging", apk_path]).output() {
                if out.status.success() {
                    let text = String::from_utf8_lossy(&out.stdout);
                    let pkg_re = Regex::new(r"package:\s+name='([^']+)'\s+versionCode='([^']+)'\s+versionName='([^']+)'").unwrap();
                    let sdk_re = Regex::new(r"sdkVersion:'([^']+)'").unwrap();
                    let target_sdk_re = Regex::new(r"targetSdkVersion:'([^']+)'").unwrap();
                    let label_re = Regex::new(r"application-label(?:-en)?:'([^']+)'").unwrap();
                    let perm_re = Regex::new(r"uses-permission:\s+name='([^']+)'").unwrap();
                    let act_re = Regex::new(r"launchable-activity:\s+name='([^']+)'").unwrap();

                    if let Some(caps) = pkg_re.captures(&text) {
                        package_name = caps.get(1).map(|m| m.as_str().to_string());
                        version_code = caps.get(2).map(|m| m.as_str().to_string());
                        version_name = caps.get(3).map(|m| m.as_str().to_string());
                    }
                    if let Some(caps) = sdk_re.captures(&text) {
                        min_sdk = caps.get(1).map(|m| m.as_str().to_string());
                    }
                    if let Some(caps) = target_sdk_re.captures(&text) {
                        target_sdk = caps.get(1).map(|m| m.as_str().to_string());
                    }
                    if let Some(caps) = label_re.captures(&text) {
                        application_label = caps.get(1).map(|m| m.as_str().to_string());
                    }

                    for caps in perm_re.captures_iter(&text) {
                        if let Some(m) = caps.get(1) {
                            permissions.push(m.as_str().to_string());
                        }
                    }
                    for caps in act_re.captures_iter(&text) {
                        if let Some(m) = caps.get(1) {
                            activities.push(m.as_str().to_string());
                        }
                    }
                }
            }
        }

        let file_size_mb = (file_size as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0;
        let uncompressed_mb = (uncompressed_bytes as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0;
        let ratio = if uncompressed_bytes > 0 {
            ((1.0 - (file_size as f64 / uncompressed_bytes as f64)) * 1000.0).round() / 10.0
        } else {
            0.0
        };

        Ok(ApkAnalysisReport {
            file_name: path.file_name().unwrap_or_default().to_string_lossy().to_string(),
            file_path: apk_path.to_string(),
            file_size_mb,
            uncompressed_size_mb: uncompressed_mb,
            compression_ratio_pct: ratio,
            package_name,
            version_name,
            version_code,
            min_sdk,
            target_sdk,
            application_label,
            permissions,
            activities,
            services,
            receivers,
            dex_files,
            native_abis,
            res_count,
            res_size_mb: (res_bytes as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
            assets_count,
            assets_size_mb: (assets_bytes as f64 / (1024.0 * 1024.0) * 100.0).round() / 100.0,
            signature_schemes: sig_schemes.into_iter().collect(),
        })
    }
}
