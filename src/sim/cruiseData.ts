import raw from "../data/cruise-fleet.json";

export interface Port {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ScheduleStop {
  portId: string;
  arrival: string;
  departure: string;
}

export type CruiseRegion = "Caribbean" | "Bahamas" | "Mediterranean";

export interface CruiseShip {
  id: string;
  name: string;
  itineraryName: string;
  region: CruiseRegion;
  homePortId: string;
  guestCapacity: number;
  yearBuilt: number;
  cruiseSpeedKn: number;
  schedule: ScheduleStop[];
}

interface CruiseFleetData {
  meta: {
    cruiseLine: string;
    generatedAt: string;
    startDate: string;
    endDate: string;
    note: string;
  };
  ports: Port[];
  ships: CruiseShip[];
}

const data = raw as CruiseFleetData;

export const CRUISE_LINE_NAME = data.meta.cruiseLine;
export const TIMELINE_START_MS = Date.parse(data.meta.startDate);
export const TIMELINE_END_MS = Date.parse(data.meta.endDate);

export const PORTS: Port[] = data.ports;
export const PORTS_BY_ID: Record<string, Port> = Object.fromEntries(PORTS.map((p) => [p.id, p]));

export const CRUISE_SHIPS: CruiseShip[] = data.ships;

export const REGIONS: CruiseRegion[] = ["Caribbean", "Bahamas", "Mediterranean"];
