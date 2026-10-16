import React, { useState } from "react";
import {
  HardDrive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { StorageAnalysisReport } from "../types";

interface StorageAnalyzerPanelProps {
  report: StorageAnalysisReport | null;
  onRefresh: () => void;
  onCleanProjectBuild: () => void;
}

export const StorageAnalyzerPanel: React.FC<StorageAnalyzerPanelProps> = ({
  report,
  onRefresh,
  onCleanProjectBuild,
}) => {
  const [confirmClean, setConfirmClean] = useState<boolean>(false);

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
          <HardDrive size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Android Development Storage Analyzer
          </h2>
        </div>
        <button onClick={onRefresh} className="btn-toolbar" style={{ fontSize: "12px" }}>
          <RefreshCw size={13} />
          Recalculate Storage
        </button>
      </div>

      {report && (
        <div
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Tracked Development Storage</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--accent-primary)" }}>
              {report.total_dev_storage_gb} GB
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "320px", textAlign: "right" }}>
            AstraIDE inspects Android SDK, Gradle caches, project builds, and emulator snapshots.
          </div>
        </div>
      )}

      {/* Categories List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {report?.categories.map((cat) => (
          <div
            key={cat.path}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                {cat.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--accent-primary)",
                }}
              >
                {cat.size_gb > 0 ? `${cat.size_gb} GB` : `${cat.size_mb} MB`}
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {cat.path}
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cat.description}</div>

            <div
              style={{
                fontSize: "11px",
                color: cat.safe_to_clean ? "var(--status-success)" : "var(--status-warning)",
                background: "var(--bg-secondary)",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{cat.clean_impact}</span>
              {cat.safe_to_clean && cat.name.includes("Active Project") && (
                <div>
                  {confirmClean ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          onCleanProjectBuild();
                          setConfirmClean(false);
                        }}
                        className="btn-toolbar danger"
                        style={{ padding: "2px 8px", fontSize: "11px" }}
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmClean(false)}
                        className="btn-toolbar"
                        style={{ padding: "2px 8px", fontSize: "11px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClean(true)}
                      className="btn-toolbar"
                      style={{ padding: "2px 8px", fontSize: "11px" }}
                    >
                      <Trash2 size={12} />
                      Clean Build Output
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
