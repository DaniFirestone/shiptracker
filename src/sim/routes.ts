export interface ShippingLane {
  id: string;
  name: string;
  ports: string[]; // cyclic list of port ids; last connects back to first
}

export const LANES: ShippingLane[] = [
  {
    id: "asia-europe",
    name: "Asia - Europe",
    ports: ["rotterdam", "suez", "mumbai", "singapore", "shanghai", "singapore", "mumbai", "suez"],
  },
  {
    id: "trans-pacific",
    name: "Trans-Pacific",
    ports: ["shanghai", "yokohama", "losangeles"],
  },
  {
    id: "trans-atlantic",
    name: "Trans-Atlantic",
    ports: ["rotterdam", "newyork"],
  },
  {
    id: "panama-westcoast",
    name: "Panama - West Coast",
    ports: ["losangeles", "panama", "santos"],
  },
  {
    id: "africa-middleeast",
    name: "Africa - Middle East",
    ports: ["capetown", "jebelali", "mumbai"],
  },
  {
    id: "oceania",
    name: "Oceania - Asia",
    ports: ["singapore", "sydney", "jebelali"],
  },
];
