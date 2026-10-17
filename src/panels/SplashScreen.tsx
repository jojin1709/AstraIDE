import React, { useEffect, useState } from "react";
import { X, Cpu, Zap, Shield, Sparkles } from "lucide-react";

interface SplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  isInitialLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isOpen,
  onClose,
  isInitialLoading = false,
}) => {
  const [progress, setProgress] = useState<number>(isInitialLoading ? 15 : 100);
  const [stageText, setStageText] = useState<string>(
    isInitialLoading ? "Initializing AstraIDE Rust Core..." : "Ready"
  );
  const [fadeout, setFadeout] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    if (isInitialLoading) {
      // Simulate real IDE startup progression
      const t1 = setTimeout(() => {
        setProgress(38);
        setStageText("Scanning Android SDK, NDK & Build-Tools...");
      }, 400);

      const t2 = setTimeout(() => {
        setProgress(65);
        setStageText("Detecting Host GPU Hardware & Direct3D...");
      }, 900);

      const t3 = setTimeout(() => {
        setProgress(88);
        setStageText("Connecting ADB Device Bridge & Emulators...");
      }, 1400);

      const t4 = setTimeout(() => {
        setProgress(100);
        setStageText("AstraIDE Ready • Starting Workspace");
      }, 1900);

      const t5 = setTimeout(() => {
        setFadeout(true);
      }, 2400);

      const t6 = setTimeout(() => {
        onClose();
        setFadeout(false);
      }, 2800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
      };
    }
  }, [isOpen, isInitialLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(4, 7, 13, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.4s ease",
        opacity: fadeout ? 0 : 1,
      }}
      onClick={() => {
        if (!isInitialLoading || progress >= 100) onClose();
      }}
    >
      {/* Splash Screen Container */}
      <div
        style={{
          position: "relative",
          width: "720px",
          maxWidth: "92vw",
          height: "420px",
          maxHeight: "85vh",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 210, 255, 0.15)",
          border: "1px solid rgba(0, 210, 255, 0.25)",
          backgroundColor: "#070c16",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Artwork Image Background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('/splash_art.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.92,
          }}
        />

        {/* Subtle Dark Vignette Gradients for Text Legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(7, 12, 22, 0.2) 0%, rgba(7, 12, 22, 0.75) 60%, rgba(7, 12, 22, 0.95) 100%), linear-gradient(to top, rgba(7, 12, 22, 0.92) 0%, transparent 40%)",
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {/* Release / Edition Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(11, 20, 36, 0.65)",
              border: "1px solid rgba(0, 210, 255, 0.3)",
              padding: "4px 10px",
              borderRadius: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <Sparkles size={12} color="#00d2ff" />
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "#00d2ff",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              NOVA 1 // 2026.1
            </span>
          </div>

          {/* Close button (if reopened manually) */}
          {!isInitialLoading && (
            <button
              onClick={onClose}
              className="icon-btn"
              style={{
                background: "rgba(11, 20, 36, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
              }}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "0 28px",
            display: "flex",
            justifyContent: "flex-end",
            textAlign: "right",
          }}
        >
          <div style={{ maxWidth: "340px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <img
                src="/icon.png"
                alt="AstraIDE"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  filter: "drop-shadow(0 0 12px rgba(0, 210, 255, 0.5))",
                }}
              />
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  margin: 0,
                  background: "linear-gradient(135deg, #ffffff 40%, #00d2ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AstraIDE
              </h1>
            </div>

            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "rgba(226, 232, 240, 0.9)",
                letterSpacing: "0.2px",
                marginBottom: "4px",
              }}
            >
              Lightweight Native Android IDE
            </div>

            <div
              style={{
                fontSize: "11px",
                color: "rgba(148, 163, 184, 0.8)",
                lineHeight: 1.4,
              }}
            >
              Zero-bloat workstation engine powered by Rust & Tauri. Designed for performance, instant startup, and hardware-accelerated development.
            </div>
          </div>
        </div>

        {/* Bottom Section: Progress Bar & Architecture Badges */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "20px 28px 24px",
            background: "linear-gradient(to top, rgba(7, 12, 22, 0.95), rgba(7, 12, 22, 0.4))",
          }}
        >
          {/* Loading status & percentage */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ color: "#00d2ff", fontWeight: 500 }}>{stageText}</span>
            <span style={{ color: "rgba(148, 163, 184, 0.8)" }}>{progress}%</span>
          </div>

          {/* Progress track */}
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #3a7bd5, #00d2ff)",
                boxShadow: "0 0 10px rgba(0, 210, 255, 0.8)",
                transition: "width 0.35s ease",
                borderRadius: "2px",
              }}
            />
          </div>

          {/* Footer Metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10px",
              color: "rgba(148, 163, 184, 0.7)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Zap size={11} color="#00d2ff" /> Rust & Tauri Native
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Cpu size={11} color="#10b981" /> Host GPU Acceleration
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Shield size={11} color="#a855f7" /> GrapheneOS Ready
              </span>
            </div>

            <div>
              <span>Build 2026.10 • Apache 2.0 / MIT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
