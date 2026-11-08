import type { Snapshot } from "./types";

// An exact copy of Carrie's demo data as seeded in your Nessie account (Nov 7, 2026).
// Kit uses this automatically if Nessie can't be reached, so the demo never breaks.
const CHK = "e2a36f0b-eadc-4f09-935c-4a8d5e4867ba";
const SAV = "95583174-618a-43e3-950c-6e0bd42e0c73";
const CARD = "cdc6bfa8-8939-4580-84f5-a76f6a3dcf79";

const purchases: [string, number, string][] = [
  ["2026-11-06", 42, "Groceries"],
  ["2026-11-05", 6, "Coffee"],
  ["2026-11-03", 38, "Gas"],
  ["2026-11-02", 13, "Dining"],
  ["2026-10-31", 18, "Rides"],
  ["2026-10-30", 36, "Groceries"],
  ["2026-10-28", 47, "Shopping"],
  ["2026-10-26", 5, "Coffee"],
  ["2026-10-24", 12, "Dining"],
  ["2026-10-22", 41, "Gas"],
  ["2026-10-20", 39, "Groceries"],
  ["2026-10-17", 14, "Dining"],
  ["2026-10-14", 16, "Rides"],
];

export function mockSnapshot(): Snapshot {
  return {
    customerName: "Carrie",
    source: "mock",
    accounts: [
      { id: CHK, type: "Checking", nickname: "Everyday Checking", startBalance: 1720, balance: 1720 },
      { id: SAV, type: "Savings", nickname: "Emergency Fund", startBalance: 1800, balance: 1800 },
      { id: CARD, type: "Credit Card", nickname: "Student Card", startBalance: 540, balance: 540 },
    ],
    txs: [
      ...["2026-09-12", "2026-09-26", "2026-10-10", "2026-10-24", "2026-11-07"].map((date, i) => ({
        id: `dep${i}`,
        accountId: CHK,
        kind: "deposit" as const,
        date,
        amount: 980,
        description: "Paycheck",
      })),
      ...purchases.map(([date, amount, description], i) => ({
        id: `buy${i}`,
        accountId: CHK,
        kind: "purchase" as const,
        date,
        amount,
        description,
      })),
    ],
    bills: [
      { id: "b1", accountId: CHK, payee: "Rent", amount: 850, recurringDay: 18 },
      { id: "b2", accountId: CHK, payee: "Phone", amount: 45, recurringDay: 5 },
      { id: "b3", accountId: CHK, payee: "Netflix", amount: 15.99, recurringDay: 12 },
      { id: "b4", accountId: CHK, payee: "Spotify", amount: 10.99, recurringDay: 20 },
    ],
    loans: [
      { id: "l1", accountId: CHK, type: "auto", amount: 14000, monthlyPayment: 310, description: "Car loan" },
    ],
  };
}
