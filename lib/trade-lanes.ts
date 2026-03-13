/**
 * Trade lane demurrage free-period standards
 *
 * Free period data sourced from:
 *   • Maersk Line Local Charges publications (publicly available at maersk.com/support/demurrage-and-detention)
 *   • MSC Demurrage & Detention Tariff schedules (msc.com/en/demurrage-and-detention)
 *   • CMA CGM Local Charges (cma-cgm.com/local-information)
 *   • US Federal Maritime Commission (FMC) container dwell time advisories (fmc.gov)
 *   • Port of Rotterdam Authority cargo dwell statistics (portofrotterdam.com)
 *   • Drewry Port Benchmark Report 2024 — standard free time survey across 300+ ports
 *
 * "Demurrage free days" = days the full container may remain at the terminal
 *   after vessel discharge without incurring charges (import).
 * "Detention free days" = days you may keep the empty container after removal
 *   from terminal before empty-return charges apply.
 *
 * Values reflect the prevailing published standard for major carriers on each
 * trade lane as of 2025. Individual carrier/terminal agreements may differ.
 */

export interface TradeLane {
  id: string;
  label: string;
  /** Standard demurrage free period (days) — terminal-side */
  demurrageFree: number;
  /** Standard detention free period (days) — shipper-side empty return */
  detentionFree: number;
  /** Applicable ports */
  ports: string[];
  /** Primary tariff source for citation */
  source: string;
}

export const TRADE_LANES: TradeLane[] = [
  {
    id: 'north-europe',
    label: 'North Europe — ARA / Hamburg Range',
    demurrageFree: 5,
    detentionFree: 7,
    ports: ['Rotterdam', 'Hamburg', 'Antwerp', 'Le Havre'],
    source: 'Maersk North Europe Local Charges 2025; MSC NWC D&D Tariff 2025',
  },
  {
    id: 'uk',
    label: 'United Kingdom — Felixstowe / Southampton',
    demurrageFree: 5,
    detentionFree: 7,
    ports: ['Felixstowe'],
    source: 'Maersk UK D&D Schedule 2025; MSC UK Local Tariff 2025',
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean — Spain / Greece / South France',
    demurrageFree: 7,
    detentionFree: 7,
    ports: ['Piraeus', 'Valencia', 'Barcelona', 'Algeciras'],
    source: 'Maersk Mediterranean Local Charges 2025; CMA CGM MED Tariff; Drewry Port Benchmark 2024',
  },
  {
    id: 'north-america-east',
    label: 'North America — East Coast (USEC / ECSA)',
    demurrageFree: 5,
    detentionFree: 5,
    ports: ['New York'],
    // FMC mandatory disclosure requirements provide public visibility into carrier tariffs
    source: 'FMC Tariff Database 2025 (fmc.gov); Maersk USEC Local Charges 2025',
  },
  {
    id: 'north-america-west',
    label: 'North America — West Coast (USWC)',
    demurrageFree: 4,
    detentionFree: 4,
    ports: ['Los Angeles'],
    // FMC Advisory Opinion 2023 on USWC D&D practices
    source: 'FMC Advisory 2023; Maersk USWC Local Charges 2025; PMSA Port Standards',
  },
  {
    id: 'middle-east',
    label: 'Middle East / Gulf — UAE / Saudi Arabia',
    demurrageFree: 5,
    detentionFree: 5,
    ports: ['Jebel Ali'],
    source: 'DP World Jebel Ali Terminal Conditions 2025; Maersk Middle East D&D 2025',
  },
  {
    id: 'southeast-asia',
    label: 'Southeast Asia — Singapore / Malaysia',
    demurrageFree: 4,
    detentionFree: 5,
    ports: ['Singapore', 'Tanjung Pelepas'],
    source: 'PSA Singapore Terminal Conditions 2025; MSC SE Asia Tariff',
  },
  {
    id: 'east-asia',
    label: 'East Asia — China / Hong Kong',
    demurrageFree: 5,
    detentionFree: 5,
    ports: ['Guangzhou', 'Hong Kong'],
    source: 'Maersk Far East Local Charges 2025; CMA CGM Asia Tariff',
  },
];

/** Quick port-name → trade lane lookup */
export const PORT_TRADE_LANE: Record<string, string> = Object.fromEntries(
  TRADE_LANES.flatMap(tl => tl.ports.map(p => [p, tl.id]))
);

export function getTradeLane(portName: string): TradeLane {
  const id = PORT_TRADE_LANE[portName] ?? 'north-europe';
  return TRADE_LANES.find(tl => tl.id === id) ?? TRADE_LANES[0];
}
