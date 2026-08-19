import { Reveal, Stagger, StaggerItem } from "./motion-primitives";
import { doctor } from "@/content/doctor";
import instruments from "@/assets/instruments.jpg";

export function DoctorTrust() {
  return (
    <section className="py-24 md:py-32 bg-ivory">
      <div className="container-editorial">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <Reveal className="lg:col-span-6 order-2 lg:order-1">
            <div className="eyebrow mb-4">La praticienne</div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] text-petrol leading-[1.08]">
              Une approche fondée sur<br />
              <span className="italic text-teal">l'écoute, la précision</span><br />
              et le suivi.
            </h2>
            <div className="mt-8 space-y-1">
              <div className="font-serif text-xl text-petrol">{doctor.name}</div>
              <div className="text-sm text-ink/60">{doctor.title}</div>
            </div>

            <svg
              width="120"
              height="24"
              viewBox="0 0 120 24"
              className="mt-4 text-champagne"
              aria-hidden
            >
              <path
                d="M2 18 Q 20 4 40 14 T 80 12 T 118 8"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>

            <Stagger className="mt-10 grid sm:grid-cols-2 gap-5">
              {doctor.approach.map((a) => (
                <StaggerItem key={a.label}>
                  <div className="border-t border-border pt-4">
                    <div className="text-teal text-xs uppercase tracking-[0.2em] mb-1.5">
                      {a.label}
                    </div>
                    <p className="text-sm text-ink/75 leading-relaxed">{a.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>

          <Reveal className="lg:col-span-6 order-1 lg:order-2" delay={0.15}>
            <div className="relative">
              <div className="aspect-[5/6] overflow-hidden rounded-[2rem]">
                <img
                  src={instruments}
                  alt="Instruments de précision disposés sur un linge ivoire"
                  width={1408}
                  height={1008}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                aria-hidden
                className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full border border-teal/30"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
