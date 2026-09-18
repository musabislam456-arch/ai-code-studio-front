import React, { useEffect, useRef, useState } from "react";
import { connectTerminal } from "../lib/ws";

export default function TerminalPanel({ cwd }) {
  const outRef = useRef(null);
  const termRef = useRef(null);
  const [input, setInput] = useState("");
  const [lines, setLines] = useState([`AI Code Studio terminal — cwd: ${cwd}`]);

  useEffect(() => {
    termRef.current = connectTerminal({
      onData: (data) => setLines((l) => [...l, data]),
      onExit: (code) => setLines((l) => [...l, `\n[process exited with code ${code}]\n`])
    });
    return () => termRef.current?.close();
  }, []);

  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [lines]);

  const runCommand = () => {
    if (!input.trim()) return;
    setLines((l) => [...l, `\n$ ${input}\n`]);
    termRef.current?.run(input, cwd);
    setInput("");
  };

  return (
    <div className="terminal">
      <pre ref={outRef} className="terminal-output">{lines.join("")}</pre>
      <div className="terminal-input-row">
        <span>$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runCommand()}
          placeholder="npm install / python main.py / git status ..."
        />
      </div>
    </div>
  );
}
