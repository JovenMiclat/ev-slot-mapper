import { useEffect, useMemo, useState } from "react";
import type { Station, StationStatusOverlay } from "../types";

export const useStationTelemetry = (stations: Station[], enabled = true) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 7000);

    return () => window.clearInterval(intervalId);
  }, [enabled]);

  return useMemo<Record<string, StationStatusOverlay>>(() => {
    if (!enabled) {
      return {};
    }

    return stations.reduce<Record<string, StationStatusOverlay>>((statusByStation, station, index) => {
      const cycle = (tick + index) % (station.totalSlots + 1);
      const availableSlots = Math.min(station.totalSlots, Math.max(0, station.totalSlots - cycle));

      statusByStation[station.id] = {
        availableSlots,
        updatedAt: new Date(Date.now() - index * 45000).toISOString(),
        statusSource: "station telemetry"
      };

      return statusByStation;
    }, {});
  }, [enabled, stations, tick]);
};
