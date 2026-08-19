/**
 * Beausourire — Porcelain motion primitives
 *
 * Reusable signature motifs shared across the homepage:
 *   PorcelainFragment · SmileMask · AlignmentGuide · PrecisionLine
 *   LightSweep · SmileMap · SmileAssembly (helpers/utilities)
 *
 * Visual language: smooth ivory ceramic, translucent edges, subtle inner light.
 * No cracked-tooth realism. No neon. No random particles.
 */
import { motion, useTransform, type MotionValue } from "motion/react";
import { useId, type CSSProperties, type ReactNode } from "react";
import { easings } from "./motion-tokens";


/* ------------------------------------------------------------------ */
/*  Porcelain fragment shapes                                          */
/* ------------------------------------------------------------------ */

export type ShapeKind =
  | "enamel-arc"
  | "incisor"
  | "canine"
  | "molar"
  | "aligner-band"
  | "sliver"
  | "petal";

function shapePath(shape: ShapeKind): string {
  switch (shape) {
    case "enamel-arc":
      // soft crescent — top curved edge, gently rounded base
      return "M 12 62 Q 50 8 88 62 Q 82 92 50 92 Q 18 92 12 62 Z";
    case "incisor":
      // squared incisor slab, gently tapered top with rounded corners
      return "M 24 14 Q 30 6 50 6 Q 70 6 76 14 L 78 82 Q 74 94 50 94 Q 26 94 22 82 Z";
    case "canine":
      // rounded triangular canine
      return "M 50 6 Q 66 26 82 76 Q 74 94 50 94 Q 26 94 18 76 Q 34 26 50 6 Z";
    case "molar":
      // wide rounded oval
      return "M 14 46 Q 14 12 50 12 Q 86 12 86 46 Q 86 88 50 92 Q 14 88 14 46 Z";
    case "aligner-band":
      // slim curved band (like an aligner arch)
      return "M 6 60 Q 50 8 94 60 Q 90 74 82 76 Q 50 40 18 76 Q 10 74 6 60 Z";
    case "sliver":
      // long thin sliver
      return "M 40 8 Q 60 8 62 26 L 60 82 Q 58 94 50 94 Q 42 94 40 82 L 38 26 Q 40 8 40 8 Z";
    case "petal":
      // asymmetric petal — refined organic curve
      return "M 22 82 Q 12 40 40 14 Q 74 6 84 40 Q 90 78 60 90 Q 34 96 22 82 Z";
  }
}

