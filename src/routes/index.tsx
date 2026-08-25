import { createFileRoute } from "@tanstack/react-router";
import { lazy, useEffect } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { LaboratoryHero } from "@/components/site/LaboratoryHero";
import { LaboratoryPageProgress } from "@/components/site/LaboratoryPageProgress";
import { LazyInView } from "@/components/site/LazyInView";
import heroDiagnostic640 from "@/assets/brand/hero-diagnostic-640.avif";
import heroDiagnostic1080 from "@/assets/brand/hero-diagnostic-1080.avif";

const LaboratoryAfterFold = lazy(() =>
  import("@/components/site/LaboratoryHome").then((module) => ({
    default: module.LaboratoryHome,
  })),
);

const loadLaboratoryAnalysisStage = () =>
  import("@/components/site/LaboratoryAnalysisStage").then((module) => ({
    default: module.LaboratoryAnalysisStage,
  }));

const LaboratoryAnalysisStage = lazy(loadLaboratoryAnalysisStage);

const analysisHashes = ["analyses"] as const;
const afterFoldHashes = [
  "hematologie",
  "parcours",
  "docteur",
  "questions",
  "contact",
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Laboratoire Dr Tarfaya | Analyses médicales à Annaba, El Bouni",
      },
      {
        name: "description",
        content:
          "Laboratoire d'analyses médicales, biochimie, hématologie, hormonologie, immunologie et cytologie à Annaba, El Bouni. Contact WhatsApp et rendez-vous.",
      },
      {
        property: "og:title",
        content: "Dr Tarfaya — Une interprétation claire et précise.",
      },
      {
        property: "og:description",
        content:
          "Analyses médicales, biochimie, hématologie et cytologie à Annaba, El Bouni.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      {
        rel: "preload",
        as: "image",
        type: "image/avif",
        href: heroDiagnostic1080,
        imageSrcSet: `${heroDiagnostic640} 640w, ${heroDiagnostic1080} 1080w`,
        imageSizes: "(min-width: 1024px) 540px, calc(100vw - 40px)",
        fetchPriority: "high",
      },
    ],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    let prefetched = false;
    const prefetchAnalysis = () => {
      if (prefetched) return;
      prefetched = true;
      void loadLaboratoryAnalysisStage();
    };
    const passiveOnce = { passive: true, once: true } as const;
    window.addEventListener("scroll", prefetchAnalysis, passiveOnce);
    window.addEventListener("wheel", prefetchAnalysis, passiveOnce);
    window.addEventListener("touchstart", prefetchAnalysis, passiveOnce);
    window.addEventListener("pointerdown", prefetchAnalysis, passiveOnce);
    window.addEventListener("keydown", prefetchAnalysis, { once: true });
    return () => {
      window.removeEventListener("scroll", prefetchAnalysis);
      window.removeEventListener("wheel", prefetchAnalysis);
      window.removeEventListener("touchstart", prefetchAnalysis);
      window.removeEventListener("pointerdown", prefetchAnalysis);
      window.removeEventListener("keydown", prefetchAnalysis);
    };
  }, []);

  return (
    <SiteShell>
      <LaboratoryPageProgress />
      <LaboratoryHero />
      <LazyInView
        id="analyses"
        className="scroll-mt-24 min-h-[1460px] min-[390px]:min-h-[1540px] md:min-h-[300svh]"
        rootMargin="700px 0px"
        mountOnHash={analysisHashes}
      >
        <LaboratoryAnalysisStage />
      </LazyInView>
      <LazyInView
        minHeight={3600}
        rootMargin="1600px 0px"
        mountOnHash={afterFoldHashes}
      >
        <LaboratoryAfterFold />
      </LazyInView>
    </SiteShell>
  );
}
