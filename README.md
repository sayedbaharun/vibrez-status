# Vibrez status

A private, read-only board for Sayed Baharun. Open it on a phone or laptop to see where Vibrez work stands: counts, what needs Sayed, what an agent can finish, blocked and review work, the next 14 days, and what was completed recently.

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

Create a personal API key in Linear (**Settings → Account → Security & access**). The key must be able to see the VibrezHq workspace. The board loads team **VIB**: open issues, issues completed in roughly the last two weeks (then keeps the last 7 London days), and that team’s projects. Any workflow state whose type is `completed` counts as done, including **Accepted**.

Labels are matched loosely: `needs-sayed`, `Needs Sayed`, and `needs_sayed` are the same. The Needs Sayed view also includes `human-only`. Agents are `agent-can-finish`. Blocked / Needs Review is a status name containing “blocked”, or exactly “Needs Review”.

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
