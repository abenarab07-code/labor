import { Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
} from "motion/react";
import { useRef } from "react";
import { ArrowUpRight, Star, MapPin } from "lucide-react";
import { MaskedTextReveal, MagneticButton } from "@/motion/primitives";
import { easings } from "@/motion/motion-tokens";
import { useReducedMotionMode, useSectionActive } from "@/motion/hooks";
import { clinic } from "@/content/clinic";
import { track } from "@/lib/analytics";
import heroPortrait from "@/assets/hero-portrait.webp.asset.json";

/**
 * Signature hero — clean, cinematic, premium.
 *
 * Composition: two-zone editorial layout, deep petrol atmosphere, a single
 * framed hero portrait that feels dimensional through layered shadows,
 * a soft ivory light source, subtle parallax and a slow ambient float.
 *
 * Entrance timeline (≈ 1.6s, page interactive from first frame):
 *   0.00s   backdrop + ivory light in
 *   0.15s   media frame curtain reveal (clip-path)
 *   0.55s   eyebrow line
 *   0.65s   headline reveals line by line (masked)
 *   1.00s   supporting copy
 *   1.15s   primary CTA
 *   1.25s   secondary CTAs
 *   1.40s   trust chips
 *
 * Scroll: the framed media scales down + drifts, headline lifts and fades,
 * handing off cinematically into the results reel section beneath.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotionMode();
  const active = useSectionActive(ref);


  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const spring = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.4,
  });

  // Cinematic handoff to reels: media shrinks, drifts and softens
  const mediaScale = useTransform(spring, [0, 1], [1, 0.88]);
  const mediaY = useTransform(spring, [0, 1], [0, 60]);
  const mediaOpacity = useTransform(spring, [0, 0.85, 1], [1, 0.75, 0.4]);
  const headlineY = useTransform(spring, [0, 1], [0, -32]);
  const headlineOpacity = useTransform(spring, [0, 0.55, 1], [1, 0.6, 0.15]);
  const lightY = useTransform(spring, [0, 1], [0, -60]);

  // Pointer-driven parallax tilt on the framed portrait
  const px = useMotionValue(0); // -1..1
  const py = useMotionValue(0); // -1..1
  const rx = useSpring(useTransform(py, [-1, 1], [8, -8]), {
    stiffness: 120,
    damping: 18,
  });
  const ry = useSpring(useTransform(px, [-1, 1], [-10, 10]), {
    stiffness: 120,
    damping: 18,
  });
  const glowX = useSpring(useTransform(px, [-1, 1], [-40, 40]), {
    stiffness: 90,
    damping: 20,
  });
  const glowY = useSpring(useTransform(py, [-1, 1], [-40, 40]), {
    stiffness: 90,
    damping: 20,
  });
  const sheenBg = useMotionTemplate`radial-gradient(60% 45% at calc(50% + ${glowX}px) calc(38% + ${glowY}px), rgba(250,249,245,0.28) 0%, rgba(221,247,242,0.08) 45%, rgba(0,0,0,0) 75%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    px.set(Math.max(-1, Math.min(1, nx)));
    py.set(Math.max(-1, Math.min(1, ny)));
  };
  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
  };


  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] flex items-center pt-28 pb-24 md:pt-32 md:pb-32 overflow-clip"
    >
      {/* Atmospheric petrol backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(140% 90% at 50% 8%, #0b545c 0%, #063E45 55%, #04262c 100%)",
        }}
      />
      {/* Soft ivory light source, drifts up on scroll */}
      <motion.div
        aria-hidden
        className="absolute -z-10 pointer-events-none"
        style={{
          top: "-22%",
          left: "50%",
          width: "90vw",
          height: "90vw",
          x: "-50%",
          y: reduced ? undefined : lightY,
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(250,249,245,0.28) 0%, rgba(221,247,242,0.08) 40%, rgba(250,249,245,0) 72%)",
          filter: "blur(12px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: easings.easeOut }}
      />
      {/* Subtle grain */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {/* Champagne accent glow behind media */}
      <div
        aria-hidden
        className="absolute -z-10 pointer-events-none hidden md:block"
        style={{
          top: "18%",
          right: "-8%",
          width: 620,
          height: 620,
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(201,173,114,0.18) 0%, rgba(201,173,114,0) 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="container-editorial w-full relative">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-center">
          {/* Copy column */}
          <motion.div
            className="lg:col-span-6 xl:col-span-6"
            style={reduced ? undefined : { y: headlineY, opacity: headlineOpacity }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: easings.easeOut }}
              className="flex items-center gap-2 mb-6"
            >
              <span className="h-px w-8 bg-mint/70" />
              <span className="eyebrow text-mint/85">
                Cabinet dentaire · Dr. Babaammi Menoubia
              </span>
            </motion.div>

            <h1 className="font-serif text-[2.2rem] leading-[1.06] sm:text-[2.9rem] lg:text-[3.6rem] xl:text-[4rem] text-ivory">
              <span className="block">
                <MaskedTextReveal delay={0.22}>Votre sourire mérite</MaskedTextReveal>
              </span>
              <span className="block italic text-mint">
                <MaskedTextReveal delay={0.32}>une transformation</MaskedTextReveal>
              </span>
              <span className="block">
                <MaskedTextReveal delay={0.42}>pensée dans les moindres détails.</MaskedTextReveal>
              </span>
            </h1>

            <motion.p
              className="mt-6 max-w-xl text-base md:text-lg text-mint/80 leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: easings.easeOut }}
            >
              Esthétique, aligneurs, implants et soins dentaires à Bab Ezzouar.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.6, ease: easings.easeOut }}
            >
              <MagneticButton
                as="a"
                href="/rendez-vous"
                onClick={() => track("appointment_form_started", { from: "hero" })}
                className="group inline-flex items-center gap-2 rounded-full bg-mint px-7 py-4 text-sm text-petrol hover:bg-ivory transition-colors shadow-[0_10px_30px_-12px_rgba(0,169,157,0.55)]"
              >
                Réserver mon bilan
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </MagneticButton>
              <a
                href="#reels"
                className="inline-flex items-center gap-2 rounded-full border border-mint/25 px-6 py-4 text-sm text-mint hover:bg-mint/10 transition-colors"
              >
                Voir les résultats
              </a>
              <a
                href={clinic.mapsHref}
                target="_blank"
                rel="noreferrer"
                onClick={() => track("maps_clicked", { from: "hero" })}
                className="inline-flex items-center gap-1.5 py-4 px-2 text-sm text-mint/70 hover:text-mint"
              >
                <MapPin className="h-4 w-4" />
                Nous trouver
              </a>
            </motion.div>

            <motion.div
              className="mt-10 flex flex-wrap gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
            >
              <TrustChip
                value={clinic.socialProof.googleRating + "/5"}
                label="sur Google"
                stars
              />
              <TrustChip
                value={clinic.socialProof.googleReviews.toString()}
                label="avis patients"
              />
              <TrustChip
                value={clinic.socialProof.instagramFollowers}
                label="communauté"
              />
            </motion.div>
          </motion.div>

          {/* Media column — cinematic frame with pointer parallax + orbital motion graphics */}
          <div className="lg:col-span-6 xl:col-span-6 relative">
            <motion.div
              className="relative mx-auto"
              style={{
                maxWidth: 520,
                y: reduced ? undefined : mediaY,
                scale: reduced ? undefined : mediaScale,
                opacity: reduced ? undefined : mediaOpacity,
                perspective: 1400,
              }}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              {/* Orbital signature — concentric dashed rings that echo the gold tooth logo */}
              {!reduced && active && (
                <motion.svg
                  aria-hidden
                  viewBox="0 0 400 400"
                  className="absolute left-1/2 top-1/2 -z-10 h-[128%] w-[128%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.4, delay: 0.4, ease: easings.easeOut }}
                >
                  <defs>
                    <radialGradient id="hero-orbit-fade" cx="50%" cy="50%" r="50%">
                      <stop offset="55%" stopColor="rgba(201,173,114,0)" />
                      <stop offset="100%" stopColor="rgba(201,173,114,0.55)" />
                    </radialGradient>
                  </defs>
                  <motion.g
                    style={{ transformOrigin: "200px 200px" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                  >
                    <circle
                      cx="200"
                      cy="200"
                      r="188"
                      fill="none"
                      stroke="url(#hero-orbit-fade)"
                      strokeWidth="0.8"
                      strokeDasharray="1 6"
                    />
                    <circle cx="200" cy="12" r="2.5" fill="#C9AD72" />
                  </motion.g>
                  <motion.g
                    style={{ transformOrigin: "200px 200px" }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
                  >
                    <circle
                      cx="200"
                      cy="200"
                      r="164"
                      fill="none"
                      stroke="rgba(0,169,157,0.35)"
                      strokeWidth="0.6"
                      strokeDasharray="2 10"
                    />
                    <circle cx="36" cy="200" r="1.8" fill="#00A99D" />
                    <circle cx="364" cy="200" r="1.8" fill="#DDF7F2" />
                  </motion.g>
                  <motion.circle
                    cx="200"
                    cy="200"
                    r="146"
                    fill="none"
                    stroke="rgba(221,247,242,0.18)"
                    strokeWidth="0.5"
                    animate={{ strokeDashoffset: [0, -60] }}
                    strokeDasharray="4 8"
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  />
                </motion.svg>
              )}

              {/* Depth: soft cast shadow behind frame */}
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[36px] -z-10"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 60%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
                  filter: "blur(28px)",
                }}
              />
              {/* Champagne rim halo */}
              <div
                aria-hidden
                className="absolute -inset-1 rounded-[30px] -z-10"
                style={{
                  background:
                    "linear-gradient(150deg, rgba(201,173,114,0.35), rgba(221,247,242,0.15) 40%, rgba(0,0,0,0) 70%)",
                }}
              />

              {/* Ambient float — subtle life without distraction */}
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.05, ease: easings.easeOut }}
                className="relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  animate={
                    reduced || !active
                      ? undefined
                      : { y: [0, -8, 0] }
                  }

                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                  style={{
                    transformStyle: "preserve-3d",
                    rotateX: reduced ? undefined : rx,
                    rotateY: reduced ? undefined : ry,
                  }}
                >
                  {/* Media frame with curtain reveal */}
                  <motion.div
                    initial={{ clipPath: reduced ? "inset(0)" : "inset(100% 0 0 0)" }}
                    animate={{ clipPath: "inset(0)" }}
                    transition={{
                      duration: reduced ? 0.3 : 0.8,
                      delay: 0.1,
                      ease: easings.easeInOut,
                    }}
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-petrol/40 ring-1 ring-ivory/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55),0_10px_30px_-15px_rgba(0,0,0,0.45)]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <motion.img
                      src={heroPortrait.url}
                      alt="Sourire éditorial serein — atelier Beausourire."
                      width={1408}
                      height={1600}
                      initial={{ scale: reduced ? 1 : 1.12 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: reduced ? 0.3 : 1.2,
                        delay: 0.1,
                        ease: easings.easeOut,
                      }}
                      className="h-full w-full object-cover"
                      style={{ transform: "translateZ(0)" }}
                    />

                    {/* Pointer-reactive light */}
                    {!reduced && active && (
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 mix-blend-screen"
                        style={{ background: sheenBg }}
                      />
                    )}

                    {/* Top ivory sheen for glossy dimension */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(250,249,245,0.18) 0%, rgba(250,249,245,0) 100%)",
                      }}
                    />
                    {/* Bottom vignette for depth */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
                      style={{
                        background:
                          "linear-gradient(0deg, rgba(6,62,69,0.55) 0%, rgba(6,62,69,0) 100%)",
                      }}
                    />

                    {/* Repeating champagne light sweep */}
                    {!reduced && active && (
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
                        style={{
                          background:
                            "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(201,173,114,0.28) 45%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0) 100%)",
                          mixBlendMode: "screen",
                        }}
                        initial={{ x: 0 }}
                        animate={{ x: ["0%", "480%"] }}
                        transition={{
                          duration: 3.6,
                          delay: 1.2,
                          ease: easings.easeInOut,
                          repeat: Infinity,
                          repeatDelay: 5.5,
                        }}
                      />
                    )}

                    {/* Scanline — precision brand motif */}
                    {!reduced && active && (
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 h-px"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(0,169,157,0) 0%, rgba(0,169,157,0.85) 50%, rgba(0,169,157,0) 100%)",
                          boxShadow: "0 0 12px rgba(0,169,157,0.6)",
                        }}
                        initial={{ top: "-2%", opacity: 0 }}
                        animate={{ top: ["-2%", "102%"], opacity: [0, 0.9, 0] }}
                        transition={{
                          duration: 4.4,
                          delay: 1.8,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatDelay: 4.8,
                        }}
                      />
                    )}

                    {/* Inner ring for glass-like edge */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[28px] ring-1 ring-inset ring-ivory/12"
                    />
                  </motion.div>

                  {/* Floating porcelain particles orbiting the frame */}
                  {!reduced && active && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ transform: "translateZ(60px)" }}
                    >
                      {[
                        { x: "-8%", y: "12%", d: 7, s: 1, c: "#DDF7F2" },
                        { x: "104%", y: "22%", d: 9, s: 1.4, c: "#C9AD72" },
                        { x: "96%", y: "78%", d: 8, s: 0.9, c: "#DDF7F2" },
                        { x: "-6%", y: "68%", d: 11, s: 1.2, c: "#00A99D" },
                        { x: "50%", y: "-6%", d: 6, s: 0.8, c: "#C9AD72" },
                      ].map((p, i) => (
                        <motion.span
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            left: p.x,
                            top: p.y,
                            width: 6 * p.s,
                            height: 6 * p.s,
                            background: p.c,
                            boxShadow: `0 0 14px ${p.c}`,
                          }}
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{
                            opacity: [0, 0.9, 0.7],
                            scale: [0.4, 1, 0.9],
                            y: [0, -14, 0],
                            x: [0, i % 2 ? 6 : -6, 0],
                          }}
                          transition={{
                            duration: p.d,
                            delay: 0.9 + i * 0.15,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>


              {/* Clinic hours card — clean, floating */}
              <motion.div
                className="absolute -bottom-5 -left-4 md:-left-8 max-w-[240px] rounded-2xl bg-ivory/95 backdrop-blur-sm p-4 md:p-5 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.4)] border border-border/60"
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.35, ease: easings.easeOut }}
              >
                <div className="eyebrow mb-1.5">Aujourd'hui</div>
                <div className="font-serif text-lg text-petrol">08:30 — 18:00</div>
                <div className="mt-1 text-xs text-ink/60">
                  Samedi à jeudi · Fermé le vendredi
                </div>
              </motion.div>

              {/* Rating card — top right, adds premium proof */}
              <motion.div
                className="absolute -top-4 -right-2 md:-right-6 rounded-2xl bg-petrol/70 backdrop-blur-md p-3 md:p-4 border border-ivory/10 shadow-[0_20px_45px_-20px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: -12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.5, ease: easings.easeOut }}
              >
                <div className="flex items-center gap-1 text-champagne">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </div>
                <div className="mt-1 font-serif text-sm text-ivory">
                  {clinic.socialProof.googleRating}/5 · Google
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cinematic bleed into results */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,62,69,0) 0%, rgba(6,62,69,0.5) 55%, var(--color-ivory) 100%)",
        }}
      />
    </section>
  );
}

function TrustChip({
  value,
  label,
  stars = false,
}: {
  value: string;
  label: string;
  stars?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="num-display text-2xl text-ivory">{value}</span>
      <span className="text-xs text-mint/70">{label}</span>
      {stars && (
        <span className="flex ml-1 text-champagne">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3 fill-current" />
          ))}
        </span>
      )}
    </div>
  );
}

export default Hero;
export { Link };
