import { useState } from "react";
import type { FormEvent } from "react";
import { CalendarDays, Check, LoaderCircle } from "lucide-react";
import { adminRequest, AdminError } from "../../lib/admin";
import type { EventSettings as Settings } from "../../lib/event";
export function EventSettings({
  settings,
  token,
  onSaved,
  onExpired,
}: {
  settings: Settings;
  token: string;
  onSaved: (settings: Settings) => void;
  onExpired: () => void;
}) {
  const [draft, setDraft] = useState<{ date: string; time: string } | null>(
    null,
  );
  const date = draft?.date ?? settings.event_date;
  const time = draft?.time ?? settings.event_time.slice(0, 5);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback("");
    setError("");
    try {
      const result = await adminRequest<{ settings: Settings }>(
        "save_settings",
        token,
        { event_date: date, event_time: time },
      );
      // The function reads the persisted row back before reporting success.
      onSaved(result.settings);
      setDraft(null);
      setFeedback("Event updated successfully");
    } catch (err) {
      if (err instanceof AdminError && err.status === 401) onExpired();
      else
        setError(
          err instanceof Error ? err.message : "Unable to update the event.",
        );
    } finally {
      setBusy(false);
    }
  }
  function edit() {
    setFeedback("");
    setError("");
  }
  return (
    <section
      className="admin-glass admin-settings"
      aria-labelledby="settings-title"
    >
      <div className="admin-card-heading">
        <div>
          <h2 id="settings-title">
            <CalendarDays size={20} /> Event Settings
          </h2>
          <p>Race day, on your schedule. All times are in Puerto Rico (AST).</p>
        </div>
      </div>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <div className="admin-field">
            <label htmlFor="event-date">Date</label>
            <input
              id="event-date"
              type="date"
              min="2020-01-01"
              max="2100-12-31"
              required
              value={date}
              onChange={(event) => {
                setDraft({ date: event.target.value, time });
                edit();
              }}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="event-time">Time</label>
            <input
              id="event-time"
              type="time"
              required
              step="60"
              value={time}
              onChange={(event) => {
                setDraft({ date, time: event.target.value });
                edit();
              }}
            />
          </div>
          <button type="submit" className="button button-red" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle size={16} className="spinner" /> Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </fieldset>
      </form>
      {feedback && (
        <p className="admin-feedback admin-success" role="status">
          <Check size={16} />
          {feedback}
        </p>
      )}
      {error && (
        <p className="admin-feedback admin-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
