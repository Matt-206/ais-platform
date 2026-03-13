import type { PortConfig } from './types';

// Ports removed due to insufficient AIS satellite coverage in this region:
//   Shanghai, Busan, Algeciras, Ningbo-Zhoushan, Port Klang
// All showed 0 vessels consistently across extended observation windows.
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
  {
    name: 'Jebel Ali',
    lat: 25.00, lon: 55.05,
    locode: ['AEJEA', 'JEBEL ALI', 'DUBAI', 'AEDXB', 'JEBELALI'],
    inner: { lat: [24.70, 25.30], lon: [54.80, 55.50] },
    outer: { lat: [24.30, 25.70], lon: [54.30, 56.00] },
    maxCapacity: 80,
  },
  {
    name: 'New York',
    lat: 40.67, lon: -74.03,
    locode: ['USNYC', 'NEW YORK', 'NEWYORK', 'NY', 'USNWK', 'BAYONNE'],
    inner: { lat: [40.40, 40.95], lon: [-74.35, -73.75] },
    outer: { lat: [40.10, 41.20], lon: [-74.80, -73.30] },
    maxCapacity: 55,
  },
  {
    name: 'Hong Kong',
    lat: 22.32, lon: 114.19,
    locode: ['HKHKG', 'HONG KONG', 'HONGKONG', 'HK', 'KWAI CHUNG'],
    inner: { lat: [22.15, 22.48], lon: [113.95, 114.40] },
    outer: { lat: [21.80, 22.80], lon: [113.50, 115.00] },
    maxCapacity: 100,
  },
  {
    name: 'Felixstowe',
    lat: 51.95, lon: 1.35,
    locode: ['GBFXT', 'FELIXSTOWE', 'FELIX'],
    inner: { lat: [51.85, 52.05], lon: [1.20, 1.60] },
    outer: { lat: [51.65, 52.25], lon: [0.80, 2.00] },
    maxCapacity: 40,
  },
  {
    name: 'Le Havre',
    lat: 49.50, lon: 0.10,
    locode: ['FRLEH', 'LE HAVRE', 'LEHAVRE', 'LH'],
    inner: { lat: [49.42, 49.62], lon: [-0.22, 0.50] },
    outer: { lat: [49.20, 49.85], lon: [-0.70, 1.10] },
    maxCapacity: 50,
  },
  {
    name: 'Piraeus',
    lat: 37.95, lon: 23.65,
    locode: ['GRPIR', 'PIRAEUS', 'PIRAEOS', 'ATHENS'],
    inner: { lat: [37.82, 38.05], lon: [23.45, 23.90] },
    outer: { lat: [37.55, 38.35], lon: [23.00, 24.40] },
    maxCapacity: 55,
  },
  {
    name: 'Valencia',
    lat: 39.45, lon: -0.35,
    locode: ['ESVLC', 'VALENCIA', 'VLC'],
    inner: { lat: [39.32, 39.58], lon: [-0.52, -0.12] },
    outer: { lat: [39.10, 39.80], lon: [-0.90, 0.20] },
    maxCapacity: 45,
  },
  {
    name: 'Barcelona',
    lat: 41.37, lon: 2.16,
    locode: ['ESBCN', 'BARCELONA', 'BCN'],
    inner: { lat: [41.29, 41.48], lon: [2.02, 2.33] },
    outer: { lat: [41.10, 41.70], lon: [1.70, 2.70] },
    maxCapacity: 45,
  },
  {
    name: 'Tanjung Pelepas',
    lat: 1.37, lon: 103.55,
    locode: ['MYPTP', 'TANJUNG PELEPAS', 'PELEPAS', 'TG PELEPAS'],
    inner: { lat: [1.20, 1.45], lon: [103.38, 103.63] },
    outer: { lat: [0.92, 1.72], lon: [103.05, 103.88] },
    maxCapacity: 55,
  },
  {
    name: 'Guangzhou',
    lat: 22.70, lon: 113.50,
    locode: ['CNGZU', 'GUANGZHOU', 'NANSHA', 'CANTON', 'CNNSA'],
    inner: { lat: [22.52, 22.92], lon: [113.18, 113.82] },
    outer: { lat: [22.20, 23.20], lon: [112.80, 114.30] },
    maxCapacity: 80,
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
