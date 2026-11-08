// Things Nessie doesn't store. Change these to fit your persona.
export const config = {
  hourlyWage: 18, // used for "= X hours of work"
  cardLimit: 1500, // Nessie has no credit limit field
  cardAPR: 0.24, // 24% APR
  cardDueDay: 16, // day of month the card payment is due
  cardMinPayment: 35, // minimum card payment
  loanDueDay: 15, // Nessie loans have no due date
  buffer: 100, // below this = "tight" (yellow)
  fixTarget: 250, // a "move from savings" fix aims to keep at least this much in checking
  overdraftFee: 35,
  horizonDays: 45, // how far ahead we forecast (covers next month's bills too)
  // Nessie balances don't update by themselves. We treat each account's
  // stored balance as true at the end of this date, and add/subtract any
  // transactions dated after it, plus any money moves Kit made.
  balanceAsOf: process.env.NEXT_PUBLIC_BALANCE_AS_OF || "2026-11-07",
};

export const SUBSCRIPTION_PATTERN =
  /netflix|spotify|hulu|disney|youtube|apple|prime|max|peacock|gym|xbox|playstation/i;
