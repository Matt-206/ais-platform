'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X, Anchor, Ship, TrendingUp, DollarSign,
  AlertTriangle, RefreshCw, Signal,
} from 'lucide-react';
import type { PortState, VesselRecord } from '@/lib/types';
import { classifyNavStatus } from '@/lib/congestion';
import MetricCard from './MetricCard';
import ForecastChart from './ForecastChart';
import DDContainerTable from './DDContainerTable';

interface PortPanelProps {
  portName: string | null;
  initialData?: PortState | null;
  onClose: () => void;
}

const REFRESH_INTERVAL_MS = 60_000;

function NavStatusBadge({ status }: { status: 'anchored' | 'moored' | 'underway' | 'unknown' }) {
  const config = {
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
  if (type === null) return <span className="text-xs text-slate-500">—</span>;
  if (type >= 70 && type <= 79) return <span className="text-xs text-cyan-400">Cargo</span>;
  if (type >= 80 && type <= 89) return <span className="text-xs text-purple-400">Tanker</span>;
  if (type >= 60 && type <= 69) return <span className="text-xs text-yellow-400">Passenger</span>;
  if (type >= 40 && type <= 49) return <span className="text-xs text-green-400">HSC</span>;
  return <span className="text-xs text-slate-400">Other</span>;
}

function VesselRow({ vessel }: { vessel: VesselRecord }) {
  const status = classifyNavStatus(vessel.navStatus, vessel.speed);
  return (
    <tr className="border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors">
      <td className="py-2 px-3 text-sm font-medium text-slate-200 max-w-[120px] truncate">
        {vessel.name}
      </td>
      <td className="py-2 px-3">
        <NavStatusBadge status={status} />
      </td>
      <td className="py-2 px-3 text-sm text-slate-400 text-right">
        {vessel.speed !== null ? `${vessel.speed.toFixed(1)} kn` : '—'}
      </td>
      <td className="py-2 px-3">
        <ShipTypeBadge type={vessel.shipType} />
      </td>
    </tr>
  );
}

function ReliabilityBadge({ reliability }: { reliability?: 'high' | 'medium' | 'low' }) {
  if (!reliability) return null;
  const cfg = {
    high:   { label: 'High data quality',   color: 'text-emerald-400', dot: 'bg-emerald-400' },
    medium: { label: 'Medium data quality',  color: 'text-yellow-400',  dot: 'bg-yellow-400' },
    low:    { label: 'Limited AIS coverage', color: 'text-slate-500',   dot: 'bg-slate-500' },
  };
  const c = cfg[reliability];
  return (
    <span className={`flex items-center gap-1 text-xs ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
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
    <div className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 z-[1000] overflow-y-auto shadow-2xl flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 p-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-lg font-bold text-white">{portName}</h2>
          {data && (
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-slate-500">
                {data.lat.toFixed(3)}°, {data.lon.toFixed(3)}°
              </p>
              <ReliabilityBadge reliability={data.reliability} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            title="Refresh now"
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Collecting live AIS data…</p>
            <p className="text-slate-500 text-xs mt-1">~7 seconds</p>
          </div>
        </div>
      )}

      {error && (
        <div className="m-4 p-4 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {data && (
        <div className="p-4 flex flex-col gap-5">
          {/* Congestion Score */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Congestion Score</span>
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
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${data.score}%`, backgroundColor: data.color }}
              />
            </div>
            {lastFetch && (
              <p className="text-xs text-slate-600 mt-2 text-right">
                Updated {lastFetch.toLocaleTimeString()} · auto-refreshes every 60s
              </p>
            )}
          </div>

          {/* Port-level D&D reference rate */}
          <div className="bg-slate-800/60 border rounded-xl p-4" style={{ borderColor: data.color + '55' }}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} style={{ color: data.color }} />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reference D&amp;D Rate</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ color: data.color }}>
                ${data.ddRate.toLocaleString()}
              </span>
              <span className="text-slate-400 text-sm">/ day</span>
              <span className="ml-auto text-sm font-semibold" style={{ color: data.color }}>
                {data.ddMultiplier}× base
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
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

          {/* Vessel Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Anchored"  value={data.anchored}  icon="⚓" color="#f59e0b" sub="Waiting outside port" />
            <MetricCard label="Moored"    value={data.moored}    icon="🚢" color="#3b82f6" sub="At berth" />
            <MetricCard label="Underway"  value={data.underway}  icon="🧭" color="#22c55e" sub="Moving in zone" />
            <MetricCard label="Inbound"   value={data.inbound}   icon="⬇️" color="#8b5cf6" sub="Approaching outer zone" />
          </div>

          {/* Vessel count summary */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Signal size={12} />
                <span>Total AIS signals in zone:</span>
                <span className="text-white font-bold">{data.totalVessels}</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Ship size={12} />
                <span>Commercial (scored):</span>
                <span className="font-bold">{data.commercialVessels ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* 12-hour Forecast */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">12-Hour Forecast</span>
            </div>
            <ForecastChart forecast={data.forecast} currentScore={data.score} />
          </div>

          {/* Commercial Vessel List */}
          {data.vessels.length > 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                <Ship size={14} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Commercial Vessels ({data.vessels.length})
                </span>
                <span className="ml-auto text-xs text-slate-600">type 70–89 only</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-xs text-slate-500 py-2 px-3 font-medium">Name</th>
                      <th className="text-left text-xs text-slate-500 py-2 px-3 font-medium">Status</th>
                      <th className="text-right text-xs text-slate-500 py-2 px-3 font-medium">Speed</th>
                      <th className="text-left text-xs text-slate-500 py-2 px-3 font-medium">Type</th>
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
            <div className="text-center py-6 text-slate-500 text-sm">
              <Anchor size={32} className="mx-auto mb-2 opacity-30" />
              <p>No commercial vessels detected yet.</p>
              <p className="text-xs mt-1">Data accumulates over the first 30–60 seconds.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
