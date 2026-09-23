import { useEvent } from "../hooks/useEvent";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Flag,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Minus,
} from "lucide-react";
import { Reveal } from "../components/Reveal";
import { isRsvpConfigured, submitRsvp } from "../lib/supabase";
import { validateRsvp } from "../lib/rsvp";
export function Rsvp() {
  const { labels } = useEvent();
  const [attending, setAttending] = useState(true);
  const [guests, setGuests] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  const lastPayload = useRef("");
  const successRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    const values = new FormData(e.currentTarget);
    const input = {
      name: String(values.get("name") ?? "").trim(),
      attending,
      guest_count: attending ? guests : 0,
      message: attending
        ? String(values.get("message") ?? "").trim() || null
        : null,
    };
    const validation = validateRsvp(input);
    if (validation) {
      setError(validation);
      setStatus("error");
      return;
    }
    const payload = JSON.stringify(input);
    if (!requestId.current || lastPayload.current !== payload) {
      requestId.current = crypto.randomUUID();
      lastPayload.current = payload;
    }
    setStatus("loading");
    setError("");
    try {
      await submitRsvp(input, requestId.current);
      setStatus("success");
      setTimeout(() => successRef.current?.focus(), 100);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Please try again in a moment.",
      );
    }
  }
  return (
    <section
      className="section rsvp-section"
      id="rsvp"
      aria-labelledby="rsvp-title"
    >
      <div className="rsvp-grid">
        <Reveal>
          <div className="section-label">
            <span>04 / YOUR PLACE ON THE GRID</span>
          </div>
          <div className="rsvp-lights" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <h2 id="rsvp-title">
            ARE YOU
            <br />
            JOINING
            <br />
            <span className="text-metal">THE RACE?</span>
          </h2>
          <p className="body-copy">
            The best part of the day?
            <br />
            Having you there.
          </p>
          <div className="rsvp-signoff">
            <span className="checkers" /> LET’S MAKE THIS LAP COUNT.
          </div>
        </Reveal>
        <Reveal delay={0.12} className="form-reveal">
          <motion.div className="rsvp-card" layout={!reduced}>
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  className="success-state"
                  ref={successRef}
                  tabIndex={-1}
                  role="status"
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="success-icon">
                    <Check size={36} />
                    <motion.span
                      className="success-flag"
                      initial={{ opacity: 0, rotate: -20 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        rotate: [-20, 10, 0, 0],
                      }}
                      transition={{ duration: reduced ? 0 : 2.5 }}
                    >
                      <Flag size={25} />
                    </motion.span>
                  </div>
                  <span className="eyebrow">RSVP CONFIRMED</span>
                  <h3>
                    {attending ? (
                      <>
                        You’re on the
                        <br />
                        starting grid 🏁
                      </>
                    ) : (
                      <>
                        We’ll miss you
                        <br />
                        on the grid.
                      </>
                    )}
                  </h3>
                  <p>
                    {attending
                      ? `${labels.shortDate} at ${labels.time}. ${guests ? `You + ${guests} ${guests === 1 ? "guest" : "guests"}. ` : ""}See you at the starting line.`
                      : "Thanks for letting us know. You’ll be there in spirit."}
                  </p>
                  <a href="#details" className="text-button">
                    Back to the details <ArrowUpRight size={16} />
                  </a>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={submit}
                  initial={false}
                  exit={{ opacity: 0 }}
                  aria-busy={status === "loading"}
                >
                  <div className="form-heading">
                    <span className="micro">YOUR RACE PASS</span>
                    <Flag size={21} />
                  </div>
                  <h3>Make it official.</h3>
                  <fieldset
                    disabled={status === "loading"}
                    className="form-fields"
                  >
                    <label htmlFor="name">Your name</label>
                    <input
                      id="name"
                      name="name"
                      autoComplete="name"
                      placeholder="First and last name"
                      required
                      maxLength={100}
                    />
                    <fieldset className="attendance">
                      <legend>Will you attend?</legend>
                      <div className="attendance-options">
                        <label className={attending ? "selected" : ""}>
                          <input
                            type="radio"
                            name="attendance"
                            value="yes"
                            checked={attending}
                            onChange={() => setAttending(true)}
                          />
                          <span>
                            I’m going <span aria-hidden="true">🏁</span>
                          </span>
                          {attending && <Check size={15} />}
                        </label>
                        <label className={!attending ? "selected" : ""}>
                          <input
                            type="radio"
                            name="attendance"
                            value="no"
                            checked={!attending}
                            onChange={() => setAttending(false)}
                          />
                          <span>Can’t make it</span>
                          {!attending && <Check size={15} />}
                        </label>
                      </div>
                    </fieldset>
                    <AnimatePresence initial={false}>
                      {attending && (
                        <motion.div
                          className="extra-fields"
                          initial={{ height: reduced ? "auto" : 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: reduced ? "auto" : 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="guest-row">
                            <div>
                              <label htmlFor="guests">Number of guests</label>
                              <p>Additional people joining you</p>
                            </div>
                            <div className="stepper">
                              <button
                                type="button"
                                aria-label="Remove a guest"
                                disabled={!guests}
                                onClick={() => setGuests((g) => g - 1)}
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                id="guests"
                                name="guests"
                                aria-label="Number of additional guests"
                                type="number"
                                min="0"
                                max="10"
                                value={guests}
                                onChange={(e) =>
                                  setGuests(
                                    Math.max(
                                      0,
                                      Math.min(10, Number(e.target.value)),
                                    ),
                                  )
                                }
                              />
                              <button
                                type="button"
                                aria-label="Add a guest"
                                disabled={guests >= 10}
                                onClick={() => setGuests((g) => g + 1)}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                          <label htmlFor="message">
                            Leave a message{" "}
                            <span className="optional">(optional)</span>
                          </label>
                          <textarea
                            id="message"
                            name="message"
                            maxLength={1000}
                            rows={3}
                            placeholder="Something for the birthday driver…"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </fieldset>
                  {!isRsvpConfigured && (
                    <p className="setup-notice" role="status">
                      RSVP opens soon. Check back to reserve your place.
                    </p>
                  )}
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="button button-red submit-button"
                    type="submit"
                    disabled={status === "loading" || !isRsvpConfigured}
                  >
                    {status === "loading" ? (
                      <>
                        <LoaderCircle className="spinner" size={18} /> Saving
                        your place…
                      </>
                    ) : (
                      <>
                        Confirm RSVP <ArrowUpRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="privacy">
                    <LockKeyhole size={12} /> Your RSVP is only used to organize
                    the event.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
