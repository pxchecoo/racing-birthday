import { loadEnv } from "vite";
const env = {
  ...loadEnv("production", process.cwd(), "VITE_"),
  ...process.env,
};
const url = env.VITE_SUPABASE_URL?.trim();
const key = env.VITE_SUPABASE_ANON_KEY?.trim();
if (!url && !key) {
  console.warn(
    "Supabase is not configured. The site will show an honest RSVP unavailable state.",
  );
} else {
  let isAnon = false;
  try {
    isAnon =
      JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
        .role === "anon";
  } catch {
    /* not a legacy JWT */
  }
  if (
    !url ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) ||
    !key ||
    (!key.startsWith("sb_publishable_") && !isAnon)
  ) {
    throw new Error(
      "Use a Supabase HTTPS project URL and only an anon/publishable key. Private keys are forbidden in the frontend.",
    );
  }
}
for (const name of Object.keys(env)) {
  if (
    /^VITE_.*(SERVICE_ROLE|SECRET|PRIVATE|ADMIN|ACCESS_TOKEN)/i.test(name) &&
    env[name]
  )
    throw new Error(`Forbidden frontend variable: ${name}`);
}
