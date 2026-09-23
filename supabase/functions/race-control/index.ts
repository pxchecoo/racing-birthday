import { createClient } from "npm:@supabase/supabase-js@2.117.1";
import {
  matchesPassword,
  newToken,
  sha256,
  validSchedule,
} from "./security.ts";

const allowedOrigins = (
  Deno.env.get("ADMIN_ALLOWED_ORIGINS") || "https://pxchecoo.github.io"
)
  .split(",")
  .map((value) => value.trim());
const sessionDuration = 4 * 60 * 60 * 1000;

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
    "Access-Control-Allow-Headers": "content-type, apikey, x-admin-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
  if (origin && allowedOrigins.includes(origin))
    headers["Access-Control-Allow-Origin"] = origin;
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowedOrigins.includes(origin))
    return respond({ error: "Origin not allowed." }, 403);
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "POST")
    return respond({ error: "Method not allowed." }, 405);

  try {
    if (Number(request.headers.get("content-length") || 0) > 4096)
      return respond({ error: "Request too large." }, 413);
    const raw = await request.text();
    if (raw.length > 4096) return respond({ error: "Request too large." }, 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return respond({ error: "Invalid request." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      return respond({ error: "Invalid request." }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const password = Deno.env.get("ADMIN_PASSWORD");
    if (!url || !key || !password)
      return respond({ error: "Race Control is not configured." }, 503);
    const database = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.action === "login") {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      const ipHash = await sha256(`${password}:${ip}`);
      const { data: allowed, error: limitError } = await database.rpc(
        "consume_admin_login_attempt",
        { ip_hash: ipHash },
      );
      if (limitError) throw limitError;
      if (!allowed)
        return respond(
          { error: "Too many attempts. Please try again in 15 minutes." },
          429,
        );
      if (
        typeof body.password !== "string" ||
        body.password.length > 256 ||
        !(await matchesPassword(body.password, password))
      ) {
        // A handled credential rejection, not a frontend exception or password echo.
        return respond({ ok: false, error: "Incorrect password." });
      }
      const token = newToken();
      const expiresAt = new Date(Date.now() + sessionDuration).toISOString();
      const { error } = await database
        .from("admin_sessions")
        .insert({ token_hash: await sha256(token), expires_at: expiresAt });
      if (error) throw error;
      await database
        .from("admin_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());
      return respond({ ok: true, session: { token, expires_at: expiresAt } });
    }

    const token = request.headers.get("x-admin-token") || "";
    if (!/^[a-f0-9]{64}$/.test(token))
      return respond(
        { error: "Your session has expired. Please sign in again." },
        401,
      );
    const tokenHash = await sha256(token);
    const { data: session, error: sessionError } = await database
      .from("admin_sessions")
      .select("expires_at")
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session)
      return respond(
        { error: "Your session has expired. Please sign in again." },
        401,
      );

    if (body.action === "logout") {
      const { error } = await database
        .from("admin_sessions")
        .delete()
        .eq("token_hash", tokenHash);
      if (error) throw error;
      return respond({ ok: true });
    }
    if (body.action === "save_settings") {
      if (!validSchedule(body.event_date, body.event_time))
        return respond(
          { error: "Enter a valid date and time (2020–2100)." },
          400,
        );
      const { error } = await database
        .from("event_settings")
        .update({
          event_date: body.event_date,
          event_time: body.event_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
      const { data: settings, error: readError } = await database
        .from("event_settings")
        .select("id,event_date,event_time,updated_at")
        .eq("id", 1)
        .single();
      if (readError) throw readError;
      return respond({ ok: true, settings });
    }
    if (body.action === "dashboard") {
      const { data: settings, error } = await database
        .from("event_settings")
        .select("id,event_date,event_time,updated_at")
        .eq("id", 1)
        .single();
      if (error) throw error;
      const responses = [];
      for (let start = 0; ; start += 1000) {
        const { data, error: listError } = await database
          .from("birthday_rsvps")
          .select("id,name,attending,guest_count,message,created_at")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(start, start + 999);
        if (listError) throw listError;
        responses.push(...data);
        if (data.length < 1000) break;
      }
      return respond({ ok: true, settings, responses });
    }
    return respond({ error: "Unknown action." }, 400);
  } catch {
    // Never return database errors, request bodies, passwords, or service credentials.
    return respond(
      { error: "Race Control is temporarily unavailable. Please try again." },
      503,
    );
  }
});
