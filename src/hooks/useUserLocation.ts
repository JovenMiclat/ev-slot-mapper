import { useEffect, useState } from "react";
import { DEMO_CENTER } from "../data/stations";
import type { LocationState } from "../types";
import { isValidCoordinates, withFallbackCoordinates } from "../utils/coordinates";

const fallbackLocation: LocationState = {
  coords: DEMO_CENTER,
  status: "fallback",
  source: "fallback",
  message: "Fallback location"
};

export const useUserLocation = (demoMode: boolean, demoCoords = DEMO_CENTER): LocationState => {
  const [location, setLocation] = useState<LocationState>(
    demoMode
      ? {
          coords: demoCoords,
          status: "active",
          source: "demo",
          message: "Demo drive"
        }
      : {
          ...fallbackLocation,
          status: "requesting",
          message: "Locating"
        }
  );

  useEffect(() => {
    if (demoMode) {
      setLocation({
        coords: withFallbackCoordinates(demoCoords, DEMO_CENTER),
        status: "active",
        source: "demo",
        message: "Demo drive"
      });
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocation({
        ...fallbackLocation,
        status: "unsupported",
        message: "Location unavailable"
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        if (!isValidCoordinates(nextCoords)) {
          setLocation({
            ...fallbackLocation,
            message: "Fallback location"
          });
          return;
        }

        setLocation({
          coords: withFallbackCoordinates(nextCoords, DEMO_CENTER),
          status: "active",
          source: "device",
          message: "Device location"
        });
      },
      () => {
        setLocation({
          ...fallbackLocation,
          status: "blocked",
          message: "Fallback location"
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [demoCoords, demoMode]);

  return location;
};
