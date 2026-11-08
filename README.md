# Runway ✈️

**See a cash crunch before it happens, and fix it in one tap.**
Built on Capital One's Nessie API · HackUTD (Capital One + PNC tracks)

---

## 1. Run it on your laptop (about 10 minutes)

You need: **Node.js (LTS)** from nodejs.org and **VS Code**.

1. Unzip this folder somewhere easy (e.g. `Documents/runway`).
2. In VS Code: **File → Open Folder… →** pick the `runway` folder.
3. Open the terminal: **Terminal → New Terminal**.
4. Install everything (only needed once):
   ```
   npm install
   ```
5. Make your settings file:
   - Mac/Linux: `cp .env.example .env.local`
   - Windows: `copy .env.example .env.local`
6. Open `.env.local` and paste your Nessie key after `NESSIE_API_KEY=`.
   Priya's customer ID is already filled in.
7. Start the app:
   ```
   npm run dev
   ```
8. Open **http://localhost:3000** in Chrome. Press **Ctrl+Shift+M** (Mac: **Cmd+Shift+M**) and choose an iPhone to see it phone-sized.

> No key yet, or the wifi died? Set `NESSIE_MOCK=1` in `.env.local`. Runway switches to a built-in copy of Priya's data and everything still works.

---

## 2. Put it online + install it like an app (about 10 minutes)

1. Install **GitHub Desktop** → **File → Add Local Repository** → pick the `runway` folder → **Publish repository** (keep "private" checked). Your `.env.local` (with your key) is never uploaded.
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import `runway`.
3. Under **Environment Variables**, add each line from your `.env.local` (name + value).
4. Click **Deploy**. You get a link like `runway-xyz.vercel.app`.
5. On your phone, open that link:
   - **iPhone (Safari):** Share button → **Add to Home Screen**
   - **Android (Chrome):** ⋮ menu → **Install app**

   It opens full screen with its own icon, no browser bar.

Every time you click **Push origin** in GitHub Desktop, Vercel redeploys automatically.

---

## 3. The demo (about 3 minutes)

1. **Home.** "Runway is watching 3 accounts + 1 loan." Safe to spend: **$0**. The red card says **"You'll be $184 short on Fri, Nov 20"** because rent, the car loan and the card payment all land before payday.
2. Scroll down. Point out the **4 health scores** (PNC) and **Everything Runway sees** (all accounts, from Nessie).
3. Tap **See fixes**. Show the **two futures**: red dashed "do nothing" vs. green "with the fix." Each fix has a price tag: $0, ~$10, or a $35 fee.
4. Tap **Approve: move $440**. Runway writes a withdrawal and deposit to **Nessie**, and the chart redraws: **"You're in the clear."**
5. **Buy?** tab: tap **Dinner out · $60** → "Go for it, = 3.3 hours of work." Then **New laptop · $600** → "Wait," with the date it becomes safe.
6. **What if** tab: tap **$800 car repair** → runway drops to 11 days, and Runway shows plan B.
7. **Letter** tab: **Open my letter.** A note from "future you." Point out the lock line: *every number is calculated in code; AI only writes the words.*

**To run the demo again:** on the Fix tab (after approving), tap **Reset demo**.

---

## 4. How it's built (for your slides)

| Piece | File |
|---|---|
| Reads all accounts, bills, loans, deposits and purchases from Nessie | `lib/nessie.ts`, `app/api/snapshot/route.ts` |
| Approve button: writes the money move back to Nessie | `app/api/move/route.ts` |
| **Forecast engine**: day-by-day balance for 45 days | `lib/forecast.ts` |
| 4 health scores (cushion, debt load, credit use, 30-day coverage) | `lib/health.ts` |
| Fixes with price tags | `lib/fixes.ts` |
| Buy-it-now check + hours of work | `lib/buy.ts` |
| Stress tests | `lib/stress.ts` |
| Monthly letter (facts in code, words by AI) | `lib/letter.ts`, `app/api/letter/route.ts` |
| Settings Nessie doesn't store (wage, card limit, APR…) | `lib/config.ts` |
| Screens | `app/page.tsx`, `app/fix`, `app/buy`, `app/whatif`, `app/letter` |
| Installable app (PWA) | `app/manifest.ts`, `public/icon-*.png` |

**Responsible AI:** the AI never sees raw bank data and never decides anything. Code computes every number; the AI only rewrites them as a friendly letter, and is told not to invent numbers. No money moves without the user tapping Approve.

---

## 5. Things to know

- **Demo date.** Priya's data was created on Nov 7, 2026, so `.env.local` pins "today" to that date (`NEXT_PUBLIC_DEMO_TODAY`). That makes her crunch show up every time. Delete the line to use the real date.
- **Nessie quirks (found by testing):** account balances never update by themselves, so Runway computes them. Transfers don't record a destination, so a "move" is a withdrawal plus a deposit. There's no credit-limit field, so the card limit is in `lib/config.ts`.
- **AI letter.** Add ONE of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `GEMINI_API_KEY` to `.env.local`. With no key it uses a built-in template, so the feature still works.
- **Changing the persona.** Edit `lib/config.ts` (hourly wage, card limit, due days). To use a different Nessie customer, change `NESSIE_CUSTOMER_ID`.

## 6. If something breaks

| Problem | Fix |
|---|---|
| `npm` not found | Install Node.js LTS, then close and reopen VS Code |
| Yellow "demo data" banner | Key or customer ID missing or wrong in `.env.local`. Restart `npm run dev` after editing. |
| Works locally, not on Vercel | Add the environment variables in Vercel → Project → Settings → Environment Variables, then redeploy |
| Changes don't show up | Stop the server (Ctrl+C) and run `npm run dev` again |
