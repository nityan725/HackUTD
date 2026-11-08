import { config } from "./config";
import type { Account, Snapshot } from "./types";

/** Recompute every account balance from Nessie's stored balance + newer transactions. */
export function withBalances(snap: Snapshot): Snapshot {
  const accounts = snap.accounts.map((a) => {
    const recent = snap.txs.filter(
      (t) => t.accountId === a.id && (t.date > config.balanceAsOf || t.description.startsWith("Runway")),
    );
    let bal = a.startBalance;
    for (const t of recent) {
      const sign = t.kind === "deposit" ? 1 : -1;
      // On a credit card, purchases increase what you owe and deposits (payments) reduce it
      bal += a.type === "Credit Card" ? -sign * t.amount : sign * t.amount;
    }
    return { ...a, balance: Math.round(bal * 100) / 100 };
  });
  return { ...snap, accounts };
}

const find = (snap: Snapshot, type: string): Account | undefined =>
  snap.accounts.find((a) => a.type.toLowerCase() === type.toLowerCase());

export const checking = (s: Snapshot) => find(s, "Checking");
export const savings = (s: Snapshot) => find(s, "Savings");
export const card = (s: Snapshot) => find(s, "Credit Card");
