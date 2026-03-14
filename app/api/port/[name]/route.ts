import { NextRequest, NextResponse } from 'next/server';
import { getPortByName } from '@/lib/ports-config';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';
import { computeContainerRates, getDDRate, scoreToColor, getCongestionLevel } from '@/lib/congestion';
import { PORT_TRADE_LANE } from '@/lib/trade-lanes';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 30;

const RELAY_URL = process.env.RELAY_URL ?? '';

function enrichPort(p: PortState): PortState {
  const tradeLaneId = PORT_TRADE_LANE[p.name];
  const { rate, multiplier, level, color } = getDDRate(p.score, tradeLaneId);
  return {
    ...p,
    ddRate:         rate,
    ddMultiplier:   multiplier,
    level:          getCongestionLevel(p.score),
    color:          scoreToColor(p.score),
    containerRates: computeContainerRates(multiplier),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const portConfig = getPortByName(decodeURIComponent(name));

  if (!portConfig) {
    return NextResponse.json({ error: 'Port not found' }, { status: 404 });
  }

  // ── Try live relay ──────────────────────────────────────────────────────
  if (RELAY_URL) {
    try {
      const res = await fetch(
        `${RELAY_URL}/port/${encodeURIComponent(portConfig.name)}`,
        {
          signal: AbortSignal.timeout(25_000),
          headers: { 'Cache-Control': 'no-store' },
        }
      );

      if (res.ok) {
        const data = await res.json() as PortState & { totalVessels?: number; source?: string };
        // Use live data only when vessels or a score are present
        const hasData = (data.totalVessels ?? 0) > 0 || data.score > 0;
        if (hasData) {
          return NextResponse.json(enrichPort(data));
        }
      }
    } catch {
      // relay down — fall through to snapshot
    }
  }

  // ── Fallback: CSV snapshot ────────────────────────────────────────────────
  // Background warm-up ping — same rationale as /api/ports fallback.
  if (RELAY_URL) {
    fetch(`${RELAY_URL}/`, { signal: AbortSignal.timeout(5_000) }).catch(() => {});
  }

  const seed = seedData as { ports: PortState[] };
  const portState = seed.ports.find(
    p => p.name.toLowerCase() === portConfig.name.toLowerCase()
  );

  if (!portState) {
    return NextResponse.json({ error: 'Port state unavailable' }, { status: 500 });
  }

  const vessels = portState.vessels ?? [];
  const commercialVessels = portState.commercialVessels ?? vessels.filter((v: { shipType?: number | null }) => v.shipType != null && v.shipType >= 70 && v.shipType <= 89).length;
  const other = Math.max(0, (portState.totalVessels ?? 0) - (portState.anchored ?? 0) - (portState.moored ?? 0) - (portState.underway ?? 0));
  const enriched = enrichPort({
    ...portState,
    lastUpdated: new Date().toISOString(),
    source: 'csv-snapshot',
    other,
    commercialVessels,
    dataQuality: {
      totalVessels: portState.totalVessels ?? 0,
      commercialVessels,
      messageCount: 0,
      anchored: portState.anchored ?? 0,
      moored: portState.moored ?? 0,
      underway: portState.underway ?? 0,
      inbound: portState.inbound ?? 0,
    },
    confidence: 'high', // snapshot has full data
  } as PortState);
  return NextResponse.json(enriched);
}
