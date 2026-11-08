// Works out how much is still owed on each IOU, from the P2P transfers in Nessie.
import type { Iou, Snapshot } from "./types";

export interface IouStatus extends Iou {
  paid: number;
  outstanding: number;
}

export function iouStatus(snap: Snapshot): IouStatus[] {
  return (snap.ious ?? []).map((i) => {
    const paid = snap.txs
      .filter((t) =>
        i.direction === "owesYou"
          ? t.kind === "deposit" && t.description.startsWith(`Runway P2P: ${i.friendName} →`)
          : t.kind === "withdrawal" && t.description.includes(`→ ${i.friendName} ·`),
      )
      .reduce((s, t) => s + t.amount, 0);
    return { ...i, paid, outstanding: Math.max(0, Math.round((i.amount - paid) * 100) / 100) };
  });
}

/** Recent peer-to-peer activity for this user. */
export function p2pActivity(snap: Snapshot) {
  return snap.txs
    .filter((t) => t.description.startsWith("Runway P2P:"))
    .map((t) => {
      const [, who = "", note = ""] = t.description.match(/^Runway P2P: (.+?) · (.*)$/) ?? [];
      return { id: t.id, date: t.date, amount: t.amount, incoming: t.kind === "deposit", who, note };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
