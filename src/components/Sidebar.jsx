import React from "react";

function Node({ node, onOpenFile, depth = 0 }) {
  const [open, setOpen] = React.useState(true);
  if (node.type === "dir") {
    return (
      <div style={{ marginLeft: depth * 12 }}>
        <div className="tree-row dir" onClick={() => setOpen(!open)}>
          {open ? "📂" : "📁"} {node.name}
        </div>
        {open && node.children.map((c) => (
          <Node key={c.path} node={c} onOpenFile={onOpenFile} depth={depth + 1} />
        ))}
      </div>
    );
  }
  return (
    <div
      className="tree-row file"
      style={{ marginLeft: depth * 12 }}
      onClick={() => onOpenFile(node.path)}
    >
      📄 {node.name}
    </div>
  );
}

export default function Sidebar({ tree, onOpenFile, onRefresh, onUploadZip, onDownloadZip }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span>Files</span>
        <div className="sidebar-actions">
          <button title="Refresh" onClick={onRefresh}>⟳</button>
          <label className="upload-btn" title="Upload .zip">
            ⬆️
            <input
              type="file"
              accept=".zip"
              style={{ display: "none" }}
              onChange={(e) => e.target.files[0] && onUploadZip(e.target.files[0])}
            />
          </label>
          <button title="Download workspace as .zip" onClick={onDownloadZip}>⬇️</button>
        </div>
      </div>
      <div className="tree">
        {tree.map((n) => (
          <Node key={n.path} node={n} onOpenFile={onOpenFile} />
        ))}
      </div>
    </div>
  );
}
