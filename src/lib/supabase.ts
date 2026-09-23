import type { SupabaseClient } from "@supabase/supabase-js";
import { validateRsvp, type RsvpInput } from "./rsvp";
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
function isPublicKey(value: string | undefined) {
  if (!value) return false;
  if (value.startsWith("sb_publishable_")) return true;
  try {
    return (
      JSON.parse(
        atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).role === "anon"
    );
  } catch {
    return false;
  }
}
export const isRsvpConfigured = Boolean(
  url &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) &&
  isPublicKey(key),
);
let clientPromise: Promise<SupabaseClient> | undefined;
function getClient() {
  return (clientPromise ??= import("@supabase/supabase-js").then(
    ({ createClient }) =>
      createClient(url!, key!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
  ));
}
export async function submitRsvp(input: RsvpInput, id: string) {
  const errorMessage = validateRsvp(input);
  if (errorMessage) throw new Error(errorMessage);
  if (!isRsvpConfigured)
    throw new Error(
      "RSVP opens soon. Please check back to reserve your place.",
    );
  const client = await getClient();
  const { error } = await client
    .from("birthday_rsvps")
    .insert({ ...input, name: input.name.trim(), id })
    .abortSignal(AbortSignal.timeout(15000));
  // A retry with this same locally generated UUID means the first insert succeeded.
  if (error && error.code !== "23505")
    throw new Error(
      "We couldn’t save your RSVP. Please check your connection and try again.",
    );
}
