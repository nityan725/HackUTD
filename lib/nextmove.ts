// "Your next moves": ranked, specific actions built from everything Kit knows.
// (A cash crunch is shown separately as the red alert, so it isn't repeated here.)
import { config } from "./config";
import { addDays, diffDays, fmtDay, monthName } from "./dates";
import { monthlyNumbers } from "./health";
import { iouStatus } from "./p2p";
import { card, savings } from "./snapshot";
import type { Forecast, Snapshot } from "./types";

export interface Move {
  id: string;
  icon: string;
  tone: "green" | "blue" | "purple" | "orange" | "red" | "amber" | "teal" | "pink";
  title: string;
  why: string;
  href: string;
  cta: string;
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export function nextMoves(snap: Snapshot, f: Forecast): Move[] {
  const moves: Move[] = [];

  // Money a friend owes you (or you owe them)
  for (const i of iouStatus(snap)) {
    if (i.outstanding <= 0) continue;
    moves.push(
      i.direction === "owesYou"
        ? { id: `iou-${i.id}`, icon: "users", tone: "blue", title: `Collect ${usd(i.outstanding)} from ${i.friendName}`, why: `For ${i.note.toLowerCase()}. One tap, sent through Nessie.`, href: "/pay", cta: "Request" }
        : { id: `iou-${i.id}`, icon: "users", tone: "blue", title: `Pay ${i.friendName} back ${usd(i.outstanding)}`, why: `For ${i.note.toLowerCase()}.`, href: "/pay", cta: "Pay" },
    );
  }

  // A CD that's about to mature
  for (const h of snap.external ?? []) {
    if (h.type !== "CD" || !h.maturesOn) continue;
    const days = diffDays(f.today, h.maturesOn);
    if (days < 0 || days > 45) continue;
    moves.push({
      id: `cd-${h.id}`,
      icon: "lock",
      tone: "teal",
      title: `Your ${usd(h.balance)} CD unlocks ${fmtDay(h.maturesOn)}`,
      why: `Decide before it auto-renews: keep earning ${((h.rate ?? 0) * 100).toFixed(1)}%, or move it to savings to grow your cushion.`,
      href: "/worth",
      cta: "See it",
    });
  }

  // Credit use above 30%
  const cc = card(snap);
  if (cc && cc.balance > 0.3 * config.cardLimit) {
    const payDown = cc.balance - 0.3 * config.cardLimit;
    moves.push({
      id: "credit",
      icon: "card",
      tone: "purple",
      title: `Pay ${usd(payDown)} extra on your card`,
      why: `Gets your credit use from ${Math.round((cc.balance / config.cardLimit) * 100)}% to under 30%, which helps your credit score.`,
      href: "/buy",
      cta: "Check",
    });
  }

  // Thin cash cushion
  const sav = savings(snap);
  const m = monthlyNumbers(snap, f);
  if (sav && m.expenses > sav.balance) {
    const gap = m.expenses - sav.balance;
    const when = addDays(f.today, Math.ceil(gap / 50) * f.paycheck.cadence);
    moves.push({
      id: "cushion",
      icon: "shield",
      tone: "green",
      title: "Save $50 from each paycheck",
      why: `Gets you to a 1-month cushion (${usd(m.expenses)}) by ${monthName(when)}.`,
      href: "/whatif",
      cta: "Try it",
    });
  }

  if (!moves.length) {
    moves.push({
      id: "invest",
      icon: "trendUp",
      tone: "amber",
      title: "You're on track. Put the extra to work",
      why: "Your cushion and credit look healthy. Adding $50/month to retirement is a strong next step.",
      href: "/worth",
      cta: "See all",
    });
  }
  return moves.slice(0, 3);
}
