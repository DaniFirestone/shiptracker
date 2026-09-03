# ShipTracker

An interactive ship location tracker for a fictional 11-ship cruise line,
**Meridian Cruise Line**, sailing six months of made-up (but internally
consistent) itineraries on a live, scrubbable map.

## What it does

- 11 ships across 5 itineraries — Western/Eastern Caribbean, a short Bahamas
  Getaway, and Western/Eastern Mediterranean — repeating continuously across
  a fixed six-month schedule (Jan 1 – Jul 1, 2027).
- All position/schedule data is static **test data**, generated once by
  `scripts/generate-cruise-data.mjs` into `src/data/cruise-fleet.json` — the
  app reads that file; it does not invent routes at runtime.
- The map (MapLibre GL JS, free/open vector-tile basemap) shows live ship
  icons rotated to heading, trails of each ship's last few days, and port
  markers, colored by region (Caribbean / Bahamas / Mediterranean).
- The sidebar has a play/pause clock, a **timeline scrubber** spanning the
  full six months (drag to jump to any date), a speed control, search, and
  region filtering.
- Click a ship (on the map or in the list) to fly to it and see live status
  (At Sea / In Port), current/next port, ETA, speed, heading, position,
  capacity, and build year.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static production
build in `dist/`; `npm run preview` serves it locally to sanity-check.

## Regenerating the test data

```bash
node scripts/generate-cruise-data.mjs
```

Edit the ports, itinerary templates, or ship roster at the top of that script
and re-run it to regenerate `src/data/cruise-fleet.json`.

## Notes

- `scripts/sync-maplibre-worker.mjs` copies maplibre-gl's worker script (and
  its sibling shared chunk) into `public/maplibre-worker/` so it's served as
  a plain static file rather than bundled — bundling it breaks its internal
  relative import in production. This runs automatically before `dev` and
  `build`.
- The basemap tiles come from a public CARTO/OpenStreetMap CDN with no API
  key required; ships, trails, and ports render independently of whether
  those tiles load, so the app stays functional on restrictive networks.
