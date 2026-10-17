import React, { useEffect, useRef, useState } from "react";
import { AndroidLayoutPreview } from "./AndroidLayoutPreview";
import { EditorState, Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldKeymap,
} from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";

// Language modes
import { java } from "@codemirror/lang-java";
import { xml } from "@codemirror/lang-xml";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { rust } from "@codemirror/lang-rust";
import { javascript } from "@codemirror/lang-javascript";

interface CodeEditorProps {
  content: string;
  filePath: string;
  isDirty?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  tabSize?: number;
  onChange: (value: string) => void;
  onSave?: () => void;
  onCursorChange?: (line: number, col: number) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  filePath,
  wordWrap = false,
  fontSize = 14,
  tabSize = 4,
  onChange,
  onSave,
  onCursorChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingFromProp = useRef(false);

  const isXml = filePath.toLowerCase().endsWith(".xml");
  const [viewMode, setViewMode] = useState<"code" | "split" | "preview">(
    isXml && filePath.toLowerCase().includes("layout") ? "split" : "code"
  );

  // Determine language extension by extension
  const getLanguageExtension = (path: string): Extension[] => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "kt":
      case "kts":
      case "java":
      case "gradle":
        return [java()];
      case "xml":
      case "html":
        return [xml()];
      case "json":
        return [json()];
      case "md":
        return [markdown()];
      case "rs":
        return [rust()];
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return [javascript({ typescript: true })];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Custom theme styling
    const customTheme = EditorView.theme({
      "&": {
        height: "100%",
        fontSize: `${fontSize}px`,
        fontFamily: "var(--font-mono)",
        backgroundColor: "var(--bg-primary)",
      },
      ".cm-content": {
        padding: "8px 0",
      },
      ".cm-scroller": {
        fontFamily: "var(--font-mono)",
        lineHeight: "1.6",
      },
      ".cm-gutters": {
        backgroundColor: "var(--bg-secondary)",
        color: "var(--text-disabled)",
        borderRight: "1px solid var(--border-subtle)",
        paddingRight: "8px",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--bg-surface)",
        color: "var(--accent-primary)",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      },
      ".cm-selectionMatch": {
        backgroundColor: "rgba(0, 212, 255, 0.2)",
      },
    });

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      oneDark,
      customTheme,
      EditorState.tabSize.of(tabSize),
      ...getLanguageExtension(filePath),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        {
          key: "Mod-s",
          run: () => {
            if (onSave) onSave();
            return true;
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isUpdatingFromProp.current) {
          const newDoc = update.state.doc.toString();
          onChange(newDoc);
        }
        if (update.selectionSet && onCursorChange) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          const col = pos - line.from + 1;
          onCursorChange(line.number, col);
        }
      }),
    ];

    if (wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [filePath]);

  // Sync content updates from outside (switching tabs or external changes)
  useEffect(() => {
    if (viewRef.current) {
      const currentVal = viewRef.current.state.doc.toString();
      if (content !== currentVal) {
        isUpdatingFromProp.current = true;
        viewRef.current.dispatch({
          changes: { from: 0, to: currentVal.length, insert: content },
        });
        isUpdatingFromProp.current = false;
      }
    }
  }, [content]);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Code | Split | Design Mode Toggle for XML Layouts */}
      {isXml && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "16px",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-medium)",
            borderRadius: "6px",
            padding: "2px",
            gap: "2px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
        >
          <button
            onClick={() => setViewMode("code")}
            className={`btn-toolbar ${viewMode === "code" ? "primary" : ""}`}
            style={{ padding: "3px 8px", fontSize: "11px", height: "24px" }}
            title="Source Code Only"
          >
            Code
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`btn-toolbar ${viewMode === "split" ? "primary" : ""}`}
            style={{ padding: "3px 8px", fontSize: "11px", height: "24px" }}
            title="Split Code & Android Preview"
          >
            Split
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`btn-toolbar ${viewMode === "preview" ? "primary" : ""}`}
            style={{ padding: "3px 8px", fontSize: "11px", height: "24px" }}
            title="Android Layout Visual Preview"
          >
            Design
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
        <div
          ref={containerRef}
          style={{
            height: "100%",
            flex: viewMode === "split" ? 1 : viewMode === "code" ? 1 : 0,
            display: viewMode === "preview" ? "none" : "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: viewMode === "split" ? "1px solid var(--border-subtle)" : "none",
          }}
        />

        {isXml && (viewMode === "split" || viewMode === "preview") && (
          <div
            style={{
              flex: 1,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <AndroidLayoutPreview
              xmlContent={content}
              fileName={filePath.split("\\").pop() || filePath.split("/").pop() || "layout.xml"}
            />
          </div>
        )}
      </div>
    </div>
  );
};
