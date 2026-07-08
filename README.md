# Portfolio — Hosting & Domain Setup

Static site for [abhisheshpradhan.com](https://abhisheshpradhan.com) with a single
serverless function for the contact form. This README covers only how the site is
deployed and wired up — not the front-end code.

## Stack at a glance

| Concern             | What it uses                                       |
| ------------------- | -------------------------------------------------- |
| Hosting             | [Vercel](https://vercel.com)                       |
| Domain              | `abhisheshpradhan.com`                             |
| Source / CI         | GitHub → `AbhisheshPradhan/portfolio`, auto-deploy |
| Serverless API      | `api/contact.js` (Vercel Function)                 |
| Transactional email | [Resend](https://resend.com)                       |

There is **no build step** — no `package.json`, no bundler. `index.html` and the
static assets under `media/` are served as-is. Vercel detects the `api/` folder
and runs `api/contact.js` as a serverless function automatically.

## Hosting (Vercel)

- The GitHub repo `AbhisheshPradhan/portfolio` is connected to a Vercel project.
- Every push to `main` triggers a production deploy; pull requests get preview
  deploys.
- Framework preset: **Other** (static). Build command and output directory are
  left empty since the site is plain HTML.
- [`vercel.json`](vercel.json) contains one rewrite so `/favicon.ico` resolves to
  `/media/favicons/favicon.ico`.

### Local development

```bash
vercel dev
```

This serves `index.html` and runs the `api/contact.js` function locally, reading
env vars from `.env` (see below). Opening `index.html` directly in a browser
works for the static site but the contact form's `POST /api/contact` will 404.

## Domain

- Primary domain: **`abhisheshpradhan.com`**, added under the Vercel project's
  **Settings → Domains**.
- DNS points at Vercel (either Vercel nameservers, or an `A` / `CNAME` record to
  Vercel per the dashboard's instructions).
- `www` redirects to the apex domain.
- The canonical URL, `sitemap.xml`, and `robots.txt` all reference
  `https://abhisheshpradhan.com/` — keep these in sync if the domain ever changes.

## Environment variables

Set in **Vercel dashboard → Project → Settings → Environment Variables**:

| Variable         | Purpose                                                                             |
| ---------------- | ----------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Auth for sending contact emails via Resend. Create at <https://resend.com/api-keys> |

For local dev, copy `.env.example` → `.env` and fill it in. `.env` is gitignored
and must never be committed — the key lives only on the server, never in
`index.html`.

## Contact form email (Resend)

The contact form posts to `api/contact.js`, which sends the message through Resend
to `pradhan.abhishesh@gmail.com`.

- **`FROM` address:** currently `onboarding@resend.dev`, which only delivers to the
  owning Resend account's email. To send from a branded address, verify
  `abhisheshpradhan.com` in Resend (**Domains → Add Domain**, then add the shown
  DNS records) and switch `FROM` in `api/contact.js` to e.g.
  `Portfolio <contact@abhisheshpradhan.com>`.
- The function includes honeypot + timestamp bot traps before it calls Resend.
