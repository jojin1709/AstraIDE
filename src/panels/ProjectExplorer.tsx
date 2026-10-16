import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit2,
  FilePlus2,
} from "lucide-react";
import { FileNode } from "../types";

interface ProjectExplorerProps {
  rootNode: FileNode | null;
  activeFilePath?: string;
  onSelectFile: (path: string) => void;
  onRefresh: () => void;
  onCreateFile: (parentPath: string, fileName: string) => void;
  onCreateFolder: (parentPath: string, folderName: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  onRevealInExplorer: (path: string) => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  rootNode,
  activeFilePath,
  onSelectFile,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onRevealInExplorer,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    [rootNode?.path || ""]: true,
    [`${rootNode?.path || ""}\\app`]: true,
    [`${rootNode?.path || ""}\\app\\src`]: true,
    [`${rootNode?.path || ""}\\app\\src\\main`]: true,
  });

  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null);
  const [creatingParentPath, setCreatingParentPath] = useState<string>("");
  const [newItemName, setNewItemName] = useState<string>("");

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const getFileIcon = (node: FileNode) => {
    if (node.is_dir) {
      return expandedPaths[node.path] ? (
        <FolderOpen size={15} color="#38bdf8" />
      ) : (
        <Folder size={15} color="#38bdf8" />
      );
    }

    const ext = node.extension?.toLowerCase();
    switch (ext) {
      case "kt":
      case "kts":
        return <FileCode size={15} color="#a855f7" />;
      case "java":
        return <FileCode size={15} color="#f97316" />;
      case "xml":
        return <FileCode size={15} color="#10b981" />;
      case "gradle":
      case "properties":
        return <FileCode size={15} color="#0284c7" />;
      case "json":
        return <FileCode size={15} color="#eab308" />;
      case "md":
        return <FileText size={15} color="#94a3b8" />;
      default:
        return <File size={15} color="#64748b" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (creatingType === "file") {
      onCreateFile(creatingParentPath, newItemName.trim());
    } else if (creatingType === "folder") {
      onCreateFolder(creatingParentPath, newItemName.trim());
    }

    setCreatingType(null);
    setNewItemName("");
    setExpandedPaths((prev) => ({ ...prev, [creatingParentPath]: true }));
  };

  const renderTree = (node: FileNode, level: number = 0) => {
    const isExpanded = Boolean(expandedPaths[node.path]);
    const isActive = activeFilePath === node.path;

    return (
      <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
        <div
          onClick={() => {
            if (node.is_dir) {
              toggleExpand(node.path);
            } else {
              onSelectFile(node.path);
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 8px 4px 0",
            paddingLeft: `${level * 16 + 8}px`,
            cursor: "pointer",
            fontSize: "12px",
            color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
            background: isActive ? "var(--bg-surface-hover)" : "transparent",
            borderLeft: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
            gap: "6px",
            userSelect: "none",
            transition: "all 0.1s ease",
          }}
          className="explorer-row"
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.background = "var(--bg-surface)";
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.background = "transparent";
          }}
        >
          {node.is_dir ? (
            <span style={{ display: "inline-flex", opacity: 0.7 }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span style={{ width: 14 }} />
          )}

          {getFileIcon(node)}

          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {node.name}
          </span>
        </div>

        {/* Inline create input if parent is this node */}
        {creatingType && creatingParentPath === node.path && (
          <form
            onSubmit={handleCreateSubmit}
            style={{
              paddingLeft: `${(level + 1) * 16 + 8}px`,
              paddingRight: "8px",
              paddingTop: "2px",
              paddingBottom: "2px",
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder={`New ${creatingType} name...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onBlur={() => setCreatingType(null)}
              className="form-input"
              style={{ padding: "2px 6px", fontSize: "11px", height: "24px", width: "100%" }}
            />
          </form>
        )}

        {node.is_dir && isExpanded && node.children && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {node.children.map((child) => renderTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <span>Project Explorer</span>
        </div>
        <div className="panel-actions">
          <button
            onClick={() => {
              const target = rootNode?.path || "";
              setCreatingParentPath(target);
              setCreatingType("file");
            }}
            className="icon-btn"
            title="New File"
          >
            <FilePlus2 size={14} />
          </button>
          <button
            onClick={() => {
              const target = rootNode?.path || "";
              setCreatingParentPath(target);
              setCreatingType("folder");
            }}
            className="icon-btn"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button onClick={onRefresh} className="icon-btn" title="Refresh Explorer">
            <RefreshCw size={14} />
          </button>
          {rootNode && (
            <button
              onClick={() => onRevealInExplorer(rootNode.path)}
              className="icon-btn"
              title="Reveal in Windows Explorer"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "6px 0",
        }}
      >
        {rootNode ? (
          renderTree(rootNode, 0)
        ) : (
          <div style={{ padding: "20px 14px", fontSize: "12px", color: "var(--text-muted)" }}>
            No project folder loaded.
          </div>
        )}
      </div>
    </div>
  );
};
