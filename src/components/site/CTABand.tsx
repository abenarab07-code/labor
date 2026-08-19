import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Reveal } from "./motion-primitives";
import { clinic } from "@/content/clinic";

export function CTABand() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-editorial">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-mint px-8 py-16 md:px-16 md:py-24 text-center">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-champagne/20 blur-3xl"
            />

            <div className="relative">
              <div className="eyebrow mb-5">Prêt·e à commencer ?</div>
              <h2 className="font-serif text-4xl md:text-6xl text-petrol max-w-3xl mx-auto leading-[1.05]">
                Réservons votre première consultation
                <span className="italic text-teal"> ensemble.</span>
              </h2>
              <p className="mt-6 text-ink/70 max-w-lg mx-auto">
                Un premier échange pour comprendre votre demande et poser
                sereinement les bases d'un plan de soin.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  to="/rendez-vous"
                  className="inline-flex items-center gap-2 rounded-full bg-petrol px-7 py-4 text-sm text-ivory hover:bg-ink transition-colors"
                >
                  Demander un rendez-vous
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a
                  href={clinic.whatsappHref}
                  className="inline-flex items-center gap-2 rounded-full border border-petrol/25 px-6 py-4 text-sm text-petrol hover:bg-petrol/5"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
