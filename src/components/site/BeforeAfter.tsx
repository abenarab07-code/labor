import { Link } from "@tanstack/react-router";
import { Reveal } from "./motion-primitives";

export function BeforeAfter() {
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
              La galerie des cas cliniques est en cours de préparation. Les
              résultats ne sont partagés qu'après validation explicite des
              patient·es concerné·es.
            </p>
          </Reveal>
        </div>

        {/* Filters (placeholder pills) */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["Tous", "Blanchiment", "Alignement", "Restauration esthétique", "Implantologie"].map((f, i) => (
            <button
              key={f}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
                i === 0
                  ? "bg-petrol text-ivory border-petrol"
                  : "border-border/70 text-ink/60 hover:border-teal/50 hover:text-petrol"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Reveal className="relative overflow-hidden rounded-3xl border border-border/60 bg-card aspect-[16/9] flex items-center justify-center p-8 md:p-16">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--color-mint) 50%, var(--color-ivory) 50%)",
            }}
          />
          <div className="relative text-center max-w-xl">
            <div className="eyebrow mb-4">Bientôt</div>
            <h3 className="font-serif text-2xl md:text-3xl text-petrol">
              Les cas cliniques seront ajoutés après validation de leur diffusion.
            </h3>
            <p className="mt-4 text-sm text-ink/60">
              Curseur avant/après, filtres par soin, mode plein écran — l'expérience
              est prête à accueillir les premiers cas validés.
            </p>
            <Link
              to="/rendez-vous"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-petrol px-6 py-3 text-sm text-ivory hover:bg-ink"
            >
              Discuter d'un résultat similaire
            </Link>
          </div>

          {/* Central divider indicator */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-teal/40" aria-hidden />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-ivory border border-teal shadow-lift flex items-center justify-center" aria-hidden>
            <div className="flex gap-0.5">
              <span className="h-3 w-0.5 bg-petrol" />
              <span className="h-3 w-0.5 bg-petrol" />
            </div>
          </div>
        </Reveal>

        <p className="mt-6 text-xs text-ink/50 max-w-2xl">
          Les résultats varient selon la situation clinique de chaque patient·e et
          ne constituent pas un engagement médical.
        </p>
      </div>
    </section>
  );
}
