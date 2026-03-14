import type { PortConfig } from './types';

// 5 highest-value ports — inner = berths/terminals, outer = approach/anchorage
// Zones calibrated to published port boundaries and anchorage areas
export const PORTS: PortConfig[] = [
  {
    name: 'Rotterdam',
    lat: 51.92, lon: 4.25,
    locode: ['NLRTM', 'ROTTERDAM', 'ROTTM', 'RTM', 'RTDM'],
    inner: { lat: [51.86, 51.98], lon: [3.95, 4.52] },   // Nieuwe Waterweg/Maasvlakte–Pernis
    outer: { lat: [51.78, 52.02], lon: [3.72, 4.72] },   // Approach + North Sea anchorages
    maxCapacity: 80,
    utcOffset: 1,
  },
  {
    name: 'Singapore',
    lat: 1.27, lon: 103.82,
    locode: ['SGSIN', 'SINGAPORE', 'SGP', 'SNGPORE'],
    inner: { lat: [1.22, 1.32], lon: [103.76, 104.02] }, // PSA terminals + Jurong
    outer: { lat: [1.08, 1.42], lon: [103.62, 104.18] }, // Eastern + Western anchorages
    maxCapacity: 120,
    utcOffset: 8,
  },
  {
    name: 'Los Angeles',
    lat: 33.74, lon: -118.27,
    locode: ['USLAX', 'LOS ANGELES', 'LOSANGELES', 'LA', 'LONG BEACH', 'USLGB'],
    inner: { lat: [33.71, 33.78], lon: [-118.32, -118.12] }, // San Pedro Bay (LA + LB)
    outer: { lat: [33.62, 33.85], lon: [-118.45, -118.02] }, // Approach + anchorage
    maxCapacity: 70,
    utcOffset: -8,
  },
  {
    name: 'Hamburg',
    lat: 53.54, lon: 9.97,
    locode: ['DEHAM', 'HAMBURG', 'HAMBG', 'HH'],
    inner: { lat: [53.50, 53.58], lon: [9.88, 10.05] },   // Elbe port area
    outer: { lat: [53.42, 53.63], lon: [9.72, 10.22] },   // Elbe approach + anchorages
    maxCapacity: 60,
    utcOffset: 1,
  },
  {
    name: 'Antwerp',
    lat: 51.27, lon: 4.34,
    locode: ['BEANR', 'ANTWERP', 'ANTWRP', 'ANR'],
    inner: { lat: [51.22, 51.32], lon: [4.28, 4.48] },   // Scheldt berths
    outer: { lat: [51.12, 51.42], lon: [4.12, 4.62] },   // Scheldt approach
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
