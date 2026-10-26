"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { PanelProps } from "./ScholarshipList";
import { STANDARD_DOCUMENTS, SCHOLARSHIP_STATUSES, type Scholarship, type ScholarshipInput } from "@/lib/types";
import { linkDocuments } from "@/lib/importScholarships";

const EMPTY: ScholarshipInput = {
  name: "",
  provider: null,
  country: null,
  universities: null,
  degree_level: "Master",
  funding_type: null,
  funding_details: null,
  deadline: null,
  deadline_note: null,
  official_link: null,
  syrian_eligible: null,
  apply_from_kazakhstan: null,
  eligibility_summary: null,
  english_requirement: null,
  application_steps: null,
  notes: null,
  status: "Researching",
};

const SHORT_FIELDS: [keyof ScholarshipInput, string][] = [
  ["provider", "Provider"],
  ["country", "Country"],
  ["universities", "Universities"],
  ["degree_level", "Degree level"],
  ["funding_type", "Funding type (Full / Partial)"],
  ["official_link", "Official link"],
  ["syrian_eligible", "Open to Syrians? (Yes / Unclear)"],
  ["apply_from_kazakhstan", "Apply from Kazakhstan?"],
  ["english_requirement", "English requirement"],
  ["deadline_note", "Deadline note"],
];

const LONG_FIELDS: [keyof ScholarshipInput, string][] = [
  ["funding_details", "Funding details"],
  ["eligibility_summary", "Eligibility"],
  ["application_steps", "How to apply"],
  ["notes", "Notes"],
];

export default function ScholarshipForm({
  existing,
  data,
  reload,
  supabase,
  onClose,
}: PanelProps & { existing?: Scholarship; onClose: () => void }) {
  const [form, setForm] = useState<ScholarshipInput>(() => {
    if (!existing) return EMPTY;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = existing;
    return rest;
  });
  const linkedIds = existing
    ? data.links.filter((l) => l.scholarship_id === existing.id).map((l) => l.document_id)
    : [];
  const [docs, setDocs] = useState<string[]>(
    data.documents.filter((d) => linkedIds.includes(d.id)).map((d) => d.name)
  );
  const [newDoc, setNewDoc] = useState("");
  const [saving, setSaving] = useState(false);

  const docOptions = [...new Set([...STANDARD_DOCUMENTS, ...data.documents.map((d) => d.name), ...docs])];
  const set = (key: keyof ScholarshipInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value.trim() === "" ? null : value }));
  const toggleDoc = (name: string) =>
    setDocs((list) => (list.includes(name) ? list.filter((d) => d !== name) : [...list, name]));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let id = existing?.id;
      if (id) {
        const { error } = await supabase.from("scholarships").update(form).eq("id", id);
        if (error) throw error;
        // Remove links for unchecked documents
        const keepIds = data.documents.filter((d) => docs.includes(d.name)).map((d) => d.id);
        const removeIds = linkedIds.filter((d) => !keepIds.includes(d));
        if (removeIds.length) {
          await supabase.from("scholarship_documents").delete().eq("scholarship_id", id).in("document_id", removeIds);
        }
      } else {
        const { data: row, error } = await supabase.from("scholarships").insert(form).select("id").single();
        if (error) throw error;
        id = row.id as string;
      }
      await linkDocuments(supabase, id, docs, [...data.documents]);
      await reload();
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={existing ? `Edit: ${existing.name}` : "Add scholarship"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Deadline</label>
            <input type="date" value={form.deadline ?? ""} onChange={(e) => set("deadline", e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Scholarship["status"] })}
              className="input"
            >
              {SCHOLARSHIP_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {SHORT_FIELDS.map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input value={(form[key] as string) ?? ""} onChange={(e) => set(key, e.target.value)} className="input" />
            </div>
          ))}
        </div>

        {LONG_FIELDS.map(([key, label]) => (
          <div key={key}>
            <label className="label">{label}</label>
            <textarea rows={2} value={(form[key] as string) ?? ""} onChange={(e) => set(key, e.target.value)} className="input" />
          </div>
        ))}

        <div>
          <label className="label">Required documents</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {docOptions.map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => toggleDoc(name)}
                className={`badge border cursor-pointer py-1 px-3 ${
                  docs.includes(name)
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-slate-900 border-slate-700 text-slate-300"
                }`}
              >
                {docs.includes(name) ? "✓ " : ""}
                {name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              placeholder="Other document..."
              className="input"
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (newDoc.trim() && !docs.includes(newDoc.trim())) setDocs([...docs, newDoc.trim()]);
                setNewDoc("");
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
