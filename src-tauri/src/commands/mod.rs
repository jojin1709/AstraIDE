use crate::core::adb_client::{AdbClient, AdbCommandResult, AndroidDevice, AvdInfo};
use crate::core::apk_analyzer::{ApkAnalysisReport, ApkAnalyzer};
use crate::core::config_store::{AstraIdeConfig, ConfigStore};
use crate::core::env_detector::{AndroidEnvironmentReport, EnvDetector, GpuReport};
use crate::core::git_client::{GitClient, GitDiffResult, GitRepoStatus};
use crate::core::gradle_runner::{GradleBuildResult, GradleRunner};
use crate::core::logcat_streamer::LogcatStreamer;
use crate::core::project_generator::{CreateProjectRequest, CreateProjectResponse, ProjectGenerator};
use crate::core::project_tree::{FileNode, ProjectTree};
use crate::core::resource_monitor::{ResourceMonitor, SystemResourceReport};
use crate::core::sdk_manager::{SdkManager, SdkPackagesReport};
use crate::core::storage_analyzer::{StorageAnalysisReport, StorageAnalyzer};
use crate::core::terminal_session::{TerminalCommandResult, TerminalManager};
use crate::core::tool_installer::ToolInstaller;
use crate::core::updater::{UpdateCenter, UpdateInfo};
use std::sync::Arc;
use tauri::{AppHandle, State};

pub struct AppState {
    pub logcat: Arc<LogcatStreamer>,
    pub terminal: Arc<TerminalManager>,
}

#[tauri::command]
pub async fn get_environment_report() -> AndroidEnvironmentReport {
    tokio::task::spawn_blocking(EnvDetector::detect_all)
        .await
        .unwrap_or_else(|_| EnvDetector::empty_report())
}

#[tauri::command]
pub fn get_resource_metrics() -> SystemResourceReport {
    ResourceMonitor::get_metrics()
}

#[tauri::command]
pub fn inspect_sdk(sdk_path: String) -> Result<SdkPackagesReport, String> {
    SdkManager::inspect_sdk(&sdk_path)
}

#[tauri::command]
pub fn list_devices(custom_sdk: Option<String>) -> Result<Vec<AndroidDevice>, String> {
    AdbClient::list_devices(custom_sdk.as_deref())
}

#[tauri::command]
pub fn install_apk(
    custom_sdk: Option<String>,
    serial: String,
    apk_path: String,
) -> Result<AdbCommandResult, String> {
    AdbClient::install_apk(custom_sdk.as_deref(), &serial, &apk_path)
}

#[tauri::command]
pub fn uninstall_app(
    custom_sdk: Option<String>,
    serial: String,
    package_name: String,
) -> Result<AdbCommandResult, String> {
    AdbClient::uninstall_app(custom_sdk.as_deref(), &serial, &package_name)
}

#[tauri::command]
pub fn launch_app(
    custom_sdk: Option<String>,
    serial: String,
    component: String,
) -> Result<AdbCommandResult, String> {
    AdbClient::launch_app(custom_sdk.as_deref(), &serial, &component)
}

#[tauri::command]
pub fn restart_adb(custom_sdk: Option<String>) -> Result<AdbCommandResult, String> {
    AdbClient::restart_server(custom_sdk.as_deref())
}

#[tauri::command]
pub fn take_device_screenshot(
    custom_sdk: Option<String>,
    serial: String,
) -> Result<String, String> {
    AdbClient::take_screenshot_base64(custom_sdk.as_deref(), &serial)
}

#[tauri::command]
pub async fn execute_gradle_build(
    app: AppHandle,
    project_path: String,
    task_name: String,
    extra_args: Vec<String>,
    custom_sdk: Option<String>,
    custom_jdk: Option<String>,
) -> Result<GradleBuildResult, String> {
    GradleRunner::run_task(
        app,
        project_path,
        task_name,
        extra_args,
        custom_sdk,
        custom_jdk,
    )
    .await
}

#[tauri::command]
pub async fn start_logcat(
    state: State<'_, AppState>,
    app: AppHandle,
    serial: String,
    custom_sdk: Option<String>,
) -> Result<(), String> {
    state.logcat.start_session(app, custom_sdk, serial).await
}

#[tauri::command]
pub fn stop_logcat(state: State<'_, AppState>, serial: String) -> Result<(), String> {
    state.logcat.stop_session(&serial);
    Ok(())
}

#[tauri::command]
pub fn clear_logcat(
    state: State<'_, AppState>,
    serial: String,
    custom_sdk: Option<String>,
) -> Result<(), String> {
    state.logcat.clear_logcat(custom_sdk.as_deref(), &serial)
}

#[tauri::command]
pub fn create_project(req: CreateProjectRequest) -> Result<CreateProjectResponse, String> {
    let res = ProjectGenerator::create_project(&req)?;
    ConfigStore::add_recent_project(&req.name, &res.project_path);
    Ok(res)
}

#[tauri::command]
pub fn get_project_tree(root_path: String) -> Result<FileNode, String> {
    let node = ProjectTree::read_tree(&root_path)?;
    let p = std::path::Path::new(&root_path);
    let name = p
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| root_path.clone());
    ConfigStore::add_recent_project(&name, &root_path);
    Ok(node)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    ProjectTree::read_file(&path)
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    ProjectTree::write_file(&path, &content)
}

