import { ArrowUpRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { clinic } from "@/content/clinic";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-midnight-deep pb-[calc(5rem+env(safe-area-inset-bottom))] text-plasma lg:pb-0">
      <div className="container-editorial py-14 md:py-20">
        <div className="grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo variant="light" />
            <p className="mt-6 max-w-md font-display text-3xl leading-[1.05] text-white md:text-4xl">
              Comprendre le sang.
              <br />
              <em className="text-blue">Éclairer le diagnostic.</em>
            </p>
          </div>

          <div className="lg:col-span-3">
            <div className="brand-label text-blue">Accès</div>
            <address className="mt-5 not-italic text-sm leading-7 text-plasma/70">
              {clinic.address.line1}
              <br />
              {clinic.address.city}, {clinic.address.region}
            </address>
            <a
              href={clinic.mapsHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-white hover:text-blue"
            >
              <MapPin className="h-4 w-4" /> Itinéraire
            </a>
          </div>

          <div className="lg:col-span-4">
            <div className="brand-label text-blue">Contact direct</div>
            <div className="mt-5 grid gap-3">
              <a
                href={clinic.phoneHref}
                className="group flex items-center justify-between border-b border-white/10 pb-3 text-sm text-plasma/72 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue" />
                  {clinic.phone}
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href={buildWhatsAppUrl("default")}
                className="group flex items-center justify-between border-b border-white/10 pb-3 text-sm text-plasma/72 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue" />
                  WhatsApp
                </span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-[0.68rem] uppercase tracking-[0.12em] text-plasma/40 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Laboratoire Dr Tarfaya</p>
          <p>Annaba · El Bouni · Algérie</p>
          <p>Le site ne remplace pas une consultation médicale.</p>
        </div>
      </div>
    </footer>
  );
}
