"use client";

import { useState } from "react";
import Modal from "./Modal";
import ScholarshipForm from "./ScholarshipForm";
import { STATUS_COLORS, type PanelProps } from "./ScholarshipList";
import { DOC_STATUS_COLORS } from "./TodoList";
import { SCHOLARSHIP_STATUSES, type Scholarship } from "@/lib/types";
import { deadlineColor, deadlineLabel, formatDate } from "@/lib/deadline";

export default function ScholarshipDetail({
  scholarship: s,
  data,
  reload,
  supabase,
  onClose,
}: PanelProps & { scholarship: Scholarship; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(s.notes ?? "");

  const docs = data.documents.filter((d) =>
    data.links.some((l) => l.scholarship_id === s.id && l.document_id === d.id)
  );
  const tasks = data.tasks.filter((t) => t.scholarship_id === s.id);

  async function update(fields: Partial<Scholarship>) {
    const { error } = await supabase.from("scholarships").update(fields).eq("id", s.id);
    if (error) alert(error.message);
    await reload();
  }

  async function remove() {
    if (!confirm(`Delete "${s.name}"? Its documents stay in your to-do list.`)) return;
    await supabase.from("scholarships").delete().eq("id", s.id);
    onClose();
    await reload();
  }

  if (editing) {
    return (
      <ScholarshipForm
        existing={s}
        data={data}
        reload={reload}
        supabase={supabase}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <Modal title={s.name} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className={`badge ${deadlineColor(s.deadline)}`}>{deadlineLabel(s.deadline)}</span>
        <select
          value={s.status}
          onChange={(e) => update({ status: e.target.value as Scholarship["status"] })}
          className={`badge border-0 cursor-pointer ${STATUS_COLORS[s.status]}`}
        >
          {SCHOLARSHIP_STATUSES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 ml-auto">
          <input type="checkbox" checked={s.verified} onChange={(e) => update({ verified: e.target.checked })} />
          I checked the deadline on the official site
        </label>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
        <Field label="Provider" value={s.provider} />
        <Field label="Country" value={s.country} />
        <Field label="Universities" value={s.universities} />
        <Field label="Degree" value={s.degree_level} />
        <Field label="Deadline" value={formatDate(s.deadline)} />
        <Field label="Deadline note" value={s.deadline_note} />
        <Field label="Funding" value={[s.funding_type, s.funding_details].filter(Boolean).join(" — ")} wide />
        <Field label="Open to Syrians?" value={s.syrian_eligible} />
        <Field label="Apply from Kazakhstan?" value={s.apply_from_kazakhstan} />
        <Field label="English requirement" value={s.english_requirement} wide />
        <Field label="Eligibility" value={s.eligibility_summary} wide />
        <Field label="How to apply" value={s.application_steps} wide />
      </dl>

      {s.official_link && (
        <a
          href={s.official_link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary mb-5 w-full sm:w-auto"
        >
          🔗 Open official website
        </a>
      )}

      <section className="mb-5">
        <h4 className="font-medium mb-2">Required documents ({docs.filter((d) => d.status === "Ready").length}/{docs.length} ready)</h4>
        {docs.length === 0 ? (
          <p className="text-sm text-slate-500">No documents linked. Use Edit to add them.</p>
        ) : (
          <ul className="space-y-1.5">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm rounded-lg bg-slate-50 px-3 py-2">
                <span>{d.status === "Ready" ? "✅" : "⬜"} {d.name}</span>
                <span className={`badge ${DOC_STATUS_COLORS[d.status]}`}>{d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tasks.length > 0 && (
        <section className="mb-5">
          <h4 className="font-medium mb-2">Tasks</h4>
          <ul className="space-y-1 text-sm">
            {tasks.map((t) => (
              <li key={t.id} className={t.done ? "line-through text-slate-400" : ""}>
                {t.done ? "✅" : "⬜"} {t.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-5">
        <h4 className="font-medium mb-2">My notes</h4>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (s.notes ?? "") && update({ notes })}
          rows={3}
          className="input"
          placeholder="Anything to remember..."
        />
      </section>

      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
        <button onClick={remove} className="btn-danger mr-auto">Delete</button>
        <button onClick={() => setEditing(true)} className="btn-primary">Edit</button>
      </div>
    </Modal>
  );
}

function Field({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="label">{label}</dt>
      <dd className="whitespace-pre-line">{value || "—"}</dd>
    </div>
  );
}
