import type { DistrictId, Participant } from "@/types/participant";
import {
  Building2,
  Crosshair,
  Landmark,
  Sun,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";

export const PICKS_PER_DISTRICT = 10;

export interface District {
  id: DistrictId;
  label: string;
  shortLabel: string;
  color: string;
  icon: LucideIcon;
}

export const DISTRICTS: District[] = [
  {
    id: "mission_row",
    label: "Mission Row",
    shortLabel: "Mission Row",
    color: "#60a5fa",
    icon: Landmark, // QG PD centre-ville
  },
  {
    id: "alta",
    label: "Alta",
    shortLabel: "Alta",
    color: "#a78bfa",
    icon: Building2, // zone urbaine / buildings
  },
  {
    id: "roxwood",
    label: "Roxwood",
    shortLabel: "Roxwood",
    color: "#34d399",
    icon: Trees, // zone boisée / nord
  },
  {
    id: "vespucci",
    label: "Vespucci",
    shortLabel: "Vespucci",
    color: "#38bdf8",
    icon: Waves, // plage
  },
  {
    id: "sandyshore",
    label: "Sandy Shores",
    shortLabel: "Sandy Shores",
    color: "#fbbf24",
    icon: Sun, // désert
  },
  {
    id: "ls_army",
    label: "LS Army",
    shortLabel: "LS Army",
    color: "#4ade80",
    icon: Crosshair, // militaire
  },
];

export const districtIds = DISTRICTS.map((d) => d.id) as [
  DistrictId,
  ...DistrictId[],
];

export function getDistrict(id: DistrictId | string): District {
  return DISTRICTS.find((d) => d.id === id) ?? DISTRICTS[0];
}

export function countByDistrict(
  participants: Pick<Participant, "district">[],
  districtId: DistrictId
): number {
  return participants.filter((p) => p.district === districtId).length;
}
