import { Header } from "./Header";
import { Footer } from "./Footer";
import { StickyMobileBar, FloatingWhatsApp } from "./StickyActions";
import type { ReactNode } from "react";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-20 lg:pb-0">{children}</main>
      <Footer />
      <StickyMobileBar />
      <FloatingWhatsApp />
    </>
  );
}
