import React, { useState } from "react";
import { Settings, X, Save, Shield, Terminal, Code, Cpu, HardDrive } from "lucide-react";
import { AstraIdeConfig } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  config: AstraIdeConfig;
  onClose: () => void;
  onSave: (newConfig: AstraIdeConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "editor" | "android" | "terminal" | "privacy">("general");
  const [formData, setFormData] = useState<AstraIdeConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={18} color="var(--accent-primary)" />
            <span className="modal-title">AstraIDE Settings</span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Subnav Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid var(--border-subtle)",
              background: "var(--bg-tertiary)",
              padding: "0 12px",
            }}
          >
            {[
              { id: "general", label: "General & Theme" },
              { id: "editor", label: "Code Editor" },
              { id: "android", label: "Android Toolchain" },
              { id: "terminal", label: "Terminal" },
              { id: "privacy", label: "Privacy & Data" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "10px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid var(--accent-primary)" : "2px solid transparent",
                  color: activeTab === tab.id ? "var(--accent-primary)" : "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="modal-body" style={{ flex: 1, overflowY: "auto" }}>
            {activeTab === "general" && (
              <>
                <div className="form-group">
                  <label className="form-label">Color Theme</label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="form-select"
                  >
                    <option value="dark">Professional Obsidian Dark (Default)</option>
                    <option value="light">Clean Light</option>
                  </select>
                </div>

                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="chk-autosave"
                    checked={formData.auto_save}
                    onChange={(e) => setFormData({ ...formData, auto_save: e.target.checked })}
                  />
                  <label htmlFor="chk-autosave" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                    Enable Auto-Save when switching tabs or focusing out
                  </label>
                </div>
              </>
            )}

            {activeTab === "editor" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Font Size (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={26}
                      value={formData.editor_font_size}
                      onChange={(e) => setFormData({ ...formData, editor_font_size: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tab Size (Spaces)</label>
                    <input
                      type="number"
                      min={2}
                      max={8}
                      value={formData.editor_tab_size}
                      onChange={(e) => setFormData({ ...formData, editor_tab_size: Number(e.target.value) })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="chk-wrap"
                    checked={formData.editor_word_wrap}
                    onChange={(e) => setFormData({ ...formData, editor_word_wrap: e.target.checked })}
                  />
                  <label htmlFor="chk-wrap" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                    Word wrap long code lines in editor
                  </label>
                </div>
              </>
            )}

            {activeTab === "android" && (
              <>
                <div className="form-group">
                  <label className="form-label">Android SDK Path Override</label>
                  <input
                    type="text"
                    placeholder="Leave empty to use ANDROID_HOME or AppData\Local\Android\Sdk"
                    value={formData.custom_sdk_path || ""}
                    onChange={(e) => setFormData({ ...formData, custom_sdk_path: e.target.value || undefined })}
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                  <span className="form-helper">
                    Directory containing platform-tools, build-tools, and platforms.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Java JDK Path Override</label>
                  <input
                    type="text"
                    placeholder="Leave empty to use JAVA_HOME or system PATH"
                    value={formData.custom_jdk_path || ""}
                    onChange={(e) => setFormData({ ...formData, custom_jdk_path: e.target.value || undefined })}
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                  <span className="form-helper">
                    Directory of JDK 17 or 21 containing bin\java.exe.
                  </span>
                </div>
              </>
            )}

            {activeTab === "terminal" && (
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
              </div>
            )}

            {activeTab === "privacy" && (
              <div
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={18} color="var(--status-success)" />
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                    AstraIDE Offline & Privacy Guarantee
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  AstraIDE is strictly an offline-first Windows desktop tool.
                  Your source code, keys, keystores, and build outputs never leave your local computer.
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="chk-telemetry"
                    checked={formData.telemetry_enabled}
                    onChange={(e) => setFormData({ ...formData, telemetry_enabled: e.target.checked })}
                  />
                  <label htmlFor="chk-telemetry" style={{ fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                    Enable anonymous crash diagnostics (Default: Disabled)
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-toolbar">
              Cancel
            </button>
            <button type="submit" className="btn-toolbar primary" style={{ padding: "8px 18px" }}>
              <Save size={14} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
