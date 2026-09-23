import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4174/racing-birthday/",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174/racing-birthday/",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://rsvp-test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "sb_publishable_e2e_test_only",
    },
  },
});
