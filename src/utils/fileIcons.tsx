import React from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  Image,
  Globe,
  GitBranch,
  KeyRound,
  Shield,
  Package,
  Terminal,
  Database,
  Film,
  Music,
  Settings,
  Layers,
  Cpu,
} from "lucide-react";

/**
 * Returns an appropriate icon element for a folder based on its name and expanded state.
 */
export function getFolderIcon(folderName: string, isExpanded: boolean, size = 15): React.ReactElement {
  const lower = folderName.toLowerCase();

  // Special folder badge colors
  if (lower === ".github" || lower === ".git") {
    return <GitBranch size={size} color="#f97316" />;
  }
  if (lower === "src" || lower === "source" || lower === "app") {
    return isExpanded ? <FolderOpen size={size} color="#00d2ff" /> : <Folder size={size} color="#00d2ff" />;
  }
  if (lower === "docs" || lower === "documentation") {
    return isExpanded ? <FolderOpen size={size} color="#a78bfa" /> : <Folder size={size} color="#a78bfa" />;
  }
  if (lower === "assets" || lower === "images" || lower === "res" || lower === "drawable") {
    return isExpanded ? <FolderOpen size={size} color="#ec4899" /> : <Folder size={size} color="#ec4899" />;
  }
  if (lower === "test" || lower === "tests" || lower === "__tests__") {
    return isExpanded ? <FolderOpen size={size} color="#10b981" /> : <Folder size={size} color="#10b981" />;
  }
  if (lower === "dist" || lower === "build" || lower === "target" || lower === "out") {
    return isExpanded ? <FolderOpen size={size} color="#f59e0b" /> : <Folder size={size} color="#f59e0b" />;
  }
  if (lower === "scripts" || lower === "bin") {
    return isExpanded ? <FolderOpen size={size} color="#06b6d4" /> : <Folder size={size} color="#06b6d4" />;
  }

  return isExpanded ? <FolderOpen size={size} color="#38bdf8" /> : <Folder size={size} color="#38bdf8" />;
}

/**
 * Returns an appropriate icon element for a file based on its filename and extension.
 */
export function getFileIconByName(fileName: string, size = 15): React.ReactElement {
  const lower = fileName.toLowerCase();

  // Exact filename matches
  if (lower === ".gitignore" || lower === ".gitattributes" || lower === ".gitmodules") {
    return <GitBranch size={size} color="#f97316" />;
  }
  if (lower.startsWith(".env")) {
    return <KeyRound size={size} color="#eab308" />;
  }
  if (lower.startsWith("license") || lower.startsWith("licence") || lower === "copying") {
    return <Shield size={size} color="#10b981" />;
  }
  if (lower === "security.md" || lower === "security.txt") {
    return <Shield size={size} color="#ef4444" />;
  }
  if (lower === "contributing.md") {
    return <FileText size={size} color="#8b5cf6" />;
  }
  if (lower === "readme.md" || lower === "readme.txt" || lower === "readme") {
    return <FileText size={size} color="#38bdf8" />;
  }
  if (lower === "androidmanifest.xml") {
    return <Layers size={size} color="#10b981" />;
  }
  if (lower === "package.json" || lower === "package-lock.json") {
    return <Package size={size} color="#f59e0b" />;
  }
  if (lower === "cargo.toml" || lower === "cargo.lock") {
    return <Cpu size={size} color="#f97316" />;
  }

  // Extension matching
  const ext = lower.includes(".") ? lower.split(".").pop() || "" : "";

  switch (ext) {
    // Kotlin / Java
    case "kt":
    case "kts":
      return <FileCode size={size} color="#a855f7" />;
    case "java":
      return <FileCode size={size} color="#f97316" />;

    // Web markup & styles
    case "html":
    case "htm":
      return <Globe size={size} color="#ea580c" />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <FileCode size={size} color="#2563eb" />;

    // TypeScript & JavaScript
    case "ts":
    case "tsx":
      return <FileCode size={size} color="#0284c7" />;
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return <FileCode size={size} color="#eab308" />;

    // XML / Android Layouts
    case "xml":
      return <FileCode size={size} color="#10b981" />;

    // Build & Config files
    case "gradle":
    case "properties":
      return <Settings size={size} color="#0284c7" />;
    case "json":
    case "jsonc":
    case "json5":
      return <FileCode size={size} color="#f59e0b" />;
    case "toml":
    case "yaml":
    case "yml":
    case "ini":
    case "conf":
      return <Settings size={size} color="#94a3b8" />;

    // Documentation & Text
    case "md":
    case "markdown":
    case "txt":
    case "log":
      return <FileText size={size} color="#94a3b8" />;

    // Images
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
    case "bmp":
      return <Image size={size} color="#10b981" />;

    // Shell & Scripts
    case "sh":
    case "bash":
    case "bat":
    case "cmd":
    case "ps1":
      return <Terminal size={size} color="#22c55e" />;

    // Android & Binaries
    case "apk":
    case "aab":
    case "aar":
    case "jar":
      return <Package size={size} color="#06b6d4" />;

    // Systems & Native
    case "rs":
      return <Cpu size={size} color="#f97316" />;
    case "c":
    case "cpp":
    case "cc":
    case "h":
    case "hpp":
      return <FileCode size={size} color="#3b82f6" />;
    case "py":
    case "pyw":
      return <FileCode size={size} color="#3b82f6" />;

    // Media & DB
    case "sql":
    case "sqlite":
    case "db":
      return <Database size={size} color="#06b6d4" />;
    case "mp4":
    case "mov":
    case "webm":
      return <Film size={size} color="#f43f5e" />;
    case "mp3":
    case "wav":
    case "ogg":
      return <Music size={size} color="#ec4899" />;

    default:
      return <File size={size} color="#64748b" />;
  }
}
