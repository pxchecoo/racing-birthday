# Race Control verification

Date: September 23, 2026.

## Starting state

The existing `main` checkout contained unfinished admin components, a separate admin entry, event-store changes, and an undeployed SQL migration/Edge Function. All changes were retained and completed. The public RSVP insert client, original styles, artwork, and Pages workflow were preserved. The original database contained `birthday_rsvps` only; no duplicate RSVP table was created.

The first review found three outdated date tests, two React lint warnings, static dates in HTML metadata, and no deployed admin backend. These were corrected. The first admin browser audit also caught an invalid ARIA attribute on the loading fallback; it was fixed before delivery.

## Automated checks

- Production build: pass, including `dist/admin/index.html`.
- Lint: pass without warnings.
- Unit tests: 16 pass, covering validation, timezone boundaries, countdown/calendar changes, guest totals, password comparison, and random session tokens.
- Browser tests: 9 pass, including the existing public RSVP suite and new login/session/logout/settings/mobile tests.
- Edge Function type check with Deno: pass.
- Login and dashboard accessibility: zero automated WCAG A/AA violations.
- Responsive layouts: public 320–1920px; admin 320, 390, 768, and 1440px, without horizontal overflow.

## Real Supabase checks

The deployed `race-control` function was tested with the real project:

- Missing or fabricated admin tokens: HTTP 401.
- Incorrect password: explicit rejection, no session returned.
- Correct password: opaque, four-hour session; authorized dashboard loads.
- Logout: token revoked; subsequent use returns HTTP 401.
- Anonymous RSVP reads: HTTP 401.
- Anonymous schedule update with an explicit row filter: HTTP 401.
- Anonymous reads of admin sessions and login counters: HTTP 401.
- Public event settings read: HTTP 200.
- Database privilege checks: neither `anon` nor `authenticated` can read RSVP/session records, update the schedule, or execute the login-limit RPC.
- Atomic rate limiter checked in a rolled-back transaction: first five attempts accepted, sixth denied.

The browser was also exercised against the real Edge Function using the Honolulu viewer timezone. A temporary public RSVP was registered, displayed in Race Control, and included correctly in statistics. Refresh retained the admin session. Date/time were temporarily changed to October 25 at 4:15 PM Puerto Rico time; the already-open public hero, weekday, RSVP confirmation, and countdown updated without a reload. The original **October 24, 2026 at 3:00 PM AST** schedule was restored. Only the specifically identified test response was removed; pre-existing RSVP data was preserved.

## Credential audit

Tracked/new source and the generated frontend were scanned for the actual configured admin password, service-role JWTs, secret API key values, and server-secret references in frontend files. No leaks were found. The Supabase JS dependency contains a generic `sb_secret_` format-checking literal; this is library code, not a configured key. Local server secrets and test sessions are ignored by Git and never included in Pages artifacts.

Admin source files are public because GitHub Pages is static hosting. Data and mutations are protected by server-side token validation on every request; frontend visibility is not used as authorization.
