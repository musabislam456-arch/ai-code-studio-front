import React, { useState } from "react";
import { api } from "../lib/api";

export default function GitPanel({ workspace }) {
  const [repoName, setRepoName] = useState(workspace);
  const [commitMsg, setCommitMsg] = useState("Update from AI Code Studio");
  const [log, setLog] = useState("");

  const run = async (fn, label) => {
    try {
      setLog(`⏳ ${label}...`);
      const result = await fn();
      setLog(`✅ ${label}: ${JSON.stringify(result).slice(0, 300)}`);
    } catch (err) {
      setLog(`❌ ${label} failed: ${err.message}`);
    }
  };

  return (
    <div className="git-panel">
      <div className="git-row">
        <input
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="GitHub repo name"
        />
        <button onClick={() => run(
          () => api.createGithubRepo(workspace, { repoName, isPrivate: true }),
          "Create GitHub repo"
        )}>Create Repo</button>
      </div>

      <div className="git-row">
        <button onClick={() => run(() => api.gitInit(workspace), "git init")}>Init</button>
        <button onClick={() => run(() => api.gitPull(workspace, "origin", "main"), "git pull")}>Pull</button>
        <button onClick={() => run(() => api.gitPush(workspace, "origin", "main"), "git push")}>Push</button>
      </div>

      <div className="git-row">
        <input
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message"
        />
        <button onClick={() => run(() => api.gitCommit(workspace, commitMsg), "git commit")}>Commit</button>
      </div>

      <a href={api.downloadZipUrl(workspace)} className="download-link">⬇️ Download workspace as .zip</a>

      <div className="git-log">{log}</div>
    </div>
  );
}
