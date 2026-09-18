// In local dev, leave VITE_API_URL unset — Vite's proxy forwards /api to
// the backend. In production (Vercel), set VITE_API_URL to your deployed
// Railway backend URL, e.g. https://your-app.up.railway.app
// (trailing slash is stripped automatically so a value like
// "https://your-app.up.railway.app/" doesn't produce a broken "//api" URL)
const ROOT = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const BASE = ROOT + "/api";

export function getAccessToken() {
  return localStorage.getItem("acs_token") || "";
}
export function setAccessToken(token) {
  localStorage.setItem("acs_token", token);
}

async function req(method, url, body) {
  const headers = body ? { "Content-Type": "application/json" } : {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 401) throw new Error("Unauthorized — check your access token.");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  getModels: () => req("GET", "/models"),
  autoPickModel: (hint) => req("POST", "/models/auto-pick", hint),
  chat: (payload) => req("POST", "/chat", payload),

  tree: (ws) => req("GET", `/workspace/${ws}/tree`),
  readFile: (ws, path) => req("GET", `/workspace/${ws}/file?path=${encodeURIComponent(path)}`),
  writeFile: (ws, path, content) => req("POST", `/workspace/${ws}/file`, { path, content }),
  deleteFile: (ws, path) => req("DELETE", `/workspace/${ws}/file?path=${encodeURIComponent(path)}`),

  gitInit: (ws) => req("POST", `/workspace/${ws}/git/init`),
  gitCommit: (ws, message) => req("POST", `/workspace/${ws}/git/commit`, { message }),
  gitPush: (ws, remote, branch) => req("POST", `/workspace/${ws}/git/push`, { remote, branch }),
  gitPull: (ws, remote, branch) => req("POST", `/workspace/${ws}/git/pull`, { remote, branch }),
  gitStatus: (ws) => req("POST", `/workspace/${ws}/git/status`),
  gitLog: (ws) => req("POST", `/workspace/${ws}/git/log`),
  createGithubRepo: (ws, payload) => req("POST", `/workspace/${ws}/github/create-repo`, payload),

  downloadZipUrl: (ws) => `${BASE}/workspace/${ws}/download-zip?token=${encodeURIComponent(getAccessToken())}`
};
