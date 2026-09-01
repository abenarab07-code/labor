import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowUpRight,
  FlaskConical,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "@tanstack/react-router";
import { easings } from "@/motion/motion-tokens";
import {
  useLowPowerMode,
  useReducedMotionMode,
  useSectionActive,
} from "@/motion/hooks";
import labAnalysis from "@/assets/brand/lab-analysis.webp";
import labAnalysisAvif from "@/assets/brand/lab-analysis.avif";
import labAnalysisMobileAvif from "@/assets/brand/lab-analysis-768.avif";
import bloodSmear from "@/assets/brand/blood-smear.webp";
import bloodSmearAvif from "@/assets/brand/blood-smear.avif";
import bloodSmearMobileAvif from "@/assets/brand/blood-smear-768.avif";
import doctorPoster from "@/assets/brand/dr-tarfaya-poster-clean.webp";
import doctorPosterAvif from "@/assets/brand/dr-tarfaya-poster-clean.avif";
import doctorPosterMobileAvif from "@/assets/brand/dr-tarfaya-poster-clean-768.avif";

const analyses = [
  {
    number: "01",
    label: "Biochimie — paramètres biologiques",
    title: "Analyses médicales",
    text: "Les prélèvements sont analysés sur un plateau technique adapté. Les résultats sont contrôlés puis validés médicalement avant leur communication.",
    points: ["Glycémie", "Bilan rénal", "Bilan hépatique", "Bilan lipidique"],
    image: labAnalysis,
    avif: labAnalysisAvif,
    mobileAvif: labAnalysisMobileAvif,
    icon: FlaskConical,
    position: "object-center",
  },
  {
    number: "02",
    label: "Expertise des maladies du sang",
    title: "Hématologie spécialisée",
    text: "La NFS, le frottis sanguin et, selon l'indication, le médullogramme apportent des données utiles à l'interprétation médicale.",
    points: ["NFS", "Frottis sanguin", "Médullogramme"],
    image: bloodSmear,
    avif: bloodSmearAvif,
    mobileAvif: bloodSmearMobileAvif,
    icon: Microscope,
    position: "object-center",
  },
  {
    number: "03",
    label: "Relier les informations",
    title: "Consultation en hématologie",
    text: "Votre histoire, vos symptômes et vos résultats sont repris ensemble pour orienter la prochaine étape.",
    points: [
      "Analyse du dossier",
      "Interprétation clinique",
      "Orientation du bilan",
    ],
    image: doctorPoster,
    avif: doctorPosterAvif,
    mobileAvif: doctorPosterMobileAvif,
    icon: Stethoscope,
    position: "object-[50%_25%]",
  },
] as const;

export function LaboratoryAnalysisStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotionMode();
  const lowPower = useLowPowerMode();
  const reduced = reducedMotion || lowPower;
  const [desktopStage, setDesktopStage] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktopStage(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-plasma md:h-[300vh]">
      {!desktopStage ? (
        <div className="container-editorial py-12 md:hidden">
          <div className="brand-label text-blue">
            Du prélèvement à la validation
          </div>
          <h2 className="mt-4 max-w-[12ch] font-display text-[2.65rem] leading-[0.92] tracking-[-0.04em] text-midnight min-[390px]:text-5xl">
            Chaque résultat suit un{" "}
            <em className="text-blue">processus rigoureux.</em>
          </h2>
          <div className="mt-6 space-y-3">
            {analyses.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.number}
                  className="relative min-h-[400px] overflow-hidden rounded-[1.45rem] bg-midnight text-white min-[390px]:min-h-[420px]"
                  initial={reduced ? false : { opacity: 0, y: 38 }}
                  animate={reduced ? { opacity: 1, y: 0 } : undefined}
                  whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                  viewport={
                    reduced ? undefined : { once: true, margin: "-10%" }
                  }
                  transition={
                    reduced
                      ? undefined
                      : {
                          duration: 0.8,
                          delay: index * 0.06,
                          ease: easings.easeOut,
                        }
                  }
                >
                  <picture className="absolute inset-0 block">
                    <source
                      srcSet={item.mobileAvif}
                      media="(max-width: 767px)"
                      type="image/avif"
                    />
                    <source srcSet={item.avif} type="image/avif" />
                    <motion.img
                      src={item.image}
                      alt=""
                      className={`h-full w-full object-cover ${item.position}`}
                      loading="lazy"
                      decoding="async"
                      initial={reduced ? false : { scale: 1.08 }}
                      animate={reduced ? { scale: 1 } : undefined}
                      whileInView={reduced ? undefined : { scale: 1 }}
                      viewport={reduced ? undefined : { once: true }}
                      transition={
                        reduced
                          ? undefined
                          : { duration: 1.4, ease: easings.easeOut }
                      }
                    />
                  </picture>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,17,29,0.08),rgba(3,17,29,0.28)_35%,rgba(3,17,29,0.96)_100%)]" />
                  <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/16 bg-midnight/45 backdrop-blur">
                    <Icon className="h-4 w-4 text-blue" />
                  </div>
                  <span className="absolute right-5 top-5 font-mono text-xs tracking-[0.16em] text-coral">
                    {item.number}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5 min-[390px]:p-6">
                    <div className="brand-label text-blue">{item.label}</div>
                    <h3 className="mt-3 font-display text-[2.15rem] leading-[0.94] text-white min-[390px]:text-4xl">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-white/68">
                      {item.text}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          key={point}
                          className="rounded-full border border-white/14 bg-white/7 px-3 py-2 text-[0.65rem] text-white/72 backdrop-blur"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      ) : null}

      {desktopStage ? (
        <DesktopAnalysisStage sectionRef={sectionRef} reduced={reduced} />
      ) : null}
    </section>
  );
}

