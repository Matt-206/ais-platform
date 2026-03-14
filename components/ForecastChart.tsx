'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { scoreToColor } from '@/lib/congestion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface ForecastChartProps {
  forecast: number[];
  currentScore: number;
}

export default function ForecastChart({ forecast, currentScore }: ForecastChartProps) {
  const color = scoreToColor(currentScore);
  const labels = ['Now', ...forecast.map((_, i) => `+${i + 1}h`)];
  const data = [currentScore, ...forecast];

  return (
    <div className="h-40">
      <Line
        data={{
          labels,
          datasets: [
            {
              data,
              borderColor: color,
              backgroundColor: color + '22',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointBackgroundColor: color,
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#2C1A0E',
              borderColor: '#334155',
              borderWidth: 1,
              titleColor: '#94a3b8',
              bodyColor: '#f1f5f9',
              callbacks: {
                label: (ctx) => ` ${ctx.raw} / 100`,
              },
            },
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: { color: '#6A3A18' },
              ticks: { color: '#94a3b8', font: { size: 10 } },
              title: { display: false },
            },
            x: {
              grid: { color: '#6A3A18' },
              ticks: {
                color: '#94a3b8',
                font: { size: 10 },
                maxRotation: 0,
                callback: (_val, idx) => {
                  return idx % 3 === 0 ? labels[idx] : '';
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
