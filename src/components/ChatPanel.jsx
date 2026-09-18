import React, { useState } from "react";
import { api } from "../lib/api";

const SYSTEM_INSTRUCTION = `You are AI Code Studio's assistant, an agentic coding helper.
You can read/write files, run terminal commands, and manage git/GitHub for the
user's local workspace. Be concise, write production-quality code, explain
important decisions briefly, and never invent file contents you have not read.`;

export default function ChatPanel({ modelId, autoMode, workspace }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      let useModel = modelId;
      if (autoMode) {
        const pick = await api.autoPickModel({
          needsDeepReasoning: input.length > 400,
          isQuickEdit: input.length < 80,
          inputTokensEstimate: input.length / 4
        });
        useModel = pick.model;
      }
      const res = await api.chat({
        workspace,
        modelId: useModel,
        messages: next,
        systemInstruction: SYSTEM_INSTRUCTION
      });
      const text = res?.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "(no response)";
      setMessages((m) => [...m, { role: "assistant", content: `[${res.usedModel}] ${text}` }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
        ))}
        {loading && <div className="chat-msg assistant">…soch raha hoon</div>}
      </div>
      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Task batayein... (Enter = send, Shift+Enter = new line)"
        />
        <button onClick={send} disabled={loading}>Send</button>
      </div>
    </div>
  );
}
