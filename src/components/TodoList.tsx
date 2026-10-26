"use client";

import { useRef, useState } from "react";
import type { PanelProps } from "./ScholarshipList";
import { DOCUMENT_STATUSES, type DocumentItem, type Task } from "@/lib/types";
import { daysLeft, deadlineColor, deadlineLabel, formatDate } from "@/lib/deadline";

export const DOC_STATUS_COLORS: Record<string, string> = {
  "Not started": "bg-slate-800 text-slate-300",
  "In progress": "bg-amber-500/15 text-amber-300",
  Ready: "bg-emerald-500/15 text-emerald-300",
};

export default function TodoList(props: PanelProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <DocumentsSection {...props} />
      </div>
      <div className="lg:col-span-2">
        <TasksSection {...props} />
      </div>
    </div>
  );
}

function DocumentsSection({ data, reload, supabase }: PanelProps) {
  const [hideReady, setHideReady] = useState(false);
  const [newDoc, setNewDoc] = useState("");

  // For each document: the open scholarships that need it, and the nearest deadline among them
  const rows = data.documents
    .map((doc) => {
      const scholarships = data.links
        .filter((l) => l.document_id === doc.id)
        .map((l) => data.scholarships.find((s) => s.id === l.scholarship_id))
        .filter((s) => s && (daysLeft(s.deadline) ?? 0) >= 0 && s.status !== "Rejected")
        .sort((a, b) => (a!.deadline ?? "9999").localeCompare(b!.deadline ?? "9999"));
      return { doc, scholarships: scholarships as NonNullable<(typeof scholarships)[number]>[] };
    })
    .filter((r) => !hideReady || r.doc.status !== "Ready")
    .sort((a, b) => {
      const da = a.scholarships[0]?.deadline ?? "9999";
      const db = b.scholarships[0]?.deadline ?? "9999";
      return da.localeCompare(db) || a.doc.name.localeCompare(b.doc.name);
    });

  const readyCount = data.documents.filter((d) => d.status === "Ready").length;

  async function addDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!newDoc.trim()) return;
    const { error } = await supabase.from("documents").insert({ name: newDoc.trim() });
    if (error) alert(error.code === "23505" ? "That document already exists." : error.message);
    setNewDoc("");
    await reload();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          📄 Documents <span className="text-sm font-normal text-slate-400">({readyCount}/{data.documents.length} ready)</span>
        </h2>
        <label className="flex items-center gap-1.5 text-sm text-slate-400">
          <input type="checkbox" checked={hideReady} onChange={(e) => setHideReady(e.target.checked)} />
          Hide ready
        </label>
      </div>

      <form onSubmit={addDoc} className="flex gap-2 mb-4">
        <input value={newDoc} onChange={(e) => setNewDoc(e.target.value)} placeholder="Add a document..." className="input" />
        <button className="btn-primary">Add</button>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 card p-6 text-center">
          No documents yet. They appear here automatically when you add or import scholarships.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ doc, scholarships }) => (
            <DocumentRow key={doc.id} doc={doc} scholarships={scholarships} reload={reload} supabase={supabase} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DocumentRow({
  doc,
  scholarships,
  reload,
  supabase,
}: Pick<PanelProps, "reload" | "supabase"> & {
  doc: DocumentItem;
  scholarships: PanelProps["data"]["scholarships"];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const nearest = scholarships[0];

  async function update(fields: Partial<DocumentItem>) {
    const { error } = await supabase.from("documents").update(fields).eq("id", doc.id);
    if (error) alert(error.message);
    await reload();
  }

  async function upload(file: File) {
    setUploading(true);
    const { data: auth } = await supabase.auth.getUser();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${auth.user!.id}/${doc.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) {
      alert(error.message);
    } else {
      if (doc.file_path) await supabase.storage.from("documents").remove([doc.file_path]);
      await update({
        file_path: path,
        file_name: file.name,
        status: doc.status === "Not started" ? "In progress" : doc.status,
      });
    }
    setUploading(false);
  }

  async function viewFile() {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_path!, 60);
    if (error) return alert(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function removeFile() {
    if (!confirm(`Remove the file "${doc.file_name}"?`)) return;
    await supabase.storage.from("documents").remove([doc.file_path!]);
    await update({ file_path: null, file_name: null });
  }

  async function removeDoc() {
    if (!confirm(`Delete "${doc.name}" from all scholarships?`)) return;
    if (doc.file_path) await supabase.storage.from("documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    await reload();
  }

  return (
    <li className={`card p-4 ${doc.status === "Ready" ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          onClick={() => update({ status: doc.status === "Ready" ? "Not started" : "Ready" })}
          className="text-lg cursor-pointer"
          title="Toggle ready"
        >
          {doc.status === "Ready" ? "✅" : "⬜"}
        </button>
        <span className={`font-medium ${doc.status === "Ready" ? "line-through" : ""}`}>{doc.name}</span>
        {nearest && (
          <span className={`badge ${deadlineColor(nearest.deadline)}`}>Needed in {deadlineLabel(nearest.deadline)}</span>
        )}
        <select
          value={doc.status}
          onChange={(e) => update({ status: e.target.value as DocumentItem["status"] })}
          className={`badge border-0 cursor-pointer ml-auto ${DOC_STATUS_COLORS[doc.status]}`}
        >
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {scholarships.length > 0 && (
        <p className="text-xs text-slate-400 mb-3">
          For: {scholarships.map((s) => `${s.name} (${formatDate(s.deadline)})`).join(" · ")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1 text-xs text-slate-400">
          My due date
          <input
            type="date"
            value={doc.due_date ?? ""}
            onChange={(e) => update({ due_date: e.target.value || null })}
            className="input py-1 w-auto"
          />
        </label>
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        {doc.file_path ? (
          <>
            <button onClick={viewFile} className="text-indigo-400 hover:underline cursor-pointer truncate max-w-48">
              📎 {doc.file_name}
            </button>
            <button onClick={removeFile} className="text-xs text-slate-500 hover:text-red-400 cursor-pointer">remove</button>
          </>
        ) : (
          <button onClick={() => fileInput.current?.click()} disabled={uploading} className="btn-secondary py-1 px-3 text-xs">
            {uploading ? "Uploading..." : "📤 Upload file"}
          </button>
        )}
        <button onClick={removeDoc} className="text-xs text-slate-500 hover:text-red-400 ml-auto cursor-pointer">Delete</button>
      </div>
    </li>
  );
}

function TasksSection({ data, reload, supabase }: PanelProps) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [scholarshipId, setScholarshipId] = useState("");

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase
      .from("tasks")
      .insert({ title: title.trim(), due_date: due || null, scholarship_id: scholarshipId || null });
    if (error) alert(error.message);
    setTitle("");
    setDue("");
    await reload();
  }

  async function toggle(t: Task) {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    await reload();
  }

  async function remove(t: Task) {
    await supabase.from("tasks").delete().eq("id", t.id);
    await reload();
  }

  const tasks = [...data.tasks].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
  );

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">📝 Other tasks</h2>
      <form onSubmit={addTask} className="card p-3 space-y-2 mb-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Email professor for recommendation" className="input" />
        <div className="flex gap-2">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="input" />
          <select value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value)} className="input">
            <option value="">No scholarship</option>
            {data.scholarships.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary w-full">Add task</button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">No tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => {
            const s = data.scholarships.find((x) => x.id === t.scholarship_id);
            return (
              <li key={t.id} className="card px-3 py-2 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={t.done} onChange={() => toggle(t)} className="mt-1" />
                <div className="flex-1">
                  <p className={t.done ? "line-through text-slate-500" : ""}>{t.title}</p>
                  <p className="text-xs text-slate-400">
                    {t.due_date && (
                      <span className={`badge mr-1 ${t.done ? "bg-slate-800 text-slate-400" : deadlineColor(t.due_date)}`}>
                        {formatDate(t.due_date)}
                      </span>
                    )}
                    {s?.name}
                  </p>
                </div>
                <button onClick={() => remove(t)} className="text-slate-500 hover:text-red-400 cursor-pointer">×</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
