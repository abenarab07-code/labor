import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useState } from "react";
import { Reveal } from "./motion-primitives";
import { videos } from "@/content/videos";

export function VideoShowcase() {
  const [active, setActive] = useState(videos[0]);

  return (
    <section className="py-20 md:py-28">
      <div className="container-editorial">
        <Reveal className="max-w-2xl mb-12">
          <div className="eyebrow mb-4">En images</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-petrol">
            Découvrez notre approche<br />
            <span className="italic text-teal">en images.</span>
          </h2>
          <p className="mt-6 text-ink/70">
            Une sélection de courtes vidéos qui donnent à voir la clinique, le
            parcours patient et les soins. Les contenus originaux seront ajoutés
            prochainement.
          </p>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            key={active.id}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <VideoPlaceholder title={active.title} category={active.category} featured />
          </motion.div>

          <div className="space-y-3">
            {videos.slice(0, 5).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActive(v)}
                className={`w-full text-left flex items-center gap-4 rounded-2xl border p-3 transition-all ${
                  active.id === v.id
                    ? "border-teal/50 bg-mint/40"
                    : "border-border/70 bg-card hover:border-teal/30"
                }`}
              >
                <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-petrol/95 flex items-center justify-center">
                  <Play className="h-4 w-4 text-mint" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-teal uppercase tracking-wider">
                    {v.category}
                  </div>
                  <div className="font-serif text-lg text-petrol truncate">
                    {v.title}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoPlaceholder({
  title,
  category,
  featured = false,
}: {
  title: string;
  category: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-petrol text-ivory ${
        featured ? "aspect-video" : "aspect-video"
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, var(--color-teal) 0%, transparent 50%), radial-gradient(circle at 70% 80%, var(--color-mint) 0%, transparent 40%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-mint">{category}</span>
          <span className="text-xs text-ivory/50 uppercase tracking-wider">
            Vidéo à venir
          </span>
        </div>
        <div className="flex items-end justify-between gap-6">
          <h3 className="font-serif text-3xl md:text-4xl">{title}</h3>
          <button
            type="button"
            className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-mint text-petrol flex items-center justify-center hover:bg-ivory transition-colors shrink-0"
            aria-label="Lire la vidéo"
          >
            <Play className="h-5 w-5 fill-current translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
