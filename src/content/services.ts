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
        slug: "hormonologie",
        name: "Hormonologie",
        short: "Dosages hormonaux selon indication médicale.",
        body: "Certains dosages dépendent d'un horaire ou d'une préparation spécifique; demandez confirmation au laboratoire.",
      },
      {
        slug: "immunologie",
        name: "Immunologie",
        short: "Explorations immunologiques prescrites.",
        body: "Les examens immunologiques sont réalisés selon la prescription et les informations cliniques communiquées au laboratoire.",
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
        slug: "ponction-moelle-osseuse",
        name: "Ponction de moelle osseuse",
        short: "Prélèvement médullaire sous sédation.",
        body: "La ponction de moelle osseuse est réalisée sous sédation, dans un cadre médical et selon une indication adaptée au patient.",
      },
      {
        slug: "cytologie-ganglionnaire",
        name: "Cytologie ganglionnaire",
        short: "Étude cytologique des éléments ganglionnaires.",
        body: "L'examen cytologique ganglionnaire participe à l'étude spécialisée des cellules prélevées selon l'indication médicale.",
      },
      {
        slug: "biopsie-osteomedullaire",
        name: "Biopsie ostéomédullaire",
        short: "Biopsie réalisée sous anesthésie.",
        body: "La biopsie ostéomédullaire est réalisée sous anesthésie, dans un cadre médical et après préparation adaptée.",
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
