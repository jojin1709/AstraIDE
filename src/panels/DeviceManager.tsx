import React, { useState, useEffect, useCallback } from "react";
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
  Monitor,
  BatteryCharging,
  Cpu,
  Loader2,
  Box,
  Layers,
} from "lucide-react";
import { AndroidDevice, AvdInfo } from "../types";
import { invokeCommand } from "../services/tauriBridge";

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
  const [avds, setAvds] = useState<AvdInfo[]>([]);
  const [isLaunchingAvd, setIsLaunchingAvd] = useState<string | null>(null);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const refreshAvds = useCallback(async () => {
    try {
      const list = await invokeCommand<AvdInfo[]>("list_avds");
      setAvds(list);
    } catch (e) {
      console.warn("Failed to list AVDs:", e);
    }
  }, []);

  useEffect(() => {
    refreshAvds();
  }, [refreshAvds, devices]);

  const handleLaunchEmulator = async (avdName: string) => {
    try {
      setIsLaunchingAvd(avdName);
      setLaunchMessage(`Booting ${avdName}...`);
      const msg = await invokeCommand<string>("launch_avd", { avdName });
      setLaunchMessage(msg);
      setTimeout(() => {
        onRefreshDevices();
        refreshAvds();
        setIsLaunchingAvd(null);
      }, 3500);
    } catch (e: any) {
      setLaunchMessage(`Error: ${e}`);
      setIsLaunchingAvd(null);
    }
  };

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
          <button
            onClick={() => {
              onRefreshDevices();
              refreshAvds();
            }}
            className="icon-btn"
            title="Refresh Devices & Emulators"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Launch status banner */}
        {launchMessage && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-primary-subtle)",
              border: "1px solid var(--accent-primary)",
              color: "var(--accent-primary)",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{launchMessage}</span>
            <button onClick={() => setLaunchMessage(null)} className="icon-btn" style={{ padding: 0 }}>
              <X size={12} />
            </button>
          </div>
        )}

        {/* SECTION 1: Connected Devices */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Smartphone size={12} />
            Connected Devices ({devices.length})
          </div>

          {devices.length === 0 ? (
            <div
              style={{
                padding: "18px 14px",
                textAlign: "center",
                background: "var(--bg-primary)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Smartphone size={28} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                No Physical Phone Connected
              </div>
              <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                Connect phone via USB and enable USB Debugging, or launch an AVD below.
              </div>
              <button
                onClick={onRefreshDevices}
                className="btn-toolbar primary"
                style={{ marginTop: "4px", fontSize: "11px", padding: "4px 10px" }}
              >
                Scan USB Devices
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {devices.map((device) => {
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
                        <div className={`device-dot ${device.is_authorized ? "" : "offline"}`} />
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                          {device.manufacturer ? `${device.manufacturer} ` : ""}
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

                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span>{device.android_version || "Android"}</span>
                      {device.api_level && <span>• {device.api_level}</span>}
                      <span>• {device.serial}</span>
                    </div>

                    {/* Hardware specs row */}
                    {(device.battery_level !== undefined || device.screen_size || device.cpu_abi) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                          background: "var(--bg-secondary)",
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {device.battery_level !== undefined && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <BatteryCharging size={11} color="#10b981" />
                            {device.battery_level}%
                          </span>
                        )}
                        {device.screen_size && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Monitor size={11} />
                            {device.screen_size}
                          </span>
                        )}
                        {device.cpu_abi && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Cpu size={11} />
                            {device.cpu_abi}
                          </span>
                        )}
                      </div>
                    )}

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
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: Android Virtual Devices (AVD Emulators) */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Monitor size={12} />
              Android Virtual Devices ({avds.length})
            </div>
            <button
              onClick={refreshAvds}
              className="icon-btn"
              style={{ width: "20px", height: "20px" }}
              title="Refresh AVDs"
            >
              <RefreshCw size={11} />
            </button>
          </div>

          {avds.length === 0 ? (
            <div
              style={{
                padding: "14px",
                textAlign: "center",
                background: "var(--bg-primary)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-lg)",
                color: "var(--text-muted)",
                fontSize: "11px",
              }}
            >
              No AVD emulators found in ~/.android/avd.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {avds.map((avd) => {
                const isLaunching = isLaunchingAvd === avd.name;

                return (
                  <div
                    key={avd.name}
                    style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-lg)",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                        {avd.name}
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                          background: avd.is_running ? "rgba(16, 185, 129, 0.15)" : "var(--bg-surface)",
                          color: avd.is_running ? "#10b981" : "var(--text-muted)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {avd.is_running ? "Running" : "Available"}
                      </span>
                    </div>

                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", display: "flex", gap: "8px" }}>
                      {avd.abi && <span>ABI: {avd.abi}</span>}
                      {avd.device_name && <span>• {avd.device_name}</span>}
                    </div>

                    <div style={{ marginTop: "4px" }}>
                      <button
                        onClick={() => handleLaunchEmulator(avd.name)}
                        disabled={isLaunching}
                        className="btn-toolbar primary"
                        style={{ width: "100%", justifyContent: "center", fontSize: "11px", padding: "5px 0" }}
                      >
                        {isLaunching ? (
                          <>
                            <Loader2 size={12} className="spin" />
                            Starting Emulator...
                          </>
                        ) : (
                          <>
                            <Play size={12} />
                            Launch Emulator
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Pre-built GrapheneOS Hardened Profile Card */}
        <div
          style={{
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
              <Shield size={14} color="var(--accent-primary)" />
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
            <div>VM: <strong>x86_64 Direct3D</strong></div>
            <div>RAM: <strong>4096 MB</strong></div>
            <div>Play: <strong>Sandboxed</strong></div>
            <div>Allocator: <strong>Hardened</strong></div>
          </div>
        </div>

        {/* SECTION 4: Built-in AstraIDE Core Plugins */}
        <div
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Box size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
              Engine Drivers & Plugins
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "11px", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Rust Win32 ADB Driver</span>
              <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 600 }}>READY</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Host GPU Acceleration (Direct3D)</span>
              <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 600 }}>ENABLED</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Gradle Automation Daemon</span>
              <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 600 }}>ACTIVE</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>AAPT2 Package Inspector</span>
              <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 600 }}>STANDBY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
