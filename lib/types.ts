export type TxKind = "deposit" | "purchase" | "withdrawal";

export interface Tx {
  id: string;
  accountId: string;
  kind: TxKind;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
}

export interface Account {
  id: string;
  type: string; // "Checking" | "Savings" | "Credit Card"
  nickname: string;
  startBalance: number; // what Nessie stores
  balance: number; // computed: startBalance +/- transactions since balanceAsOf
}

export interface Bill {
  id: string;
  accountId: string;
  payee: string;
  amount: number;
  recurringDay: number | null;
}

export interface Loan {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  monthlyPayment: number;
  description: string;
}

export interface Snapshot {
  customerName: string;
  accounts: Account[];
  txs: Tx[];
  bills: Bill[];
  loans: Loan[];
  source: "nessie" | "mock";
  note?: string;
}

// Adjustments the forecast can apply (fixes, purchases, stress tests)
export interface Changes {
  startDelta?: number; // added to checking today
  oneTime?: { offset: number; amount: number; label: string }[]; // amount < 0 = money out
  incomeDeltaPerPaycheck?: number;
  billDeltas?: { match: string; delta: number }[];
  skipBills?: string[]; // payee names to skip
  cardPayment?: number; // override the card payment amount
}

export interface Event {
  label: string;
  amount: number;
  kind: "income" | "bill" | "loan" | "card" | "spend" | "oneTime";
}

export interface DayPoint {
  date: string;
  balance: number;
  events: Event[];
}

export type Status = "green" | "yellow" | "red";

export interface Forecast {
  today: string;
  start: number;
  days: DayPoint[];
  lowest: { date: string; balance: number };
  nextPayday: string | null;
  paycheck: { amount: number; cadence: number };
  dailySpend: number;
  status: Status;
  safeToSpend: number;
  runwayDays: number; // days until balance first drops below $0 (horizon+1 if never)
  daysShort: number; // number of days below $0
  firstShortDate: string | null;
}
