export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

// Coordinates nudged slightly offshore from the real anchorage so ships
// don't visually sit on top of land.
export const PORTS: Port[] = [
  { id: "rotterdam", name: "Rotterdam", country: "Netherlands", lat: 51.95, lng: 3.9 },
  { id: "singapore", name: "Singapore", country: "Singapore", lat: 1.18, lng: 103.85 },
  { id: "shanghai", name: "Shanghai", country: "China", lat: 30.6, lng: 122.6 },
  { id: "losangeles", name: "Los Angeles", country: "USA", lat: 33.68, lng: -118.35 },
  { id: "newyork", name: "New York", country: "USA", lat: 40.5, lng: -73.4 },
  { id: "santos", name: "Santos", country: "Brazil", lat: -24.1, lng: -46.1 },
  { id: "capetown", name: "Cape Town", country: "South Africa", lat: -34.1, lng: 18.2 },
  { id: "jebelali", name: "Jebel Ali", country: "UAE", lat: 24.95, lng: 55.1 },
  { id: "sydney", name: "Sydney", country: "Australia", lat: -33.95, lng: 151.35 },
  { id: "panama", name: "Panama Canal", country: "Panama", lat: 8.5, lng: -79.6 },
  { id: "suez", name: "Suez", country: "Egypt", lat: 31.3, lng: 32.6 },
  { id: "mumbai", name: "Mumbai", country: "India", lat: 18.85, lng: 72.6 },
  { id: "yokohama", name: "Yokohama", country: "Japan", lat: 35.2, lng: 139.9 },
];

export const PORTS_BY_ID: Record<string, Port> = Object.fromEntries(
  PORTS.map((p) => [p.id, p]),
);
