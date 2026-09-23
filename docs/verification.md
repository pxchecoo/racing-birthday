# Verification — September 23, 2026

Site: https://pxchecoo.github.io/racing-birthday/  
Application revision: `1c0c24c`  
Successful deployment: https://github.com/pxchecoo/racing-birthday/actions/runs/35870263688

## Build and automated tests

- `npm install`: successful, 0 reported vulnerabilities.
- `npm run build`: successful; Vite base `/racing-birthday/`.
- `npm run lint`: successful.
- `npm test`: 9 passing tests (timezone, countdown boundaries, calendar, Maps, RSVP validation).
- `npm run test:e2e`: 5 passing browser tests (responsive/accessibility, calendar, attendance, decline, error/retry).
- Layout checked at 320, 375, 390, 768, 1440, and 1920 pixels. No horizontal overflow.
- Reduced-motion behavior verified in automated browser tests; normal motion visually inspected using Agent Browser.

## Published site

Fresh browser contexts verified the deployed page at 390px and 1440px:

- HTTP 200; all requested resources loaded.
- No JavaScript page errors or console errors.
- Zero automated WCAG A/AA accessibility violations.
- No horizontal overflow.
- RSVP attendance submitted from mobile and confirmed by the UI.
- RSVP decline submitted from desktop and confirmed by the UI.
- Both records independently checked through the private database connection.
- Temporary verification records removed after validation.

Browser checks use Chromium emulation rather than a physical device lab.

## Supabase privacy

Project `racing-birthday` is provisioned in `us-east-1`. Table: `public.birthday_rsvps`.

The real public API returned:

| Operation                          | Result                   |
| ---------------------------------- | ------------------------ |
| Valid anonymous INSERT             | 201, stored successfully |
| SELECT                             | 401, permission denied   |
| UPDATE                             | 401, permission denied   |
| DELETE                             | 401, permission denied   |
| Declined response with guests      | 401, rejected by RLS     |
| Client-supplied creation timestamp | 401, permission denied   |

Database inspection confirmed RLS enabled **and forced**, a single INSERT policy for `anon`, and no SELECT/UPDATE/DELETE grants for either `anon` or `authenticated`. Only public API values are supplied to the frontend. Git tracks `.env.example` only, not local environment or provisioning credentials.

## Lighthouse mobile — deployed URL

Lighthouse 13.5.0, mobile simulated throttling, production GitHub Pages URL:

| Category       | Score |
| -------------- | ----- |
| Performance    | 97    |
| Accessibility  | 100   |
| Best practices | 100   |
| SEO            | 100   |

FCP 1.6 s · LCP 2.5 s · Speed Index 1.9 s · Total Blocking Time 40 ms · CLS 0.

These are measured lab results, not guarantees for every device or network. The first local audit identified a contrast issue and oversized mobile image; both were fixed and checks rerun. Self-hosted fonts, responsive WebP images, font/image preloads, lazy Supabase imports, and reduced continuous animation on mobile keep initial load small.
