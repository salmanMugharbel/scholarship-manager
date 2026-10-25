"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  const [linkFailed, setLinkFailed] = useState(false);
  useEffect(() => {
    setLinkFailed(new URLSearchParams(window.location.search).has("error"));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-3xl mb-2">🎓</div>
        <h1 className="text-xl font-semibold mb-1">Scholarship Manager</h1>
        <p className="text-sm text-slate-500 mb-6">
          Sign in with your email. We&apos;ll send you a login link — no password needed.
        </p>

        {state === "sent" ? (
          <div className="rounded-lg bg-emerald-50 text-emerald-800 text-sm p-4">
            Check your inbox at <b>{email}</b> and click the link to sign in.
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
            <button type="submit" disabled={state === "sending"} className="btn-primary w-full">
              {state === "sending" ? "Sending..." : "Send login link"}
            </button>
            {state === "error" && <p className="text-sm text-red-600">{message}</p>}
            {linkFailed && state === "idle" && (
              <p className="text-sm text-red-600">That login link expired or was invalid. Try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
