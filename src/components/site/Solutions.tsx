import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";
import { track } from "@/lib/analytics";

type PrioritySolution = {
  slug: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
};

const PRIORITIES: PrioritySolution[] = [
  {
    slug: "aligneurs",
    eyebrow: "Aligneurs transparents",
    title: "Alignez votre sourire en toute discrétion.",
    body: "Une solution transparente et personnalisée pensée pour s'intégrer à votre quotidien.",
    ctaLabel: "Découvrir si ce soin me convient",
  },
  {
    slug: "facettes",
    eyebrow: "Facettes / esthétique du sourire",
    title: "Retrouvez un sourire plus harmonieux.",
    body: "Une approche esthétique personnalisée selon la forme, la teinte et l'équilibre de votre sourire.",
    ctaLabel: "Évaluer mon sourire",
  },
  {
    slug: "implantologie",
    eyebrow: "Implantologie",
    title: "Remplacez une dent manquante et retrouvez plus de confort.",
    body: "Un accompagnement de bout en bout, de l'évaluation à la pose, avec un suivi rapproché.",
    ctaLabel: "Demander une première évaluation",
  },
];

export function Solutions() {
  return (
    <section
      id="soins"
      className="py-20 md:py-28 bg-gradient-to-b from-ivory to-mint/20 scroll-mt-24"
    >
      <div className="container-editorial">
        <div className="grid gap-6 md:gap-10 lg:grid-cols-12 mb-12 md:mb-16 items-end">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">Trois soins prioritaires</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol leading-[1.05]">
              La solution juste,<br />
              <span className="italic text-teal">pour votre situation.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.15}>
            <p className="text-ink/70">
              Trois axes de soin parmi les plus demandés au cabinet — chacun
              évalué et discuté avec vous avant toute décision.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid gap-4 md:grid-cols-3">
          {PRIORITIES.map((s, i) => (
            <StaggerItem key={s.slug}>
              <div className="group h-full flex flex-col rounded-3xl border border-border/70 bg-card p-8 transition-all duration-300 hover:border-teal/40 hover:shadow-lift hover:-translate-y-0.5">
                <div className="num-display text-teal text-sm mb-3">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="eyebrow mb-3">{s.eyebrow}</div>
                <h3 className="font-serif text-2xl text-petrol leading-snug">
                  {s.title}
                </h3>
                <p className="mt-4 text-sm text-ink/70 leading-relaxed flex-1">
                  {s.body}
                </p>
                <Link
                  to="/rendez-vous"
                  search={{ soin: s.slug }}
                  onClick={() =>
                    track("service_selected", { slug: s.slug, from: "solutions" })
                  }
                  className="mt-6 inline-flex items-center gap-1.5 text-sm text-petrol group-hover:text-teal transition-colors"
                >
                  {s.ctaLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-10 flex justify-center">
          <Link
            to="/soins"
            className="text-sm text-petrol underline underline-offset-4 hover:text-teal"
          >
            Découvrir tous nos soins
          </Link>
        </div>
      </div>
    </section>
  );
}
