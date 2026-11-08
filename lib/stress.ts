import { config } from "./config";
import { mergeChanges } from "./forecast";
import type { Changes, Snapshot } from "./types";

export interface Scenario {
  id: string;
  label: string;
  icon: string;
  tone: "blue" | "purple" | "orange" | "red";
  changes: (snap: Snapshot) => Changes;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "rent",
    label: "Rent goes up $100",
    icon: "home",
    tone: "blue",
    changes: () => ({ billDeltas: [{ match: "rent", delta: 100 }] }),
  },
  {
    id: "hours",
    label: "Lose 10 hours of work",
    icon: "clock",
    tone: "purple",
    changes: () => ({ incomeDeltaPerPaycheck: -10 * config.hourlyWage }),
  },
  {
    id: "car",
    label: "$800 car repair",
    icon: "wrench",
    tone: "orange",
    changes: () => ({ oneTime: [{ offset: 3, amount: -800, label: "Car repair" }] }),
  },
  {
    id: "income",
    label: "Paycheck cut 20%",
    icon: "trendDown",
    tone: "red",
    changes: (snap) => {
      const pays = snap.txs.filter((t) => t.kind === "deposit" && /pay/i.test(t.description));
      const avg = pays.length ? pays.reduce((s, t) => s + t.amount, 0) / pays.length : 0;
      return { incomeDeltaPerPaycheck: -0.2 * avg };
    },
  },
];

export function scenarioChanges(snap: Snapshot, ids: string[]): Changes {
  return mergeChanges(...SCENARIOS.filter((s) => ids.includes(s.id)).map((s) => s.changes(snap)));
}
