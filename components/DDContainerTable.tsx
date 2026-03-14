'use client';

import { useState } from 'react';
import type { ContainerRate, CongestionLevel } from '@/lib/types';
import { TIER_MULTIPLIERS } from '@/lib/congestion';
import { Package, ChevronDown, ChevronUp, Info, ExternalLink, Zap, FileText, Thermometer, AlertTriangle } from 'lucide-react';

interface DDContainerTableProps {
  rates: ContainerRate[];
  level: CongestionLevel;
  color: string;
  multiplier: number;
}

type ViewMode = 'tier1' | 'tier2' | 'tier3';
type RateMode = 'dynamic' | 'published';

const TIER_LABELS: Record<ViewMode, { label: string; sub: string; days: string }> = {
  tier1: { label: 'Tier 1',  sub: 'Days 1–5 over free period',  days: '(days 1–5)'  },
  tier2: { label: 'Tier 2',  sub: 'Days 6–10 over free period', days: '(days 6–10)' },
  tier3: { label: 'Tier 3',  sub: 'Days 11+ over free period',  days: '(days 11+)'  },
};

const LEVEL_COLOR: Record<CongestionLevel, string> = {
  Low:      'text-emerald-400',
  Moderate: 'text-yellow-400',
  High:     'text-orange-400',
  Severe:   'text-red-400',
  Critical: 'text-red-700',
};

function fmt(n: number) { return `$${n.toLocaleString()}`; }

/** Container category → container-industry colour coding */
function getContainerCategory(id: string): {
  rowBg: string;
  abbr: string;
  icon: React.ReactNode;
  hint: string;
} {
  if (id === '20rf' || id === '40rf') return {
    rowBg: 'rgba(56, 189, 248, 0.07)',    // reefer — sky tint (cool/refrigerated)
    abbr:  'text-sky-400',
    icon:  <Thermometer size={9} className="text-sky-400" />,
    hint:  'Reefer',
  };
  if (id === '20ot' || id === '40ot' || id === '20fr' || id === '40fr' || id === 'tank') return {
    rowBg: 'rgba(249, 115, 22, 0.08)',    // special — orange tint
    abbr:  'text-orange-400',
    icon:  <AlertTriangle size={9} className="text-orange-400" />,
    hint:  'Special',
  };
  return {
    rowBg: 'rgba(51, 65, 85, 0.20)',      // dry — slate tint (neutral)
    abbr:  'text-slate-400',
    icon:  null,
    hint:  'Dry',
  };
}

