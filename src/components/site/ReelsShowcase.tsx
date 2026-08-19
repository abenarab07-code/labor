import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "motion/react";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Volume2, VolumeX, X, ArrowUpRight, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { reels, type Reel } from "@/content/reels";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import { Reveal, MaskedTextReveal } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";

// Lazy-loaded viewer — only pulled in when a reel is opened
const LazyReelViewer = lazy(() =>
  import("./ReelViewer").then((m) => ({ default: m.ReelViewer })),
);


export function ReelsShowcase() {
  const [openReel, setOpenReel] = useState<Reel | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const sorted = [...reels].sort((a, b) => a.order - b.order);
  const featured = sorted.find((r) => r.featured) ?? sorted[0];
  // Center the featured card in the carousel order
  const ordered = (() => {
    const rest = sorted.filter((r) => r.id !== featured.id);
    const mid = Math.floor(rest.length / 2);
    return [...rest.slice(0, mid), featured, ...rest.slice(mid)];
  })();

  const onOpen = useCallback((r: Reel) => {
    setOpenReel(r);
    track("reel_opened", { id: r.id, treatment: r.treatment });
  }, []);
  const onClose = useCallback(() => setOpenReel(null), []);

  // Scroll-linked ambient motion for glows
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const spring = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.5 });
  const glowAY = useTransform(spring, [0, 1], [-40, 60]);
  const glowBY = useTransform(spring, [0, 1], [40, -60]);
  const glowAX = useTransform(spring, [0, 1], [-20, 30]);

  return (
    <section
      id="reels"
      ref={sectionRef}
      className="relative py-20 md:py-32 bg-ivory overflow-hidden scroll-mt-24"
    >
      {/* Ambient background glows */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-0 rounded-full"
        style={{
          top: "38%",
          left: "18%",
          width: 520,
          height: 520,
          x: glowAX,
          y: glowAY,
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(0,169,157,0.10) 0%, rgba(0,169,157,0) 70%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -z-0 rounded-full"
        style={{
          top: "28%",
          right: "12%",
          width: 460,
          height: 460,
          y: glowBY,
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(201,173,114,0.14) 0%, rgba(201,173,114,0) 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Subtle grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(rgba(6,62,69,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="container-editorial relative z-10">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] items-end mb-12 md:mb-16">
          <Reveal className="max-w-3xl">
            <div className="eyebrow mb-4 text-teal">Preuves visuelles</div>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-petrol leading-[1.05]">
              <span className="block">
                <MaskedTextReveal>Des résultats réels.</MaskedTextReveal>
              </span>
              <span className="block italic text-teal">
                <MaskedTextReveal delay={0.12}>Des sourires transformés.</MaskedTextReveal>
              </span>
            </h2>
            <p className="mt-6 text-lg text-ink/70 max-w-xl">
              Découvrez quelques soins et transformations réalisés avec précision au cabinet Beausourire.
            </p>
          </Reveal>

          {/* Header ornament cluster */}
          <div className="hidden md:flex items-end gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: easings.easeOut, delay: 0.15 }}
              className="rounded-2xl bg-mint/70 border border-teal/20 px-4 py-3 shadow-sm text-right"
            >
              <div className="text-[9px] uppercase tracking-[0.22em] text-teal font-bold">
                Note Google
              </div>
              <div className="font-serif text-2xl text-petrol leading-none mt-1">
                4,8<span className="text-base text-petrol/60">/5</span>
              </div>
              <div className="text-[10px] text-petrol/60 mt-0.5">42 avis patients</div>
            </motion.div>
            <RotatingBadge />
          </div>
        </div>
      </div>

      {/* Desktop featured carousel */}
      <div className="hidden md:block relative z-10">
        <FeaturedCarousel items={ordered} featuredId={featured.id} onOpen={onOpen} externallyPaused={openReel !== null} />
      </div>



      {/* Mobile snap rail */}
      <div className="md:hidden relative z-10">
        <MobileRail items={sorted} onOpen={onOpen} />
      </div>

      {/* CTA band */}
      <div className="container-editorial mt-10 md:mt-12 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl bg-petrol text-ivory px-6 md:px-10 py-6 md:py-7 shadow-xl">
          <div className="flex items-center gap-4">
            <span className="h-10 w-10 rounded-full bg-champagne/20 text-champagne flex items-center justify-center text-xs font-bold border border-champagne/40">
              39k+
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-champagne font-bold">
                Communauté Instagram
              </div>
              <div className="font-serif text-lg md:text-xl mt-0.5">
                Dr. Babaammi Menoubia · Bab Ezzouar
              </div>
            </div>
          </div>
          <motion.a
            href="/rendez-vous"
            whileHover={{ scale: 1.03 }}
            className="inline-flex items-center gap-2 rounded-full bg-champagne text-petrol px-6 py-3 text-sm font-semibold shadow-lg hover:bg-ivory transition-colors"
          >
            Réserver un bilan <ArrowUpRight className="h-4 w-4" />
          </motion.a>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-petrol/50 pt-6">
          <p className="max-w-md text-center md:text-left leading-relaxed">
            Résultats cliniques réels — publiés après consentement écrit du patient. Les résultats varient selon chaque situation.
          </p>
          <div className="flex items-center gap-6 font-medium tracking-wide uppercase">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal" /> Vidéos authentiques
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-champagne" /> Cas certifiés
            </span>
          </div>
        </div>
      </div>


      <AnimatePresence>
        {openReel && (
          <Suspense fallback={null}>
            <LazyReelViewer reel={openReel} onClose={onClose} />
          </Suspense>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------- Desktop featured carousel ---------- */

function FeaturedCarousel({
  items,
  featuredId,
  onOpen,
  externallyPaused = false,
}: {
  items: Reel[];
  featuredId: string;
  onOpen: (r: Reel) => void;
  externallyPaused?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(featuredId);

  // Pause sources combined into a single ref — avoids re-running the rAF effect on every hover
  const hoverPausedRef = useRef(false);
  const interactPausedRef = useRef(false);
  const offscreenPausedRef = useRef(true); // start paused until visible
  const hiddenPausedRef = useRef(typeof document !== "undefined" && document.hidden);
  const externalPausedRef = useRef(externallyPaused);

  useEffect(() => {
    externalPausedRef.current = externallyPaused;
  }, [externallyPaused]);

  const loopItems = [...items, ...items];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-reel-id]"));
    const io = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null;
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.reelId!;
          if (!best || e.intersectionRatio > best.ratio) best = { id, ratio: e.intersectionRatio };
        }
        if (best && best.ratio > 0.6) setActiveId(best.id);
      },
      { root: scroller, threshold: [0.4, 0.6, 0.8, 1] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items]);

  // Continuous auto-scroll — single rAF loop, ref-driven pauses (no effect re-runs)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let raf = 0;
    let last = performance.now();
    const speed = 40; // px per second

    // Cache halfScrollWidth on mount + ResizeObserver — never read scrollWidth per frame
    let halfScrollWidth = scroller.scrollWidth / 2;
    const measure = () => {
      halfScrollWidth = scroller.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scroller);
    Array.from(scroller.children).forEach((c) => ro.observe(c as Element));

    const isPaused = () =>
      hoverPausedRef.current ||
      interactPausedRef.current ||
      offscreenPausedRef.current ||
      hiddenPausedRef.current ||
      externalPausedRef.current;

    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!isPaused()) {
        let next = scroller.scrollLeft + speed * dt;
        if (halfScrollWidth > 0 && next >= halfScrollWidth) next -= halfScrollWidth;
        scroller.scrollLeft = next;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    let interactTimer: ReturnType<typeof setTimeout> | null = null;
    const pauseBriefly = () => {
      interactPausedRef.current = true;
      if (interactTimer) clearTimeout(interactTimer);
      interactTimer = setTimeout(() => {
        interactPausedRef.current = false;
      }, 2200);
    };
    scroller.addEventListener("wheel", pauseBriefly, { passive: true });
    scroller.addEventListener("touchstart", pauseBriefly, { passive: true });

    // Pause when the section leaves the viewport
    const vio = new IntersectionObserver(
      ([entry]) => {
        offscreenPausedRef.current = !entry?.isIntersecting;
        if (entry?.isIntersecting) last = performance.now();
      },
      { threshold: 0 },
    );
    vio.observe(scroller);

    // Pause when the tab is hidden
    const onVis = () => {
      hiddenPausedRef.current = document.hidden;
      if (!document.hidden) last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scroller.removeEventListener("wheel", pauseBriefly);
      scroller.removeEventListener("touchstart", pauseBriefly);
      vio.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (interactTimer) clearTimeout(interactTimer);
    };
  }, []);


  const scrollByCard = (dir: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    interactPausedRef.current = true;
    scroller.scrollBy({ left: dir * 360, behavior: "smooth" });
    setTimeout(() => {
      interactPausedRef.current = false;
    }, 2500);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        hoverPausedRef.current = true;
      }}
      onMouseLeave={() => {
        hoverPausedRef.current = false;
      }}
    >




      <div
        ref={scrollerRef}
        className="flex gap-6 lg:gap-8 overflow-x-auto px-[max(1.5rem,calc((100vw-72rem)/2))] pb-14 items-stretch scrollbar-none"
        style={{
          scrollbarWidth: "none",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        {loopItems.map((reel, i) => (
          <CarouselCard
            key={`${reel.id}-${i}`}
            reel={reel}
            active={activeId === reel.id}
            onOpen={onOpen}
            enableLayoutId={i < items.length}
          />
        ))}

      </div>


      {/* Nav controls */}
      <div className="container-editorial pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between z-20">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Précédent"
          className="pointer-events-auto h-12 w-12 rounded-full bg-ivory/80 backdrop-blur-md border border-petrol/15 text-petrol hover:bg-petrol hover:text-ivory hover:border-petrol transition-all duration-300 flex items-center justify-center shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Suivant"
          className="pointer-events-auto h-12 w-12 rounded-full bg-ivory/80 backdrop-blur-md border border-petrol/15 text-petrol hover:bg-petrol hover:text-ivory hover:border-petrol transition-all duration-300 flex items-center justify-center shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/* ---------- Side ornaments (rotating badge + floating chips) ---------- */




function RotatingBadge() {
  return (
    <div className="relative h-[132px] w-[132px]">
      <motion.svg
        viewBox="0 0 132 132"
        className="absolute inset-0 h-full w-full text-petrol/80"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <path
            id="reels-circle"
            d="M 66,66 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
          />
        </defs>
        <text fill="currentColor" fontSize="9" letterSpacing="3.6" fontWeight="600">
          <textPath href="#reels-circle" startOffset="0">
            RÉSULTATS RÉELS · CABINET BEAUSOURIRE · ALGER ·
          </textPath>
        </text>
      </motion.svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-champagne text-petrol flex items-center justify-center shadow-lg">
          <Play className="h-5 w-5 fill-current translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}

function CarouselCard({
  reel,
  active,
  onOpen,
  enableLayoutId = true,
}: {
  reel: Reel;
  active: boolean;
  onOpen: (r: Reel) => void;
  enableLayoutId?: boolean;
}) {

  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [hovered]);

  return (
    <motion.div
      ref={ref}
      data-reel-id={reel.id}
      className="snap-center shrink-0 w-[320px]"
      animate={{ opacity: active ? 1 : 0.82 }}
      transition={{ duration: 0.5, ease: easings.easeOut }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.button
        type="button"
        layoutId={enableLayoutId ? `reel-${reel.id}` : undefined}
        onClick={() => onOpen(reel)}
        className="group relative block w-full text-left overflow-hidden rounded-[32px] bg-petrol text-ivory shadow-xl"
        whileHover={{ y: -6 }}
        transition={{ duration: 0.4, ease: easings.easeOut }}
        style={{
          aspectRatio: "9 / 16",
          boxShadow: active
            ? "0 30px 80px -30px rgba(6,62,69,0.55), 0 0 0 3px rgba(201,173,114,0.18)"
            : "0 22px 50px -25px rgba(6,62,69,0.4)",
        }}
      >
        <img
          src={reel.posterUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.06]"
        />
        <video
          ref={videoRef}
          src={reel.videoUrl}
          poster={reel.posterUrl}
          muted
          playsInline
          loop
          preload="none"
          className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-petrol via-petrol/40 to-transparent" />
        {active && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(160deg, rgba(201,173,114,0.22), rgba(201,173,114,0) 40%, rgba(0,0,0,0) 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {reel.featured && (
          <div className="absolute top-5 left-5">
            <span className="px-3.5 py-1.5 bg-champagne text-petrol text-[10px] font-bold uppercase tracking-[0.18em] rounded-full shadow-lg">
              À la une
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-16 w-16 rounded-full bg-ivory/15 backdrop-blur-md border border-ivory/25 flex items-center justify-center group-hover:bg-teal/60 transition-colors duration-500">
            <Play className="h-5 w-5 text-ivory fill-ivory ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-[10px] uppercase tracking-[0.22em] font-bold text-teal">
            {reel.treatment}
          </div>
          <div className="mt-2 font-serif text-xl leading-tight">{reel.title}</div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-champagne uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Voir le cas</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

/* ---------- Mobile rail (unchanged) ---------- */

function MobileRail({ items, onOpen }: { items: Reel[]; onOpen: (r: Reel) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(
    items.find((r) => r.featured)?.id ?? items[0]?.id ?? null,
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll<HTMLElement>("[data-reel-id]"));
    const io = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null;
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.reelId!;
          if (!best || e.intersectionRatio > best.ratio) best = { id, ratio: e.intersectionRatio };
        }
        if (best && best.ratio > 0.7) setActiveId(best.id);
      },
      { root: scroller, threshold: [0.4, 0.7, 1] },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [items]);

  return (
    <div
      ref={scrollerRef}
      className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-2 -mx-6 scrollbar-none"
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((reel) => {
        const active = activeId === reel.id;
        return (
          <div key={reel.id} data-reel-id={reel.id} className="snap-center shrink-0 w-[78vw] max-w-[320px]">
            <motion.button
              type="button"
              layoutId={`reel-${reel.id}`}
              onClick={() => onOpen(reel)}
              className="relative w-full aspect-[9/16] overflow-hidden rounded-3xl bg-petrol text-ivory shadow-xl"
            >
              <img src={reel.posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              {active && <MobileAutoVideo url={reel.videoUrl} poster={reel.posterUrl} />}
              <div className="absolute inset-0 bg-gradient-to-t from-petrol via-petrol/40 to-transparent" />
              {reel.featured && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-champagne text-petrol text-[9px] font-bold uppercase tracking-[0.18em] rounded-full shadow-lg">
                    À la une
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <div className="text-[10px] uppercase tracking-[0.18em] text-teal font-bold">{reel.treatment}</div>
                <div className="mt-1 font-serif text-lg leading-snug line-clamp-2">{reel.title}</div>
              </div>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}

function MobileAutoVideo({ url, poster }: { url: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    ref.current?.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      src={url}
      poster={poster}
      muted
      playsInline
      loop
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

export { ReelCtaButton } from "./ReelViewer";

