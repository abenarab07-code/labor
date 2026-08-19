// Lightweight event tracking. No-op unless a dataLayer or gtag is present.
// All names are internal, stable, and safe to expose.

export type AnalyticsEvent =
  | "appointment_form_started"
  | "appointment_submitted"
  | "whatsapp_clicked"
  | "phone_clicked"
  | "maps_clicked"
  | "reel_opened"
  | "before_after_opened"
  | "service_selected"
  | "faq_expanded"
  | "language_changed"
  | "problem_selected";

type Props = Record<string, string | number | boolean | undefined | null>;

export function track(event: AnalyticsEvent, props?: Props) {
  if (typeof window === "undefined") return;
  try {
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
      gtag?: (...args: unknown[]) => void;
    };
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event, ...(props ?? {}) });
    }
    if (typeof w.gtag === "function") {
      w.gtag("event", event, props ?? {});
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[track]", event, props ?? {});
    }
  } catch {
    // swallow — analytics must never break the UI
  }
}
