<p align="center">
  <img src="public/icon-512.png" alt="Kit logo" width="120" />
</p>

<h1 align="center">Kit</h1>
<p align="center"><b>Hears money trouble coming, and helps you fix it in one tap.</b><br/>
Built on the Capital One Nessie API · HackUTD 2026 · </p>

---

## The problem

Most people don't run into money trouble because they spend too much. They run into it because of **timing**: rent, a car payment and a credit card bill land a few days before payday, and suddenly there's a $35 overdraft fee. Budgeting apps show what already happened. By then it's too late.

## What Kit does

Kit pulls every account into one view, forecasts your balance **day by day for the next 45 days**, and helps you act before a cash crunch hits.

| Feature | What it does |
|---|---|
| **Safe to spend** | One number on the home screen: what you can spend until payday, and how many days your money lasts. |
| **Cash-crunch alerts** | "You'll be $184 short on Nov 20," with the exact bills that cause it. |
| **One-tap fixes** | Ranked options with price tags: collect what a friend owes you, move the rest from savings, pay the card minimum, pause subscriptions, or do nothing ($35 fee). A chart shows "if I do nothing" next to "if I tap the fix." Approving writes real transactions to Nessie. |
| **Can I afford it?** | Type a price and get **Go / Go-but / Wait**, the best way to pay, and what it costs in **hours of work**. |
| **What-if chat** | Ask "What if rent goes up $200 and I cancel Spotify?" and see your new forecast plus a plan B. |
| **4 health scores** | Cash cushion, debt load, credit use and 30-day coverage, each green / yellow / red. |
| **Net worth** | Everything you own and owe: checking, savings, a CD, an IRA, a card, a car loan and a student loan. |
| **Your next moves** | Specific, ranked steps like "Your $1,000 CD unlocks Dec 3." |
| **Pay & request** | Settle up with friends through Nessie peer-to-peer transfers. |
| **Monthly letter** | A note from "future you": one win, one risk, three steps with dollar values. |

Kit installs on a phone like a native app (PWA).


## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Recharts · Capital One Nessie API · Vercel · PWA

## Run it locally

You need [Node.js](https://nodejs.org) (LTS).

```bash
npm install
cp .env.example .env.local     # Windows: copy .env.example .env.local
```

Fill in `.env.local`:

| Variable | What it is |
|---|---|
| `NESSIE_API_KEY` | Your Nessie API key |
| `NESSIE_BASE_URL` | `https://prod-api.nessieisreal.com` |
| `NESSIE_CUSTOMER_ID` | The Nessie customer behind the "Carrie" demo account |
| `NESSIE_MOCK` | `1` = use built-in demo data instead of Nessie |
| `NEXT_PUBLIC_DEMO_TODAY` | Pins "today" to the date the demo data was created (`2026-11-07`) |
| `NEXT_PUBLIC_BALANCE_AS_OF` | Date Nessie's stored balances are treated as accurate (`2026-11-07`) |
| `SESSION_SECRET` | Any long random phrase (signs the login cookie) |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Optional, one AI key |

```bash
npm run dev
```

Open http://localhost:3000.

### Demo accounts

| Name | Email | Password | Story |
|---|---|---|---|
| Carrie | carrie@kit.app | demo123 | Part-time job, $184 short before payday, Marcus owes her $60 |
| Marcus | marcus@kit.app | demo123 | Full-time, healthy savings |

**Reset demo** (on the Fix screen after approving a fix) brings back the cash crunch and Marcus's $60, so the demo can be replayed.

## Nessie notes

- Nessie doesn't update stored balances when transactions are added, so Kit calculates current balances itself.
- Nessie transfers don't record a destination, so a money move is a withdrawal plus a matching deposit.
- Nessie has no credit limits, CDs or retirement accounts; card limits live in `lib/config.ts` and outside accounts are marked "linked elsewhere."
- Demo login only: passwords live in code. A production version would use a real auth provider and a secure bank connection (e.g. Plaid).

## Project structure

```
app/            screens (Home, fix, buy, whatif, letter, worth, pay, profile, login)
app/api/        server routes: snapshot, move, p2p, whatif, letter, login, logout
lib/forecast.ts the forecast engine
lib/            health scores, fixes, buy check, what-if parser, net worth, Nessie client
components/     charts, icons, header, navigation
```

---

