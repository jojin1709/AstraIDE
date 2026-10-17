import React, { useMemo } from "react";
import { Wifi, Battery, Signal, Smartphone, Sparkles, Image, CheckSquare } from "lucide-react";

interface AndroidLayoutPreviewProps {
  xmlContent: string;
  fileName: string;
}

interface ParsedViewElement {
  id: string;
  tag: string;
  text?: string;
  hint?: string;
  width?: string;
  height?: string;
  orientation?: "vertical" | "horizontal";
  gravity?: string;
  textColor?: string;
  backgroundColor?: string;
  children: ParsedViewElement[];
}

export const AndroidLayoutPreview: React.FC<AndroidLayoutPreviewProps> = ({
  xmlContent,
  fileName,
}) => {
  // Parse XML elements into visual nodes
  const rootElement = useMemo<ParsedViewElement | null>(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, "application/xml");
      const errorNode = doc.querySelector("parsererror");
      if (errorNode) {
        return null; // Invalid XML syntax while typing
      }

      const parseNode = (node: Element): ParsedViewElement | null => {
        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const tagName = node.tagName.split(".").pop() || node.tagName;
        
        // Helper to get android:* attribute
        const getAttr = (name: string): string | undefined => {
          return (
            node.getAttribute(`android:${name}`) ||
            node.getAttribute(name) ||
            node.getAttribute(`app:${name}`) ||
            undefined
          );
        };

        const text = getAttr("text");
        const hint = getAttr("hint");
        const width = getAttr("layout_width");
        const height = getAttr("layout_height");
        const orientation = (getAttr("orientation") as any) || "vertical";
        const gravity = getAttr("gravity");
        const textColor = getAttr("textColor");
        const backgroundColor = getAttr("background");

        const children: ParsedViewElement[] = [];
        for (let i = 0; i < node.children.length; i++) {
          const childParsed = parseNode(node.children[i]);
          if (childParsed) {
            children.push(childParsed);
          }
        }

        return {
          id: getAttr("id") || `${tagName}-${Math.random().toString(36).substring(7)}`,
          tag: tagName,
          text,
          hint,
          width,
          height,
          orientation,
          gravity,
          textColor,
          backgroundColor,
          children,
        };
      };

      return parseNode(doc.documentElement);
    } catch (e) {
      return null;
    }
  }, [xmlContent]);

  // Recursive renderer for Android UI elements
  const renderElement = (el: ParsedViewElement, index: number): React.ReactNode => {
    const isHorizontal = el.orientation === "horizontal";

    switch (el.tag.toLowerCase()) {
      case "textview":
        return (
          <div
            key={el.id + index}
            style={{
              padding: "6px 8px",
              fontSize: "14px",
              fontWeight: 500,
              color: el.textColor || "#e2e8f0",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {el.text || "TextView"}
          </div>
        );

      case "button":
      case "materialbutton":
        return (
          <button
            key={el.id + index}
            style={{
              padding: "10px 18px",
              background: "#38bdf8",
              color: "#0b0f17",
              border: "none",
              borderRadius: "20px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(56, 189, 248, 0.3)",
              margin: "6px 0",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: el.width === "match_parent" ? "100%" : "auto",
            }}
          >
            {el.text || "BUTTON"}
          </button>
        );

      case "edittext":
      case "textinputedittext":
        return (
          <div
            key={el.id + index}
            style={{
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#94a3b8",
              margin: "6px 0",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {el.text || el.hint || "Enter text..."}
          </div>
        );

      case "imageview":
        return (
          <div
            key={el.id + index}
            style={{
              width: "100%",
              height: "120px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px dashed rgba(56, 189, 248, 0.3)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "#38bdf8",
              margin: "8px 0",
            }}
          >
            <Image size={24} />
            <span style={{ fontSize: "11px" }}>ImageView</span>
          </div>
        );

      case "checkbox":
        return (
          <div
            key={el.id + index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 0",
              fontSize: "13px",
              color: "#e2e8f0",
            }}
          >
            <CheckSquare size={16} color="#38bdf8" />
            <span>{el.text || "CheckBox Option"}</span>
          </div>
        );

      case "progressbar":
        return (
          <div
            key={el.id + index}
            style={{
              width: "100%",
              height: "4px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              overflow: "hidden",
              margin: "8px 0",
            }}
          >
            <div
              style={{
                width: "45%",
                height: "100%",
                background: "#38bdf8",
                borderRadius: "2px",
              }}
            />
          </div>
        );

      case "linearlayout":
      case "constraintlayout":
      case "relativelayout":
      case "framelayout":
      case "scrollview":
      default:
        return (
          <div
            key={el.id + index}
            style={{
              display: "flex",
              flexDirection: isHorizontal ? "row" : "column",
              gap: "8px",
              width: "100%",
              flex: el.height === "match_parent" ? 1 : undefined,
              padding: "4px",
              boxSizing: "border-box",
            }}
          >
            {el.children.length > 0 ? (
              el.children.map((child, i) => renderElement(child, i))
            ) : (
              el.text ? <div style={{ fontSize: "13px" }}>{el.text}</div> : null
            )}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "100%",
        width: "100%",
        background: "#05080e",
        padding: "16px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Device Mockup Frame */}
      <div
        style={{
          width: "310px",
          height: "620px",
          borderRadius: "36px",
          border: "8px solid #1e293b",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 212, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b111e",
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Top Punch Hole Camera */}
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "#05080f",
            border: "1px solid #1e293b",
            zIndex: 30,
          }}
        />

        {/* Android Status Bar */}
        <div
          style={{
            height: "28px",
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "#cbd5e1",
            zIndex: 20,
            background: "rgba(11, 17, 30, 0.9)",
          }}
        >
          <span>12:00</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Signal size={11} />
            <Wifi size={11} />
            <Battery size={13} />
          </div>
        </div>

        {/* Android App Toolbar / Action Bar */}
        <div
          style={{
            height: "44px",
            background: "#0f172a",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#f8fafc",
          }}
        >
          <span>{fileName.replace(".xml", "")}</span>
        </div>

        {/* Screen Viewport / Rendered XML */}
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          {rootElement ? (
            renderElement(rootElement, 0)
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-muted)",
                textAlign: "center",
                gap: "8px",
              }}
            >
              <Smartphone size={32} style={{ opacity: 0.3 }} />
              <div style={{ fontSize: "12px" }}>Layout Preview Live</div>
              <div style={{ fontSize: "10px", maxWidth: "200px" }}>
                Edit XML layout elements to see interactive components live.
              </div>
            </div>
          )}
        </div>

        {/* Bottom Android Navigation Gesture Bar */}
        <div
          style={{
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "3px",
              borderRadius: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
