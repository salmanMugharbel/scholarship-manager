"use client";

import { useState } from "react";
import type { PanelProps } from "./ScholarshipList";
import { importScholarships, normalizeName, parseAiJson, type ParsedScholarship } from "@/lib/importScholarships";
import { deadlineColor, deadlineLabel, formatDate } from "@/lib/deadline";

export default function ImportPanel({ data, reload, supabase, onDone }: PanelProps & { onDone: () => void }) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedScholarship[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const existingNames = new Set(data.scholarships.map((s) => normalizeName(s.name)));

  function preview() {
    setError("");
    try {
      const items = parseAiJson(raw);
      if (!items.length) throw new Error("No scholarships found in the JSON.");
      setParsed(items);
      // Pre-select everything except duplicates
      setSelected(new Set(items.map((_, i) => i).filter((i) => !existingNames.has(normalizeName(items[i].name)))));
    } catch (e) {
      setParsed(null);
      setError(`Could not read the JSON: ${(e as Error).message}`);
    }
  }

  async function doImport() {
    if (!parsed) return;
    setImporting(true);
    try {
      await importScholarships(supabase, parsed.filter((_, i) => selected.has(i)), data.documents);
      await reload();
      setRaw("");
      setParsed(null);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-slate-600 mb-3">
        Paste the AI&apos;s JSON reply below. You&apos;ll see a preview before anything is saved.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={10}
        className="input font-mono text-xs mb-3"
        placeholder='{ "scholarships": [ ... ] }'
      />
      <button onClick={preview} disabled={!raw.trim()} className="btn-primary mb-4">Preview</button>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {parsed && (
        <div>
          <h3 className="font-semibold mb-2">
            Found {parsed.length} scholarships — {selected.size} selected
          </h3>
          <ul className="space-y-2 mb-4">
            {parsed.map((s, i) => {
              const dup = existingNames.has(normalizeName(s.name));
              return (
                <li key={i} className="card p-3 flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{s.name}</span>
                      <span className={`badge ${deadlineColor(s.deadline)}`}>{deadlineLabel(s.deadline)}</span>
                      {dup && <span className="badge bg-yellow-100 text-yellow-800">Already added</span>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {[s.country, s.funding_type, formatDate(s.deadline)].filter(Boolean).join(" · ")} ·{" "}
                      {s.required_documents.length} documents
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <button onClick={doImport} disabled={importing || selected.size === 0} className="btn-primary">
            {importing ? "Importing..." : `Import ${selected.size} scholarships`}
          </button>
        </div>
      )}
    </div>
  );
}
