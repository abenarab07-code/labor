import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowUpRight, MessageCircle, Check } from "lucide-react";
import { Reveal, MaskedTextReveal, MagneticButton } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";

const REASSURANCE = [
  "Demande sans engagement",
  "Confirmation manuelle par l'équipe",
  "Choix du créneau souhaité",
  "Réponse par téléphone ou WhatsApp",
];

export function FinalBooking() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bg = useTransform(scrollYProgress, [0, 0.4, 1], ["var(--color-ivory)", "var(--color-mint)", "var(--color-petrol)"]);

  return (
    <motion.section ref={ref} style={{ backgroundColor: bg }} className="py-20 md:py-28 min-h-[95svh] flex items-center transition-colors">
      <div className="container-editorial w-full">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-mint px-8 py-16 md:px-16 md:py-24">
            <div aria-hidden className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-champagne/20 blur-3xl" />

            <svg aria-hidden width="140" height="70" viewBox="0 0 140 70" className="mb-8">
              <motion.path
                d="M10 35 Q 70 75 130 35"
                stroke="var(--color-teal)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 1.1, ease: easings.easeInOut }}
              />
            </svg>

            <div className="relative max-w-3xl">
              <div className="eyebrow mb-5">Un dernier doute ?</div>
              <h2 className="font-serif text-4xl md:text-6xl text-petrol leading-[1.05]">
                <span className="block"><MaskedTextReveal>Vous ne savez pas encore</MaskedTextReveal></span>
                <span className="block"><MaskedTextReveal delay={0.12}>quel traitement</MaskedTextReveal> <span className="italic text-teal"><MaskedTextReveal delay={0.24}>choisir ?</MaskedTextReveal></span></span>
              </h2>
              <p className="mt-6 text-ink/70 max-w-xl">
                C'est normal. Chaque sourire est différent. La première étape consiste
                simplement à comprendre votre situation et les options adaptées à votre cas.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <MagneticButton
                  as="a"
                  href="/rendez-vous"
                  onClick={() => track("appointment_form_started", { from: "final_cta" })}
                  className="group relative overflow-hidden inline-flex items-center gap-2 rounded-full bg-petrol px-7 py-4 text-sm text-ivory hover:bg-ink transition-colors"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Commencer par un premier bilan
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[520ms] ease-out bg-gradient-to-r from-transparent via-ivory/10 to-transparent" />
                </MagneticButton>
                <a
                  href={buildWhatsAppUrl("default", { sourcePage: "Home / final CTA" })}
                  onClick={() => track("whatsapp_clicked", { from: "final_cta" })}
                  className="inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-4 text-sm text-petrol hover:bg-petrol/5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Poser une question sur WhatsApp
                </a>
              </div>

              <ul className="mt-10 grid gap-2 sm:grid-cols-2 max-w-xl">
                {REASSURANCE.map((r) => (
                  <li key={r} className="flex items-center gap-2 text-sm text-petrol/80">
                    <span className="h-5 w-5 rounded-full bg-petrol/10 text-petrol flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </motion.section>
  );
}

export { Link };
