import React from "react";
import Editor from "@monaco-editor/react";

function guessLanguage(path) {
  const ext = path.split(".").pop();
  const map = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", json: "json", html: "html", css: "css", md: "markdown",
    yml: "yaml", yaml: "yaml", sh: "shell"
  };
  return map[ext] || "plaintext";
}

export default function CodeEditor({ activePath, content, onChange, onSave }) {
  if (!activePath) {
    return <div className="editor-empty">Koi file kholain sidebar se ✏️</div>;
  }
  return (
    <div className="editor-wrap">
      <div className="editor-tab">
        {activePath}
        <button onClick={onSave} className="save-btn">💾 Save</button>
      </div>
      <Editor
        height="calc(100% - 36px)"
        theme="vs-dark"
        path={activePath}
        language={guessLanguage(activePath)}
        value={content}
        onChange={(v) => onChange(v ?? "")}
        options={{ fontSize: 14, minimap: { enabled: false } }}
      />
    </div>
  );
}
