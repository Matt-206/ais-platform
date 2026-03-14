/**
 * Keep-alive ping for the Render relay.
 *
 * Render free tier spins down after ~15 minutes of no HTTP traffic.
 * The AISstream WebSocket does not count as Render "activity", so the
 * instance cold-starts on the next Vercel API request, causing a 10–30 s
 * delay. This cron endpoint (every 10 min via vercel.json) sends a
 * lightweight GET to the relay root before Render can spin down.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const RELAY_URL = process.env.RELAY_URL ?? '';

export async function GET() {
  if (RELAY_URL) {
    await fetch(`${RELAY_URL}/`, {
      signal: AbortSignal.timeout(5_000),
    }).catch(() => {
      // Intentionally silent — this is a best-effort ping
    });
  }
  return new Response('ok', { status: 200 });
}
