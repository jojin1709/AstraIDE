import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Folder,
  Play,
  Hammer,
  RotateCcw,
  Smartphone,
  PlusSquare,
  FolderOpen,
  Settings,
  Terminal,
  Activity,
  Layers,
  Package,
  HardDrive,
  GitBranch,
  X,
  Save,
  Moon,
  Sun,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpCircle,
} from "lucide-react";

import {
  AndroidDevice,
  AndroidEnvironmentReport,
  AstraIdeConfig,
  CreateProjectRequest,
  FileNode,
  GitDiffResult,
  GitRepoStatus,
  GradleBuildLineEvent,
  GradleBuildResult,
  LogcatEntry,
  OpenEditorTab,
  SdkPackagesReport,
  StorageAnalysisReport,
  SystemResourceReport,
  TerminalLineEvent,
  UpdateInfo,
} from "./types";

import { invokeCommand, listenEvent } from "./services/tauriBridge";
import { CodeEditor } from "./editor/CodeEditor";
import { WelcomeScreen } from "./panels/WelcomeScreen";
import { ProjectExplorer } from "./panels/ProjectExplorer";
import { BuildPanel } from "./panels/BuildPanel";
import { DeviceManager } from "./panels/DeviceManager";
import { LogcatPanel } from "./panels/LogcatPanel";
import { TerminalPanel } from "./panels/TerminalPanel";
import { SdkManagerPanel } from "./panels/SdkManagerPanel";
import { ApkAnalyzerPanel } from "./panels/ApkAnalyzerPanel";
import { StorageAnalyzerPanel } from "./panels/StorageAnalyzerPanel";
import { ResourceMonitorPanel } from "./panels/ResourceMonitorPanel";
import { GitPanel } from "./panels/GitPanel";
import { NewProjectModal } from "./panels/NewProjectModal";
import { SettingsModal } from "./panels/SettingsModal";
import { SplashScreen } from "./panels/SplashScreen";
import { UpdateCenterModal } from "./panels/UpdateCenterModal";
import { CommandPalette, CommandItem } from "./panels/CommandPalette";
import { ContextMenu } from "./panels/ContextMenu";

