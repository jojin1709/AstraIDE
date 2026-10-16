import React, { useState } from "react";
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  FileText,
  RefreshCw,
  Check,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { GitRepoStatus, GitDiffResult } from "../types";

interface GitPanelProps {
  status: GitRepoStatus | null;
  onRefresh: () => void;
  onStageFile: (file: string) => void;
  onUnstageFile: (file: string) => void;
  onCommit: (message: string) => void;
  onViewDiff: (file: string) => void;
  activeDiff: GitDiffResult | null;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  status,
  onRefresh,
  onStageFile,
  onUnstageFile,
  onCommit,
  onViewDiff,
  activeDiff,
}) => {
  const [commitMsg, setCommitMsg] = useState<string>("");

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commitMsg.trim()) {
      onCommit(commitMsg.trim());
      setCommitMsg("");
    }
  };

  if (!status || !status.is_repo) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "20px",
          textAlign: "center",
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <GitBranch size={36} style={{ opacity: 0.3, marginBottom: "12px" }} />
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          No Git Repository Detected
        </div>
        <div style={{ fontSize: "11px", marginTop: "4px" }}>
          This project directory is not a Git repository.
        </div>
      </div>
    );
  }

  const stagedFiles = status.files.filter((f) => f.is_staged);
  const unstagedFiles = status.files.filter((f) => !f.is_staged);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div className="panel-header">
        <div className="panel-title-group">
          <GitBranch size={14} color="var(--accent-primary)" />
          <span style={{ color: "var(--accent-primary)" }}>
            {status.current_branch || "main"}
          </span>
        </div>
        <button onClick={onRefresh} className="icon-btn" title="Refresh Git Status">
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Commit message box */}
        <form onSubmit={handleCommitSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <textarea
            placeholder="Commit message..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            className="form-input"
            rows={2}
            style={{ resize: "none", fontSize: "12px" }}
          />
          <button
            type="submit"
            disabled={!commitMsg.trim() || stagedFiles.length === 0}
            className="btn-toolbar primary"
            style={{ justifyContent: "center" }}
          >
            <GitCommit size={14} />
            Commit ({stagedFiles.length} staged)
          </button>
        </form>

        {/* Staged Changes */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Staged Changes ({stagedFiles.length})
          </div>
          {stagedFiles.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--text-disabled)", fontStyle: "italic" }}>
              No staged files. Click '+' on changed files below.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {stagedFiles.map((f) => (
                <div
                  key={f.path}
                  onClick={() => onViewDiff(f.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.path}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnstageFile(f.path);
                    }}
                    className="icon-btn"
                    title="Unstage"
                  >
                    <Minus size={13} color="var(--status-warning)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Changed Files */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Changes ({unstagedFiles.length})
          </div>
          {unstagedFiles.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--status-success)" }}>
              Working tree clean.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {unstagedFiles.map((f) => (
                <div
                  key={f.path}
                  onClick={() => onViewDiff(f.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.path}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageFile(f.path);
                    }}
                    className="icon-btn"
                    title="Stage changes"
                  >
                    <Plus size={13} color="var(--accent-primary)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diff Viewer if a file is clicked */}
        {activeDiff && (
          <div
            style={{
              marginTop: "8px",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "8px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
              Diff: {activeDiff.file_path}
            </div>
            <pre
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                lineHeight: "1.4",
                background: "#070b12",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                maxHeight: "180px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                color: "#e2e8f0",
              }}
            >
              {activeDiff.diff || "(No differences recorded)"}
            </pre>
          </div>
        )}

        {/* Recent Commits */}
        {status.recent_commits.length > 0 && (
          <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" }}>
              Recent Commits
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {status.recent_commits.map((c) => (
                <div key={c.hash} style={{ fontSize: "11px", display: "flex", gap: "6px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                    {c.hash}
                  </span>
                  <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
