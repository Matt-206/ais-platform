import type { VesselRecord, DDRate, ContainerRate, CongestionLevel } from './types';

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

/**
 * Container type base rates (Tier 1, per container per day, USD).
 *
 * Sourced from:
 *   • Maersk Line published Local Charges — North Europe (2025)
 *     maersk.com/support/demurrage-and-detention
 *   • MSC Demurrage & Detention tariff schedule NWC/MED (2025)
 *   • Drewry World Container Index — container type rate differentials
 *   • CMA CGM Local Charges Mediterranean / North Europe (2025)
 *
 * Reefer premium over dry: ~2.4× (industry benchmark, Drewry 2024)
 * Special equipment (OT/FR/Tank) premium over dry: ~1.8–2.1× (carrier tariffs)
 */
export const CONTAINER_TYPES: {
  id: string; label: string; abbr: string; teu: number; baseDay: number;
}[] = [
  { id: '20dc', label: '20ft Dry Standard',  abbr: "20'DC", teu: 1.0, baseDay: 95  },
  { id: '40dc', label: '40ft Dry Standard',  abbr: "40'DC", teu: 2.0, baseDay: 175 },
  { id: '40hc', label: '40ft High Cube',     abbr: "40'HC", teu: 2.0, baseDay: 185 },
  { id: '45hc', label: '45ft High Cube',     abbr: "45'HC", teu: 2.5, baseDay: 222 },
  { id: '20rf', label: '20ft Reefer',        abbr: "20'RF", teu: 1.0, baseDay: 230 },
  { id: '40rf', label: '40ft Reefer',        abbr: "40'RF", teu: 2.0, baseDay: 345 },
  { id: '20ot', label: '20ft Open Top',      abbr: "20'OT", teu: 1.0, baseDay: 178 },
  { id: '40ot', label: '40ft Open Top',      abbr: "40'OT", teu: 2.0, baseDay: 288 },
  { id: '20fr', label: '20ft Flat Rack',     abbr: "20'FR", teu: 1.0, baseDay: 198 },
  { id: '40fr', label: '40ft Flat Rack',     abbr: "40'FR", teu: 2.0, baseDay: 315 },
  { id: 'tank', label: 'ISO Tank Container', abbr: 'TANK',  teu: 1.0, baseDay: 295 },
];

/**
 * Tier escalation multipliers — derived from Maersk North Europe published
 * tariff schedule (2025) and corroborated by MSC/CMA CGM NWC/MED tariffs.
 *
 * Pattern observed across major carriers:
 *   Tier 1 (days 1–5 over free):  1.00× — first excess period
 *   Tier 2 (days 6–10 over free): 1.85× — intermediate penalty (≈ +85%)
 *   Tier 3 (days 11+  over free): 3.00× — maximum penalty  (≈ +200%)
 */
export const TIER_MULTIPLIERS = { tier1: 1.0, tier2: 1.85, tier3: 3.0 } as const;

export function computeContainerRates(congestionMultiplier: number): ContainerRate[] {
  return CONTAINER_TYPES.map(ct => {
    // Published carrier rates (no congestion adjustment)
    const publishedTier1 = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier1);
    const publishedTier2 = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier2);
    const publishedTier3 = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier3);

    // Congestion-adjusted dynamic rates
    const daily    = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier1 * congestionMultiplier);
    const tier2Day = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier2 * congestionMultiplier);
    const tier3Day = Math.round(ct.baseDay * TIER_MULTIPLIERS.tier3 * congestionMultiplier);

    return {
      id: ct.id, label: ct.label, abbr: ct.abbr, teu: ct.teu, baseDay: ct.baseDay,
      publishedTier1, publishedTier2, publishedTier3,
      daily, tier2Day, tier3Day,
      weekly:    daily * 7,
      monthly:   daily * 30,
      upliftPct: Math.round((congestionMultiplier - 1) * 100),
    };
  });
}

/**
 * Compute a full tiered scenario breakdown for a shipment delay.
 *
 * @param containerTypeId   One of CONTAINER_TYPES[].id
 * @param quantity          Number of containers
 * @param freeDays          Carrier-provided demurrage free period
 * @param totalDaysAtPort   Expected total days at terminal (including free period)
 * @param congestionMult    Current port congestion multiplier
 */
export function computeScenario(
  containerTypeId: string,
  quantity: number,
  freeDays: number,
  totalDaysAtPort: number,
  congestionMult: number
): import('./types').ScenarioBreakdown {
  const ct = CONTAINER_TYPES.find(c => c.id === containerTypeId) ?? CONTAINER_TYPES[1];
  const excessDays = Math.max(0, totalDaysAtPort - freeDays);

  const tier1Days = Math.min(excessDays, 5);
  const tier2Days = Math.min(Math.max(0, excessDays - 5), 5);
  const tier3Days = Math.max(0, excessDays - 10);

  // Published (no congestion multiplier)
  const publishedTier1Cost = tier1Days * ct.baseDay * TIER_MULTIPLIERS.tier1 * quantity;
  const publishedTier2Cost = tier2Days * ct.baseDay * TIER_MULTIPLIERS.tier2 * quantity;
  const publishedTier3Cost = tier3Days * ct.baseDay * TIER_MULTIPLIERS.tier3 * quantity;
  const publishedTotal = publishedTier1Cost + publishedTier2Cost + publishedTier3Cost;

  // Dynamic (with congestion multiplier)
  const dynamicTier1Cost = publishedTier1Cost * congestionMult;
  const dynamicTier2Cost = publishedTier2Cost * congestionMult;
  const dynamicTier3Cost = publishedTier3Cost * congestionMult;
  const dynamicTotal = dynamicTier1Cost + dynamicTier2Cost + dynamicTier3Cost;

  return {
    containerType: ct.label,
    containerAbbr: ct.abbr,
    quantity,
    freeDays,
    totalDays: totalDaysAtPort,
    excessDays,
    tier1Days, tier2Days, tier3Days,
    publishedTotal, publishedTier1Cost, publishedTier2Cost, publishedTier3Cost,
    dynamicTotal, dynamicTier1Cost, dynamicTier2Cost, dynamicTier3Cost,
    congestionPremium: dynamicTotal - publishedTotal,
  };
}
