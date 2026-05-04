# EV Slot Mapper

Mobile-first PWA for finding nearby crowd-reported EV charging slots, ranking stations by availability, distance, cost, and report freshness.

## Local Demo

```sh
npm install
npm run dev
```

Open:

- `http://localhost:5173/?demo=1` for simulated movement and station changes
- `http://localhost:5173/` for device geolocation with a demo fallback

## Build

```sh
npm run build
```

The production output is generated in `dist/`.

## Demo Script

1. Open `/?demo=1`.
2. Show ranked stations, open slots, cost, connectors, and freshness.
3. Switch to the map and tap a charger marker.
4. Open Waze, then show Google Maps fallback.
5. Use report actions to change crowd-reported availability.
6. Scan the in-app Demo QR from another phone.
7. Optional: tap voice mode and say "find nearest charging station" or "show available chargers".

Availability is crowd-reported demo data, not official live station telemetry.
