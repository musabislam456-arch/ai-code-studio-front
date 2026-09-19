import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function GitPanel({ workspace }) {
  const [repoName, setRepoName] = useState(workspace);
  const [commitMsg, setCommitMsg] = useState("Update from AI Code Studio");
  const [isPrivate, setIsPrivate] = useState(true);
  const [connection, setConnection] = useState(null);
  const [log, setLog] = useState("");

  const load = async () => {
    try { setConnection(await api.githubStatus(workspace)); }
    catch (err) { setConnection({ connected: false, error: err.message }); }
  };

  useEffect(() => { setRepoName(workspace); load(); }, [workspace]);

  const run = async (fn, label) => {
    try {
      setLog(`⏳ ${label}...`);
      const result = await fn();
      setLog(`✅ ${label}: ${JSON.stringify(result).slice(0, 500)}`);
      await load();
      return result;
    } catch (err) {
      setLog(`❌ ${label} failed: ${err.message}`);
    }
  };

  const createRepo = async () => {
    const name = repoName.trim();
    if (!name) return setLog("❌ Repository name required.");
    await run(
      () => api.createGithubRepo(workspace, { repoName: name, isPrivate, description: `AI Code Studio project: ${workspace}` }),
      `Create ${isPrivate ? "private" : "public"} GitHub repo and push project`
    );
  };

  const unlink = async () => {
    if (!window.confirm("Unlink this project from its GitHub remote? The GitHub repository will NOT be deleted.")) return;
    await run(() => api.unlinkGithubRepo(workspace), "Unlink GitHub repo");
  };

  return (
    <div className="git-panel">
      {connection?.connected ? (
        <div className="git-connected">
          <div><strong>🔗 GitHub connected</strong></div>
          <a href={connection.htmlUrl} target="_blank" rel="noreferrer">{connection.htmlUrl}</a>
          <div className="git-row"><button onClick={unlink}>Unlink</button></div>
        </div>
      ) : (
        <>
          <div className="git-row">
            <input value={repoName} onChange={(e) => setRepoName(e.target.value)} placeholder="GitHub repo name" />
          </div>
          <div className="git-row">
            <label><input type="radio" checked={isPrivate} onChange={() => setIsPrivate(true)} /> Private</label>
            <label><input type="radio" checked={!isPrivate} onChange={() => setIsPrivate(false)} /> Public</label>
            <button onClick={createRepo}>Create & Push</button>
          </div>
          <small>Creates the repository, connects it to this project, commits the current workspace, and pushes to <code>main</code>.</small>
        </>
      )}

      <div className="git-row">
        <button onClick={() => run(() => api.gitInit(workspace), "git init")}>Init</button>
        <button onClick={() => run(() => api.gitPull(workspace, "origin", "main"), "git pull")}>Pull</button>
        <button onClick={() => run(() => api.gitPush(workspace, "origin", "main"), "git push")}>Push</button>
      </div>

      <div className="git-row">
        <input value={commitMsg} onChange={(e) => setCommitMsg(e.target.value)} placeholder="Commit message" />
        <button onClick={() => run(() => api.gitCommit(workspace, commitMsg), "git commit")}>Commit</button>
      </div>

      <a href={api.downloadZipUrl(workspace)} className="download-link">⬇️ Download workspace as .zip</a>
      <div className="git-log">{log}</div>
    </div>
  );
}
