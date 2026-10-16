import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Hammer,
  Play,
  RotateCcw,
  PlusSquare,
  FolderOpen,
  List,
  Terminal,
  Layers,
  Smartphone,
  Package,
  HardDrive,
  GitBranch,
  Settings,
  X,
} from "lucide-react";

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
}) => {
  const [query, setQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: "flex-start", paddingTop: "80px" }}>
      <div
        className="modal-card"
        style={{ maxWidth: "600px", borderRadius: "var(--radius-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-secondary)",
          }}
        >
          <Search size={16} color="var(--accent-primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search action (e.g. Build, Run, Device, Logcat, SDK)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              background: "var(--bg-surface)",
              color: "var(--text-muted)",
              padding: "2px 6px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            ESC to close
          </span>
        </div>

        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "6px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "var(--bg-surface-hover)" : "transparent",
                    color: isSelected ? "var(--accent-primary)" : "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ opacity: isSelected ? 1 : 0.7 }}>{cmd.icon}</span>
                    <span style={{ fontWeight: 500 }}>{cmd.title}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          background: "var(--bg-surface)",
                          padding: "1px 6px",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
