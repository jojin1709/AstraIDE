import React from "react";
import { Cpu, HardDrive, Activity, RefreshCw } from "lucide-react";
import { SystemResourceReport } from "../types";

interface ResourceMonitorPanelProps {
  metrics: SystemResourceReport | null;
  onRefresh: () => void;
}

export const ResourceMonitorPanel: React.FC<ResourceMonitorPanelProps> = ({
  metrics,
  onRefresh,
}) => {
  const renderProgressBar = (pct: number, color: string = "var(--accent-primary)") => {
    const clamped = Math.min(100, Math.max(0, pct));
    return (
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "4px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    );
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
          <Activity size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            Resource Monitor
          </h2>
        </div>
        <button onClick={onRefresh} className="btn-toolbar" style={{ fontSize: "12px" }}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {metrics ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* System Overview Card */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Workstation Resources (Real Hardware Metrics)
            </div>

            {/* CPU */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>CPU Load</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-primary)" }}>
                  {metrics.cpu_usage_pct}%
                </span>
              </div>
              {renderProgressBar(metrics.cpu_usage_pct, metrics.cpu_usage_pct > 80 ? "var(--status-error)" : "var(--accent-primary)")}
            </div>

            {/* Memory */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>RAM Utilization</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                  {Math.round(metrics.used_memory_mb / 1024 * 10) / 10} GB / {Math.round(metrics.total_memory_mb / 1024 * 10) / 10} GB ({metrics.memory_usage_pct}%)
                </span>
              </div>
              {renderProgressBar(metrics.memory_usage_pct, metrics.memory_usage_pct > 85 ? "var(--status-warning)" : "#38bdf8")}
            </div>

            {/* Disk */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Disk Space ({metrics.primary_disk_name})</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                  {metrics.primary_disk_used_gb} GB / {metrics.primary_disk_total_gb} GB ({metrics.primary_disk_pct}%)
                </span>
              </div>
              {renderProgressBar(metrics.primary_disk_pct, "#10b981")}
            </div>
          </div>

          {/* Process Breakdown Card */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Process Memory Consumption
            </div>

            {/* AstraIDE Process */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {metrics.astra_ide_process.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  PID: {metrics.astra_ide_process.pid} • CPU: {metrics.astra_ide_process.cpu_pct.toFixed(1)}%
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-primary)" }}>
                {metrics.astra_ide_process.memory_mb} MB
              </div>
            </div>

            {/* Gradle Process */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Gradle Daemon / JVM
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {metrics.gradle_daemon_memory_mb ? "Active background Gradle worker" : "Idle (Daemon not running)"}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: metrics.gradle_daemon_memory_mb ? "var(--text-primary)" : "var(--text-disabled)" }}>
                {metrics.gradle_daemon_memory_mb ? `${metrics.gradle_daemon_memory_mb} MB` : "0 MB"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
          Reading system resource metrics...
        </div>
      )}
    </div>
  );
};
