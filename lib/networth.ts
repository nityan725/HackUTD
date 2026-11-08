// "Everything you own and owe": Nessie accounts + accounts linked elsewhere.
import { fmtDay } from "./dates";
import type { Snapshot } from "./types";

export interface WorthItem {
  id: string;
  name: string;
  type: string;
  institution: string;
  balance: number;
  source: "Nessie" | "Linked elsewhere";
  icon: string;
  tone: "green" | "blue" | "purple" | "orange" | "red" | "amber" | "teal" | "pink";
  detail?: string;
}

const ICONS: Record<string, [string, WorthItem["tone"]]> = {
  Checking: ["bank", "blue"],
  Savings: ["coins", "green"],
  "Credit Card": ["card", "purple"],
  CD: ["lock", "teal"],
  "Roth IRA": ["trendUp", "amber"],
  "401(k)": ["trendUp", "amber"],
  "Student loan": ["school", "red"],
  Mortgage: ["home", "red"],
  auto: ["car", "orange"],
};
const look = (t: string): [string, WorthItem["tone"]] => ICONS[t] ?? ["coins", "green"];

export function netWorth(snap: Snapshot) {
  const assets: WorthItem[] = [];
  const debts: WorthItem[] = [];

  for (const a of snap.accounts) {
    const [icon, tone] = look(a.type);
    const item: WorthItem = {
      id: a.id,
      name: a.nickname,
      type: a.type,
      institution: "Capital One (Nessie)",
      balance: Math.abs(a.balance),
      source: "Nessie",
      icon,
      tone,
    };
    (a.type === "Credit Card" ? debts : assets).push(item);
  }
  for (const l of snap.loans) {
    const [icon, tone] = look(l.type);
    debts.push({
      id: l.id,
      name: l.description || "Loan",
      type: `${l.type[0].toUpperCase()}${l.type.slice(1)} loan`,
      institution: "Capital One (Nessie)",
      balance: l.amount,
      source: "Nessie",
      icon,
      tone,
      detail: `$${l.monthlyPayment}/month`,
    });
  }
  for (const h of snap.external ?? []) {
    const [icon, tone] = look(h.type);
    const bits: string[] = [];
    if (h.rate) bits.push(`${(h.rate * 100).toFixed(1)}% ${h.kind === "asset" ? "APY" : "APR"}`);
    if (h.maturesOn) bits.push(`matures ${fmtDay(h.maturesOn)}`);
    if (h.note) bits.push(h.note);
    (h.kind === "asset" ? assets : debts).push({
      id: h.id,
      name: h.name,
      type: h.type,
      institution: h.institution,
      balance: h.balance,
      source: "Linked elsewhere",
      icon,
      tone,
      detail: bits.join(" · "),
    });
  }

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalDebts = debts.reduce((s, d) => s + d.balance, 0);
  const cash = snap.accounts.filter((a) => a.type !== "Credit Card").reduce((s, a) => s + a.balance, 0);
  return { assets, debts, totalAssets, totalDebts, netWorth: totalAssets - totalDebts, cash, count: assets.length + debts.length };
}
