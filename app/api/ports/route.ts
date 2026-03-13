import { NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // Edge Runtime — different network stack, avoids Vercel Node.js proxy limits
export const maxDuration = 30;

const COLLECTION_MS = 12000; // Edge allows 30s max
const MIN_USEFUL_MESSAGES = 50;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '0130da07ed67166aaea0fdec600cf164d85816db';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function toText(data: string | ArrayBuffer | Blob): Promise<string> {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  return (data as Blob).text();
}

async function collectAISData(durationMs: number): Promise<{ messages: string[]; error?: string }> {
  return new Promise((resolve) => {
    const rawData: Array<string | ArrayBuffer | Blob> = [];
    let ws: WebSocket | null = null;
    let settled = false;

    const done = async (error?: string) => {
      if (settled) return;
      settled = true;
      if (ws) { try { ws.close(); } catch { /* ignore */ } ws = null; }
      const messages = await Promise.all(rawData.map(toText));
      resolve({ messages, error });
    };

    const timer = setTimeout(() => void done(), durationMs);

    try {
      // Native WebSocket — available in Edge Runtime as a Web API
      ws = new WebSocket(AIS_ENDPOINT);

      ws.addEventListener('open', () => {
        ws!.send(JSON.stringify({
          APIKey: AIS_API_KEY,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FilterMessageTypes: [
            'PositionReport',
            'ShipStaticData',
            'StandardClassBPositionReport',
            'ExtendedClassBPositionReport',
            'StaticDataReport',
            'LongRangeAisBroadcastMessage',
          ],
        }));
      });

      ws.addEventListener('message', (event: MessageEvent) => {
        rawData.push(event.data as string | ArrayBuffer | Blob);
      });

      ws.addEventListener('error', (event) => {
        clearTimeout(timer);
        void done((event as ErrorEvent).message ?? 'WebSocket error');
      });

      ws.addEventListener('close', (event) => {
        clearTimeout(timer);
        void done(`close:${(event as CloseEvent).code}`);
      });

    } catch (err) {
      clearTimeout(timer);
      void done(String(err));
    }
  });
}

export async function GET() {
  try {
    const { messages, error } = await collectAISData(COLLECTION_MS);
    const liveStreamWorking = messages.length >= MIN_USEFUL_MESSAGES;

    if (liveStreamWorking) {
      const processor = new AISProcessor();
      for (const msg of messages) processor.processMessage(msg);
      const ports = processor.getPortStates();

      return NextResponse.json({
        ports,
        messageCount: messages.length,
        collectionMs: COLLECTION_MS,
        timestamp: new Date().toISOString(),
        source: 'live',
      });
    }

    const seed = seedData as { ports: PortState[]; messageCount: number; timestamp: string };
    const now = new Date().toISOString();
    const ports = seed.ports.map(p => ({ ...p, lastUpdated: now }));

    return NextResponse.json({
      ports,
      messageCount: messages.length,
      collectionMs: COLLECTION_MS,
      timestamp: now,
      source: 'csv-snapshot',
      wsError: error ?? `Stream closed (${messages.length} msgs) — check AISSTREAM_API_KEY`,
    });

  } catch (err) {
    return NextResponse.json({ error: String(err), ports: [] }, { status: 500 });
  }
}
