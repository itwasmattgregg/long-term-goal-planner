# Horizon

A local-first PWA for **long-term goals** — the kind that take years, not weeks.

Write plain-text sentences. Horizon links them to goals you already have (or creates new ones), tracks wins and misses, and surfaces a small daily focus so multi-year ambitions feel like leveling up instead of a forgotten note in a doc.

No account. No cloud sync. Your journal stays in your browser.

---

## Intent

Most planners are built for short feedback loops: sprint tasks, weekly habits, gym streaks. Long-term goals break that model. Buying a house, changing careers, quitting something that has owned you for a decade — these stretch across seasons. Progress is uneven. Some days you win. Some days you slip. Most days you just nudge the boulder a few inches.

Horizon is for that shape of work:

- **Journal first, structure second.** You write the way you think. The app figures out which goal a note belongs to.
- **Honest logging beats perfect plans.** Successes and failures both earn XP. A miss still counts as showing up.
- **One small focus per day.** You don’t need to stare at every horizon at once — just the one that needs attention today, plus a gentle nudge toward anything you’ve neglected.
- **Progress you can feel.** Goals level up. Your whole profile climbs. The ladder can be Classic, Arcane, Might, Dawn, or Trail — same XP, different story.

Use it when the finish line is far away and you still want every honest step to matter.

