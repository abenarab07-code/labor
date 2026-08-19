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
  fallback = null,
}: {
  children: ReactNode;
  minHeight: number | string;
  rootMargin?: string;
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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
    return () => io.disconnect();
  }, [inView, rootMargin]);

  return (
    <div ref={ref} style={inView ? undefined : { minHeight }}>
      {inView ? <Suspense fallback={fallback}>{children}</Suspense> : null}
    </div>
  );
}
