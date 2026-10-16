import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { LogcatEntry } from "../types";

interface LogcatPanelProps {
  entries: LogcatEntry[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClear: () => void;
}

export const LogcatPanel: React.FC<LogcatPanelProps> = ({
  entries,
  isStreaming,
  onToggleStreaming,
  onClear,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (levelFilter !== "ALL") {
      result = result.filter((e) => e.level.toUpperCase() === levelFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.tag.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          e.pid.includes(q)
      );
    }

    // Window to last 1500 lines for maximum performance
    if (result.length > 1500) {
      result = result.slice(result.length - 1500);
    }

    return result;
  }, [entries, levelFilter, searchQuery]);

  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [filteredEntries, autoScroll]);

  const handleExport = () => {
    const rawText = filteredEntries.map((e) => e.raw).join("\n");
    const blob = new Blob([rawText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astraide-logcat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "VERBOSE":
        return "#94a3b8";
      case "DEBUG":
        return "#38bdf8";
      case "INFO":
        return "#10b981";
      case "WARN":
        return "#f59e0b";
      case "ERROR":
        return "#ef4444";
      case "FATAL":
        return "#ec4899";
      default:
        return "#cbd5e1";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#070b12",
      }}
    >
      {/* Control bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onToggleStreaming}
            className={`btn-toolbar ${isStreaming ? "" : "primary"}`}
            title={isStreaming ? "Pause streaming" : "Resume Logcat"}
          >
            {isStreaming ? <Pause size={14} /> : <Play size={14} />}
            {isStreaming ? "Pause" : "Resume"}
          </button>
          <button onClick={onClear} className="btn-toolbar" title="Clear current logs">
            <Trash2 size={14} />
            Clear
          </button>
          <button onClick={handleExport} className="btn-toolbar" title="Export logs to file">
            <Download size={14} />
            Export
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "500px" }}>
          {/* Level Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="form-select"
              style={{ padding: "3px 8px", fontSize: "11px", height: "26px" }}
            >
              <option value="ALL">All Levels</option>
              <option value="VERBOSE">Verbose</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
              <option value="FATAL">Fatal</option>
            </select>
          </div>

          {/* Search box */}
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={13}
              style={{
                position: "absolute",
                left: "8px",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search package, tag, message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: "26px",
                paddingRight: "8px",
                height: "26px",
                fontSize: "11px",
                width: "100%",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Autoscroll
          </label>
        </div>
      </div>

      {/* Virtualized/Optimized Log list */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: "1.5",
          padding: "6px 8px",
          color: "#cbd5e1",
        }}
      >
        {filteredEntries.length === 0 ? (
          <div style={{ color: "var(--text-disabled)", fontStyle: "italic", padding: "10px" }}>
            {entries.length === 0
              ? "Waiting for Logcat output from connected device..."
              : "No log lines matching current filter."}
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const levelColor = getLevelColor(entry.level);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "1px 4px",
                  borderRadius: "2px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {entry.timestamp && (
                  <span style={{ color: "#64748b", flexShrink: 0, fontSize: "10px" }}>
                    {entry.timestamp}
                  </span>
                )}
                {entry.pid && (
                  <span style={{ color: "#475569", flexShrink: 0, fontSize: "10px" }}>
                    {entry.pid}
                  </span>
                )}
                <span
                  style={{
                    color: levelColor,
                    fontWeight: 600,
                    width: "52px",
                    flexShrink: 0,
                    fontSize: "10px",
                  }}
                >
                  {entry.level}
                </span>
                <span
                  style={{
                    color: "#93c5fd",
                    fontWeight: 500,
                    flexShrink: 0,
                    maxWidth: "160px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.tag}:
                </span>
                <span style={{ color: levelColor === "#ef4444" ? "#fca5a5" : "#cbd5e1", wordBreak: "break-all" }}>
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
