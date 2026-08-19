import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Reveal } from "@/motion/primitives";
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

export function TransformationsGallery() {
  return (
    <section className="py-20 md:py-28 bg-mint/30">
      <div className="container-editorial">
        <div className="grid gap-10 lg:grid-cols-12 items-end mb-12">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">Résultats</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
              Des transformations,<br />
              <span className="italic text-teal">avec discrétion.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.15}>
            <p className="text-ink/70">
              Une sélection de cas cliniques récents, publiée uniquement après
              consentement écrit des patient·es concerné·es.
            </p>
          </Reveal>
        </div>

        <div className="flex items-end justify-between gap-6 mb-8">
          <div className="eyebrow text-teal">Cas cliniques</div>
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
                <div
                  aria-hidden
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(201,173,114,0.35)" }}
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-petrol via-petrol/60 to-transparent" />
                <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.22em] text-petrol bg-champagne px-2.5 py-1 rounded-full shadow-sm">
                  {c.label}
                </span>
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                  <div className="font-serif text-xl leading-snug">{c.title}</div>
                  <div className="mt-1 text-[12px] text-ivory/75">{c.context}</div>
                </figcaption>
              </div>
            </motion.figure>
          ))}
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
