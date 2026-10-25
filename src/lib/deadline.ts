// Deadlines are stored as plain dates (YYYY-MM-DD); compare in local time.
export function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const [y, m, d] = deadline.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function deadlineLabel(deadline: string | null): string {
  const days = daysLeft(deadline);
  if (days === null) return "No deadline yet";
  if (days < 0) return `Closed ${-days}d ago`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

// Tailwind classes for the countdown badge: red < 7 days, orange < 30, green otherwise
export function deadlineColor(deadline: string | null): string {
  const days = daysLeft(deadline);
  if (days === null) return "bg-slate-100 text-slate-600";
  if (days < 0) return "bg-slate-200 text-slate-500 line-through";
  if (days < 7) return "bg-red-100 text-red-700";
  if (days < 30) return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}
