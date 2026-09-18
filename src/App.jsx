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
  const [modelId, setModelId] = useState("gemini-3.8-flash");
  const [autoMode, setAutoMode] = useState(true);
  const [panelTab, setPanelTab] = useState("files"); // files | terminal | git

  const refreshTree = () => api.tree(WORKSPACE).then((r) => setTree(r.tree)).catch(() => {});

  useEffect(() => { refreshTree(); }, []);

  const openFile = async (path) => {
    setActivePath(path);
    setPanelTab("files");
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
        <div className="brand">
          <span className="brand-dot" />
          AI Code Studio
        </div>
        <ModelPicker
          selectedModel={modelId}
          onChange={setModelId}
          autoMode={autoMode}
          onToggleAuto={setAutoMode}
        />
      </header>

      <div className="workspace">
        {/* Chat is the primary surface — this is the main thing you look at,
            like talking to Claude. Everything else lives in the side panel. */}
        <div className="chat-col">
          <ChatPanel modelId={modelId} autoMode={autoMode} workspace={WORKSPACE} />
        </div>

        <div className="panel-col">
          <div className="panel-tabs">
            <button className={panelTab === "files" ? "active" : ""} onClick={() => setPanelTab("files")}>
              Files{activePath ? <span className="tab-hint">· {activePath.split("/").pop()}</span> : null}
            </button>
            <button className={panelTab === "terminal" ? "active" : ""} onClick={() => setPanelTab("terminal")}>
              Terminal
            </button>
            <button className={panelTab === "git" ? "active" : ""} onClick={() => setPanelTab("git")}>
              Git
            </button>
          </div>

          <div className="panel-body">
            {panelTab === "files" && (
              <div className="files-view">
                <Sidebar
                  tree={tree}
                  onOpenFile={openFile}
                  onRefresh={refreshTree}
                  onUploadZip={uploadZip}
                  onDownloadZip={() => window.open(api.downloadZipUrl(WORKSPACE), "_blank")}
                />
                <CodeEditor
                  activePath={activePath}
                  content={content}
                  onChange={setContent}
                  onSave={saveFile}
                />
              </div>
            )}
            {panelTab === "terminal" && <TerminalPanel cwd={WORKSPACE} />}
            {panelTab === "git" && <GitPanel workspace={WORKSPACE} />}
          </div>
        </div>
      </div>
    </div>
  );
}
