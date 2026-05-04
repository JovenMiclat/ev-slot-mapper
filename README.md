# EV Slot Mapper

Mobile-first PWA for finding nearby EV charging slots, ranking stations by automatic station status, distance, cost, and freshness.

## Local Demo

```sh
npm install
npm run dev
```

Open:

- `http://localhost:5173/?demo=1` for simulated movement and station changes
- `http://localhost:5173/` for device geolocation with a fallback location

## Build

```sh
npm run build
```

The production output is generated in `dist/`.

## Demo Script

1. Open `/?demo=1`.
2. Show ranked stations, open slots, cost, connectors, and telemetry freshness.
3. Switch to the map and tap a charger marker.
4. Open Waze, then show Google Maps fallback.
5. Use report actions to add community report log entries.
6. Scan the in-app Demo QR from another phone.
7. Optional: tap voice mode and say "find nearest charging station" or "show available chargers".

Availability comes from the automatic station status feed in this demo. Community reports are logged as observations and do not directly overwrite station slot counts. Distances use driving routes when the routing service is available, with direct-distance estimates as fallback.
