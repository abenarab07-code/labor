import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  FileText,
  FlaskConical,
  MapPin,
  MessageCircle,
  Microscope,
  Phone,
  Play,
  Stethoscope,
} from "lucide-react";
import { clinic } from "@/content/clinic";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useLowPowerMode, useSectionActive } from "@/motion/hooks";
import heroDiagnostic from "@/assets/brand/hero-diagnostic.webp";
import labAnalysis from "@/assets/brand/lab-analysis.webp";
import labAnalysisAvif from "@/assets/brand/lab-analysis.avif";
import bloodSmear from "@/assets/brand/blood-smear.webp";
import bloodSmearAvif from "@/assets/brand/blood-smear.avif";
import doctorPoster from "@/assets/brand/dr-tarfaya-poster-clean.webp";
import doctorPosterAvif from "@/assets/brand/dr-tarfaya-poster-clean.avif";

const specialties = [
  {
    id: "analyses",
    number: "01",
    kicker: "Le quotidien, bien fait",
    title: "Analyses médicales",
    description:
      "Prélèvements et examens prescrits, organisés avec des consignes claires avant votre venue.",
    points: [
      "Analyses sanguines",
      "Bactériologie",
      "Sérologie",
      "Dosages hormonaux",
    ],
    icon: FlaskConical,
    image: labAnalysis,
    avif: labAnalysisAvif,
  },
  {
    id: "hematologie",
    number: "02",
    kicker: "L'expertise qui va plus loin",
    title: "Hématologie spécialisée",
    description:
      "Une lecture médicale spécialisée lorsque les cellules du sang, la moelle ou un résultat nécessitent une exploration ciblée.",
    points: ["Frottis sanguin", "Cytologie médullaire", "Lecture spécialisée"],
    icon: Microscope,
    image: bloodSmear,
    avif: bloodSmearAvif,
  },
  {
    id: "consultation",
    number: "03",
    kicker: "Relier les informations",
    title: "Consultation en hématologie",
    description:
      "Un temps médical pour reprendre votre histoire, vos résultats et déterminer la prochaine étape adaptée.",
    points: [
      "Analyse du dossier",
      "Interprétation clinique",
      "Orientation du bilan",
    ],
    icon: Stethoscope,
    image: doctorPoster,
    avif: doctorPosterAvif,
  },
] as const;

const journey = [
  {
    number: "01",
    title: "Vous nous contactez",
    copy: "Envoyez le nom de l'analyse ou votre demande de consultation par WhatsApp ou téléphone.",
  },
  {
    number: "02",
    title: "On confirme la préparation",
    copy: "Jeûne, horaire ou document utile: les consignes dépendent de l'examen demandé.",
  },
  {
    number: "03",
    title: "Le prélèvement ou la consultation",
    copy: "Présentez votre ordonnance et vos résultats antérieurs s'ils sont utiles à votre dossier.",
  },
  {
    number: "04",
    title: "La suite devient claire",
    copy: "L'équipe vous précise la récupération du résultat ou le suivi médical à prévoir.",
  },
];

const frequentlyAsked = [
  {
    q: "Faut-il être à jeun pour toutes les analyses ?",
    a: "Non. La préparation dépend de l'examen demandé. Envoyez le nom de l'analyse ou une photo lisible de l'ordonnance sur WhatsApp avant de vous déplacer.",
  },
  {
    q: "Puis-je demander une consultation en hématologie ?",
    a: "Oui, selon disponibilité. Indiquez brièvement votre demande et les examens déjà réalisés afin que l'équipe puisse vous orienter vers le bon rendez-vous.",
  },
  {
    q: "Proposez-vous le frottis sanguin et la cytologie médullaire ?",
    a: "Ces examens font partie des expertises mises en avant par le laboratoire. Leur indication et leur organisation sont confirmées au cas par cas par l'équipe médicale.",
  },
  {
    q: "Le formulaire du site convient-il à une urgence ?",
    a: "Non. En cas de signes graves ou d'urgence vitale, contactez immédiatement les services d'urgence. Le formulaire sert uniquement aux demandes non urgentes.",
  },
];

