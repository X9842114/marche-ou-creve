export type DistrictId =
  | "mission_row"
  | "alta"
  | "roxwood"
  | "vespucci"
  | "sandyshore"
  | "ls_army";

export type RaceStatus = "en_course" | "elimine";

export const MAX_WARNINGS = 3;

export interface Participant {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  idUnique: string;
  district: DistrictId;
  registeredAt: string;
  /** Tirage mixer : sélectionné pour la course */
  selected: boolean;
  /** Avertissements course (0 → MAX_WARNINGS) */
  warnings: number;
  status: RaceStatus;
}

export interface ParticipantInput {
  nom: string;
  prenom: string;
  matricule: string;
  idUnique: string;
  district: DistrictId;
}

export interface MixerDistrictResult {
  district: DistrictId;
  label: string;
  pool: number;
  picked: Participant[];
}
