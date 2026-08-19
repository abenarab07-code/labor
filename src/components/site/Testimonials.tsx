import { Star } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "./motion-primitives";
import {
  testimonials,
  testimonialCategories,
  type TestimonialCategory,
} from "@/content/testimonials";
import { clinic } from "@/content/clinic";
import { track } from "@/lib/analytics";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function Testimonials() {
  const [active, setActive] = useState<TestimonialCategory | "all">("all");

  const filtered =
    active === "all"
      ? testimonials
      : testimonials.filter((t) => t.category === active);

  return (
    <section className="py-20 md:py-28 bg-ivory">
      <div className="container-editorial">
        <div className="grid gap-10 lg:grid-cols-12 mb-10 items-end">
          <Reveal className="lg:col-span-7">
            <div className="eyebrow mb-4">Ils en parlent</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol leading-[1.05]">
              Ce que les patients<br />
              <span className="italic text-teal">retiennent vraiment.</span>
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.15}>
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-1 text-champagne mb-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <div className="num-display text-3xl text-petrol">
                  {clinic.socialProof.googleRating}
                  <span className="text-lg text-ink/50">/5</span>
                </div>
                <div className="mt-1 text-xs text-ink/60 uppercase tracking-wider">
                  {clinic.socialProof.googleReviews} avis Google
                </div>
              </div>
              <div className="h-14 w-px bg-border" />
              <div>
                <div className="num-display text-3xl text-petrol">
                  {clinic.socialProof.instagramFollowers}
                </div>
                <div className="mt-1 text-xs text-ink/60 uppercase tracking-wider">
                  Communauté Instagram
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Category tabs — organised by objection */}
        <div className="flex flex-wrap gap-2 mb-8">
          <CategoryPill
            label="Tous les retours"
            active={active === "all"}
            onClick={() => setActive("all")}
          />
          {testimonialCategories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.label}
              active={active === c.id}
              onClick={() => setActive(c.id)}
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <motion.figure
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="h-full flex flex-col rounded-2xl border border-border/60 bg-card p-7"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-champagne">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-teal">
                    {t.categoryLabel}
                  </span>
                </div>
                <blockquote className="font-serif text-lg leading-relaxed text-petrol flex-1">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-petrol">{t.author}</div>
                    {t.treatment && (
                      <div className="text-xs text-ink/50 mt-0.5">
                        {t.treatment}
                      </div>
                    )}
                  </div>
                  {t.verified && (
                    <span className="text-[10px] uppercase tracking-wider text-ink/50">
                      Avis vérifié
                    </span>
                  )}
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="https://www.google.com/maps/search/?api=1&query=Beausourire+Cabinet+Dentaire+Bab+Ezzouar"
            target="_blank"
            rel="noreferrer"
            onClick={() => track("maps_clicked", { from: "testimonials" })}
            className="inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-2.5 text-sm text-petrol hover:bg-petrol/5 transition-colors"
          >
            Voir plus d'avis Google
          </a>
          <a
            href={buildWhatsAppUrl("default", { sourcePage: "Témoignages" })}
            onClick={() => track("whatsapp_clicked", { from: "testimonials" })}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-5 py-2.5 text-sm hover:bg-ink transition-colors"
          >
            Parler à l'équipe
          </a>
        </div>

        <p className="mt-6 text-xs text-ink/50 max-w-2xl">
          Extraits d'avis publics regroupés par thème pour éclairer les objections
          les plus fréquentes. Les identités sont anonymisées.
        </p>
      </div>
    </section>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
        active
          ? "bg-petrol text-ivory border-petrol"
          : "border-border/70 text-ink/60 hover:border-teal/50 hover:text-petrol"
      }`}
    >
      {label}
    </button>
  );
}
