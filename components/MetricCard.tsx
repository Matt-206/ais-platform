'use client';

import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  sub?: string;
}

export default function MetricCard({ label, value, icon: Icon, color = '#64748b', sub }: MetricCardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
         style={{ background: 'rgba(34,21,17,0.7)', border: '1px solid #334155' }}>
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color }} />
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: '#64748b' }}>{sub}</div>}
    </div>
  );
}
