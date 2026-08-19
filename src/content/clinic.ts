export const clinic = {
  brand: "Dr Tarfaya",
  fullName: "Laboratoire Dr Tarfaya",
  tagline: "Laboratoire d'analyses médicales & Hématologie",
  positioning:
    "Analyses médicales, prélèvements et consultation spécialisée en hématologie à El Bouni, Annaba.",
  phone: "0792 57 05 57",
  phoneHref: "tel:+213792570557",
  whatsapp: "0792 57 05 57",
  whatsappHref:
    "https://wa.me/213792570557?text=Bonjour%20Dr%20Tarfaya%2C%20je%20souhaite%20des%20informations%20concernant%20une%20analyse%20ou%20une%20consultation.",
  email: "",
  instagramHandle: "",
  instagramHref: "",
  address: {
    line1: "Promotion Les Bons Enfants, bloc D, 1er étage",
    city: "El Bouni",
    region: "Annaba",
    country: "Algérie",
  },
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Promotion+Les+Bons+Enfants+bloc+D+El+Bouni+Annaba",
  hours: [
    { label: "Samedi - Jeudi", value: "Horaires à confirmer", closed: false },
    { label: "Vendredi", value: "Fermé", closed: true },
  ],
  speciality: "Médecin spécialiste en hématologie",
  socialProof: {
    googleRating: "-",
    googleReviews: 0,
    instagramFollowers: "-",
  },
} as const;
