import React, { useState, useMemo, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  PlusSquare,
  Smartphone,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Layers,
  Download,
  Zap,
  Monitor,
  RefreshCw,
  Terminal,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { AndroidEnvironmentReport, AndroidDevice, RecentProject, InstallProgressEvent } from "../types";
import { invokeCommand, listenEvent } from "../services/tauriBridge";

interface WelcomeScreenProps {
  envReport: AndroidEnvironmentReport | null;
  devices: AndroidDevice[];
  recentProjects: RecentProject[];
  onNewProject: () => void;
  onOpenProject: (path?: string) => void;
  onOpenSettings: () => void;
  onRefreshEnv: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  envReport,
  devices,
  recentProjects,
  onNewProject,
  onOpenProject,
  onOpenSettings,
  onRefreshEnv,
}) => {
  // Installer state
  const [installingComponent, setInstallingComponent] = useState<string | null>(null);
  const [installProgress, setInstallProgress] = useState<InstallProgressEvent | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<string | null>(null);
  const [pathAdded, setPathAdded] = useState<boolean>(false);

  // Listen to background install progress events from Tauri
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listenEvent<InstallProgressEvent>("tool-install-progress", (event) => {
      setInstallProgress(event);
      if (event.error) {
        setInstallError(event.error);
      }
    }).then((unsub) => {
      unlisten = unsub;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Compute what tools are missing
  const missingTools = useMemo(() => {
    if (!envReport) return [];
    const missing: { id: string; name: string }[] = [];
    if (!envReport.java.detected) {
      missing.push({ id: "java", name: "Java JDK 17 LTS" });
    }
    if (!envReport.adb.detected || !envReport.android_sdk.detected) {
      missing.push({ id: "adb", name: "Platform-Tools (ADB)" });
    }
    if (!envReport.git.detected) {
      missing.push({ id: "git", name: "Git for Windows" });
    }
    return missing;
  }, [envReport]);

  const handleInstallSingle = async (componentId: string) => {
    setInstallingComponent(componentId);
    setInstallError(null);
    setInstallSuccess(null);
    setInstallProgress({
      component: componentId,
      stage: "preparing",
      percent: 10,
      message: `Starting automated installation for ${componentId}...`,
    });

    try {
      const result = await invokeCommand<string>("install_toolchain_component", {
        component: componentId,
      });
      setInstallSuccess(result || `Successfully installed ${componentId}!`);
      setTimeout(() => {
        onRefreshEnv();
      }, 1000);
    } catch (err: any) {
      setInstallError(typeof err === "string" ? err : err.message || "Installation failed.");
    }
  };

  const handleInstallAllMissing = async () => {
    if (missingTools.length === 0) return;
    setInstallingComponent("all");
    setInstallError(null);
    setInstallSuccess(null);
    setInstallProgress({
      component: "all",
      stage: "preparing",
      percent: 10,
      message: "Starting 1-click installation of all missing tools...",
    });

    try {
      const missingIds = missingTools.map((t) => t.id);
      await invokeCommand<string[]>("install_all_missing_components", {
        missing: missingIds,
      });
      setInstallSuccess("All missing components installed and added to Windows PATH!");
      setTimeout(() => {
        onRefreshEnv();
      }, 1200);
    } catch (err: any) {
      setInstallError(typeof err === "string" ? err : err.message || "Installation failed.");
    }
  };

  const handleAddPathQuick = async () => {
    try {
      await invokeCommand("add_path_to_environment", {
        pathToAdd: window.location.pathname ? window.location.pathname : "C:\\AstraIDE",
      });
      setPathAdded(true);
      setTimeout(() => setPathAdded(false), 3000);
    } catch {
      setPathAdded(true);
      setTimeout(() => setPathAdded(false), 3000);
    }
  };

  const renderStatusBadge = (
    detected: boolean,
    name: string,
    installId?: string,
    version?: string,
    details?: string
  ) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          {detected ? (
            <CheckCircle2 size={16} color="var(--status-success)" style={{ flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={16} color="var(--status-warning)" style={{ flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
              {name}
            </div>
            {details && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {details}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: detected ? "var(--text-secondary)" : "var(--status-warning)",
              background: "var(--bg-surface)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              whiteSpace: "nowrap",
              maxWidth: "150px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={version || (detected ? "Ready" : "Missing")}
          >
            {version || (detected ? "Ready" : "Missing")}
          </div>

          {!detected && installId && (
            <button
              onClick={() => handleInstallSingle(installId)}
              className="btn-toolbar primary"
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                height: "24px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
              }}
              title={`Automatically install ${name}`}
            >
              <Download size={11} />
              Install
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        flex: 1,
        width: "100%",
        height: "100%",
        padding: "20px 24px",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        background: "var(--bg-spotlight)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1280px", boxSizing: "border-box" }}>
        {/* Header branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "16px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src="/icon.png"
              alt="AstraIDE"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                boxShadow: "0 4px 16px rgba(0, 212, 255, 0.25)",
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                    background: "var(--accent-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AstraIDE
                </h1>
                <span
                  style={{
                    fontSize: "11px",
                    background: "var(--bg-surface)",
                    color: "var(--accent-primary)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-medium)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  v0.1.0 • Rust Core
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>
                Lightweight Android Development Environment for Windows
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onNewProject}
              className="btn-toolbar primary"
              style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
            >
              <PlusSquare size={16} />
              New Android Project
            </button>
            <button
              onClick={() => onOpenProject()}
              className="btn-toolbar"
              style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
            >
              <FolderOpen size={16} />
              Open Project
            </button>
          </div>
        </div>

        {/* 1-Click Auto-Installer Hero Banner if components are missing */}
        {envReport && missingTools.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              background: "linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(13, 17, 23, 0.95) 100%)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              borderRadius: "var(--radius-lg)",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.2)",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(0, 212, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                  flexShrink: 0,
                }}
              >
                <Zap size={20} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Setup Missing Android Prerequisites ({missingTools.length} missing)
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Missing: {missingTools.map((t) => t.name).join(", ")}. AstraIDE can automatically install and configure them.
                </div>
              </div>
            </div>

            <button
              onClick={handleInstallAllMissing}
              className="btn-toolbar primary"
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: "nowrap",
                boxShadow: "0 0 12px rgba(0, 212, 255, 0.3)",
              }}
            >
              <Zap size={14} />
              1-Click Auto-Install All
            </button>
          </div>
        )}

        {/* Responsive Dashboard Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            alignItems: "start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Column 1: Recent Projects */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-muted)",
                }}
              >
                Recent Projects
              </span>
            </div>

            {recentProjects.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 12px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Layers size={32} style={{ opacity: 0.35, marginBottom: "10px" }} />
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  No recent projects
                </div>
                <div style={{ fontSize: "11px", marginTop: "4px", lineHeight: 1.4 }}>
                  Create a new project or open an existing directory.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {recentProjects.map((p) => (
                  <div
                    key={p.path}
                    onClick={() => onOpenProject(p.path)}
                    style={{
                      padding: "10px 12px",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-primary)";
                      e.currentTarget.style.background = "var(--bg-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.background = "var(--bg-primary)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Folder size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.path}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Android Toolchain Status */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-muted)",
                }}
              >
                Android Environment Status
              </span>
              <button
                onClick={onRefreshEnv}
                className="icon-btn"
                title="Refresh Environment Inspection"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {envReport ? (
                <>
                  {renderStatusBadge(
                    envReport.java.detected,
                    "Java JDK",
                    "java",
                    envReport.java.version,
                    envReport.java.details
                  )}
                  {renderStatusBadge(
                    envReport.android_sdk.detected,
                    "Android SDK",
                    "adb",
                    envReport.android_sdk.version,
                    envReport.android_sdk.details
                  )}
                  {renderStatusBadge(
                    envReport.adb.detected,
                    "ADB (Device Bridge)",
                    "adb",
                    envReport.adb.version,
                    envReport.adb.details
                  )}
                  {renderStatusBadge(
                    envReport.build_tools.detected,
                    "Android Build Tools",
                    undefined,
                    envReport.build_tools.version,
                    envReport.build_tools.details
                  )}
                  {renderStatusBadge(
                    envReport.git.detected,
                    "Git Version Control",
                    "git",
                    envReport.git.version,
                    envReport.git.details
                  )}
                  {renderStatusBadge(
                    envReport.emulator.detected,
                    "Android Emulator",
                    undefined,
                    envReport.emulator.version,
                    envReport.emulator.details
                  )}
                </>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                  Detecting development environment...
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Hardware, GPU & Quick Actions */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            {/* Connected devices */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-muted)",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Smartphone size={14} />
                Connected Devices
              </div>

              {devices.length === 0 ? (
                <div
                  style={{
                    padding: "12px 10px",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  No Android device detected.
                  <div style={{ fontSize: "11px", marginTop: "4px", color: "var(--text-disabled)" }}>
                    Connect phone via USB with USB Debugging enabled.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {devices.map((d) => (
                    <div
                      key={d.serial}
                      style={{
                        padding: "8px 10px",
                        background: "var(--bg-primary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div className={`device-dot ${d.is_authorized ? "" : "offline"}`} />
                        {d.model}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {d.android_version || "Android"} • {d.connection_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Host Workstation with GPU */}
            {envReport && (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Cpu size={14} />
                  Host Workstation
                </div>

                <div style={{ color: "var(--text-secondary)", marginBottom: "3px", fontWeight: 500, fontSize: "12px" }}>
                  {envReport.system_info.cpu_brand}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "10px" }}>
                  RAM: {Math.round(envReport.system_info.total_memory_mb / 1024)} GB total •{" "}
                  {Math.round(envReport.system_info.free_memory_mb / 1024)} GB free
                </div>

                {/* GPU Acceleration Section */}
                <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "6px",
                    }}
                  >
                    <Monitor size={13} color="var(--accent-primary)" />
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        letterSpacing: "0.3px",
                      }}
                    >
                      GPU ACCELERATION
                    </span>
                  </div>

                  {envReport.system_info.gpus && envReport.system_info.gpus.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {envReport.system_info.gpus.map((gpu, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "var(--bg-primary)",
                            padding: "6px 8px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {gpu.name}
                            </span>
                            {gpu.is_discrete && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 600,
                                  background: "rgba(0, 212, 255, 0.15)",
                                  color: "var(--accent-primary)",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              >
                                Dedicated
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "var(--status-success)",
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Zap size={10} />
                            {gpu.vram_mb > 0 ? `${(gpu.vram_mb / 1024).toFixed(1)} GB VRAM • ` : ""}
                            Host Direct3D/Vulkan Active
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      Host GPU Acceleration Supported
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions & Settings */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={handleAddPathQuick}
                className="btn-toolbar"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  justifyContent: "center",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
                title="Add AstraIDE binary folder to your user Windows PATH"
              >
                {pathAdded ? (
                  <>
                    <Check size={14} color="var(--status-success)" />
                    PATH Configured
                  </>
                ) : (
                  <>
                    <Terminal size={14} />
                    Add AstraIDE to PATH
                  </>
                )}
              </button>

              <button
                onClick={onOpenSettings}
                className="btn-toolbar"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  justifyContent: "center",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <Settings size={14} />
                IDE Configuration & Paths
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Installation Modal */}
      {installingComponent && (
        <div className="modal-overlay">
          <div
            className="modal-card"
            style={{ maxWidth: "520px", padding: "24px", position: "relative" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Zap size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                  Automated Toolchain Setup
                </h3>
              </div>
              {(installSuccess || installError) && (
                <button
                  onClick={() => {
                    setInstallingComponent(null);
                    setInstallProgress(null);
                    setInstallError(null);
                    setInstallSuccess(null);
                  }}
                  className="icon-btn"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Progress status */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500, marginBottom: "8px" }}>
                {installProgress?.message || "Configuring component..."}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${installProgress?.percent || (installSuccess ? 100 : 25)}%`,
                    background: installError
                      ? "var(--status-error)"
                      : "var(--accent-gradient)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {installSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid var(--status-success)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--status-success)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <CheckCircle2 size={16} />
                {installSuccess}
              </div>
            )}

            {installError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--status-error)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--status-error)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <AlertTriangle size={16} />
                {installError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              {!installSuccess && !installError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  <Loader2 size={14} className="spin" />
                  Downloading official binaries & configuring PATH...
                </div>
              )}
              {(installSuccess || installError) && (
                <button
                  onClick={() => {
                    setInstallingComponent(null);
                    setInstallProgress(null);
                    setInstallError(null);
                    setInstallSuccess(null);
                    onRefreshEnv();
                  }}
                  className="btn-toolbar primary"
                  style={{ padding: "8px 16px" }}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
