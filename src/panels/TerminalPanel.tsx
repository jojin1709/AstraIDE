import React, { useState, useRef, useEffect } from "react";
import { Terminal, Trash2, CornerDownLeft, Play } from "lucide-react";

interface TerminalPanelProps {
  cwd: string;
  lines: Array<{ line: string; is_error: boolean }>;
  shellType: string;
  onSetShellType: (shell: string) => void;
  onRunCommand: (cmd: string) => void;
  onClear: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  cwd,
  lines,
  shellType,
  onSetShellType,
  onRunCommand,
  onClear,
}) => {
  const [inputVal, setInputVal] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)]);
    setHistoryIndex(-1);
    setInputVal("");
    onRunCommand(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const prevIdx = historyIndex - 1;
        setHistoryIndex(prevIdx);
        setInputVal(history[prevIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal("");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#070b12",
        color: "#f1f5f9",
        fontFamily: "var(--font-mono)",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Terminal size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            Terminal
          </span>
          <select
            value={shellType}
            onChange={(e) => onSetShellType(e.target.value)}
            className="form-select"
            style={{ padding: "2px 6px", fontSize: "11px", height: "24px" }}
          >
            <option value="powershell">PowerShell</option>
            <option value="cmd">Command Prompt (CMD)</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => onRunCommand(".\\gradlew.bat --version")}
            className="btn-toolbar"
            style={{ fontSize: "11px", padding: "2px 6px" }}
          >
            gradlew --version
          </button>
          <button
            onClick={() => onRunCommand("adb devices -l")}
            className="btn-toolbar"
            style={{ fontSize: "11px", padding: "2px 6px" }}
          >
            adb devices
          </button>
          <button onClick={onClear} className="btn-toolbar" style={{ fontSize: "11px", padding: "2px 6px" }}>
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 14px",
          fontSize: "12px",
          lineHeight: "1.5",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        <div style={{ color: "#64748b", marginBottom: "8px" }}>
          AstraIDE Integrated Windows Terminal ({shellType === "cmd" ? "cmd.exe" : "PowerShell"})
          <br />
          Working directory: {cwd || "D:\\astraIDE"}
        </div>

        {lines.map((item, i) => (
          <div
            key={i}
            style={{
              color: item.is_error ? "var(--status-error)" : "#e2e8f0",
            }}
          >
            {item.line}
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* Command prompt input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 14px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            color: "var(--accent-primary)",
            fontWeight: 600,
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {cwd || "C:\\"}&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter shell command..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f8fafc",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
          }}
        />
        <button
          type="submit"
          className="btn-toolbar primary"
          style={{ padding: "4px 8px", fontSize: "11px" }}
        >
          <CornerDownLeft size={12} />
        </button>
      </form>
    </div>
  );
};
