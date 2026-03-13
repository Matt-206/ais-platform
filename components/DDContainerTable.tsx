'use client';

import { useState } from 'react';
import type { ContainerRate, CongestionLevel } from '@/lib/types';
import { Package, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

interface DDContainerTableProps {
  rates: ContainerRate[];
  level: CongestionLevel;
  color: string;
  multiplier: number;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

const VIEW_LABELS: Record<ViewMode, string> = {
  daily: '/ day',
  weekly: '/ week',
  monthly: '/ month',
};

function UpliftBadge({ pct, color }: { pct: number; color: string }) {
  const label = pct === 0 ? 'Base' : `+${pct}%`;
  return (
    <span
      className="text-xs font-bold px-1.5 py-0.5 rounded-md"
      style={{ backgroundColor: color + '22', color }}
    >
      {label}
    </span>
  );
}

export default function DDContainerTable({ rates, level, color, multiplier }: DDContainerTableProps) {
  const [view, setView] = useState<ViewMode>('daily');
  const [expanded, setExpanded] = useState(true);

  const rateKey: Record<ViewMode, keyof ContainerRate> = {
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3 border-b border-slate-700/50 flex items-center gap-2 hover:bg-slate-700/20 transition-colors"
      >
        <Package size={14} className="text-slate-400 shrink-0" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider flex-1 text-left">
          D&amp;D Rates by Container Type
        </span>
        <span className="text-xs font-semibold mr-2" style={{ color }}>
          {multiplier}× congestion
        </span>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {expanded && (
        <>
          {/* View toggle */}
          <div className="px-3 py-2 border-b border-slate-700/30 flex items-center gap-1">
            {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                  view === v
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={view === v ? { backgroundColor: color + '33', color } : {}}
              >
                {v}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp size={11} />
              {level} market
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/40">
                  <th className="text-left text-xs text-slate-500 py-2 px-3 font-medium w-8">Type</th>
                  <th className="text-left text-xs text-slate-500 py-2 px-3 font-medium">Container</th>
                  <th className="text-right text-xs text-slate-500 py-2 px-3 font-medium">Base {VIEW_LABELS[view]}</th>
                  <th className="text-right text-xs text-slate-500 py-2 px-3 font-medium">Rate {VIEW_LABELS[view]}</th>
                  <th className="text-right text-xs text-slate-500 py-2 px-3 font-medium">Uplift</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r, i) => {
                  const rk = rateKey[view];
                  const currentRate = r[rk] as number;
                  const baseForView = view === 'daily' ? r.baseDay : view === 'weekly' ? r.baseDay * 7 : r.baseDay * 30;
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                        i % 2 === 0 ? 'bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="py-1.5 px-3">
                        <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-700/50 px-1 py-0.5 rounded">
                          {r.abbr}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-xs text-slate-300">{r.label}</td>
                      <td className="py-1.5 px-3 text-xs text-slate-500 text-right font-mono">
                        ${baseForView.toLocaleString()}
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="text-sm font-bold font-mono" style={{ color }}>
                          ${currentRate.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <UpliftBadge pct={r.upliftPct} color={color} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 border-t border-slate-700/30 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Base rates = standard free-period tariff. Rates update live with congestion score.
            </p>
            <span className="text-xs text-slate-500 shrink-0 ml-2">
              {rates.length} types
            </span>
          </div>
        </>
      )}
    </div>
  );
}
