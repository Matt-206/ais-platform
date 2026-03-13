import type { PortConfig } from './types';

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
    inner: { lat: [1.00, 1.55], lon: [103.50, 104.20] },
    outer: { lat: [0.70, 1.80], lon: [103.00, 104.50] },
    maxCapacity: 120,
  },
  {
    name: 'Shanghai',
    lat: 31.20, lon: 121.70,
    locode: ['CNSHA', 'SHANGHAI', 'SHNGHI', 'CNSGH'],
    inner: { lat: [30.80, 31.55], lon: [121.00, 122.30] },
    outer: { lat: [30.40, 32.00], lon: [120.50, 122.80] },
    maxCapacity: 150,
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
    inner: { lat: [53.40, 53.80], lon: [9.50, 10.50] },
    outer: { lat: [53.20, 54.00], lon: [8.80, 11.00] },
    maxCapacity: 60,
  },
  {
    name: 'Antwerp',
    lat: 51.27, lon: 4.30,
    locode: ['BEANR', 'ANTWERP', 'ANTWRP', 'ANR'],
    inner: { lat: [51.00, 51.60], lon: [3.80, 4.80] },
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
    name: 'Busan',
    lat: 35.10, lon: 129.05,
    locode: ['KRPUS', 'BUSAN', 'PUSAN'],
    inner: { lat: [34.90, 35.40], lon: [128.70, 129.35] },
    outer: { lat: [34.60, 35.70], lon: [128.30, 129.80] },
    maxCapacity: 90,
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
    inner: { lat: [22.10, 22.55], lon: [113.90, 114.50] },
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
    inner: { lat: [49.40, 49.65], lon: [-0.25, 0.55] },
    outer: { lat: [49.20, 49.85], lon: [-0.70, 1.10] },
    maxCapacity: 50,
  },
  {
    name: 'Piraeus',
    lat: 37.95, lon: 23.65,
    locode: ['GRPIR', 'PIRAEUS', 'PIRAEOS', 'ATHENS'],
    inner: { lat: [37.80, 38.10], lon: [23.40, 23.95] },
    outer: { lat: [37.55, 38.35], lon: [23.00, 24.40] },
    maxCapacity: 55,
  },
  {
    name: 'Valencia',
    lat: 39.45, lon: -0.35,
    locode: ['ESVLC', 'VALENCIA', 'VLC'],
    inner: { lat: [39.30, 39.60], lon: [-0.55, -0.10] },
    outer: { lat: [39.10, 39.80], lon: [-0.90, 0.20] },
    maxCapacity: 45,
  },
  {
    name: 'Barcelona',
    lat: 41.37, lon: 2.16,
    locode: ['ESBCN', 'BARCELONA', 'BCN'],
    inner: { lat: [41.27, 41.50], lon: [2.00, 2.35] },
    outer: { lat: [41.10, 41.70], lon: [1.70, 2.70] },
    maxCapacity: 45,
  },
  {
    name: 'Algeciras',
    lat: 36.13, lon: -5.45,
    locode: ['ESALG', 'ALGECIRAS', 'ALG', 'GIBRALTAR'],
    inner: { lat: [35.90, 36.35], lon: [-5.85, -5.15] },
    outer: { lat: [35.60, 36.60], lon: [-6.30, -4.60] },
    maxCapacity: 50,
  },
  {
    name: 'Ningbo-Zhoushan',
    lat: 29.88, lon: 122.00,
    locode: ['CNNBO', 'NINGBO', 'ZHOUSHAN', 'NINGBOZHOU'],
    inner: { lat: [29.60, 30.20], lon: [121.60, 122.50] },
    outer: { lat: [29.20, 30.60], lon: [121.00, 123.00] },
    maxCapacity: 120,
  },
  {
    name: 'Port Klang',
    lat: 3.00, lon: 101.38,
    locode: ['MYPKG', 'PORT KLANG', 'PORTKLANG', 'KLANG'],
    inner: { lat: [2.80, 3.25], lon: [101.20, 101.75] },
    outer: { lat: [2.50, 3.55], lon: [100.80, 102.20] },
    maxCapacity: 60,
  },
  {
    name: 'Tanjung Pelepas',
    lat: 1.37, lon: 103.55,
    locode: ['MYPTP', 'TANJUNG PELEPAS', 'PELEPAS', 'TG PELEPAS'],
    inner: { lat: [1.20, 1.55], lon: [103.40, 103.80] },
    outer: { lat: [0.90, 1.80], lon: [103.00, 104.30] },
    maxCapacity: 55,
  },
  {
    name: 'Guangzhou',
    lat: 22.70, lon: 113.50,
    locode: ['CNGZU', 'GUANGZHOU', 'NANSHA', 'CANTON', 'CNNSA'],
    inner: { lat: [22.50, 22.95], lon: [113.20, 113.85] },
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
