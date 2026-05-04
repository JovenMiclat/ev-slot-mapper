import type { Coordinates } from "../types";

export const getWazeUrl = ({ lat, lng }: Coordinates) => {
  const destination = encodeURIComponent(`${lat},${lng}`);
  return `https://waze.com/ul?ll=${destination}&navigate=yes&utm_source=ev_slot_mapper`;
};

export const getGoogleMapsUrl = ({ lat, lng }: Coordinates) => {
  const destination = encodeURIComponent(`${lat},${lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
};

export const openExternalRoute = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
