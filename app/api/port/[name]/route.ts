import { NextRequest, NextResponse } from 'next/server';
import { getPortByName } from '@/lib/ports-config';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';
import { computeContainerRates } from '@/lib/congestion';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 15;

const RELAY_URL = process.env.RELAY_URL ?? '';

function enrichPort(p: PortState): PortState {
  const mult = p.ddMultiplier ?? 1;
  return {
    ...p,
    containerRates: p.containerRates?.length ? p.containerRates : computeContainerRates(mult),
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
          signal: AbortSignal.timeout(10_000),
          headers: { 'Cache-Control': 'no-store' },
        }
      );

      if (res.ok) {
        const data = await res.json() as PortState & { totalVessels?: number; source?: string };
        // Use relay data only when it has live vessel observations
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
  const seed = seedData as { ports: PortState[] };
  const portState = seed.ports.find(
    p => p.name.toLowerCase() === portConfig.name.toLowerCase()
  );

  if (!portState) {
    return NextResponse.json({ error: 'Port state unavailable' }, { status: 500 });
  }

  return NextResponse.json(enrichPort({
    ...portState,
    lastUpdated: new Date().toISOString(),
    source: 'csv-snapshot',
  } as PortState));
}
