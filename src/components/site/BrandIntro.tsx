import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { easings } from "@/motion/motion-tokens";
import { useReducedMotionMode } from "@/motion/hooks";

const KEY = "beausourire-intro-seen";

export function BrandIntro() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotionMode();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    sessionStorage.setItem(KEY, "true");
    const t = setTimeout(() => setShow(false), reduced ? 260 : 1650);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] bg-petrol flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : {
            clipPath: "circle(180% at 50% 40%)",
            transition: { duration: 0.7, ease: easings.easeInOut },
          }}
          style={{ clipPath: "circle(140% at 50% 50%)" }}
        >
          {reduced ? (
            <div className="text-ivory font-serif text-2xl">Beausourire</div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <svg width="180" height="90" viewBox="0 0 180 90" fill="none" aria-hidden>
                <motion.path
                  d="M15 45 Q 90 95 165 45"
                  stroke="var(--color-mint)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.55, ease: easings.easeInOut, delay: 0.2 }}
                />
                <motion.circle
                  cx="90"
                  cy="45"
                  r="4"
                  fill="var(--color-champagne)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.65, ease: easings.easeOut }}
                />
              </svg>
              <div className="overflow-hidden">
                <motion.div
                  className="font-serif text-ivory text-3xl md:text-5xl tracking-tight"
                  initial={{ x: -24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.33, delay: 0.82, ease: easings.easeOut }}
                >
                  BEAUSOURIRE
                </motion.div>
              </div>
              <motion.div
                className="text-mint/80 text-xs md:text-sm tracking-[0.3em] uppercase"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, delay: 1.0, ease: easings.easeOut }}
              >
                Cabinet dentaire — Bab Ezzouar
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
