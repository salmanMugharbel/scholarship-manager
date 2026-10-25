import { STANDARD_DOCUMENTS } from "./types";

export function buildPrompt(today: string): string {
  return `You are a scholarship research assistant. Find currently open or upcoming MASTER'S degree scholarships that I am eligible for.

MY PROFILE
- Nationality: Syrian
- Country of residence: Kazakhstan
- Bachelor's degree: Computer Engineering, graduated [YEAR]
- GPA: [e.g. 3.2/4 or 80/100]
- English test: [e.g. IELTS 6.5 / none yet]
- Field I want to study: [e.g. Computer Science, AI, Data Science, Cybersecurity]
- Preferred countries: [e.g. Germany, Türkiye, Hungary, UK, any]
- Funding: [Fully funded only / Partial is OK]
- Work experience: [e.g. 1 year software developer / none]

RULES
1. Only include scholarships that are open to Syrian citizens. If eligibility for Syrians is unclear, still include it but set "syrian_eligible" to "Unclear".
2. Note if I can apply from Kazakhstan or if an embassy/residency requirement applies.
3. Only include scholarships with deadlines after ${today}. If the next round's date is not announced yet, set "deadline" to null and explain in "deadline_note".
4. Never invent information. Use the official scholarship website as the link, not a blog.
5. Give me at least 10 scholarships, sorted by nearest deadline.
6. For "required_documents", use ONLY these names where they apply (add new names only if truly needed):
   ${STANDARD_DOCUMENTS.map((d) => `"${d}"`).join(", ")}

OUTPUT
Reply with ONLY valid JSON, no text before or after, in exactly this format:

{
  "scholarships": [
    {
      "name": "",
      "provider": "",
      "country": "",
      "universities": "",
      "degree_level": "Master",
      "funding_type": "Full or Partial",
      "funding_details": "tuition, monthly stipend amount, flights, insurance...",
      "deadline": "YYYY-MM-DD or null",
      "deadline_note": "",
      "official_link": "",
      "syrian_eligible": "Yes or Unclear",
      "apply_from_kazakhstan": "Yes / No / Unclear + short reason",
      "eligibility_summary": "",
      "english_requirement": "",
      "required_documents": [],
      "application_steps": "",
      "notes": ""
    }
  ]
}`;
}
