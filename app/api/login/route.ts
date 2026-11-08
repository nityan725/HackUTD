import { NextResponse } from "next/server";
import { COOKIE, makeSession } from "@/lib/session";
import { USERS } from "@/lib/users";

// Body: { email, password }
export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const user = USERS.find(
    (u) => u.email.toLowerCase() === String(email || "").trim().toLowerCase() && u.password === password,
  );
  if (!user) {
    return NextResponse.json({ error: "That email and password don't match." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(COOKIE, makeSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return res;
}