export function PorcelainFragment({
  shape = "enamel-arc",
  size = 80,
  tone = 0,
  style,
  className = "",
}: {
  shape?: ShapeKind;
  size?: number;
  /** 0 = ivory-warm, 1 = mint-cool */
  tone?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const uid = useId();
  const path = shapePath(shape);
  // Interpolate three stops between warm ivory and cool mint
  const t = Math.max(0, Math.min(1, tone));
  const top = t < 0.5 ? "#FFFDF7" : "#F5FBF8";
  const mid = t < 0.5 ? "#F1EADA" : "#E4F2EC";
  const bot = t < 0.5 ? "#D9E7DF" : "#C7E2D8";
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`pg-${uid}`} x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor={top} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={bot} />
        </linearGradient>
        <radialGradient id={`ph-${uid}`} cx="32%" cy="22%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="65%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={`pr-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(6,62,69,0.25)" />
        </linearGradient>
        <linearGradient id={`ps-${uid}`} x1="50%" y1="65%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(6,62,69,0)" />
          <stop offset="100%" stopColor="rgba(6,62,69,0.35)" />
        </linearGradient>
      </defs>
      {/* soft cast shadow beneath the fragment */}
      <ellipse
        cx="50"
        cy="96"
        rx="26"
        ry="3"
        fill="rgba(6,62,69,0.18)"
        style={{ filter: "blur(2px)" }}
      />
      {/* body */}
      <path d={path} fill={`url(#pg-${uid})`} />
      {/* inner highlight */}
      <path d={path} fill={`url(#ph-${uid})`} style={{ mixBlendMode: "screen" }} />
      {/* base falloff */}
      <path d={path} fill={`url(#ps-${uid})`} style={{ mixBlendMode: "multiply", opacity: 0.55 }} />
      {/* rim light */}
      <path d={path} fill="none" stroke={`url(#pr-${uid})`} strokeWidth="0.7" />
      {/* fine outer contour */}
      <path
        d={path}
        fill="none"
        stroke="rgba(6,62,69,0.18)"
        strokeWidth="0.35"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  SmileMask — reveals content inside a smile-arc window              */
/* ------------------------------------------------------------------ */

export function SmileMask({
  children,
  progress = 1,
  className = "",
  style,
}: {
  children: ReactNode;
  /** 0 → hidden, 1 → fully revealed */
  progress?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const uid = useId();
  const cid = `smile-clip-${uid}`;
  // top edge sweeps down to top edge with a smile arc; progress lifts a bottom curtain
  const bottom = 1 - Math.max(0, Math.min(1, progress));
  return (
    <div className={`relative ${className}`} style={style}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id={cid} clipPathUnits="objectBoundingBox">
            {/* smile-arc top edge, straight sides, curtain bottom driven by progress */}
            <path
              d={`M 0 0.14
                  Q 0.5 -0.04 1 0.14
                  L 1 ${(1 - bottom).toFixed(4)}
                  Q 0.5 ${(1 - bottom + 0.06).toFixed(4)} 0 ${(1 - bottom).toFixed(4)}
                  Z`}
            />
          </clipPath>
        </defs>
      </svg>
      <div style={{ clipPath: `url(#${cid})`, WebkitClipPath: `url(#${cid})` }} className="h-full w-full">
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AlignmentGuide — thin animated SVG line between two anchors        */
/* ------------------------------------------------------------------ */

export function AlignmentGuide({
  from,
  to,
  active = true,
  delay = 0,
  duration = 0.8,
  className = "",
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  active?: boolean;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="var(--color-teal)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration, delay, ease: easings.easeInOut }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  PrecisionLine — thin horizontal accent that draws on scroll/enter  */
/* ------------------------------------------------------------------ */

export function PrecisionLine({
  delay = 0,
  className = "",
  color = "var(--color-teal)",
}: {
  delay?: number;
  className?: string;
  color?: string;
}) {
  return (
    <motion.span
      className={`block h-px origin-left ${className}`}
      style={{ backgroundColor: color }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: easings.easeInOut }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  LightSweep — single-pass diagonal shimmer across a container       */
/* ------------------------------------------------------------------ */

export function LightSweep({
  play,
  delay = 0,
  duration = 1.1,
  className = "",
}: {
  play: boolean;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      initial={{ x: "-120%" }}
      animate={play ? { x: "120%" } : undefined}
      transition={{ duration, delay, ease: easings.easeInOut }}
      style={{
        backgroundImage:
          "linear-gradient(115deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 58%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SmileMap — large decorative smile-arc for section backgrounds      */
/* ------------------------------------------------------------------ */

export function SmileMap({
  className = "",
  strokeOpacity = 0.35,
}: {
  className?: string;
  strokeOpacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 1200 320"
      className={`pointer-events-none ${className}`}
      fill="none"
      aria-hidden
      preserveAspectRatio="none"
    >
      <motion.path
        d="M 20 220 Q 300 30 600 30 Q 900 30 1180 220"
        stroke="var(--color-teal)"
        strokeOpacity={strokeOpacity}
        strokeWidth="1.2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.6, ease: easings.easeInOut }}
      />
      <motion.path
        d="M 60 260 Q 320 90 600 90 Q 880 90 1140 260"
        stroke="var(--color-champagne)"
        strokeOpacity={strokeOpacity * 0.6}
        strokeWidth="0.8"
        strokeDasharray="2 4"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.8, delay: 0.2, ease: easings.easeInOut }}
      />
      {/* alignment tick marks along the top arc */}
      {Array.from({ length: 11 }).map((_, i) => {
        const t = i / 10;
        const x = 20 + t * 1160;
        const y = 220 - Math.sin(t * Math.PI) * 190;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="2"
            fill="var(--color-teal)"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: strokeOpacity + 0.15, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, delay: 0.4 + t * 0.6, ease: easings.easeOut }}
          />
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Fragment choreography helpers                                      */
/* ------------------------------------------------------------------ */

/**
 * A single fragment's assembled position + how it detaches during scroll.
 *
 * All coordinates are relative to a centered anchor (0,0) inside the
 * assembly stage. Positive x = right, positive y = down (screen convention).
 */
export type FragmentSpec = {
  id: string;
  shape: ShapeKind;
  size: number;
  /** assembled position, in px relative to stage centre */
  x: number;
  y: number;
  /** final rotation, degrees */
  r: number;
  /** final scale */
  s?: number;
  /** tone 0 = ivory-warm, 1 = mint-cool */
  tone?: number;
  /** entry offset multiplier — how far the fragment starts scattered */
  scatter?: { x: number; y: number; r: number };
  /** detach direction on scroll */
  detach?: { x: number; y: number };
  /** enter delay offset (seconds) added to base delay */
  delayOffset?: number;
  /** depth: 0 (background) → 1 (foreground). Drives blur + z-index. */
  depth?: number;
};

/**
 * Twelve porcelain fragments arranged around the perimeter of a smile arc.
 * Positions are hand-tuned to feel harmonious rather than symmetric.
 */
export const HERO_FRAGMENTS: FragmentSpec[] = [
  { id: "f1",  shape: "enamel-arc",   size: 96,  x: -320, y: -140, r: -18, tone: 0.1, depth: 0.2,
    scatter: { x: -160, y: -220, r: -40 }, detach: { x: -140, y: 220 } },
  { id: "f2",  shape: "incisor",      size: 78,  x: -220, y:  -80, r:  -8, tone: 0.0, depth: 0.7,
    scatter: { x: -140, y:  -60, r: -30 }, detach: { x:  -90, y: 180 } },
  { id: "f3",  shape: "aligner-band", size: 140, x: -110, y: -190, r:  -6, tone: 0.4, depth: 0.4,
    scatter: { x:  -60, y: -260, r: -22 }, detach: { x:  -40, y: 260 } },
  { id: "f4",  shape: "canine",       size: 68,  x:  -50, y: -110, r:   4, tone: 0.15, depth: 0.9,
    scatter: { x:  -30, y: -180, r:  18 }, detach: { x:  -20, y: 210 } },
  { id: "f5",  shape: "incisor",      size: 82,  x:   50, y:  -95, r:   6, tone: 0.1, depth: 1.0,
    scatter: { x:   40, y: -170, r:  22 }, detach: { x:   20, y: 210 } },
  { id: "f6",  shape: "canine",       size: 70,  x:  140, y: -120, r:  10, tone: 0.2, depth: 0.85,
    scatter: { x:  110, y: -200, r:  30 }, detach: { x:   60, y: 240 } },
  { id: "f7",  shape: "aligner-band", size: 130, x:  240, y: -170, r:   8, tone: 0.5, depth: 0.35,
    scatter: { x:  180, y: -260, r:  26 }, detach: { x:  120, y: 260 } },
  { id: "f8",  shape: "molar",        size: 92,  x:  340, y:  -60, r:  16, tone: 0.25, depth: 0.55,
    scatter: { x:  220, y: -160, r:  40 }, detach: { x:  180, y: 200 } },
  { id: "f9",  shape: "petal",        size: 74,  x:  300, y:  110, r:  20, tone: 0.6, depth: 0.5,
    scatter: { x:  260, y:  220, r:  46 }, detach: { x:  260, y:  60 } },
  { id: "f10", shape: "sliver",       size: 88,  x:  120, y:  190, r: -12, tone: 0.05, depth: 0.75,
    scatter: { x:  100, y:  280, r: -32 }, detach: { x:   80, y: -120 } },
  { id: "f11", shape: "petal",        size: 78,  x: -130, y:  200, r:  22, tone: 0.55, depth: 0.6,
    scatter: { x: -100, y:  290, r:  42 }, detach: { x: -100, y: -110 } },
  { id: "f12", shape: "molar",        size: 96,  x: -290, y:   80, r: -14, tone: 0.3, depth: 0.3,
    scatter: { x: -240, y:  200, r: -30 }, detach: { x: -220, y:   40 } },
];

/**
 * Compact fragment set for mobile & low-power modes (6 fragments).
 */
export const HERO_FRAGMENTS_LITE: FragmentSpec[] = [
  { id: "m1", shape: "enamel-arc",   size: 74, x: -110, y: -120, r: -12, tone: 0.1, depth: 0.5,
    scatter: { x: -80, y: -180, r: -30 }, detach: { x: -60, y: 160 } },
  { id: "m2", shape: "incisor",      size: 62, x:  -40, y:  -90, r:   6, tone: 0.15, depth: 1.0,
    scatter: { x: -20, y: -160, r:  22 }, detach: { x: -10, y: 180 } },
  { id: "m3", shape: "incisor",      size: 66, x:   50, y:  -95, r:   4, tone: 0.05, depth: 0.9,
    scatter: { x:  30, y: -170, r:  20 }, detach: { x:  20, y: 180 } },
  { id: "m4", shape: "aligner-band", size: 104, x:   0, y: -160, r:   0, tone: 0.4, depth: 0.35,
    scatter: { x:   0, y: -240, r: -14 }, detach: { x:   0, y: 220 } },
  { id: "m5", shape: "petal",        size: 60, x:  110, y:  120, r:  18, tone: 0.55, depth: 0.55,
    scatter: { x:  90, y:  200, r:  40 }, detach: { x: 100, y:  40 } },
  { id: "m6", shape: "petal",        size: 58, x: -100, y:  130, r: -18, tone: 0.6, depth: 0.55,
    scatter: { x: -90, y:  210, r: -40 }, detach: { x: -90, y:  40 } },
];

/**
 * <FragmentStage> — orchestrates the assembly.
 *
 * The stage assembles fragments from their scattered positions to their
 * assembled positions between t=0.30 and t=1.30, plays a single light sweep
 * from t=1.00 to t=2.10, then hands off to the scroll-driven detach.
 *
 * `detachProgress` (0→1) pushes fragments along their detach vector and
 * fades them out. Pass a `MotionValue` from `useTransform(scrollYProgress)`.
 */
export function FragmentStage({
  fragments,
  detachProgress,
  reduced = false,
  className = "",
}: {
  fragments: FragmentSpec[];
  detachProgress: MotionValue<number>;
  reduced?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
      style={{ perspective: "1400px" }}
    >
      <div className="relative" style={{ width: 1, height: 1 }}>
        {fragments.map((f) => (
          <FragmentInstance key={f.id} spec={f} detach={detachProgress} reduced={reduced} />
        ))}
      </div>
    </div>
  );
}

function FragmentInstance({
  spec,
  detach,
  reduced,
}: {
  spec: FragmentSpec;
  detach: MotionValue<number>;
  reduced: boolean;
}) {
  const {
    x, y, r, s = 1, size, shape, tone = 0, depth = 0.5, scatter, detach: det, delayOffset = 0,
  } = spec;
  const sc = scatter ?? { x: x * 1.4, y: y * 1.4, r: r * 2 };
  const dv = det ?? { x: 0, y: 200 };
  // Depth-driven blur & z (background fragments soft-focus)
  const initialBlur = 10 + (1 - depth) * 6;
  const finalBlur = (1 - depth) * 2.4;
  const z = Math.round(depth * 100);
  // Base assembly timing (0.30 → 1.30s = movement window)
  const enterDelay = 0.30 + delayOffset;
  const enterDuration = 1.0;

  // Detach transforms — bind reactively to scroll progress
  const detachX = useTransform(detach, [0, 1], [0, dv.x]);
  const detachY = useTransform(detach, [0, 1], [0, dv.y]);
  const detachOpacity = useTransform(detach, [0, 0.6, 1], [1, 0.75, 0.05]);
  const detachScale = useTransform(detach, [0, 1], [1, 0.82]);

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: 0,
        top: 0,
        zIndex: z,
        x: detachX,
        y: detachY,
        opacity: detachOpacity,
        scale: detachScale,
      }}
    >
      <motion.div
        initial={reduced
          ? { opacity: 1, x, y, rotate: r, scale: s, filter: "blur(0px)" }
          : { opacity: 0, x: sc.x, y: sc.y, rotate: sc.r, scale: 0.86, filter: `blur(${initialBlur}px)` }
        }
        animate={reduced
          ? { opacity: 1, x, y, rotate: r, scale: s, filter: "blur(0px)" }
          : {
              opacity: 1,
              x, y, rotate: r, scale: s,
              filter: `blur(${finalBlur.toFixed(2)}px)`,
            }
        }
        transition={reduced
          ? { duration: 0.001 }
          : {
              opacity:  { duration: 0.35, delay: enterDelay - 0.15, ease: easings.easeOut },
              filter:   { duration: 0.6,  delay: enterDelay - 0.15, ease: easings.easeOut },
              x:        { duration: enterDuration, delay: enterDelay, ease: easings.easeInOut },
              y:        { duration: enterDuration, delay: enterDelay, ease: easings.easeInOut },
              rotate:   { duration: enterDuration, delay: enterDelay, ease: easings.easeInOut },
              scale:    { duration: enterDuration, delay: enterDelay - 0.05, ease: easings.easeOut },
            }
        }
      >
        <div
          style={{
            transform: `translate(-50%, -50%)`,
            width: size,
            height: size,
          }}
        >
          <PorcelainFragment shape={shape} size={size} tone={tone} />
        </div>
      </motion.div>
    </motion.div>
  );
}

