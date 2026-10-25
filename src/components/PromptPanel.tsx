"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPrompt } from "@/lib/aiPrompt";
import { todayISO } from "@/lib/deadline";

const STORAGE_KEY = "scholarship-prompt";

export default function PromptPanel({ onGoToImport }: { onGoToImport: () => void }) {
  const prompt = useMemo(() => buildPrompt(todayISO()), []);
  const [text, setText] = useState(prompt);
  const [copied, setCopied] = useState(false);

  // Remember the filled-in profile on this device, with the date refreshed to today
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setText(saved.replace(/deadlines after \d{4}-\d{2}-\d{2}/, `deadlines after ${todayISO()}`));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (text === prompt) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text, prompt]);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl">
      <ol className="text-sm text-slate-600 mb-4 list-decimal list-inside space-y-1">
        <li>Fill in the <b>[brackets]</b> below with your details (you can edit right here).</li>
        <li>Copy the prompt into an AI <b>with web search</b> (ChatGPT search, Perplexity, Gemini, Claude).</li>
        <li>Copy the AI&apos;s JSON reply and paste it in the <b>Import</b> tab.</li>
        <li>Always check the deadline on the official site, then tick <b>Verified</b>.</li>
      </ol>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={22}
        className="input font-mono text-xs mb-3"
      />
      <div className="flex gap-2">
        <button onClick={copy} className="btn-primary">{copied ? "✓ Copied" : "📋 Copy prompt"}</button>
        <button onClick={() => setText(prompt)} className="btn-secondary">Reset</button>
        <button onClick={onGoToImport} className="btn-secondary ml-auto">Go to Import →</button>
      </div>
    </div>
  );
}
