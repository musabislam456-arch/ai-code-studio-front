import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ModelPicker({ selectedModel, onChange, autoMode, onToggleAuto }) {
  const [models, setModels] = useState([]);

  useEffect(() => {
    api.getModels().then((r) => setModels(r.models)).catch(() => {});
  }, []);

  return (
    <div className="model-picker">
      <label className="auto-toggle">
        <input type="checkbox" checked={autoMode} onChange={(e) => onChange(e.target.value)} />
        Auto
      </label>
      <select
        disabled={autoMode}
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
