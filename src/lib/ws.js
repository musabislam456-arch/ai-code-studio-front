import { getAccessToken } from "./api";

export function connectTerminal({ onData, onExit, onStatus }) {
  const apiUrl=(import.meta.env.VITE_API_URL||"").replace(/\/+$/,"");
  const token=encodeURIComponent(getAccessToken());
  const wsUrl=apiUrl
    ? apiUrl.replace(/^http/,"ws")+"/ws/terminal?token="+token
    : (location.protocol==="https:"?"wss":"ws")+"://"+location.host+"/ws/terminal?token="+token;
  const socket=new WebSocket(wsUrl);
  const queue=[];
  socket.onopen=()=>{onStatus?.("connected");while(queue.length&&socket.readyState===WebSocket.OPEN)socket.send(queue.shift());};
  socket.onerror=()=>onStatus?.("error");
  socket.onclose=()=>onStatus?.("closed");
  socket.onmessage=event=>{
    try{const msg=JSON.parse(event.data);if(msg.type==="exit")onExit?.(msg.data);else onData?.(msg.data,msg.type);}catch{}
  };
  const send=message=>{if(socket.readyState===WebSocket.OPEN)socket.send(message);else queue.push(message);};
  return {run:(command,cwd)=>send(JSON.stringify({type:"run",command,cwd})),close:()=>{queue.length=0;socket.close();},socket};
}
