import React, { useState } from "react";
import { getAccessToken, setAccessToken } from "../lib/api";

/**
 * Simple gate: asks for the access token once, stores it in
 * localStorage. Not a real auth system — just enough to stop
 * randoms on the internet from using your deployed backend.
 */
export default function LoginGate({ children }) {
  const [token, setToken] = useState(getAccessToken());
  const [entered, setEntered] = useState(!!getAccessToken());

  if (entered) return children;

  return (
    <div className="login-gate">
      <div className="login-card">
        <h2>🔒 AI Code Studio</h2>
        <p>Access token daalein (jo aapne backend ke APP_ACCESS_TOKEN mein set kiya tha)</p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Access token"
          onKeyDown={(e) => e.key === "Enter" && token && (setAccessToken(token), setEntered(true))}
        />
        <button onClick={() => { setAccessToken(token); setEntered(true); }}>Enter</button>
      </div>
    </div>
  );
}
