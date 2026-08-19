import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const navigation = [
  { href: "/#analyses", label: "Analyses" },
  { href: "/#hematologie", label: "Hématologie" },
  { href: "/#parcours", label: "Votre visite" },
  { href: "/#docteur", label: "Dr Tarfaya" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 34);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? "border-midnight/8 bg-plasma/88 shadow-[0_8px_30px_rgba(7,26,43,0.06)] backdrop-blur-xl"
            : "border-white/10 bg-midnight/32 backdrop-blur-sm"
        }`}
      >
        <div className="container-editorial flex h-[4.65rem] items-center justify-between">
          <Link to="/" aria-label="Dr Tarfaya - Accueil">
            <Logo variant={scrolled ? "dark" : "light"} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-[0.72rem] font-semibold uppercase tracking-[0.13em] transition-colors ${
                  scrolled ? "text-midnight/65 hover:text-blue" : "text-plasma/70 hover:text-white"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/rendez-vous"
              className={`hidden items-center gap-2 rounded-md px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] transition-colors sm:inline-flex ${
                scrolled
                  ? "bg-midnight text-plasma hover:bg-blue"
                  : "bg-plasma text-midnight hover:bg-white"
              }`}
            >
              Demander un RDV
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`grid h-11 w-11 place-items-center rounded-full border lg:hidden ${
                scrolled ? "border-midnight/15 text-midnight" : "border-white/20 text-white"
              }`}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] overflow-y-auto bg-midnight text-plasma"
            initial={{ clipPath: "circle(0% at 90% 5%)" }}
            animate={{ clipPath: "circle(150% at 90% 5%)" }}
            exit={{ clipPath: "circle(0% at 90% 5%)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="container-editorial flex h-[4.65rem] items-center justify-between">
              <Logo variant="light" />
              <button
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
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-white/10 py-5 font-display text-[clamp(2rem,10vw,4rem)] leading-none"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + index * 0.05 }}
                >
                  {item.label}
                  <span className="font-sans text-xs text-blue">0{index + 1}</span>
                </motion.a>
              ))}
              <Link
                to="/rendez-vous"
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
