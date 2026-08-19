import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { LaboratoryHero } from "@/components/site/LaboratoryHero";
import { LaboratoryAnalysisStage } from "@/components/site/LaboratoryAnalysisStage";
import { LaboratoryPageProgress } from "@/components/site/LaboratoryPageProgress";
import { LazyInView } from "@/components/site/LazyInView";

const LaboratoryAfterFold = lazy(() =>
  import("@/components/site/LaboratoryHome").then((module) => ({
    default: module.LaboratoryHome,
  })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Laboratoire Dr Tarfaya | Analyses & Hématologie à El Bouni, Annaba",
      },
      {
        name: "description",
        content:
          "Laboratoire d'analyses médicales, prélèvements et consultation spécialisée en hématologie à El Bouni, Annaba. Contact WhatsApp et demande de rendez-vous.",
      },
      { property: "og:title", content: "Dr Tarfaya — Votre sang raconte. Nous savons le lire." },
      {
        property: "og:description",
        content: "Analyses médicales et expertise en hématologie à El Bouni, Annaba.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      <LaboratoryPageProgress />
      <LaboratoryHero />
      <LaboratoryAnalysisStage />
      <LazyInView minHeight={3600} rootMargin="900px 0px">
        <LaboratoryAfterFold />
      </LazyInView>
    </SiteShell>
  );
}
