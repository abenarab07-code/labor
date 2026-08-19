export type TestimonialCategory =
  | "peur"
  | "naturel"
  | "suivi"
  | "international";

export type Testimonial = {
  id: string;
  category: TestimonialCategory;
  categoryLabel: string;
  quote: string;
  author: string; // anonymous initials or first name only
  treatment?: string;
  verified: boolean;
};

export const testimonialCategories: {
  id: TestimonialCategory;
  label: string;
  intro: string;
}[] = [
  { id: "peur", label: "Peur rassurée", intro: "Une prise en charge tout en douceur." },
  { id: "naturel", label: "Résultat naturel", intro: "Des sourires fidèles à chaque patient." },
  { id: "suivi", label: "Suivi attentif", intro: "Un accompagnement disponible et personnalisé." },
  { id: "international", label: "Confiance internationale", intro: "Des patients qui viennent de loin." },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    category: "peur",
    categoryLabel: "Peur rassurée",
    quote:
      "Le docteur est douce, à l'écoute et prend le temps d'expliquer chaque étape.",
    author: "Patiente vérifiée",
    verified: true,
  },
  {
    id: "t2",
    category: "naturel",
    categoryLabel: "Résultat naturel",
    quote: "Le résultat est très beau et naturel.",
    author: "Patient vérifié",
    treatment: "Esthétique",
    verified: true,
  },
  {
    id: "t3",
    category: "suivi",
    categoryLabel: "Suivi attentif",
    quote:
      "L'équipe reste disponible pour le suivi et les questions.",
    author: "Patient vérifié",
    verified: true,
  },
  {
    id: "t4",
    category: "international",
    categoryLabel: "Confiance internationale",
    quote: "Je viens d'Allemagne pour me soigner au cabinet.",
    author: "Patiente vérifiée",
    verified: true,
  },
  {
    id: "t5",
    category: "peur",
    categoryLabel: "Peur rassurée",
    quote:
      "Un accueil chaleureux qui fait vite oublier l'appréhension du rendez-vous.",
    author: "Patiente vérifiée",
    verified: true,
  },
  {
    id: "t6",
    category: "naturel",
    categoryLabel: "Résultat naturel",
    quote:
      "Un rendu discret et harmonieux — exactement ce que je recherchais.",
    author: "Patient vérifié",
    treatment: "Facettes",
    verified: true,
  },
];
