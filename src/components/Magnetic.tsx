import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import type { ReactNode, PointerEvent } from "react";
export function Magnetic({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 22 }),
    sy = useSpring(y, { stiffness: 250, damping: 22 });
  function move(e: PointerEvent<HTMLSpanElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.1);
    y.set((e.clientY - r.top - r.height / 2) * 0.12);
  }
  return (
    <motion.span
      className="magnetic"
      style={{ x: sx, y: sy }}
      onPointerMove={move}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
