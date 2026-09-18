import { getAccessToken } from "./api";

export function connectTerminal({ onData, onExit }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = encodeURIComponent(getAccessToken());
  let wsUrl;
  if (apiUrl) {
    wsUrl = apiUrl.replace(/^http/, "ws") + `/ws/terminal?token=${token}`;
  } else {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    wsUrl = `${proto}://${location.host}/ws/terminal?token=${token}`;
  }
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "exit") onExit?.(msg.data);
    else onData?.(msg.data, msg.type);
  };

  return {
    run: (command, cwd) => socket.send(JSON.stringify({ type: "run", command, cwd })),
    close: () => socket.close(),
    socket
  };
}
