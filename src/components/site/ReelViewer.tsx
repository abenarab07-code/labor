import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X, ArrowUpRight } from "lucide-react";
import type { Reel } from "@/content/reels";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";
import { easings } from "@/motion/motion-tokens";

export function ReelViewer({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    videoRef.current?.play().catch(() => {});
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={reel.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0 }}
      style={{ backgroundColor: "rgba(6,62,69,0.96)" }}
      className="fixed inset-0 z-[100] backdrop-blur-md flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 md:top-6 md:right-6 h-11 w-11 rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20 flex items-center justify-center z-10"
      >
        <X className="h-5 w-5" />
      </button>

      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl grid md:grid-cols-[minmax(0,1fr)_320px] gap-6 md:gap-8 items-stretch"
      >
        <motion.div
          layoutId={`reel-${reel.id}`}
          transition={{ duration: 0.72, ease: easings.easeInOut }}
          className="relative aspect-[9/16] max-h-[80vh] mx-auto md:mx-0 overflow-hidden rounded-[28px] bg-black w-full"
          style={{ borderRadius: 28 }}
        >
          <video
            ref={videoRef}
            src={reel.videoUrl}
            poster={reel.posterUrl}
            controls
            playsInline
            muted={muted}
            className="h-full w-full object-contain bg-black"
          />
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
            className="absolute bottom-4 left-4 h-10 px-3 rounded-full bg-ivory/90 text-petrol text-xs font-medium flex items-center gap-2"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Activer le son" : "Couper le son"}
          </button>
        </motion.div>

        <div className="text-ivory flex flex-col justify-between gap-6 md:py-4">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="eyebrow text-mint">
              {reel.treatment}
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-serif text-3xl md:text-4xl mt-3 leading-tight"
            >
              {reel.title}
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <div className="rounded-xl border border-ivory/15 bg-ivory/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-mint/80">Problème patient</div>
                <div className="mt-1 text-sm">{reel.patientProblem}</div>
              </div>
              <div className="rounded-xl border border-ivory/15 bg-ivory/[0.04] p-3">
                <div className="text-[10px] uppercase tracking-wider text-mint/80">Résultat</div>
                <div className="mt-1 text-sm">{reel.shortResult}</div>
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-ivory/80 text-sm leading-relaxed"
            >
              {reel.shortDescription}
            </motion.p>
            <p className="mt-6 text-[11px] leading-relaxed text-ivory/50">{reel.disclaimer}</p>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <ReelCtaButton reel={reel} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ReelCtaButton({ reel }: { reel: Reel }) {
  const target = reel.ctaTarget;
  const className =
    "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-mint text-petrol font-medium hover:bg-ivory transition-colors";

  if (target.kind === "appointment") {
    return (
      <Link to="/rendez-vous" search={target.soin ? { soin: target.soin } : undefined} className={className}>
        {reel.ctaLabel}
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    );
  }
  if (target.kind === "whatsapp") {
    return (
      <a
        href={buildWhatsAppUrl(target.context, { sourcePage: `Reel: ${reel.id}` })}
        onClick={() => track("whatsapp_clicked", { from: "reel", id: reel.id })}
        className={className}
      >
        {reel.ctaLabel}
        <ArrowUpRight className="h-4 w-4" />
      </a>
    );
  }
  return null;
}
