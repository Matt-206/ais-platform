'use client';

import { Activity, RefreshCw, Wifi, Database } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string | null;
  messageCount: number;
  loading: boolean;
  onRefresh: () => void;
  dataSource: 'live' | 'csv-snapshot' | null;
}

export default function Header({ lastUpdated, messageCount, loading, onRefresh, dataSource }: HeaderProps) {
  const isLive     = dataSource === 'live';
  const isSnapshot = dataSource === 'csv-snapshot';

  return (
    <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 flex items-center px-4 gap-4 z-[600] relative">
      {/* Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-sky-500/20 border border-sky-500/30 rounded-lg flex items-center justify-center">
          <Activity size={16} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">Port Congestion Intelligence</h1>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Live AIS · 15 Major Ports · Real-time D&D Pricing</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Data source badge */}
        {isLive && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <Wifi size={11} className="text-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-400">Live Stream</span>
            {messageCount > 0 && (
              <span className="text-[10px] text-emerald-600 ml-0.5">{messageCount.toLocaleString()} msgs</span>
            )}
          </div>
        )}

        {isSnapshot && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full"
               title="Set a dedicated AISSTREAM_API_KEY in Vercel env vars for live data">
            <Database size={11} className="text-amber-400" />
            <span className="text-[11px] font-medium text-amber-400">CSV Snapshot</span>
          </div>
        )}

        {!dataSource && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
            <span className="text-xs text-slate-400">Connecting…</span>
          </div>
        )}

        {lastUpdated && (
          <span className="hidden md:block text-xs text-slate-500">
            {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </header>
  );
}
