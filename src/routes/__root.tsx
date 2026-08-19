import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { clinic } from "../content/clinic";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow mb-4">Page introuvable</div>
        <h1 className="font-serif text-6xl text-petrol">404</h1>
        <p className="mt-4 text-sm text-ink/70">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-petrol px-6 py-3 text-sm text-ivory hover:bg-ink transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-petrol">Cette page n'a pas pu se charger</h1>
        <p className="mt-3 text-sm text-ink/70">
          Un incident temporaire s'est produit. Vous pouvez réessayer ou revenir à l'accueil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-petrol px-6 py-3 text-sm text-ivory hover:bg-ink"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="rounded-full border border-petrol/25 px-6 py-3 text-sm text-petrol hover:bg-petrol/5"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Laboratoire Dr Tarfaya | Analyses & Hématologie à El Bouni, Annaba" },
      {
        name: "description",
        content:
          "Analyses médicales, prélèvements et consultation spécialisée en hématologie à El Bouni, Annaba.",
      },
      { name: "author", content: "Laboratoire Dr Tarfaya" },
      { name: "theme-color", content: "#071A2B" },
      { property: "og:site_name", content: "Laboratoire Dr Tarfaya" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Dr Tarfaya — Votre sang raconte. Nous savons le lire." },
      { name: "twitter:title", content: "Dr Tarfaya — Analyses & Hématologie" },
      {
        property: "og:description",
        content: "Laboratoire d'analyses médicales et expertise en hématologie à El Bouni, Annaba.",
      },
      {
        name: "twitter:description",
        content: "Laboratoire d'analyses médicales et expertise en hématologie à El Bouni, Annaba.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalClinic",
          name: clinic.fullName,
          telephone: clinic.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: clinic.address.line1,
            addressLocality: clinic.address.city,
            addressRegion: clinic.address.region,
            addressCountry: "DZ",
          },
          medicalSpecialty: "Hematologic",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr-DZ">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
