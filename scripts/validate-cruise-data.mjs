// Regression guard for src/data/cruise-fleet.json. Run manually after
// editing scripts/generate-cruise-data.mjs, and automatically before every
// build (see package.json "prebuild") and in CI, so a broken regeneration
// fails loudly instead of shipping a silently-corrupt schedule.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "..", "src", "data", "cruise-fleet.json");

const errors = [];

function fail(message) {
  errors.push(message);
}

const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

const startMs = Date.parse(data.meta?.startDate ?? "");
const endMs = Date.parse(data.meta?.endDate ?? "");
if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
  fail(`meta.startDate/endDate invalid or non-increasing: ${data.meta?.startDate} -> ${data.meta?.endDate}`);
}

const portIds = new Set((data.ports ?? []).map((p) => p.id));
if (portIds.size === 0) fail("no ports defined");
for (const p of data.ports ?? []) {
  if (typeof p.lat !== "number" || Math.abs(p.lat) > 90) fail(`port ${p.id} has invalid lat: ${p.lat}`);
  if (typeof p.lng !== "number" || Math.abs(p.lng) > 180) fail(`port ${p.id} has invalid lng: ${p.lng}`);
}

if (!Array.isArray(data.ships) || data.ships.length === 0) {
  fail("no ships defined");
}

for (const ship of data.ships ?? []) {
  const label = ship.name ?? ship.id ?? "<unnamed ship>";
  const schedule = ship.schedule ?? [];

  if (schedule.length < 2) {
    fail(`${label}: schedule has fewer than 2 stops (${schedule.length})`);
    continue;
  }
  if (!portIds.has(ship.homePortId)) {
    fail(`${label}: homePortId "${ship.homePortId}" is not a known port`);
  }

  let prevDepartureMs = null;
  for (let i = 0; i < schedule.length; i++) {
    const stop = schedule[i];
    if (!portIds.has(stop.portId)) {
      fail(`${label}: schedule[${i}] references unknown port "${stop.portId}"`);
    }
    const arrivalMs = Date.parse(stop.arrival);
    const departureMs = Date.parse(stop.departure);
    if (!Number.isFinite(arrivalMs) || !Number.isFinite(departureMs)) {
      fail(`${label}: schedule[${i}] has unparseable arrival/departure`);
      continue;
    }
    if (departureMs < arrivalMs) {
      fail(`${label}: schedule[${i}] departs (${stop.departure}) before it arrives (${stop.arrival})`);
    }
    if (prevDepartureMs != null && arrivalMs < prevDepartureMs) {
      fail(
        `${label}: schedule[${i}] arrival (${stop.arrival}) is before the previous stop's departure (${new Date(prevDepartureMs).toISOString()}) — overlapping legs`,
      );
    }
    prevDepartureMs = departureMs;
  }

  // The schedule must fully cover the published timeline window, with
  // margin, so every ship has a defined position at both ends.
  const firstArrivalMs = Date.parse(schedule[0].arrival);
  const lastDepartureMs = Date.parse(schedule[schedule.length - 1].departure);
  if (firstArrivalMs > startMs) {
    fail(`${label}: schedule starts (${schedule[0].arrival}) after the timeline start (${data.meta.startDate})`);
  }
  if (lastDepartureMs < endMs) {
    fail(`${label}: schedule ends (${schedule[schedule.length - 1].departure}) before the timeline end (${data.meta.endDate})`);
  }
}

if (errors.length > 0) {
  console.error(`[validate-cruise-data] ${errors.length} problem(s) found in ${DATA_PATH}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`[validate-cruise-data] OK — ${data.ships.length} ships, ${data.ports.length} ports, schedule covers ${data.meta.startDate} to ${data.meta.endDate}`);
