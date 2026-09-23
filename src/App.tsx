import { useEffect } from "react";
import { useEvent } from "./hooks/useEvent";
import { MotionConfig } from "motion/react";
import { Header } from "./components/Header";
import { Hero } from "./sections/Hero";
import { Details } from "./sections/Details";
import { Countdown } from "./sections/Countdown";
import { Rsvp } from "./sections/Rsvp";
export default function App() {
  const { labels } = useEvent();
  useEffect(() => {
    const title = `Racing Birthday · ${labels.shortDate}`;
    const description = `You’re invited to a racing birthday experience on ${labels.date} at ${labels.time}. El Conquistador, Puerto Rico.`;
    document.title = title;
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:description"]',
    ])
      document.querySelector(selector)?.setAttribute("content", description);
  }, [labels.date, labels.shortDate, labels.time]);
  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main id="main">
        <Hero />
        <div className="marquee-strip" aria-hidden="true">
          <span>GOOD PEOPLE</span>
          <i />
          <span>GREAT ENERGY</span>
          <i />
          <span>ANOTHER LAP AROUND THE SUN</span>
          <i />
          <span>{labels.shortDate.toUpperCase()}</span>
          <i />
          <span>FULL THROTTLE</span>
        </div>
        <Details />
        <Countdown />
        <Rsvp />
      </main>
      <footer className="footer">
        <a className="brand-mark" href="#" aria-label="R·B — back to top">
          R<span>·</span>B
        </a>
        <span>ONE DAY. ONE CREW. ONE UNFORGETTABLE LAP.</span>
        <span>
          {labels.month} {labels.day} / {labels.year}{" "}
          <span className="red">↗</span>
        </span>
      </footer>
    </MotionConfig>
  );
}
