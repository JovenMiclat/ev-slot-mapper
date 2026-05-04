import type { Coordinates } from "../types";

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export const isValidCoordinates = (coords?: Partial<Coordinates> | null): coords is Coordinates => {
  return (
    Boolean(coords) &&
    isFiniteNumber(coords?.lat) &&
    isFiniteNumber(coords?.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
};

export const withFallbackCoordinates = (
  coords: Partial<Coordinates> | null | undefined,
  fallback: Coordinates
): Coordinates => {
  if (!isValidCoordinates(coords)) {
    return fallback;
  }

  return {
    lat: coords.lat,
    lng: coords.lng,
    accuracy: isFiniteNumber(coords.accuracy) ? coords.accuracy : undefined
  };
};
