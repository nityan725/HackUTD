"use client";
import { useState } from "react";
import type { Score } from "@/lib/health";
import { IconBadge, type Tone } from "./Icon";

const SCORE_ICONS: Record<string, { icon: string; tone: Tone }> = {
  cushion: { icon: "shield", tone: "green" },
  debt: { icon: "scale", tone: "orange" },
  credit: { icon: "card", tone: "purple" },
  coverage: { icon: "calendar", tone: "blue" },
};
import { statusDot, statusFg } from "./ui";

export default function HealthGrid({ scores }: { scores: Score[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {scores.map((s) => (
          <button
            key={s.id}
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className={`rounded-2xl bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,.06)] transition ${open === s.id ? "ring-2 ring-accent/40" : ""}`}
          >
            <div className="flex items-center justify-between">
              <IconBadge name={SCORE_ICONS[s.id]?.icon ?? "bolt"} tone={SCORE_ICONS[s.id]?.tone ?? "green"} size="sm" />
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot[s.status]}`} />
            </div>
            <span className="mt-3 block text-xs font-medium text-muted">{s.name}</span>
            <p className={`tabular mt-0.5 text-2xl font-bold ${statusFg[s.status]}`}>{s.value}</p>
          </button>
        ))}
      </div>
      {open && (
        <p className="rise mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-muted">
          {scores.find((s) => s.id === open)?.explain}
        </p>
      )}
    </div>
  );
}
