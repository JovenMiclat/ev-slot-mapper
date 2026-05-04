import type { ConfidenceLabel, Coordinates, RankedStation, Station } from "../types";
import { distanceInKm } from "./distance";

export type RouteMetrics = {
  distanceKm: number;
  durationMinutes?: number;
};

export type RouteMetricsMap = Record<string, RouteMetrics>;

const getFreshnessPenalty = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return 0.35;
  }

  const ageMinutes = Math.max(0, (Date.now() - timestamp) / 60000);
  return Math.min(2.5, ageMinutes / 90);
};

const getAgeMinutes = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, (Date.now() - timestamp) / 60000);
};

const getConfidence = (
  station: Station,
  hasDrivingDistance: boolean
): { confidenceLabel: ConfidenceLabel; confidenceScore: number } => {
  const ageMinutes = getAgeMinutes(station.updatedAt);

  if (
    (station.statusSource === "station telemetry" || station.statusSource === "demo telemetry") &&
    ageMinutes <= 5 &&
    hasDrivingDistance
  ) {
    return {
      confidenceLabel: "High confidence",
      confidenceScore: 92
    };
  }

  if (station.statusSource !== "telemetry offline" && ageMinutes <= 30) {
    return {
      confidenceLabel: "Medium confidence",
      confidenceScore: 68
    };
  }

  return {
    confidenceLabel: "Low confidence",
    confidenceScore: 38
  };
};

export const rankStations = (
  stations: Station[],
  origin: Coordinates,
  routeMetrics: RouteMetricsMap = {}
): RankedStation[] => {
  return stations
    .map((station) => {
      const route = routeMetrics[station.id];
      const hasDrivingDistance = Boolean(route) && Number.isFinite(route.distanceKm);
      const distanceKm = hasDrivingDistance ? route.distanceKm : distanceInKm(origin, station);
      const confidence = getConfidence(station, hasDrivingDistance);
      const unavailablePenalty = station.availableSlots > 0 ? 0 : 1000;
      const costPenalty = station.costPerKwh * 0.035;
      const slotBonus = station.availableSlots * 0.8;
      const speedBonus = station.maxKw >= 100 ? 0.35 : station.maxKw >= 50 ? 0.15 : 0;
      const freshnessPenalty = getFreshnessPenalty(station.updatedAt);
      const score = unavailablePenalty + distanceKm * 1.15 + costPenalty + freshnessPenalty - slotBonus - speedBonus;

      return {
        ...station,
        distanceKm,
        distanceMode: hasDrivingDistance ? ("driving" as const) : ("direct" as const),
        durationMinutes: route?.durationMinutes,
        ...confidence,
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
