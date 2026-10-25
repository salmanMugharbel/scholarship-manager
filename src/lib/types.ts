export const SCHOLARSHIP_STATUSES = [
  "Researching",
  "Preparing",
  "Submitted",
  "Accepted",
  "Rejected",
] as const;
export type ScholarshipStatus = (typeof SCHOLARSHIP_STATUSES)[number];

export const DOCUMENT_STATUSES = ["Not started", "In progress", "Ready"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const STANDARD_DOCUMENTS = [
  "Passport",
  "Bachelor's Diploma",
  "Bachelor's Transcript",
  "CV",
  "Motivation Letter",
  "Recommendation Letter",
  "English Test Certificate",
  "Research Proposal",
  "Personal Photo",
  "Medical Certificate",
  "Police Clearance",
  "Portfolio",
  "Work Experience Letter",
];

export interface Scholarship {
  id: string;
  name: string;
  provider: string | null;
  country: string | null;
  universities: string | null;
  degree_level: string | null;
  funding_type: string | null;
  funding_details: string | null;
  deadline: string | null;
  deadline_note: string | null;
  official_link: string | null;
  syrian_eligible: string | null;
  apply_from_kazakhstan: string | null;
  eligibility_summary: string | null;
  english_requirement: string | null;
  application_steps: string | null;
  notes: string | null;
  status: ScholarshipStatus;
  verified: boolean;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  status: DocumentStatus;
  due_date: string | null;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
}

export interface ScholarshipDocument {
  scholarship_id: string;
  document_id: string;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  scholarship_id: string | null;
  created_at: string;
}

// Editable scholarship fields (everything the AI JSON or the form can set)
export type ScholarshipInput = Omit<Scholarship, "id" | "created_at" | "status" | "verified"> & {
  status?: ScholarshipStatus;
  verified?: boolean;
};
