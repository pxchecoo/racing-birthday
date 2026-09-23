# Racing Birthday

A premium, responsive motorsport birthday invitation for **October 24, 2026 at 3:00 PM in Puerto Rico**.

**Live invitation:** https://pxchecoo.github.io/racing-birthday/  
**Location:** Avenida Diego Velázquez N-12, El Conquistador, Puerto Rico.

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

The countdown uses the explicit instant `2026-10-24T15:00:00-04:00` (19:00 UTC), independent of the visitor's time zone. Calendar files use UTC and deliberately omit an unprovided event end time. At the event instant the countdown stops at zero.

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

Edit event content in `src/lib/event.ts` and the section copy together; update HTML metadata and calendar UID if repurposing the invitation. There is no invented attendee name, age, or event end time.
