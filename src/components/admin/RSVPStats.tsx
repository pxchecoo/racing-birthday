import { motion, useReducedMotion } from "motion/react";
import { rsvpStats, type RsvpResponse } from "../../lib/admin";
export function RSVPStats({ responses }: { responses: RsvpResponse[] }) {
  const stats = rsvpStats(responses);
  const reduced = useReducedMotion();
  const items = [
    ["Going", stats.going],
    ["Not Going", stats.notGoing],
    ["Total Responses", stats.total],
    ["Total Guests", stats.totalGuests],
  ] as const;
  return (
    <>
      <dl className="admin-stats">
        {items.map(([label, value]) => (
          <div className="admin-stat" key={label}>
            <dt>{label}</dt>
            <dd>
              <motion.span
                key={value}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {value}
              </motion.span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="admin-stats-note">
        Total Guests includes everyone attending: confirmed respondents + their
        additional guests.
      </p>
    </>
  );
}
