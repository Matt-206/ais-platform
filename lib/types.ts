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

/** Per-port data quality metrics for transparency and confidence scoring */
export interface DataQuality {
  totalVessels: number;
  commercialVessels: number;
  messageCount: number;
  anchored: number;
  moored: number;
  underway: number;
  inbound: number;
}

export interface PortState {
  name: string;
  lat: number;
  lon: number;
  reliability?: 'high' | 'medium' | 'low';
  score: number;
  level: CongestionLevel;
  ddRate: number;
  ddMultiplier: number;
  color: string;
  anchored: number;
  moored: number;
  underway: number;
  inbound: number;
  /** Vessels with navStatus not anchored/moored/underway — ensures anchored+moored+underway+other === totalVessels */
  other?: number;
  totalVessels: number;
  commercialVessels?: number;
  vessels: VesselRecord[];
  containerRates?: ContainerRate[];
  forecast: number[];
  lastUpdated: string;
  /** Data lineage: inputs used for congestion/pricing calculation */
  dataQuality?: DataQuality;
  /** Confidence in score based on vessel coverage: high | medium | low */
  confidence?: 'high' | 'medium' | 'low';
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
  /**
   * Additional free days offered at low occupancy (score < 25).
   * Score 0–10:  +5 free days  (terminal actively competing for cargo)
   * Score 10–25: +2 free days  (mild incentive to fill slack capacity)
   * Score 25+:    0 free days  (normal tariff schedule applies)
   *
   * Based on DP World off-peak terminal incentive programmes and
   * PSA Singapore slow-season free-time extensions (2024–2025).
   */
  bonusFreeDays: number;
  level: CongestionLevel;
  color: string;
}

/**
 * Per-container-type D&D rate with 3-tier escalation structure.
 *
 * Tier structure derived from Maersk Line North Europe published tariff (2025)
 * and corroborated by MSC / CMA CGM schedules:
 *   Tier 1 (days 1–5 over free period):  1.00× base  — "first excess" rate
 *   Tier 2 (days 6–10 over free period): 1.85× base  — "intermediate" rate
 *   Tier 3 (days 11+  over free period): 3.00× base  — "peak penalty" rate
 *
 * The congestion multiplier (from live AIS score) applies ON TOP of the tier
 * rate, representing the dynamic market adjustment recommended by this platform.
 *   effectiveRate = baseDay × tierMultiplier × congestionMultiplier
 */
export interface ContainerRate {
  id: string;
  label: string;
  abbr: string;
  teu: number;
  /** Carrier-published Tier 1 base rate (per container per day, USD) */
  baseDay: number;

  // ── Published carrier rates (no congestion adjustment) ──────────────────
  /** Published Tier 1 daily rate (= baseDay × 1.00) */
  publishedTier1: number;
  /** Published Tier 2 daily rate (= baseDay × 1.85) */
  publishedTier2: number;
  /** Published Tier 3 daily rate (= baseDay × 3.00) */
  publishedTier3: number;

  // ── Congestion-adjusted rates (recommended dynamic pricing) ─────────────
  /** Dynamic Tier 1 daily rate (= baseDay × 1.00 × congestionMultiplier) */
  daily: number;
  /** Dynamic Tier 2 daily rate (= baseDay × 1.85 × congestionMultiplier) */
  tier2Day: number;
  /** Dynamic Tier 3 daily rate (= baseDay × 3.00 × congestionMultiplier) */
  tier3Day: number;

  // ── Convenience aggregates (dynamic, Tier 1) ────────────────────────────
  weekly: number;
  monthly: number;
  upliftPct: number;
}

/** Tiered cost breakdown for a specific delay scenario */
export interface ScenarioBreakdown {
  containerType: string;
  containerAbbr: string;
  /** WTP elasticity factor used for this container type */
  wtpElasticity: number;
  quantity: number;
  freeDays: number;
  /** Bonus free days added by terminal at low occupancy */
  bonusFreeDays: number;
  /** freeDays + bonusFreeDays — actual chargeable threshold */
  effectiveFreeDays: number;
  totalDays: number;
  excessDays: number;
  tier1Days: number;
  tier2Days: number;
  tier3Days: number;
  /** Cost using published carrier tariff (no congestion multiplier) */
  publishedTotal: number;
  publishedTier1Cost: number;
  publishedTier2Cost: number;
  publishedTier3Cost: number;
  /** Cost with congestion-adjusted dynamic rates (WTP-elasticity adjusted) */
  dynamicTotal: number;
  dynamicTier1Cost: number;
  dynamicTier2Cost: number;
  dynamicTier3Cost: number;
  /** How much more the dynamic rate costs vs published (congestion premium) */
  congestionPremium: number;
  /** Effective per-container-type adjusted multiplier */
  adjustedMultiplier: number;
}
