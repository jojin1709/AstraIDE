import React from "react";
import {
  FolderOpen,
  PlusSquare,
  Smartphone,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  HardDrive,
  FileCode,
  Layers,
} from "lucide-react";
import { AndroidEnvironmentReport, AndroidDevice, RecentProject } from "../types";

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
  const renderStatusBadge = (detected: boolean, name: string, version?: string, details?: string) => {
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {detected ? (
            <CheckCircle2 size={16} color="var(--status-success)" />
          ) : (
            <AlertTriangle size={16} color="var(--status-warning)" />
          )}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
              {name}
            </div>
            {details && (
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                {details}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: detected ? "var(--text-secondary)" : "var(--status-warning)",
            background: "var(--bg-surface)",
            padding: "2px 8px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {version || (detected ? "Detected" : "Not Found")}
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
        justifyContent: "center",
        flex: 1,
        padding: "40px 20px",
        overflowY: "auto",
        background: "radial-gradient(ellipse at top, #111a2e 0%, var(--bg-primary) 70%)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "980px" }}>
        {/* Header branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img
              src="/favicon.png"
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
                    fontSize: "24px",
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
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Lightweight Android Development Environment for Windows
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onNewProject}
              className="btn-toolbar primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              <PlusSquare size={16} />
              New Android Project
            </button>
            <button
              onClick={() => onOpenProject()}
              className="btn-toolbar"
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              <FolderOpen size={16} />
              Open Project
            </button>
          </div>
        </div>

        {/* 3-Column Dashboard */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1.5fr 1fr",
            gap: "24px",
          }}
        >
          {/* Recent Projects */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
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
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "30px 10px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Layers size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
                <div style={{ fontSize: "13px", fontWeight: 500 }}>No recent projects</div>
                <div style={{ fontSize: "11px", marginTop: "4px" }}>
                  Create a new project or open an existing Android directory.
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
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {p.name}
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

          {/* Android Toolchain Status */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
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
                ↻
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {envReport ? (
                <>
                  {renderStatusBadge(
                    envReport.java.detected,
                    "Java JDK",
                    envReport.java.version,
                    envReport.java.details
                  )}
                  {renderStatusBadge(
                    envReport.android_sdk.detected,
                    "Android SDK",
                    envReport.android_sdk.version,
                    envReport.android_sdk.details
                  )}
                  {renderStatusBadge(
                    envReport.adb.detected,
                    "ADB (Device Bridge)",
                    envReport.adb.version,
                    envReport.adb.details
                  )}
                  {renderStatusBadge(
                    envReport.build_tools.detected,
                    "Android Build Tools",
                    envReport.build_tools.version,
                    envReport.build_tools.details
                  )}
                  {renderStatusBadge(
                    envReport.git.detected,
                    "Git Version Control",
                    envReport.git.version,
                    envReport.git.details
                  )}
                  {renderStatusBadge(
                    envReport.emulator.detected,
                    "Android Emulator",
                    envReport.emulator.version,
                    envReport.emulator.details
                  )}
                </>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  Detecting development environment...
                </div>
              )}
            </div>
          </div>

          {/* Quick Hardware & Devices */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
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
                  marginBottom: "12px",
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
                    Connect a phone via USB with USB Debugging enabled.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                        <div
                          className={`device-dot ${d.is_authorized ? "" : "offline"}`}
                        />
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

            {/* System Info */}
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
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Cpu size={14} />
                  Host Workstation
                </div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>
                  {envReport.system_info.cpu_brand}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  RAM: {Math.round(envReport.system_info.total_memory_mb / 1024)} GB total •{" "}
                  {Math.round(envReport.system_info.free_memory_mb / 1024)} GB free
                </div>
              </div>
            )}

            {/* Settings link */}
            <button
              onClick={onOpenSettings}
              className="btn-toolbar"
              style={{
                width: "100%",
                padding: "10px",
                justifyContent: "center",
              }}
            >
              <Settings size={14} />
              IDE Configuration & Paths
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
