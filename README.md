# Racing Birthday

A premium, responsive motorsport birthday invitation for **October 24, 2026 at 3:00 PM in Puerto Rico**.

**Live invitation:** https://pxchecoo.github.io/racing-birthday/  
**Location:** Avenida Diego Velázquez N-12, El Conquistador, Puerto Rico.

The Supabase project, table, INSERT-only policies, GitHub Actions secrets, and GitHub Pages deployment are already configured. See the [verification report](docs/verification.md) for measured production results.

## Experience

Original chrome helmet artwork, smooth pointer tilt, a scroll-driven perspective transition, restrained magnetic buttons, a live countdown, a downloadable calendar event, Google Maps directions, and an animated private RSVP form. All motion respects reduced-motion preferences. No third-party tracking, autoplay audio, public guest list, or racing brand logos.

The helmet uses an optimized original raster render with perspective transforms instead of a heavy WebGL scene. Typography is self-hosted. Supabase loads only when an RSVP is submitted.

## Stack

React · TypeScript · Vite · Tailwind CSS · Motion · Supabase JS · Lucide. Vitest and Playwright cover date logic, form behavior, responsive layout, and accessibility.

## Local development

Requires Node.js 22.12+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:5173/racing-birthday/`.

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

These public values identify the Supabase project; database permissions provide security. Never use a service role, secret, administrative token, or database password in a `VITE_` variable. A prebuild check rejects unsupported/private keys. `.env` files are ignored by Git. Without configuration the invitation remains readable and explicitly shows “RSVP opens soon”; it never pretends to save a response.

## Supabase setup

1. Sign in at [Supabase](https://supabase.com/dashboard), create an organization if needed, and create a project named `racing-birthday` on the free plan if available. Keep the database password private.
2. Open **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and run it. This script is transactional and can be rerun against this dedicated RSVP table. It replaces existing policies for this table only.
3. Under the project's API settings, copy the project URL and the **anon** or **publishable** key into `.env.local`.
4. Restart Vite after changing environment variables.
5. Add the same values as GitHub Actions repository secrets and redeploy.

### Privacy and access model

The `public.birthday_rsvps` table stores:

| Column        | Type           | Meaning                                                       |
| ------------- | -------------- | ------------------------------------------------------------- |
| `id`          | UUID           | Primary key, client-generated per submission for safe retries |
| `name`        | text           | Required, 1–100 trimmed characters                            |
| `attending`   | boolean        | Attendance response                                           |
| `guest_count` | integer        | **Additional guests**, excluding the named attendee; 0–10     |
| `message`     | text, nullable | Optional, up to 1,000 characters                              |
| `created_at`  | timestamptz    | Database-generated creation time                              |

RLS is enabled and forced. The `anon` role has only column-scoped INSERT permission and one INSERT policy. Public, anon, and authenticated roles have no SELECT, UPDATE, or DELETE grants. Guests cannot read the attendance list or modify a response. Declines require zero guests. The client inserts without `.select()` or `RETURNING`. Organizers can view data privately in the Supabase dashboard.

The schema restricts data access, but direct anonymous insertion is inherently public; RLS alone is not rate limiting. If abuse becomes a problem, place insertion behind a server-side function with verified CAPTCHA and rate limits. No guest data is stored in browser storage or the repository.

See [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## GitHub Pages

The Vite base is `/racing-birthday/`. Navigation uses section anchors, so no SPA path fallback is needed. Public assets use `import.meta.env.BASE_URL`.

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on `main` pushes or manual dispatch. It installs with `npm ci`, runs lint and unit tests, builds `dist`, uploads the Pages artifact, and deploys with GitHub's Pages action.

In **Settings → Pages**, select **GitHub Actions** as the source. In **Settings → Secrets and variables → Actions**, create:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Both are intentionally public in the compiled frontend, even when supplied via GitHub Secrets. Secrets protect configuration management, not runtime secrecy. Do not put private credentials in them.

After changing secrets, run **Actions → Deploy to GitHub Pages → Run workflow**. No code commit is necessary.

See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Verification

```bash
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

E2E tests start a separate Vite instance on port 4174 with clearly fake test keys and intercept Supabase requests. They verify success, decline, errors, repeat-submission IDs, calendar download, layout at 320–1920 pixels, image loading, and WCAG A/AA checks. They do **not** prove connectivity or RLS in a real Supabase project. Production database checks must be performed separately after provisioning.

The countdown derives its instant from the Supabase event settings with an explicit Puerto Rico UTC−04:00 offset, independent of the visitor's time zone. Calendar files use UTC and deliberately omit an unprovided event end time. At the event instant the countdown stops at zero.

## Structure

```text
src/
  components/       Header, Reveal, Magnetic
  sections/         Hero, Details/location, Countdown, Rsvp
  lib/              Event/calendar, validation, lazy Supabase client
  styles/           Design system, responsive layout, motion
public/
  assets/           Optimized original helmet WebP images
  favicon.svg       Original racing monogram
supabase/
  schema.sql        Table, constraints, grants, INSERT-only RLS
scripts/            Frontend credential checks
tests/             Unit, browser, accessibility checks
.github/workflows/  Automatic Pages deployment
docs/              Artwork provenance and verification record
```

Change the event date and time in Race Control; static venue information remains in `src/lib/event.ts`. There is no invented attendee name, age, or event end time.

