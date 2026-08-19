import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Reveal } from "./motion-primitives";

const steps = [
  { n: "01", label: "Prise de contact", body: "Par téléphone, WhatsApp ou formulaire." },
  { n: "02", label: "Première consultation", body: "Un temps d'écoute et un examen clinique." },
  { n: "03", label: "Évaluation personnalisée", body: "Un diagnostic clair, sans précipitation." },
  { n: "04", label: "Proposition du traitement", body: "Un plan de soin adapté et discuté." },
  { n: "05", label: "Suivi", body: "Un accompagnement dans la durée." },
];

export function PatientJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 md:py-28">
      <div className="container-editorial">
        <Reveal className="max-w-2xl mb-14">
          <div className="eyebrow mb-4">Parcours patient</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
            De la première question<br />
            <span className="italic text-teal">au premier sourire.</span>
          </h2>
        </Reveal>

        <div ref={ref} className="relative">
          {/* Horizontal line — desktop */}
          <div
            aria-hidden
            className="hidden lg:block absolute top-6 left-0 right-0 h-px bg-border"
          />
          <motion.div
            aria-hidden
            className="hidden lg:block absolute top-6 left-0 h-px bg-teal origin-left"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
            style={{ width: "100%" }}
          />

          <div className="grid gap-6 lg:grid-cols-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="relative pt-0 lg:pt-12"
              >
                {/* Dot on line — desktop only */}
                <span
                  aria-hidden
                  className="hidden lg:block absolute top-[18px] left-0 h-4 w-4 rounded-full bg-ivory border-2 border-teal"
                />
                <div className="num-display text-teal text-sm mb-2">{s.n}</div>
                <div className="font-serif text-xl text-petrol">{s.label}</div>
                <p className="mt-2 text-sm text-ink/65 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
