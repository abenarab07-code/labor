import gymmyVideo from "@/assets/reels/gymmy.mp4.asset.json";
import gymmyPoster from "@/assets/reels/gymmy.jpg.asset.json";
import sourireVideo from "@/assets/reels/sourire-sain.mp4.asset.json";
import sourirePoster from "@/assets/reels/sourire-sain.jpg.asset.json";
import veneersVideo from "@/assets/reels/veneers.mp4.asset.json";
import veneersPoster from "@/assets/reels/veneers.jpg.asset.json";
import extractionVideo from "@/assets/reels/extraction.mp4.asset.json";
import extractionPoster from "@/assets/reels/extraction.jpg.asset.json";
import snapOnVideo from "@/assets/reels/snap-on.mp4.asset.json";
import snapOnPoster from "@/assets/reels/snap-on.jpg.asset.json";
import featuredVideo from "@/assets/reels/facette-emax-featured.mp4.asset.json";
import featuredPoster from "@/assets/reels/facette-emax-featured.jpg.asset.json";

export type ReelCtaTarget =
  | { kind: "appointment"; soin?: string }
  | { kind: "whatsapp"; context: "default" | "aligneurs" | "facettes" | "implants" | "urgence" | "reels" }
  | { kind: "phone" };

export type Reel = {
  id: string;
  title: string;
  treatment: string;
  patientProblem: string;
  shortResult: string;
  videoUrl: string;
  posterUrl: string;
  shortDescription: string;
  featured?: boolean;
  order: number;
  consentConfirmed: boolean;
  disclaimer: string;
  beforeAfterUrl?: string;
  instagramUrl?: string;
  ctaLabel: string;
  ctaTarget: ReelCtaTarget;
};

const DEFAULT_DISCLAIMER =
  "Résultat clinique réel — publié après consentement écrit du patient. Les résultats varient selon chaque situation.";

export const reels: Reel[] = [
  {
    id: "facette-emax-featured",
    title: "Facettes E.max — عدسات تجميلية سيراميك",
    treatment: "Facettes E.max céramique",
    patientProblem: "Sourire à sublimer",
    shortResult: "Sourire signature sur mesure",
    videoUrl: featuredVideo.url,
    posterUrl: featuredPoster.url,
    shortDescription:
      "Pose de facettes céramique E.max sur mesure — signature esthétique du cabinet.",
    featured: true,
    order: 1,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Demander une évaluation",
    ctaTarget: { kind: "appointment", soin: "facettes" },
  },
  {
    id: "veneers",
    title: "Facettes E.max — la réalité dépasse l'imagination",
    treatment: "Facettes E.max",
    patientProblem: "Sourire irrégulier",
    shortResult: "Sourire harmonisé sur mesure",
    videoUrl: veneersVideo.url,
    posterUrl: veneersPoster.url,
    shortDescription:
      "Reality is more beautiful than imagination — pose de facettes céramique sur mesure.",
    order: 2,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Demander une évaluation",
    ctaTarget: { kind: "appointment", soin: "facettes" },
  },
  {
    id: "gymmy-smile",
    title: "Couronne et facette E.max esthétique",
    treatment: "Couronne + Facette E.max",
    patientProblem: "Gummy smile",
    shortResult: "Ligne du sourire rééquilibrée",
    videoUrl: gymmyVideo.url,
    posterUrl: gymmyPoster.url,
    shortDescription:
      "Gummy smile corrigé — association couronne céramique et facette E.max.",
    order: 3,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Découvrir si ce soin me convient",
    ctaTarget: { kind: "appointment", soin: "facettes" },
  },
  {
    id: "extraction-plan",
    title: "Plan de traitement — dents mobiles",
    treatment: "Réhabilitation complète",
    patientProblem: "Dents mobiles",
    shortResult: "Plan de traitement personnalisé",
    videoUrl: extractionVideo.url,
    posterUrl: extractionPoster.url,
    shortDescription:
      "Patiente reçue pour dents mobiles au stade d'extraction — plan de traitement personnalisé.",
    order: 6,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Parler à l'équipe",
    ctaTarget: { kind: "whatsapp", context: "reels" },
  },
  {
    id: "snap-on-smile",
    title: "Snap-on smile — solution rapide",
    treatment: "Snap-on smile",
    patientProblem: "Sourire à améliorer rapidement",
    shortResult: "Solution esthétique provisoire",
    videoUrl: snapOnVideo.url,
    posterUrl: snapOnPoster.url,
    shortDescription:
      "Solution esthétique rapide et provisoire, idéale pour un événement.",
    order: 5,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Demander plus d'informations",
    ctaTarget: { kind: "appointment" },
  },
  {
    id: "sourire-sain",
    title: "Pour un sourire sain et beau",
    treatment: "Soin & prévention",
    patientProblem: "Prévention & entretien",
    shortResult: "Sourire préservé dans le temps",
    videoUrl: sourireVideo.url,
    posterUrl: sourirePoster.url,
    shortDescription:
      "لابتسامة صحية و جميلة — approche préventive et esthétique du cabinet.",
    order: 4,
    consentConfirmed: true,
    disclaimer: DEFAULT_DISCLAIMER,
    ctaLabel: "Réserver un bilan",
    ctaTarget: { kind: "appointment" },
  },
];

export const reelsTrust = {
  rating: "4,8/5",
  ratingLabel: "sur Google",
  reviews: "42",
  reviewsLabel: "avis patients",
  community: "39k+",
  communityLabel: "communauté Instagram",
  badge: "Résultats réels du cabinet",
};
