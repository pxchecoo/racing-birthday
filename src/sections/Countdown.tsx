import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "../components/Reveal";
import { remainingTime } from "../lib/event";
export function Countdown() {
  const [time, setTime] = useState(remainingTime);
  const reduced = useReducedMotion();
  useEffect(() => {
    const id = setInterval(() => setTime(remainingTime()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <section
      className="section countdown-section"
      aria-labelledby="countdown-title"
    >
      <Reveal>
        <div className="section-label">
          <span>03 / THE COUNTDOWN</span>
          <span className="timing-label">
            <i /> LIVE TIMING
          </span>
        </div>
        <div className="countdown-heading">
          <h2 id="countdown-title">
            {time.total
              ? "Every second brings us closer."
              : "It’s race day. Let’s celebrate."}
          </h2>
          <p>October 24 · 3:00 PM · Puerto Rico</p>
        </div>
        <div
          className="countdown"
          role="timer"
          aria-label={`${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds until the birthday`}
        >
          {(["days", "hours", "minutes", "seconds"] as const).map((unit, i) => (
            <div
              className={`countdown-unit ${i === 3 ? "seconds-unit" : ""}`}
              key={unit}
            >
              <div className="digit-window">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={time[unit]}
                    initial={
                      reduced
                        ? false
                        : { y: "45%", opacity: 0, filter: "blur(3px)" }
                    }
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={reduced ? undefined : { y: "-45%", opacity: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    {String(time[unit]).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="countdown-label">{unit}</span>
            </div>
          ))}
        </div>
        <div className="timing-track" aria-hidden="true">
          <i />
          <span className="checkers" />
        </div>
      </Reveal>
    </section>
  );
}
