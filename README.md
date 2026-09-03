# ShipTracker

An interactive ship location tracker: a fleet of simulated vessels moves along
real-world shipping lanes on a live map, in real time.

## What it does

- 42 ships (Container, Tanker, Bulk Carrier, LNG Carrier, Cargo) sail great-circle
  routes between 13 major world ports (Rotterdam, Singapore, Shanghai, Los Angeles,
  Suez, Panama, and more).
- Positions are simulated client-side — no backend, no API keys, no external
  data feed — using spherical interpolation so routes curve realistically over
  long distances.
- The map (MapLibre GL JS, free/open vector-tile basemap) shows live ship
  icons rotated to their heading, fading trails, and port markers.
- The sidebar lists every ship with search and type filtering, and a
  simulation-speed slider (1x-200x) to fast-forward the clock.
- Click a ship (on the map or in the list) to fly to it and see live speed,
  heading, position, destination, distance remaining, and ETA.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static production
build in `dist/`; `npm run preview` serves it locally to sanity-check.

## Notes

- `scripts/sync-maplibre-worker.mjs` copies maplibre-gl's worker script (and
  its sibling shared chunk) into `public/maplibre-worker/` so it's served as
  a plain static file rather than bundled — bundling it breaks its internal
  relative import in production. This runs automatically before `dev` and
  `build`.
- The basemap tiles come from a public CARTO/OpenStreetMap CDN with no API
  key required; ships, trails, and ports render independently of whether
  those tiles load, so the app stays functional on restrictive networks.
