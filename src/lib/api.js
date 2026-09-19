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

// Agentic chat — streams live steps (status/tool_call/tool_result/final)
// over SSE as the model works, instead of waiting for one final response.
// `onEvent` is called for every parsed event as it arrives.
export async function agentChatStream(payload, onEvent) {
  const token = getAccessToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + "/agent/chat", {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      const line = rawEvent.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue; // e.g. ": ping" heartbeat comments
      onEvent(JSON.parse(line.slice(6)));
    }
  }
}

export const api = {
  getModels: () => req("GET", "/models"),
  autoPickModel: (hint) => req("POST", "/models/auto-pick", hint),

  signUp: (payload) => req("POST", "/auth/signup", payload),
  signIn: (payload) => req("POST", "/auth/signin", payload),
  me: () => req("GET", "/auth/me"),
  signOut: () => req("POST", "/auth/signout"),
  googleAuthUrl: () => `${BASE}/auth/google`,
  googleExchange: (code) => req("POST", "/auth/google/exchange", { code }),

  projects: () => req("GET", "/projects"),
  createProject: (name) => req("POST", "/projects", { name }),
  renameProject: (id,name) => req("PATCH", `/projects/${id}`, { name }),
  deleteProject: (id) => req("DELETE", `/projects/${id}`),
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
