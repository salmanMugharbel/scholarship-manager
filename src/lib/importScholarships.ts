import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentItem, ScholarshipInput } from "./types";

export interface ParsedScholarship extends ScholarshipInput {
  required_documents: string[];
}

const TEXT_FIELDS = [
  "provider",
  "country",
  "universities",
  "degree_level",
  "funding_type",
  "funding_details",
  "deadline_note",
  "official_link",
  "syrian_eligible",
  "apply_from_kazakhstan",
  "eligibility_summary",
  "english_requirement",
  "application_steps",
  "notes",
] as const;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s && s.toLowerCase() !== "null" ? s : null;
}

// Accepts the AI's reply as-is: tolerates ```json fences and text around the JSON.
export function parseAiJson(raw: string): ParsedScholarship[] {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end === -1) throw new Error("No JSON found in the pasted text.");

  const data = JSON.parse(cleaned.slice(start, end + 1));
  const list: unknown[] = Array.isArray(data) ? data : data?.scholarships;
  if (!Array.isArray(list)) throw new Error('Expected a "scholarships" list in the JSON.');

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .filter((item) => text(item.name))
    .map((item) => {
      const result = { name: text(item.name)! } as ParsedScholarship;
      for (const field of TEXT_FIELDS) result[field] = text(item[field]);

      // Keep only real YYYY-MM-DD dates; anything else goes into the note.
      const deadline = text(item.deadline);
      if (deadline && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        result.deadline = deadline;
      } else {
        result.deadline = null;
        if (deadline) {
          result.deadline_note = [deadline, result.deadline_note].filter(Boolean).join(" — ");
        }
      }

      const docs = Array.isArray(item.required_documents) ? item.required_documents : [];
      result.required_documents = [...new Set(docs.map(text).filter((d): d is string => !!d))];
      return result;
    });
}

export const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");

// Links a scholarship to documents by name, creating any documents that don't exist yet.
export async function linkDocuments(
  supabase: SupabaseClient,
  scholarshipId: string,
  docNames: string[],
  existingDocs: DocumentItem[]
) {
  const byName = new Map(existingDocs.map((d) => [normalizeName(d.name), d.id]));
  const missing = [...new Set(docNames.map((n) => n.trim()).filter(Boolean))].filter(
    (n) => !byName.has(normalizeName(n))
  );

  if (missing.length) {
    const { data, error } = await supabase
      .from("documents")
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    if (error) throw error;
    for (const d of data ?? []) {
      byName.set(normalizeName(d.name), d.id);
      existingDocs.push({ ...d, status: "Not started", due_date: null, notes: null, file_path: null, file_name: null });
    }
  }

  const links = docNames
    .map((n) => byName.get(normalizeName(n)))
    .filter((id): id is string => !!id)
    .map((document_id) => ({ scholarship_id: scholarshipId, document_id }));

  if (links.length) {
    const { error } = await supabase
      .from("scholarship_documents")
      .upsert(links, { onConflict: "scholarship_id,document_id", ignoreDuplicates: true });
    if (error) throw error;
  }
}

export async function importScholarships(
  supabase: SupabaseClient,
  items: ParsedScholarship[],
  existingDocs: DocumentItem[]
) {
  const docs = [...existingDocs];
  for (const { required_documents, ...scholarship } of items) {
    const { data, error } = await supabase
      .from("scholarships")
      .insert(scholarship)
      .select("id")
      .single();
    if (error) throw error;
    await linkDocuments(supabase, data.id, required_documents, docs);
  }
}
