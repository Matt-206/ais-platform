import { NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';

export const dynamic = 'force-dynamic';
export const maxDuration = 15; // seconds — collect AIS data then respond

const COLLECTION_MS = 7000; // 7 seconds of data collection
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '36484c5f046482be74ba63c44bf71bf8269a328f';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function collectAISData(durationMs: number): Promise<string[]> {
  return new Promise((resolve) => {
    const messages: string[] = [];
    let ws: import('ws').WebSocket | null = null;

    const done = () => {
      if (ws) {
        try { ws.close(); } catch { /* ignore */ }
        ws = null;
      }
      resolve(messages);
    };

    const timer = setTimeout(done, durationMs);

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

        ws.on('error', () => {
          clearTimeout(timer);
          done();
        });

        ws.on('close', () => {
          clearTimeout(timer);
          resolve(messages);
        });
      } catch {
        clearTimeout(timer);
        resolve(messages);
      }
    })();
  });
}

export async function GET() {
  try {
    const processor = new AISProcessor();
    const rawMessages = await collectAISData(COLLECTION_MS);

    for (const msg of rawMessages) {
      processor.processMessage(msg);
    }

    const portStates = processor.getPortStates();

    return NextResponse.json({
      ports: portStates,
      messageCount: rawMessages.length,
      collectionMs: COLLECTION_MS,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('AIS collection error:', err);
    return NextResponse.json(
      { error: 'Failed to collect AIS data', ports: [] },
      { status: 500 }
    );
  }
}