## Race Control (private admin)

Open **https://pxchecoo.github.io/racing-birthday/admin/**. The existing Vite build now produces both `dist/index.html` and `dist/admin/index.html`; GitHub Pages serves the admin directly, including refreshes, without a hash router or a custom 404 redirect. The public invitation layout and RSVP insert flow are preserved.

The panel provides password login, four-hour sessions, Log Out, event date/time settings, and a newest-first RSVP list with basic statistics. On mobile the table becomes cards. **Going** counts attending responses; **Total Guests** includes those respondents plus their additional guests. Responses are loaded privately through the Edge Function; no guest list is present in public assets or browser storage.

### Server-side setup (already completed for this project)

The additive migration is `supabase/migrations/202609230001_race_control.sql`. For a fresh installation, apply `supabase/schema.sql` first, then this migration. It preserves the RSVP table and its existing policies. The migration creates:

- `event_settings`: one row (`id = 1`), publicly readable, writable only by the service role.
- `admin_sessions`: hashed opaque session tokens and expiration times, with no public grants or policies.
- `admin_login_limits`: server-only atomic rate-limit counters.
- `consume_admin_login_attempt`: service-role-only RPC for persistent login throttling.

```bash
npx supabase db query --linked --project-ref YOUR_PROJECT_REF --file supabase/migrations/202609230001_race_control.sql
npx supabase functions deploy race-control --project-ref YOUR_PROJECT_REF --use-api
```

In Supabase Edge Function Secrets configure:

| Secret                                       | Purpose                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ADMIN_PASSWORD`                             | The administrator password; set only in Supabase, never in source or a `VITE_` variable    |
| `ADMIN_ALLOWED_ORIGINS`                      | Comma-separated allowed browser origins; production origin is `https://pxchecoo.github.io` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Injected automatically by Supabase into Edge Functions; never copy into the frontend       |

The current server also permits `http://127.0.0.1:5173` and `http://127.0.0.1:4173` for local verification. CORS restricts browser origins; the session check independently authorizes every administrative operation.

Use the Supabase dashboard to change `ADMIN_PASSWORD`. Never place its value in README, shell history examples, tests, workflow arguments, or a committed environment file. To revoke all outstanding sessions after changing a password, run `delete from public.admin_sessions;` privately as the project owner.

### Authentication and privacy

The `race-control` Edge Function handles `login`, `dashboard`, `save_settings`, and `logout`. The platform's legacy JWT check is disabled because this function uses its own authorization: an anon project key is **never** accepted as an admin credential. After a correct server-side password check, the function returns a cryptographically random 256-bit token with a four-hour expiry. The browser keeps it in `sessionStorage` so refreshes work; only its SHA-256 hash is stored in the server-only session table. Dashboard reads and schedule updates require an unexpired server-side session. Logout deletes the session, making its token unusable immediately.

Persistent login limits allow five attempts per IP and thirty overall per 15-minute window. The counters are updated atomically in Postgres so separate Edge Function instances cannot reset them. Passwords are compared using equal-length digests. Error responses never echo secrets, request bodies, or database internals. Administrative responses use `Cache-Control: no-store`.

RLS remains enabled and forced. The existing `birthday_rsvps` table still grants public visitors INSERT only. It has **no anonymous SELECT policy**. Guests also cannot edit the event, inspect admin sessions, or call the login-limit RPC.

### Dynamic event date

Manage the schedule in Race Control. The public page reads the single `event_settings` record and updates its hero date, decorative day, weekday/month/year, marquee, footer, details, countdown, RSVP confirmation, metadata, and downloadable calendar. Puerto Rico is represented explicitly as `America/Puerto_Rico` / UTC−04:00, independently of the viewer's local timezone.

Public tabs in the same browser update immediately through the public settings cache. Other visitors refresh their settings every 30 seconds while visible, and on focus/return to the page. A last-known local cache and one centralized original-date fallback keep the invitation usable during network outages. Calendar events keep their original stable UID and use the current schedule.

Static HTML/social metadata omits a fixed date so non-JavaScript crawlers never receive a stale schedule; browser metadata updates from Supabase. No GitHub deployment is needed when saving a new event date.

### Admin files and tests

- `admin/index.html`, `src/pages/Admin.tsx`, `src/styles/admin.css`: direct entry, session lifecycle, and isolated styling.
- `src/components/admin/`: login, event editor, statistics, responsive RSVP list.
- `src/lib/admin.ts`: private function client, session storage, statistics.
- `src/lib/event-store.ts`, `src/hooks/useEvent.ts`, `src/lib/event.ts`: shared dynamic schedule.
- `supabase/functions/race-control/`: server-only authorization, validation, and database access.
- `supabase/config.toml`, `supabase/migrations/202609230001_race_control.sql`: function and database configuration.
- `tests/admin.test.ts`, `tests/admin.spec.ts`: server-side helper tests and browser coverage for login, sessions, logout, settings, statistics, mobile, and cross-tab public updates.

Run `npm run build`, `npm run lint`, `npm test`, and `npm run test:e2e`. Optional Edge Function type check: `npx deno check --no-lock supabase/functions/race-control/index.ts`. The existing GitHub Pages workflow continues to deploy `main`; redeploy the Edge Function explicitly when changing server-side code. Frontend builds never receive the admin password or service role key.
