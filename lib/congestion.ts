import type { VesselRecord, DDRate, CongestionLevel } from './types';

// NavStatus codes that indicate a vessel is waiting (anchored/drifting outside port)
const ANCHORED_STATUSES = new Set([1]); // 1 = At anchor
const MOORED_STATUSES = new Set([5]);   // 5 = Moored
const UNDERWAY_STATUSES = new Set([0, 8]); // 0 = underway engine, 8 = underway sail

// Commercial vessel ship types (cargo + tanker)
function isCommercialVessel(shipType: number | null): boolean {
  if (shipType === null) return true; // include unknowns
  return (shipType >= 70 && shipType <= 89);
}

export function classifyNavStatus(navStatus: number | null, speed: number | null): 'anchored' | 'moored' | 'underway' | 'unknown' {
  if (navStatus === null) {
    if (speed !== null && speed < 0.5) return 'moored';
    return 'unknown';
  }
  if (ANCHORED_STATUSES.has(navStatus)) return 'anchored';
  if (MOORED_STATUSES.has(navStatus)) return 'moored';
  if (UNDERWAY_STATUSES.has(navStatus)) return 'underway';
  return 'unknown';
}

export function computeCongestionScore(
  vessels: VesselRecord[],
  maxCapacity: number
): number {
  if (vessels.length === 0) return 0;

  const innerVessels = vessels.filter(v => v.zone === 'inner');
  const outerVessels = vessels.filter(v => v.zone === 'outer');

  // Commercial vessels only for scoring
  const commercial = innerVessels.filter(v => isCommercialVessel(v.shipType));

  const anchoredCount = vessels.filter(v => classifyNavStatus(v.navStatus, v.speed) === 'anchored').length;
  const mooredCount = innerVessels.filter(v => classifyNavStatus(v.navStatus, v.speed) === 'moored').length;
  const underwayInner = innerVessels.filter(v => classifyNavStatus(v.navStatus, v.speed) === 'underway').length;

  // Anchored vessels (strongest signal — waiting outside port)
  // Weight: 40%
  const maxAnchored = Math.max(1, maxCapacity * 0.3);
  const anchoredScore = Math.min(1, anchoredCount / maxAnchored) * 40;

  // Vessel density in inner zone vs capacity
  // Weight: 25%
  const densityScore = Math.min(1, commercial.length / maxCapacity) * 25;

  // Low-speed ratio in inner zone (slow/stopped = congested)
  // Weight: 20%
  const slowVessels = innerVessels.filter(v => v.speed !== null && v.speed < 2).length;
  const lowSpeedRatio = innerVessels.length > 0 ? slowVessels / innerVessels.length : 0;
  const lowSpeedScore = lowSpeedRatio * 20;

  // Inbound pressure: outer zone vessels heading toward port
  // Weight: 15%
  const inboundCount = outerVessels.filter(v => classifyNavStatus(v.navStatus, v.speed) === 'underway').length;
  const inboundPressure = Math.min(1, inboundCount / Math.max(1, maxCapacity * 0.5)) * 15;

  const rawScore = anchoredScore + densityScore + lowSpeedScore + inboundPressure;
  return Math.min(100, Math.round(rawScore));
}

export function getCongestionLevel(score: number): CongestionLevel {
  if (score < 25) return 'Low';
  if (score < 50) return 'Moderate';
  if (score < 75) return 'High';
  if (score < 90) return 'Severe';
  return 'Critical';
}

export function getDDRate(score: number, baseRate = 800): DDRate {
  if (score < 25) return { rate: baseRate * 1.0,  multiplier: 1.0,  level: 'Low',      color: '#22c55e' };
  if (score < 50) return { rate: baseRate * 1.75, multiplier: 1.75, level: 'Moderate', color: '#eab308' };
  if (score < 75) return { rate: baseRate * 2.75, multiplier: 2.75, level: 'High',     color: '#f97316' };
  if (score < 90) return { rate: baseRate * 3.5,  multiplier: 3.5,  level: 'Severe',   color: '#ef4444' };
  return              { rate: baseRate * 4.5,  multiplier: 4.5,  level: 'Critical', color: '#991b1b' };
}

export function scoreToColor(score: number): string {
  if (score < 25)  return '#22c55e';
  if (score < 50)  return '#eab308';
  if (score < 75)  return '#f97316';
  if (score < 90)  return '#ef4444';
  return '#991b1b';
}
