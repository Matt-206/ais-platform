export type CongestionLevel = 'Low' | 'Moderate' | 'High' | 'Severe' | 'Critical';

export interface PortZone {
  lat: [number, number];
  lon: [number, number];
}

export interface PortConfig {
  name: string;
  lat: number;
  lon: number;
  locode: string[];
  inner: PortZone;
  outer: PortZone;
  maxCapacity: number; // max expected vessels in inner zone
}

export interface VesselRecord {
  mmsi: number;
  name: string;
  speed: number | null;
  heading: number | null;
  navStatus: number | null;
  shipType: number | null;
  destination: string | null;
  lat: number;
  lon: number;
  zone: 'inner' | 'outer';
  lastSeen: number; // unix ms
}

export interface PortState {
  name: string;
  lat: number;
  lon: number;
  score: number;
  level: CongestionLevel;
  ddRate: number;
  ddMultiplier: number;
  color: string;
  anchored: number;
  moored: number;
  underway: number;
  inbound: number;
  totalVessels: number;
  vessels: VesselRecord[];
  forecast: number[];
  lastUpdated: string;
}

export interface AISMeta {
  MMSI: number;
  ShipName: string;
  latitude: number;
  longitude: number;
  time_utc: string;
}

export interface AISMessage {
  MessageType: string;
  MetaData: AISMeta;
  Message: Record<string, Record<string, unknown>>;
}

export interface DDRate {
  rate: number;
  multiplier: number;
  level: CongestionLevel;
  color: string;
}
