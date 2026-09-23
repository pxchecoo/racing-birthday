import { useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Flag, LoaderCircle, LockKeyhole } from "lucide-react";
import { adminRequest, type AdminSession } from "../../lib/admin";
export function AdminLogin({
  onLogin,
  notice,
}: {
  onLogin: (session: AdminSession) => void;
  notice: string;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reduced = useReducedMotion();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await adminRequest<{ session: AdminSession }>(
        "login",
        undefined,
        { password },
      );
      setPassword("");
      onLogin(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login-shell">
      <motion.section
        className="admin-glass admin-login-card"
        aria-labelledby="login-title"
        initial={reduced ? false : { opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="admin-emblem" aria-hidden="true">
          <Flag size={27} />
        </div>
        <p className="admin-kicker">Admin Access</p>
        <h1 id="login-title">Race Control</h1>
        <form onSubmit={submit}>
          <label htmlFor="admin-password">Password</label>
          <div className="admin-password-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              aria-describedby={error || notice ? "login-message" : undefined}
            />
          </div>
          {(error || notice) && (
            <p
              className="admin-feedback admin-error"
              id="login-message"
              role={error ? "alert" : "status"}
            >
              {error || notice}
            </p>
          )}
          <button
            type="submit"
            className="button button-red admin-enter"
            disabled={busy}
          >
            {busy ? (
              <>
                <LoaderCircle size={17} className="spinner" /> Entering…
              </>
            ) : (
              <>
                Enter <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
        <a className="admin-back-link" href={import.meta.env.BASE_URL}>
          Back to the invitation
        </a>
      </motion.section>
    </main>
  );
}
