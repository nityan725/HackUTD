"use client";
// "Everything you own and owe" — the whole financial picture in one place.
import Link from "next/link";
import { IconBadge } from "@/components/Icon";
import { Card, ErrorBox, Loading, PageTitle } from "@/components/ui";
import { money } from "@/lib/format";
import { netWorth, type WorthItem } from "@/lib/networth";
import { useRunway } from "@/lib/store";

export default function WorthPage() {
  const { loading, error, snap } = useRunway();
  if (loading) return <Loading />;
  if (error || !snap) return <ErrorBox msg={error ?? "No data"} />;

  const w = netWorth(snap);
  const assetPct = w.totalAssets + w.totalDebts > 0 ? (w.totalAssets / (w.totalAssets + w.totalDebts)) * 100 : 50;

  return (
    <div className="rise">
      <Link href="/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        ← Home
      </Link>
      <PageTitle kicker="The whole picture" title="Everything you own and owe" sub={`${w.count} accounts across ${new Set([...w.assets, ...w.debts].map((i) => i.institution)).size} institutions, in one place.`} />

      {/* Net worth */}
      <Card>
        <p className="text-sm font-medium text-muted">Net worth</p>
        <p className={`tabular mt-1 text-[44px] font-extrabold leading-none tracking-tight ${w.netWorth < 0 ? "text-bad" : ""}`}>{money(w.netWorth)}</p>
        <p className="mt-2 text-sm text-muted">
          {w.netWorth < 0
            ? "Normal for a student with loans. What matters is that it's moving up."
            : "You own more than you owe. Nice."}
        </p>

        {/* Own vs owe bar */}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-bad-soft">
          <div className="h-full rounded-full bg-good" style={{ width: `${assetPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs">
          <span className="font-semibold text-good">You own {money(w.totalAssets)}</span>
          <span className="font-semibold text-bad">You owe {money(w.totalDebts)}</span>
        </div>
      </Card>

      <Group title="What you own" total={w.totalAssets} items={w.assets} />
      <Group title="What you owe" total={w.totalDebts} items={w.debts} debt />

      <p className="mt-5 text-center text-xs text-muted">
        Checking, savings, card and car loan come from Capital One Nessie. Accounts marked &quot;Linked elsewhere&quot; would connect
        securely through a service like Plaid in the real app.
      </p>
    </div>
  );
}

function Group({ title, total, items, debt }: { title: string; total: number; items: WorthItem[]; debt?: boolean }) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className={`tabular font-bold ${debt ? "text-bad" : "text-good"}`}>{money(total)}</span>
      </div>
      <Card flush className="divide-y divide-line">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 px-4 py-3.5">
            <IconBadge name={i.icon} tone={i.tone} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{i.name}</p>
              <p className="truncate text-xs text-muted">
                {i.institution}
                {i.detail ? ` · ${i.detail}` : ""}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${i.source === "Nessie" ? "bg-accent-soft text-accent" : "bg-canvas text-muted"}`}
              >
                {i.source}
              </span>
            </div>
            <p className={`tabular font-semibold ${debt ? "text-bad" : ""}`}>{money(i.balance)}</p>
          </div>
        ))}
      </Card>
    </section>
  );
}
