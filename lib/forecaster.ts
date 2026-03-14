// Multi-day hourly history: portName → { "YYYY-MM-DD": [24 scores] }
// Aligned with relay processor.js (platform uses in-memory only; relay persists)
type HistoryByDate = Record<string, number[]>;
type HourlyHistory = Record<string, HistoryByDate>;

const hourlyHistory: HourlyHistory = {};
const NEUTRAL_SCORE = 38;

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function recordScore(portName: string, score: number): void {
  const now = new Date();
  const today = dateKey(now);
  const hour = now.getUTCHours();
  if (!hourlyHistory[portName]) hourlyHistory[portName] = {};
  if (!hourlyHistory[portName][today]) hourlyHistory[portName][today] = new Array(24).fill(null);
  hourlyHistory[portName][today][hour] = score;
}

function getSameHourAverage(historyByDate: HistoryByDate | undefined, targetHour: number): number | null {
  if (!historyByDate) return null;
  const scores: number[] = [];
  for (const day of Object.values(historyByDate)) {
    if (Array.isArray(day) && day[targetHour] != null) scores.push(day[targetHour]);
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function getTrend(currentScore: number, todayHours: number[], nowHour: number): number {
  const prev = todayHours[nowHour - 1];
  const prev2 = todayHours[nowHour - 2];
  if (prev == null) return 0;
  const recent = prev2 != null ? (prev + prev2) / 2 : prev;
  const delta = currentScore - recent;
  return Math.max(-5, Math.min(5, delta * 0.15));
}

export function forecast12Hours(
  portName: string,
  currentScore: number,
  utcOffset = 0
): number[] {
  const historyByDate = hourlyHistory[portName];
  const today = dateKey(new Date());
  const todayHours = historyByDate?.[today] ?? new Array(24).fill(null);
  const nowHour = new Date().getUTCHours();

  todayHours[nowHour] = currentScore;
  const trend = getTrend(currentScore, todayHours, nowHour);

  const result: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const fh = (nowHour + h) % 24;
    const sameHourAvg = getSameHourAverage(historyByDate, fh);
    let base: number;

    if (sameHourAvg != null) {
      base = sameHourAvg * 0.6 + currentScore * 0.4;
      base += trend * (1 - h / 13);
    } else {
      const reversionWeight = (h / 12) * 0.28;
      base = currentScore * (1 - reversionWeight) + NEUTRAL_SCORE * reversionWeight;
    }

    const localHour = (fh + utcOffset + 24) % 24;
    const timeMult = (localHour >= 6 && localHour <= 20) ? 1.08 : 0.88;
    result.push(Math.round(Math.min(100, Math.max(0, base * timeMult))));
  }

  return result;
}
