# Vibrez status

A private, read-only board for Sayed Baharun. Open it on a phone or laptop to see where Vibrez and personal work stands: counts, what needs Sayed, what an agent can finish, blocked and review work, the next 14 days, and what was completed recently. A health panel at the top says whether the machinery is working.

**This board shows personal items (team PER).** It must stay Sayed-only and behind the password gate. Never share the password or turn the gate off.

Times use **Europe/London**. The board does not send analytics.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `SITE_PASSWORD` | Yes | Password for the gate. Stored only as a signed httpOnly cookie (30 days). |
| `LINEAR_API_KEY` | Yes, for live data | Linear personal API key that can read the VibrezHq workspace. Read on the server only. |
| `MOCK_LINEAR` | No | Set to `1` to skip Linear and show fictional sample data, labelled as sample. |

Copy `.env.example` to `.env.local` for local use. Never commit real values, and never use a `NEXT_PUBLIC_` prefix for these.

If `LINEAR_API_KEY` is missing and mock mode is off, the board shows a setup message instead of crashing. If `SITE_PASSWORD` is missing, the login page explains that and does not open the board.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Next prints (add `-- --port 41731` if you want a fixed port). Sign in with `SITE_PASSWORD`.

```bash
npm test
npm run lint
npm run build
```

## Deploy on Vercel

1. Import this project in Vercel. The framework preset is Next.js. No extra build command is required.
2. In **Project → Settings → Environment Variables**, add `SITE_PASSWORD` and `LINEAR_API_KEY` for Production (and Preview, if you want previews to work). Leave `MOCK_LINEAR` unset in production.
3. Deploy. The password gate runs in `proxy.ts`, which is Next.js 16’s middleware: every page except `/login` redirects until the cookie is valid.
4. Open the deployment, enter the password, and use **Refresh** if you want a new Linear fetch before the cache window ends.

The Linear response is cached for about five minutes (`revalidate` 300 seconds) and shared across server instances. **Refresh** expires that cache and loads again. The API key is not sent to the browser.

Vercel Deployment Protection is optional. This app already refuses unauthenticated reads.

### Linear key

Create a personal API key in Linear (**Settings → Account → Security & access**). The key must be able to see the VibrezHq workspace. The board loads teams **VIB** (Vibrez) and **PER** (Personal): open issues including Triage, issues completed in roughly the last two weeks (then keeps the last 7 London days), both teams’ projects, and any open issue titled “Triage sweep has failed” from any team. Any workflow state whose type is `completed` counts as done, including **Accepted**.

Labels are matched loosely: `needs-sayed`, `Needs Sayed`, and `needs_sayed` are the same. The Needs Sayed view also includes `human-only`. Agents are `agent-can-finish`. Blocked / Needs Review is a status name containing “blocked”, or exactly “Needs Review”.

## Scope

The switch under the header picks **All · Vibrez · Personal** (default All). It is kept in the URL (`?scope=personal`, `?scope=vibrez`), so it survives a refresh and works with every tab. In All, each issue row and project carries a small team tag. The health panel always covers both teams.

## Health panel

“Is it working?” sits at the top of every tab. When everything is fine it is one green line, **All systems OK**. When anything needs a look it opens and lists each check with a coloured dot and a word (OK, Check, Problem). All checks come from Linear data (`lib/health.ts`; thresholds are named constants there):

| Check | OK | Check (amber) / Problem (red) |
| --- | --- | --- |
| Linear data | Data loaded | Problem: the fetch failed, with the reason |
| Triage sweep | No VIB triage issue older than 45 min | Problem: the oldest VIB triage issue has waited over 45 min |
| Sweep alarm | No open “Triage sweep has failed” issue | Problem: one is open, linked |
| Overdue | Nothing open past its due date (London) | Check: count and identifiers, both teams |
| Stuck in review | Nothing in Needs Review / In Review untouched over 3 days | Check: count and identifiers |
| Blocked | Always OK; shows how many are blocked | — |
| Personal triage | No PER triage issue older than 2 days | Check: filed but not sorted |

Times are measured against when the data was fetched, so a cached board can be up to about five minutes behind.

## Bot updates

`data/updates.json` is an array of notes an assistant can commit. Each entry:

```json
{
  "date": "2026-11-09",
  "source": "assistant",
  "title": "Short title",
  "detail": "One or two sentences.",
  "link": "https://linear.app/vibrezhq/issue/VIB-1"
}
```

`date` is `YYYY-MM-DD`. `link` is optional. The seeded entry has `"source": "example"` and is marked Example in the Updates tab. Replace or delete it when you add a real note, then deploy. Newest dates are shown first.
