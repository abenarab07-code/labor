import { motion, useScroll, useSpring } from "motion/react";
import { useLowPowerMode, useReducedMotionMode } from "@/motion/hooks";

export function LaboratoryPageProgress() {
  const lowPower = useLowPowerMode();
  const reducedMotion = useReducedMotionMode();

  return lowPower || reducedMotion ? null : <AnimatedPageProgress />;
}

function AnimatedPageProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.25,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-[linear-gradient(90deg,#146ef5_0%,#41a0ff_68%,#ef5d58_100%)]"
      style={{ scaleX }}
    />
  );
}
