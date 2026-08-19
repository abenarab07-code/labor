// Contextual WhatsApp intent builder. Keep messages free from sensitive health data.

export type WhatsAppContext =
  | "default"
  | "analyse"
  | "prelevement"
  | "hematologie"
  | "resultat"
  | "rendezvous"
  | "aligneurs"
  | "facettes"
  | "implants"
  | "urgence"
  | "blanchiment"
  | "reels";

const WHATSAPP_NUMBER = "213792570557";

const MESSAGES: Record<WhatsAppContext, string> = {
  default:
    "Bonjour Dr Tarfaya, je souhaite des informations concernant une analyse ou une consultation.",
  analyse: "Bonjour, j'ai une ordonnance et je souhaite vérifier les conditions pour mes analyses.",
  prelevement:
    "Bonjour, je souhaite savoir comment préparer mon prélèvement et si je dois être à jeun.",
  hematologie: "Bonjour, je souhaite demander un rendez-vous pour une consultation en hématologie.",
  resultat: "Bonjour, je souhaite savoir comment récupérer ou discuter mes résultats.",
  rendezvous: "Bonjour, je souhaite demander un rendez-vous au laboratoire Dr Tarfaya.",
  aligneurs: "Bonjour, je souhaite des informations concernant une analyse ou une consultation.",
  facettes: "Bonjour, je souhaite des informations concernant une analyse ou une consultation.",
  implants: "Bonjour, je souhaite des informations concernant une analyse ou une consultation.",
  urgence:
    "Bonjour, je souhaite joindre le laboratoire. Je comprends que WhatsApp n'est pas un service d'urgence.",
  blanchiment: "Bonjour, je souhaite des informations concernant une analyse ou une consultation.",
  reels: "Bonjour, j'ai vu votre vidéo et je souhaite des informations concernant le laboratoire.",
};

export function buildWhatsAppUrl(
  context: WhatsAppContext = "default",
  extra?: { sourcePage?: string; note?: string },
): string {
  const parts = [MESSAGES[context] ?? MESSAGES.default];
  if (extra?.note) parts.push(extra.note);
  if (extra?.sourcePage) parts.push(`(via ${extra.sourcePage})`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join("\n"))}`;
}
