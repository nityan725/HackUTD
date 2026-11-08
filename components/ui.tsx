"use client";
import type { Status } from "@/lib/types";

export const statusText: Record<Status, string> = { green: "On track", yellow: "Tight", red: "Short" };
export const statusBg: Record<Status, string> = { green: "bg-good-soft", yellow: "bg-warn-soft", red: "bg-bad-soft" };
export const statusFg: Record<Status, string> = { green: "text-good", yellow: "text-warn", red: "text-bad" };
export const statusDot: Record<Status, string> = { green: "bg-good", yellow: "bg-warn", red: "bg-bad" };

export function Card({ children, className = "", flush = false }: { children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <div className={`rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,.06)] ${flush ? "" : "p-5"} ${className}`}>{children}</div>
  );
}

export function Pill({ status, children }: { status: Status; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusBg[status]} ${statusFg[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
      {children ?? statusText[status]}
    </span>
  );
}

export function PageTitle({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <header className="mb-5">
      {kicker && <p className="text-xs font-semibold uppercase tracking-wider text-accent">{kicker}</p>}
      <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  );
}

export function Loading() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <p className="text-sm">Checking your accounts…</p>
    </div>
  );
}

export function ErrorBox({ msg }: { msg: string }) {
  return <Card className="text-sm text-bad">Something went wrong: {msg}</Card>;
}

export function DataNote({ note }: { note?: string }) {
  if (!note) return null;
  return <p className="mb-3 rounded-xl bg-warn-soft px-3 py-2 text-xs text-warn">{note}</p>;
}
