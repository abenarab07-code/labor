import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Reveal, ImageCurtainReveal } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";
import case01 from "@/assets/case-01.jpg.asset.json";
import case02 from "@/assets/case-02.jpg.asset.json";
import case03 from "@/assets/case-03.jpg.asset.json";

type Case = {
  id: string;
  label: string;
  title: string;
  context: string;
  imageUrl: string;
};

// Real approved patient cases — published with written consent.
const CASES: Case[] = [
  {
    id: "case-01",
    label: "Facettes E.max",
    title: "Réalignement esthétique",
    context: "Fermeture des espaces & harmonisation du sourire",
    imageUrl: case01.url,
  },
  {
    id: "case-02",
    label: "Blanchiment & polissage",
    title: "Éclat naturel retrouvé",
    context: "Réhabilitation de la teinte et de la brillance",
    imageUrl: case02.url,
  },
  {
    id: "case-03",
    label: "Aligneurs transparents",
    title: "Alignement discret",
    context: "Correction orthodontique sans bagues visibles",
    imageUrl: case03.url,
  },
];


export function BeforeAfterStage() {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  const update = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPos(Math.max(0, Math.min(100, p)));
    });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) update(e.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - step));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + step));
  };

  const hasCases = CASES.length > 0;

  return (
    <section className="py-20 md:py-28 bg-mint/30">
      <div className="container-editorial">
        <div className="grid gap-10 lg:grid-cols-12 items-end mb-10">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">Résultats</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
              Des transformations,<br />
              <span className="italic text-teal">avec discrétion.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.15}>
            <p className="text-ink/70">
              Faites glisser la poignée pour comparer avant et après. Les cas
              cliniques ne sont publiés qu'après consentement écrit du patient·e.
            </p>
          </Reveal>
        </div>

        <ImageCurtainReveal className="rounded-[28px] shadow-lift">
          <div
            ref={containerRef}
            role="slider"
            aria-label="Comparateur avant / après"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            tabIndex={0}
            onKeyDown={onKey}
            className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] bg-mint select-none touch-none cursor-ew-resize"
            onPointerDown={(e) => {
              draggingRef.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
              update(e.clientX);
            }}
          >
            {/* Before layer */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-petrol/85 via-petrol to-ink flex items-center justify-center"
            >
              {!hasCases && (
                <div className="text-center text-ivory/85 max-w-sm p-6">
                  <div className="eyebrow text-mint mb-2">Avant</div>
                  <div className="font-serif text-2xl md:text-3xl">Situation initiale</div>
                  <p className="mt-3 text-sm text-ivory/70">
                    Chaque plan de soin démarre par un diagnostic personnalisé.
                  </p>
                </div>
              )}
            </div>
            {/* After layer clipped */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-mint via-ivory to-champagne/40 flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
            >
              {!hasCases && (
                <div className="text-center text-petrol max-w-sm p-6">
                  <div className="eyebrow mb-2">Après</div>
                  <div className="font-serif text-2xl md:text-3xl">Sourire harmonisé</div>
                  <p className="mt-3 text-sm text-petrol/70">
                    Les premiers cas seront ajoutés dès validation.
                  </p>
                </div>
              )}
            </div>
            {/* Divider + handle */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-ivory/90 pointer-events-none"
              style={{ left: `${pos}%`, transform: "translateX(-1px)" }}
            />
            <motion.div
              className="absolute top-1/2 h-[52px] w-[52px] rounded-full bg-ivory shadow-lift border border-teal/40 flex items-center justify-center pointer-events-none"
              style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
              animate={{ scale: draggingRef.current ? 1.08 : 1 }}
            >
              <div className="flex gap-1">
                <span className="h-4 w-0.5 bg-petrol" />
                <span className="h-4 w-0.5 bg-petrol" />
              </div>
            </motion.div>
            <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-ivory/80 bg-petrol/40 backdrop-blur px-2 py-1 rounded">
              Avant
            </span>
            <span className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-petrol bg-ivory/80 backdrop-blur px-2 py-1 rounded">
              Après
            </span>
          </div>
        </ImageCurtainReveal>

        {/* Editorial gallery — real approved patient cases */}
        <div className="mt-16 md:mt-24">
          <div className="flex items-end justify-between gap-6 mb-8">
            <Reveal>
              <div className="eyebrow mb-3 text-teal">Cas cliniques</div>
              <h3 className="font-serif text-2xl md:text-3xl text-petrol">
                Sélection récente<span className="italic text-teal"> — publiée avec consentement</span>
              </h3>
            </Reveal>
            <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-petrol/50">
              <span className="h-px w-8 bg-petrol/30" /> {CASES.length} cas
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {CASES.map((c, i) => (
              <motion.figure
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: easings.easeOut, delay: i * 0.12 }}
                className="group relative overflow-hidden rounded-[24px] bg-petrol shadow-lift"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={`${c.title} — ${c.context}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]"
                  />
                  {/* Champagne rim */}
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      boxShadow: "inset 0 0 0 2px rgba(201,173,114,0.35)",
                    }}
                  />
                  {/* Bottom gradient for legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-petrol via-petrol/60 to-transparent" />
                  {/* Label chip */}
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.22em] text-petrol bg-champagne px-2.5 py-1 rounded-full shadow-sm">
                    {c.label}
                  </span>
                  {/* Caption */}
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                    <div className="font-serif text-xl leading-snug">{c.title}</div>
                    <div className="mt-1 text-[12px] text-ivory/75">{c.context}</div>
                  </figcaption>
                </div>
              </motion.figure>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-ink/50 max-w-2xl">
            Les résultats varient selon la situation clinique de chaque patient·e
            et ne constituent pas un engagement médical.
          </p>
          <Link
            to="/rendez-vous"
            className="inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3 text-sm text-ivory hover:bg-ink transition-colors"
          >
            Discuter d'un résultat similaire
          </Link>
        </div>

      </div>
    </section>
  );
}
