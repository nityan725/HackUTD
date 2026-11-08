"use client";
import { useState } from "react";
import { Icon, IconBadge } from "@/components/Icon";
import { Card, ErrorBox, Loading, PageTitle } from "@/components/ui";
import { letterFacts } from "@/lib/letter";
import { useRunway } from "@/lib/store";

export default function LetterPage() {
  const { loading, error, snap, base } = useRunway();
  const [letter, setLetter] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (error || !snap || !base) return <ErrorBox msg={error ?? "No data"} />;

  const facts = letterFacts(snap, base);

  async function write() {
    setBusy(true);
    try {
      const r = await fetch("/api/letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(facts),
      });
      const j = await r.json();
      setLetter(j.letter);
      setSource(j.source);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise">
      <PageTitle kicker="Monthly letter" title={`Your ${facts.month} letter`} sub="A short note from future you: one win, one risk, three moves." />

      {!letter && (
        <Card className="text-center">
          <div className="flex justify-center">
            <IconBadge name="mail" tone="green" size="lg" />
          </div>
          <p className="mt-3 text-sm text-muted">Kit has already crunched your numbers. Want them as a letter?</p>
          <button
            onClick={write}
            disabled={busy}
            className="mt-4 w-full rounded-2xl bg-accent py-3.5 font-bold text-white disabled:opacity-60"
          >
            {busy ? "Writing…" : "Open my letter"}
          </button>
        </Card>
      )}

      {letter && (
        <div className="rise">
          <div className="rounded-3xl bg-[#fffdf7] p-6 shadow-[0_1px_2px_rgba(15,23,42,.06)] ring-1 ring-[#efe7d2]">
            <LetterBody text={letter} />
          </div>
          <p className="mt-3 flex gap-2 rounded-2xl bg-white px-4 py-3 text-xs text-muted">
            <Icon name="lock" className="h-4 w-4 shrink-0 text-accent" />
            <span>
            Every number above was calculated by Kit&apos;s code from your Nessie data.
            {source === "ai" ? " AI only wrote the words." : " (Written from a template — add an AI key to personalize the wording.)"}
            </span>
          </p>
          <button onClick={write} disabled={busy} className="mt-3 w-full text-center text-sm font-semibold text-accent">
            {busy ? "Rewriting…" : "Rewrite"}
          </button>
        </div>
      )}

      <h2 className="mb-3 mt-6 text-lg font-bold">The numbers behind it</h2>
      <Card className="space-y-2 text-sm">
        <Row k="Paychecks, last 30 days" v={`$${facts.moneyIn30.toLocaleString()}`} />
        <Row k="Everyday spending, last 30 days" v={`$${facts.spent30.toLocaleString()}`} />
        {facts.topCategories.map((c) => (
          <Row key={c.name} k={`   ${c.name}`} v={`$${Math.round(c.amount)}`} />
        ))}
        {facts.scores.map((s) => (
          <Row key={s.name} k={s.name} v={s.value} />
        ))}
      </Card>
    </div>
  );
}

/** Shows the letter, with icons next to "The win" and "The risk" lines. */
function LetterBody({ text }: { text: string }) {
  return (
    <div className="space-y-1 font-serif text-[15px] leading-relaxed">
      {text.split("\n").map((raw, i) => {
        const line = raw.replace(/^[^A-Za-z0-9—–-]+(?=The (win|risk))/, "");
        if (/^The win/i.test(line) || /^The risk/i.test(line)) {
          const win = /^The win/i.test(line);
          return (
            <div key={i} className="flex items-start gap-3 py-1">
              <IconBadge name={win ? "trophy" : "alert"} tone={win ? "amber" : "red"} size="sm" />
              <p className="pt-1">{line}</p>
            </div>
          );
        }
        return line.trim() ? <p key={i}>{line}</p> : <div key={i} className="h-2" />;
      })}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="whitespace-pre text-muted">{k}</span>
      <span className="tabular font-semibold">{v}</span>
    </div>
  );
}
