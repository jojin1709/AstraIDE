import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowUpCircle,
  Shield,
  FileText,
} from "lucide-react";
import { UpdateInfo, UpdateProgressEvent } from "../types";
import { invokeCommand, listenEvent } from "../services/tauriBridge";

interface UpdateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  isChecking: boolean;
  onCheckUpdates: () => void;
}

export const UpdateCenterModal: React.FC<UpdateCenterModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isChecking,
  onCheckUpdates,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgressEvent | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unlisten = listenEvent<UpdateProgressEvent>("update-progress", (ev) => {
      setDownloadProgress(ev);
    });

    return () => {
      unlisten.then((u) => u());
    };
  }, []);

  if (!isOpen) return null;

  const handleStartUpdate = async () => {
    if (!updateInfo?.download_url || !updateInfo.asset_name) {
      setDownloadError("No downloadable installer asset found in this release.");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadSuccessMessage(null);

    try {
      const res = await invokeCommand<string>("download_and_install_update", {
        downloadUrl: updateInfo.download_url,
        assetName: updateInfo.asset_name,
      });
      setDownloadSuccessMessage(res);
    } catch (err: any) {
      setDownloadError(err.toString());
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(4, 7, 13, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "92vw",
          maxHeight: "88vh",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 210, 255, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-primary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ArrowUpCircle size={20} color="var(--accent-primary)" />
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                AstraIDE Update Center
              </h2>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Auto-update and latest release manager
              </div>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Version Comparison Card */}
          <div
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Current Version</span>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                {updateInfo?.current_version || "v0.1.0"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Latest Available</span>
              <div style={{ fontSize: "16px", fontWeight: 700, color: updateInfo?.update_available ? "var(--accent-primary)" : "var(--status-success)", marginTop: "4px" }}>
                {updateInfo?.latest_version || (isChecking ? "Checking..." : "Up to date")}
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          {isChecking ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--text-secondary)",
                fontSize: "12px",
              }}
            >
              <RefreshCw size={16} className="spin" color="var(--accent-primary)" />
              <span>Querying GitHub for latest AstraIDE release builds...</span>
            </div>
          ) : updateInfo?.update_available ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-primary-subtle)",
                border: "1px solid var(--accent-primary)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
                    {updateInfo.release_name || `Update ${updateInfo.latest_version} is available!`}
                  </span>
                </div>
                {updateInfo.asset_size_bytes && (
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                    {(updateInfo.asset_size_bytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>

              <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                A newer release of AstraIDE is ready to install with fixes and enhancements.
              </div>

              {/* Release Notes */}
              {updateInfo.release_notes && (
                <div
                  style={{
                    marginTop: "6px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    maxHeight: "140px",
                    overflowY: "auto",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FileText size={12} /> Release Notes:
                  </div>
                  {updateInfo.release_notes}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                background: "var(--status-success-bg)",
                border: "1px solid var(--status-success)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--status-success)",
                fontSize: "12px",
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>You are on the latest version!</strong>
                <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "2px" }}>
                  AstraIDE is fully up to date with the latest GitHub releases.
                </div>
              </div>
            </div>
          )}

          {/* Download Progress Bar if active */}
          {isDownloading && downloadProgress && (
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--accent-primary)" }}>{downloadProgress.status}</span>
                <span style={{ color: "var(--text-muted)" }}>{downloadProgress.percent}%</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  background: "var(--bg-secondary)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${downloadProgress.percent}%`,
                    background: "var(--accent-gradient)",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>
          )}

          {/* Download Error */}
          {downloadError && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--status-error-bg)",
                border: "1px solid var(--status-error)",
                color: "var(--status-error)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Download Success Message */}
          {downloadSuccessMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--status-success-bg)",
                border: "1px solid var(--status-success)",
                color: "var(--status-success)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{downloadSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-primary)",
          }}
        >
          <button
            onClick={onCheckUpdates}
            disabled={isChecking || isDownloading}
            className="btn-toolbar"
            style={{ fontSize: "12px" }}
          >
            <RefreshCw size={13} className={isChecking ? "spin" : ""} />
            Check for Updates
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            {updateInfo?.html_url && (
              <a
                href={updateInfo.html_url}
                target="_blank"
                rel="noreferrer"
                className="btn-toolbar"
                style={{ fontSize: "12px", textDecoration: "none" }}
              >
                <ExternalLink size={13} />
                GitHub Release
              </a>
            )}

            {updateInfo?.update_available && (
              <button
                onClick={handleStartUpdate}
                disabled={isDownloading}
                className="btn-toolbar primary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                <Download size={13} />
                {isDownloading ? "Updating..." : "Download & Install Update"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
