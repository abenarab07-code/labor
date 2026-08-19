import { useEffect, useRef, useState, Suspense, type ReactNode } from "react";

/**
 * Mounts `children` only when the wrapper enters (or is about to enter) the
 * viewport. `minHeight` reserves layout space so lazy mounting doesn't cause
 * cumulative layout shift.
 */
export function LazyInView({
  children,
  minHeight,
  rootMargin = "600px 0px",
  idleAfterMs,
  id,
  className,
  mountOnHash,
  fallback = null,
}: {
  children: ReactNode;
  minHeight?: number | string;
  rootMargin?: string;
  idleAfterMs?: number;
  id?: string;
  className?: string;
  mountOnHash?: readonly string[];
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let delayTimer: number | undefined;
    let idleCallback: number | undefined;

    const scheduleIdleMount = () => {
      if (
        idleAfterMs == null ||
        document.hidden ||
        delayTimer != null ||
        idleCallback != null
      ) {
        return;
      }
      delayTimer = window.setTimeout(() => {
        delayTimer = undefined;
        if (document.hidden) return;
        if (idleWindow.requestIdleCallback) {
          idleCallback = idleWindow.requestIdleCallback(() => setInView(true), {
            timeout: 1000,
          });
        } else {
          setInView(true);
        }
      }, idleAfterMs);
    };

    const onVisibility = () => {
      if (!document.hidden) scheduleIdleMount();
    };

    scheduleIdleMount();
    document.addEventListener("visibilitychange", onVisibility);
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        if (delayTimer != null) window.clearTimeout(delayTimer);
        if (idleCallback != null) idleWindow.cancelIdleCallback?.(idleCallback);
      };
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
      document.removeEventListener("visibilitychange", onVisibility);
      if (delayTimer != null) window.clearTimeout(delayTimer);
      if (idleCallback != null) idleWindow.cancelIdleCallback?.(idleCallback);
    };
  }, [idleAfterMs, inView, rootMargin]);

  useEffect(() => {
    if (inView || !mountOnHash?.length) return;
    const revealHashTarget = () => {
      const target = decodeURIComponent(window.location.hash.slice(1));
      if (mountOnHash.includes(target)) setInView(true);
    };
    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, [inView, mountOnHash]);

  useEffect(() => {
    if (!inView || !mountOnHash?.length) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (!mountOnHash.includes(targetId)) return;
    let frame = 0;
    let attempts = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }
      if (attempts++ < 120)
        frame = window.requestAnimationFrame(scrollToTarget);
    };
    frame = window.requestAnimationFrame(scrollToTarget);
    return () => window.cancelAnimationFrame(frame);
  }, [inView, mountOnHash]);

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
