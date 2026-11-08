"use client";
// Profile screen — DEMO ONLY. It shows what settings would look like.
// Toggles flip on screen, but nothing is saved yet.
import Link from "next/link";
import { useState } from "react";
import { Icon, IconBadge, type Tone } from "@/components/Icon";
import { ErrorBox, Loading } from "@/components/ui";
import { config } from "@/lib/config";
import { fmtDay } from "@/lib/dates";
import { money } from "@/lib/format";
import { useRunway } from "@/lib/store";

export default function ProfilePage() {
  const { loading, error, snap, base, signOut } = useRunway();
  const [toast, setToast] = useState<string | null>(null);
  const [toggles, setToggles] = useState({ crunch: true, bills: true, letter: true, faceId: false });

  if (loading) return <Loading />;
  if (error || !snap || !base) return <ErrorBox msg={error ?? "No data"} />;

  const name = snap.customerName;
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  const flip = (k: keyof typeof toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  return (
    <div className="rise">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,.08)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Profile</h1>
      </div>

      {/* Who */}
      <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,.06)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white">{name[0]}</div>
        <p className="mt-3 text-xl font-bold">{name}</p>
        <p className="text-sm text-muted">{name.toLowerCase()}@runway.app</p>
        <button onClick={() => showToast("Editing your profile is coming soon.")} className="mt-3 rounded-full bg-accent-soft px-4 py-1.5 text-xs font-semibold text-accent">
          Edit profile
        </button>
      </div>

      {/* How Runway calculates */}
      <Section title="How Runway calculates" note="These make every number in the app yours.">
        <Row icon="clock" tone="purple" label="Hourly wage" value={`$${config.hourlyWage}/hr`} onClick={() => showToast("You'll be able to edit this soon.")} />
        <Row
          icon="calendar"
          tone="blue"
          label="Payday"
          value={`Every ${base.paycheck.cadence} days`}
          sub={base.nextPayday ? `Next: ${fmtDay(base.nextPayday)} · ${money(base.paycheck.amount)}` : undefined}
          onClick={() => showToast("You'll be able to edit this soon.")}
        />
        <Row icon="card" tone="pink" label="Card limit" value={money(config.cardLimit)} onClick={() => showToast("You'll be able to edit this soon.")} />
        <Row icon="shield" tone="green" label="Safety buffer" value={money(config.buffer)} sub="Warn me before checking drops below this" onClick={() => showToast("You'll be able to edit this soon.")} />
      </Section>

      {/* Connected accounts */}
      <Section title="Connected accounts" note="From Capital One Nessie (sandbox).">
        {snap.accounts.map((a) => (
          <Row
            key={a.id}
            icon={a.type === "Savings" ? "coins" : a.type === "Credit Card" ? "card" : "bank"}
            tone={a.type === "Savings" ? "green" : a.type === "Credit Card" ? "purple" : "blue"}
            label={a.nickname}
            sub={a.type}
            value={a.type === "Credit Card" ? `${money(a.balance)} owed` : money(a.balance)}
          />
        ))}
        {snap.loans.map((l) => (
          <Row key={l.id} icon="car" tone="orange" label={l.description} sub="Loan" value={`${money(l.monthlyPayment)}/mo`} />
        ))}
        <button
          onClick={() => showToast("In the real app, this opens a secure bank connection (like Plaid). No account numbers are typed in.")}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-semibold text-accent"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-dashed border-accent/40 text-xl">+</span>
          Link an account
        </button>
      </Section>

      {/* Alerts */}
      <Section title="Alerts">
        <ToggleRow icon="alert" tone="red" label="Cash-crunch warnings" sub="When a dip below $0 is coming" on={toggles.crunch} onChange={() => flip("crunch")} />
        <ToggleRow icon="calendar" tone="amber" label="Big bill reminders" sub="3 days before rent and loans" on={toggles.bills} onChange={() => flip("bills")} />
        <ToggleRow icon="mail" tone="teal" label="Monthly letter" sub="On the 1st of each month" on={toggles.letter} onChange={() => flip("letter")} />
      </Section>

      {/* Security */}
      <Section title="Security & privacy">
        <ToggleRow icon="lock" tone="purple" label="Face ID to open" on={toggles.faceId} onChange={() => flip("faceId")} />
        <Row icon="shield" tone="green" label="Money never moves without your tap" sub="Every fix needs your approval" />
        <Row icon="bank" tone="blue" label="Your data" sub="Read from Nessie only to build your forecast" />
      </Section>

      <button onClick={signOut} className="mt-6 w-full rounded-2xl bg-white py-3.5 font-bold text-bad shadow-[0_1px_2px_rgba(15,23,42,.06)]">
        Sign out
      </button>
      <p className="mt-3 text-center text-xs text-muted">Runway · demo version</p>

      {toast && (
        <div className="rise fixed inset-x-0 bottom-28 z-40 mx-auto w-[min(380px,90%)] rounded-2xl bg-ink px-4 py-3 text-center text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="px-1 text-sm font-bold uppercase tracking-wider text-muted">{title}</h2>
      {note && <p className="px-1 text-xs text-muted">{note}</p>}
      <div className="mt-2 divide-y divide-line overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(15,23,42,.06)]">{children}</div>
    </section>
  );
}

function Row({ icon, tone, label, sub, value, onClick }: { icon: string; tone: Tone; label: string; sub?: string; value?: string; onClick?: () => void }) {
  const inner = (
    <>
      <IconBadge name={icon} tone={tone} />
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
      {value && <span className="tabular text-sm font-semibold">{value}</span>}
      {onClick && <Icon name="chevron" className="h-4 w-4 text-muted" />}
    </>
  );
  return onClick ? (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
      {inner}
    </button>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
  );
}

function ToggleRow({ icon, tone, label, sub, on, onChange }: { icon: string; tone: Tone; label: string; sub?: string; on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-3 px-4 py-3.5 text-left" role="switch" aria-checked={on}>
      <IconBadge name={icon} tone={tone} />
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? "bg-accent" : "bg-line"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
