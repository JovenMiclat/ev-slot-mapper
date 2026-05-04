import { useEffect, useMemo, useState } from "react";
import type { Coordinates, Station } from "../types";
import { isValidCoordinates } from "../utils/coordinates";
import type { RouteMetricsMap } from "../utils/ranking";

type OsrmTableResponse = {
  distances?: Array<Array<number | null>>;
  durations?: Array<Array<number | null>>;
};

type RoutingState = {
  metrics: RouteMetricsMap;
  status: "idle" | "loading" | "ready" | "fallback";
};

const toCoordinateParam = (coords: Coordinates) => `${coords.lng},${coords.lat}`;

export const useDrivingDistances = (origin: Coordinates, stations: Station[]) => {
  const [routing, setRouting] = useState<RoutingState>({
    metrics: {},
    status: "idle"
  });

  const validStations = useMemo(() => stations.filter(isValidCoordinates), [stations]);

  useEffect(() => {
    if (!isValidCoordinates(origin) || validStations.length === 0) {
      setRouting({
        metrics: {},
        status: "idle"
      });
      return;
    }

    const controller = new AbortController();
    setRouting((current) => ({
      ...current,
      status: "loading"
    }));

    const coordinates = [origin, ...validStations].map(toCoordinateParam).join(";");
    const destinations = validStations.map((_, index) => String(index + 1)).join(";");
    const params = new URLSearchParams({
      sources: "0",
      destinations,
      annotations: "distance,duration"
    });

    fetch(`https://router.project-osrm.org/table/v1/driving/${coordinates}?${params.toString()}`, {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Driving distance lookup failed");
        }

        return response.json() as Promise<OsrmTableResponse>;
      })
      .then((payload) => {
        const metersByStation = payload.distances?.[0] ?? [];
        const secondsByStation = payload.durations?.[0] ?? [];
        const nextMetrics = validStations.reduce<RouteMetricsMap>((metricsByStation, station, index) => {
          const meters = metersByStation[index];
          const seconds = secondsByStation[index];

          if (typeof meters === "number" && Number.isFinite(meters)) {
            metricsByStation[station.id] = {
              distanceKm: meters / 1000,
              durationMinutes:
                typeof seconds === "number" && Number.isFinite(seconds) ? Math.max(1, Math.round(seconds / 60)) : undefined
            };
          }

          return metricsByStation;
        }, {});

        setRouting({
          metrics: nextMetrics,
          status: Object.keys(nextMetrics).length > 0 ? "ready" : "fallback"
        });
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setRouting({
            metrics: {},
            status: "fallback"
          });
        }
      });

    return () => controller.abort();
  }, [origin, validStations]);

  return routing;
};
