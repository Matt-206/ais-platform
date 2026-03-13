'use client';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  sub?: string;
}

export default function MetricCard({ label, value, icon, color = '#94a3b8', sub }: MetricCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
