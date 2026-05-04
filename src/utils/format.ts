import type { StationStatusSource } from "../types";

export const formatUpdatedAt = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return updatedAt;
  }

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "less than 1 min ago";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
};

export const formatPeso = (amount: number) => `PHP ${amount.toFixed(0)}/kWh`;

export const formatDuration = (minutes?: number) => {
  if (!minutes || !Number.isFinite(minutes)) {
    return "ETA unavailable";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

export const formatStatusSource = (source: StationStatusSource) => {
  if (source === "station telemetry") {
    return "Live station feed";
  }

  if (source === "demo telemetry") {
    return "Demo live feed";
  }

  return "Seed status";
};

export const formatClockTime = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return updatedAt;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp);
};

export const formatStatusTimestamp = (updatedAt: string) => {
  const timestamp = Date.parse(updatedAt);

  if (Number.isNaN(timestamp)) {
    return updatedAt;
  }

  return `${formatClockTime(updatedAt)} · ${formatUpdatedAt(updatedAt)}`;
};
