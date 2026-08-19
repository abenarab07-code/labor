import { MapPin, Phone, MessageCircle, ArrowUpRight } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";
import { clinic } from "@/content/clinic";

export function LocationSplit() {
  // Google Maps embed (no API key required) centred on Cité Boushaki E, Bab Ezzouar.
  const mapSrc =
    "https://www.google.com/maps?q=36.7215,3.1870&z=16&hl=fr&output=embed";
  const svgRef = useRef<SVGSVGElement>(null);
  const inView = useInView(svgRef, { once: true, margin: "-120px" });

  return (
    <section id="contact" className="py-20 md:py-28 bg-petrol text-ivory relative overflow-hidden">
      {/* Topographic route reveal */}
      <svg
        ref={svgRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-30 pointer-events-none"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.path
            key={i}
            d={`M-50 ${120 + i * 90} Q 300 ${50 + i * 90} 600 ${140 + i * 90} T 1250 ${100 + i * 90}`}
            stroke="var(--color-mint)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 0.5 } : undefined}
            transition={{ duration: 1.4, delay: i * 0.12, ease: easings.easeInOut }}
          />
        ))}
        <motion.circle
          cx="820"
          cy="300"
          r="8"
          fill="var(--color-champagne)"
          initial={{ scale: 0, opacity: 0 }}
          animate={inView ? { scale: [0, 1.4, 1], opacity: 1 } : undefined}
          transition={{ duration: 0.8, delay: 1.2, ease: easings.easeOut }}
        />
      </svg>

      <div className="container-editorial relative">
        <Reveal className="max-w-2xl mb-12">
          <div className="eyebrow text-teal mb-4">Nous trouver</div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-ivory">
            À Bab Ezzouar,<br />
            <span className="italic text-mint">à quelques pas.</span>
          </h2>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[380px] rounded-3xl overflow-hidden border border-ivory/10">
              <iframe
                title="Localisation Beausourire Cabinet Dentaire"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full grayscale-[30%] contrast-[0.95]"
              />
              <a
                href={clinic.mapsHref}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-ivory text-petrol px-4 py-2.5 text-xs shadow-lift hover:bg-mint transition-colors"
              >
                Ouvrir l'itinéraire
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>

          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.8, ease: easings.easeOut, delay: 0.3 }}
          >
            <div className="rounded-3xl bg-ivory/[0.04] border border-ivory/10 p-8 md:p-10 h-full flex flex-col">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-mint mt-0.5 shrink-0" />
                <address className="not-italic text-ivory/90 leading-relaxed">
                  <div className="font-serif text-xl mb-1">Cabinet Beausourire</div>
                  {clinic.address.line1}<br />
                  {clinic.address.city}<br />
                  {clinic.address.region}, {clinic.address.country}
                </address>
              </div>

              <div className="mt-8 pt-8 border-t border-ivory/10">
                <div className="eyebrow text-teal mb-3">Horaires</div>
                <div className="space-y-2 text-sm">
                  {clinic.hours.map((h) => (
                    <div key={h.label} className="flex justify-between">
                      <span className="text-ivory/70">{h.label}</span>
                      <span className={h.closed ? "text-champagne" : "text-ivory"}>{h.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-8 flex flex-col gap-3">
                <a
                  href={clinic.phoneHref}
                  className="inline-flex items-center justify-between gap-2 rounded-full bg-mint text-petrol px-5 py-3.5 text-sm hover:bg-ivory transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Appeler
                  </span>
                  <span className="opacity-70 num-display">{clinic.phone}</span>
                </a>
                <a
                  href={clinic.whatsappHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory/25 text-ivory px-5 py-3.5 text-sm hover:bg-ivory/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Écrire sur WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
