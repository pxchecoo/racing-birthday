import type { EventSettings } from "./event";
export interface AdminSession {
  token: string;
  expires_at: string;
}
export interface RsvpResponse {
  id: string;
  name: string;
  attending: boolean;
  guest_count: number;
  message: string | null;
  created_at: string;
}
export interface AdminDashboard {
  settings: EventSettings;
  responses: RsvpResponse[];
}
const sessionKey = "race-control-session-v1";
export class AdminError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminError";
    this.status = status;
  }
}
export function readAdminSession(): AdminSession | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    if (
      data &&
      /^[a-f0-9]{64}$/.test(data.token) &&
      Date.parse(data.expires_at) > Date.now()
    )
      return data;
    sessionStorage.removeItem(sessionKey);
  } catch {
    /* Storage may be disabled. */
  }
  return null;
}
export function storeAdminSession(session: AdminSession | null) {
  try {
    if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
    else sessionStorage.removeItem(sessionKey);
  } catch {
    /* This tab can still use the in-memory session. */
  }
}
export async function adminRequest<T>(
  action: string,
  token?: string,
  values: Record<string, string> = {},
): Promise<T> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new AdminError("Race Control is not configured.", 503);
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/race-control`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        ...(token ? { "x-admin-token": token } : {}),
      },
      body: JSON.stringify({ action, ...values }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new AdminError("Connection unavailable. Please try again.", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok !== true)
    throw new AdminError(
      data?.error || "Unable to complete this request.",
      response.status,
    );
  return data as T;
}
export function rsvpStats(responses: RsvpResponse[]) {
  const going = responses.filter((response) => response.attending);
  return {
    going: going.length,
    notGoing: responses.length - going.length,
    total: responses.length,
    totalGuests: going.reduce(
      (sum, response) => sum + 1 + response.guest_count,
      0,
    ),
  };
}
