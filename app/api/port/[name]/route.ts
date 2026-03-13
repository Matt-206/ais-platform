import { NextRequest, NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';
import { getPortByName } from '@/lib/ports-config';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';
export const maxDuration = 30;

const COLLECTION_MS = 12000;
const MIN_USEFUL_MESSAGES = 20;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '0130da07ed67166aaea0fdec600cf164d85816db';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function toText(data: string | ArrayBuffer | Blob): Promise<string> {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return (data as Blob).text();
}

async function collectFocused(
  durationMs: number,
  port: { outer: { lat: [number, number]; lon: [number, number] } }
): Promise<{ messages: string[] }> {
  return new Promise((resolve) => {
    const rawData: Array<string | ArrayBuffer | Blob> = [];
    let ws: WebSocket | null = null;
    let settled = false;

    const done = async () => {
      if (settled) return;
      settled = true;
      if (ws) { try { ws.close(); } catch { /* ignore */ } ws = null; }
      const messages = await Promise.all(rawData.map(toText));
      resolve({ messages });
    };

    const timer = setTimeout(() => void done(), durationMs);

    try {
      ws = new WebSocket(AIS_ENDPOINT);

      ws.addEventListener('open', () => {
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

      ws.addEventListener('message', (event: MessageEvent) => {
        rawData.push(event.data as string | ArrayBuffer | Blob);
      });

      ws.addEventListener('error', () => { clearTimeout(timer); void done(); });
      ws.addEventListener('close', () => { clearTimeout(timer); void done(); });

    } catch {
      clearTimeout(timer);
      void done();
    }
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
      if (state) return NextResponse.json(state);
    }

    const seed = seedData as { ports: PortState[] };
    const portState = seed.ports.find(
      p => p.name.toLowerCase() === portConfig.name.toLowerCase()
    );

    if (!portState) {
      return NextResponse.json({ error: 'Port state unavailable' }, { status: 500 });
    }

    return NextResponse.json({ ...portState, lastUpdated: new Date().toISOString(), source: 'csv-snapshot' });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
