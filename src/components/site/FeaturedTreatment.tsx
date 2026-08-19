import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import aligners from "@/assets/aligners.jpg";

const steps = [
  { n: "01", label: "Bilan initial", body: "Un examen complet pour comprendre votre situation et votre demande." },
  { n: "02", label: "Empreintes numériques", body: "Une modélisation précise de votre bouche, sans matériaux invasifs." },
  { n: "03", label: "Plan de traitement", body: "Une simulation étape par étape, discutée avec vous avant de commencer." },
  { n: "04", label: "Aligneurs sur-mesure", body: "Une série d'aligneurs transparents, portés au quotidien avec discrétion." },
  { n: "05", label: "Suivi personnalisé", body: "Des rendez-vous réguliers et un accompagnement disponible sur WhatsApp." },
];

export function FeaturedTreatment() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-petrol text-ivory relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-teal/15 blur-3xl"
      />

      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-28 self-start">
            <div className="eyebrow text-teal mb-5">Histoire d'un soin</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ivory leading-[1.05]">
              Alignez votre sourire<br />
              <span className="italic text-mint">en toute discrétion.</span>
            </h2>
            <p className="mt-6 text-ivory/70 max-w-md leading-relaxed">
              Une solution transparente et personnalisée, pensée pour s'intégrer
              naturellement à votre quotidien — sans compromettre votre confort
              ni votre confiance.
            </p>

            <div className="mt-8 relative aspect-[4/5] max-w-sm overflow-hidden rounded-3xl">
              <motion.img
                src={aligners}
                alt="Aligneur transparent posé sur un tissu ivoire"
                width={1408}
                height={1600}
                className="h-full w-full object-cover"
                style={{ y: imgY }}
                loading="lazy"
              />
            </div>

            <Link
              to="/rendez-vous"
              search={{ soin: "aligneurs" }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-mint text-petrol px-6 py-3.5 text-sm hover:bg-ivory transition-colors"
            >
              Discuter d'un traitement
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="border-t border-ivory/15 pt-6 grid grid-cols-[auto_1fr] gap-6 items-baseline"
              >
                <span className="num-display text-teal text-sm md:text-base">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl text-ivory">
                    {s.label}
                  </h3>
                  <p className="mt-2 text-ivory/70 leading-relaxed max-w-lg">
                    {s.body}
                  </p>
                </div>
              </motion.div>
            ))}
            <p className="mt-6 pt-6 border-t border-ivory/15 text-xs text-ivory/50">
              Le déroulement décrit est indicatif — il est adapté après examen à chaque situation clinique.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
