import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import CodeEditor from "./components/CodeEditor";
import TerminalPanel from "./components/Terminal";
import ChatPanel from "./components/ChatPanel";
import ModelPicker from "./components/ModelPicker";
import GitPanel from "./components/GitPanel";
import { api, getAccessToken } from "./lib/api";

const WORKSPACE = "my-project";
const API_ROOT = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [tree, setTree] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [content, setContent] = useState("");
  const [modelId, setModelId] = useState("gemini-3.5-flash");
  const [autoMode, setAutoMode] = useState(true);
  const [rightTab, setRightTab] = useState("chat");

  const refreshTree = () => api.tree(WORKSPACE).then((r) => setTree(r.tree)).catch(() => {});

  useEffect(() => { refreshTree(); }, []);

  const openFile = async (path) => {
    setActivePath(path);
    const r = await api.readFile(WORKSPACE, path);
    setContent(r.content);
  };

  const saveFile = async () => {
    if (!activePath) return;
    await api.writeFile(WORKSPACE, activePath, content);
    refreshTree();
  };

  const uploadZip = async (file) => {
    const form = new FormData();
    form.append("file", file);
    const token = getAccessToken();
    await fetch(`${API_ROOT}/api/workspace/${WORKSPACE}/upload-zip`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    });
    refreshTree();
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🛠️ AI Code Studio</div>
        <ModelPicker
          selectedModel={modelId}
          onChange={setModelId}
          autoMode={autoMode}
          onToggleAuto={setAutoMode}
        />
        <div className="tabs">
          <button className={rightTab === "chat" ? "active" : ""} onClick={() => setRightTab("chat")}>Chat</button>
          <button className={rightTab === "git" ? "active" : ""} onClick={() => setRightTab("git")}>Git</button>
        </div>
      </header>

      <div className="main-grid">
        <Sidebar
          tree={tree}
          onOpenFile={openFile}
          onRefresh={refreshTree}
          onUploadZip={uploadZip}
          onDownloadZip={() => window.open(api.downloadZipUrl(WORKSPACE), "_blank")}
        />

        <div className="center-col">
          <CodeEditor
            activePath={activePath}
            content={content}
            onChange={setContent}
            onSave={saveFile}
          />
          <TerminalPanel cwd={WORKSPACE} />
        </div>

        <div className="right-col">
          {rightTab === "chat"
            ? <ChatPanel modelId={modelId} autoMode={autoMode} workspace={WORKSPACE} />
            : <GitPanel workspace={WORKSPACE} />}
        </div>
      </div>
    </div>
  );
}
