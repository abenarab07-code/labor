import { Link } from "@tanstack/react-router";
import { Star, ArrowUpRight } from "lucide-react";
import { Reveal } from "./motion-primitives";
import { reelsTrust } from "@/content/reels";

export function TrustStrip() {
  return (
    <section id="preuves" className="py-10 md:py-14 bg-ivory">
      <div className="container-editorial">
        <Reveal>
          <div className="rounded-3xl border border-petrol/10 bg-mint/40 px-6 py-6 md:px-10 md:py-7 grid gap-6 md:grid-cols-[1fr_auto] items-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Stat
                value={reelsTrust.rating}
                label={reelsTrust.ratingLabel}
                icon={<Star className="h-4 w-4 fill-current" />}
              />
              <Stat value={reelsTrust.reviews} label={reelsTrust.reviewsLabel} />
              <Stat
                value={reelsTrust.community}
                label={reelsTrust.communityLabel}
              />
              <Stat value="✓" label={reelsTrust.badge} />
            </div>
            <Link
              to="/resultats"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-petrol text-ivory font-medium hover:bg-teal transition-colors whitespace-nowrap"
            >
              Voir tous les résultats
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-petrol font-serif text-2xl md:text-3xl">
        {icon && <span className="text-champagne">{icon}</span>}
        {value}
      </div>
      <div className="mt-1 text-xs text-ink/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
