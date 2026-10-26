import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Single-user login: the password is checked against the one Supabase account (OWNER_EMAIL).
// The email stays on the server, so the login page only asks for a password.
export async function POST(request: Request) {
  const email = process.env.OWNER_EMAIL;
  if (!email) {
    return NextResponse.json({ error: "OWNER_EMAIL is not set on the server." }, { status: 500 });
  }

  const { password } = await request.json().catch(() => ({ password: "" }));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(password ?? "") });

  if (error) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
