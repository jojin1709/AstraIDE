import React, { useState } from "react";
import {
  Settings,
  X,
  Save,
  Shield,
  Terminal,
  Code,
  Cpu,
  HardDrive,
  User,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Trash2,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { AstraIdeConfig } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  config: AstraIdeConfig;
  onClose: () => void;
  onSave: (newConfig: AstraIdeConfig) => void;
  detectedSdkPath?: string;
  detectedJdkPath?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
  detectedSdkPath,
  detectedJdkPath,
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "editor" | "android" | "terminal" | "privacy" | "about"
  >("general");

  const [formData, setFormData] = useState<AstraIdeConfig>({ ...config });
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all settings to default configuration?")) {
      const defaults: AstraIdeConfig = {
        recent_projects: formData.recent_projects,
        theme: "dark",
        editor_font_size: 14,
        editor_tab_size: 4,
        editor_word_wrap: false,
        terminal_shell: "powershell",
        telemetry_enabled: false,
        auto_save: true,
      };
      setFormData(defaults);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "720px", height: "620px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={18} color="var(--accent-primary)" />
            <span className="modal-title">AstraIDE Settings</span>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
        >
          {/* Subnav Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-tertiary)",
              padding: "0 10px",
              gap: "2px",
              overflowX: "auto",
            }}
          >
            {[
              { id: "general", label: "General & Theme", icon: <Settings size={13} /> },
              { id: "editor", label: "Code Editor", icon: <Code size={13} /> },
              { id: "android", label: "Android Toolchain", icon: <Cpu size={13} /> },
              { id: "terminal", label: "Terminal", icon: <Terminal size={13} /> },
              { id: "privacy", label: "Privacy & Storage", icon: <Shield size={13} /> },
              { id: "about", label: "About & Developer", icon: <User size={13} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    activeTab === tab.id
                      ? "2px solid var(--accent-primary)"
                      : "2px solid transparent",
                  color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {/* GENERAL & THEME */}
            {activeTab === "general" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className="form-group">
                  <label className="form-label">Color Theme</label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="form-select"
                  >
                    <option value="dark">Professional Obsidian Dark (Default)</option>
                    <option value="light">Clean Light Mode</option>
                  </select>
                  <span className="form-helper">
                    Switches IDE syntax styling, panels, and titlebar aesthetics.
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "var(--bg-primary)",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Application Behavior
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="chk-autosave"
                      checked={formData.auto_save}
                      onChange={(e) => setFormData({ ...formData, auto_save: e.target.checked })}
                    />
                    <label
                      htmlFor="chk-autosave"
                      style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      Enable Auto-Save when switching editor tabs or window focus
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="chk-hw"
                      defaultChecked={true}
                    />
                    <label
                      htmlFor="chk-hw"
                      style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      Enable GPU Hardware Acceleration for smooth 60 FPS rendering
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="checkbox"
                      id="chk-usb"
                      defaultChecked={true}
                    />
                    <label
                      htmlFor="chk-usb"
                      style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      Auto-detect USB Android devices when plugged in
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* CODE EDITOR */}
            {activeTab === "editor" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Font Family</label>
                    <select
                      value={formData.editor_font_family || "JetBrains Mono"}
                      onChange={(e) =>
                        setFormData({ ...formData, editor_font_family: e.target.value })
                      }
                      className="form-select"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <option value="JetBrains Mono">JetBrains Mono (Recommended)</option>
                      <option value="Fira Code">Fira Code</option>
                      <option value="Consolas">Consolas</option>
                      <option value="Segoe UI Mono">Segoe UI Mono</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Font Size ({formData.editor_font_size}px)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="range"
                        min={11}
                        max={22}
                        value={formData.editor_font_size}
                        onChange={(e) =>
                          setFormData({ ...formData, editor_font_size: Number(e.target.value) })
                        }
                        style={{ flex: 1 }}
                      />
                      <input
                        type="number"
                        min={11}
                        max={22}
                        value={formData.editor_font_size}
                        onChange={(e) =>
                          setFormData({ ...formData, editor_font_size: Number(e.target.value) })
                        }
                        className="form-input"
                        style={{ width: "60px", textAlign: "center" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Tab Size</label>
                    <select
                      value={formData.editor_tab_size}
                      onChange={(e) =>
                        setFormData({ ...formData, editor_tab_size: Number(e.target.value) })
                      }
                      className="form-select"
                    >
                      <option value={4}>4 Spaces (Standard Kotlin/Java)</option>
                      <option value={2}>2 Spaces</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Word Wrapping</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                      <input
                        type="checkbox"
                        id="chk-wrap"
                        checked={formData.editor_word_wrap}
                        onChange={(e) =>
                          setFormData({ ...formData, editor_word_wrap: e.target.checked })
                        }
                      />
                      <label
                        htmlFor="chk-wrap"
                        style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                      >
                        Wrap long lines automatically
                      </label>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    background: "var(--bg-primary)",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Editor Visual Features
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="checkbox" id="chk-gutter" defaultChecked={true} />
                    <label htmlFor="chk-gutter" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                      Show line numbers in editor gutter
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="checkbox" id="chk-active-line" defaultChecked={true} />
                    <label htmlFor="chk-active-line" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                      Highlight active cursor line
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="checkbox" id="chk-brackets" defaultChecked={true} />
                    <label htmlFor="chk-brackets" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                      Auto-close brackets, quotes, and XML tags
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ANDROID TOOLCHAIN */}
            {activeTab === "android" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Android SDK Path</label>
                    {detectedSdkPath && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, custom_sdk_path: detectedSdkPath })}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-primary)",
                          fontSize: "11px",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Auto-Fill Detected SDK
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Leave empty for auto-detection (ANDROID_HOME or AppData\Local\Android\Sdk)"
                    value={formData.custom_sdk_path || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_sdk_path: e.target.value || undefined })
                    }
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                  />
                  <span className="form-helper">
                    Must contain platform-tools (adb.exe), build-tools, and platforms.
                  </span>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">Java JDK Path</label>
                    {detectedJdkPath && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, custom_jdk_path: detectedJdkPath })}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-primary)",
                          fontSize: "11px",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Auto-Fill Detected JDK
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Leave empty for auto-detection (JAVA_HOME or system PATH)"
                    value={formData.custom_jdk_path || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, custom_jdk_path: e.target.value || undefined })
                    }
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}
                  />
                  <span className="form-helper">
                    JDK 17 or 21 directory containing bin\java.exe.
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Default Gradle Task</label>
                    <select
                      value={formData.gradle_default_task || "assembleDebug"}
                      onChange={(e) =>
                        setFormData({ ...formData, gradle_default_task: e.target.value })
                      }
                      className="form-select"
                    >
                      <option value="assembleDebug">assembleDebug (Fastest for testing)</option>
                      <option value="assembleRelease">assembleRelease (Production APK)</option>
                      <option value="build">build (Compile + Lint + Test)</option>
                      <option value="clean assembleDebug">clean assembleDebug</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ADB Server Port</label>
                    <input
                      type="text"
                      defaultValue="5037"
                      className="form-input"
                      style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TERMINAL */}
            {activeTab === "terminal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Default Integrated Shell</label>
                  <select
                    value={formData.terminal_shell}
                    onChange={(e) => setFormData({ ...formData, terminal_shell: e.target.value })}
                    className="form-select"
                  >
                    <option value="powershell">Windows PowerShell (Default)</option>
                    <option value="cmd">Command Prompt (CMD)</option>
                  </select>
                  <span className="form-helper">
                    Launches automatically inside your active Android project directory.
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    background: "var(--bg-primary)",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Terminal Options
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="checkbox" id="chk-term-clear" defaultChecked={true} />
                    <label htmlFor="chk-term-clear" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                      Clear terminal buffer automatically before starting Gradle builds
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input type="checkbox" id="chk-term-scroll" defaultChecked={true} />
                    <label htmlFor="chk-term-scroll" style={{ fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                      Auto-scroll to latest output line on process execution
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY & STORAGE */}
            {activeTab === "privacy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Shield size={18} color="var(--status-success)" />
                    <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                      100% Offline & Private by Design
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    AstraIDE runs strictly locally on Windows. Your Android code, signing keys,
                    keystores, and device logs are never uploaded or telemetried to external servers.
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "10px",
                      marginTop: "4px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="chk-telemetry"
                      checked={formData.telemetry_enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, telemetry_enabled: e.target.checked })
                      }
                    />
                    <label
                      htmlFor="chk-telemetry"
                      style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      Enable anonymous local crash diagnostics (Default: Disabled)
                    </label>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                      Clear Temporary Build Artifacts
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Clears intermediate cached scan data and diagnostic buffers.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="btn-toolbar"
                    style={{ fontSize: "12px" }}
                  >
                    {cacheCleared ? (
                      <>
                        <CheckCircle2 size={13} color="var(--status-success)" />
                        Cache Cleared!
                      </>
                    ) : (
                      <>
                        <Trash2 size={13} />
                        Clear Caches
                      </>
                    )}
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Reset IDE configuration to defaults
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="btn-toolbar"
                    style={{ fontSize: "11px", color: "var(--status-error)" }}
                  >
                    <RotateCcw size={12} />
                    Reset to Factory Defaults
                  </button>
                </div>
              </div>
            )}

            {/* ABOUT & DEVELOPER (JOJIN JOHN) */}
            {activeTab === "about" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Hero card */}
                <div
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                  }}
                >
                  <img
                    src="/icon.png"
                    alt="AstraIDE"
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "14px",
                      boxShadow: "0 4px 16px rgba(0, 212, 255, 0.25)",
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h2
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          background: "var(--accent-gradient)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          margin: 0,
                        }}
                      >
                        AstraIDE
                      </h2>
                      <span
                        style={{
                          fontSize: "11px",
                          background: "var(--bg-surface)",
                          color: "var(--accent-primary)",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        v0.1.0 (Windows Native)
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Lightweight Android Development Environment for Windows
                    </div>
                  </div>
                </div>

                {/* Developer card */}
                <div
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-lg)",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--accent-primary)",
                    }}
                  >
                    Architect & Developer
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                        JOJIN JOHN
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Lead Architect & Full Stack Software Engineer
                      </div>
                    </div>
                    <a
                      href="https://github.com/jojin1709"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-toolbar"
                      style={{ fontSize: "12px", textDecoration: "none" }}
                    >
                      <User size={13} />
                      @jojin1709
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                {/* Technical highlights */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Core Engine</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                      Rust 2021 + Tauri 2.x
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      ~180–220 MB idle RAM footprint
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Code Editor</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                      CodeMirror 6
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Kotlin, Java, XML, Gradle syntax
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 4px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>License: MIT (Open Source)</span>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <a
                      href="https://github.com/jojin1709/AstraIDE"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent-primary)", textDecoration: "none" }}
                    >
                      GitHub Repo
                    </a>
                    <a
                      href="https://github.com/jojin1709/AstraIDE/releases"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--accent-primary)", textDecoration: "none" }}
                    >
                      Releases & Updates
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-toolbar">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-toolbar primary"
              style={{ padding: "8px 20px" }}
            >
              <Save size={14} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
