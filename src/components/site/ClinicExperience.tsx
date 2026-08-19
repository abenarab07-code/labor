import { Reveal, Stagger, StaggerItem } from "./motion-primitives";
import clinicInterior from "@/assets/clinic-interior.jpg";

const highlights = [
  { label: "Environnement soigné", body: "Un espace pensé pour apaiser dès l'entrée." },
  { label: "Explications claires", body: "Chaque étape du soin est décrite en amont, sans jargon." },
  { label: "Hygiène rigoureuse", body: "Des protocoles rigoureux, à chaque instant." },
  { label: "Suivi personnalisé", body: "Un contact accessible, y compris entre les rendez-vous." },
];

export function ClinicExperience() {
  return (
    <section className="py-20 md:py-28 bg-mint/25">
      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <Reveal className="lg:col-span-6">
            <div className="rounded-[2rem] overflow-hidden">
              <img
                src={clinicInterior}
                alt="Intérieur éditorial de clinique — visuel de référence"
                width={1600}
                height={1104}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-xs text-ink/50">
              Visuel de référence — les photos originales de la clinique seront ajoutées prochainement.
            </p>
          </Reveal>

          <div className="lg:col-span-6 lg:pt-8">
            <Reveal>
              <div className="eyebrow mb-4">La clinique</div>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
                Une clinique pensée<br />
                <span className="italic text-teal">pour vous rassurer.</span>
              </h2>
              <p className="mt-6 text-ink/70 max-w-lg">
                À Bab Ezzouar, un lieu clair et attentif — où chaque détail vise
                à rendre votre visite plus sereine, du premier bonjour au dernier
                suivi.
              </p>
            </Reveal>

            <Stagger className="mt-10 grid sm:grid-cols-2 gap-4">
              {highlights.map((h) => (
                <StaggerItem key={h.label}>
                  <div className="rounded-xl border border-border/60 bg-card p-5">
                    <div className="text-sm text-petrol font-medium">{h.label}</div>
                    <p className="mt-2 text-sm text-ink/65 leading-relaxed">{h.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </div>
    </section>
  );
}