export default function DDContainerTable({ rates, level, color, multiplier }: DDContainerTableProps) {
  const [tier, setTier]         = useState<ViewMode>('tier1');
  const [rateMode, setRateMode] = useState<RateMode>('dynamic');
  const [expanded, setExpanded] = useState(true);
  const [showSources, setShowSources] = useState(false);

  function getDayRate(r: ContainerRate): number {
    if (rateMode === 'published') {
      return tier === 'tier1' ? r.publishedTier1 : tier === 'tier2' ? r.publishedTier2 : r.publishedTier3;
    }
    return tier === 'tier1' ? r.daily : tier === 'tier2' ? r.tier2Day : r.tier3Day;
  }

  function getPublishedRate(r: ContainerRate): number {
    return tier === 'tier1' ? r.publishedTier1 : tier === 'tier2' ? r.publishedTier2 : r.publishedTier3;
  }

  const tierMult = tier === 'tier1' ? TIER_MULTIPLIERS.tier1 : tier === 'tier2' ? TIER_MULTIPLIERS.tier2 : TIER_MULTIPLIERS.tier3;
  const effectiveMult = rateMode === 'dynamic' ? (multiplier * tierMult).toFixed(2) : tierMult.toFixed(2);

  return (
    <div className="rounded-xl overflow-hidden border" style={{ background: 'rgba(15,23,42,0.95)', borderColor: '#334155' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3 flex items-center gap-2 transition-colors"
        style={{ borderBottom: '1px solid #334155' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
      >
        <Package size={14} className="text-slate-500 shrink-0" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex-1 text-left">
          D&amp;D Rates by Container Type
        </span>
        <span className="text-xs font-semibold mr-2" style={{ color }}>
          {multiplier}× congestion · {level}
        </span>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {expanded && (
        <>
          {/* Controls */}
          <div className="px-3 py-2 flex flex-wrap items-center gap-2" style={{ borderBottom: '1px solid #1e293b' }}>
            {/* Rate mode toggle */}
            <div className="flex rounded-lg overflow-hidden text-xs shrink-0" style={{ border: '1px solid #334155' }}>
              {(['dynamic', 'published'] as RateMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setRateMode(m)}
                  className={`px-2.5 py-1 transition-colors flex items-center gap-1 ${
                    rateMode === m ? 'text-slate-100 font-semibold' : 'text-slate-500 hover:text-slate-500'
                  }`}
                  style={rateMode === m ? { backgroundColor: color + '44' } : {}}
                >
                  {m === 'dynamic'
                    ? <><Zap size={10} /> Live</>
                    : <><FileText size={10} /> Published</>
                  }
                </button>
              ))}
            </div>

            {/* Tier selector */}
            <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid #334155' }}>
              {(['tier1', 'tier2', 'tier3'] as ViewMode[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-2.5 py-1 transition-colors ${
                    tier === t ? 'text-slate-100 font-semibold' : 'text-slate-500 hover:text-slate-500'
                  }`}
                  style={tier === t ? { backgroundColor: color + '33' } : {}}
                >
                  {TIER_LABELS[t].label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 ml-auto">{TIER_LABELS[tier].sub}</span>
          </div>

          {/* Context bar */}
          <div className="px-3 py-1.5 flex items-center gap-2 text-xs" style={{ background: 'rgba(15,23,42,0.5)' }}>
            {rateMode === 'dynamic' ? (
              <>
                <span className="text-slate-500">Effective multiplier:</span>
                <span className="font-bold" style={{ color }}>{effectiveMult}×</span>
                <span className="text-slate-700">= {multiplier}× congestion × {tierMult.toFixed(2)}× tariff tier</span>
              </>
            ) : (
              <>
                <span className="text-slate-500">Showing:</span>
                <span className="text-slate-400 font-medium">Published carrier tariff</span>
                <span className="text-slate-700">· {tierMult.toFixed(2)}× tier escalation</span>
              </>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th className="text-left text-xs py-2 px-3 font-medium text-slate-500">Type</th>
                  <th className="text-left text-xs py-2 px-3 font-medium text-slate-500">Container</th>
                  <th className="text-right text-xs py-2 px-3 font-medium text-slate-500">/ day</th>
                  <th className="text-right text-xs py-2 px-3 font-medium text-slate-500">5-day block</th>
                  {rateMode === 'dynamic' && (
                    <th className="text-right text-xs py-2 px-3 font-medium text-slate-500">vs published</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rates.map(r => {
                  const cat     = getContainerCategory(r.id);
                  const dayRate = getDayRate(r);
                  const fiveDays = dayRate * 5;
                  const pubRate  = getPublishedRate(r);
                  const delta    = dayRate - pubRate;
                  return (
                    <tr
                      key={r.id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid rgba(51,65,85,0.4)', background: cat.rowBg }}
                    >
                      <td className="py-1.5 px-3">
                        <span className={`text-[10px] font-bold font-mono px-1 py-0.5 rounded flex items-center gap-1 w-fit ${cat.abbr}`}
                              style={{ background: 'rgba(15,23,42,0.5)' }}>
                          {cat.icon}
                          {r.abbr}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-xs text-slate-400">{r.label}</td>
                      <td className="py-1.5 px-3 text-right">
                        <span className="text-sm font-bold font-mono" style={{ color }}>
                          {fmt(dayRate)}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-xs text-slate-500 font-mono">
                        {fmt(fiveDays)}
                      </td>
                      {rateMode === 'dynamic' && (
                        <td className="py-1.5 px-3 text-right">
                          {delta > 0 ? (
                            <span className="text-xs font-semibold" style={{ color }}>
                              +{fmt(delta)}
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-400">base</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Source disclosure */}
          <div style={{ borderTop: '1px solid #1e293b' }}>
            <button
              onClick={() => setShowSources(s => !s)}
              className="w-full px-3 py-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-500 transition-colors"
            >
              <Info size={11} />
              <span>Rate methodology &amp; sources</span>
              {showSources ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
            </button>
            {showSources && (
              <div className="px-3 pb-3 space-y-2.5 text-xs text-slate-400" style={{ background: 'rgba(15,23,42,0.4)' }}>
                <div>
                  <p className="text-sky-400 font-semibold mb-1">Base rates (Tier 1)</p>
                  <p>Derived from Maersk Line North Europe Local Charges (2025) and MSC NWC D&D Tariff. Reefer premium ~2.4× dry (Drewry World Container Index 2024). Special equipment (OT/FR/Tank) ~1.8–2.1× dry.</p>
                </div>
                <div>
                  <p className="text-sky-400 font-semibold mb-1">Tier escalation (1.0× → 1.75× → 2.75×)</p>
                  <p>Published Maersk North Europe tariff structure: first 5 days over free period at 1.0× base; days 6–10 at 1.75× base; days 11+ at 2.75× base. Corroborated by CMA CGM Mediterranean Local Charges 2025.</p>
                </div>
                <div>
                  <p className="text-sky-400 font-semibold mb-1">Congestion multiplier (Live mode)</p>
                  <p>AIS-derived overlay with per-type WTP elasticity adjustment. Reefer cargo surcharges are amplified (inelastic demand); dry commodity surcharges are softened (rerouting risk). Not a carrier-published rate.</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
                  {[
                    { href: 'https://www.maersk.com/support/demurrage-and-detention', label: 'Maersk D&D' },
                    { href: 'https://www.msc.com/en/demurrage-and-detention', label: 'MSC D&D' },
                    { href: 'https://www.drewry.co.uk/port-solutions/port-performance-data', label: 'Drewry Benchmark' },
                    { href: 'https://www.fmc.gov/bureaus-offices/bureau-of-trade-analysis/demurrage-detention-billing-requirements/', label: 'FMC D&D Rules' },
                  ].map(({ href, label }) => (
                    <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-slate-600 hover:text-emerald-400 transition-colors">
                      <ExternalLink size={10} /> {label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
