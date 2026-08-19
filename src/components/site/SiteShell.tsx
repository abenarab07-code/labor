import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyMobileBar, FloatingWhatsApp } from "./StickyActions";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-md bg-white px-4 py-3 text-sm font-semibold text-midnight shadow-lg transition-transform focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <Header />
      <main id="main-content" className="pb-20 lg:pb-0">
        {children}
      </main>
      <Footer />
      <StickyMobileBar />
      <FloatingWhatsApp />
    </>
  );
}
