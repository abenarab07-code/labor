export type Service = {
  slug: string;
  name: string;
  short: string;
  body: string;
};

export type ServiceGroup = {
  id: string;
  title: string;
  intro: string;
  services: Service[];
};

export const serviceGroups: ServiceGroup[] = [
  {
    id: "analyses",
    title: "Analyses médicales",
    intro: "Du prélèvement au résultat, un parcours lisible et attentif.",
    services: [
      {
        slug: "prelevement",
        name: "Prélèvement",
        short: "Un accueil préparé selon votre ordonnance.",
        body: "Contactez le laboratoire avant votre visite pour vérifier les conditions de prélèvement et la nécessité éventuelle d'être à jeun.",
      },
      {
        slug: "analyses-sanguines",
        name: "Analyses sanguines",
        short: "Bilans courants et explorations prescrites.",
        body: "Les examens sont organisés selon la prescription et le contexte clinique communiqué au laboratoire.",
      },
      {
        slug: "biochimie",
        name: "Biochimie",
        short: "Bilans biochimiques selon prescription.",
        body: "Les dosages biochimiques explorent notamment le métabolisme, les fonctions rénale et hépatique ainsi que les équilibres biologiques prescrits par le médecin.",
      },
      {
        slug: "serologie",
        name: "Sérologie",
        short: "Explorations sérologiques prescrites.",
        body: "Une prise en charge claire, avec vérification des informations utiles à l'examen demandé.",
      },
      {
        slug: "hormones",
        name: "Analyses hormonales",
        short: "Dosages hormonaux selon indication médicale.",
        body: "Certains dosages dépendent d'un horaire ou d'une préparation spécifique; demandez confirmation au laboratoire.",
      },
    ],
  },
  {
    id: "hematologie",
    title: "Hématologie spécialisée",
    intro: "Quand le résultat demande une lecture plus profonde.",
    services: [
      {
        slug: "frottis-sanguin",
        name: "Frottis sanguin",
        short: "Observation spécialisée des cellules du sang.",
        body: "L'étude morphologique du sang complète certains bilans et aide le médecin à orienter l'interprétation clinique.",
      },
      {
        slug: "cytologie-medullaire",
        name: "Cytologie médullaire",
        short: "Exploration spécialisée de la moelle osseuse.",
        body: "Un examen spécialisé réalisé dans un cadre médical, après indication et préparation adaptées au patient.",
      },
      {
        slug: "consultation-hematologie",
        name: "Consultation en hématologie",
        short: "Relier les résultats, les symptômes et la suite.",
        body: "Un temps médical dédié à l'histoire du patient, aux résultats disponibles et aux examens complémentaires éventuels.",
      },
    ],
  },
];

export const allServices: Service[] = serviceGroups.flatMap(
  (group) => group.services,
);
