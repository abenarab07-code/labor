import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ArrowDown, ArrowUpRight, FlaskConical, MapPin, Microscope } from "lucide-react";
import { useRef } from "react";
import { MagneticButton } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";
import { useLowPowerMode, useReducedMotionMode, useSectionActive } from "@/motion/hooks";
import { clinic } from "@/content/clinic";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import heroDiagnostic from "@/assets/brand/hero-diagnostic.webp";

const orbitDots = [
  { x: "-5%", y: "20%", size: 8, color: "#EF5D58", duration: 8 },
  { x: "101%", y: "28%", size: 6, color: "#4CA2FF", duration: 10 },
  { x: "96%", y: "82%", size: 10, color: "#EF5D58", duration: 11 },
  { x: "-4%", y: "73%", size: 5, color: "#F7F4EE", duration: 9 },
] as const;

export function LaboratoryHero() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotionMode();
  const lowPower = useLowPowerMode();
  const reduced = reducedMotion || lowPower;
  const active = useSectionActive(ref);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const spring = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const copyY = useTransform(spring, [0, 1], [0, -38]);
  const copyOpacity = useTransform(spring, [0, 0.7, 1], [1, 0.62, 0.08]);
  const mediaY = useTransform(spring, [0, 1], [0, 82]);
  const mediaScale = useTransform(spring, [0, 1], [1, 0.88]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-1, 1], [7, -7]), { stiffness: 130, damping: 20 });
  const rotateY = useSpring(useTransform(px, [-1, 1], [-9, 9]), { stiffness: 130, damping: 20 });
  const glowX = useSpring(useTransform(px, [-1, 1], [-48, 48]), { stiffness: 100, damping: 22 });
  const glowY = useSpring(useTransform(py, [-1, 1], [-42, 42]), { stiffness: 100, damping: 22 });
  const sheen = useMotionTemplate`radial-gradient(55% 45% at calc(50% + ${glowX}px) calc(40% + ${glowY}px), rgba(115,190,255,0.34), rgba(20,110,245,0.08) 50%, transparent 78%)`;

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    py.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onPointerLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden bg-midnight-deep pb-20 pt-28 text-plasma md:pb-28 md:pt-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(90%_90%_at_76%_38%,rgba(20,110,245,0.2)_0%,rgba(7,26,43,0.1)_48%,transparent_72%),linear-gradient(145deg,#03111d_0%,#071a2b_56%,#08263d_100%)]" />
      <div className="absolute inset-0 field-grid opacity-25" />
      <motion.div
        aria-hidden="true"
        className="absolute -left-[20%] top-[10%] h-[70vw] w-[70vw] rounded-full bg-blue/8 blur-[120px]"
        animate={
          reduced || !active ? undefined : { scale: [0.9, 1.1, 0.9], opacity: [0.35, 0.6, 0.35] }
        }
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-editorial relative grid min-h-[calc(100svh-12rem)] items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <motion.div
          className="relative z-10 lg:col-span-6 xl:col-span-6"
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <motion.div
            className="mb-6 flex items-center gap-3"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: easings.easeOut }}
          >
            <span className="h-px w-9 bg-coral" />
            <span className="brand-label text-blue">El Bouni · Annaba</span>
            <span className="hidden text-[0.62rem] text-white/38 sm:inline">
              Médecine de précision
            </span>
          </motion.div>

          <h1 className="max-w-[11ch] font-display text-[clamp(3.35rem,7vw,7.3rem)] leading-[0.86] tracking-[-0.055em] text-white">
            <span className="block">Votre sang</span>
            <span className="block italic text-blue">raconte.</span>
            <span className="mt-2 block text-[0.5em] leading-[0.98] tracking-[-0.035em]">
              Nous savons le lire.
            </span>
          </h1>

          <motion.p
            className="mt-7 max-w-xl text-base leading-7 text-plasma/72 md:text-lg"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.55, ease: easings.easeOut }}
          >
            Analyses médicales et expertise en hématologie pour transformer un résultat en une
            prochaine étape claire.
            <span dir="rtl" className="mt-2 block font-medium text-white/86">
              تحاليل طبية وطب أمراض الدم
            </span>
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.68, ease: easings.easeOut }}
          >
            <MagneticButton
              as="a"
              href="/rendez-vous"
              className="group inline-flex items-center gap-3 rounded-full bg-blue px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_-12px_rgba(20,110,245,0.75)] transition-colors hover:bg-white hover:text-midnight"
            >
              Demander un rendez-vous
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </MagneticButton>
            <a
              href={buildWhatsAppUrl("prelevement")}
              className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/5 px-6 py-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
            >
              Préparer mon analyse
            </a>
          </motion.div>

          <motion.div
            className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/10"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.82 }}
          >
            {[
              [FlaskConical, "Analyses"],
              [Microscope, "Hématologie"],
              [MapPin, "El Bouni"],
            ].map(([Icon, label], index) => {
              const IconComponent = Icon as typeof FlaskConical;
              return (
                <div
                  key={label as string}
                  className={`flex items-center gap-2 py-4 ${index ? "border-l border-white/10 pl-3 sm:pl-5" : ""}`}
                >
                  <IconComponent className="h-3.5 w-3.5 shrink-0 text-coral" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-white/58 sm:text-[0.65rem]">
                    {label as string}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-[540px] lg:col-span-6"
          style={reduced ? undefined : { y: mediaY, scale: mediaScale, perspective: 1400 }}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          {!reduced && active && (
            <motion.svg
              aria-hidden="true"
              viewBox="0 0 500 500"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[132%] -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.35, delay: 0.3, ease: easings.easeOut }}
            >
              <motion.g
                style={{ transformOrigin: "250px 250px" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
              >
                <circle
                  cx="250"
                  cy="250"
                  r="238"
                  fill="none"
                  stroke="rgba(20,110,245,.45)"
                  strokeWidth="1"
                  strokeDasharray="2 8"
                />
                <circle cx="250" cy="12" r="4" fill="#EF5D58" />
              </motion.g>
              <motion.g
                style={{ transformOrigin: "250px 250px" }}
                animate={{ rotate: -360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              >
                <circle
                  cx="250"
                  cy="250"
                  r="204"
                  fill="none"
                  stroke="rgba(247,244,238,.16)"
                  strokeWidth="1"
                  strokeDasharray="3 12"
                />
                <circle cx="46" cy="250" r="3" fill="#4CA2FF" />
              </motion.g>
              <circle
                cx="250"
                cy="250"
                r="172"
                fill="none"
                stroke="rgba(239,93,88,.18)"
                strokeWidth="1"
              />
            </motion.svg>
          )}

          <motion.div
            className="relative"
            initial={false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.08, ease: easings.easeOut }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              animate={reduced || !active ? undefined : { y: [0, -9, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              style={{
                rotateX: reduced ? undefined : rotateX,
                rotateY: reduced ? undefined : rotateY,
                transformStyle: "preserve-3d",
              }}
            >
              <motion.div
                className="relative aspect-[4/5] overflow-hidden rounded-[1.8rem] border border-white/12 bg-midnight shadow-[0_55px_100px_-36px_rgba(0,0,0,0.8)]"
                initial={false}
                animate={{ clipPath: "inset(0)" }}
                transition={{ duration: 0.9, delay: 0.12, ease: easings.easeInOut }}
              >
                <motion.img
                  src={heroDiagnostic}
                  alt="Cellule sanguine observée dans un champ diagnostique"
                  className="h-full w-full object-cover"
                  width={1672}
                  height={941}
                  fetchPriority="high"
                  decoding="async"
                  initial={false}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.35, delay: 0.1, ease: easings.easeOut }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,0.03),rgba(3,17,29,0.12)_45%,rgba(3,17,29,0.78)_100%)]" />
                {!reduced && active && (
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 mix-blend-screen"
                    style={{ background: sheen }}
                  />
                )}
                {!reduced && active && (
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-x-0 h-px bg-[linear-gradient(90deg,transparent,#4ca2ff,transparent)] shadow-[0_0_18px_5px_rgba(20,110,245,0.45)]"
                    animate={{ top: ["-2%", "102%"], opacity: [0, 0.95, 0] }}
                    transition={{
                      duration: 4.6,
                      delay: 1.5,
                      repeat: Infinity,
                      repeatDelay: 3.5,
                      ease: "easeInOut",
                    }}
                  />
                )}
                <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/12 bg-midnight/60 px-3 py-2 font-mono text-[0.55rem] tracking-[0.16em] text-white/70 backdrop-blur">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-coral"
                    animate={reduced ? undefined : { opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  LIVE CELL FIELD
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                  <div>
                    <div className="brand-label text-blue">Précision cellulaire</div>
                    <div className="mt-2 font-display text-3xl">Voir. Comprendre. Orienter.</div>
                  </div>
                  <span className="hidden font-mono text-[0.55rem] tracking-[0.14em] text-white/40 sm:block">
                    40.912° N<br />
                    7.777° E
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {!reduced && active && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              {orbitDots.map((dot, index) => (
                <motion.span
                  key={dot.x}
                  className="absolute rounded-full"
                  style={{
                    left: dot.x,
                    top: dot.y,
                    width: dot.size,
                    height: dot.size,
                    background: dot.color,
                    boxShadow: `0 0 18px ${dot.color}`,
                  }}
                  animate={{
                    y: [0, -16, 0],
                    x: [0, index % 2 ? 7 : -7, 0],
                    opacity: [0.4, 1, 0.45],
                    scale: [0.75, 1.15, 0.75],
                  }}
                  transition={{
                    duration: dot.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.18,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.a
        href="#analyses"
        aria-label="Découvrir les analyses"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-white/45 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Explorer
        <motion.span
          animate={reduced ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <ArrowDown className="h-4 w-4 text-coral" />
        </motion.span>
      </motion.a>
    </section>
  );
}
