import React, { useState } from "react";
import { api } from "../lib/api";

const SYSTEM_INSTRUCTION = `You are AI Code Studio's assistant, an agentic coding helper.
You can read/write files, run terminal commands, and manage git/GitHub for the
user's local workspace. Be concise, write production-quality code, explain
important decisions briefly, and never invent file contents you have not read.`;

// Very small renderer: splits ```code``` fences from plain text so code
// doesn't render as one flat paragraph. Not full markdown — just enough
// to make code readable in the chat.
function renderContent(text) {
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) blocks.push({ type: "text", content: text.slice(lastIndex, match.index) });
    blocks.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) blocks.push({ type: "text", content: text.slice(lastIndex) });
  if (blocks.length === 0) blocks.push({ type: "text", content: text });

  return blocks.map((b, i) =>
    b.type === "code"
      ? (
        <pre key={i} className="code-block">
          {b.lang && <div className="code-lang">{b.lang}</div>}
          <code>{b.content}</code>
        </pre>
      )
      : <p key={i} className="msg-text">{b.content}</p>
  );
}

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
      setMessages((m) => [...m, { role: "assistant", content: text, model: res.usedModel }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err.message, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-title">AI Code Studio</div>
            <div className="chat-empty-sub">Task batayein — koi file likhwani ho, bug fix karni ho, ya kuch aur.</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}${m.isError ? " error" : ""}`}>
            {m.model && <div className="chat-msg-model">{m.model}</div>}
            {m.isError ? <p className="msg-text">⚠ {m.content}</p> : renderContent(m.content)}
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant loading">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
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