#[tauri::command]
pub fn create_file(path: String) -> Result<(), String> {
    ProjectTree::create_file(&path)
}

#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    ProjectTree::create_directory(&path)
}

#[tauri::command]
pub fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    ProjectTree::rename_path(&old_path, &new_path)
}

#[tauri::command]
pub fn delete_path(path: String) -> Result<(), String> {
    ProjectTree::delete_path(&path)
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) -> Result<(), String> {
    ProjectTree::reveal_in_explorer(&path)
}

#[tauri::command]
pub fn analyze_apk(apk_path: String, custom_sdk: Option<String>) -> Result<ApkAnalysisReport, String> {
    ApkAnalyzer::analyze(&apk_path, custom_sdk.as_deref())
}

#[tauri::command]
pub fn analyze_storage(
    custom_sdk: Option<String>,
    current_project: Option<String>,
) -> StorageAnalysisReport {
    StorageAnalyzer::analyze(custom_sdk.as_deref(), current_project.as_deref())
}

#[tauri::command]
pub fn clean_project_build(project_path: String) -> Result<String, String> {
    StorageAnalyzer::clean_project_build(&project_path)
}

#[tauri::command]
pub async fn run_terminal_command(
    state: State<'_, AppState>,
    app: AppHandle,
    session_id: String,
    cwd: String,
    command_str: String,
    shell_type: String,
) -> Result<TerminalCommandResult, String> {
    state
        .terminal
        .run_command(app, session_id, cwd, command_str, shell_type)
        .await
}

#[tauri::command]
pub fn git_status(project_path: String) -> Result<GitRepoStatus, String> {
    GitClient::get_status(&project_path)
}

#[tauri::command]
pub fn git_stage(project_path: String, file_path: String) -> Result<(), String> {
    GitClient::stage_file(&project_path, &file_path)
}

#[tauri::command]
pub fn git_unstage(project_path: String, file_path: String) -> Result<(), String> {
    GitClient::unstage_file(&project_path, &file_path)
}

#[tauri::command]
pub fn git_commit(project_path: String, message: String) -> Result<String, String> {
    GitClient::commit(&project_path, &message)
}

#[tauri::command]
pub fn git_diff(project_path: String, file_path: String) -> Result<GitDiffResult, String> {
    GitClient::get_diff(&project_path, &file_path)
}

#[tauri::command]
pub fn load_config() -> AstraIdeConfig {
    ConfigStore::load_config()
}

#[tauri::command]
pub fn save_config(config: AstraIdeConfig) -> Result<(), String> {
    ConfigStore::save_config(&config)
}

#[tauri::command]
pub async fn install_toolchain_component(
    app: AppHandle,
    component: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        match component.as_str() {
            "adb" | "platform_tools" => ToolInstaller::install_adb_platform_tools(&app),
            "java" => ToolInstaller::install_java_jdk(&app),
            "git" => ToolInstaller::install_git(&app),
            "cmdline_tools" => ToolInstaller::install_android_cmdline_tools(&app),
            other => Err(format!("Unknown toolchain component: {}", other)),
        }
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
}

#[tauri::command]
pub async fn install_all_missing_components(
    app: AppHandle,
    missing: Vec<String>,
) -> Result<Vec<String>, String> {
    tokio::task::spawn_blocking(move || ToolInstaller::install_all_missing(&app, missing))
        .await
        .map_err(|e| format!("Task execution error: {}", e))?
}

#[tauri::command]
pub async fn add_path_to_environment(path_to_add: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let p = std::path::Path::new(&path_to_add);
        ToolInstaller::append_to_user_path(p)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
}

#[tauri::command]
pub async fn detect_gpus() -> Vec<GpuReport> {
    tokio::task::spawn_blocking(EnvDetector::detect_gpus)
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn check_for_updates() -> Result<UpdateInfo, String> {
    tokio::task::spawn_blocking(UpdateCenter::check_for_updates)
        .await
        .map_err(|e| format!("Task execution error: {}", e))?
}

#[tauri::command]
pub async fn download_and_install_update(
    app: AppHandle,
    download_url: String,
    asset_name: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        UpdateCenter::download_and_install_update(&app, &download_url, &asset_name)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
}

#[tauri::command]
pub async fn pick_project_folder() -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(|| {
        let folder = rfd::FileDialog::new()
            .set_title("Select Android Project Root Folder")
            .pick_folder();
        Ok(folder.map(|p| p.to_string_lossy().to_string()))
    })
    .await
    .map_err(|e| format!("Dialog execution error: {}", e))?
}

#[tauri::command]
pub async fn pick_apk_file() -> Result<Option<String>, String> {
    tokio::task::spawn_blocking(|| {
        let file = rfd::FileDialog::new()
            .set_title("Select Android APK File")
            .add_filter("Android Package (*.apk)", &["apk"])
            .pick_file();
        Ok(file.map(|p| p.to_string_lossy().to_string()))
    })
    .await
    .map_err(|e| format!("Dialog execution error: {}", e))?
}

#[tauri::command]
pub async fn list_avds(custom_sdk: Option<String>) -> Vec<AvdInfo> {
    tokio::task::spawn_blocking(move || AdbClient::list_avds(custom_sdk.as_deref()))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn launch_avd(custom_sdk: Option<String>, avd_name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || AdbClient::launch_avd(custom_sdk.as_deref(), &avd_name))
        .await
        .map_err(|e| format!("Task execution error: {}", e))?
}


