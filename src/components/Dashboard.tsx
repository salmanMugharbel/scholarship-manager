"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DocumentItem, Scholarship, ScholarshipDocument, Task } from "@/lib/types";
import ScholarshipList from "./ScholarshipList";
import TodoList from "./TodoList";
import ImportPanel from "./ImportPanel";
import PromptPanel from "./PromptPanel";

export interface AppData {
  scholarships: Scholarship[];
  documents: DocumentItem[];
  links: ScholarshipDocument[];
  tasks: Task[];
}

const TABS = [
  { id: "scholarships", label: "🎓 Scholarships" },
  { id: "todo", label: "✅ To-Do" },
  { id: "import", label: "📥 Import" },
  { id: "prompt", label: "🤖 AI Prompt" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Dashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<TabId>("scholarships");
  const [data, setData] = useState<AppData>({ scholarships: [], documents: [], links: [], tasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const [s, d, l, t] = await Promise.all([
      supabase.from("scholarships").select("*").order("deadline", { ascending: true, nullsFirst: false }),
      supabase.from("documents").select("*").order("name"),
      supabase.from("scholarship_documents").select("scholarship_id, document_id"),
      supabase.from("tasks").select("*").order("created_at"),
    ]);
    const firstError = s.error || d.error || l.error || t.error;
    if (firstError) {
      setError(
        firstError.message.includes("does not exist") || firstError.code === "42P01" || firstError.code === "PGRST205"
          ? "Database tables not found. Run supabase/schema.sql in the Supabase SQL Editor first."
          : firstError.message
      );
    } else {
      setError("");
      setData({ scholarships: s.data ?? [], documents: d.data ?? [], links: l.data ?? [], tasks: t.data ?? [] });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const pendingDocs = data.documents.filter(
    (d) => d.status !== "Ready" && data.links.some((l) => l.document_id === d.id)
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">🎓 Scholarship Manager</h1>
          <p className="text-sm text-slate-400">
            {data.scholarships.length} scholarships · {pendingDocs} documents to prepare
          </p>
        </div>
        <button onClick={signOut} className="btn-secondary">🔒 Lock</button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
              tab === t.id
                ? "border-indigo-600 text-indigo-300"
                : "border-transparent text-slate-400 hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && <div className="card border-red-500/40 bg-red-500/10 text-red-300 p-4 mb-6 text-sm">{error}</div>}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <>
          {tab === "scholarships" && <ScholarshipList data={data} reload={reload} supabase={supabase} />}
          {tab === "todo" && <TodoList data={data} reload={reload} supabase={supabase} />}
          {tab === "import" && (
            <ImportPanel data={data} reload={reload} supabase={supabase} onDone={() => setTab("scholarships")} />
          )}
          {tab === "prompt" && <PromptPanel onGoToImport={() => setTab("import")} />}
        </>
      )}
    </div>
  );
}
