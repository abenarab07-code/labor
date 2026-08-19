import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "./motion-primitives";

const POINTS = [
  "Une gêne légère peut devenir plus complexe avec le temps.",
  "Une dent manquante peut affecter l'équilibre du sourire.",
  "Un mauvais alignement peut compliquer l'entretien quotidien.",
  "Une douleur mérite toujours une évaluation adaptée.",
];

export function UrgencySection() {
  return (
    <section
      id="urgence"
      className="py-20 md:py-28 bg-petrol text-ivory scroll-mt-24 relative overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal/15 blur-3xl"
      />

      <div className="container-editorial relative">
        <div className="grid gap-10 lg:grid-cols-12 items-start">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow text-mint mb-4">Prendre soin, sereinement</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
              Un problème dentaire<br />
              <span className="italic text-mint">
                ne s'améliore pas toujours avec le temps.
              </span>
            </h2>
            <p className="mt-6 max-w-xl text-ivory/70 leading-relaxed">
              Sans dramatiser, un examen adapté permet souvent d'éviter que la
              situation ne se complique. Un premier échange peut suffire à y voir
              plus clair.
            </p>

            <Link
              to="/rendez-vous"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-mint text-petrol px-7 py-3.5 text-sm hover:bg-ivory transition-colors"
            >
              Faire évaluer ma situation
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Stagger className="lg:col-span-5 grid gap-3">
            {POINTS.map((p) => (
              <StaggerItem key={p}>
                <div className="rounded-2xl border border-ivory/15 bg-ivory/[0.04] p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-mint shrink-0" />
                    <p className="text-ivory/85 leading-relaxed text-[0.95rem]">
                      {p}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
