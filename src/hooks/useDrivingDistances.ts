import { useEffect, useMemo, useState } from "react";
import type { Coordinates, Station } from "../types";
import { isValidCoordinates } from "../utils/coordinates";
import type { DrivingDistanceMap } from "../utils/ranking";

type OsrmTableResponse = {
  distances?: Array<Array<number | null>>;
};

const toCoordinateParam = (coords: Coordinates) => `${coords.lng},${coords.lat}`;

export const useDrivingDistances = (origin: Coordinates, stations: Station[]) => {
  const [distances, setDistances] = useState<DrivingDistanceMap>({});

  const validStations = useMemo(() => stations.filter(isValidCoordinates), [stations]);

  useEffect(() => {
    if (!isValidCoordinates(origin) || validStations.length === 0) {
      setDistances({});
      return;
    }

    const controller = new AbortController();
    const coordinates = [origin, ...validStations].map(toCoordinateParam).join(";");
    const destinations = validStations.map((_, index) => String(index + 1)).join(";");
    const params = new URLSearchParams({
      sources: "0",
      destinations,
      annotations: "distance"
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
        const nextDistances = validStations.reduce<DrivingDistanceMap>((distanceByStation, station, index) => {
          const meters = metersByStation[index];

          if (typeof meters === "number" && Number.isFinite(meters)) {
            distanceByStation[station.id] = meters / 1000;
          }

          return distanceByStation;
        }, {});

        setDistances(nextDistances);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setDistances({});
        }
      });

    return () => controller.abort();
  }, [origin, validStations]);

  return distances;
};
