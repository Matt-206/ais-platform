import type { PortConfig } from './types';

// 5 highest-value ports — concentrates sparse AISstream quota for better coverage
export const PORTS: PortConfig[] = [
  {
    name: 'Rotterdam',
    lat: 51.95, lon: 4.25,
    locode: ['NLRTM', 'ROTTERDAM', 'ROTTM', 'RTM', 'RTDM'],
    inner: { lat: [51.80, 52.10], lon: [3.90, 4.60] },
    outer: { lat: [51.60, 52.30], lon: [3.50, 5.20] },
    maxCapacity: 80,
  },
  {
    name: 'Singapore',
    lat: 1.27, lon: 103.82,
    locode: ['SGSIN', 'SINGAPORE', 'SGP', 'SNGPORE'],
    inner: { lat: [1.15, 1.45], lon: [103.65, 104.10] },
    outer: { lat: [0.90, 1.70], lon: [103.45, 104.40] },
    maxCapacity: 120,
  },
  {
    name: 'Los Angeles',
    lat: 33.73, lon: -118.27,
    locode: ['USLAX', 'LOS ANGELES', 'LOSANGELES', 'LA', 'LONG BEACH', 'USLGB'],
    inner: { lat: [33.50, 34.00], lon: [-118.80, -117.90] },
    outer: { lat: [33.20, 34.30], lon: [-119.20, -117.50] },
    maxCapacity: 70,
  },
  {
    name: 'Hamburg',
    lat: 53.55, lon: 9.97,
    locode: ['DEHAM', 'HAMBURG', 'HAMBG', 'HH'],
    inner: { lat: [53.45, 53.60], lon: [9.75, 10.15] },
    outer: { lat: [53.20, 54.00], lon: [8.80, 11.00] },
    maxCapacity: 60,
  },
  {
    name: 'Antwerp',
    lat: 51.27, lon: 4.30,
    locode: ['BEANR', 'ANTWERP', 'ANTWRP', 'ANR'],
    inner: { lat: [51.17, 51.37], lon: [4.22, 4.58] },
    outer: { lat: [50.80, 51.80], lon: [3.30, 5.30] },
    maxCapacity: 65,
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
