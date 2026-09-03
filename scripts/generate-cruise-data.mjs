// Generates six months of made-up (but internally consistent) itinerary
// data for an 11-ship fictional cruise line, and writes it to
// src/data/cruise-fleet.json as static test data. The app reads that file
// at build time — it does not regenerate schedules at runtime.
//
// Re-run with `node scripts/generate-cruise-data.mjs` after editing the
// fleet/itinerary definitions below.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "..", "src", "data", "cruise-fleet.json");

const CRUISE_LINE = "Meridian Cruise Line";
const START_DATE = new Date("2027-01-01T00:00:00Z");
const END_DATE = new Date("2027-07-01T00:00:00Z"); // 6 months
// Generate a little padding on each side so ships mid-itinerary at the
// window edges still have a fully defined leg to interpolate within.
const PAD_MS = 5 * 24 * 60 * 60 * 1000;

const EARTH_RADIUS_NM = 3440.065;
function haversineNm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return EARTH_RADIUS_NM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PORTS = [
  { id: "miami", name: "Miami", country: "USA", lat: 25.77, lng: -80.13 },
  { id: "portcanaveral", name: "Port Canaveral", country: "USA", lat: 28.41, lng: -80.6 },
  { id: "cozumel", name: "Cozumel", country: "Mexico", lat: 20.51, lng: -86.95 },
  { id: "costamaya", name: "Costa Maya", country: "Mexico", lat: 18.7, lng: -87.7 },
  { id: "grandcayman", name: "Grand Cayman", country: "Cayman Islands", lat: 19.3, lng: -81.38 },
  { id: "nassau", name: "Nassau", country: "Bahamas", lat: 25.08, lng: -77.35 },
  { id: "stthomas", name: "St. Thomas", country: "USVI", lat: 18.34, lng: -64.93 },
  { id: "sanjuan", name: "San Juan", country: "Puerto Rico", lat: 18.47, lng: -66.12 },
  { id: "barcelona", name: "Barcelona", country: "Spain", lat: 41.38, lng: 2.18 },
  { id: "marseille", name: "Marseille", country: "France", lat: 43.3, lng: 5.37 },
  { id: "civitavecchia", name: "Rome (Civitavecchia)", country: "Italy", lat: 42.09, lng: 11.8 },
  { id: "naples", name: "Naples", country: "Italy", lat: 40.84, lng: 14.25 },
  { id: "santorini", name: "Santorini", country: "Greece", lat: 36.39, lng: 25.46 },
  { id: "mykonos", name: "Mykonos", country: "Greece", lat: 37.44, lng: 25.33 },
  { id: "piraeus", name: "Piraeus (Athens)", country: "Greece", lat: 37.94, lng: 23.65 },
];
const PORT_BY_ID = Object.fromEntries(PORTS.map((p) => [p.id, p]));

// Each template is a cyclic itinerary: an ordered list of stops, each with
// how long the ship stays in port. The first stop is the home port, where
// the cycle turns around. Transit time between consecutive stops is derived
// from real great-circle distance at the ship's cruising speed, so total
// cycle length is a natural consequence rather than a forced number.
// `padHoursPerLeg` models the fact that real cruise ships rarely sail at
// full cruising speed the whole way — schedules are paced with deliberate
// sea days and slow steaming so the ship arrives on time. It's added to
// every leg's computed (distance / speed) transit time.
const ITINERARY_TEMPLATES = {
  "western-caribbean": {
    name: "Western Caribbean",
    region: "Caribbean",
    padHoursPerLeg: 16,
    stops: [
      { portId: "miami", portHours: 8 },
      { portId: "cozumel", portHours: 9 },
      { portId: "costamaya", portHours: 8 },
      { portId: "grandcayman", portHours: 8 },
    ],
  },
  "eastern-caribbean": {
    name: "Eastern Caribbean",
    region: "Caribbean",
    padHoursPerLeg: 4,
    stops: [
      { portId: "portcanaveral", portHours: 8 },
      { portId: "nassau", portHours: 9 },
      { portId: "stthomas", portHours: 9 },
      { portId: "sanjuan", portHours: 8 },
    ],
  },
  "bahamas-getaway": {
    name: "Bahamas Getaway",
    region: "Bahamas",
    padHoursPerLeg: 8,
    stops: [
      { portId: "miami", portHours: 6 },
      { portId: "nassau", portHours: 10 },
    ],
  },
  "western-mediterranean": {
    name: "Western Mediterranean",
    region: "Mediterranean",
    padHoursPerLeg: 14,
    stops: [
      { portId: "barcelona", portHours: 8 },
      { portId: "marseille", portHours: 9 },
      { portId: "civitavecchia", portHours: 10 },
      { portId: "naples", portHours: 8 },
    ],
  },
  "eastern-mediterranean": {
    name: "Eastern Mediterranean",
    region: "Mediterranean",
    padHoursPerLeg: 30,
    stops: [
      { portId: "civitavecchia", portHours: 9 },
      { portId: "santorini", portHours: 8 },
      { portId: "mykonos", portHours: 7 },
      { portId: "piraeus", portHours: 9 },
    ],
  },
};

