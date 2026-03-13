import { NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';
import seedData from '@/lib/seed-data.json';
import type { PortState } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const COLLECTION_MS = 7000;
const MIN_USEFUL_MESSAGES = 50; // below this → live stream is throttled
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '0130da07ed67166aaea0fdec600cf164d85816db';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function collectAISData(durationMs: number): Promise<{ messages: string[]; error?: string }> {
  return new Promise((resolve) => {
    const messages: string[] = [];
    let ws: import('ws').WebSocket | null = null;

    const done = (error?: string) => {
      if (ws) {
        try { ws.close(); } catch { /* ignore */ }
        ws = null;
      }
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

        ws.on('message', (data: Buffer) => {
          messages.push(data.toString());
        });

        ws.on('error', (err) => {
          clearTimeout(timer);
          done(err.message);
        });

        ws.on('close', () => {
          clearTimeout(timer);
          resolve({ messages });
        });
      } catch (err) {
        clearTimeout(timer);
        resolve({ messages, error: String(err) });
      }
    })();
  });
}

export async function GET() {
  try {
    const { messages, error } = await collectAISData(COLLECTION_MS);
    const liveStreamWorking = messages.length >= MIN_USEFUL_MESSAGES;

    if (liveStreamWorking) {
      // Full live path — process real-time AIS data
      const processor = new AISProcessor();
      for (const msg of messages) {
        processor.processMessage(msg);
      }
      const ports = processor.getPortStates();

      return NextResponse.json({
        ports,
        messageCount: messages.length,
        collectionMs: COLLECTION_MS,
        timestamp: new Date().toISOString(),
        source: 'live',
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Fallback: serve pre-processed CSV snapshot data
    // This happens when the AISstream API key is already in use (1 connection/key limit)
    // Fix: generate a new key at https://aisstream.io/apikeys and set AISSTREAM_API_KEY
    const seed = seedData as { ports: PortState[]; messageCount: number; timestamp: string };
    const now = new Date().toISOString();
    const ports = seed.ports.map(p => ({
      ...p,
      lastUpdated: now,
    }));

    return NextResponse.json({
      ports,
      messageCount: messages.length,
      collectionMs: COLLECTION_MS,
      timestamp: now,
      source: 'csv-snapshot',
      wsError: error ?? (messages.length < MIN_USEFUL_MESSAGES
        ? 'Live stream throttled — API key may be in use on another connection. Set a dedicated AISSTREAM_API_KEY for live updates.'
        : undefined),
    }, { headers: { 'Cache-Control': 'no-store' } });

  } catch (err) {
    console.error('AIS collection error:', err);
    return NextResponse.json(
      { error: 'Failed to collect AIS data', ports: [] },
      { status: 500 }
    );
  }
}
