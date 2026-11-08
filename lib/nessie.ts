// SERVER ONLY — imported by API routes so your API key never reaches the browser.
import { mockSnapshot } from "./mock";
import type { Snapshot, Tx } from "./types";

const BASE = process.env.NESSIE_BASE_URL || "https://prod-api.nessieisreal.com";
const KEY = process.env.NESSIE_API_KEY || "";

export const mockMode = () => process.env.NESSIE_MOCK === "1" || !KEY;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function get(path: string): Promise<any> {
  const r = await fetch(`${BASE}${path}?key=${KEY}`, { cache: "no-store" });
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(`Nessie GET ${path} → ${r.status}`);
  return r.json();
}

async function post(path: string, body: unknown): Promise<any> {
  const r = await fetch(`${BASE}${path}?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Nessie POST ${path} → ${r.status}: ${JSON.stringify(data)}`);
  return data.objectCreated ?? data;
}

// Nessie sometimes returns a message string instead of an empty list
const list = (x: any): any[] => (Array.isArray(x) ? x : []);

export async function fetchSnapshot(CUSTOMER: string): Promise<Snapshot> {
  if (mockMode()) return { ...mockSnapshot(), note: "Using built-in demo data (no Nessie key set)." };
  try {
    const [customer, accounts] = await Promise.all([
      get(`/customers/${CUSTOMER}`),
      get(`/customers/${CUSTOMER}/accounts`),
    ]);
    const perAccount = await Promise.all(
      list(accounts).map(async (a: any) => {
        const [dep, pur, wd, bills, loans] = await Promise.all(
          ["deposits", "purchases", "withdrawals", "bills", "loans"].map((k) =>
            get(`/accounts/${a._id}/${k}`).then(list),
          ),
        );
        const txs: Tx[] = [
          ...dep.map((t: any) => tx(t, a._id, "deposit", t.transaction_date)),
          ...pur.map((t: any) => tx(t, a._id, "purchase", t.purchase_date)),
          ...wd.map((t: any) => tx(t, a._id, "withdrawal", t.transaction_date)),
        ];
        return { a, txs, bills, loans };
      }),
    );
    return {
      customerName: customer?.first_name || "there",
      source: "nessie",
      accounts: perAccount.map(({ a }) => ({
        id: a._id,
        type: a.type,
        nickname: a.nickname,
        startBalance: Number(a.balance) || 0,
        balance: Number(a.balance) || 0,
      })),
      txs: perAccount.flatMap((p) => p.txs),
      bills: perAccount.flatMap(({ a, bills }) =>
        bills.map((b: any) => ({
          id: b._id,
          accountId: a._id,
          payee: b.payee || b.nickname || "Bill",
          amount: Number(b.payment_amount) || 0,
          recurringDay: b.recurring_date ?? null,
        })),
      ),
      loans: perAccount.flatMap(({ a, loans }) =>
        loans.map((l: any) => ({
          id: l._id,
          accountId: a._id,
          type: l.type,
          amount: Number(l.amount) || 0,
          monthlyPayment: Number(l.monthly_payment) || 0,
          description: l.description || "Loan",
        })),
      ),
    };
  } catch (e) {
    console.error(e);
    return { ...mockSnapshot(), note: "Couldn't reach Nessie, so Runway is showing demo data." };
  }
}

function tx(t: any, accountId: string, kind: Tx["kind"], date: string): Tx {
  return {
    id: t._id ?? t.id,
    accountId,
    kind,
    date: (date || "").slice(0, 10),
    amount: Number(t.amount) || 0,
    description: t.description || kind,
  };
}

/** The Approve button: Nessie transfers have no destination field, so a move is a
 *  withdrawal from one account plus a deposit into the other. */
export async function moveMoney(fromId: string, toId: string, amount: number, date: string) {
  const description = "Runway fix: moved from savings (approved by you)";
  if (mockMode()) {
    return {
      mock: true,
      txs: [
        { id: `mw${Date.now()}`, accountId: fromId, kind: "withdrawal", date, amount, description },
        { id: `md${Date.now()}`, accountId: toId, kind: "deposit", date, amount, description },
      ] as Tx[],
    };
  }
  const w = await post(`/accounts/${fromId}/withdrawals`, {
    medium: "balance", amount, transaction_date: date, status: "completed", description,
  });
  const d = await post(`/accounts/${toId}/deposits`, {
    medium: "balance", amount, transaction_date: date, status: "completed", description,
  });
  return {
    mock: false,
    txs: [
      { id: w._id, accountId: fromId, kind: "withdrawal", date, amount, description },
      { id: d._id, accountId: toId, kind: "deposit", date, amount, description },
    ] as Tx[],
  };
}
