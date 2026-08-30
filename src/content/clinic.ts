export const clinic = {
  brand: "Dr Tarfaya",
  fullName: "Laboratoire Dr Tarfaya",
  tagline: "Laboratoire d'analyses médicales & Biochimie",
  positioning:
    "Analyses médicales, biochimie, hématologie, hormonologie, immunologie et cytologie à Annaba, El Bouni.",
  phone: "0792 57 05 57",
  phoneHref: "tel:+213792570557",
  whatsapp: "0792 57 05 57",
  whatsappHref:
    "https://wa.me/213792570557?text=Bonjour%20Dr%20Tarfaya%2C%20je%20souhaite%20des%20informations%20concernant%20une%20analyse%20ou%20une%20consultation.",
  email: "",
  instagramHandle: "",
  instagramHref: "",
  address: {
    line1: "Promotion Hami, bloc D, 1er étage",
    city: "El Bouni",
    region: "Annaba",
    country: "Algérie",
  },
  mapsHref:
    "https://www.google.com/maps/dir/?api=1&destination=Laboratoire+d%27analyses+m%C3%A9dicales+et+cabinet+d%27h%C3%A9matologie+Dr+Tarfaya%2C+Promotion+Hami+Bloc+D%2C+El+Bouni%2C+Annaba",
  hours: [
    { label: "Samedi - Jeudi", value: "Horaires à confirmer", closed: false },
    { label: "Vendredi", value: "Fermé", closed: true },
  ],
  speciality: "Médecin spécialiste en biochimie",
  socialProof: {
    googleRating: "-",
    googleReviews: 0,
    instagramFollowers: "-",
  },
} as const;
