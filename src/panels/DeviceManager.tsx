import React, { useState } from "react";
import {
  Smartphone,
  Play,
  Download,
  Trash2,
  List,
  Camera,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
} from "lucide-react";
import { AndroidDevice } from "../types";

interface DeviceManagerProps {
  devices: AndroidDevice[];
  selectedSerial: string | null;
  onSelectDevice: (serial: string) => void;
  onRefreshDevices: () => void;
  onRestartAdb: () => void;
  onInstallApk: (serial: string) => void;
  onUninstallApp: (serial: string) => void;
  onOpenLogcat: (serial: string) => void;
  onTakeScreenshot: (serial: string) => void;
  onRunOnDevice: (serial: string) => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  selectedSerial,
  onSelectDevice,
  onRefreshDevices,
  onRestartAdb,
  onInstallApk,
  onUninstallApp,
  onOpenLogcat,
  onTakeScreenshot,
  onRunOnDevice,
}) => {
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
          <Smartphone size={14} />
          <span>Device Manager</span>
        </div>
        <div className="panel-actions">
          <button onClick={onRestartAdb} className="icon-btn" title="Restart ADB Server">
            <RotateCcw size={14} />
          </button>
          <button onClick={onRefreshDevices} className="icon-btn" title="Refresh Devices">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {devices.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              background: "var(--bg-primary)",
              border: "1px dashed var(--border-medium)",
              borderRadius: "var(--radius-lg)",
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Smartphone size={32} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              No Android Devices Detected
            </div>
            <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
              1. Connect your physical phone via USB.
              <br />
              2. Enable "Developer Options" & "USB Debugging".
              <br />
              3. Accept the computer debugging authorization prompt.
            </div>
            <button
              onClick={onRefreshDevices}
              className="btn-toolbar primary"
              style={{ marginTop: "8px", fontSize: "12px" }}
            >
              Scan for Devices
            </button>
          </div>
        ) : (
          devices.map((device) => {
            const isSelected = selectedSerial === device.serial;

            return (
              <div
                key={device.serial}
                onClick={() => onSelectDevice(device.serial)}
                style={{
                  background: isSelected ? "var(--bg-tertiary)" : "var(--bg-primary)",
                  border: isSelected ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      className={`device-dot ${device.is_authorized ? "" : "offline"}`}
                    />
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                      {device.model}
                    </div>
                    {device.is_graphene_os && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "var(--accent-primary-subtle)",
                          color: "var(--accent-primary)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Shield size={10} />
                        {device.os_variant || "GrapheneOS"}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      background: "var(--bg-surface)",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {device.connection_type}
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "8px" }}>
                  <span>{device.android_version || "Android"}</span>
                  {device.api_level && <span>• {device.api_level}</span>}
                  <span>• {device.serial}</span>
                </div>

                {/* Unauthorized Warning if phone prompt unaccepted */}
                {!device.is_authorized && (
                  <div
                    style={{
                      background: "var(--status-warning-bg)",
                      border: "1px solid var(--status-warning)",
                      padding: "8px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "11px",
                      color: "var(--status-warning)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong>Device unauthorized.</strong>
                      <br />
                      Please unlock the phone and accept the USB debugging prompt.
                    </div>
                  </div>
                )}

                {/* Device Actions */}
                {device.is_authorized && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginTop: "4px",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "8px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onRunOnDevice(device.serial)}
                      className="btn-toolbar primary"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      title="Build & Run on this device"
                    >
                      <Play size={12} />
                      Run
                    </button>
                    <button
                      onClick={() => onInstallApk(device.serial)}
                      className="btn-toolbar"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      title="Install selected APK"
                    >
                      <Download size={12} />
                      Install APK
                    </button>
                    <button
                      onClick={() => onOpenLogcat(device.serial)}
                      className="btn-toolbar"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      title="Stream Logcat"
                    >
                      <List size={12} />
                      Logcat
                    </button>
                    <button
                      onClick={() => onTakeScreenshot(device.serial)}
                      className="btn-toolbar"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      title="Take Screenshot from device"
                    >
                      <Camera size={12} />
                      Screenshot
                    </button>
                    <button
                      onClick={() => onUninstallApp(device.serial)}
                      className="btn-toolbar"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                      title="Uninstall app package"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Pre-built GrapheneOS Hardened Profile Card */}
        <div
          style={{
            marginTop: "8px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Shield size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                GrapheneOS Hardened Target
              </span>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                background: "var(--accent-primary-subtle)",
                color: "var(--accent-primary)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              Pre-built Profile
            </span>
          </div>

          <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Test app compatibility with GrapheneOS <strong>hardened_malloc</strong>, Sandboxed Google Play, and strict permissions.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              background: "var(--bg-secondary)",
              padding: "8px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div>VM: <strong>x86_64 Host Direct3D</strong></div>
            <div>RAM: <strong>4096 MB</strong></div>
            <div>Play: <strong>Sandboxed</strong></div>
            <div>Allocator: <strong>Hardened</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
