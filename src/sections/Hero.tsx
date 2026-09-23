import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { ArrowDown, ArrowUpRight, CalendarPlus } from "lucide-react";
import { Magnetic } from "../components/Magnetic";
import { downloadCalendar } from "../lib/event";
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 8]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const filter = useTransform(
    scrollYProgress,
    [0, 1],
    ["blur(0px)", "blur(5px)"],
  );
  const px = useMotionValue(0),
    py = useMotionValue(0);
  const tiltX = useSpring(py, { stiffness: 60, damping: 18 }),
    tiltY = useSpring(px, { stiffness: 60, damping: 18 });
  return (
    <section
      className="hero"
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX / r.width - 0.5) * 9);
        py.set((0.5 - (e.clientY - r.top) / r.height) * 7);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        className="hero-stage"
        style={reduced ? {} : { scale, y, opacity, filter, rotateX }}
      >
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> ONE DAY. FULL THROTTLE.
          </div>
          <h1 id="hero-title">
            <span>START YOUR</span>
            <span className="engines">
              ENGINES<span className="red">.</span>
            </span>
          </h1>
          <p className="hero-subtitle">Birthday Racing Experience</p>
          <p className="hero-description">
            Another lap around the sun.
            <br />
            This one deserves a celebration.
          </p>
          <div className="hero-actions">
            <Magnetic>
              <a href="#rsvp" className="button button-red">
                Join the grid <ArrowUpRight size={18} />
              </a>
            </Magnetic>
            <button className="button button-quiet" onClick={downloadCalendar}>
              <CalendarPlus size={17} /> Add to calendar
            </button>
          </div>
        </div>
        <div className="hero-art">
          <span className="edition-number" aria-hidden="true">
            24
          </span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <motion.div
            className="helmet-tilt"
            style={reduced ? {} : { rotateX: tiltX, rotateY: tiltY }}
          >
            <img
              className="helmet"
              src={`${import.meta.env.BASE_URL}assets/helmet.webp`}
              srcSet={`${import.meta.env.BASE_URL}assets/helmet-small.webp 640w, ${import.meta.env.BASE_URL}assets/helmet-medium.webp 800w, ${import.meta.env.BASE_URL}assets/helmet.webp 1200w`}
              sizes="(max-width: 700px) 90vw, 55vw"
              width="1200"
              height="1200"
              alt="Original chrome racing helmet with a smoked visor and racing red accents"
              fetchPriority="high"
            />
            <div className="helmet-shadow" />
          </motion.div>
          <span className="art-caption">
            <i /> BUILT FOR A GOOD TIME.
          </span>
          <span className="art-cross" aria-hidden="true">
            +
          </span>
        </div>
      </motion.div>
      <div className="hero-bottom">
        <div>
          <span className="micro">RACE DAY</span>
          <strong>October 24, 2026</strong>
        </div>
        <div>
          <span className="micro">LIGHTS OUT</span>
          <strong>
            3:00 PM <span className="muted">AST</span>
          </strong>
        </div>
        <div className="hero-destination">
          <span className="micro">THE DESTINATION</span>
          <strong>El Conquistador, PR</strong>
        </div>
        <a
          href="#details"
          className="scroll-cue"
          aria-label="Scroll to event details"
        >
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown size={18} />
        </a>
      </div>
    </section>
  );
}
