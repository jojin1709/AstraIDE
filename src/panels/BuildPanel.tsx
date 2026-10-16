import React, { useEffect, useRef } from "react";
import {
  Play,
  Hammer,
  RotateCcw,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Smartphone,
  Search,
} from "lucide-react";
import { GradleBuildResult } from "../types";

interface BuildPanelProps {
  logs: Array<{ task: string; line: string; is_error: boolean }>;
  isBuilding: boolean;
  currentTask: string | null;
  lastResult: GradleBuildResult | null;
  onRunBuild: (task: string) => void;
  onClean: () => void;
  onClearLogs: () => void;
  onSelectApkForInspection?: (path: string) => void;
  onInstallApkToDevice?: (path: string) => void;
}

export const BuildPanel: React.FC<BuildPanelProps> = ({
  logs,
  isBuilding,
  currentTask,
  lastResult,
  onRunBuild,
  onClean,
  onClearLogs,
  onSelectApkForInspection,
  onInstallApkToDevice,
}) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      {/* Build Action Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => onRunBuild("assembleDebug")}
            disabled={isBuilding}
            className="btn-toolbar primary"
            title="Build debug APK"
          >
            <Hammer size={14} />
            Build Debug
          </button>
          <button
            onClick={() => onRunBuild("assembleRelease")}
            disabled={isBuilding}
            className="btn-toolbar"
            title="Build release APK"
          >
            <Package size={14} />
            Build Release
          </button>
          <button
            onClick={() => onRunBuild("assemble")}
            disabled={isBuilding}
            className="btn-toolbar"
            title="Assemble all variants"
          >
            <Play size={14} />
            Assemble
          </button>
          <button
            onClick={onClean}
            disabled={isBuilding}
            className="btn-toolbar"
            title="Clean project build directory"
          >
            <RotateCcw size={14} />
            Clean
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isBuilding && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--accent-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent-primary)",
                  animation: "pulse 1s infinite",
                }}
              />
              Executing {currentTask}...
            </div>
          )}

          {lastResult && !isBuilding && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              {lastResult.success ? (
                <span style={{ color: "var(--status-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={14} />
                  BUILD SUCCESSFUL ({lastResult.duration_seconds}s)
                </span>
              ) : (
                <span style={{ color: "var(--status-error)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <XCircle size={14} />
                  BUILD FAILED ({lastResult.duration_seconds}s)
                </span>
              )}
            </div>
          )}

          <button onClick={onClearLogs} className="btn-toolbar" style={{ fontSize: "11px", padding: "4px 8px" }}>
            Clear Output
          </button>
        </div>
      </div>

      {/* APK Banner if produced */}
      {lastResult?.apk_path && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            background: "rgba(16, 185, 129, 0.12)",
            borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
            fontSize: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileCheck size={16} color="var(--status-success)" />
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              Generated APK:
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--accent-primary)",
                background: "var(--bg-secondary)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {lastResult.apk_path} ({lastResult.apk_size_mb} MB)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {onInstallApkToDevice && (
              <button
                onClick={() => onInstallApkToDevice(lastResult.apk_path!)}
                className="btn-toolbar success"
                style={{ padding: "4px 10px", fontSize: "11px" }}
              >
                <Smartphone size={13} />
                Install to Device
              </button>
            )}
            {onSelectApkForInspection && (
              <button
                onClick={() => onSelectApkForInspection(lastResult.apk_path!)}
                className="btn-toolbar"
                style={{ padding: "4px 10px", fontSize: "11px" }}
              >
                <Search size={13} />
                Inspect in APK Analyzer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terminal log output */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          lineHeight: "1.5",
          backgroundColor: "#070b12",
          color: "#cbd5e1",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "var(--text-disabled)", fontStyle: "italic" }}>
            No Gradle execution active. Click "Build Debug" or "Assemble" to start.
          </div>
        ) : (
          logs.map((entry, idx) => {
            let color = "#cbd5e1";
            if (entry.line.startsWith("> Task") || entry.line.startsWith(":")) {
              color = "var(--accent-primary)";
            } else if (entry.is_error || entry.line.includes("FAILURE") || entry.line.includes("ERROR")) {
              color = "var(--status-error)";
            } else if (entry.line.includes("BUILD SUCCESSFUL")) {
              color = "var(--status-success)";
            }

            return (
              <div key={idx} style={{ color }}>
                {entry.line}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
