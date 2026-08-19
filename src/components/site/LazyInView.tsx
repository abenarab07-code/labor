import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState, Suspense, type ReactNode } from "react";

function decodeHash(hash: string) {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Mounts `children` only when the wrapper enters (or is about to enter) the
 * viewport. `minHeight` reserves layout space so lazy mounting doesn't cause
 * cumulative layout shift.
 */
export function LazyInView({
  children,
  minHeight,
  rootMargin = "600px 0px",
  id,
  className,
  mountOnHash,
  fallback = null,
}: {
  children: ReactNode;
  minHeight?: number | string;
  rootMargin?: string;
  id?: string;
  className?: string;
  mountOnHash?: readonly string[];
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const routeHash = useLocation({ select: (location) => location.hash });

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
    };
  }, [inView, rootMargin]);

  useEffect(() => {
    if (inView || !mountOnHash?.length) return;
    const revealHashTarget = () => {
      const target = decodeHash(window.location.hash || routeHash);
      if (mountOnHash.includes(target)) setInView(true);
    };
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, [inView, mountOnHash, routeHash]);

  useEffect(() => {
    if (!inView || !mountOnHash?.length) return;
    const targetId = decodeHash(window.location.hash || routeHash);
    if (!mountOnHash.includes(targetId)) return;
    const alignmentTimers: number[] = [];
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ block: "start" });
        return true;
      }
      return false;
    };
    const stabilizeTarget = () => {
      scrollToTarget();
      // Lazy siblings can settle after the target first appears (especially
      // when navigating here from another route). Re-align briefly so their
      // reserved-height handoff cannot leave the anchor below the header.
      for (const delay of [100, 300, 700, 1_400]) {
        alignmentTimers.push(window.setTimeout(scrollToTarget, delay));
      }
    };
    if (document.getElementById(targetId)) {
      stabilizeTarget();
      return () => alignmentTimers.forEach(window.clearTimeout);
    }
    const observer = new MutationObserver(() => {
      if (document.getElementById(targetId)) {
        stabilizeTarget();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 10_000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      alignmentTimers.forEach(window.clearTimeout);
    };
  }, [inView, mountOnHash, routeHash]);

  return (
    <div
      id={id}
      ref={ref}
      className={className}
      style={minHeight == null ? undefined : { minHeight }}
    >
      {inView ? <Suspense fallback={fallback}>{children}</Suspense> : null}
    </div>
  );
}
