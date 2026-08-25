import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  FlaskConical,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { useRef } from "react";
import { MagneticButton } from "@/motion/primitives";
import {
  useLowPowerMode,
  useReducedMotionMode,
  useSectionActive,
} from "@/motion/hooks";
import { clinic } from "@/content/clinic";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import heroDiagnostic from "@/assets/brand/hero-diagnostic.webp";
import heroDiagnostic640 from "@/assets/brand/hero-diagnostic-640.avif";
import heroDiagnostic1080 from "@/assets/brand/hero-diagnostic-1080.avif";

export function LaboratoryHero() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotionMode();
  const lowPower = useLowPowerMode();
  const reduced = reducedMotion || lowPower;
  const active = useSectionActive(ref);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const spring = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.4,
  });
  const copyY = useTransform(spring, [0, 1], [0, -38]);
  const copyOpacity = useTransform(spring, [0, 0.7, 1], [1, 0.62, 0.08]);
  const mediaY = useTransform(spring, [0, 1], [0, 82]);
  const mediaScale = useTransform(spring, [0, 1], [1, 0.88]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const pointerRect = useRef<DOMRect | null>(null);
  const finePointer = useRef(false);
  const rotateX = useSpring(useTransform(py, [-1, 1], [7, -7]), {
    stiffness: 130,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(px, [-1, 1], [-9, 9]), {
    stiffness: 130,
    damping: 20,
  });
  const glowX = useSpring(useTransform(px, [-1, 1], [-48, 48]), {
    stiffness: 100,
    damping: 22,
  });
  const glowY = useSpring(useTransform(py, [-1, 1], [-42, 42]), {
    stiffness: 100,
    damping: 22,
  });

  function onPointerEnter(event: React.PointerEvent<HTMLDivElement>) {
    finePointer.current = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (reduced || !finePointer.current) return;
    pointerRect.current = event.currentTarget.getBoundingClientRect();
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !finePointer.current) return;
    const rect =
      pointerRect.current ?? event.currentTarget.getBoundingClientRect();
    pointerRect.current = rect;
    px.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    py.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onPointerLeave() {
    pointerRect.current = null;
    finePointer.current = false;
    px.set(0);
    py.set(0);
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#f4f8fc] pb-8 pt-24 text-midnight md:min-h-[100svh] md:pb-28 md:pt-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(75%_78%_at_82%_34%,rgba(20,110,245,0.13)_0%,rgba(230,242,255,0.38)_42%,transparent_74%),linear-gradient(145deg,#fbfdff_0%,#f4f8fc_58%,#eaf3fb_100%)]" />
      <div className="absolute inset-0 field-grid opacity-[0.09]" />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-[18%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(20,110,245,0.08),transparent_70%)] blur-2xl"
      />

      <div className="container-editorial relative grid items-center gap-7 md:min-h-[calc(100svh-12rem)] md:gap-16 lg:grid-cols-12 lg:gap-12">
        <motion.div
          className="relative z-10 lg:col-span-6 xl:col-span-6"
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <div className="mb-5 flex items-center gap-3 md:mb-6">
            <span className="h-px w-7 bg-coral md:w-9" />
            <span className="brand-label text-blue">Annaba · El Bouni</span>
            <span className="hidden text-[0.62rem] text-slate/70 sm:inline">
              Biologie médicale de précision
            </span>
          </div>

          <h1 className="max-w-[11ch] font-display text-[clamp(2.8rem,13.5vw,3.35rem)] leading-[0.9] tracking-[-0.05em] text-midnight sm:text-[clamp(3.35rem,7vw,7.3rem)] sm:leading-[0.88] sm:tracking-[-0.055em]">
            <span className="block">Des analyses</span>
            <span className="block italic text-blue">précises.</span>
            <span className="mt-2 block text-[0.48em] leading-[1.02] tracking-[-0.035em]">
              Une interprétation claire et précise.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-[0.94rem] leading-6 text-slate sm:mt-7 sm:text-base sm:leading-7 md:text-lg">
            Analyses médicales, biochimie, hématologie, hormonologie et
            immunologie, avec cytologie médullaire et ganglionnaire.
            <span
              dir="rtl"
              className="mt-2 block text-sm font-medium leading-6 text-midnight/80 sm:mt-3 sm:text-base"
            >
              تحاليل طبية، كيمياء حيوية، أمراض الدم، الهرمونات والمناعة، مع علم
              الخلايا النخاعية والعقدية
            </span>
          </p>

          <div className="mt-5 grid gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
            <MagneticButton
              as="a"
              href="/rendez-vous"
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-blue px-5 py-4 text-sm font-semibold text-white shadow-[0_16px_45px_-12px_rgba(20,110,245,0.75)] transition-colors hover:bg-white hover:text-midnight sm:w-auto sm:px-6"
            >
              Demander un rendez-vous
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </MagneticButton>
            <a
              href={buildWhatsAppUrl("prelevement")}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-midnight/14 bg-white/72 px-5 py-4 text-sm font-semibold text-midnight transition-colors hover:border-blue hover:text-blue sm:w-auto sm:px-6"
            >
              Préparer mon analyse
            </a>
          </div>

          <div className="mt-6 grid max-w-xl grid-cols-3 border-y border-midnight/10 sm:mt-10">
            {[
              [FlaskConical, "Analyses"],
              [Microscope, "Biochimie"],
              [Stethoscope, "Hématologie"],
            ].map(([Icon, label], index) => {
              const IconComponent = Icon as typeof FlaskConical;
              return (
                <div
                  key={label as string}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1.5 py-3 text-center sm:flex-row sm:justify-start sm:gap-2 sm:py-4 ${index ? "border-l border-midnight/10 sm:pl-5" : ""}`}
                >
                  <IconComponent className="h-3.5 w-3.5 shrink-0 text-coral" />
                  <span className="text-[0.5rem] font-semibold uppercase tracking-[0.07em] text-midnight/58 min-[390px]:text-[0.54rem] sm:text-[0.65rem] sm:tracking-[0.1em]">
                    {label as string}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-[540px] lg:col-span-6"
          style={
            reduced
              ? undefined
              : { y: mediaY, scale: mediaScale, perspective: 1400 }
          }
          onPointerEnter={onPointerEnter}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-2 rounded-[1.65rem] border border-blue/12 bg-white/30 shadow-[0_30px_80px_-55px_rgba(20,110,245,0.6)] sm:-inset-5 sm:rounded-[2.25rem]"
          />

          <div className="relative" style={{ transformStyle: "preserve-3d" }}>
            <motion.div
              animate={reduced || !active ? { y: 0 } : { y: [0, -9, 0] }}
              transition={
                reduced || !active
                  ? { duration: 0 }
                  : { duration: 9, repeat: Infinity, ease: "easeInOut" }
              }
              style={{
                rotateX: reduced ? undefined : rotateX,
                rotateY: reduced ? undefined : rotateY,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-[1.45rem] border border-blue/16 bg-midnight shadow-[0_38px_75px_-42px_rgba(7,26,43,0.48)] sm:aspect-[4/5] sm:rounded-[1.8rem] sm:shadow-[0_48px_90px_-42px_rgba(7,26,43,0.48)]">
                <picture className="block h-full w-full">
                  <source
                    type="image/avif"
                    srcSet={`${heroDiagnostic640} 640w, ${heroDiagnostic1080} 1080w`}
                    sizes="(min-width: 1024px) 540px, calc(100vw - 40px)"
                  />
                  <img
                    src={heroDiagnostic}
                    alt="Cellule sanguine observée dans un champ diagnostique"
                    className="h-full w-full object-cover object-[58%_50%] sm:object-center"
                    width={1672}
                    height={941}
                    fetchPriority="high"
                    decoding="async"
                  />
                </picture>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,0.03),rgba(3,17,29,0.12)_45%,rgba(3,17,29,0.78)_100%)]" />
                {!reduced && active && (
                  <motion.div
                    aria-hidden="true"
                    className="absolute inset-0 mix-blend-screen"
                    style={{
                      x: glowX,
                      y: glowY,
                      scale: 1.2,
                      background:
                        "radial-gradient(55% 45% at 50% 40%, rgba(115,190,255,0.34), rgba(20,110,245,0.08) 50%, transparent 78%)",
                    }}
                  />
                )}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/12 bg-midnight/60 px-2.5 py-2 font-mono text-[0.46rem] tracking-[0.12em] text-white/70 backdrop-blur sm:left-5 sm:top-5 sm:px-3 sm:text-[0.55rem] sm:tracking-[0.16em]">
                  {!reduced && active ? (
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-coral"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                  )}
                  OBSERVATION MICROSCOPIQUE
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white sm:bottom-6 sm:left-6 sm:right-6">
                  <div>
                    <div className="brand-label text-blue">
                      Lecture cytologique de précision
                    </div>
                    <div className="mt-1.5 font-display text-2xl sm:mt-2 sm:text-3xl">
                      Observer. Interpréter. Poser le diagnostic.
                    </div>
                  </div>
                  <span className="hidden font-mono text-[0.55rem] tracking-[0.14em] text-white/40 sm:block">
                    40.912° N<br />
                    7.777° E
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#analyses"
        aria-label="Découvrir les analyses"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-midnight/45 lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Explorer
        {!reduced && active ? (
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <ArrowDown className="h-4 w-4 text-coral" />
          </motion.span>
        ) : (
          <span>
            <ArrowDown className="h-4 w-4 text-coral" />
          </span>
        )}
      </motion.a>
    </section>
  );
}
