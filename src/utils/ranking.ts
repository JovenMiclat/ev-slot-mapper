import type { Coordinates, RankedStation, Station } from "../types";
import { distanceInKm } from "./distance";

export type DrivingDistanceMap = Record<string, number>;

const getFreshnessPenalty = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return 0.35;
  }

  const ageMinutes = Math.max(0, (Date.now() - timestamp) / 60000);
  return Math.min(2.5, ageMinutes / 90);
};

export const rankStations = (
  stations: Station[],
  origin: Coordinates,
  drivingDistances: DrivingDistanceMap = {}
): RankedStation[] => {
  return stations
    .map((station) => {
      const drivingDistanceKm = drivingDistances[station.id];
      const hasDrivingDistance = Number.isFinite(drivingDistanceKm);
      const distanceKm = hasDrivingDistance ? drivingDistanceKm : distanceInKm(origin, station);
      const unavailablePenalty = station.availableSlots > 0 ? 0 : 1000;
      const costPenalty = station.costPerKwh * 0.035;
      const slotBonus = station.availableSlots * 0.8;
      const freshnessPenalty = getFreshnessPenalty(station.updatedAt);
      const score = unavailablePenalty + distanceKm * 1.15 + costPenalty + freshnessPenalty - slotBonus;

      return {
        ...station,
        distanceKm,
        distanceMode: hasDrivingDistance ? ("driving" as const) : ("direct" as const),
        score,
        rankLabel: station.availableSlots > 0 ? "Best available" : "Currently full"
      };
    })
    .sort((a, b) => a.score - b.score)
    .map((station, index) => ({
      ...station,
      rankLabel:
        station.availableSlots === 0
          ? "Currently full"
          : index === 0
            ? "Best match"
            : station.distanceKm < 2
              ? "Nearby"
              : "Available"
    }));
};

export const applyStatusOverlays = (
  stations: Station[],
  overlays: Record<string, Partial<Pick<Station, "availableSlots" | "updatedAt" | "statusSource">>>
) => {
  return stations.map((station) => ({
    ...station,
    ...overlays[station.id],
    availableSlots: Math.min(
      station.totalSlots,
      Math.max(0, overlays[station.id]?.availableSlots ?? station.availableSlots)
    )
  }));
};
