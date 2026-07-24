export type EventMode = "inscription" | "closed";

export interface EventSettings {
  mode: EventMode;
  updatedAt: string;
  mixerAt: string | null;
  /** Afficher la sélection tirée au sort sur le site public */
  showDrawn: boolean;
}
