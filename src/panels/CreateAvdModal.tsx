import React, { useState, useEffect } from "react";
import { PlusSquare, X, Monitor, Cpu, Shield, Sparkles, Check, Loader2 } from "lucide-react";
import { CreateAvdRequest, SystemImageInfo } from "../types";
import { invokeCommand } from "../services/tauriBridge";

interface CreateAvdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvdCreated: () => void;
  defaultSdkPath?: string;
}

export const CreateAvdModal: React.FC<CreateAvdModalProps> = ({
  isOpen,
  onClose,
  onAvdCreated,
  defaultSdkPath,
}) => {
  const [name, setName] = useState<string>("Astra_Pixel_8_Pro");
  const [deviceProfile, setDeviceProfile] = useState<string>("pixel_7");
  const [systemImages, setSystemImages] = useState<SystemImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [ramMb, setRamMb] = useState<number>(4096);
  const [isGrapheneOs, setIsGrapheneOs] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available system images
  useEffect(() => {
    if (!isOpen) return;

    invokeCommand<SystemImageInfo[]>("list_system_images", { customSdk: defaultSdkPath })
      .then((imgs) => {
        setSystemImages(imgs);
        if (imgs.length > 0 && !selectedImage) {
          setSelectedImage(imgs[0].relative_path);
        }
      })
      .catch((e) => console.warn("Failed to fetch system images:", e));
  }, [isOpen, defaultSdkPath]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError(null);

    let screen_width = 1080;
    let screen_height = 2400;
    let screen_density = 420;

    if (deviceProfile === "pixel_8_pro") {
      screen_width = 1344;
      screen_height = 2992;
      screen_density = 480;
    } else if (deviceProfile === "galaxy_s23") {
      screen_width = 1080;
      screen_height = 2340;
      screen_density = 425;
    } else if (deviceProfile === "tablet_11") {
      screen_width = 1600;
      screen_height = 2560;
      screen_density = 320;
    }

    const req: CreateAvdRequest = {
      name: name.trim(),
      device_profile: deviceProfile,
      system_image_path: selectedImage || "system-images/android-34/google_apis/x86_64/",
      abi: selectedImage.includes("arm64") ? "arm64-v8a" : "x86_64",
      ram_mb: ramMb,
      screen_width,
      screen_height,
      screen_density,
      is_graphene_os: isGrapheneOs,
    };

    try {
      await invokeCommand<string>("create_custom_avd", { req, customSdk: defaultSdkPath });
      setIsCreating(false);
      onAvdCreated();
      onClose();
    } catch (err: any) {
      setError(err.toString());
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Monitor size={18} color="var(--accent-primary)" />
            <span className="modal-title">Create Custom Astra Virtual Device</span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && (
              <div
                style={{
                  background: "var(--status-error-bg)",
                  border: "1px solid var(--status-error)",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--status-error)",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}

            {/* AVD Name */}
            <div className="form-group">
              <label className="form-label">Virtual Device Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g. Astra_Pixel_8_Pro"
                required
              />
            </div>

            {/* Hardware Profile Presets */}
            <div className="form-group">
              <label className="form-label">Device Hardware Profile</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  onClick={() => setDeviceProfile("pixel_7")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: deviceProfile === "pixel_7" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    background: deviceProfile === "pixel_7" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                    Google Pixel 7
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    1080 x 2400 • 420 dpi
                  </div>
                </div>

                <div
                  onClick={() => setDeviceProfile("pixel_8_pro")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: deviceProfile === "pixel_8_pro" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    background: deviceProfile === "pixel_8_pro" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                    Google Pixel 8 Pro
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    1344 x 2992 • 480 dpi
                  </div>
                </div>

                <div
                  onClick={() => setDeviceProfile("galaxy_s23")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: deviceProfile === "galaxy_s23" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    background: deviceProfile === "galaxy_s23" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                    Samsung Galaxy S23
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    1080 x 2340 • 425 dpi
                  </div>
                </div>

                <div
                  onClick={() => setDeviceProfile("tablet_11")}
                  style={{
                    padding: "10px",
                    borderRadius: "var(--radius-md)",
                    border: deviceProfile === "tablet_11" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    background: deviceProfile === "tablet_11" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--text-primary)" }}>
                    Android Tablet 11"
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    1600 x 2560 • 320 dpi
                  </div>
                </div>
              </div>
            </div>

            {/* System Image Selector */}
            <div className="form-group">
              <label className="form-label">System Image / Android OS</label>
              {systemImages.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Using fallback system image (or download system image in SDK Manager).
                </div>
              ) : (
                <select
                  value={selectedImage}
                  onChange={(e) => setSelectedImage(e.target.value)}
                  className="form-select"
                >
                  {systemImages.map((img) => (
                    <option key={img.relative_path} value={img.relative_path}>
                      {img.api_level} ({img.tag} - {img.abi})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* RAM and Security in 2 Columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Emulated RAM Size</label>
                <select
                  value={ramMb}
                  onChange={(e) => setRamMb(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={2048}>2048 MB (2 GB)</option>
                  <option value={4096}>4096 MB (4 GB - Recommended)</option>
                  <option value={8192}>8192 MB (8 GB - High Performance)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Host GPU Acceleration</label>
                <div
                  style={{
                    padding: "8px 10px",
                    background: "var(--bg-primary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                    color: "var(--accent-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Cpu size={14} />
                  Direct3D 11/12 Host GPU
                </div>
              </div>
            </div>

            {/* GrapheneOS Profile Toggle */}
            <div
              onClick={() => setIsGrapheneOs(!isGrapheneOs)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: isGrapheneOs ? "rgba(0, 212, 255, 0.08)" : "var(--bg-primary)",
                border: isGrapheneOs ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
              }}
            >
              <Shield size={18} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Configure as GrapheneOS Hardened Profile
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  Applies hardened malloc security, no Google Play bloat, and sandbox isolation testing.
                </div>
              </div>
              <input type="checkbox" checked={isGrapheneOs} readOnly style={{ cursor: "pointer" }} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-toolbar">
              Cancel
            </button>
            <button type="submit" disabled={isCreating} className="btn-toolbar primary">
              {isCreating ? (
                <>
                  <Loader2 size={13} className="spin" />
                  Creating Virtual Device...
                </>
              ) : (
                <>
                  <PlusSquare size={13} />
                  Create Virtual Device
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
