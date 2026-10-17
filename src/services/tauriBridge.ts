import {
  AndroidDevice,
  AndroidEnvironmentReport,
  AdbCommandResult,
  GradleBuildResult,
  FileNode,
  CreateProjectRequest,
  CreateProjectResponse,
  ApkAnalysisReport,
  StorageAnalysisReport,
  SdkPackagesReport,
  SystemResourceReport,
  TerminalCommandResult,
  GitRepoStatus,
  GitDiffResult,
  AstraIdeConfig,
} from "../types";

let tauriCore: any = null;
let tauriEvent: any = null;

async function initTauri() {
  if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
    try {
      tauriCore = await import("@tauri-apps/api/core");
      tauriEvent = await import("@tauri-apps/api/event");
    } catch (e) {
      console.warn("Tauri modules dynamic load error:", e);
    }
  }
}
initTauri();

export const isTauriEnvironment = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
};

export async function invokeCommand<T>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  if (isTauriEnvironment()) {
    if (!tauriCore) {
      tauriCore = await import("@tauri-apps/api/core");
    }
    return tauriCore.invoke(cmd, args);
  }

  // Fallback for browser-mode demo / testing
  console.log(`[Mock Invoke] ${cmd}`, args);
  return mockHandler(cmd, args) as T;
}

export async function listenEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<() => void> {
  if (isTauriEnvironment()) {
    if (!tauriEvent) {
      tauriEvent = await import("@tauri-apps/api/event");
    }
    const unlisten = await tauriEvent.listen(event, (e: any) => handler(e.payload));
    return unlisten;
  }
  return () => {};
}

// Comprehensive browser fallback for UI testing and mock verification
function mockHandler(cmd: string, args: Record<string, any>): any {
  switch (cmd) {
    case "get_environment_report":
      return {
        system_info: {
          os_name: "Windows 11 Pro",
          os_version: "10.0.26300",
          cpu_brand: "12th Gen Intel Core i5-12500H",
          cpu_cores: 16,
          total_memory_mb: 16000,
          free_memory_mb: 4200,
          disks: [{ mount_point: "C:", total_space_gb: 512, free_space_gb: 85 }],
          gpus: [
            {
              name: "NVIDIA GeForce RTX 3050 Laptop GPU",
              vram_mb: 4096,
              driver_version: "32.0.15.9186",
              is_discrete: true,
              acceleration: "Hardware Host Acceleration (DirectX 12 / Vulkan / Dedicated GPU)",
            },
            {
              name: "Intel(R) Iris(R) Xe Graphics",
              vram_mb: 2048,
              driver_version: "32.0.101.6790",
              is_discrete: false,
              acceleration: "Hardware Host Acceleration (DirectX 12 / Vulkan / Integrated GPU)",
            },
          ],
          primary_gpu: {
            name: "NVIDIA GeForce RTX 3050 Laptop GPU",
            vram_mb: 4096,
            driver_version: "32.0.15.9186",
            is_discrete: true,
            acceleration: "Hardware Host Acceleration (DirectX 12 / Vulkan / Dedicated GPU)",
          },
        },
        java: {
          detected: true,
          name: "Java JDK",
          path: "C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\java.exe",
          version: "OpenJDK 17.0.17",
          details: "Adoptium Temurin JDK",
        },
        android_sdk: {
          detected: true,
          name: "Android SDK",
          path: "C:\\Android\\Sdk",
          version: "4 components verified",
          details: "Platform Tools, Build Tools, Platforms",
        },
        adb: {
          detected: true,
          name: "ADB",
          path: "C:\\Android\\Sdk\\platform-tools\\adb.exe",
          version: "Android Debug Bridge 1.0.41",
          details: "Ready for USB devices",
        },
        build_tools: {
          detected: true,
          name: "Android Build Tools",
          path: "C:\\Android\\Sdk\\build-tools\\35.0.0",
          version: "35.0.0",
          details: "34.0.0, 35.0.0",
        },
        gradle: {
          detected: true,
          name: "Gradle (Wrapper)",
          path: "gradlew.bat",
          version: "Gradle 8.7",
          details: "Project-level Gradle wrapper supported",
        },
        git: {
          detected: true,
          name: "Git",
          path: "C:\\Program Files\\Git\\cmd\\git.exe",
          version: "git version 2.51.0",
          details: "Version control ready",
        },
        emulator: {
          detected: false,
          name: "Android Emulator",
          details: "Physical USB device recommended for low-RAM performance",
        },
      } as AndroidEnvironmentReport;

    case "get_resource_metrics":
      return {
        cpu_usage_pct: 12.4,
        total_memory_mb: 16000,
        used_memory_mb: 8400,
        memory_usage_pct: 52.5,
        primary_disk_name: "C:",
        primary_disk_total_gb: 512,
        primary_disk_used_gb: 420,
        primary_disk_pct: 82.0,
        astra_ide_process: {
          name: "AstraIDE (Core + Shell)",
          pid: 4520,
          memory_mb: 195.4,
          cpu_pct: 0.8,
        },
        gradle_daemon_memory_mb: undefined,
      } as SystemResourceReport;

    case "list_devices":
      return [] as AndroidDevice[];

    case "load_config":
      return {
        recent_projects: [],
        theme: "dark",
        editor_font_size: 14,
        editor_tab_size: 4,
        editor_word_wrap: false,
        terminal_shell: "powershell",
        telemetry_enabled: false,
        auto_save: true,
      } as AstraIdeConfig;

    case "save_config":
      return null;

    case "install_toolchain_component":
      return `Component ${args.component} installed successfully.`;

    case "install_all_missing_components":
      return ["Java JDK installed", "Platform Tools installed", "Git installed"];

    case "add_path_to_environment":
      return null;

    case "detect_gpus":
      return [
        {
          name: "NVIDIA GeForce RTX 3050 Laptop GPU",
          vram_mb: 4096,
          driver_version: "32.0.15.9186",
          is_discrete: true,
          acceleration: "Hardware Host Acceleration (DirectX 12 / Vulkan / Dedicated GPU)",
        },
      ];

    default:
      return null;
  }
}
