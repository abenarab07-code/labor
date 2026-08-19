import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useReducedMotionMode, useLowPowerMode } from "@/motion/hooks";
import { easings } from "@/motion/motion-tokens";
import { Reveal, ImageCurtainReveal } from "@/motion/primitives";
import aligneursAsset from "@/assets/treatment-aligneurs.jpg.asset.json";
import facettesAsset from "@/assets/treatment-facettes.jpg.asset.json";
import implantAsset from "@/assets/treatment-implant.jpg.asset.json";


type Treatment = {
  slug: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  bg: string;
  image: string;
  imageAlt: string;
};


const TREATMENTS: Treatment[] = [
  {
    slug: "aligneurs",
    eyebrow: "Aligneurs transparents",
    title: "Alignez votre sourire en toute discrétion.",
    body: "Une solution transparente et personnalisée, pensée pour s'intégrer à votre quotidien sans compromis esthétique.",
    ctaLabel: "Découvrir si ce soin me convient",
    bg: "from-mint/60 via-ivory to-ivory",
    image: aligneursAsset.url,
    imageAlt: "Aligneurs dentaires transparents posés sur une surface ivoire",
  },
  {
    slug: "facettes",
    eyebrow: "Facettes / esthétique du sourire",
    title: "Retrouvez un sourire plus harmonieux.",
    body: "Une approche esthétique personnalisée selon la forme, la teinte et l'équilibre de votre sourire.",
    ctaLabel: "Évaluer mon sourire",
    bg: "from-champagne/25 via-ivory to-mint/30",
    image: facettesAsset.url,
    imageAlt: "Gros plan éditorial d'un sourire harmonieux",
  },
  {
    slug: "implantologie",
    eyebrow: "Implantologie",
    title: "Remplacez une dent manquante, retrouvez le confort.",
    body: "Un accompagnement de bout en bout, de l'évaluation à la pose, avec un suivi rapproché.",
    ctaLabel: "Demander une évaluation",
    bg: "from-petrol/10 via-ivory to-ivory",
    image: implantAsset.url,
    imageAlt: "Implant dentaire premium en gros plan",
  },
];


export function ScrollTreatmentStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const progressMV = useMotionValue(0);
  const reduced = useReducedMotionMode();
  const low = useLowPowerMode();
  const [isDesktop, setIsDesktop] = useState(false);

  // Per-bar fill motion values, derived from a single motion value (no re-renders).
  const bar0 = useTransform(progressMV, [0, 0.33], [0, 1], { clamp: true });
  const bar1 = useTransform(progressMV, [0.33, 0.66], [0, 1], { clamp: true });
  const bar2 = useTransform(progressMV, [0.66, 1], [0, 1], { clamp: true });
  const barMVs = [bar0, bar1, bar2];

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const pinned = isDesktop && !reduced && !low;

  useEffect(() => {
    if (!pinned) return;
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = r.height - vh;
        const scrolled = -r.top;
        const p = Math.max(0, Math.min(1, scrolled / total));
        progressMV.set(p);
        const idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActive(idx);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pinned, progressMV]);


  if (!pinned) {
    // Mobile / reduced: render three curtain-revealed cards.
    return (
      <section id="soins" className="py-20 md:py-28 bg-gradient-to-b from-ivory to-mint/20 scroll-mt-24">
        <div className="container-editorial">
          <Reveal className="max-w-3xl mb-10">
            <div className="eyebrow mb-4">Trois soins prioritaires</div>
            <h2 className="font-serif text-4xl md:text-5xl text-petrol">
              La solution juste,<br />
              <span className="italic text-teal">pour votre situation.</span>
            </h2>
          </Reveal>
          <div className="space-y-6">
            {TREATMENTS.map((t, i) => (
              <ImageCurtainReveal key={t.slug} delay={i * 0.05}>
                <div className={`overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br ${t.bg}`}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={t.image}
                      alt={t.imageAlt}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-petrol/40 to-transparent" />
                  </div>
                  <div className="p-8">
                    <div className="eyebrow mb-2">{t.eyebrow}</div>
                    <h3 className="font-serif text-2xl text-petrol">{t.title}</h3>
                    <p className="mt-3 text-ink/70 text-sm">{t.body}</p>
                    <Link
                      to="/rendez-vous"
                      search={{ soin: t.slug }}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm text-petrol"
                    >
                      {t.ctaLabel} <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </ImageCurtainReveal>
            ))}

          </div>
        </div>
      </section>
    );
  }

  const t = TREATMENTS[active];

  return (
    <section
      id="soins"
      ref={sectionRef}
      className="relative scroll-mt-24"
      style={{ height: "320vh" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${t.bg} transition-colors duration-700`} />
        <div className="relative h-full container-editorial grid grid-cols-12 items-center gap-10">
          {/* Copy column */}
          <div className="col-span-6 relative">
            <div className="eyebrow mb-4">Trois soins prioritaires</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={t.slug}
                initial={{ opacity: 0, y: 55, scale: 1.035, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -45, scale: 0.97, filter: "blur(8px)" }}
                transition={{ duration: 0.65, ease: easings.easeInOut }}
              >
                <div className="text-teal text-xs uppercase tracking-[0.24em] mb-3">{t.eyebrow}</div>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol leading-[1.05]">
                  {t.title}
                </h2>
                <p className="mt-6 text-ink/75 text-lg max-w-md">{t.body}</p>
                <Link
                  to="/rendez-vous"
                  search={{ soin: t.slug }}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-petrol px-7 py-4 text-sm text-ivory hover:bg-ink transition-colors"
                >
                  {t.ctaLabel} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Progress rail */}
            <div className="mt-14 flex items-center gap-6">
              {TREATMENTS.map((tt, i) => (
                <div key={tt.slug} className="flex items-center gap-3">
                  <div className="relative h-[2px] w-20 bg-petrol/15 rounded overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-full bg-teal rounded origin-left"
                      style={{ scaleX: barMVs[i] }}
                    />
                  </div>
                  <span className={`text-xs uppercase tracking-wider ${i === active ? "text-petrol opacity-100" : "text-petrol/35"}`}>
                    0{i + 1}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* Motif column */}
          <div className="col-span-6 relative h-[70vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={t.slug}
                initial={{ clipPath: "inset(0 0 100% 0)" }}
                animate={{ clipPath: "inset(0 0 0% 0)" }}
                exit={{ clipPath: "inset(100% 0 0 0)" }}
                transition={{ duration: 0.7, ease: easings.easeInOut }}
                className="absolute inset-0 rounded-[36px] bg-ivory border border-border/60 shadow-lift overflow-hidden"
              >
                <img
                  src={t.image}
                  alt={t.imageAlt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-petrol/70 via-petrol/10 to-transparent" />
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(201,173,114,0.18), rgba(201,173,114,0) 45%, rgba(0,0,0,0) 70%)",
                    mixBlendMode: "screen",
                  }}
                />
                <div className="absolute bottom-6 left-6 right-6 text-ivory">
                  <div className="text-[10px] uppercase tracking-wider text-champagne">Motif clinique</div>
                  <div className="font-serif text-xl">{t.eyebrow}</div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
