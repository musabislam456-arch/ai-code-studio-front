import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const PROVIDER_LABELS = {
  gemini: "Gemini",
  ollama: "Ollama (free)",
  groq: "Groq (free)",
  openrouter: "OpenRouter (free)",
  cerebras: "Cerebras (free)",
  mistral: "Mistral (free)"
};

// Display order for the provider dropdown — Gemini first (primary/auto
// provider), then Ollama, then the newer free OpenAI-compatible providers.
const PROVIDER_ORDER = ["gemini", "ollama", "groq", "openrouter", "cerebras", "mistral"];

// Each provider gets its own model dropdown (only the active provider's is
// shown) rather than one giant flat list, so switching providers and
// picking a model within it are two clear, separate steps.
export default function ModelPicker({ selectedModel, onChange, autoMode, onToggleAuto }) {
  const [models, setModels] = useState([]);

  useEffect(() => {
    api.getModels().then((r) => setModels(r.models || [])).catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    for (const m of models) {
      const p = m.provider || "gemini";
      (map[p] ||= []).push(m);
    }
    return map;
  }, [models]);

  const providersPresent = PROVIDER_ORDER.filter((p) => grouped[p]?.length);
  const currentModel = models.find((m) => m.id === selectedModel);
  const currentProvider = currentModel?.provider || providersPresent[0] || "gemini";

  // Auto mode picks a model server-side via /models/auto-pick, which only
  // knows how to choose among Gemini models — so it's only offered/enabled
  // while a Gemini model is selected.
  const autoAvailable = currentProvider === "gemini";

  const handleProviderChange = (provider) => {
    const first = grouped[provider]?.[0];
    if (first) onChange(first.id);
    if (provider !== "gemini" && autoMode) onToggleAuto(false);
  };

  return (
    <div className="model-picker">
      <label className="auto-toggle" title={autoAvailable ? "" : "Auto mode sirf Gemini models ke liye available hai"}>
        <input
          type="checkbox"
          checked={autoMode}
          disabled={!autoAvailable}
          onChange={(e) => onToggleAuto(e.target.checked)}
        />
        Auto
      </label>

      <select
        className="model-picker-provider"
        disabled={autoMode}
        value={currentProvider}
        onChange={(e) => handleProviderChange(e.target.value)}
        title="Provider"
      >
        {providersPresent.map((p) => (
          <option key={p} value={p}>{PROVIDER_LABELS[p] || p}</option>
        ))}
      </select>

      <select
        className="model-picker-model"
        disabled={autoMode}
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        title="Model"
      >
        {(grouped[currentProvider] || []).map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
