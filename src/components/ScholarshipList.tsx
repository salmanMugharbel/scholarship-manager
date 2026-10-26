"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "./Dashboard";
import { SCHOLARSHIP_STATUSES, type Scholarship } from "@/lib/types";
import { daysLeft, deadlineColor, deadlineLabel, formatDate } from "@/lib/deadline";
import ScholarshipDetail from "./ScholarshipDetail";
import ScholarshipForm from "./ScholarshipForm";

export interface PanelProps {
  data: AppData;
  reload: () => Promise<void>;
  supabase: SupabaseClient;
}

export const STATUS_COLORS: Record<string, string> = {
  Researching: "bg-slate-800 text-slate-200",
  Preparing: "bg-blue-500/15 text-blue-300",
  Submitted: "bg-violet-500/15 text-violet-300",
  Accepted: "bg-emerald-500/15 text-emerald-300",
  Rejected: "bg-red-500/15 text-red-300",
};

type Sort = "deadline" | "name" | "added";

export default function ScholarshipList({ data, reload, supabase }: PanelProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [country, setCountry] = useState("All");
  const [sort, setSort] = useState<Sort>("deadline");
  const [showClosed, setShowClosed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const countries = useMemo(
    () => [...new Set(data.scholarships.map((s) => s.country).filter(Boolean))].sort() as string[],
    [data.scholarships]
  );

  const docProgress = (id: string) => {
    const docIds = data.links.filter((l) => l.scholarship_id === id).map((l) => l.document_id);
    const ready = data.documents.filter((d) => docIds.includes(d.id) && d.status === "Ready").length;
    return { ready, total: docIds.length };
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    const list = data.scholarships.filter((s) => {
      if (status !== "All" && s.status !== status) return false;
      if (country !== "All" && s.country !== country) return false;
      const days = daysLeft(s.deadline);
      if (!showClosed && days !== null && days < 0) return false;
      if (q && ![s.name, s.provider, s.country, s.universities].some((v) => v?.toLowerCase().includes(q)))
        return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "added") return b.created_at.localeCompare(a.created_at);
      // Nearest deadline first, scholarships without a deadline last
      return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
    });
  }, [data.scholarships, search, status, country, sort, showClosed]);

  const closedCount = data.scholarships.filter((s) => (daysLeft(s.deadline) ?? 0) < 0).length;
  const open = data.scholarships.find((s) => s.id === openId);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, country, university..."
          className="input flex-1 min-w-48"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
          <option>All</option>
          {SCHOLARSHIP_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="input w-auto">
          <option value="All">All countries</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input w-auto">
          <option value="deadline">Nearest deadline</option>
          <option value="name">Name A–Z</option>
          <option value="added">Recently added</option>
        </select>
        <button onClick={() => setAdding(true)} className="btn-primary">+ Add scholarship</button>
      </div>

      {closedCount > 0 && (
        <label className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          Show {closedCount} closed scholarship{closedCount > 1 ? "s" : ""}
        </label>
      )}

      {data.scholarships.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium text-slate-200">No scholarships yet</p>
          <p className="text-sm">Add one manually, or use the AI Prompt tab and paste the result in Import.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-slate-400 text-sm">No scholarships match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <ScholarshipCard key={s.id} s={s} progress={docProgress(s.id)} onClick={() => setOpenId(s.id)} />
          ))}
        </div>
      )}

      {open && (
        <ScholarshipDetail
          scholarship={open}
          data={data}
          reload={reload}
          supabase={supabase}
          onClose={() => setOpenId(null)}
        />
      )}
      {adding && (
        <ScholarshipForm data={data} reload={reload} supabase={supabase} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

function ScholarshipCard({
  s,
  progress,
  onClick,
}: {
  s: Scholarship;
  progress: { ready: number; total: number };
  onClick: () => void;
}) {
  const pct = progress.total ? Math.round((progress.ready / progress.total) * 100) : 0;
  return (
    <button onClick={onClick} className="card p-4 text-left hover:border-indigo-500 hover:shadow-md transition cursor-pointer flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold leading-snug">{s.name}</h3>
        <span className={`badge ${deadlineColor(s.deadline)}`}>{deadlineLabel(s.deadline)}</span>
      </div>
      <p className="text-sm text-slate-400 mb-3">
        {[s.country, s.provider].filter(Boolean).join(" · ") || "—"}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`badge ${STATUS_COLORS[s.status]}`}>{s.status}</span>
        {s.funding_type && <span className="badge bg-amber-500/10 text-amber-300">{s.funding_type} funding</span>}
        {s.verified && <span className="badge bg-emerald-500/10 text-emerald-300">✓ Verified</span>}
        {s.syrian_eligible?.toLowerCase().startsWith("unclear") && (
          <span className="badge bg-yellow-500/15 text-yellow-300">⚠ Eligibility unclear</span>
        )}
      </div>
      <div className="mt-auto text-xs text-slate-400">
        <div className="flex justify-between mb-1">
          <span>Deadline: {formatDate(s.deadline)}</span>
          <span>
            Docs {progress.ready}/{progress.total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </button>
  );
}
