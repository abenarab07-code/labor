import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "./motion-primitives";
import { SmileMap } from "@/motion/porcelain";
import { track } from "@/lib/analytics";


type NeedOption = {
  id: string;
  label: string;
  serviceSlug?: string;
  scrollTo?: string;
  recommendation: string;
};

const NEEDS: NeedOption[] = [
  {
    id: "esthetique",
    label: "Je veux améliorer l'esthétique de mon sourire",
    serviceSlug: "facettes",
    scrollTo: "#soins",
    recommendation:
      "La première étape recommandée est un bilan personnalisé afin d'évaluer les solutions esthétiques adaptées à la forme, la teinte et l'équilibre de votre sourire.",
  },
  {
    id: "alignement",
    label: "Mes dents sont mal alignées",
    serviceSlug: "aligneurs",
    scrollTo: "#soins",
    recommendation:
      "La première étape recommandée est un bilan personnalisé pour vérifier si les aligneurs transparents peuvent convenir à votre situation.",
  },
  {
    id: "manquantes",
    label: "Il me manque une ou plusieurs dents",
    serviceSlug: "implantologie",
    scrollTo: "#soins",
    recommendation:
      "La première étape recommandée est un bilan personnalisé afin d'évaluer les solutions de restauration adaptées à votre cas.",
  },
  {
    id: "blancheur",
    label: "Je souhaite un sourire plus blanc",
    serviceSlug: "blanchiment",
    scrollTo: "#soins",
    recommendation:
      "La première étape recommandée est un bilan personnalisé pour vérifier la faisabilité d'un blanchiment adapté à la sensibilité de vos dents.",
  },
  {
    id: "urgence",
    label: "J'ai une douleur ou une urgence",
    serviceSlug: "urgences",
    scrollTo: "#urgence",
    recommendation:
      "Contactez-nous par téléphone ou WhatsApp — nous ferons notre possible pour vous recevoir rapidement selon l'agenda du jour.",
  },
  {
    id: "inconnu",
    label: "Je ne sais pas encore quel traitement me convient",
    scrollTo: "#soins",
    recommendation:
      "C'est parfaitement normal. La première étape consiste simplement à comprendre votre situation et les options adaptées à votre cas lors d'un premier bilan.",
  },
];

export function PatientProblemSelector() {
  const [selected, setSelected] = useState<NeedOption | null>(null);

  const handleSelect = (opt: NeedOption) => {
    setSelected(opt);
    track("problem_selected", { id: opt.id });
  };

  return (
    <section id="besoins" className="relative py-20 md:py-28 overflow-hidden">
      {/* Signature smile-map graphic — carries the porcelain visual language */}
      <SmileMap
        className="absolute -top-4 left-0 right-0 h-[260px] md:h-[320px] opacity-70"
        strokeOpacity={0.28}
      />
      <div className="container-editorial relative">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-12 mb-10 md:mb-14">

          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">Commençons par vous</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
              Quel est votre besoin<br className="hidden md:block" />
              <span className="italic text-teal"> aujourd'hui ?</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5 flex items-end" delay={0.15}>
            <p className="text-ink/70 max-w-md">
              Sélectionnez ce qui vous ressemble — nous vous suggérons la
              première étape la plus adaptée avant toute décision.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEEDS.map((opt, i) => {
            const active = selected?.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`group relative text-left h-full overflow-hidden rounded-2xl border p-6 md:p-7 transition-all duration-300 ${
                  active
                    ? "border-teal bg-mint/40 shadow-lift"
                    : "border-border/70 bg-card hover:border-teal/40 hover:shadow-lift hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-8">
                  <span className="num-display text-sm text-teal">
                    0{i + 1}
                  </span>
                  {active ? (
                    <span className="h-6 w-6 rounded-full bg-teal text-ivory flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-ink/30 transition-all group-hover:text-teal group-hover:translate-x-1" />
                  )}
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-petrol leading-snug">
                  {opt.label}
                </h3>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 overflow-hidden"
            >
              <div className="rounded-3xl border border-teal/25 bg-mint/30 p-6 md:p-10">
                <div className="eyebrow text-teal mb-3">Recommandation</div>
                <p className="font-serif text-2xl md:text-3xl text-petrol leading-snug max-w-3xl">
                  {selected.recommendation}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/rendez-vous"
                    search={
                      selected.serviceSlug
                        ? { soin: selected.serviceSlug }
                        : undefined
                    }
                    onClick={() =>
                      track("appointment_form_started", {
                        from: "problem_selector",
                        need: selected.id,
                      })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3.5 text-sm text-ivory hover:bg-ink transition-colors"
                  >
                    Réserver mon bilan
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  {selected.scrollTo && (
                    <a
                      href={selected.scrollTo}
                      className="inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-3.5 text-sm text-petrol hover:bg-petrol/5"
                    >
                      Découvrir la solution adaptée
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
