import { MotionConfig } from "motion/react";
import { Header } from "./components/Header";
import { Hero } from "./sections/Hero";
import { Details } from "./sections/Details";
import { Countdown } from "./sections/Countdown";
import { Rsvp } from "./sections/Rsvp";
export default function App() {
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
          <span>OCTOBER 24</span>
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
          OCT 24 / 2026 <span className="red">↗</span>
        </span>
      </footer>
    </MotionConfig>
  );
}
