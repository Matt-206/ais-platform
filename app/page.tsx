'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PortState } from '@/lib/types';
import Header from '@/components/Header';
import PortPanel from '@/components/PortPanel';

// Dynamic import to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0f1a]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading map…</p>
      </div>
    </div>
  ),
});

interface APIResponse {
  ports: PortState[];
  messageCount: number;
  timestamp: string;
  source?: 'live' | 'csv-snapshot';
  wsError?: string;
}

const REFRESH_INTERVAL_MS = 60_000; // 60 seconds auto-refresh

export default function HomePage() {
  const [ports, setPorts] = useState<PortState[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [dataSource, setDataSource] = useState<'live' | 'csv-snapshot' | null>(null);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPorts = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch('/api/ports', { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: APIResponse = await res.json();
      setPorts(data.ports);
      setLastUpdated(data.timestamp);
      setMessageCount(data.messageCount);
      setDataSource(data.source ?? 'live');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to fetch ports:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchPorts();

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        fetchPorts().then(schedule);
      }, REFRESH_INTERVAL_MS);
    };

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPorts]);

  const handlePortClick = useCallback((name: string) => {
    setSelectedPort(name);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPort(null);
  }, []);

  const handleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    fetchPorts().then(() => {
      const schedule = () => {
        timerRef.current = setTimeout(() => {
          fetchPorts().then(schedule);
        }, REFRESH_INTERVAL_MS);
      };
      schedule();
    });
  }, [fetchPorts]);

  return (
    <div className="flex flex-col h-screen">
      <Header
        lastUpdated={lastUpdated}
        messageCount={messageCount}
        loading={loading}
        onRefresh={handleRefresh}
        dataSource={dataSource}
      />

      {/* Port score strip */}
      {ports.length > 0 && (
        <div className="h-10 bg-slate-950/80 border-b border-slate-800/60 flex items-center overflow-x-auto px-2 gap-1 shrink-0 scrollbar-hide">
          {ports
            .sort((a, b) => b.score - a.score)
            .map(port => (
              <button
                key={port.name}
                onClick={() => handlePortClick(port.name)}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105 border ${
                  selectedPort === port.name
                    ? 'bg-slate-700 border-slate-500'
                    : 'bg-slate-900 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: port.color }} />
                <span className="text-slate-200">{port.name}</span>
                <span className="font-bold" style={{ color: port.color }}>{port.score}</span>
              </button>
            ))}
        </div>
      )}

      {/* Map fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <MapComponent
          ports={ports}
          selectedPort={selectedPort}
          onPortClick={handlePortClick}
          loading={loading && ports.length === 0}
        />

        {/* First-load overlay */}
        {loading && ports.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1a]/80 z-[500] backdrop-blur-sm">
            <div className="text-center bg-slate-900/90 border border-slate-700/50 rounded-2xl p-8 max-w-sm">
              <div className="w-14 h-14 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <h2 className="text-white font-bold text-lg mb-2">Connecting to AIS Stream</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Collecting live vessel positions from{' '}
                <span className="text-sky-400">AISstream.io</span>. Building congestion
                scores for 5 major world ports…
              </p>
              <p className="text-slate-500 text-xs mt-3">~7 seconds</p>
            </div>
          </div>
        )}

        {/* Port Detail Panel */}
        <PortPanel
          portName={selectedPort}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
}
