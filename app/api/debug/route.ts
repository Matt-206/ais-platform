import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const AIS_API_KEY = process.env.AISSTREAM_API_KEY ?? '0130da07ed67166aaea0fdec600cf164d85816db';

export async function GET() {
  const log: string[] = [];
  const t0 = Date.now();
  const ts = () => `+${Date.now() - t0}ms`;

  log.push(`node_version: ${process.version}`);
  log.push(`globalThis.WebSocket: ${typeof (globalThis as Record<string, unknown>).WebSocket}`);

  // Test undici import
  let undiciAvailable = false;
  try {
    const undici = await import('undici');
    log.push(`undici.WebSocket: ${typeof undici.WebSocket}`);
    undiciAvailable = typeof undici.WebSocket === 'function';
  } catch (e) {
    log.push(`undici import error: ${e}`);
  }

  if (!undiciAvailable) {
    return NextResponse.json({ log, error: 'undici not available' });
  }

  // Test WebSocket connection
  const result = await new Promise<{
    connected: boolean;
    subscribed: boolean;
    messageCount: number;
    closeCode?: number;
    error?: string;
    firstMessageType?: string;
    timeline: string[];
  }>((resolve) => {
    const timeline: string[] = [];
    let messageCount = 0;
    let firstMessageType: string | undefined;

    (async () => {
      try {
        const { WebSocket } = await import('undici');
        timeline.push(`${ts()} undici imported`);

        const ws = new WebSocket(`wss://stream.aisstream.io/v0/stream`);
        timeline.push(`${ts()} WebSocket created`);

        let connected = false;
        let subscribed = false;

        ws.addEventListener('open', () => {
          connected = true;
          timeline.push(`${ts()} OPEN — sending subscription`);

          ws.send(JSON.stringify({
            APIKey: AIS_API_KEY,
            BoundingBoxes: [[[-90, -180], [90, 180]]],
            FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport'],
          }));
          subscribed = true;
          timeline.push(`${ts()} subscription sent`);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ws.addEventListener('message', (event: any) => {
          messageCount++;
          if (messageCount === 1) {
            timeline.push(`${ts()} FIRST MESSAGE — type: ${typeof event.data}, isBlob: ${event.data instanceof Blob}`);
            // Try to peek at the content
            if (typeof event.data === 'string') {
              firstMessageType = JSON.parse(event.data)?.MessageType ?? 'unknown';
            }
          }
          if (messageCount === 10) timeline.push(`${ts()} 10 messages received`);
          if (messageCount === 100) timeline.push(`${ts()} 100 messages received`);
        });

        ws.addEventListener('error', (event) => {
          timeline.push(`${ts()} ERROR: ${(event as ErrorEvent).message}`);
          resolve({ connected, subscribed, messageCount, error: (event as ErrorEvent).message, firstMessageType, timeline });
        });

        ws.addEventListener('close', (event) => {
          timeline.push(`${ts()} CLOSE code:${(event as CloseEvent).code} reason:${(event as CloseEvent).reason}`);
          resolve({ connected, subscribed, messageCount, closeCode: (event as CloseEvent).code, firstMessageType, timeline });
        });

        setTimeout(() => {
          timeline.push(`${ts()} TIMEOUT — closing`);
          ws.close();
          resolve({ connected, subscribed, messageCount, firstMessageType, timeline });
        }, 8000);

      } catch (e) {
        timeline.push(`${ts()} EXCEPTION: ${e}`);
        resolve({ connected: false, subscribed: false, messageCount: 0, error: String(e), timeline });
      }
    })();
  });

  return NextResponse.json({ log, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}
