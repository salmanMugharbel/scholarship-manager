"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
        <div className="text-3xl mb-2">🎓</div>
        <h1 className="text-xl font-semibold mb-1">Scholarship Manager</h1>
        <p className="text-sm text-slate-400 mb-6">Enter your password. This device will stay unlocked.</p>

        <form onSubmit={unlock} className="space-y-3">
          <input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
          />
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Unlocking..." : "Unlock"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </main>
  );
}
