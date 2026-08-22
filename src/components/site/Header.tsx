import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotionMode } from "@/motion/hooks";
import { Logo } from "./Logo";

const navigation = [
  { hash: "analyses", label: "Analyses" },
  { hash: "hematologie", label: "Hématologie" },
  { hash: "parcours", label: "Votre visite" },
  { hash: "docteur", label: "Dr Tarfaya" },
  { hash: "contact", label: "Contact" },
];

const MotionLink = motion.create(Link);

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotionMode();

  useEffect(() => {
    let lastScrolled = window.scrollY > 34;
    const update = () => {
      const nextScrolled = window.scrollY > 34;
      if (nextScrolled === lastScrolled) return;
      lastScrolled = nextScrolled;
      setScrolled(nextScrolled);
    };
    setScrolled(lastScrolled);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() =>
      closeButtonRef.current?.focus(),
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocus?.focus();
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? "border-midnight/8 bg-plasma/88 shadow-[0_8px_30px_rgba(7,26,43,0.06)] backdrop-blur-xl"
            : "border-midnight/8 bg-[#f4f8fc]/88 backdrop-blur-sm"
        }`}
      >
        <div className="container-editorial flex h-[5.5rem] items-center justify-between">
          <Link to="/" aria-label="Dr Tarfaya - Accueil">
            <Logo variant="dark" />
          </Link>

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Navigation principale"
          >
            {navigation.map((item) => (
              <Link
                key={item.hash}
                to="/"
                hash={item.hash}
                activeOptions={{ exact: true, includeHash: true }}
                className="text-[0.72rem] font-semibold uppercase tracking-[0.13em] text-midnight/65 transition-colors hover:text-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/rendez-vous"
              preload="intent"
              className="hidden items-center gap-2 rounded-md bg-midnight px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-plasma transition-colors hover:bg-blue sm:inline-flex"
            >
              Demander un RDV
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-midnight/15 text-midnight lg:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence initial={!reducedMotion}>
        {open && (
          <motion.div
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation principale"
            className="fixed inset-0 z-[70] overflow-y-auto bg-midnight text-plasma"
            initial={
              reducedMotion ? false : { clipPath: "circle(0% at 90% 5%)" }
            }
            animate={{ clipPath: "circle(150% at 90% 5%)" }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { clipPath: "circle(0% at 90% 5%)" }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div className="container-editorial flex h-[5.5rem] items-center justify-between">
              <Logo variant="light" />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container-editorial pb-12 pt-10">
              {navigation.map((item, index) => (
                <MotionLink
                  key={item.hash}
                  to="/"
                  hash={item.hash}
                  activeOptions={{ exact: true, includeHash: true }}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-white/10 py-5 font-display text-[clamp(2rem,10vw,4rem)] leading-none"
                  initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { delay: 0.08 + index * 0.05 }
                  }
                >
                  {item.label}
                  <span className="font-sans text-xs text-blue">
                    0{index + 1}
                  </span>
                </MotionLink>
              ))}
              <Link
                to="/rendez-vous"
                preload="intent"
                onClick={() => setOpen(false)}
                className="mt-8 inline-flex w-full items-center justify-between rounded-md bg-blue px-5 py-4 font-semibold text-white"
              >
                Demander un rendez-vous
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
