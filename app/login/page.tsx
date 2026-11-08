"use client";
import { useState } from "react";
import { useRunway } from "@/lib/store";

// Shown on the sign-in screen so judges can try it instantly
const DEMO_ACCOUNTS = [
  { name: "Carrie", email: "carrie@runway.app", blurb: "Part-time job · rent due before payday" },
  { name: "Marcus", email: "marcus@runway.app", blurb: "Full-time · healthy savings" },
];
const DEMO_PASSWORD = "demo123";

export default function LoginPage() {
  const { signIn } = useRunway();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    const em = creds?.email ?? email;
    const pw = creds?.password ?? password;
    if (!em || !pw) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const err = await signIn(em, pw);
    setBusy(false);
    if (err) setError(err);
    else setPassword(""); // clear the form so it's fresh after signing out
  }

  return (
    <div className="rise flex min-h-[calc(100dvh-60px)] flex-col pb-6 sm:min-h-[800px]">
      {/* Brand */}
      <div className="-mx-5 -mt-5 rounded-b-[36px] bg-accent px-6 pb-10 pt-14 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Runway logo" className="h-14 w-14 rounded-2xl ring-2 ring-white/20" />
        <h1 className="mt-5 text-[34px] font-extrabold leading-tight tracking-tight">Runway</h1>
        <p className="mt-1 text-[15px] text-white/80">See the crunch before it hits. Fix it in one tap.</p>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 pr-16 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-accent"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {error && <p className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-accent py-4 text-base font-bold text-white shadow-lg shadow-accent/25 transition active:scale-[.98] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Demo accounts */}
      <div className="mt-8">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
          <span className="h-px flex-1 bg-line" />
          Try a demo account
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="mt-4 space-y-2.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              disabled={busy}
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
                submit(undefined, { email: a.email, password: DEMO_PASSWORD });
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,.06)] transition active:scale-[.99]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
                {a.name[0]}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{a.name}</span>
                <span className="block text-xs text-muted">{a.blurb}</span>
              </span>
              <span className="text-sm font-semibold text-accent">→</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted">Demo password: {DEMO_PASSWORD}</p>
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] text-muted">
        Bank data from Capital One Nessie (sandbox). No real money moves.
      </p>
    </div>
  );
}