const bloodCells = [
  { left: "52%", top: "15%", size: 16, delay: 0.1, duration: 11 },
  { left: "68%", top: "22%", size: 9, delay: 1.3, duration: 9 },
  { left: "83%", top: "37%", size: 21, delay: 0.7, duration: 13 },
  { left: "58%", top: "54%", size: 7, delay: 2.1, duration: 8 },
  { left: "76%", top: "66%", size: 13, delay: 1.7, duration: 12 },
  { left: "91%", top: "76%", size: 8, delay: 2.8, duration: 10 },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      transition={{ duration: 0.9, delay, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

export function LaboratoryHome() {
  const legacyOpeningEnabled = false;
  const prefersReducedMotion = useReducedMotion();
  const lowPower = useLowPowerMode();
  const reducedMotion = Boolean(prefersReducedMotion || lowPower);
  const [activeSpecialty, setActiveSpecialty] = useState(0);
  const specialty = specialties[activeSpecialty];
  const hematologyRef = useRef<HTMLElement>(null);
  const doctorRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const hematologyActive = useSectionActive(hematologyRef);
  const doctorActive = useSectionActive(doctorRef);
  const contactActive = useSectionActive(contactRef);
  const heroRef = { current: null as HTMLElement | null };
  const progress = 1;
  const heroImageY = "0%";
  const heroImageScale = 1;
  const heroContentY = 0;
  const heroContentOpacity = 1;

  return (
    <>
      {legacyOpeningEnabled && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-x-0 top-0 z-[80] h-[3px] origin-left bg-[linear-gradient(90deg,#146ef5_0%,#41a0ff_68%,#ef5d58_100%)]"
          style={{ scaleX: progress }}
        />
      )}

      {legacyOpeningEnabled && (
        <>
          <section
            ref={heroRef}
            className="relative min-h-[100svh] overflow-hidden bg-midnight pt-28 text-plasma md:pt-32"
          >
            <motion.img
              src={heroDiagnostic}
              alt="Visualisation scientifique d'une cellule sanguine dans un champ diagnostique"
              className="absolute -inset-y-[12%] inset-x-0 h-[124%] w-full object-cover object-[62%_center] opacity-75 will-change-transform"
              style={
                reducedMotion
                  ? undefined
                  : { y: heroImageY, scale: heroImageScale }
              }
              width={1672}
              height={941}
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,17,29,0.98)_0%,rgba(7,26,43,0.92)_39%,rgba(7,26,43,0.18)_72%,rgba(7,26,43,0.1)_100%)]" />
            <div className="absolute inset-0 field-grid opacity-20" />

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-[4%] hidden w-[48%] overflow-hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              <motion.div
                className="absolute inset-x-0 h-px bg-[linear-gradient(90deg,transparent,rgba(88,177,255,0.9),transparent)] shadow-[0_0_35px_8px_rgba(20,110,245,0.22)]"
                animate={
                  reducedMotion ? undefined : { top: ["12%", "88%", "12%"] }
                }
                transition={{
                  duration: 7.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="absolute right-4 top-[18%] font-mono text-[0.55rem] tracking-[0.2em] text-blue/70">
                CELLULAR FIELD / 04
              </div>
              <div className="absolute bottom-[17%] left-6 flex items-center gap-2 font-mono text-[0.55rem] tracking-[0.18em] text-white/35">
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-coral"
                  animate={
                    reducedMotion
                      ? undefined
                      : { opacity: [0.35, 1, 0.35], scale: [0.8, 1.25, 0.8] }
                  }
                  transition={{ duration: 1.7, repeat: Infinity }}
                />
                LIVE DIAGNOSTIC
              </div>
            </motion.div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {bloodCells.map((cell, index) => (
                <motion.span
                  key={`${cell.left}-${cell.top}`}
                  className="absolute rounded-full border border-coral/35 bg-coral/10 shadow-[inset_0_0_8px_rgba(239,93,88,0.18),0_0_18px_rgba(239,93,88,0.12)]"
                  style={{
                    left: cell.left,
                    top: cell.top,
                    width: cell.size,
                    height: cell.size,
                  }}
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={
                    reducedMotion
                      ? { opacity: 0.5, scale: 1 }
                      : {
                          opacity: [0.12, 0.72, 0.2],
                          scale: [0.75, 1.16, 0.82],
                          x: [0, index % 2 ? 22 : -18, 0],
                          y: [0, index % 2 ? -34 : 28, 0],
                        }
                  }
                  transition={{
                    duration: cell.duration,
                    delay: cell.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <motion.div
              aria-hidden="true"
              className="absolute -right-[23rem] top-[9%] h-[48rem] w-[48rem] rounded-full border border-blue/35 md:-right-[8rem] md:h-[56rem] md:w-[56rem]"
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute left-[8%] top-[28%] h-3 w-3 rounded-full bg-coral shadow-[0_0_32px_8px_rgba(239,93,88,0.45)]" />
              <motion.span
                className="absolute inset-[12%] rounded-full border border-dashed border-white/12"
                animate={reducedMotion ? undefined : { rotate: -360 }}
                transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
              />
              <span className="absolute inset-[27%] rounded-full border border-blue/20" />
            </motion.div>

            <motion.div
              className="container-editorial relative z-10 flex min-h-[calc(100svh-7rem)] flex-col justify-between pb-8"
              style={
                reducedMotion
                  ? undefined
                  : { y: heroContentY, opacity: heroContentOpacity }
              }
            >
              <div className="max-w-4xl pt-[7vh] md:pt-[9vh]">
                <motion.div
                  className="flex flex-wrap items-center gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.1 }}
                >
                  <span className="brand-label text-blue">
                    El Bouni · Annaba
                  </span>
                  <span className="h-px w-10 bg-white/20" />
                  <span className="text-xs text-plasma/58">
                    Laboratoire & consultation spécialisée
                  </span>
                </motion.div>

                <h1 className="mt-7 max-w-[13ch] font-display text-[clamp(3.35rem,9vw,8.4rem)] leading-[0.86] tracking-[-0.055em] text-white">
                  <motion.span
                    className="block"
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.75,
                      delay: 0.16,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    Votre sang
                  </motion.span>
                  <motion.span
                    className="block font-display italic text-blue"
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.75,
                      delay: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    raconte.
                  </motion.span>
                  <motion.span
                    className="block text-[0.54em] leading-[1.02] tracking-[-0.035em]"
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.75,
                      delay: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    Nous savons le lire.
                  </motion.span>
                </h1>

                <motion.div
                  className="mt-8 flex max-w-2xl flex-col gap-6 md:flex-row md:items-end md:justify-between"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <p className="max-w-xl text-base leading-7 text-plasma/74 md:text-lg">
                    Analyses médicales, prélèvements et expertise en hématologie
                    — pour passer d'un résultat à une prochaine étape claire.
                    <span
                      dir="rtl"
                      className="mt-2 block font-medium text-white/88"
                    >
                      تحاليل طبية وطب أمراض الدم
                    </span>
                  </p>
                  <a
                    href="#analyses"
                    className="group relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-white/22 text-white transition-colors hover:border-blue hover:bg-blue"
                    aria-label="Découvrir les services"
                  >
                    <motion.span
                      animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowDown className="h-5 w-5 transition-transform group-hover:translate-y-1" />
                    </motion.span>
                  </a>
                </motion.div>

                <motion.div
                  className="mt-8 flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.62 }}
                >
                  <Link
                    to="/rendez-vous"
                    className="group inline-flex items-center gap-3 rounded-md bg-blue px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(20,110,245,0.26)] transition-transform hover:-translate-y-0.5"
                  >
                    Demander un rendez-vous
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                  <a
                    href={buildWhatsAppUrl("prelevement")}
                    className="inline-flex items-center gap-3 rounded-md border border-white/18 bg-white/6 px-5 py-4 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
                  >
                    <MessageCircle className="h-4 w-4 text-blue" />
                    Préparer mon analyse
                  </a>
                </motion.div>
              </div>

              <div className="mt-14 grid border-y border-white/12 md:grid-cols-3">
                {[
                  ["01", "Analyses médicales"],
                  ["02", "Hématologie spécialisée"],
                  ["03", "Consultation médicale"],
                ].map(([number, label], index) => (
                  <motion.div
                    key={number}
                    className={`flex items-center gap-4 py-4 ${index > 0 ? "md:border-l md:border-white/12 md:pl-6" : ""}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.72 + index * 0.09,
                      duration: 0.55,
                      ease: easeOut,
                    }}
                  >
                    <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-coral">
                      {number}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.11em] text-plasma/72">
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          <section
            id="analyses"
            className="scroll-mt-24 bg-plasma py-24 md:py-36"
          >
            <div className="container-editorial">
              <div className="grid items-end gap-10 lg:grid-cols-12">
                <Reveal className="lg:col-span-7">
                  <div className="brand-label text-blue">
                    Le bon niveau de lecture
                  </div>
                  <h2 className="mt-5 max-w-[13ch] font-display text-[clamp(3rem,7vw,6.8rem)] leading-[0.9] tracking-[-0.045em] text-midnight">
                    Une analyse ne se résume pas à{" "}
                    <em className="text-blue">un chiffre.</em>
                  </h2>
                </Reveal>
                <Reveal className="lg:col-span-4 lg:col-start-9" delay={0.12}>
                  <p className="text-base leading-7 text-slate md:text-lg">
                    Le laboratoire accompagne le prélèvement, l'examen et —
                    lorsqu'il le faut — une interprétation spécialisée en
                    hématologie.
                  </p>
                </Reveal>
              </div>

              <motion.div
                className="mt-16 border-y border-midnight/12 lg:grid lg:grid-cols-12"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={{ duration: 0.9, ease: easeOut }}
              >
                <div className="lg:col-span-4 lg:border-r lg:border-midnight/12">
                  {specialties.map((item, index) => {
                    const Icon = item.icon;
                    const selected = activeSpecialty === index;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSpecialty(index)}
                        className={`group relative flex w-full items-center gap-5 overflow-hidden border-b border-midnight/12 px-1 py-6 text-left transition-colors last:border-b-0 lg:px-6 ${selected ? "bg-white/60" : "hover:bg-white/35"}`}
                        aria-pressed={selected}
                      >
                        {selected && (
                          <motion.span
                            layoutId="specialty-active"
                            className="absolute inset-y-0 left-0 w-[3px] bg-coral"
                            transition={{
                              type: "spring",
                              stiffness: 350,
                              damping: 34,
                            }}
                          />
                        )}
                        <span
                          className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${selected ? "border-blue bg-blue text-white" : "border-midnight/12 text-midnight group-hover:border-blue group-hover:text-blue"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.6rem] font-semibold tracking-[0.15em] text-coral">
                            {item.number}
                          </span>
                          <span
                            className={`mt-1 block font-display text-2xl transition-colors ${selected ? "text-blue" : "text-midnight"}`}
                          >
                            {item.title}
                          </span>
                        </span>
                        <ArrowRight
                          className={`h-4 w-4 transition-transform ${selected ? "translate-x-0 text-blue" : "-translate-x-2 text-midnight/24 group-hover:translate-x-0"}`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-h-[560px] overflow-hidden lg:col-span-8">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={specialty.id}
                      className="absolute inset-0 overflow-hidden"
                      initial={{ opacity: 0, clipPath: "inset(0 0 0 12%)" }}
                      animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)" }}
                      exit={{ opacity: 0, clipPath: "inset(0 12% 0 0)" }}
                      transition={{ duration: 0.58, ease: easeOut }}
                    >
                      <picture className="absolute inset-0 block">
                        <source srcSet={specialty.avif} type="image/avif" />
                        <motion.img
                          src={specialty.image}
                          alt=""
                          className={`h-full w-full object-cover ${specialty.id === "consultation" ? "object-[50%_25%]" : ""}`}
                          loading="lazy"
                          decoding="async"
                          initial={{ scale: 1.09 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 1.25, ease: easeOut }}
                        />
                      </picture>
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,17,29,0.93)_0%,rgba(3,17,29,0.76)_42%,rgba(3,17,29,0.12)_100%)]" />
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-blue/70 shadow-[0_0_28px_8px_rgba(20,110,245,0.22)]"
                        initial={{ left: "0%", opacity: 0 }}
                        animate={{ left: "100%", opacity: [0, 1, 0] }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                      />
                      <div className="relative flex min-h-[560px] max-w-xl flex-col justify-end p-7 text-white md:p-12">
                        <motion.div
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.18,
                            duration: 0.55,
                            ease: easeOut,
                          }}
                        >
                          <div className="brand-label text-blue">
                            {specialty.kicker}
                          </div>
                          <h3 className="mt-4 font-display text-5xl leading-[0.94] text-white md:text-6xl">
                            {specialty.title}
                          </h3>
                          <p className="mt-5 max-w-lg text-sm leading-6 text-white/72 md:text-base">
                            {specialty.description}
                          </p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            {specialty.points.map((point, index) => (
                              <motion.span
                                key={point}
                                className="rounded-full border border-white/16 bg-white/8 px-3 py-2 text-xs text-white/80 backdrop-blur-sm"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.32 + index * 0.06 }}
                              >
                                {point}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </section>
        </>
      )}

      <section
        id="hematologie"
        ref={hematologyRef}
        className="relative overflow-hidden bg-midnight py-24 text-plasma md:py-36"
      >
        <picture className="absolute inset-0 block">
          <source srcSet={bloodSmearAvif} type="image/avif" />
          <motion.img
            src={bloodSmear}
            alt="Champ microscopique de cellules sanguines"
            className="h-full w-full object-cover opacity-[0.18] mix-blend-screen"
            loading="lazy"
            decoding="async"
            initial={reducedMotion ? false : { scale: 1.08 }}
            whileInView={reducedMotion ? undefined : { scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.8, ease: easeOut }}
          />
        </picture>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_38%,rgba(20,110,245,0.24),transparent_32%),linear-gradient(90deg,#071A2B_0%,rgba(7,26,43,0.88)_62%,rgba(7,26,43,0.7)_100%)]" />
        <motion.div
          aria-hidden="true"
          className="absolute right-[7%] top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-blue/20"
          animate={
            reducedMotion || !hematologyActive
              ? undefined
              : { rotate: 360, scale: [0.96, 1.04, 0.96] }
          }
          transition={{
            rotate: { duration: 42, repeat: Infinity, ease: "linear" },
            scale: { duration: 7, repeat: Infinity },
          }}
        >
          <span className="absolute left-1/2 top-0 h-2 w-2 rounded-full bg-coral shadow-[0_0_24px_6px_rgba(239,93,88,0.35)]" />
          <span className="absolute inset-[18%] rounded-full border border-dashed border-white/10" />
        </motion.div>
        <div className="container-editorial relative grid gap-16 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-6">
            <div className="brand-label text-coral">
              Hématologie spécialisée
            </div>
            <h2 className="mt-5 max-w-[10ch] font-display text-[clamp(3.1rem,7vw,7rem)] leading-[0.89] tracking-[-0.045em] text-white">
              Voir ce que le bilan seul ne montre pas.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.14}>
            <p className="text-lg leading-8 text-plasma/74">
              Le frottis sanguin et la cytologie médullaire observent les
              cellules elles-mêmes. Cette lecture spécialisée complète les
              chiffres quand le contexte médical l'exige.
            </p>
            <div className="mt-9 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
              {[
                "Frottis sanguin",
                "Cytologie médullaire",
                "Consultation spécialisée",
                "Orientation du bilan",
              ].map((label, index) => (
                <div
                  key={label}
                  className="flex items-start gap-3 bg-midnight/86 p-5"
                >
                  <span className="mt-0.5 text-[0.6rem] font-bold tracking-[0.13em] text-coral">
                    0{index + 1}
                  </span>
                  <span className="text-sm font-medium text-white/82">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/rendez-vous"
              search={{ soin: "consultation-hematologie" }}
              className="mt-8 inline-flex items-center gap-3 border-b border-blue pb-2 text-sm font-semibold text-white hover:text-blue"
            >
              Demander une consultation <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="parcours" className="scroll-mt-24 bg-white py-24 md:py-36">
        <div className="container-editorial">
          <div className="grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <div className="brand-label text-blue">Avant de venir</div>
              <h2 className="mt-5 font-display text-5xl leading-[0.92] text-midnight md:text-7xl">
                Un parcours qui commence{" "}
                <em className="text-blue">avant le prélèvement.</em>
              </h2>
              <a
                href={buildWhatsAppUrl("prelevement")}
                className="mt-8 inline-flex items-center gap-3 rounded-md bg-midnight px-5 py-4 text-sm font-semibold text-white hover:bg-blue"
              >
                Vérifier mes consignes <MessageCircle className="h-4 w-4" />
              </a>
            </Reveal>

            <div className="lg:col-span-7 lg:col-start-6">
              {journey.map((step, index) => (
                <motion.div
                  key={step.number}
                  className="group relative grid gap-5 overflow-hidden border-t border-midnight/12 py-7 sm:grid-cols-[70px_1fr] md:grid-cols-[90px_1fr_1fr]"
                  initial={{ opacity: 0, x: 48 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-8%" }}
                  transition={{
                    duration: 0.72,
                    delay: index * 0.07,
                    ease: easeOut,
                  }}
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-px bg-blue"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.9,
                      delay: 0.16 + index * 0.06,
                      ease: easeOut,
                    }}
                  />
                  <span className="text-[0.68rem] font-bold tracking-[0.16em] text-coral">
                    {step.number}
                  </span>
                  <h3 className="font-display text-3xl leading-none text-midnight transition-colors group-hover:text-blue">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate md:pr-4">
                    {step.copy}
                  </p>
                  {index === journey.length - 1 && <div className="hidden" />}
                </motion.div>
              ))}
              <div className="border-t border-midnight/12 pt-6 text-xs leading-5 text-slate">
                Une urgence vitale ne passe pas par ce parcours: contactez les
                services d'urgence.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="docteur"
        ref={doctorRef}
        className="scroll-mt-24 overflow-hidden bg-plasma py-24 md:py-36"
      >
        <div className="container-editorial grid gap-14 lg:grid-cols-12 lg:items-center">
          <motion.div
            className="relative lg:col-span-5"
            initial={{ opacity: 0, x: -45, rotate: -1.5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.95, ease: easeOut }}
          >
            <motion.div
              className="relative mx-auto max-w-[420px] overflow-hidden rounded-[2rem] bg-midnight shadow-[0_40px_100px_-45px_rgba(7,26,43,0.55)]"
              whileHover={
                reducedMotion ? undefined : { y: -8, rotate: 0.6, scale: 1.01 }
              }
              transition={{ type: "spring", stiffness: 190, damping: 20 }}
            >
              <video
                controls
                playsInline
                preload="none"
                poster={doctorPoster}
                className="aspect-[9/16] w-full object-cover"
                aria-label="Présentation vidéo du concept par Dr Tarfaya"
              >
                <source
                  src="/media/dr-tarfaya-concept-optimized.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-midnight/75 px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
                <motion.span
                  animate={
                    reducedMotion || !doctorActive
                      ? undefined
                      : { scale: [1, 1.35, 1] }
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="h-3 w-3 fill-current text-coral" />
                </motion.span>
                Le concept, par la docteure
              </div>
            </motion.div>
            <motion.div
              aria-hidden="true"
              className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full border border-blue/30 md:h-52 md:w-52"
              animate={
                reducedMotion || !doctorActive ? undefined : { rotate: 360 }
              }
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.1}>
            <div className="brand-label text-blue">Dr Tarfaya Radya</div>
            <h2 className="mt-5 font-display text-[clamp(3.2rem,6.5vw,6.6rem)] leading-[0.89] tracking-[-0.045em] text-midnight">
              Le laboratoire observe.{" "}
              <em className="text-blue">Le médecin relie.</em>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate">
              Médecin spécialiste en hématologie, Dr Tarfaya place l'explication
              au cœur du parcours: comprendre le système sanguin, le rôle de
              l'examen et ce que le résultat change pour la suite.
            </p>
            <div className="mt-9 border-l-2 border-coral pl-6">
              <span className="brand-label text-coral">
                Le principe de la marque
              </span>
              <p className="mt-2 font-display text-3xl leading-tight text-midnight">
                Le patient ne reste pas seul face à un résultat qu'il ne
                comprend pas.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={buildWhatsAppUrl("hematologie")}
                className="inline-flex items-center gap-3 rounded-md bg-blue px-5 py-4 text-sm font-semibold text-white hover:bg-midnight"
              >
                Contacter le laboratoire <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={clinic.phoneHref}
                className="inline-flex items-center gap-3 rounded-md border border-midnight/14 px-5 py-4 text-sm font-semibold text-midnight hover:border-blue hover:text-blue"
              >
                <Phone className="h-4 w-4" /> {clinic.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="questions" className="scroll-mt-24 bg-white py-24 md:py-32">
        <div className="container-editorial grid gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="brand-label text-blue">Questions utiles</div>
            <h2 className="mt-5 font-display text-5xl leading-[0.92] text-midnight md:text-7xl">
              Avant d'écrire au laboratoire.
            </h2>
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            {frequentlyAsked.map((item, index) => (
              <motion.details
                key={item.q}
                className="group border-t border-midnight/12 py-5"
                open={index === 0}
                initial={{ opacity: 0, x: 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{
                  duration: 0.65,
                  delay: index * 0.06,
                  ease: easeOut,
                }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-display text-2xl text-midnight marker:content-none">
                  {item.q}
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-midnight/12 font-sans text-sm text-blue transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-xl pt-4 text-sm leading-6 text-slate">
                  {item.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        ref={contactRef}
        className="relative scroll-mt-24 overflow-hidden bg-blue py-20 text-white md:py-28"
      >
        <motion.div
          aria-hidden="true"
          className="absolute -right-36 -top-40 h-[38rem] w-[38rem] rounded-full border border-white/15"
          animate={
            reducedMotion || !contactActive
              ? undefined
              : { rotate: 360, scale: [1, 1.05, 1] }
          }
          transition={{
            rotate: { duration: 52, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity },
          }}
        >
          <span className="absolute inset-[14%] rounded-full border border-dashed border-white/10" />
          <span className="absolute left-[18%] top-[5%] h-3 w-3 rounded-full bg-coral shadow-[0_0_28px_7px_rgba(239,93,88,0.32)]" />
        </motion.div>
        <div className="absolute inset-0 field-grid opacity-30" />
        <div className="container-editorial relative">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
            <Reveal className="lg:col-span-7">
              <div className="brand-label text-white/65">
                La prochaine étape
              </div>
              <h2 className="mt-5 max-w-[11ch] font-display text-[clamp(3.2rem,7vw,7rem)] leading-[0.88] tracking-[-0.05em] text-white">
                Dites-nous ce que votre ordonnance demande.
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-4 lg:col-start-9" delay={0.12}>
              <p className="text-base leading-7 text-white/72">
                Avant de vous déplacer, confirmez l'analyse, la préparation et
                la disponibilité du service.
              </p>
              <div className="mt-7 grid gap-3">
                <a
                  href={buildWhatsAppUrl("analyse")}
                  className="group flex items-center justify-between rounded-md bg-white px-5 py-4 font-semibold text-midnight"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-blue" />
                    WhatsApp
                  </span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a
                  href={clinic.phoneHref}
                  className="group flex items-center justify-between rounded-md border border-white/25 px-5 py-4 font-semibold text-white"
                >
                  <span className="flex items-center gap-3">
                    <Phone className="h-4 w-4" />
                    {clinic.phone}
                  </span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>
          </div>

          <motion.div
            className="mt-14 grid gap-px overflow-hidden rounded-xl bg-white/18 md:grid-cols-3"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.14, ease: easeOut }}
          >
            <a
              href={clinic.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="flex gap-4 bg-blue p-6 transition-colors hover:bg-blue-dark"
            >
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong className="block">El Bouni, Annaba</strong>
                <span className="mt-1 block text-sm text-white/65">
                  {clinic.address.line1}
                </span>
              </span>
            </a>
            <div className="flex gap-4 bg-blue p-6">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong className="block">Samedi - Jeudi</strong>
                <span className="mt-1 block text-sm text-white/65">
                  Appelez pour confirmer l'horaire
                </span>
              </span>
            </div>
            <Link
              to="/rendez-vous"
              className="flex gap-4 bg-blue p-6 transition-colors hover:bg-blue-dark"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0" />
              <span>
                <strong className="block">Demande en ligne</strong>
                <span className="mt-1 block text-sm text-white/65">
                  Confirmation manuelle par l'équipe
                </span>
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
