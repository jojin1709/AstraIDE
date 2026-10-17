import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  X,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  Circle,
  Square,
  Power,
  Volume2,
  Volume1,
  Camera,
  Send,
  Loader2,
  Play,
  Pause,
} from "lucide-react";
import { AndroidDevice } from "../types";
import { invokeCommand } from "../services/tauriBridge";

interface DeviceMirrorModalProps {
  device: AndroidDevice | null;
  isOpen: boolean;
  onClose: () => void;
  defaultSdkPath?: string;
}

export const DeviceMirrorModal: React.FC<DeviceMirrorModalProps> = ({
  device,
  isOpen,
  onClose,
  defaultSdkPath,
}) => {
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fetch screen frame
  const refreshScreen = async () => {
    if (!device) return;
    try {
      setIsRefreshing(true);
      const b64 = await invokeCommand<string>("take_screenshot", {
        serial: device.serial,
        customSdk: defaultSdkPath,
      });
      setScreenImage(b64);
    } catch (e) {
      console.warn("Screenshot capture error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !device) return;

    refreshScreen();

    let interval: NodeJS.Timeout | null = null;
    if (isAutoRefresh) {
      interval = setInterval(() => {
        refreshScreen();
      }, 1800);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, device, isAutoRefresh]);

  if (!isOpen || !device) return null;

  // Map click/touch event on image to real phone coordinates
  const handleScreenMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    dragStartRef.current = { x: relX, y: relY };
  };

  const handleScreenMouseUp = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current || !dragStartRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const endRelX = e.clientX - rect.left;
    const endRelY = e.clientY - rect.top;

    // Estimate real resolution or fallback to 1080x2400
    let phoneWidth = 1080;
    let phoneHeight = 2400;
    if (device.screen_size && device.screen_size.includes("x")) {
      const parts = device.screen_size.split("x");
      phoneWidth = parseInt(parts[0], 10) || 1080;
      phoneHeight = parseInt(parts[1], 10) || 2400;
    }

    const startX = Math.round((dragStartRef.current.x / rect.width) * phoneWidth);
    const startY = Math.round((dragStartRef.current.y / rect.height) * phoneHeight);
    const endX = Math.round((endRelX / rect.width) * phoneWidth);
    const endY = Math.round((endRelY / rect.height) * phoneHeight);

    const dist = Math.hypot(endX - startX, endY - startY);

    try {
      if (dist < 15) {
        // Tap
        setActionFeedback(`Tap (${startX}, ${startY})`);
        await invokeCommand("device_touch_tap", {
          serial: device.serial,
          x: startX,
          y: startY,
          customSdk: defaultSdkPath,
        });
      } else {
        // Swipe / Drag
        setActionFeedback(`Swipe (${startX}, ${startY}) -> (${endX}, ${endY})`);
        await invokeCommand("device_touch_swipe", {
          serial: device.serial,
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          durationMs: 300,
          customSdk: defaultSdkPath,
        });
      }

      // Fast update
      setTimeout(refreshScreen, 350);
    } catch (err) {
      console.warn("Input event error:", err);
    } finally {
      dragStartRef.current = null;
    }
  };

  const handleSendKey = async (keycode: number, name: string) => {
    try {
      setActionFeedback(`Key: ${name}`);
      await invokeCommand("device_send_key", {
        serial: device.serial,
        keycode,
        customSdk: defaultSdkPath,
      });
      setTimeout(refreshScreen, 300);
    } catch (e) {
      console.warn("Key error:", e);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setActionFeedback(`Typing: "${inputText}"`);
      await invokeCommand("device_send_text", {
        serial: device.serial,
        text: inputText,
        customSdk: defaultSdkPath,
      });
      setInputText("");
      setTimeout(refreshScreen, 400);
    } catch (e) {
      console.warn("Text input error:", e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          width: "480px",
          maxWidth: "95vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: "10px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Smartphone size={16} color="var(--accent-primary)" />
            <div>
              <span className="modal-title" style={{ fontSize: "13px" }}>
                {device.manufacturer ? `${device.manufacturer} ` : ""}
                {device.model} ({device.serial})
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`icon-btn ${isAutoRefresh ? "active" : ""}`}
              style={{ color: isAutoRefresh ? "#10b981" : "var(--text-muted)" }}
              title={isAutoRefresh ? "Auto-refresh active (click to pause)" : "Auto-refresh paused"}
            >
              {isAutoRefresh ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button
              onClick={refreshScreen}
              className="icon-btn"
              title="Refresh Screen Frame"
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
            </button>
            <button onClick={onClose} className="icon-btn">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Action feedback bar */}
        {actionFeedback && (
          <div
            style={{
              padding: "4px 14px",
              background: "rgba(0, 212, 255, 0.08)",
              borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: "var(--accent-primary)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{actionFeedback}</span>
            <span style={{ color: "var(--text-muted)" }}>Touch & Swipe Enabled</span>
          </div>
        )}

        {/* Live Phone Screen Container */}
        <div
          style={{
            flex: 1,
            background: "#05070d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            overflow: "hidden",
            userSelect: "none",
          }}
        >
          {screenImage ? (
            <img
              ref={imgRef}
              src={screenImage}
              alt="Device Screen"
              onMouseDown={handleScreenMouseDown}
              onMouseUp={handleScreenMouseUp}
              draggable={false}
              style={{
                maxHeight: "56vh",
                maxWidth: "100%",
                borderRadius: "12px",
                border: "2px solid #1e293b",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 212, 255, 0.2)",
                cursor: "pointer",
              }}
              title="Click to tap • Drag to swipe/scroll"
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-muted)",
              }}
            >
              <Loader2 size={24} className="spin" />
              <span style={{ fontSize: "12px" }}>Capturing screen buffer...</span>
            </div>
          )}
        </div>

        {/* Android Navigation & Control Bar */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderTop: "1px solid var(--border-subtle)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Hardware Touch Buttons: Back, Home, Recents, Power, Vol-, Vol+ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
            <button
              onClick={() => handleSendKey(4, "Back")}
              className="btn-toolbar"
              title="Android Back Button (Keycode 4)"
              style={{ padding: "6px 12px" }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleSendKey(3, "Home")}
              className="btn-toolbar"
              title="Android Home Button (Keycode 3)"
              style={{ padding: "6px 12px" }}
            >
              <Circle size={14} />
            </button>
            <button
              onClick={() => handleSendKey(187, "Recents (App Switcher)")}
              className="btn-toolbar"
              title="Android App Switcher (Keycode 187)"
              style={{ padding: "6px 12px" }}
            >
              <Square size={13} />
            </button>
            <button
              onClick={() => handleSendKey(25, "Volume Down")}
              className="btn-toolbar"
              title="Volume Down"
              style={{ padding: "6px 12px" }}
            >
              <Volume1 size={14} />
            </button>
            <button
              onClick={() => handleSendKey(24, "Volume Up")}
              className="btn-toolbar"
              title="Volume Up"
              style={{ padding: "6px 12px" }}
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={() => handleSendKey(26, "Power / Lock")}
              className="btn-toolbar"
              title="Power / Lock Screen (Keycode 26)"
              style={{ padding: "6px 12px" }}
            >
              <Power size={14} color="#ef4444" />
            </button>
          </div>

          {/* Quick text typing input into focused Android input */}
          <form onSubmit={handleSendText} style={{ display: "flex", gap: "6px" }}>
            <input
              type="text"
              placeholder="Type text to send to phone..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="form-input"
              style={{ flex: 1, height: "28px", fontSize: "11px" }}
            />
            <button
              type="submit"
              className="btn-toolbar primary"
              style={{ padding: "0 10px", height: "28px" }}
              title="Send text keystrokes to phone"
            >
              <Send size={12} />
              Type
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
