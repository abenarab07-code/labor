import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const STEPS = [
  {
    n: "01",
    label: "Échange sur votre besoin",
    body: "Un temps d'écoute pour comprendre votre demande et vos attentes.",
  },
  {
    n: "02",
    label: "Évaluation de votre situation",
    body: "Un examen clinique adapté pour poser les bonnes questions.",
  },
  {
    n: "03",
    label: "Explication des options possibles",
    body: "Une présentation claire des solutions envisageables — sans pression.",
  },
  {
    n: "04",
    label: "Organisation de la suite",
    body: "Si un traitement est indiqué, il est planifié à votre rythme.",
  },
];

export function FirstAppointment() {
  return (
    <section id="premiere-visite" className="py-20 md:py-28 bg-ivory scroll-mt-24">
      <div className="container-editorial">
        <div className="grid gap-10 lg:grid-cols-12 items-end mb-12">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">La première étape</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol leading-[1.05]">
              Votre première étape<br />
              <span className="italic text-teal">chez Beausourire.</span>
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={0.15}>
            <p className="text-ink/70">
              Le premier rendez-vous permet de comprendre votre besoin, d'évaluer
              votre situation et de vous expliquer les options possibles avant
              toute décision.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <StaggerItem key={s.n}>
              <div className="h-full rounded-2xl border border-border/70 bg-card p-6">
                <div className="num-display text-teal text-sm mb-3">{s.n}</div>
                <div className="font-serif text-xl text-petrol leading-snug">
                  {s.label}
                </div>
                <p className="mt-3 text-sm text-ink/65 leading-relaxed">
                  {s.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-10 flex justify-center">
          <Link
            to="/rendez-vous"
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-7 py-4 text-sm hover:bg-ink transition-colors"
          >
            Choisir un créneau
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
