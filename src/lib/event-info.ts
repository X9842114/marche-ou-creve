/** Contenu éditable : règlement + disponibilités (étape 2 inscription) */

export type AvailabilitySlot = {
  day: string;
  time: string;
};

export const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  { day: "Vendredi 31", time: "21h30" },
];

export const EVENT_FLOW: string[] = [
  "Marche uniquement à pied",
  "Rester avec le peloton jusqu’à la fin",
  "Pas de limite de temps (2h à 10h)",
];

export const EVENT_RULES: string[] = [
  "Armement interdit (aucune arme)",
  "Respecter les consignes des organisateurs",
  "Rester dans le peloton",
  "1 infraction = 1 avertissement",
  "3 avertissements = éliminé",
  "Pour gagner : il doit rester au moins 2 policiers, ou au moins 2 personnes de l’illégal à la fin",
];

export const REWARD_LE_WIN: string[] = [
  "Condition : au moins 2 policiers encore en course à la fin",
  "Accès à la position du labo H-47",
  "Possibilité de créer une pénurie",
  "Opération de destruction le lendemain (police + armée)",
];

export const REWARD_ILLEGAL_WIN: string[] = [
  "Condition : au moins 2 personnes de l’illégal encore en course à la fin",
  "Pas d’accès au labo pour les forces de l’ordre",
  "Pas d’opération de destruction",
  "Le labo H-47 reste secret",
];
