import { useCallback, useEffect, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Flag,
  LoaderCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { AdminLogin } from "../components/admin/AdminLogin";
import { EventSettings } from "../components/admin/EventSettings";
import { RSVPStats } from "../components/admin/RSVPStats";
import { RSVPTable } from "../components/admin/RSVPTable";
import {
  adminRequest,
  AdminError,
  readAdminSession,
  storeAdminSession,
  type AdminDashboard,
  type AdminSession,
} from "../lib/admin";
import { publishEventSettings } from "../lib/event-store";
import "../styles/admin.css";
export default function Admin() {
  const [session, setSession] = useState(readAdminSession);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const reduced = useReducedMotion();
  const expire = useCallback(() => {
    storeAdminSession(null);
    setSession(null);
    setData(null);
    setError("");
    setNotice("Your session has expired. Please sign in again.");
  }, []);
  useEffect(() => {
    document.title = "Race Control · Admin Access";
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      expire,
      Math.max(0, Date.parse(session.expires_at) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, expire]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    adminRequest<AdminDashboard>("dashboard", session.token)
      .then((result) => {
        if (active) {
          setData(result);
          publishEventSettings(result.settings);
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof AdminError && err.status === 401) expire();
        else
          setError(
            err instanceof Error ? err.message : "Unable to load responses.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, expire]);
  async function refresh() {
    if (!session || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await adminRequest<AdminDashboard>(
        "dashboard",
        session.token,
      );
      setData(result);
      publishEventSettings(result.settings);
    } catch (err) {
      if (err instanceof AdminError && err.status === 401) expire();
      else
        setError(
          err instanceof Error ? err.message : "Unable to refresh responses.",
        );
    } finally {
      setLoading(false);
    }
  }
  async function logout() {
    if (!session || loggingOut) return;
    setLoggingOut(true);
    setError("");
    try {
      await adminRequest("logout", session.token);
      storeAdminSession(null);
      setSession(null);
      setData(null);
      setNotice("");
    } catch (err) {
      if (err instanceof AdminError && err.status === 401) expire();
      else
        setError(
          "Unable to log out. Please check your connection and try again.",
        );
    } finally {
      setLoggingOut(false);
    }
  }
  function login(value: AdminSession) {
    setData(null);
    setLoading(true);
    setError("");
    storeAdminSession(value);
    setNotice("");
    setSession(value);
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="admin-page">
        {!session ? (
          <AdminLogin onLogin={login} notice={notice} />
        ) : (
          <>
            <header className="admin-header">
              <a
                className="admin-wordmark"
                href={`${import.meta.env.BASE_URL}admin/`}
              >
                <Flag size={21} />
                <span>Race Control</span>
              </a>
              <div className="admin-header-actions">
                <a
                  className="admin-invitation-link"
                  href={import.meta.env.BASE_URL}
                >
                  View invitation <ArrowUpRight size={15} />
                </a>
                <button
                  className="admin-secondary"
                  onClick={logout}
                  disabled={loggingOut || loading}
                >
                  {loggingOut ? (
                    <LoaderCircle size={15} className="spinner" />
                  ) : (
                    <LogOut size={15} />
                  )}{" "}
                  Log Out
                </button>
              </div>
            </header>
            <main className="admin-dashboard">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <p className="admin-kicker">Birthday Management</p>
                <h1>
                  Race Control<span className="red">.</span>
                </h1>
                <p className="admin-intro">
                  A little planning. An unforgettable lap.
                </p>
              </motion.div>
              {error && (
                <p role="alert" className="admin-feedback admin-error">
                  {error}
                </p>
              )}
              {!data ? (
                <div className="admin-glass admin-loading" aria-live="polite">
                  {loading ? (
                    <>
                      <LoaderCircle className="spinner" size={24} />
                      <p>Opening Race Control…</p>
                    </>
                  ) : (
                    <>
                      <p>We couldn’t load Race Control.</p>
                      <button onClick={refresh} className="admin-secondary">
                        Try again
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <motion.div
                    initial={reduced ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06, duration: 0.4 }}
                  >
                    <EventSettings
                      settings={data.settings}
                      token={session.token}
                      onSaved={(settings) => {
                        setData((previous) =>
                          previous ? { ...previous, settings } : previous,
                        );
                        publishEventSettings(settings);
                      }}
                      onExpired={expire}
                    />
                  </motion.div>
                  <motion.section
                    className="admin-glass admin-responses"
                    aria-labelledby="responses-title"
                    initial={reduced ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.4 }}
                  >
                    <div className="admin-card-heading">
                      <div>
                        <h2 id="responses-title">
                          <Flag size={20} /> RSVP Responses
                        </h2>
                        <p>Your crew, newest responses first.</p>
                      </div>
                      <button
                        className="admin-secondary"
                        onClick={refresh}
                        disabled={loading || loggingOut}
                      >
                        <RefreshCw
                          size={15}
                          className={loading ? "spinner" : ""}
                        />
                        {loading ? "Refreshing…" : "Refresh"}
                      </button>
                    </div>
                    <RSVPStats responses={data.responses} />
                    <RSVPTable responses={data.responses} />
                  </motion.section>
                </>
              )}
            </main>
            <footer className="admin-footer">
              <span className="checkers" aria-hidden="true" />
              <span>PRIVATE ACCESS · RACE CONTROL</span>
            </footer>
          </>
        )}
      </div>
    </MotionConfig>
  );
}