function DesktopAnalysisStage({
  sectionRef,
  reduced,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  reduced: boolean;
}) {
  const activeSection = useSectionActive(sectionRef);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    mass: 0.35,
  });
  const stageScale = useTransform(
    smooth,
    [0, 0.08, 0.92, 1],
    [0.97, 1, 1, 0.96],
  );
  const stageOpacity = useTransform(
    smooth,
    [0, 0.05, 0.95, 1],
    [0.55, 1, 1, 0.55],
  );
  const rail1 = useTransform(smooth, [0, 0.32], [0, 1]);
  const rail2 = useTransform(smooth, [0.34, 0.65], [0, 1]);
  const rail3 = useTransform(smooth, [0.67, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const next = value < 0.335 ? 0 : value < 0.665 ? 1 : 2;
    setActive((current) => (current === next ? current : next));
  });

  const current = analyses[active];

  return (
    <div className="sticky top-0 hidden h-[100svh] overflow-hidden md:block">
      <motion.div
        className="absolute inset-0"
        style={
          reduced ? undefined : { scale: stageScale, opacity: stageOpacity }
        }
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={current.number}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: easings.easeInOut }}
          >
            <picture className="absolute inset-y-0 right-0 block h-full w-[56%]">
              <source srcSet={current.avif} type="image/avif" />
              <motion.img
                src={current.image}
                alt=""
                className={`h-full w-full object-cover ${current.position}`}
                loading="lazy"
                decoding="async"
                initial={
                  reduced
                    ? { opacity: 0 }
                    : { scale: 1.1, clipPath: "inset(0 0 0 16%)" }
                }
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { scale: 1, clipPath: "inset(0 0 0 0%)" }
                }
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { scale: 1.04, clipPath: "inset(0 12% 0 0)" }
                }
                transition={{ duration: 0.9, ease: easings.easeInOut }}
              />
            </picture>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f4ee_0%,#f7f4ee_42%,rgba(247,244,238,0.93)_53%,rgba(247,244,238,0.05)_82%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_48%,rgba(20,110,245,0.05),transparent_28%)]" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="absolute right-[8%] top-1/2 h-[42vw] w-[42vw] -translate-y-1/2 rounded-full border border-blue/18"
        animate={reduced || !activeSection ? { rotate: 0 } : { rotate: 360 }}
        transition={
          reduced || !activeSection
            ? { duration: 0 }
            : { duration: 70, repeat: Infinity, ease: "linear" }
        }
      >
        <span className="absolute inset-[13%] rounded-full border border-dashed border-white/22" />
        <span className="absolute left-[15%] top-[7%] h-2.5 w-2.5 rounded-full bg-coral shadow-[0_0_25px_7px_rgba(239,93,88,.38)]" />
      </motion.div>

      <div className="container-editorial relative grid h-full grid-cols-12 items-center">
        <div className="col-span-6 max-w-[620px] pr-10">
          <div className="brand-label text-blue">
            Analyses & expertise médicale
          </div>
          <AnimatePresence mode="sync">
            <motion.div
              key={current.number}
              initial={
                reduced
                  ? { opacity: 0, y: 12 }
                  : { opacity: 0, y: 54, filter: "blur(10px)" }
              }
              animate={
                reduced
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                reduced
                  ? { opacity: 0, y: -12 }
                  : { opacity: 0, y: -42, filter: "blur(8px)" }
              }
              transition={{ duration: 0.68, ease: easings.easeInOut }}
            >
              <div className="mt-6 flex items-center gap-4">
                <span className="font-mono text-xs tracking-[0.2em] text-coral">
                  {current.number}
                </span>
                <span className="h-px w-14 bg-midnight/15" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate">
                  {current.label}
                </span>
              </div>
              <h2 className="mt-6 max-w-[9ch] font-display text-[clamp(4rem,6.4vw,7.4rem)] leading-[0.84] tracking-[-0.055em] text-midnight">
                {current.title}
              </h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-slate">
                {current.text}
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {current.points.map((point, index) => (
                  <motion.span
                    key={point}
                    className="rounded-full border border-midnight/12 bg-white/55 px-4 py-2 text-xs text-midnight/70 backdrop-blur"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.06 }}
                  >
                    {point}
                  </motion.span>
                ))}
              </div>
              <Link
                to="/rendez-vous"
                preload="intent"
                className="mt-8 inline-flex items-center gap-3 border-b border-blue pb-2 text-sm font-semibold text-midnight transition-colors hover:text-blue"
              >
                Organiser cette étape <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center gap-5">
            {[rail1, rail2, rail3].map((rail, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="relative h-[2px] w-20 overflow-hidden bg-midnight/10">
                  <motion.div
                    className="absolute inset-0 origin-left bg-blue"
                    style={{ scaleX: rail }}
                  />
                </div>
                <span
                  className={`font-mono text-[0.6rem] tracking-[0.12em] transition-colors ${index === active ? "text-coral" : "text-midnight/25"}`}
                >
                  0{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-10 font-mono text-[0.55rem] tracking-[0.2em] text-white/48">
        SCROLL TO READ / 03
      </div>
    </div>
  );
}
