import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SiteShell } from "@/components/site/SiteShell";
import { AppointmentFunnel } from "@/components/site/AppointmentFunnel";
import { Reveal } from "@/components/site/motion-primitives";
import { clinic } from "@/content/clinic";
import { Phone, MessageCircle } from "lucide-react";

const searchSchema = z.object({
  soin: z.string().optional(),
});

export const Route = createFileRoute("/rendez-vous")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Demander un rendez-vous — Laboratoire Dr Tarfaya" },
      {
        name: "description",
        content:
          "Demandez un rendez-vous pour une analyse ou une consultation en hématologie au laboratoire Dr Tarfaya à El Bouni.",
      },
      { property: "og:title", content: "Demander un rendez-vous — Dr Tarfaya" },
      { property: "og:description", content: "Demande de rendez-vous en quelques étapes." },
      { property: "og:url", content: "/rendez-vous" },
    ],
    links: [{ rel: "canonical", href: "/rendez-vous" }],
  }),
  component: Page,
});

function Page() {
  const { soin } = Route.useSearch();
  return (
    <SiteShell>
      <section className="pt-32 md:pt-40 pb-24 bg-gradient-to-b from-mint/40 via-ivory to-ivory">
        <div className="container-editorial grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="eyebrow mb-4">Demande de rendez-vous</div>
            <h1 className="font-serif text-5xl md:text-6xl text-petrol leading-[1.05]">
              Clarifions
              <br />
              <span className="italic text-teal">la prochaine étape.</span>
            </h1>
            <p className="mt-6 text-ink/70 max-w-md">
              Analyse, prélèvement ou consultation en hématologie: indiquez votre besoin et l'équipe
              vous recontactera selon la disponibilité du service.
            </p>

            <div className="mt-10 space-y-3">
              <a
                href={clinic.phoneHref}
                className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-teal/50 transition-colors"
              >
                <Phone className="h-4 w-4 text-teal" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink/60">Téléphone</div>
                  <div className="font-serif text-lg text-petrol">{clinic.phone}</div>
                </div>
              </a>
              <a
                href={clinic.whatsappHref}
                className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-teal/50 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-teal" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink/60">WhatsApp</div>
                  <div className="font-serif text-lg text-petrol">{clinic.whatsapp}</div>
                </div>
              </a>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <AppointmentFunnel initialService={soin} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
