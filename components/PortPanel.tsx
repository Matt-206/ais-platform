'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X, Anchor, Ship, TrendingUp, DollarSign,
  AlertTriangle, RefreshCw, Signal, Navigation, ArrowDownToLine, HelpCircle,
} from 'lucide-react';
import type { PortState, VesselRecord } from '@/lib/types';
import { classifyNavStatus, getBerthUtilizationPressure } from '@/lib/congestion';
import MetricCard from './MetricCard';
import ForecastChart from './ForecastChart';
import DDContainerTable from './DDContainerTable';
import DDScenarioCalculator from './DDScenarioCalculator';
import ComplianceLedger from './ComplianceLedger';

interface PortPanelProps {
  portName: string | null;
  initialData?: PortState | null;
  onClose: () => void;
}

const REFRESH_INTERVAL_MS = 60_000;

function NavStatusBadge({ status }: { status: 'anchored' | 'moored' | 'underway' | 'unknown' }) {
  const config: Record<string, { label: string; color: string }> = {
    anchored:  { label: 'Anchored',  color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    moored:    { label: 'Moored',    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    underway:  { label: 'Underway',  color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    unknown:   { label: 'Unknown',   color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  };
  const cfg = config[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ShipTypeBadge({ type }: { type: number | null }) {
  if (type === null) return <span className="text-xs" style={{ color: '#64748b' }}>—</span>;
  // Cargo (70–79): maroon — standard container carrier
  // Tanker (80–89): hazard-red — specialised cargo, red marking
  // Others: muted warm tones
  if (type >= 70 && type <= 79) return <span className="text-xs text-sky-400">Cargo</span>;
  if (type >= 80 && type <= 89) return <span className="text-xs text-orange-400">Tanker</span>;
  if (type >= 60 && type <= 69) return <span className="text-xs text-yellow-400">Passenger</span>;
  if (type >= 40 && type <= 49) return <span className="text-xs text-emerald-400">HSC</span>;
  return <span className="text-xs text-slate-400">Other</span>;
}

const VALID_STATUSES = ['anchored', 'moored', 'underway', 'unknown'] as const;
type NavStatus = (typeof VALID_STATUSES)[number];

function VesselRow({ vessel }: { vessel: VesselRecord }) {
  const raw = vessel.statusLabel ?? classifyNavStatus(vessel.navStatus, vessel.speed, vessel.zone, vessel.inBerthArea, vessel.inAnchorage);
  const status: NavStatus = VALID_STATUSES.includes(raw as NavStatus) ? (raw as NavStatus) : 'unknown';
  return (
    <tr className="transition-colors"
        style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.2)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}>
      <td className="py-2 px-3 text-sm font-medium max-w-[120px] truncate" style={{ color: '#94a3b8' }}>
        {vessel.name}
      </td>
      <td className="py-2 px-3">
        <NavStatusBadge status={status} />
      </td>
      <td className="py-2 px-3 text-sm text-right" style={{ color: '#94a3b8' }}>
        {vessel.speed !== null ? `${vessel.speed.toFixed(1)} kn` : '—'}
      </td>
      <td className="py-2 px-3">
        <ShipTypeBadge type={vessel.shipType} />
      </td>
    </tr>
  );
}

function ReliabilityBadge({ reliability, confidence }: { reliability?: 'high' | 'medium' | 'low'; confidence?: 'high' | 'medium' | 'low' }) {
  const source = confidence ?? reliability;
  if (!source) return null;
  const cfg: Record<string, { label: string; color: string }> = {
    high:   { label: 'High confidence',   color: '#22c55e' },
    medium: { label: 'Medium confidence', color: '#eab308' },
    low:    { label: 'Low confidence',    color: '#64748b' },
  };
  const c = cfg[source];
  return (
    <span className="flex items-center gap-1 text-xs" style={{ color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

function DataLineage({ data }: { data: { totalVessels: number; commercialVessels: number; messageCount?: number } }) {
  return (
    <span className="text-xs" style={{ color: '#64748b' }}>
      Based on {data.commercialVessels} commercial vessels ({data.totalVessels} total)
      {data.messageCount != null && data.messageCount > 0 && (
        <> · {data.messageCount.toLocaleString()} AIS messages</>
      )}
    </span>
  );
}

export default function PortPanel({ portName, initialData, onClose }: PortPanelProps) {
  const [data, setData]       = useState<PortState | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(() => {
    if (!portName) return;
    fetch(`/api/port/${encodeURIComponent(portName)}`)
      .then(r => r.json())
      .then((d: PortState) => {
        setData(d);
        setLoading(false);
        setLastFetch(new Date());
      })
      .catch(() => {
        setError('Failed to load port data');
        setLoading(false);
      });
  }, [portName]);

  useEffect(() => {
    if (!portName) return;
    setLoading(true);
    setError(null);
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [portName, fetchData]);

  if (!portName) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[460px] backdrop-blur-sm z-[1000] overflow-y-auto shadow-2xl flex flex-col"
         style={{ background: 'rgba(15,23,42,0.97)', borderLeft: '1px solid #334155' }}>
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-sm p-4 flex items-center justify-between z-10"
           style={{ background: 'rgba(15,23,42,0.97)', borderBottom: '1px solid #334155' }}>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>{portName}</h2>
          {data && (
            <div className="flex flex-col gap-0.5 mt-0.5">
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">
                  {data.lat.toFixed(3)}°, {data.lon.toFixed(3)}°
                </p>
                <ReliabilityBadge reliability={data.reliability} confidence={data.confidence} />
              </div>
              {data.dataQuality && (
                <DataLineage data={data.dataQuality} />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            title="Refresh now"
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-3"
                 style={{ border: '2px solid #334155', borderTopColor: '#22c55e' }} />
            <p className="text-sm" style={{ color: '#64748b' }}>Collecting live AIS data…</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>~7 seconds</p>
          </div>
        </div>
      )}

      {error && (
        <div className="m-4 p-4 rounded-xl flex items-center gap-3"
             style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.5)' }}>
          <AlertTriangle size={18} className="shrink-0" style={{ color: '#ef4444' }} />
          <p className="text-sm" style={{ color: '#fca5a5' }}>{error}</p>
        </div>
      )}

      {data && (
        <div className="p-4 flex flex-col gap-5">
          {/* Berth Utilization (industry BOR) */}
          {data.berthUtilization != null && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Berth Utilization</span>
                <a href="/methodology#berth" className="text-xs text-sky-400 hover:underline" title="Industry-standard BOR methodology">Proven</a>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-black" style={{ color: data.color }}>{data.berthUtilization}%</span>
                {loading && (
                  <RefreshCw size={13} className="text-slate-600 animate-spin mb-1.5 ml-1" />
                )}
              </div>
              <p className="text-xs mb-2" style={{ color: '#64748b' }}>
                {getBerthUtilizationPressure(data.berthUtilization)} · {data.berthCapacity != null && data.moored > data.berthCapacity ? `${data.berthCapacity} (capped)` : data.moored} at berth / {data.berthCapacity ?? '—'} berths
              </p>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, data.berthUtilization)}%`, backgroundColor: data.color }}
                />
              </div>
            </div>
          )}

          {/* Congestion Score */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Congestion Score</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: data.color + '22', color: data.color }}>
                {data.level}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-black" style={{ color: data.color }}>{data.score}</span>
              <span className="text-slate-500 text-lg mb-1">/ 100</span>
              {loading && (
                <RefreshCw size={13} className="text-slate-600 animate-spin mb-1.5 ml-1" />
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1e293b' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${data.score}%`, backgroundColor: data.color }}
              />
            </div>
            {lastFetch && (
              <p className="text-xs mt-2 text-right" style={{ color: '#64748b' }}>
                Data as of {lastFetch.toLocaleTimeString()}
                {data.dataQuality && (
                  <> · {data.dataQuality.commercialVessels} commercial ({data.dataQuality.totalVessels} total)</>
                )}
                {' '}· auto-refreshes every 60s
              </p>
            )}
          </div>

          {/* Port-level D&D reference rate */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.95)', borderColor: data.color + '55', border: `1px solid ${data.color}55` }}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} style={{ color: data.color }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Reference D&amp;D Rate</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ color: data.color }}>
                ${data.ddRate.toLocaleString()}
              </span>
              <span className="text-sm" style={{ color: '#64748b' }}>/ day</span>
              <span className="ml-auto text-sm font-semibold" style={{ color: data.color }}>
                {data.ddMultiplier}× base
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              Blended reference for a 40&apos;DC equivalent. See per-type table below.
            </p>
          </div>

          {/* ── Live D&D Container Rate Table ── */}
          {data.containerRates && data.containerRates.length > 0 && (
            <DDContainerTable
              rates={data.containerRates}
              level={data.level}
              color={data.color}
              multiplier={data.ddMultiplier}
            />
          )}

          {/* ── D&D Liability Scenario Calculator ── */}
          <DDScenarioCalculator
            portName={data.name}
            score={data.score}
            level={data.level}
            color={data.color}
            multiplier={data.ddMultiplier}
          />

          {/* Vessel Metrics — commercial only (anchored + moored + underway + other = commercialVessels) */}
          {(() => {
            const other = data.other ?? Math.max(0, (data.commercialVessels ?? 0) - data.anchored - data.moored - data.underway);
            const sum = data.anchored + data.moored + data.underway + other;
            const commercial = data.commercialVessels ?? 0;
            const mathOk = sum === commercial;
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Anchored"  value={data.anchored}  icon={Anchor}          color="#f59e0b" sub="Waiting outside port" />
                  <MetricCard label="Moored"   value={data.moored}    icon={Ship}            color="#38bdf8" sub="At berth" />
                  <MetricCard label="Underway" value={data.underway}   icon={Navigation}      color="#22c55e" sub={data.inbound > 0 ? `${data.inbound} inbound approaching` : 'Moving in zone'} />
                  {other > 0 && (
                    <MetricCard label="Other"   value={other}         icon={HelpCircle}     color="#64748b" sub="Undefined/fishing/etc." />
                  )}
                </div>

                {/* Vessel count summary — commercial only, matches list */}
                <div className="rounded-xl p-3" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                      <Signal size={12} />
                      <span>Total (all types):</span>
                      <span className="font-bold" style={{ color: '#f1f5f9' }}>{data.totalVessels}</span>
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: '#38bdf8' }}>
                      <Ship size={12} />
                      <span>Commercial (scored):</span>
                      <span className="font-bold">{commercial}</span>
                      {mathOk && (
                        <span className="text-emerald-500/80" title="Anchored + Moored + Underway + Other = Commercial">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#64748b' }}>
                    {data.anchored} anchored + {data.moored} moored + {data.underway} underway{other > 0 ? ` + ${other} other` : ''} = {commercial} commercial
                  </p>
                </div>
              </>
            );
          })()}

          {/* Compliance Ledger — audit trail for regulatory review */}
          <ComplianceLedger portName={data.name} data={data} />

          {/* 12-hour Forecast */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} style={{ color: '#94a3b8' }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>12-Hour Forecast</span>
            </div>
            <ForecastChart forecast={data.forecast} currentScore={data.score} />
          </div>

          {/* Commercial Vessel List */}
          {data.vessels.length > 0 ? (
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
              <div className="p-3 flex items-center gap-2" style={{ borderBottom: '1px solid #334155' }}>
                <Ship size={14} style={{ color: '#94a3b8' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                  Commercial Vessels ({data.vessels.length})
                </span>
                <span className="ml-auto text-xs" style={{ color: '#64748b' }}>type 70–89 only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th className="text-left text-xs py-2 px-3 font-medium" style={{ color: '#64748b' }}>Name</th>
                      <th className="text-left text-xs py-2 px-3 font-medium" style={{ color: '#64748b' }}>Status</th>
                      <th className="text-right text-xs py-2 px-3 font-medium" style={{ color: '#64748b' }}>Speed</th>
                      <th className="text-left text-xs py-2 px-3 font-medium" style={{ color: '#64748b' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vessels.map(v => (
                      <VesselRow key={v.mmsi} vessel={v} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl text-center py-6 text-sm"
                 style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155', color: '#64748b' }}>
              <Anchor size={28} className="mx-auto mb-2 opacity-30" style={{ color: '#94a3b8' }} />
              <p>No commercial vessels detected yet.</p>
              <p className="text-xs mt-1">Data accumulates over the first 30–60 seconds.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
