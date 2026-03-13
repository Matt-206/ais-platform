import { NextResponse } from 'next/server';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 15;

const RELAY_URL = process.env.RELAY_URL ?? '';

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

        // Relay is live but may have no vessels yet (e.g. just started up)
        if (data.messageCount > 0) return NextResponse.json(data);
      }
    } catch {
      // relay down — fall through to snapshot
    }
  }

  // ── Fallback: CSV snapshot ────────────────────────────────────────────────
  const seed = seedData as { ports: PortState[]; messageCount: number; timestamp: string };
  const now = new Date().toISOString();
  const ports = seed.ports.map(p => ({ ...p, lastUpdated: now }));

  return NextResponse.json({
    ports,
    messageCount: 0,
    timestamp: now,
    source: 'csv-snapshot',
    wsError: RELAY_URL ? 'Relay unavailable or warming up — using snapshot' : 'No RELAY_URL configured',
  });
}
