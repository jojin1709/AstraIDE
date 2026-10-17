pub mod commands;
pub mod core;

use commands::AppState;
use core::logcat_streamer::LogcatStreamer;
use core::terminal_session::TerminalManager;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let logcat = Arc::new(LogcatStreamer::new());
    let terminal = Arc::new(TerminalManager::new());

    tauri::Builder::default()
        .manage(AppState { logcat, terminal })
        .invoke_handler(tauri::generate_handler![
            commands::get_environment_report,
            commands::get_resource_metrics,
            commands::inspect_sdk,
            commands::list_devices,
            commands::install_apk,
            commands::uninstall_app,
            commands::launch_app,
            commands::restart_adb,
            commands::take_device_screenshot,
            commands::execute_gradle_build,
            commands::start_logcat,
            commands::stop_logcat,
            commands::clear_logcat,
            commands::create_project,
            commands::get_project_tree,
            commands::read_file,
            commands::write_file,
            commands::create_file,
            commands::create_directory,
            commands::rename_path,
            commands::delete_path,
            commands::reveal_in_explorer,
            commands::analyze_apk,
            commands::analyze_storage,
            commands::clean_project_build,
            commands::run_terminal_command,
            commands::git_status,
            commands::git_stage,
            commands::git_unstage,
            commands::git_commit,
            commands::git_diff,
            commands::load_config,
            commands::save_config,
            commands::install_toolchain_component,
            commands::install_all_missing_components,
            commands::add_path_to_environment,
            commands::detect_gpus,
            commands::check_for_updates,
            commands::download_and_install_update,
            commands::pick_project_folder,
            commands::pick_apk_file,
            commands::list_avds,
            commands::launch_avd,
            commands::list_system_images,
            commands::create_custom_avd,
            commands::device_touch_tap,
            commands::device_touch_swipe,
            commands::device_send_key,
            commands::device_send_text,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AstraIDE application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_logcat_line_parsing() {
        let sample = "10-16 22:30:15.123  1234  5678 I ActivityTaskManager: Displayed com.example.app/.MainActivity";
        let entry = core::logcat_streamer::LogcatStreamer::parse_logcat_line(sample);
        assert_eq!(entry.pid, "1234");
        assert_eq!(entry.tid, "5678");
        assert_eq!(entry.level, "INFO");
        assert_eq!(entry.tag, "ActivityTaskManager");
        assert!(entry.message.contains("Displayed com.example.app"));
    }

    #[test]
    fn test_env_detector_system_info() {
        let sys_info = core::env_detector::EnvDetector::detect_system_info();
        assert!(!sys_info.os_name.is_empty());
        assert!(sys_info.cpu_cores > 0);
        assert!(sys_info.total_memory_mb > 0);
    }

    #[test]
    fn test_resource_monitor() {
        let metrics = core::resource_monitor::ResourceMonitor::get_metrics();
        assert!(metrics.total_memory_mb > 0);
        assert!(metrics.memory_usage_pct >= 0.0);
    }

    #[test]
    fn test_project_generation_and_tree() {
        let temp_dir = std::env::temp_dir().join(format!("astra_test_proj_{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp_dir);
        let _ = fs::create_dir_all(&temp_dir);

        let req = core::project_generator::CreateProjectRequest {
            name: "TestAstraApp".to_string(),
            package_name: "com.test.astra".to_string(),
            location: temp_dir.to_string_lossy().to_string(),
            min_sdk: 24,
            target_sdk: 34,
            language: "kotlin".to_string(),
            template: "empty".to_string(),
            custom_sdk_path: None,
        };

        let res = core::project_generator::ProjectGenerator::create_project(&req);
        assert!(res.is_ok(), "Project creation failed: {:?}", res.err());

        let proj_path = std::path::PathBuf::from(res.unwrap().project_path);
        assert!(proj_path.join("settings.gradle").exists());
        assert!(proj_path.join("build.gradle").exists());
        assert!(proj_path.join("gradlew.bat").exists());
        assert!(proj_path.join("app").join("build.gradle").exists());
        assert!(proj_path.join("app").join("src").join("main").join("AndroidManifest.xml").exists());
        assert!(proj_path.join("app").join("src").join("main").join("java").join("com").join("test").join("astra").join("MainActivity.kt").exists());
        assert!(proj_path.join("app").join("src").join("main").join("res").join("layout").join("activity_main.xml").exists());

        // Verify ProjectTree reader
        let tree = core::project_tree::ProjectTree::read_tree(&proj_path.to_string_lossy());
        assert!(tree.is_ok());
        let root = tree.unwrap();
        assert_eq!(root.name, "TestAstraApp");
        assert!(root.is_dir);
        assert!(root.children.is_some());

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_config_store() {
        let mut cfg = core::config_store::ConfigStore::load_config();
        cfg.editor_font_size = 16;
        let save_res = core::config_store::ConfigStore::save_config(&cfg);
        assert!(save_res.is_ok());
        let reloaded = core::config_store::ConfigStore::load_config();
        assert_eq!(reloaded.editor_font_size, 16);
    }
}
