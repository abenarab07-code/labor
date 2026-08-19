import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const SESSION_KEY = "beausourire_intro_seen";

export function IntroAnimation() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen || reduced) return;
    setShow(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ivory"
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0 0 100% 0)",
            transition: { duration: 0.6, ease: [0.83, 0, 0.17, 1] },
          }}
        >
          <div className="flex flex-col items-center gap-5">
            <svg width="120" height="60" viewBox="0 0 120 60" fill="none" aria-hidden>
              <motion.path
                d="M10 30 Q 60 65 110 30"
                stroke="var(--color-teal)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
              />
            </svg>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              <Logo />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
