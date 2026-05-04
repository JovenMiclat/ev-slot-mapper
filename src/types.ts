export type ConnectorType = "CCS2" | "Type 2" | "CHAdeMO" | "Tesla" | "GB/T";
export type StationStatusSource = "seed data" | "station telemetry" | "demo telemetry";
export type ReportAction = "charging" | "left" | "full" | "available";
export type DistanceMode = "driving" | "direct";

export type Coordinates = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type Station = Coordinates & {
  id: string;
  name: string;
  district: string;
  totalSlots: number;
  availableSlots: number;
  costPerKwh: number;
  connectorTypes: ConnectorType[];
  updatedAt: string;
  statusSource: StationStatusSource;
};

export type StationStatusOverlay = {
  availableSlots: number;
  updatedAt: string;
  statusSource: StationStatusSource;
};

export type CommunityReport = {
  id: string;
  stationId: string;
  stationName: string;
  action: ReportAction;
  label: string;
  createdAt: string;
};

export type RankedStation = Station & {
  distanceKm: number;
  distanceMode: DistanceMode;
  score: number;
  rankLabel: string;
};

export type LocationState = {
  coords: Coordinates;
  status: "requesting" | "active" | "fallback" | "blocked" | "unsupported";
  source: "device" | "demo" | "fallback";
  message: string;
};
