import React, { useState } from "react";
import {
  Layers,
  Folder,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderOpen,
  Save,
  Info,
} from "lucide-react";
import { SdkPackagesReport } from "../types";

interface SdkManagerPanelProps {
  report: SdkPackagesReport | null;
  onRefresh: () => void;
  onUpdateSdkPath: (newPath: string) => void;
}

export const SdkManagerPanel: React.FC<SdkManagerPanelProps> = ({
  report,
  onRefresh,
  onUpdateSdkPath,
}) => {
  const [sdkInput, setSdkInput] = useState<string>(report?.sdk_root || "");

  const handleSavePath = () => {
    if (sdkInput.trim()) {
      onUpdateSdkPath(sdkInput.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-secondary)",
        padding: "16px",
        overflowY: "auto",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Android SDK Manager
          </h2>
        </div>
        <button onClick={onRefresh} className="btn-toolbar" style={{ fontSize: "12px" }}>
          <RefreshCw size={13} />
          Refresh Packages
        </button>
      </div>

      {/* SDK Path Config Box */}
      <div
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Android SDK Location
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="text"
            value={sdkInput}
            onChange={(e) => setSdkInput(e.target.value)}
            placeholder="C:\Users\username\AppData\Local\Android\Sdk"
            className="form-input"
            style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "12px", boxSizing: "border-box" }}
          />
          <button
            onClick={handleSavePath}
            className="btn-toolbar primary"
            style={{ width: "100%", justifyContent: "center", padding: "8px" }}
          >
            <Save size={13} />
            Apply SDK Path
          </button>
        </div>
        {report && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <HardDrive size={12} />
            Total SDK Disk Usage: <strong>{(report.total_size_mb / 1024).toFixed(2)} GB</strong> ({report.total_size_mb} MB)
          </div>
        )}
      </div>

      {/* Installed Components Grid */}
      {report ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Platforms */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
              Installed SDK Platforms
            </div>
            {report.installed_platforms.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No Android platforms detected.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {report.installed_platforms.map((p) => (
                  <div
                    key={p.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "12px",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                      <CheckCircle2 size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        ({p.version})
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", flexShrink: 0 }}>
                      {p.size_mb} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Build Tools */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
              Installed Build-Tools
            </div>
            {report.installed_build_tools.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No build-tools detected.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {report.installed_build_tools.map((bt) => (
                  <div
                    key={bt.path}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "12px",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                      <CheckCircle2 size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{bt.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", flexShrink: 0 }}>
                      {bt.size_mb} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core Tools */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
              Platform-Tools & Extras
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {report.platform_tools && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "12px",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                    <CheckCircle2 size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{report.platform_tools.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", flexShrink: 0 }}>
                    {report.platform_tools.size_mb} MB
                  </span>
                </div>
              )}
              {report.emulator && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "12px",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
                    <CheckCircle2 size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{report.emulator.name}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px", flexShrink: 0 }}>
                    {report.emulator.size_mb} MB
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading SDK packages inspection...
        </div>
      )}
    </div>
  );
};
