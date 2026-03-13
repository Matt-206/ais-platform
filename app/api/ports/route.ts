import { NextResponse } from 'next/server';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';
import { computeContainerRates, getDDRate, scoreToColor, getCongestionLevel } from '@/lib/congestion';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 15;

const RELAY_URL = process.env.RELAY_URL ?? '';

/**
 * Always recompute ddRate, ddMultiplier, level, color from the current
 * getDDRate formula using the port's live score. This ensures the new
 * multiplier scale (including discounts at low occupancy) is applied
 * regardless of what the relay or seed data stored.
 */
function enrichPort(p: PortState): PortState {
  const { rate, multiplier, level, color } = getDDRate(p.score);
  return {
    ...p,
    ddRate:        rate,
    ddMultiplier:  multiplier,
    level:         getCongestionLevel(p.score),
    color:         scoreToColor(p.score),
    containerRates: computeContainerRates(multiplier),
  };
}

export async function GET() {
  // ── Try live relay ────────────────────────────────────────────────────────
  if (RELAY_URL) {
    try {
      const res = await fetch(`${RELAY_URL}/ports`, {
        signal: AbortSignal.timeout(10_000),
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

        // Use relay data only if vessels are actually present
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
  const seed = seedData as { ports: PortState[]; messageCount: number; timestamp: string };
  const now = new Date().toISOString();
  const ports = seed.ports.map(p => enrichPort({ ...p, lastUpdated: now }));

  return NextResponse.json({
    ports,
    messageCount: 0,
    timestamp: now,
    source: 'csv-snapshot',
    wsError: RELAY_URL ? 'Relay unavailable or warming up — using snapshot' : 'No RELAY_URL configured',
  });
}
