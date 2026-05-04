import type { Station } from "../types";

export const DEMO_CENTER = {
  lat: 14.5521,
  lng: 121.0509
};

export const stations: Station[] = [
  {
    id: "bgc-01",
    name: "BGC FastCharge",
    district: "Bonifacio Global City",
    lat: 14.5521,
    lng: 121.0509,
    totalSlots: 6,
    availableSlots: 3,
    costPerKwh: 28,
    maxKw: 120,
    connectorTypes: ["CCS2", "Type 2"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  },
  {
    id: "makati-02",
    name: "Makati Circuit Charge",
    district: "Makati",
    lat: 14.5699,
    lng: 121.0216,
    totalSlots: 4,
    availableSlots: 1,
    costPerKwh: 31,
    maxKw: 90,
    connectorTypes: ["CCS2", "CHAdeMO"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  },
  {
    id: "ortigas-03",
    name: "Ortigas EV Plaza",
    district: "Pasig",
    lat: 14.5869,
    lng: 121.0614,
    totalSlots: 5,
    availableSlots: 0,
    costPerKwh: 26,
    maxKw: 22,
    connectorTypes: ["Type 2"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  },
  {
    id: "moa-04",
    name: "MOA Bay Chargers",
    district: "Pasay",
    lat: 14.5352,
    lng: 120.9822,
    totalSlots: 8,
    availableSlots: 5,
    costPerKwh: 34,
    maxKw: 150,
    connectorTypes: ["CCS2", "Type 2", "GB/T"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  },
  {
    id: "qc-05",
    name: "Quezon Avenue Supercharge",
    district: "Quezon City",
    lat: 14.6312,
    lng: 121.0378,
    totalSlots: 7,
    availableSlots: 2,
    costPerKwh: 29,
    maxKw: 180,
    connectorTypes: ["CCS2", "Tesla"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  },
  {
    id: "alabang-06",
    name: "Alabang Town EV",
    district: "Muntinlupa",
    lat: 14.4241,
    lng: 121.0319,
    totalSlots: 4,
    availableSlots: 2,
    costPerKwh: 27,
    maxKw: 50,
    connectorTypes: ["CCS2", "Type 2"],
    updatedAt: "demo seed",
    statusSource: "seed data"
  }
];
