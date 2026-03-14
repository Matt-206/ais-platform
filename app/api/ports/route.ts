import { NextResponse } from 'next/server';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';
import { computeContainerRates, getDDRate, scoreToColor, getCongestionLevel } from '@/lib/congestion';
import { PORT_TRADE_LANE } from '@/lib/trade-lanes';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 30;

const RELAY_URL = process.env.RELAY_URL ?? '';

/**
 * Recompute ddRate, ddMultiplier, level, color and containerRates using the
 * current scoring logic. Trade lane is resolved from port name so the base rate
 * reflects the actual lane (NE $975 vs SE Asia $720 etc.).
 */
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

export async function GET() {
  // ── Try live relay ────────────────────────────────────────────────────────
  if (RELAY_URL) {
    try {
      const res = await fetch(`${RELAY_URL}/ports`, {
        signal: AbortSignal.timeout(25_000),
        headers: { 'Cache-Control': 'no-store' },
      });

      if (res.ok) {
        const data = await res.json() as {
          ports: PortState[];
          messageCount: number;
          timestamp: string;
          source: string;
          relayConnected: boolean;
        };

        // Use live data only when vessels are actually present — relayConnected alone
        // is not sufficient since the relay may be connected but receiving no in-zone traffic
        const hasLiveVessels = data.ports.some(p => p.totalVessels > 0);
        if (hasLiveVessels) {
          return NextResponse.json({
            ...data,
            ports: data.ports.map(enrichPort),
          });
        }
      }
    } catch {
      // relay down — fall through to snapshot
    }
  }

  // ── Fallback: CSV snapshot ────────────────────────────────────────────────
  // Fire a background ping to wake the Render instance for the next request.
  // Vercel Hobby crons are limited to daily cadence, so we use the fallback
  // path itself as a keep-alive trigger (non-blocking, zero extra cost).
  if (RELAY_URL) {
    fetch(`${RELAY_URL}/`, { signal: AbortSignal.timeout(5_000) }).catch(() => {});
  }

  const seed = seedData as { ports: PortState[]; messageCount: number; timestamp: string };
  const now = new Date().toISOString();
  const ports = seed.ports.map(p => {
    const vessels = p.vessels ?? [];
    const commercialVessels = p.commercialVessels ?? vessels.filter((v: { shipType?: number | null }) => v.shipType != null && v.shipType >= 70 && v.shipType <= 89).length;
    const other = Math.max(0, (p.totalVessels ?? 0) - (p.anchored ?? 0) - (p.moored ?? 0) - (p.underway ?? 0));
    return enrichPort({
      ...p,
      lastUpdated: now,
      other,
      commercialVessels,
      dataQuality: {
        totalVessels: p.totalVessels ?? 0,
        commercialVessels,
        messageCount: 0,
        anchored: p.anchored ?? 0,
        moored: p.moored ?? 0,
        underway: p.underway ?? 0,
        inbound: p.inbound ?? 0,
      },
      confidence: 'high' as const,
    });
  });

  return NextResponse.json({
    ports,
    messageCount: 0,
    timestamp: now,
    source: 'csv-snapshot',
    wsError: RELAY_URL ? 'Relay unavailable or warming up — using snapshot' : 'No RELAY_URL configured',
  });
}
