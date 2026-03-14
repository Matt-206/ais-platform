import type { AISMessage, VesselRecord } from './types';
import { PORTS, inBox, inAnyBox, normalizeDestination } from './ports-config';
import { computeCongestionScore, getCongestionLevel, getDDRate, classifyNavStatus } from './congestion';

function isCommercial(shipType: number | null): boolean {
  return shipType === null || (shipType >= 70 && shipType <= 89);
}
import { forecast12Hours, recordScore } from './forecaster';
import type { PortState } from './types';

// Per-port vessel map: portName → mmsi → VesselRecord
type PortVessels = Record<string, Map<number, VesselRecord>>;

// Static data cache: mmsi → partial vessel info
interface StaticCache {
  name?: string;
  shipType?: number;
  destination?: string;
  imo?: number;
}

const VESSEL_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class AISProcessor {
  private portVessels: PortVessels = {};
  private staticCache: Map<number, StaticCache> = new Map();

  constructor() {
    for (const port of PORTS) {
      this.portVessels[port.name] = new Map();
    }
  }

  processMessage(raw: string | object): void {
    try {
      const msg: AISMessage = typeof raw === 'string' ? JSON.parse(raw) : raw as AISMessage;
      const { MessageType, MetaData, Message } = msg;

      if (!MetaData || !Message) return;

      const inner = Message[MessageType] as Record<string, unknown> | undefined;
      if (!inner) return;

      // Skip noise message types
      const noiseTypes = new Set([
        'DataLinkManagementMessage', 'Interrogation', 'BinaryAcknowledge',
        'ChannelManagement', 'AssignedModeCommand', 'CoordinatedUTCInquiry',
        'GnssBroadcastBinaryMessage', 'UnknownMessage',
      ]);
      if (noiseTypes.has(MessageType)) return;

      // Static data messages
      if (MessageType === 'ShipStaticData' || MessageType === 'StaticDataReport') {
        this.processStaticData(MetaData.MMSI, inner);
        return;
      }

      // Position messages
      if (
        MessageType === 'PositionReport' ||
        MessageType === 'StandardClassBPositionReport' ||
        MessageType === 'ExtendedClassBPositionReport' ||
        MessageType === 'LongRangeAisBroadcastMessage'
      ) {
        this.processPosition(MetaData, inner);
      }
    } catch {
      // Malformed message — skip
    }
  }

  private processStaticData(mmsi: number, inner: Record<string, unknown>): void {
    const existing = this.staticCache.get(mmsi) ?? {};
    const rawName = (inner.Name as string) ?? (inner.ShipName as string) ?? '';
    const rawDest = (inner.Destination as string) ?? '';
    const shipType = inner.Type as number | undefined;
    const imo = inner.ImoNumber as number | undefined;

    this.staticCache.set(mmsi, {
      ...existing,
      name: rawName.trim() || existing.name,
      shipType: shipType ?? existing.shipType,
      destination: rawDest ? normalizeDestination(rawDest) : existing.destination,
      imo: (imo && imo > 0) ? imo : existing.imo,
    });
  }

  private processPosition(meta: AISMessage['MetaData'], inner: Record<string, unknown>): void {
    const mmsi = meta.MMSI || (inner.UserID as number);
    if (!mmsi) return;

    // Coordinates: try message body first, fall back to metadata
    const lat = (inner.Latitude as number) ?? meta.latitude;
    const lon = (inner.Longitude as number) ?? meta.longitude;

    if (!isValidCoord(lat, lon)) return;

    // Speed: 102.3 = not available
    let speed = inner.Sog as number | null ?? null;
    if (speed !== null && speed > 102) speed = null;

    const heading = (inner.TrueHeading as number) === 511
      ? (inner.Cog as number) ?? null
      : (inner.TrueHeading as number) ?? null;

    const navStatus = (inner.NavigationalStatus as number) ?? null;

    const staticInfo = this.staticCache.get(mmsi);
    const name = (meta.ShipName?.trim()) || staticInfo?.name || `MMSI ${mmsi}`;

    const vessel: VesselRecord = {
      mmsi,
      name,
      speed,
      heading,
      navStatus,
      shipType: staticInfo?.shipType ?? null,
      destination: staticInfo?.destination ?? null,
      lat,
      lon,
      zone: 'outer',
      lastSeen: Date.now(),
    };

    for (const port of PORTS) {
      if (inBox(lat, lon, port.inner)) {
        vessel.zone = 'inner';
        vessel.inBerthArea = port.berthZones ? inAnyBox(lat, lon, port.berthZones) : undefined;
        vessel.inAnchorage = port.anchorageZones ? inAnyBox(lat, lon, port.anchorageZones) : false;
        this.portVessels[port.name].set(mmsi, { ...vessel });
      } else if (inBox(lat, lon, port.outer)) {
        vessel.zone = 'outer';
        vessel.inBerthArea = false;
        vessel.inAnchorage = port.anchorageZones ? inAnyBox(lat, lon, port.anchorageZones) : false;
        this.portVessels[port.name].set(mmsi, { ...vessel });
      } else {
        this.portVessels[port.name].delete(mmsi);
      }
    }
  }

  evictStaleVessels(): void {
    const cutoff = Date.now() - VESSEL_EXPIRY_MS;
    for (const portName of Object.keys(this.portVessels)) {
      for (const [mmsi, vessel] of this.portVessels[portName]) {
        if (vessel.lastSeen < cutoff) {
          this.portVessels[portName].delete(mmsi);
        }
      }
    }
  }

  getPortStates(): PortState[] {
    this.evictStaleVessels();

    return PORTS.map(port => {
      const vessels = Array.from(this.portVessels[port.name].values());
      const commercial = vessels.filter(v => isCommercial(v.shipType));
      const score = computeCongestionScore(vessels, port.maxCapacity);
      const level = getCongestionLevel(score);
      const { rate, multiplier, color } = getDDRate(score);
      const fc = forecast12Hours(port.name, score, port.utcOffset ?? 0);
      recordScore(port.name, score);

      // Metrics from commercial vessels only — matches relay and vessel list
      const anchored = commercial.filter(v => classifyNavStatus(v.navStatus, v.speed, v.zone, v.inBerthArea, v.inAnchorage) === 'anchored').length;
      const moored = commercial.filter(v => classifyNavStatus(v.navStatus, v.speed, v.zone, v.inBerthArea, v.inAnchorage) === 'moored').length;
      const underway = commercial.filter(v => classifyNavStatus(v.navStatus, v.speed, v.zone, v.inBerthArea, v.inAnchorage) === 'underway').length;
      const inbound = commercial.filter(v => v.zone === 'outer' && classifyNavStatus(v.navStatus, v.speed, v.zone, v.inBerthArea, v.inAnchorage) === 'underway').length;
      const other = commercial.length - anchored - moored - underway;

      const vesselList = commercial
        .map(v => ({ ...v, statusLabel: classifyNavStatus(v.navStatus, v.speed, v.zone, v.inBerthArea, v.inAnchorage) }))
        .sort((a, b) => b.lastSeen - a.lastSeen);

      return {
        name: port.name,
        lat: port.lat,
        lon: port.lon,
        score,
        level,
        ddRate: Math.round(rate),
        ddMultiplier: multiplier,
        color,
        anchored,
        moored,
        underway,
        inbound,
        other,
        totalVessels: vessels.length,
        commercialVessels: commercial.length,
        vessels: vesselList,
        forecast: fc,
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  getPortState(name: string): PortState | null {
    const states = this.getPortStates();
    return states.find(p => p.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
}

function isValidCoord(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    isFinite(lat) && isFinite(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}
