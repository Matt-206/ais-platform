'use client';

import { useEffect, useRef } from 'react';
import type { PortState, VesselRecord } from '@/lib/types';

// Dynamically import Leaflet only on client
let L: typeof import('leaflet') | null = null;

const VESSELS_PER_PORT = 200; // Cap for performance

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface MapComponentProps {
  ports: PortState[];
  selectedPort: string | null;
  onPortClick: (name: string) => void;
  loading: boolean;
}

function getRadius(score: number): number {
  return 8 + (score / 100) * 14;
}

export default function MapComponent({ ports, selectedPort, onPortClick, loading }: MapComponentProps) {
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, import('leaflet').CircleMarker>>(new Map());
  const vesselLayerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const vesselMarkersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());
  const initRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    (async () => {
      L = await import('leaflet');

      // Fix default icon paths
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      mapRef.current = L.map(containerRef.current!, {
        center: [25, 15],
        zoom: 2,
        zoomControl: true,
        attributionControl: true,
      });

      // Dark CartoDB tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(mapRef.current);

      vesselLayerRef.current = L.layerGroup().addTo(mapRef.current);
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  // Update markers when ports change
  useEffect(() => {
    if (!L || !mapRef.current || ports.length === 0) return;

    const map = mapRef.current;
    const existingNames = new Set(ports.map(p => p.name));

    // Remove stale markers
    for (const [name, marker] of markersRef.current) {
      if (!existingNames.has(name)) {
        marker.remove();
        markersRef.current.delete(name);
      }
    }

    // Add/update markers
    for (const port of ports) {
      const radius = getRadius(port.score);
      const color = port.color;
      const isSelected = port.name === selectedPort;

      if (markersRef.current.has(port.name)) {
        const marker = markersRef.current.get(port.name)!;
        marker.setStyle({
          radius,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1.5,
          fillOpacity: isSelected ? 0.95 : 0.8,
        });
        (marker as import('leaflet').CircleMarker & { _radius?: number }).setRadius(radius);
      } else {
        const marker = L!.circleMarker([port.lat, port.lon], {
          radius,
          fillColor: color,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 1.5,
          fillOpacity: 0.8,
          interactive: true,
        }).addTo(map);

        // Tooltip
        marker.bindTooltip(`
          <div style="font-family: system-ui; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: white; min-width: 160px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${port.name}</div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span style="color: #94a3b8;">Score</span>
              <span style="color: ${color}; font-weight: 600;">${port.score}/100 — ${port.level}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
              <span style="color: #94a3b8;">D&D Rate</span>
              <span style="color: ${color}; font-weight: 600;">$${port.ddRate.toLocaleString()}/day</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
              <span style="color: #94a3b8;">Vessels</span>
              <span style="color: #e2e8f0;">${port.totalVessels}</span>
            </div>
          </div>
        `, { className: 'ais-tooltip', opacity: 1, permanent: false });

        marker.on('click', () => onPortClick(port.name));

        markersRef.current.set(port.name, marker);
      }
    }
  }, [ports, selectedPort, onPortClick]);

  // Vessel markers with boat icon
  useEffect(() => {
    if (!L || !mapRef.current || !vesselLayerRef.current) return;

    const layer = vesselLayerRef.current;
    layer.clearLayers();
    vesselMarkersRef.current.clear();

    for (const port of ports) {
      const vessels = (port.vessels ?? []) as (VesselRecord & { statusLabel?: string })[];
      const toShow = vessels.slice(0, VESSELS_PER_PORT);

      for (const v of toShow) {
        const heading = v.heading ?? 0;
        const icon = L!.divIcon({
          html: `<img src="/boat.svg" alt="" style="width:14px;height:14px;transform:rotate(${heading}deg);" />`,
          className: 'vessel-marker',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L!.marker([v.lat, v.lon], { icon }).addTo(layer);
        const status = v.statusLabel ?? '—';
        marker.bindTooltip(
          `<div style="font-family:system-ui;background:#0f172a;border:1px solid #334155;border-radius:6px;padding:6px 10px;color:white;font-size:11px;white-space:nowrap;">
            <div style="font-weight:600;margin-bottom:2px;">${escapeHtml(v.name)}</div>
            <div style="color:#94a3b8;">${status} · ${v.zone}</div>
            ${v.destination ? `<div style="color:#64748b;margin-top:2px;">→ ${escapeHtml(v.destination)}</div>` : ''}
          </div>`,
          { className: 'ais-tooltip', opacity: 1, permanent: false, offset: [0, -7] }
        );
        vesselMarkersRef.current.set(`${port.name}-${v.mmsi}`, marker);
      }
    }
  }, [ports]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700/50 rounded-full px-4 py-2 flex items-center gap-2 z-[500]">
          <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-300">Collecting AIS data…</span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 left-4 bg-slate-900/90 border border-slate-700/50 rounded-xl p-3 z-[500] text-xs space-y-1.5">
        <p className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Congestion</p>
        {[
          { label: 'Low (0–24)',       color: '#22c55e' },
          { label: 'Moderate (25–49)', color: '#eab308' },
          { label: 'High (50–74)',     color: '#f97316' },
          { label: 'Severe (75–89)',   color: '#ef4444' },
          { label: 'Critical (90+)',   color: '#991b1b' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-300">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
