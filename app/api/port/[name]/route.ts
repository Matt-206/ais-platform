import { NextRequest, NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';
import { getPortByName } from '@/lib/ports-config';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const COLLECTION_MS = 7000;
const MIN_USEFUL_MESSAGES = 30;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '0130da07ed67166aaea0fdec600cf164d85816db';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function collectFocused(
  durationMs: number,
  port: { outer: { lat: [number, number]; lon: [number, number] } }
): Promise<{ messages: string[]; error?: string }> {
  return new Promise((resolve) => {
    const messages: string[] = [];
    let ws: import('ws').WebSocket | null = null;

    const done = (error?: string) => {
      if (ws) { try { ws.close(); } catch { /* ignore */ } ws = null; }
      resolve({ messages, error });
    };

    const timer = setTimeout(() => done(), durationMs);

    (async () => {
      try {
        const { default: WebSocket } = await import('ws');
        ws = new WebSocket(AIS_ENDPOINT);

        ws.on('open', () => {
          ws!.send(JSON.stringify({
            APIKey: AIS_API_KEY,
            BoundingBoxes: [[[
              port.outer.lat[0], port.outer.lon[0]
            ], [
              port.outer.lat[1], port.outer.lon[1]
            ]]],
            FilterMessageTypes: [
              'PositionReport',
              'ShipStaticData',
              'StandardClassBPositionReport',
              'ExtendedClassBPositionReport',
              'StaticDataReport',
            ],
          }));
        });

        ws.on('message', (data: Buffer) => messages.push(data.toString()));
        ws.on('error', (err) => { clearTimeout(timer); done(err.message); });
        ws.on('close', () => { clearTimeout(timer); resolve({ messages }); });
      } catch (err) {
        clearTimeout(timer);
        resolve({ messages, error: String(err) });
      }
    })();
  });
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

  try {
    const { messages } = await collectFocused(COLLECTION_MS, portConfig);
    const liveStreamWorking = messages.length >= MIN_USEFUL_MESSAGES;

    if (liveStreamWorking) {
      const processor = new AISProcessor();
      for (const msg of messages) processor.processMessage(msg);
      const state = processor.getPortState(portConfig.name);
      if (state) {
        return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
      }
    }

    // Fallback to CSV seed data for this specific port
    const seed = seedData as { ports: PortState[] };
    const portState = seed.ports.find(
      p => p.name.toLowerCase() === portConfig.name.toLowerCase()
    );

    if (!portState) {
      return NextResponse.json({ error: 'Port state unavailable' }, { status: 500 });
    }

    return NextResponse.json(
      { ...portState, lastUpdated: new Date().toISOString(), source: 'csv-snapshot' },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (err) {
    console.error('Port detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch port data' }, { status: 500 });
  }
}
