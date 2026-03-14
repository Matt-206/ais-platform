import type { PortConfig } from './types';

// 5 highest-value ports — inner = port/berth area, outer = approach/anchorage
// Zones tightened to avoid inflating counts with distant traffic (e.g. North Sea)
export const PORTS: PortConfig[] = [
  {
    name: 'Rotterdam',
    lat: 51.95, lon: 4.25,
    locode: ['NLRTM', 'ROTTERDAM', 'ROTTM', 'RTM', 'RTDM'],
    inner: { lat: [51.85, 52.02], lon: [4.10, 4.55] },
    outer: { lat: [51.75, 52.15], lon: [3.75, 4.85] },
    maxCapacity: 80,
    utcOffset: 1,
  },
  {
    name: 'Singapore',
    lat: 1.27, lon: 103.82,
    locode: ['SGSIN', 'SINGAPORE', 'SGP', 'SNGPORE'],
    inner: { lat: [1.20, 1.38], lon: [103.72, 104.05] },
    outer: { lat: [1.05, 1.55], lon: [103.55, 104.25] },
    maxCapacity: 120,
    utcOffset: 8,
  },
  {
    name: 'Los Angeles',
    lat: 33.73, lon: -118.27,
    locode: ['USLAX', 'LOS ANGELES', 'LOSANGELES', 'LA', 'LONG BEACH', 'USLGB'],
    inner: { lat: [33.65, 33.85], lon: [-118.45, -118.10] },
    outer: { lat: [33.45, 34.00], lon: [-118.75, -117.85] },
    maxCapacity: 70,
    utcOffset: -8,
  },
  {
    name: 'Hamburg',
    lat: 53.55, lon: 9.97,
    locode: ['DEHAM', 'HAMBURG', 'HAMBG', 'HH'],
    inner: { lat: [53.48, 53.58], lon: [9.85, 10.08] },
    outer: { lat: [53.38, 53.72], lon: [9.50, 10.55] },
    maxCapacity: 60,
    utcOffset: 1,
  },
  {
    name: 'Antwerp',
    lat: 51.27, lon: 4.30,
    locode: ['BEANR', 'ANTWERP', 'ANTWRP', 'ANR'],
    inner: { lat: [51.20, 51.35], lon: [4.25, 4.55] },
    outer: { lat: [51.05, 51.55], lon: [3.85, 4.95] },
    maxCapacity: 65,
    utcOffset: 1,
  },
];

export function getPortByName(name: string): PortConfig | undefined {
  return PORTS.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function inBox(
  lat: number, lon: number,
  zone: { lat: [number, number]; lon: [number, number] }
): boolean {
  return (
    lat >= zone.lat[0] && lat <= zone.lat[1] &&
    lon >= zone.lon[0] && lon <= zone.lon[1]
  );
}

export function normalizeDestination(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/[@#*]+/g, '').trim().toUpperCase();
  for (const port of PORTS) {
    for (const code of port.locode) {
      if (cleaned.includes(code)) return port.name;
    }
  }
  return cleaned;
}
