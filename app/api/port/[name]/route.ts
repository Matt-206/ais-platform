import { NextRequest, NextResponse } from 'next/server';
import { AISProcessor } from '@/lib/ais-processor';
import { getPortByName } from '@/lib/ports-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const COLLECTION_MS = 7000;
const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '36484c5f046482be74ba63c44bf71bf8269a328f';
const AIS_ENDPOINT = 'wss://stream.aisstream.io/v0/stream';

async function collectAISData(durationMs: number, port: { inner: { lat: [number,number]; lon: [number,number] }; outer: { lat: [number,number]; lon: [number,number] } }): Promise<string[]> {
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
            // Focused bounding box on the specific port's outer zone only
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
    const processor = new AISProcessor();
    const rawMessages = await collectAISData(COLLECTION_MS, portConfig);

    for (const msg of rawMessages) {
      processor.processMessage(msg);
    }

    const state = processor.getPortState(portConfig.name);

    if (!state) {
      return NextResponse.json({ error: 'Port state unavailable' }, { status: 500 });
    }

    return NextResponse.json(state, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Port detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch port data' }, { status: 500 });
  }
}
