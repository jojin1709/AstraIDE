import React, { useState } from "react";
import { PlusSquare, X, FolderOpen, Layers, Check } from "lucide-react";
import { CreateProjectRequest } from "../types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (req: CreateProjectRequest) => void;
  defaultSdkPath?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultSdkPath,
}) => {
  const [name, setName] = useState<string>("MyAstraApp");
  const [packageName, setPackageName] = useState<string>("com.example.myastraapp");
  const [location, setLocation] = useState<string>("D:\\Projects");
  const [minSdk, setMinSdk] = useState<number>(24);
  const [targetSdk, setTargetSdk] = useState<number>(34);
  const [language, setLanguage] = useState<string>("kotlin");
  const [template, setTemplate] = useState<string>("empty");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !packageName.trim() || !location.trim()) return;

    onCreate({
      name: name.trim(),
      package_name: packageName.trim(),
      location: location.trim(),
      min_sdk: minSdk,
      target_sdk: targetSdk,
      language,
      template,
      custom_sdk_path: defaultSdkPath,
    });
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const sanitized = val.toLowerCase().replace(/[^a-z0-9]/g, "");
    setPackageName(`com.example.${sanitized || "app"}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PlusSquare size={18} color="var(--accent-primary)" />
            <span className="modal-title">Create New Android Project</span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Template selector */}
            <div className="form-group">
              <label className="form-label">Project Template</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  onClick={() => setTemplate("empty")}
                  style={{
                    padding: "12px",
                    background: template === "empty" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    border: template === "empty" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                    Empty Activity
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Standard Activity with layout, button interaction, and ConstraintLayout.
                  </div>
                </div>

                <div
                  onClick={() => setTemplate("basic")}
                  style={{
                    padding: "12px",
                    background: template === "basic" ? "var(--accent-primary-subtle)" : "var(--bg-primary)",
                    border: template === "basic" ? "1px solid var(--accent-primary)" : "1px solid var(--border-medium)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)" }}>
                    Basic Activity
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Includes Material Design theme, AppBar, and interaction toast.
                  </div>
                </div>
              </div>
            </div>

            {/* Project Name */}
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Package Name */}
            <div className="form-group">
              <label className="form-label">Package Name</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Project Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                required
              />
              <span className="form-helper">
                The project directory will be created at: {location}\{name}
              </span>
            </div>

            {/* Language & SDK settings in 2 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="form-select"
                >
                  <option value="kotlin">Kotlin (Recommended)</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Build System</label>
                <select className="form-select" disabled>
                  <option value="gradle">Gradle (Official)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Minimum SDK</label>
                <select
                  value={minSdk}
                  onChange={(e) => setMinSdk(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={24}>API 24 (Android 7.0 Nougat)</option>
                  <option value={26}>API 26 (Android 8.0 Oreo)</option>
                  <option value={28}>API 28 (Android 9.0 Pie)</option>
                  <option value={30}>API 30 (Android 11.0)</option>
                  <option value={33}>API 33 (Android 13.0)</option>
                  <option value={34}>API 34 (Android 14.0)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target SDK / Compile SDK</label>
                <select
                  value={targetSdk}
                  onChange={(e) => setTargetSdk(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={34}>API 34 (Android 14.0)</option>
                  <option value={35}>API 35 (Android 15.0)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-toolbar">
              Cancel
            </button>
            <button type="submit" className="btn-toolbar primary" style={{ padding: "8px 18px" }}>
              Generate Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
