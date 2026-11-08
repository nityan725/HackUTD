// Demo accounts. Each one points to a different customer in your Nessie account.
// ⚠️ Hackathon demo login only — real apps never store passwords in code.
//    For a real product you'd use Clerk, Auth.js, or Supabase Auth.
import type { Holding, Iou } from "./types";

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  nessieCustomerId: string;
  // Accounts at other banks. Nessie only has checking, savings and credit cards,
  // so CDs, retirement accounts and other loans are listed here ("linked elsewhere").
  external: Holding[];
}

export const USERS: DemoUser[] = [
  {
    id: "carrie",
    email: "carrie@kit.app",
    password: "demo123",
    name: "Carrie",
    nessieCustomerId: process.env.NESSIE_CUSTOMER_ID || "d852d265-af21-4b3d-9747-c210c930d3a0",
    external: [
      { id: "cd1", kind: "asset", type: "CD", name: "6-month CD", institution: "Texas Trust Credit Union", balance: 1000, rate: 0.041, maturesOn: "2026-12-03" },
      { id: "ira1", kind: "asset", type: "Roth IRA", name: "Roth IRA", institution: "Fidelity", balance: 2350, note: "Retirement" },
      { id: "sl1", kind: "debt", type: "Student loan", name: "Federal student loan", institution: "Dept. of Education", balance: 18500, rate: 0.055, monthlyPayment: 0, note: "In school — payments start after graduation" },
    ],
  },
  {
    id: "marcus",
    email: "marcus@kit.app",
    password: "demo123",
    name: "Marcus",
    nessieCustomerId: "8ef5eb46-df62-455f-85bb-c2a1e5c4afd4",
    external: [
      { id: "k1", kind: "asset", type: "401(k)", name: "Work 401(k)", institution: "Vanguard", balance: 14200, note: "Retirement" },
      { id: "ira2", kind: "asset", type: "Roth IRA", name: "Roth IRA", institution: "Schwab", balance: 6100, note: "Retirement" },
      { id: "sl2", kind: "debt", type: "Student loan", name: "Student loan", institution: "Nelnet", balance: 9800, rate: 0.049, monthlyPayment: 0, note: "Paid from another bank" },
    ],
  },
];

// Money between friends. Settled with Nessie peer-to-peer transfers (see /api/p2p).
export const IOUS = [{ id: "iou1", from: "marcus", to: "carrie", amount: 60, note: "Concert tickets" }];

export const findUser = (id: string | undefined) => USERS.find((u) => u.id === id);

/** The IOUs as seen by one user. */
export function iousFor(userId: string): Iou[] {
  return IOUS.filter((i) => i.from === userId || i.to === userId).map((i) => {
    const owesYou = i.to === userId;
    const friend = findUser(owesYou ? i.from : i.to)!;
    return { id: i.id, friendId: friend.id, friendName: friend.name, direction: owesYou ? "owesYou" : "youOwe", amount: i.amount, note: i.note };
  });
}
