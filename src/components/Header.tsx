import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";
export function Header() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 150, damping: 30 });
  const reduced = useReducedMotion();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to invitation
      </a>
      <header className="header">
        <a className="wordmark" href="#" aria-label="Racing birthday home">
          <span className="brand-mark" aria-hidden="true">
            R<span>·</span>B
          </span>
          <span className="brand-label">
            BIRTHDAY
            <br />
            RACING EXPERIENCE
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-detail" href="#details">
            The details
          </a>
          <a className="nav-detail" href="#location">
            The location
          </a>
          <a className="nav-rsvp" href="#rsvp">
            Count me in <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      <motion.div
        className="scroll-progress"
        style={{ scaleX: reduced ? scrollYProgress : smooth }}
        aria-hidden="true"
      />
    </>
  );
}
