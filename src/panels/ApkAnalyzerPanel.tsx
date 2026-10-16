import React, { useState } from "react";
import {
  Search,
  Package,
  Cpu,
  Layers,
  FileCode,
  Shield,
  Smartphone,
  ExternalLink,
  Upload,
} from "lucide-react";
import { ApkAnalysisReport } from "../types";

interface ApkAnalyzerPanelProps {
  report: ApkAnalysisReport | null;
  onSelectApkPath: (path: string) => void;
}

export const ApkAnalyzerPanel: React.FC<ApkAnalyzerPanelProps> = ({
  report,
  onSelectApkPath,
}) => {
  const [inputPath, setInputPath] = useState<string>("");

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      onSelectApkPath(inputPath.trim());
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
          <Package size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            APK Analyzer
          </h2>
        </div>
      </div>

      {/* Path selector form */}
      <form
        onSubmit={handleAnalyze}
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-primary)",
          padding: "12px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <input
          type="text"
          placeholder="Enter path to .apk file (e.g. D:\Projects\MyApp\app\build\outputs\apk\debug\app-debug.apk)..."
          value={inputPath}
          onChange={(e) => setInputPath(e.target.value)}
          className="form-input"
          style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "12px" }}
        />
        <button type="submit" className="btn-toolbar primary">
          <Search size={14} />
          Analyze APK
        </button>
      </form>

      {/* Analysis Output */}
      {report ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Top summary card */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Package Name</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)", wordBreak: "break-all" }}>
                {report.package_name || "Extracted from archive"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Version</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {report.version_name || "1.0"} (Code: {report.version_code || "1"})
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>SDK Targets</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                Min: {report.min_sdk || "24"} • Target: {report.target_sdk || "34"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>APK File Size</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--status-success)" }}>
                {report.file_size_mb} MB ({report.compression_ratio_pct}% compressed)
              </div>
            </div>
          </div>

          {/* DEX Files Breakdown */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              DEX Code ({report.dex_files.length} DEX files)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {report.dex_files.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    {d.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    {(d.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Native Libraries ABIs */}
          {report.native_abis.length > 0 && (
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                Native Libraries ({report.native_abis.length} architectures)
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {report.native_abis.map((abi) => (
                  <div
                    key={abi.abi}
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-medium)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 12px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--accent-primary)" }}>{abi.abi}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {abi.files.length} libraries ({(abi.total_size_bytes / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          {report.permissions.length > 0 && (
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                Permissions ({report.permissions.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {report.permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {perm.replace("android.permission.", "")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "var(--bg-primary)",
            borderRadius: "var(--radius-lg)",
            border: "1px dashed var(--border-medium)",
            color: "var(--text-muted)",
          }}
        >
          <Package size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            Select an Android APK to analyze
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>
            Extracts DEX composition, native libraries, manifest metadata, and permissions.
          </div>
        </div>
      )}
    </div>
  );
};
