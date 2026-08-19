import { motion, useInView, type Variants } from "motion/react";
import { useRef, type ReactNode } from "react";

const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const MotionAs = motion.create(As);
  return (
    <MotionAs
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: easeOut, delay }}
    >
      {children}
    </MotionAs>
  );
}

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
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
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

export function MaskedTextReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <span ref={ref} className={`relative inline-block overflow-hidden align-baseline ${className}`}>
      <motion.span
        className="inline-block will-change-transform"
        initial={{ y: "110%" }}
        animate={inView ? { y: "0%" } : undefined}
        transition={{ duration: 0.9, ease: easeOut, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Counter({
  to,
  suffix = "",
  duration = 1.4,
  className = "",
}: {
  to: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : undefined}
      transition={{ duration: 0.4 }}
    >
      <CounterInner to={to} suffix={suffix} duration={duration} active={inView} />
    </motion.span>
  );
}

function CounterInner({
  to,
  suffix,
  duration,
  active,
}: {
  to: number;
  suffix: string;
  duration: number;
  active: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);
  if (typeof window !== "undefined" && active && ref.current && !startedRef.current) {
    startedRef.current = true;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      if (ref.current) ref.current.textContent = Math.round(to * eased).toString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  return <span ref={ref}>0{suffix}</span>;
}