---

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # serve the build locally
```

Data is stored in **IndexedDB** in your browser. Clearing site data for this origin wipes your journal — treat that like deleting a local notebook.

---

## How to use it

### 1. Start with a sentence

From the landing page, tap **Start writing** or pick an idea. In the app journal (`/app`), write something like:

> I want to buy a house in the next five years.

Phrases such as *I want to*, *my goal is*, *I’m going to*, or *plan to* tip Horizon that this is a **new goal**. Confirm the title, and you’re journaling against it from day one.

Later entries don’t need that framing. Just write what happened:

> Looked at three neighborhoods this weekend.

Horizon matches the note to an existing goal when it can. If several goals look plausible, it asks. If none fit, you can create a new one.

### 2. Entry types

Start a line with `/` to pick a type, or let Horizon guess from wording. Press **⌘K** / **Ctrl+K** in the composer for the in-app guide.

| Command | Meaning | Example |
| --- | --- | --- |
| `/update` | Progress note or thought | `/update Looked at three neighborhoods this weekend.` |
| `/success` | A win worth remembering | `/success Finished the down-payment spreadsheet.` |
| `/failure` | A miss or slip (still earns a little XP) | `/failure Skipped the gym three days in a row.` |
| `/decision` | A choice that shapes the path | `/decision Going with the smaller house nearer work.` |
| `/checkin` | A quick pulse on how a goal feels | `/checkin Feeling steady about the promotion path.` |

Creating a brand-new goal tags the first entry as **goal created** automatically.

Cue words also work without a slash — e.g. *finished*, *nailed*, *missed*, *relapsed*, *decided*, *going with*. Matching phrases highlight as you type.

### 3. Today’s focus

The **Today** view keeps the journal front and center. Horizon picks:

- a **primary** goal (pinned goals, open milestones, and recent attention all weigh in), and
- a **nudge** when something active hasn’t been touched in about two weeks.

You can write freely, check in on the suggested goal, or explicitly link a note to a goal with **Write**.

### 4. Goals, milestones, and status

Open **Goals** for the full list. Each goal has a detail page where you can:

- journal against that goal only,
- add and complete **milestones** (checkpoints on the long road — completing one awards extra XP),
- **pin** goals that should stay near the top of daily focus,
- set status to **active**, **paused**, or **done**.

Paused and done goals leave the daily rotation but keep their history and XP contribution to your profile.

### 5. XP and the climb

Every logged entry feeds the goal’s XP and a **shared profile pool** (including goals you’ve retired). Approximate awards:

| Kind | XP |
| --- | --- |
| Success | 18 |
| Goal created | 15 |
| Decision | 12 |
| Update | 10 |
| Check-in | 8 |
| Failure | 6 |
| Milestone completed | 25 |

Tap your level badge in the header to open **Profile** — pick a ladder flavor and see how far you’ve climbed. Past the early rungs, each new level asks for more XP. The titles get weirder on purpose.

---

## Long-term examples

These are the kinds of arcs Horizon is meant for: years of small notes, not a one-week checklist.

### Buy a house (≈ 3–5 years)

**Seed**

> I want to buy a house in the next five years.

**Milestones you might add**

- Emergency fund fully funded
- Down-payment target defined
- Credit score plan locked
- Neighborhood shortlist
- Pre-approval
- Offer accepted

**How journaling might look over time**

```
/decision Saving 20% of every paycheck into the house fund.
/success Opened a high-yield savings account for the down payment.
/update Looked at three neighborhoods this weekend.
/failure Blew the monthly transfer on a vacation package.
/decision Going with the smaller house nearer work.
/checkin Nervous but still on track for pre-approval next spring.
/success Got pre-approved.
```

Years later the goal detail is a timeline of money decisions, near-misses, and the day it actually became real — not a stale “buy house” checkbox.

### Quit drinking (ongoing)

Long personal goals need room for relapse without throwing away the whole story.

**Seed**

> Quit drinking.

**Milestones**

- Tell one person I’m quitting
- Thirty days sober
- Replace Friday drinks with a standing walk
- One year

**Journal texture**

```
/decision Committed to quitting — starting today.
/success Made it through a work happy hour with sparkling water.
/failure Relapsed at a wedding. Logging it and starting again.
/checkin Cravings are quieter this month.
/update Joined a Tuesday evening group.
/success Ninety days.
```

Failures still earn XP. The point isn’t a perfect streak — it’s a continuous record that you kept returning.

### Career: senior engineer (≈ 1–3 years)

**Seed**

> Get promoted to senior engineer.

**Milestones**

- Document current scope vs. senior bar
- Lead one cross-team project
- Mentorship cadence with two juniors
- Promotion packet drafted
- Promo conversation scheduled

**Journal texture**

```
/update Sketched the gap between my role and the senior rubric.
/success Presented the migration plan to eng leadership.
/decision Asking for a stretch project owning the billing rewrite.
/failure Softened feedback in a design review I should have pushed on.
/checkin Feeling steady about the promotion path.
/success Promotion approved.
```

### Side business (years, uneven weeks)

**Seed**

> Build a small business on the side.

**Milestones**

- Idea validated with ten conversations
- First paying customer
- Repeatable offer written down
- Monthly revenue target hit
- Decide: keep side / go fuller time

**Journal texture**

```
/update Talked to three potential customers this weekend.
/decision Focusing on freelance audits before building a product.
/success First paid invoice cleared.
/failure Missed every evening work block this week.
/checkin Energy is low but the offer still feels right.
/success Hit the first $2k month.
```

### Travel: Europe backpacking trip (≈ 12–24 months)

**Seed**

> Save for a Europe backpacking trip.

**Milestones**

- Trip budget locked
- Passport renewed
- Flights booked
- First country itinerary
- Departure

**Journal texture**

```
/decision Cap is $4,500 all-in including flights.
/success Booked refundable shoulder-season tickets.
/update Mapped a rough three-week route: Lisbon → Madrid → Rome.
/failure Dipped into the trip fund for car repairs — rebuilding it.
/checkin Still excited; departure feels real now.
```

### Mix several horizons

Horizon expects **more than one** long goal at a time. A realistic month might touch:

| Goal | Note |
| --- | --- |
| House | `/success` Down-payment spreadsheet finished |
| Quit drinking | `/checkin` Steady week |
| Side business | `/update` Two customer calls |
| Europe trip | *(untouched — may show up as a nudge after ~2 weeks)* |

You don’t balance them every day. You write what’s true today; the app keeps the quieter goals from disappearing forever.

---

## Mental model

```
sentence → (optional /type or cue words)
        → match or create goal
        → XP on goal + shared profile
        → milestones when you want checkpoints
        → daily primary + occasional nudge
```

Think of it as a **leveling journal for futures that take years**, not a task manager with longer due dates.

---

## Privacy

- Runs entirely in the browser as a PWA-capable Vite app.
- Persistence is **local IndexedDB** via Dexie.
- No login, no backend, no analytics baked into the core flow.

Back up anything precious with your own export habits (browser backup, screenshots of goal pages, etc.) until you add a formal export path.

---

## Stack

- React 19 + React Router
- TypeScript + Vite
- Dexie (IndexedDB)
- `vite-plugin-pwa` for installability

---

## License

Private project (`"private": true` in `package.json`). Adjust if you open it up.
