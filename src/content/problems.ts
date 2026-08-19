export type PatientProblem = {
  id: string;
  label: string;
  hint: string;
  solutionGroup: "esthetique" | "restaurer" | "prevenir";
};

export const patientProblems: PatientProblem[] = [
  { id: "alignement", label: "Mes dents sont mal alignées", hint: "Aligneurs & orthodontie", solutionGroup: "esthetique" },
  { id: "blancheur", label: "Je souhaite un sourire plus blanc", hint: "Blanchiment", solutionGroup: "esthetique" },
  { id: "manquantes", label: "Il me manque une ou plusieurs dents", hint: "Implants & prothèses", solutionGroup: "restaurer" },
  { id: "abimees", label: "Mes dents sont abîmées", hint: "Restauration & soins", solutionGroup: "prevenir" },
  { id: "urgence", label: "J'ai une douleur ou une urgence", hint: "Urgence dentaire", solutionGroup: "prevenir" },
  { id: "esthetique", label: "Je veux améliorer l'esthétique de mon sourire", hint: "Esthétique globale", solutionGroup: "esthetique" },
];