export const App: React.FC = () => {
  // App Config
  const [config, setConfig] = useState<AstraIdeConfig>({
    recent_projects: [],
    theme: "dark",
    editor_font_size: 14,
    editor_tab_size: 4,
    editor_word_wrap: false,
    terminal_shell: "powershell",
    telemetry_enabled: false,
    auto_save: true,
  });

  // Project & Files
  const [activeProjectPath, setActiveProjectPath] = useState<string | null>(null);
  const [projectTree, setProjectTree] = useState<FileNode | null>(null);
  const [openTabs, setOpenTabs] = useState<OpenEditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Environment & Hardware
  const [envReport, setEnvReport] = useState<AndroidEnvironmentReport | null>(null);
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [selectedDeviceSerial, setSelectedDeviceSerial] = useState<string | null>(null);

  // Tools Data
  const [resourceMetrics, setResourceMetrics] = useState<SystemResourceReport | null>(null);
  const [sdkReport, setSdkReport] = useState<SdkPackagesReport | null>(null);
  const [storageReport, setStorageReport] = useState<StorageAnalysisReport | null>(null);
  const [gitStatus, setGitStatus] = useState<GitRepoStatus | null>(null);
  const [activeGitDiff, setActiveGitDiff] = useState<GitDiffResult | null>(null);
  const [apkAnalysisReport, setApkAnalysisReport] = useState<any | null>(null);

  // Build state
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [currentBuildTask, setCurrentBuildTask] = useState<string | null>(null);
  const [buildLogs, setBuildLogs] = useState<Array<{ task: string; line: string; is_error: boolean }>>([]);
  const [lastBuildResult, setLastBuildResult] = useState<GradleBuildResult | null>(null);

  // Logcat state
  const [logcatEntries, setLogcatEntries] = useState<LogcatEntry[]>([]);
  const [isLogcatStreaming, setIsLogcatStreaming] = useState<boolean>(false);

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<Array<{ line: string; is_error: boolean }>>([]);
  const [shellType, setShellType] = useState<string>("powershell");

  // UI Panels Layout
  const [activeActivityTab, setActiveActivityTab] = useState<"explorer" | "git" | "sdk" | "apk" | "storage">("explorer");
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem("astraide_sidebar_width");
    return saved ? parseInt(saved, 10) : 280;
  });
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const [activeDockTab, setActiveDockTab] = useState<"build" | "logcat" | "terminal" | "resource">("build");
  const [isDockOpen, setIsDockOpen] = useState<boolean>(true);
  const [dockHeight, setDockHeight] = useState<number>(240);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Resizable sidebar mouse drag handlers
  const handleStartSidebarResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Activity bar width is 48px
      const newWidth = Math.max(180, Math.min(650, e.clientX - 48));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      localStorage.setItem("astraide_sidebar_width", sidebarWidth.toString());
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  const handleToggleActivityTab = (tab: "explorer" | "git" | "sdk" | "apk" | "storage") => {
    if (activeActivityTab === tab && isSidebarVisible) {
      setIsSidebarVisible(false);
    } else {
      setActiveActivityTab(tab);
      setIsSidebarVisible(true);
    }
  };

  // Modals
  const [isSplashScreenOpen, setIsSplashScreenOpen] = useState<boolean>(true);
  const [isInitialLoadingSplash, setIsInitialLoadingSplash] = useState<boolean>(true);
  const [isUpdateCenterOpen, setIsUpdateCenterOpen] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [screenshotModalImage, setScreenshotModalImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleCheckForUpdates = useCallback(async (openModal = false) => {
    try {
      setIsCheckingUpdate(true);
      const info = await invokeCommand<UpdateInfo>("check_for_updates");
      setUpdateInfo(info);
      if (openModal || info.update_available) {
        setIsUpdateCenterOpen(true);
      }
    } catch (e) {
      console.warn("Update check failed:", e);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  // Global right-click context menu interceptor (blocks default browser menu)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Load config & initial environment on start with smooth staggering (eliminates initial frame lag)
  useEffect(() => {
    loadConfig();

    const t1 = setTimeout(() => {
      refreshDevices();
      refreshResources();
    }, 80);

    const t2 = setTimeout(() => {
      refreshEnvironment();
    }, 220);

    const t3 = setTimeout(() => {
      handleCheckForUpdates(false);
    }, 1200);

    // Listen to background build lines
    const unlistenBuild = listenEvent<GradleBuildLineEvent>("gradle-build-line", (ev) => {
      setBuildLogs((prev) => [...prev, { task: ev.task, line: ev.line, is_error: ev.is_error }]);
    });

    // Listen to Logcat entries
    const unlistenLogcat = listenEvent<LogcatEntry[]>("logcat-batch", (batch) => {
      setLogcatEntries((prev) => {
        const next = [...prev, ...batch];
        return next.length > 3000 ? next.slice(next.length - 3000) : next;
      });
    });

    // Listen to terminal output lines
    const unlistenTerminal = listenEvent<TerminalLineEvent>("terminal-line", (ev) => {
      setTerminalLines((prev) => [...prev, { line: ev.line, is_error: ev.is_error }]);
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      unlistenBuild.then((u) => u());
      unlistenLogcat.then((u) => u());
      unlistenTerminal.then((u) => u());
    };
  }, []);

  // Periodic device & resource refresh (non-blocking)
  useEffect(() => {
    const timer = setInterval(() => {
      refreshResources();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const loadConfig = async () => {
    try {
      const cfg = await invokeCommand<AstraIdeConfig>("load_config");
      if (cfg) {
        setConfig(cfg);
        document.documentElement.setAttribute("data-theme", cfg.theme || "dark");
        if (cfg.terminal_shell) setShellType(cfg.terminal_shell);
      }
    } catch (e) {
      console.warn("Failed loading config:", e);
    }
  };

  const handleSaveConfig = async (newCfg: AstraIdeConfig) => {
    setConfig(newCfg);
    document.documentElement.setAttribute("data-theme", newCfg.theme || "dark");
    if (newCfg.terminal_shell) setShellType(newCfg.terminal_shell);
    try {
      await invokeCommand("save_config", { config: newCfg });
    } catch (e: any) {
      setErrorMessage(e.toString());
    }
  };

  const refreshEnvironment = async () => {
    try {
      const report = await invokeCommand<AndroidEnvironmentReport>("get_environment_report");
      setEnvReport(report);
      if (report.android_sdk.path) {
        inspectSdk(report.android_sdk.path);
      }
    } catch (e: any) {
      console.error("Environment detection error:", e);
    }
  };

  const refreshDevices = async () => {
    try {
      const list = await invokeCommand<AndroidDevice[]>("list_devices", {
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
      });
      setDevices(list);
      if (list.length > 0 && !selectedDeviceSerial) {
        setSelectedDeviceSerial(list[0].serial);
      }
    } catch (e: any) {
      console.warn("ADB Device listing error:", e);
    }
  };

  const refreshResources = async () => {
    try {
      const res = await invokeCommand<SystemResourceReport>("get_resource_metrics");
      setResourceMetrics(res);
    } catch (e) {
      // ignore
    }
  };

  const inspectSdk = async (path: string) => {
    try {
      const report = await invokeCommand<SdkPackagesReport>("inspect_sdk", { sdkPath: path });
      setSdkReport(report);
    } catch (e: any) {
      console.warn("SDK inspection warning:", e);
    }
  };

  const refreshStorage = async () => {
    try {
      const report = await invokeCommand<StorageAnalysisReport>("analyze_storage", {
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        currentProject: activeProjectPath,
      });
      setStorageReport(report);
    } catch (e: any) {
      console.warn("Storage inspection warning:", e);
    }
  };

  const refreshGit = async (projPath: string) => {
    try {
      const status = await invokeCommand<GitRepoStatus>("git_status", { projectPath: projPath });
      setGitStatus(status);
    } catch (e) {
      setGitStatus(null);
    }
  };

  // PROJECT CREATION & OPENING
  const handleCreateProject = async (req: CreateProjectRequest) => {
    try {
      setIsNewProjectModalOpen(false);
      const res = await invokeCommand<{ success: boolean; project_path: string; message: string }>(
        "create_project",
        { req }
      );
      if (res.success) {
        handleOpenProject(res.project_path);
      }
    } catch (e: any) {
      setErrorMessage(e.toString());
    }
  };

  const handleOpenProject = async (path?: string) => {
    let projPath = path;
    if (!projPath) {
      try {
        const picked = await invokeCommand<string | null>("pick_project_folder");
        if (!picked) return; // User canceled dialog
        projPath = picked;
      } catch (err: any) {
        setErrorMessage(`Failed to open folder picker: ${err}`);
        return;
      }
    }

    try {
      const tree = await invokeCommand<FileNode>("get_project_tree", { rootPath: projPath });
      setActiveProjectPath(projPath);
      setProjectTree(tree);
      setOpenTabs([]);
      setActiveTabId(null);

      // Load git & storage
      refreshGit(projPath);
      refreshStorage();

      // Automatically open MainActivity or AndroidManifest if present
      findAndOpenKeyFiles(tree);
    } catch (e: any) {
      setErrorMessage(`Failed to open project: ${e}`);
    }
  };

  const findAndOpenKeyFiles = (node: FileNode) => {
    let foundPath: string | null = null;
    const search = (n: FileNode) => {
      if (foundPath) return;
      if (!n.is_dir) {
        if (n.name.includes("MainActivity") || n.name === "AndroidManifest.xml" || n.name === "build.gradle") {
          foundPath = n.path;
        }
      } else if (n.children) {
        for (const child of n.children) {
          search(child);
        }
      }
    };
    search(node);
    if (foundPath) {
      handleOpenFile(foundPath);
    }
  };

  // FILE HANDLING & EDITOR
  const handleOpenFile = async (filePath: string) => {
    const existing = openTabs.find((t) => t.path === filePath);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    try {
      const content = await invokeCommand<string>("read_file", { path: filePath });
      const name = filePath.split("\\").pop() || filePath.split("/").pop() || "file";
      const ext = name.split(".").pop() || "";
      const newTab: OpenEditorTab = {
        id: filePath,
        path: filePath,
        name,
        content,
        originalContent: content,
        isDirty: false,
        extension: ext,
      };

      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabId(filePath);
    } catch (e: any) {
      setErrorMessage(`Cannot read file: ${e}`);
    }
  };

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const nextActive = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
        setActiveTabId(nextActive);
      }
      return filtered;
    });
  };

  const handleEditorChange = (newContent: string) => {
    if (!activeTabId) return;
    setOpenTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              content: newContent,
              isDirty: newContent !== t.originalContent,
            }
          : t
      )
    );
  };

  const handleSaveCurrentFile = async () => {
    const currentTab = openTabs.find((t) => t.id === activeTabId);
    if (!currentTab) return;

    try {
      await invokeCommand("write_file", {
        path: currentTab.path,
        content: currentTab.content,
      });
      setOpenTabs((prev) =>
        prev.map((t) => (t.id === currentTab.id ? { ...t, originalContent: t.content, isDirty: false } : t))
      );
    } catch (e: any) {
      setErrorMessage(`Failed to save file: ${e}`);
    }
  };

  const handleSaveAllFiles = async () => {
    for (const tab of openTabs) {
      if (tab.isDirty) {
        try {
          await invokeCommand("write_file", { path: tab.path, content: tab.content });
        } catch (e: any) {
          console.error("Save all error:", e);
        }
      }
    }
    setOpenTabs((prev) => prev.map((t) => ({ ...t, originalContent: t.content, isDirty: false })));
  };

  // BUILD & EXECUTION
  const handleExecuteBuild = async (taskName: string) => {
    if (!activeProjectPath) {
      setErrorMessage("Please open an Android project before building.");
      return;
    }

    setIsBuilding(true);
    setCurrentBuildTask(taskName);
    setActiveDockTab("build");
    setIsDockOpen(true);
    setBuildLogs([
      {
        task: taskName,
        line: `> Starting Gradle build task: ${taskName}`,
        is_error: false,
      },
    ]);

    try {
      const result = await invokeCommand<GradleBuildResult>("execute_gradle_build", {
        projectPath: activeProjectPath,
        taskName,
        extraArgs: [],
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        customJdk: config.custom_jdk_path || envReport?.java.path,
      });
      setLastBuildResult(result);
    } catch (e: any) {
      setErrorMessage(`Build failed: ${e}`);
      setLastBuildResult({
        success: false,
        task: taskName,
        duration_seconds: 0,
        error_message: e.toString(),
      });
    } finally {
      setIsBuilding(false);
      setCurrentBuildTask(null);
    }
  };

  const handleCleanProject = () => {
    handleExecuteBuild("clean");
  };

  // RUN APPLICATION ON DEVICE
  const handleRunAppOnDevice = async (serial: string) => {
    if (!activeProjectPath) {
      setErrorMessage("No Android project open.");
      return;
    }

    // 1. Build Debug APK
    setIsBuilding(true);
    setCurrentBuildTask("assembleDebug");
    setActiveDockTab("build");
    setIsDockOpen(true);

    try {
      const buildRes = await invokeCommand<GradleBuildResult>("execute_gradle_build", {
        projectPath: activeProjectPath,
        taskName: "assembleDebug",
        extraArgs: [],
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        customJdk: config.custom_jdk_path || envReport?.java.path,
      });

      setLastBuildResult(buildRes);
      setIsBuilding(false);

      if (!buildRes.success || !buildRes.apk_path) {
        setErrorMessage("Build failed. Cannot deploy to device.");
        return;
      }

      // 2. Install APK to device
      setBuildLogs((prev) => [
        ...prev,
        {
          task: "install",
          line: `> Installing APK ${buildRes.apk_path} on device ${serial}...`,
          is_error: false,
        },
      ]);

      const installRes = await invokeCommand<any>("install_apk", {
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        serial,
        apkPath: buildRes.apk_path,
      });

      if (!installRes.success) {
        setErrorMessage(`APK installation failed: ${installRes.stderr || installRes.stdout}`);
        return;
      }

      setBuildLogs((prev) => [
        ...prev,
        {
          task: "install",
          line: `[Success] APK installed successfully on device ${serial}.`,
          is_error: false,
        },
      ]);

      // 3. Start Activity if determined from AndroidManifest
      // Launch via adb am start
      startLogcatStreaming(serial);
    } catch (e: any) {
      setIsBuilding(false);
      setErrorMessage(`Run failed: ${e}`);
    }
  };

  // LOGCAT
  const startLogcatStreaming = async (serial: string) => {
    try {
      setActiveDockTab("logcat");
      setIsDockOpen(true);
      await invokeCommand("start_logcat", {
        serial,
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
      });
      setIsLogcatStreaming(true);
    } catch (e: any) {
      setErrorMessage(`Failed to start Logcat: ${e}`);
    }
  };

  const stopLogcatStreaming = async () => {
    if (selectedDeviceSerial) {
      try {
        await invokeCommand("stop_logcat", { serial: selectedDeviceSerial });
        setIsLogcatStreaming(false);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleClearLogcat = async () => {
    setLogcatEntries([]);
    if (selectedDeviceSerial) {
      try {
        await invokeCommand("clear_logcat", {
          serial: selectedDeviceSerial,
          customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // TERMINAL COMMAND RUNNER
  const handleRunTerminalCommand = async (commandStr: string) => {
    if (!activeProjectPath) {
      setErrorMessage("Please open a project directory first.");
      return;
    }

    setTerminalLines((prev) => [
      ...prev,
      { line: `${activeProjectPath}> ${commandStr}`, is_error: false },
    ]);

    try {
      await invokeCommand("run_terminal_command", {
        sessionId: "main-term",
        cwd: activeProjectPath,
        commandStr,
        shellType,
      });
    } catch (e: any) {
      setTerminalLines((prev) => [...prev, { line: `Error: ${e}`, is_error: true }]);
    }
  };

  // SCREENSHOT
  const handleTakeScreenshot = async (serial: string) => {
    try {
      const b64 = await invokeCommand<string>("take_device_screenshot", {
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
        serial,
      });
      setScreenshotModalImage(b64);
    } catch (e: any) {
      setErrorMessage(`Failed to take device screenshot: ${e}`);
    }
  };

  // APK ANALYZER INSPECTION
  const handleAnalyzeApkPath = async (apkPath: string) => {
    try {
      const rep = await invokeCommand<any>("analyze_apk", {
        apkPath,
        customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
      });
      setApkAnalysisReport(rep);
      setActiveActivityTab("apk");
    } catch (e: any) {
      setErrorMessage(`APK Analysis error: ${e}`);
    }
  };

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+S: Save
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        handleSaveCurrentFile();
      }
      // Ctrl+Shift+S: Save All
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        handleSaveAllFiles();
      }
      // F5: Run
      else if (e.key === "F5") {
        e.preventDefault();
        if (selectedDeviceSerial) {
          handleRunAppOnDevice(selectedDeviceSerial);
        } else {
          handleExecuteBuild("assembleDebug");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [activeTabId, openTabs, selectedDeviceSerial, activeProjectPath]);

  // COMMAND PALETTE ACTIONS
  const paletteCommands: CommandItem[] = useMemo(
    () => [
      {
        id: "new-proj",
        title: "New Android Project",
        category: "Project",
        icon: <PlusSquare size={14} />,
        shortcut: "Ctrl+N",
        action: () => setIsNewProjectModalOpen(true),
      },
      {
        id: "open-proj",
        title: "Open Android Project",
        category: "Project",
        icon: <FolderOpen size={14} />,
        shortcut: "Ctrl+O",
        action: () => handleOpenProject(),
      },
      {
        id: "build-debug",
        title: "Build: Assemble Debug APK",
        category: "Build",
        icon: <Hammer size={14} />,
        shortcut: "Ctrl+Shift+B",
        action: () => handleExecuteBuild("assembleDebug"),
      },
      {
        id: "build-release",
        title: "Build: Assemble Release APK",
        category: "Build",
        icon: <Package size={14} />,
        action: () => handleExecuteBuild("assembleRelease"),
      },
      {
        id: "clean-proj",
        title: "Build: Clean Project Outputs",
        category: "Build",
        icon: <RotateCcw size={14} />,
        action: () => handleCleanProject(),
      },
      {
        id: "run-app",
        title: "Run Application on Device",
        category: "Device",
        icon: <Play size={14} />,
        shortcut: "F5",
        action: () => {
          if (selectedDeviceSerial) handleRunAppOnDevice(selectedDeviceSerial);
        },
      },
      {
        id: "open-logcat",
        title: "Open Logcat Viewer",
        category: "View",
        icon: <Terminal size={14} />,
        action: () => {
          setActiveDockTab("logcat");
          setIsDockOpen(true);
        },
      },
      {
        id: "open-term",
        title: "Open Integrated Terminal",
        category: "View",
        icon: <Terminal size={14} />,
        action: () => {
          setActiveDockTab("terminal");
          setIsDockOpen(true);
        },
      },
      {
        id: "sdk-mgr",
        title: "Open Android SDK Manager",
        category: "Tools",
        icon: <Layers size={14} />,
        action: () => setActiveActivityTab("sdk"),
      },
      {
        id: "apk-analyzer",
        title: "Open APK Analyzer",
        category: "Tools",
        icon: <Package size={14} />,
        action: () => setActiveActivityTab("apk"),
      },
      {
        id: "storage-analyzer",
        title: "Open Storage Footprint Analyzer",
        category: "Tools",
        icon: <HardDrive size={14} />,
        action: () => {
          refreshStorage();
          setActiveActivityTab("storage");
        },
      },
      {
        id: "git-view",
        title: "Open Git Source Control",
        category: "Tools",
        icon: <GitBranch size={14} />,
        action: () => {
          if (activeProjectPath) refreshGit(activeProjectPath);
          setActiveActivityTab("git");
        },
      },
      {
        id: "settings",
        title: "Open AstraIDE Settings",
        category: "Preferences",
        icon: <Settings size={14} />,
        shortcut: "Ctrl+,",
        action: () => setIsSettingsModalOpen(true),
      },
      {
        id: "check-updates",
        title: "Check for Updates (Update Center)",
        category: "Help",
        icon: <ArrowUpCircle size={14} />,
        action: () => {
          setIsUpdateCenterOpen(true);
          handleCheckForUpdates(true);
        },
      },
    ],
    [activeProjectPath, selectedDeviceSerial, handleCheckForUpdates]
  );

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <div
      className="app-container"
      style={{
        userSelect: isResizingSidebar ? "none" : "auto",
        cursor: isResizingSidebar ? "col-resize" : "default",
      }}
    >
      {/* TOP APPLICATION TOOLBAR */}
      <header className="app-toolbar">
        {/* Left: Branding & Project */}
        <div className="toolbar-left">
          <div
            className="brand-badge"
            onClick={() => {
              setIsInitialLoadingSplash(false);
              setIsSplashScreenOpen(true);
            }}
            title="Click to view AstraIDE Splash & Release Info"
          >
            <img src="/icon.png" alt="AstraIDE" className="brand-logo" />
            <span className="brand-name">AstraIDE</span>
            <span className="brand-version">v0.1</span>
          </div>

          {activeProjectPath ? (
            <div className="project-badge" title={activeProjectPath}>
              <Folder size={12} color="var(--accent-primary)" />
              <span>{activeProjectPath.split("\\").pop()}</span>
            </div>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--text-disabled)" }}>
              No Project Open
            </span>
          )}
        </div>

        {/* Center: Build & Run Controls */}
        <div className="toolbar-center">
          <button
            onClick={() => handleExecuteBuild("assembleDebug")}
            disabled={isBuilding || !activeProjectPath}
            className="btn-toolbar"
            title="Build Debug APK"
          >
            <Hammer size={13} />
            Build
          </button>

          <button
            onClick={() => {
              if (selectedDeviceSerial) {
                handleRunAppOnDevice(selectedDeviceSerial);
              } else {
                handleExecuteBuild("assembleDebug");
              }
            }}
            disabled={isBuilding || !activeProjectPath}
            className="btn-toolbar primary"
            title="Build and Deploy to Device"
          >
            <Play size={13} />
            Run
          </button>

          <button
            onClick={handleCleanProject}
            disabled={isBuilding || !activeProjectPath}
            className="btn-toolbar"
            title="Clean Build Directory"
          >
            <RotateCcw size={13} />
            Clean
          </button>

          {/* Device dropdown */}
          <div className="device-selector-box">
            <Smartphone size={13} />
            <select
              value={selectedDeviceSerial || ""}
              onChange={(e) => setSelectedDeviceSerial(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "inherit",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {devices.length === 0 ? (
                <option value="">No device connected</option>
              ) : (
                devices.map((d) => (
                  <option key={d.serial} value={d.serial} style={{ background: "var(--bg-secondary)" }}>
                    {d.model} ({d.serial}) {d.is_authorized ? "[Online]" : "[Unauthorized]"}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Right: Hardware stats, shortcuts, settings */}
        <div className="toolbar-right">
          {/* Workstation RAM / CPU pill */}
          {resourceMetrics && (
            <div
              className="sys-monitor-pill"
              onClick={() => {
                setActiveDockTab("resource");
                setIsDockOpen(true);
              }}
              style={{ cursor: "pointer" }}
              title="Click to open Resource Monitor"
            >
              <div className="sys-stat">
                CPU: <span className="sys-val">{resourceMetrics.cpu_usage_pct}%</span>
              </div>
              <div className="sys-stat">
                RAM: <span className="sys-val">{Math.round(resourceMetrics.used_memory_mb / 1024)}GB</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="btn-toolbar"
            style={{ fontSize: "11px", padding: "4px 8px" }}
            title="Command Palette (Ctrl+Shift+P)"
          >
            <Search size={12} />
            <span style={{ fontFamily: "var(--font-mono)", opacity: 0.8 }}>Ctrl+Shift+P</span>
          </button>

          {/* Update Available Badge */}
          {updateInfo?.update_available && (
            <button
              onClick={() => setIsUpdateCenterOpen(true)}
              className="btn-toolbar primary"
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                background: "linear-gradient(90deg, #10b981, #00d2ff)",
                color: "#070c16",
                fontWeight: 700,
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 0 10px rgba(0, 210, 255, 0.4)",
              }}
              title={`New version ${updateInfo.latest_version} available! Click to update.`}
            >
              <Sparkles size={12} />
              Update {updateInfo.latest_version}
            </button>
          )}

          <button
            onClick={() => {
              const nextTheme = config.theme === "dark" ? "light" : "dark";
              handleSaveConfig({ ...config, theme: nextTheme });
            }}
            className="icon-btn"
            title="Toggle Dark / Light Theme"
          >
            {config.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            onClick={() => {
              setIsUpdateCenterOpen(true);
              handleCheckForUpdates(true);
            }}
            className="icon-btn"
            title="AstraIDE Update Center"
          >
            <ArrowUpCircle size={15} />
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="icon-btn"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div
          style={{
            background: "var(--status-error-bg)",
            borderBottom: "1px solid var(--status-error)",
            padding: "8px 16px",
            fontSize: "12px",
            color: "var(--status-error)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 60,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="icon-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN BODY WORKSPACE */}
      <div className="app-body">
        {/* ACTIVITY BAR */}
        <div className="activity-bar">
          <button
            onClick={() => handleToggleActivityTab("explorer")}
            className={`activity-btn ${activeActivityTab === "explorer" && isSidebarVisible ? "active" : ""}`}
            title="Project Explorer (Toggle Sidebar)"
          >
            <Folder size={18} />
          </button>
          <button
            onClick={() => {
              if (activeProjectPath) refreshGit(activeProjectPath);
              handleToggleActivityTab("git");
            }}
            className={`activity-btn ${activeActivityTab === "git" && isSidebarVisible ? "active" : ""}`}
            title="Git Version Control (Toggle Sidebar)"
          >
            <GitBranch size={18} />
          </button>
          <button
            onClick={() => handleToggleActivityTab("sdk")}
            className={`activity-btn ${activeActivityTab === "sdk" && isSidebarVisible ? "active" : ""}`}
            title="Android SDK Manager (Toggle Sidebar)"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={() => handleToggleActivityTab("apk")}
            className={`activity-btn ${activeActivityTab === "apk" && isSidebarVisible ? "active" : ""}`}
            title="APK Analyzer (Toggle Sidebar)"
          >
            <Package size={18} />
          </button>
          <button
            onClick={() => {
              refreshStorage();
              handleToggleActivityTab("storage");
            }}
            className={`activity-btn ${activeActivityTab === "storage" && isSidebarVisible ? "active" : ""}`}
            title="Storage Footprint (Toggle Sidebar)"
          >
            <HardDrive size={18} />
          </button>
        </div>

        {/* WORKSPACE LEFT: Explorer / Git / SDK / APK / Storage */}
        {isSidebarVisible && (
          <>
            <div
              className="workspace-left"
              style={{
                width: `${sidebarWidth}px`,
                minWidth: `${sidebarWidth}px`,
                maxWidth: `${sidebarWidth}px`,
              }}
            >
              {activeActivityTab === "explorer" && (
            <ProjectExplorer
              rootNode={projectTree}
              activeFilePath={activeTab?.path}
              onSelectFile={handleOpenFile}
              onRefresh={() => activeProjectPath && handleOpenProject(activeProjectPath)}
              onCreateFile={async (parent, name) => {
                try {
                  const target = `${parent}\\${name}`;
                  await invokeCommand("create_file", { path: target });
                  if (activeProjectPath) handleOpenProject(activeProjectPath);
                } catch (e: any) {
                  setErrorMessage(e.toString());
                }
              }}
              onCreateFolder={async (parent, name) => {
                try {
                  const target = `${parent}\\${name}`;
                  await invokeCommand("create_directory", { path: target });
                  if (activeProjectPath) handleOpenProject(activeProjectPath);
                } catch (e: any) {
                  setErrorMessage(e.toString());
                }
              }}
              onRename={async (oldPath, newPath) => {
                try {
                  await invokeCommand("rename_path", { oldPath, newPath });
                  if (activeProjectPath) handleOpenProject(activeProjectPath);
                } catch (e: any) {
                  setErrorMessage(e.toString());
                }
              }}
              onDelete={async (path) => {
                if (window.confirm(`Delete ${path}?`)) {
                  try {
                    await invokeCommand("delete_path", { path });
                    if (activeProjectPath) handleOpenProject(activeProjectPath);
                  } catch (e: any) {
                    setErrorMessage(e.toString());
                  }
                }
              }}
              onRevealInExplorer={(path) => invokeCommand("reveal_in_explorer", { path })}
            />
          )}

          {activeActivityTab === "git" && (
            <GitPanel
              status={gitStatus}
              onRefresh={() => activeProjectPath && refreshGit(activeProjectPath)}
              onStageFile={async (file) => {
                if (activeProjectPath) {
                  await invokeCommand("git_stage", { projectPath: activeProjectPath, filePath: file });
                  refreshGit(activeProjectPath);
                }
              }}
              onUnstageFile={async (file) => {
                if (activeProjectPath) {
                  await invokeCommand("git_unstage", { projectPath: activeProjectPath, filePath: file });
                  refreshGit(activeProjectPath);
                }
              }}
              onCommit={async (msg) => {
                if (activeProjectPath) {
                  await invokeCommand("git_commit", { projectPath: activeProjectPath, message: msg });
                  refreshGit(activeProjectPath);
                }
              }}
              onViewDiff={async (file) => {
                if (activeProjectPath) {
                  const diff = await invokeCommand<GitDiffResult>("git_diff", {
                    projectPath: activeProjectPath,
                    filePath: file,
                  });
                  setActiveGitDiff(diff);
                }
              }}
              activeDiff={activeGitDiff}
            />
          )}

          {activeActivityTab === "sdk" && (
            <SdkManagerPanel
              report={sdkReport}
              onRefresh={() => {
                if (envReport?.android_sdk.path) inspectSdk(envReport.android_sdk.path);
              }}
              onUpdateSdkPath={(p) => inspectSdk(p)}
            />
          )}

          {activeActivityTab === "apk" && (
            <ApkAnalyzerPanel
              report={apkAnalysisReport}
              onSelectApkPath={handleAnalyzeApkPath}
            />
          )}

          {activeActivityTab === "storage" && (
            <StorageAnalyzerPanel
              report={storageReport}
              onRefresh={refreshStorage}
              onCleanProjectBuild={async () => {
                if (activeProjectPath) {
                  await invokeCommand("clean_project_build", { projectPath: activeProjectPath });
                  refreshStorage();
                }
              }}
            />
          )}
            </div>

            {/* Resizable Sidebar Splitter */}
            <div
              className={`sidebar-splitter ${isResizingSidebar ? "active" : ""}`}
              onMouseDown={handleStartSidebarResize}
              onDoubleClick={() => setSidebarWidth(280)}
              title="Drag to resize sidebar • Double-click to reset"
            />
          </>
        )}

        {/* WORKSPACE CENTER: Code Editor or Welcome Screen */}
        <div className="workspace-center">
          {activeProjectPath && openTabs.length > 0 ? (
            <>
              {/* Tabs Bar */}
              <div className="editor-tabs-bar">
                {openTabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`editor-tab ${activeTabId === tab.id ? "active" : ""}`}
                  >
                    <span>{tab.name}</span>
                    {tab.isDirty && <div className="tab-dirty-indicator" title="Unsaved changes" />}
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="tab-close-btn"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* CodeMirror 6 Editor */}
              {activeTab && (
                <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                  <CodeEditor
                    content={activeTab.content}
                    filePath={activeTab.path}
                    isDirty={activeTab.isDirty}
                    wordWrap={config.editor_word_wrap}
                    fontSize={config.editor_font_size}
                    tabSize={config.editor_tab_size}
                    onChange={handleEditorChange}
                    onSave={handleSaveCurrentFile}
                    onCursorChange={(l, c) => setCursorPos({ line: l, col: c })}
                  />
                </div>
              )}
            </>
          ) : (
            <WelcomeScreen
              envReport={envReport}
              devices={devices}
              recentProjects={config.recent_projects}
              onNewProject={() => setIsNewProjectModalOpen(true)}
              onOpenProject={handleOpenProject}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onRefreshEnv={refreshEnvironment}
            />
          )}

          {/* BOTTOM DOCK PANEL */}
          {activeProjectPath && (
            <div
              className="bottom-dock"
              style={{
                height: isDockOpen ? `${dockHeight}px` : "34px",
                transition: "height 0.2s ease",
              }}
            >
              <div className="dock-header">
                <div className="dock-tabs">
                  <button
                    onClick={() => {
                      setActiveDockTab("build");
                      setIsDockOpen(true);
                    }}
                    className={`dock-tab ${activeDockTab === "build" ? "active" : ""}`}
                  >
                    <Hammer size={13} />
                    Build Output
                  </button>
                  <button
                    onClick={() => {
                      setActiveDockTab("logcat");
                      setIsDockOpen(true);
                      if (selectedDeviceSerial && !isLogcatStreaming) {
                        startLogcatStreaming(selectedDeviceSerial);
                      }
                    }}
                    className={`dock-tab ${activeDockTab === "logcat" ? "active" : ""}`}
                  >
                    <Terminal size={13} />
                    Logcat
                  </button>
                  <button
                    onClick={() => {
                      setActiveDockTab("terminal");
                      setIsDockOpen(true);
                    }}
                    className={`dock-tab ${activeDockTab === "terminal" ? "active" : ""}`}
                  >
                    <Terminal size={13} />
                    Terminal
                  </button>
                  <button
                    onClick={() => {
                      setActiveDockTab("resource");
                      setIsDockOpen(true);
                    }}
                    className={`dock-tab ${activeDockTab === "resource" ? "active" : ""}`}
                  >
                    <Activity size={13} />
                    Resource Monitor
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    onClick={() => setIsDockOpen(!isDockOpen)}
                    className="icon-btn"
                    title={isDockOpen ? "Collapse Dock" : "Expand Dock"}
                  >
                    {isDockOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {isDockOpen && (
                <div className="dock-content">
                  {activeDockTab === "build" && (
                    <BuildPanel
                      logs={buildLogs}
                      isBuilding={isBuilding}
                      currentTask={currentBuildTask}
                      lastResult={lastBuildResult}
                      onRunBuild={handleExecuteBuild}
                      onClean={handleCleanProject}
                      onClearLogs={() => setBuildLogs([])}
                      onSelectApkForInspection={handleAnalyzeApkPath}
                      onInstallApkToDevice={(apk) => {
                        if (selectedDeviceSerial) {
                          invokeCommand("install_apk", {
                            customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
                            serial: selectedDeviceSerial,
                            apkPath: apk,
                          });
                        }
                      }}
                    />
                  )}

                  {activeDockTab === "logcat" && (
                    <LogcatPanel
                      entries={logcatEntries}
                      isStreaming={isLogcatStreaming}
                      onToggleStreaming={() => {
                        if (isLogcatStreaming) {
                          stopLogcatStreaming();
                        } else if (selectedDeviceSerial) {
                          startLogcatStreaming(selectedDeviceSerial);
                        }
                      }}
                      onClear={handleClearLogcat}
                    />
                  )}

                  {activeDockTab === "terminal" && (
                    <TerminalPanel
                      cwd={activeProjectPath || ""}
                      lines={terminalLines}
                      shellType={shellType}
                      onSetShellType={setShellType}
                      onRunCommand={handleRunTerminalCommand}
                      onClear={() => setTerminalLines([])}
                    />
                  )}

                  {activeDockTab === "resource" && (
                    <ResourceMonitorPanel
                      metrics={resourceMetrics}
                      onRefresh={refreshResources}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* WORKSPACE RIGHT: Device Manager */}
        {isRightPanelOpen && activeProjectPath && (
          <div className="workspace-right">
            <DeviceManager
              devices={devices}
              selectedSerial={selectedDeviceSerial}
              onSelectDevice={setSelectedDeviceSerial}
              onRefreshDevices={refreshDevices}
              onRestartAdb={async () => {
                await invokeCommand("restart_adb", {
                  customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
                });
                refreshDevices();
              }}
              onInstallApk={async (serial) => {
                const path = window.prompt("Enter full path of APK to install:");
                if (path) {
                  try {
                    await invokeCommand("install_apk", {
                      customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
                      serial,
                      apkPath: path,
                    });
                  } catch (e: any) {
                    setErrorMessage(e.toString());
                  }
                }
              }}
              onUninstallApp={async (serial) => {
                const pkg = window.prompt("Enter package name to uninstall (e.g. com.example.app):");
                if (pkg) {
                  try {
                    await invokeCommand("uninstall_app", {
                      customSdk: config.custom_sdk_path || envReport?.android_sdk.path,
                      serial,
                      packageName: pkg,
                    });
                  } catch (e: any) {
                    setErrorMessage(e.toString());
                  }
                }
              }}
              onOpenLogcat={(serial) => startLogcatStreaming(serial)}
              onTakeScreenshot={(serial) => handleTakeScreenshot(serial)}
              onRunOnDevice={(serial) => handleRunAppOnDevice(serial)}
            />
          </div>
        )}
      </div>

      {/* BOTTOM STATUS BAR */}
      <footer className="app-statusbar">
        <div className="statusbar-left">
          <div className="statusbar-item">
            <div className={`device-dot ${devices.length > 0 ? "" : "none"}`} />
            <span>
              {devices.length === 0
                ? "No device connected"
                : `${devices.length} device(s) online`}
            </span>
          </div>

          {activeTab && (
            <div className="statusbar-item" style={{ fontFamily: "var(--font-mono)" }}>
              <span>
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </div>
          )}
        </div>

        <div className="statusbar-right">
          {activeTab && (
            <div className="statusbar-item">
              <span>UTF-8</span>
              <span>•</span>
              <span style={{ textTransform: "uppercase" }}>{activeTab.extension || "TEXT"}</span>
            </div>
          )}

          <div className="statusbar-item">
            <span>AstraIDE Core: Rust</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
        defaultSdkPath={config.custom_sdk_path || envReport?.android_sdk.path}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        config={config}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={handleSaveConfig}
        detectedSdkPath={envReport?.android_sdk.path}
        detectedJdkPath={envReport?.java.path}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRun={() => {
            if (selectedDeviceSerial) {
              handleRunAppOnDevice(selectedDeviceSerial);
            } else {
              handleExecuteBuild(config.gradle_default_task || "assembleDebug");
            }
          }}
          onBuild={() => handleExecuteBuild(config.gradle_default_task || "assembleDebug")}
          onClean={handleCleanProject}
          onSave={handleSaveCurrentFile}
          onOpenFolder={handleOpenProject}
          onToggleTheme={() =>
            handleSaveConfig({ ...config, theme: config.theme === "dark" ? "light" : "dark" })
          }
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onRefreshEnv={refreshEnvironment}
          isDarkMode={config.theme !== "light"}
          hasActiveFile={activeTabId !== null}
        />
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={paletteCommands}
      />

      {/* Screenshot Preview Modal */}
      {screenshotModalImage && (
        <div className="modal-overlay" onClick={() => setScreenshotModalImage(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: "420px", maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Camera size={16} color="var(--accent-primary)" />
                <span className="modal-title">Device Screenshot</span>
              </div>
              <button onClick={() => setScreenshotModalImage(null)} className="icon-btn">
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "16px", display: "flex", justifyContent: "center", background: "#000" }}>
              <img
                src={screenshotModalImage}
                alt="Device screen"
                style={{
                  maxHeight: "65vh",
                  maxWidth: "100%",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                }}
              />
            </div>
            <div className="modal-footer">
              <a
                href={screenshotModalImage}
                download={`astraide-screenshot-${Date.now()}.png`}
                className="btn-toolbar primary"
                style={{ padding: "6px 14px", textDecoration: "none" }}
              >
                Download PNG
              </a>
            </div>
          </div>
        </div>
      )}

      {/* AstraIDE Update Center Modal */}
      <UpdateCenterModal
        isOpen={isUpdateCenterOpen}
        onClose={() => setIsUpdateCenterOpen(false)}
        updateInfo={updateInfo}
        isChecking={isCheckingUpdate}
        onCheckUpdates={() => handleCheckForUpdates(true)}
      />

      {/* AstraIDE Splash / Loading Screen */}
      <SplashScreen
        isOpen={isSplashScreenOpen}
        onClose={() => setIsSplashScreenOpen(false)}
        isInitialLoading={isInitialLoadingSplash}
      />
    </div>
  );
};
export default App;
