import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Calendar } from "lucide-react";
import { clinic } from "@/content/clinic";
import { buildWhatsAppUrl, type WhatsAppContext } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";

export function StickyMobileBar({
  context = "default",
}: {
  context?: WhatsAppContext;
}) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-ivory/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-3 divide-x divide-border/60">
        <a
          href={clinic.phoneHref}
          onClick={() => track("phone_clicked", { from: "sticky_mobile" })}
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-petrol"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </a>
        <a
          href={buildWhatsAppUrl(context)}
          onClick={() => track("whatsapp_clicked", { from: "sticky_mobile" })}
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-petrol"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <Link
          to="/rendez-vous"
          preload="intent"
          onClick={() =>
            track("appointment_form_started", { from: "sticky_mobile" })
          }
          className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-ivory bg-petrol"
        >
          <Calendar className="h-4 w-4" />
          Réserver
        </Link>
      </div>
    </div>
  );
}

export function FloatingWhatsApp({
  context = "default",
}: {
  context?: WhatsAppContext;
}) {
  return (
    <a
      href={buildWhatsAppUrl(context)}
      onClick={() => track("whatsapp_clicked", { from: "floating" })}
      aria-label="Contacter par WhatsApp"
      className="hidden lg:inline-flex fixed bottom-6 right-6 z-40 items-center gap-2 rounded-full bg-teal px-5 py-3 text-sm text-ivory shadow-lift hover:bg-petrol transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  );
}
