export type VideoCard = {
  id: string;
  title: string;
  category: string;
  placeholder: true;
};

export const videos: VideoCard[] = [
  { id: "v1", title: "Visite de la clinique", category: "Clinique", placeholder: true },
  { id: "v2", title: "Parcours patient", category: "Approche", placeholder: true },
  { id: "v3", title: "Transformation du sourire", category: "Résultats", placeholder: true },
  { id: "v4", title: "Témoignage patient", category: "Témoignages", placeholder: true },
  { id: "v5", title: "Traitement par aligneurs", category: "Soins", placeholder: true },
  { id: "v6", title: "Esthétique dentaire", category: "Soins", placeholder: true },
  { id: "v7", title: "Comment nous trouver", category: "Contact", placeholder: true },
];
