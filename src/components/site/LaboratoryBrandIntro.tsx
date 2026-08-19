import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { easings } from "@/motion/motion-tokens";
import { useReducedMotionMode } from "@/motion/hooks";

const KEY = "dr-tarfaya-intro-seen-v2";

export function LaboratoryBrandIntro() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotionMode();

  useEffect(() => {
    if (typeof window === "undefined" || sessionStorage.getItem(KEY)) return;
    setShow(true);
    sessionStorage.setItem(KEY, "true");
    const timer = window.setTimeout(() => setShow(false), reduced ? 280 : 2100);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-midnight-deep text-plasma"
          initial={{ opacity: 1 }}
          exit={
            reduced
              ? { opacity: 0 }
              : {
                  clipPath: "circle(0% at 50% 48%)",
                  opacity: 0,
                  transition: { duration: 0.78, ease: easings.easeInOut },
                }
          }
          style={{ clipPath: "circle(150% at 50% 48%)" }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute h-[68vw] w-[68vw] max-h-[680px] max-w-[680px] rounded-full border border-blue/15"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-coral shadow-[0_0_24px_7px_rgba(239,93,88,0.45)]" />
            <span className="absolute inset-[16%] rounded-full border border-dashed border-white/8" />
          </motion.div>

          <div className="relative flex flex-col items-center gap-5 text-center">
            <svg width="126" height="126" viewBox="0 0 126 126" fill="none" aria-hidden>
              <motion.path
                d="M63 10C49 31 33 47 33 70.5C33 89.2 46.4 104 63 104s30-14.8 30-33.5C93 47 77 31 63 10Z"
                stroke="#F7F4EE"
                strokeWidth="2.4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.72, delay: 0.15, ease: easings.easeInOut }}
              />
              <motion.ellipse
                cx="63"
                cy="69"
                rx="46"
                ry="16"
                stroke="#146EF5"
                strokeWidth="2"
                transform="rotate(-12 63 69)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.55, ease: easings.easeInOut }}
              />
              <motion.circle
                cx="63"
                cy="69"
                r="12"
                stroke="#146EF5"
                strokeWidth="2.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.42, delay: 0.82, ease: easings.easeOut }}
              />
              <motion.circle
                cx="63"
                cy="69"
                r="4.8"
                fill="#EF5D58"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.35, 1], opacity: 1 }}
                transition={{ duration: 0.48, delay: 1.08, ease: easings.easeOut }}
              />
            </svg>

            <div className="overflow-hidden">
              <motion.div
                className="font-display text-4xl tracking-[-0.035em] text-white md:text-6xl"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.58, delay: 0.86, ease: easings.easeOut }}
              >
                Dr Tarfaya
              </motion.div>
            </div>
            <motion.div
              className="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-blue md:text-xs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 1.24 }}
            >
              Laboratoire · Hématologie
            </motion.div>
            <motion.span
              className="mt-3 h-px w-24 origin-left bg-[linear-gradient(90deg,#146ef5,#ef5d58)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.65, delay: 1.35, ease: easings.easeInOut }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
