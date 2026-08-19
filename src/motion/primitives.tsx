import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from "motion/react";
import {
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { durations, easings, staggers } from "./motion-tokens";
import { useReducedMotionMode, useLowPowerMode } from "./hooks";

export function MaskedTextReveal({
  children,
  className = "",
  delay = 0,
  as: As = "span",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotionMode();
  return (
    <As
      ref={ref as never}
      className={`relative inline-block overflow-hidden align-baseline ${className}`}
    >
      <motion.span
        className="inline-block will-change-transform"
        initial={{ y: reduced ? 0 : "105%" }}
        animate={inView ? { y: "0%" } : undefined}
        transition={{
          duration: reduced ? 0.25 : 0.9,
          ease: easings.easeOut,
          delay,
        }}
      >
        {children}
      </motion.span>
    </As>
  );
}

export function ImageCurtainReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotionMode();
  const closed = {
    up: "inset(0 0 100% 0)",
    down: "inset(100% 0 0 0)",
    left: "inset(0 100% 0 0)",
    right: "inset(0 0 0 100%)",
  }[direction];
  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden ${className}`}
      initial={{ clipPath: reduced ? "inset(0 0 0 0)" : closed }}
      animate={inView ? { clipPath: "inset(0 0 0 0)" } : undefined}
      transition={{
        duration: reduced ? 0.3 : 1.1,
        ease: easings.easeInOut,
        delay,
      }}
    >
      <motion.div
        initial={{ scale: reduced ? 1 : 1.08 }}
        animate={inView ? { scale: 1 } : undefined}
        transition={{
          duration: reduced ? 0.3 : 1.3,
          ease: easings.easeOut,
          delay,
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function MagneticButton({
  children,
  className = "",
  strength = 6,
  onClick,
  as = "button",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  as?: "button" | "a";
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const pointerRect = useRef<DOMRect | null>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const x = useSpring(targetX, { stiffness: 180, damping: 16, mass: 0.4 });
  const y = useSpring(targetY, { stiffness: 180, damping: 16, mass: 0.4 });
  const reduced = useReducedMotionMode();
  const low = useLowPowerMode();

  function handleEnter(e: MouseEvent) {
    if (reduced || low) return;
    pointerRect.current = e.currentTarget.getBoundingClientRect();
  }

  function handleMove(e: MouseEvent) {
    if (reduced || low) return;
    const r = pointerRect.current ?? e.currentTarget.getBoundingClientRect();
    pointerRect.current = r;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const max = strength;
    targetX.set(Math.max(-max, Math.min(max, dx * 0.25)));
    targetY.set(Math.max(-max, Math.min(max, dy * 0.25)));
  }

  function handleLeave() {
    pointerRect.current = null;
    targetX.set(0);
    targetY.set(0);
  }
  const Comp = as === "a" ? motion.a : motion.button;
  return (
    <Comp
      ref={ref as never}
      onMouseEnter={handleEnter as never}
      onMouseMove={handleMove as never}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ x, y }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: As = "div",
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
  y?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotionMode();
  const MotionAs = motion.create(As);
  return (
    <MotionAs
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: durations.reveal, ease: easings.easeOut, delay }}
    >
      {children}
    </MotionAs>
  );
}

export function Stagger({
  children,
  className = "",
  editorial = false,
}: {
  children: ReactNode;
  className?: string;
  editorial?: boolean;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: editorial ? staggers.editorial : staggers.tight,
            delayChildren: 0.05,
          },
        },
      }}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: durations.reveal, ease: easings.easeOut },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function useParallax(
  range = 60,
): [React.RefObject<HTMLElement | null>, MotionValue<number>] {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    useSpring(scrollYProgress, { stiffness: 80, damping: 20, mass: 0.4 }),
    [0, 1],
    [range, -range],
  );
  return [ref, y];
}

export function ScrollProgressLine({
  target,
}: {
  target: React.RefObject<HTMLElement | null>;
}) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ["start end", "end start"],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 25 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-teal z-[80]"
      style={{ scaleX }}
    />
  );
}

export function usePageHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
