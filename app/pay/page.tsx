"use client";
// Pay & request: peer-to-peer money between friends, through Capital One Nessie.
import Link from "next/link";
import { useState } from "react";
import { Icon, IconBadge } from "@/components/Icon";
import { Card, ErrorBox, Loading, PageTitle } from "@/components/ui";
import { config } from "@/lib/config";
import { fmtDay } from "@/lib/dates";
import { hours, money } from "@/lib/format";
import { iouStatus, p2pActivity } from "@/lib/p2p";
import { useRunway } from "@/lib/store";

export default function PayPage() {
  const { loading, error, snap, p2p } = useRunway();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (loading) return <Loading />;
  if (error || !snap) return <ErrorBox msg={error ?? "No data"} />;

  const ious = iouStatus(snap);
  const friends = [...new Map(ious.map((i) => [i.friendId, i.friendName])).entries()].map(([id, name]) => ({ id, name }));
  const chosen = friendId ?? friends[0]?.id ?? null;
  const chosenName = friends.find((f) => f.id === chosen)?.name ?? "";
  const activity = p2pActivity(snap);
  const amount = Number(amountText);

  async function run(key: string, fId: string, amt: number, kind: "request" | "send", n?: string, name?: string) {
    setBusy(key);
    setMsg(null);
    try {
      await p2p(fId, amt, kind, n);
      setMsg({ ok: true, text: kind === "request" ? `${name} paid you ${money(amt, { cents: amt % 1 !== 0 })}.` : `You sent ${name} ${money(amt, { cents: amt % 1 !== 0 })}.` });
      setAmountText("");
      setNote("");
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rise">
      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        ← Home
      </Link>
      <PageTitle kicker="Pay & request" title="Money with friends" sub="Split costs and settle up. Every transfer goes through Capital One Nessie." />

      {msg && (
        <p className={`rise mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>{msg.text}</p>
      )}

      {/* Who owes who */}
      <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wider text-muted">Settle up</h2>
      <div className="space-y-3">
        {ious.length === 0 && <Card className="text-sm text-muted">No one owes anyone right now.</Card>}
        {ious.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">{i.friendName[0]}</span>
              <div className="flex-1">
                <p className="font-semibold">
                  {i.outstanding === 0
                    ? `You and ${i.friendName} are even`
                    : i.direction === "owesYou"
                      ? `${i.friendName} owes you ${money(i.outstanding)}`
                      : `You owe ${i.friendName} ${money(i.outstanding)}`}
                </p>
                <p className="text-xs text-muted">
                  {i.note}
                  {i.paid > 0 ? ` · ${money(i.paid)} paid so far` : ""}
                </p>
              </div>
            </div>
            {i.outstanding > 0 && (
              <button
                disabled={!!busy}
                onClick={() =>
                  run(i.id, i.friendId, i.outstanding, i.direction === "owesYou" ? "request" : "send", i.note, i.friendName)
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <Icon name={i.direction === "owesYou" ? "request" : "send"} className="h-4 w-4" />
                {busy === i.id
                  ? "Working…"
                  : i.direction === "owesYou"
                    ? `Request ${money(i.outstanding)}`
                    : `Pay back ${money(i.outstanding)}`}
              </button>
            )}
            {i.direction === "youOwe" && i.outstanding > 0 && (
              <p className="mt-2 text-center text-[11px] text-muted">= {hours(i.outstanding / config.hourlyWage)} of work</p>
            )}
          </Card>
        ))}
      </div>

      {/* Send or request any amount */}
      {friends.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 px-1 text-sm font-bold uppercase tracking-wider text-muted">Send or request</h2>
          <Card>
            <div className="flex gap-2">
              {friends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFriendId(f.id)}
                  className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold ${chosen === f.id ? "border-accent bg-accent-soft text-accent" : "border-line"}`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-white">{f.name[0]}</span>
                  {f.name}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1 border-b-2 border-line pb-2 focus-within:border-accent">
              <span className="text-2xl font-bold text-muted">$</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                className="tabular w-full bg-transparent text-3xl font-extrabold outline-none"
              />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's it for? (e.g. Pizza night)"
              maxLength={40}
              className="mt-3 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                disabled={!!busy || !(amount > 0) || !chosen}
                onClick={() => chosen && run("req", chosen, amount, "request", note, chosenName)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-accent py-3 text-sm font-bold text-accent disabled:opacity-40"
              >
                <Icon name="request" className="h-4 w-4" />
                {busy === "req" ? "…" : "Request"}
              </button>
              <button
                disabled={!!busy || !(amount > 0) || !chosen}
                onClick={() => chosen && run("send", chosen, amount, "send", note, chosenName)}
                className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-40"
              >
                <Icon name="send" className="h-4 w-4" />
                {busy === "send" ? "…" : "Send"}
              </button>
            </div>
            {amount > 0 && (
              <p className="mt-3 text-center text-xs text-muted">
                {money(amount)} = {hours(amount / config.hourlyWage)} of your work
              </p>
            )}
          </Card>
        </>
      )}

      {/* Activity */}
      <h2 className="mb-2 mt-6 px-1 text-sm font-bold uppercase tracking-wider text-muted">Activity</h2>
      <Card flush className="divide-y divide-line">
        {activity.length === 0 && <p className="px-4 py-4 text-sm text-muted">No transfers yet.</p>}
        {activity.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <IconBadge name={a.incoming ? "request" : "send"} tone={a.incoming ? "green" : "blue"} size="sm" />
            <div className="flex-1">
              <p className="text-sm font-medium">{a.who}</p>
              <p className="text-xs text-muted">
                {a.note} · {fmtDay(a.date)}
              </p>
            </div>
            <p className={`tabular font-semibold ${a.incoming ? "text-good" : ""}`}>
              {a.incoming ? "+" : "−"}
              {money(a.amount, { cents: a.amount % 1 !== 0 })}
            </p>
          </div>
        ))}
      </Card>
      <p className="mt-3 text-center text-xs text-muted">Peer-to-peer transfers between Nessie customers (sandbox money).</p>
    </div>
  );
}
