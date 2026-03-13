// Hourly history keyed by port name → array of 24 scores (index = UTC hour)
type HourlyHistory = Record<string, number[]>;

const hourlyHistory: HourlyHistory = {};

export function recordScore(portName: string, score: number): void {
  const hour = new Date().getUTCHours();
  if (!hourlyHistory[portName]) {
    hourlyHistory[portName] = new Array(24).fill(null);
  }
  hourlyHistory[portName][hour] = score;
}

export function forecast12Hours(portName: string, currentScore: number): number[] {
  const history = hourlyHistory[portName] ?? new Array(24).fill(null);
  const result: number[] = [];
  const nowHour = new Date().getUTCHours();

  for (let h = 1; h <= 12; h++) {
    const futureHour = (nowHour + h) % 24;
    const sameHourYesterday = history[futureHour] ?? currentScore;
    // 60% yesterday pattern + 40% current trend
    const blended = sameHourYesterday * 0.6 + currentScore * 0.4;
    // Ports busier during business hours (06:00–20:00 UTC)
    const timeMultiplier = (futureHour >= 6 && futureHour <= 20) ? 1.08 : 0.88;
    result.push(Math.round(Math.min(100, Math.max(0, blended * timeMultiplier))));
  }

  return result;
}
