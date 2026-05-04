import { useEffect, useMemo, useState } from "react";
import { stations } from "../data/stations";
import type { Coordinates, StationStatusOverlay } from "../types";

const route: Coordinates[] = [
  { lat: 14.5495, lng: 121.0448 },
  { lat: 14.5521, lng: 121.0509 },
  { lat: 14.5564, lng: 121.0555 },
  { lat: 14.5634, lng: 121.0487 },
  { lat: 14.5699, lng: 121.0216 },
  { lat: 14.5792, lng: 121.0352 }
];

export const useDemoMode = (enabled: boolean) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  const coords = useMemo(() => {
    if (!enabled) {
      return route[1];
    }

    return route[tick % route.length];
  }, [enabled, tick]);

  const overlays = useMemo<Record<string, StationStatusOverlay>>(() => {
    if (!enabled) {
      return {};
    }

    return stations.reduce<Record<string, StationStatusOverlay>>((statusByStation, station, index) => {
      const wave = (tick + index * 2) % (station.totalSlots + 2);
      const availableSlots = Math.min(station.totalSlots, Math.max(0, station.totalSlots - wave));

      statusByStation[station.id] = {
        availableSlots,
        updatedAt: new Date(Date.now() - index * 90000).toISOString(),
        reportSource: "demo simulation"
      };

      return statusByStation;
    }, {});
  }, [enabled, tick]);

  return {
    coords,
    overlays,
    tick
  };
};