const SHIPS = [
  { id: "horizon", name: "Meridian Horizon", templateId: "western-caribbean", guestCapacity: 4100, yearBuilt: 2016, cruiseSpeedKn: 21, startOffsetH: 0 },
  { id: "breeze", name: "Meridian Breeze", templateId: "western-caribbean", guestCapacity: 4350, yearBuilt: 2019, cruiseSpeedKn: 21, startOffsetH: 55 },
  { id: "wave", name: "Meridian Wave", templateId: "western-caribbean", guestCapacity: 3980, yearBuilt: 2013, cruiseSpeedKn: 20, startOffsetH: 110 },
  { id: "odyssey", name: "Meridian Odyssey", templateId: "eastern-caribbean", guestCapacity: 4700, yearBuilt: 2021, cruiseSpeedKn: 22, startOffsetH: 20 },
  { id: "spirit", name: "Meridian Spirit", templateId: "eastern-caribbean", guestCapacity: 4500, yearBuilt: 2018, cruiseSpeedKn: 21, startOffsetH: 70 },
  { id: "dawn", name: "Meridian Dawn", templateId: "eastern-caribbean", guestCapacity: 4250, yearBuilt: 2015, cruiseSpeedKn: 20, startOffsetH: 125 },
  { id: "sun", name: "Meridian Sun", templateId: "bahamas-getaway", guestCapacity: 3400, yearBuilt: 2012, cruiseSpeedKn: 19, startOffsetH: 10 },
  { id: "aurora", name: "Meridian Aurora", templateId: "western-mediterranean", guestCapacity: 5200, yearBuilt: 2022, cruiseSpeedKn: 22, startOffsetH: 0 },
  { id: "voyager", name: "Meridian Voyager", templateId: "western-mediterranean", guestCapacity: 4900, yearBuilt: 2017, cruiseSpeedKn: 21, startOffsetH: 80 },
  { id: "star", name: "Meridian Star", templateId: "eastern-mediterranean", guestCapacity: 5450, yearBuilt: 2023, cruiseSpeedKn: 22, startOffsetH: 30 },
  { id: "legacy", name: "Meridian Legacy", templateId: "eastern-mediterranean", guestCapacity: 4600, yearBuilt: 2014, cruiseSpeedKn: 20, startOffsetH: 130 },
];

function buildSchedule(ship) {
  const template = ITINERARY_TEMPLATES[ship.templateId];
  const stops = template.stops;
  const n = stops.length;

  // Precompute each leg's sailing time (from stop i's port to stop i+1's,
  // wrapping back to 0), at this ship's cruising speed.
  const legHours = stops.map((stop, i) => {
    const next = stops[(i + 1) % n];
    const from = PORT_BY_ID[stop.portId];
    const to = PORT_BY_ID[next.portId];
    const distanceNm = haversineNm(from.lat, from.lng, to.lat, to.lng);
    return distanceNm / ship.cruiseSpeedKn + template.padHoursPerLeg;
  });

  const rangeStart = START_DATE.getTime() - PAD_MS;
  const rangeEnd = END_DATE.getTime() + PAD_MS;

  const schedule = [];
  // Walk backward from a point inside the range to find a start before
  // rangeStart, then walk forward generating stops until past rangeEnd.
  let stopIndex = 0;
  let cursorMs = START_DATE.getTime() + ship.startOffsetH * 60 * 60 * 1000;

  // Rewind until we're safely before rangeStart.
  while (cursorMs > rangeStart) {
    const prevIndex = (stopIndex - 1 + n) % n;
    const prevLegHours = legHours[prevIndex];
    const prevPortHours = stops[prevIndex].portHours;
    cursorMs -= (prevPortHours + prevLegHours) * 60 * 60 * 1000;
    stopIndex = prevIndex;
  }

  // Walk forward, recording each port call, until past rangeEnd.
  while (cursorMs < rangeEnd) {
    const stop = stops[stopIndex];
    const arrival = cursorMs;
    const departure = arrival + stop.portHours * 60 * 60 * 1000;
    schedule.push({
      portId: stop.portId,
      arrival: new Date(arrival).toISOString(),
      departure: new Date(departure).toISOString(),
    });
    const legHoursToNext = legHours[stopIndex];
    cursorMs = departure + legHoursToNext * 60 * 60 * 1000;
    stopIndex = (stopIndex + 1) % n;
  }

  return schedule;
}

const shipsOut = SHIPS.map((ship) => {
  const template = ITINERARY_TEMPLATES[ship.templateId];
  return {
    id: ship.id,
    name: ship.name,
    itineraryName: template.name,
    region: template.region,
    homePortId: template.stops[0].portId,
    guestCapacity: ship.guestCapacity,
    yearBuilt: ship.yearBuilt,
    cruiseSpeedKn: ship.cruiseSpeedKn,
    schedule: buildSchedule(ship),
  };
});

const output = {
  meta: {
    cruiseLine: CRUISE_LINE,
    generatedAt: new Date().toISOString(),
    startDate: START_DATE.toISOString(),
    endDate: END_DATE.toISOString(),
    note: "Fictional test data generated by scripts/generate-cruise-data.mjs. Not real vessel positions.",
  },
  ports: PORTS,
  ships: shipsOut,
};

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n");
console.log(`[generate-cruise-data] wrote ${shipsOut.length} ships to ${OUT_PATH}`);
for (const s of shipsOut) {
  console.log(`  ${s.name.padEnd(20)} ${s.itineraryName.padEnd(22)} ${s.schedule.length} port calls`);
}
