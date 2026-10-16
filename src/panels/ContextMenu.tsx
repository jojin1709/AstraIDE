import React, { useEffect, useRef } from "react";
import {
  Play,
  Hammer,
  RotateCcw,
  Copy,
  Scissors,
  Clipboard,
  Search,
  Save,
  Terminal,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Info,
  Layers,
} from "lucide-react";

export interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRun: () => void;
  onBuild: () => void;
  onClean: () => void;
  onSave?: () => void;
  onOpenFolder: () => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenCommandPalette: () => void;
  onRefreshEnv: () => void;
  isDarkMode: boolean;
  hasActiveFile: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onRun,
  onBuild,
  onClean,
  onSave,
  onOpenFolder,
  onToggleTheme,
  onOpenSettings,
  onOpenCommandPalette,
  onRefreshEnv,
  isDarkMode,
  hasActiveFile,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Adjust coordinates if menu would overflow viewport
  const menuWidth = 230;
  const menuHeight = 360;
  const adjustedX = x + menuWidth > window.innerWidth ? Math.max(10, window.innerWidth - menuWidth - 10) : x;
  const adjustedY = y + menuHeight > window.innerHeight ? Math.max(10, window.innerHeight - menuHeight - 10) : y;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const handleCopy = async () => {
    try {
      const selection = window.getSelection()?.toString();
      if (selection) {
        await navigator.clipboard.writeText(selection);
      }
    } catch (e) {
      console.warn("Copy error:", e);
    }
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand("insertText", false, text);
    } catch (e) {
      console.warn("Paste error:", e);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={() => handleAction(onRun)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Play size={13} color="var(--status-success)" />
          Run on Device
        </span>
        <span className="context-menu-shortcut">F5</span>
      </button>

      <button className="context-menu-item" onClick={() => handleAction(onBuild)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Hammer size={13} color="var(--accent-primary)" />
          Build Debug APK
        </span>
        <span className="context-menu-shortcut">Ctrl+B</span>
      </button>

      <button className="context-menu-item" onClick={() => handleAction(onClean)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <RotateCcw size={13} />
          Clean Project Build
        </span>
      </button>

      <div className="context-menu-separator" />

      {hasActiveFile && (
        <button className="context-menu-item" onClick={() => handleAction(onSave || (() => {}))}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Save size={13} />
            Save Active File
          </span>
          <span className="context-menu-shortcut">Ctrl+S</span>
        </button>
      )}

      <button className="context-menu-item" onClick={handleCopy}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Copy size={13} />
          Copy
        </span>
        <span className="context-menu-shortcut">Ctrl+C</span>
      </button>

      <button className="context-menu-item" onClick={handlePaste}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clipboard size={13} />
          Paste
        </span>
        <span className="context-menu-shortcut">Ctrl+V</span>
      </button>

      <div className="context-menu-separator" />

      <button className="context-menu-item" onClick={() => handleAction(onOpenCommandPalette)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={13} color="var(--accent-primary)" />
          Command Palette...
        </span>
        <span className="context-menu-shortcut">Ctrl+Shift+P</span>
      </button>

      <button className="context-menu-item" onClick={() => handleAction(onOpenFolder)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderOpen size={13} />
          Open Project Directory...
        </span>
      </button>

      <button className="context-menu-item" onClick={() => handleAction(onRefreshEnv)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <RotateCcw size={13} />
          Refresh Environment Paths
        </span>
      </button>

      <button className="context-menu-item" onClick={() => handleAction(onToggleTheme)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isDarkMode ? <Sun size={13} color="#f59e0b" /> : <Moon size={13} color="#0284c7" />}
          Switch to {isDarkMode ? "Light Mode" : "Dark Mode"}
        </span>
      </button>

      <div className="context-menu-separator" />

      <button className="context-menu-item" onClick={() => handleAction(onOpenSettings)}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings size={13} />
          AstraIDE Settings...
        </span>
        <span className="context-menu-shortcut">Ctrl+,</span>
      </button>

      <div
        style={{
          padding: "6px 8px 4px 8px",
          marginTop: "2px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "10px",
          color: "var(--text-muted)",
        }}
      >
        <span>AstraIDE v0.1.0</span>
        <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>Dev: JOJIN JOHN</span>
      </div>
    </div>
  );
};
