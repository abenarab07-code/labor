import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * True when the referenced element is intersecting the viewport AND the tab
 * is visible. Use to gate infinite animations so they don't burn CPU offscreen
 * or in a background tab. Starts `false` so offscreen sections never launch
 * a frame of animation before IntersectionObserver reports their state.
 */
export function useSectionActive(ref: RefObject<Element | null>) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;
    let inView = false;
    const update = () => setActive(visible && inView);
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = !!entry?.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    io.observe(el);
    const onVis = () => {
      visible = !document.hidden;
      update();
    };
    visible = !document.hidden;
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);
  return active;
}

export function useReducedMotionMode() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function useLowPowerMode() {
  const [low, setLow] = useState(false);
  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean; effectiveType?: string };
      };
      const saveData = !!nav.connection?.saveData;
      const slow = /(2g|3g)/.test(nav.connection?.effectiveType ?? "");
      const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
      const lowMem = (nav.deviceMemory ?? 8) <= 4;
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const narrow = window.innerWidth < 768;
      setLow(saveData || slow || (coarse && narrow) || fewCores || lowMem);
    } catch {
      /* noop */
    }
  }, []);
  return low;
}

export function useVisibleVideo(threshold = 0.55) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting && e.intersectionRatio >= threshold) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: [0, threshold, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

export function useSmoothPointer(lerp = 0.16) {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove);
    let raf = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [lerp]);
  return current;
}

export function useScrollVelocity() {
  const velocity = useRef(0);
  useEffect(() => {
    let last = window.scrollY;
    let lastT = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(1, now - lastT);
      const inst = (y - last) / dt; // px/ms
      velocity.current = velocity.current * 0.82 + inst * 0.18;
      last = y;
      lastT = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return velocity;
}
