'use client';

import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { PortState } from '@/lib/types';
import { PORT_TRADE_LANE, getTradeLane } from '@/lib/trade-lanes';
import { getLaneBaseRate } from '@/lib/congestion';

interface ComplianceLedgerProps {
  portName: string;
  data: PortState;
}

/** Official audit report of inputs and methodology for congestion/pricing */
function ComplianceLedger({ portName, data }: ComplianceLedgerProps) {
  const [expanded, setExpanded] = useState(false);

  const dq = data.dataQuality;
  const tradeLaneId = PORT_TRADE_LANE[portName];
  const tradeLane = getTradeLane(portName);
  const baseRate = getLaneBaseRate(tradeLaneId);
  const other = data.other ?? Math.max(0, data.totalVessels - data.anchored - data.moored - data.underway);

  const inputs = {
    port: portName,
    timestamp: data.lastUpdated,
    score: data.score,
    level: data.level,
    ddMultiplier: data.ddMultiplier,
    ddRate: data.ddRate,
    baseRate,
    anchored: data.anchored,
    moored: data.moored,
    underway: data.underway,
    inbound: data.inbound,
    other,
    totalVessels: data.totalVessels,
    commercialVessels: data.commercialVessels ?? '—',
    messageCount: dq?.messageCount ?? '—',
    bonusFreeDays: data.score < 10 ? 5 : data.score < 25 ? 2 : 0,
  };

  const exportReport = () => {
    const report = buildOfficialReport(inputs, tradeLane);
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compliance-Ledger-${portName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const full = {
      reportMetadata: { generatedAt: new Date().toISOString(), port: portName, version: '1.0' },
      inputs,
      methodology: 'See methodology section in text export',
      osraFields: 'Not available (AIS-only inputs)',
    };
    const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-ledger-${portName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-3 flex items-center gap-2 transition-colors"
        style={{ borderBottom: expanded ? '1px solid #334155' : 'none' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,65,85,0.4)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
      >
        <Shield size={14} className="shrink-0" style={{ color: '#94a3b8' }} />
        <span className="text-xs font-medium uppercase tracking-wider flex-1 text-left" style={{ color: '#94a3b8' }}>
          Compliance Ledger
        </span>
        <span className="text-[10px]" style={{ color: '#64748b' }}>Official audit report</span>
        {expanded ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronDown size={14} style={{ color: '#64748b' }} />}
      </button>

      {expanded && (
        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Report header */}
          <div className="border-b pb-3" style={{ borderColor: '#334155' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#f1f5f9' }}>
              Port Congestion & D&D Pricing — Compliance Ledger
            </h3>
            <p className="text-[10px] mt-1" style={{ color: '#64748b' }}>
              {portName} · Generated {new Date(inputs.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} UTC
            </p>
          </div>

          {/* Executive summary */}
          <Section title="1. Executive Summary">
            <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
              This report documents the inputs, methodology, and rationale used to compute the congestion score and
              dynamic demurrage &amp; detention (D&amp;D) reference rate for {portName}. The reference rate of{' '}
              <strong style={{ color: data.color }}>${inputs.ddRate.toLocaleString()}/day</strong> reflects a{' '}
              <strong>{inputs.ddMultiplier}×</strong> multiplier applied to the trade-lane base rate of{' '}
              <strong>${inputs.baseRate}/day</strong> for {tradeLane.label}, calibrated to observed market surcharges
              and carrier tariff filings.
            </p>
          </Section>

          {/* Data inputs with explanations */}
          <Section title="2. AIS Data Inputs">
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              All congestion and pricing outputs are derived from live AIS (Automatic Identification System) vessel
              position and static data. The following inputs were used at the time of calculation:
            </p>
            <InputRow label="Anchored vessels" value={inputs.anchored} />
            <InputExplanation>
              Vessels at anchor outside the port. This is the strongest congestion signal — anchored vessels indicate
              berth unavailability and queue depth. Weight: 40% of total score.
            </InputExplanation>
            <InputRow label="Moored vessels" value={inputs.moored} />
            <InputExplanation>
              Vessels at berth. High moored count with low anchored count suggests efficient throughput; high moored
              with high anchored suggests congestion.
            </InputExplanation>
            <InputRow label="Underway (inner zone)" value={inputs.underway} />
            <InputExplanation>
              Vessels moving within the inner port zone. Combined with speed data, low-speed ratio indicates congestion.
            </InputExplanation>
            <InputRow label="Inbound (outer zone)" value={inputs.inbound} />
            <InputExplanation>
              Vessels underway in the outer zone approaching the port. Represents pressure on future berth availability.
              Weight: 15% of total score.
            </InputExplanation>
            <InputRow label="Other / unknown" value={inputs.other} />
            <InputExplanation>
              Vessels with nav status not classified as anchored, moored, or underway (e.g. fishing, undefined).
              Excluded from congestion scoring.
            </InputExplanation>
            <InputRow label="Total vessels" value={inputs.totalVessels} bold />
            <InputRow label="Commercial vessels (scored)" value={inputs.commercialVessels} />
            <InputExplanation>
              Only cargo (70–79) and tanker (80–89) ship types drive the congestion score. Other vessel types are
              excluded as they do not materially affect container terminal capacity.
            </InputExplanation>
            {typeof inputs.messageCount === 'number' && (
              <>
                <InputRow label="AIS message count" value={inputs.messageCount.toLocaleString()} />
                <InputExplanation>
                  Total AIS messages processed by the relay. Higher counts indicate stronger data coverage and more
                  reliable scores.
                </InputExplanation>
              </>
            )}
          </Section>

          {/* Congestion methodology */}
          <Section title="3. Congestion Score Methodology">
            <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>
              The congestion score (0–100) is a weighted combination of four AIS-derived signals:
            </p>
            <ul className="text-xs space-y-1.5 ml-3 list-disc" style={{ color: '#94a3b8' }}>
              <li><strong>Anchored (40%)</strong> — Vessels waiting outside port; saturates at 30% of port capacity.</li>
              <li><strong>Inner density (25%)</strong> — Commercial vessels in inner zone vs. capacity.</li>
              <li><strong>Low-speed ratio (20%)</strong> — Fraction of inner-zone vessels moving &lt;2 kn.</li>
              <li><strong>Inbound pressure (15%)</strong> — Outer-zone vessels approaching port.</li>
            </ul>
            <p className="text-xs mt-2" style={{ color: '#64748b' }}>
              Current score: <strong style={{ color: data.color }}>{inputs.score}</strong> — classified as{' '}
              <strong>{inputs.level}</strong>.
            </p>
          </Section>

          {/* Pricing methodology */}
          <Section title="4. D&D Pricing Methodology">
            <p className="text-xs mb-2" style={{ color: '#94a3b8' }}>
              The reference D&amp;D rate is computed as: <strong>Base Rate × Congestion Multiplier</strong>.
            </p>
            <div className="space-y-2 text-xs" style={{ color: '#94a3b8' }}>
              <p><strong>Trade-lane base rate:</strong> ${inputs.baseRate}/day for {tradeLane.label}. Source: {tradeLane.source}.</p>
              <p><strong>Congestion multiplier:</strong> {inputs.ddMultiplier}× — derived from a smooth piecewise-linear curve calibrated to:</p>
              <ul className="ml-3 list-disc space-y-0.5" style={{ color: '#64748b' }}>
                <li>Score 0: 0.60× (DP World incentive programmes; terminal competing for cargo)</li>
                <li>Score 25: 1.00× (neutral; published carrier base rate)</li>
                <li>Score 50: 1.35× (FMC-filed congestion surcharges 2023–2024)</li>
                <li>Score 75: 2.00× (Drewry peak-backlog data; Antwerp/Rotterdam 2022)</li>
                <li>Score 100: 3.50× (2021 supply chain crisis documented peaks)</li>
              </ul>
              <p><strong>Effective rate:</strong> ${inputs.baseRate} × {inputs.ddMultiplier} = <strong style={{ color: data.color }}>${inputs.ddRate.toLocaleString()}/day</strong></p>
              {inputs.bonusFreeDays > 0 && (
                <p><strong>Bonus free days:</strong> +{inputs.bonusFreeDays} days at low occupancy (score &lt; 25). Based on DP World and PSA off-peak free-time extension programmes.</p>
              )}
            </div>
          </Section>

          {/* Limitations */}
          <Section title="5. Limitations &amp; Disclaimers">
            <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
              OSRA-mandated fields (dwell time, empty return, etc.) are not available from AIS-only inputs. This
              report provides an audit trail of AIS-derived congestion and pricing logic. Actual D&amp;D charges depend
              on individual carrier agreements, terminal conditions, and vessel timing. Indicative estimates only.
            </p>
          </Section>

          {/* Export buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: 'rgba(51,65,85,0.6)', color: '#94a3b8', border: '1px solid #334155' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.8)'; e.currentTarget.style.color = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.6)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Download size={12} />
              Export full report (TXT)
            </button>
            <button
              onClick={exportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: 'rgba(51,65,85,0.6)', color: '#94a3b8', border: '1px solid #334155' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.8)'; e.currentTarget.style.color = '#f1f5f9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(51,65,85,0.6)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <Download size={12} />
              Export JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#38bdf8' }}>{title}</h4>
      {children}
    </div>
  );
}

function InputRow({ label, value, bold }: { label: string; value: string | number; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span style={{ color: '#64748b' }}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''}`} style={{ color: '#f1f5f9' }}>{value}</span>
    </div>
  );
}

function InputExplanation({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] mb-2 pl-2" style={{ color: '#64748b', borderLeft: '2px solid #334155' }}>
      {children}
    </p>
  );
}

function buildOfficialReport(inputs: Record<string, unknown>, tradeLane: { label: string; source: string }): string {
  const lines: string[] = [
    '═══════════════════════════════════════════════════════════════════════════════',
    '  PORT CONGESTION & D&D PRICING — COMPLIANCE LEDGER',
    '  Official Audit Report',
    '═══════════════════════════════════════════════════════════════════════════════',
    '',
    `Port: ${inputs.port}`,
    `Generated: ${inputs.timestamp}`,
    '',
    '───────────────────────────────────────────────────────────────────────────────',
    '1. EXECUTIVE SUMMARY',
    '───────────────────────────────────────────────────────────────────────────────',
    '',
    `This report documents the inputs, methodology, and rationale used to compute the`,
    `congestion score and dynamic demurrage & detention (D&D) reference rate for ${inputs.port}.`,
    `The reference rate of $${Number(inputs.ddRate).toLocaleString()}/day reflects a ${inputs.ddMultiplier}× multiplier`,
    `applied to the trade-lane base rate of $${inputs.baseRate}/day for ${tradeLane.label}.`,
    '',
    '───────────────────────────────────────────────────────────────────────────────',
    '2. AIS DATA INPUTS',
    '───────────────────────────────────────────────────────────────────────────────',
    '',
    `Anchored vessels:     ${inputs.anchored}  (vessels at anchor outside port; 40% weight)`,
    `Moored vessels:       ${inputs.moored}  (vessels at berth)`,
    `Underway (inner):     ${inputs.underway}  (vessels moving in inner zone)`,
    `Inbound (outer):      ${inputs.inbound}  (vessels approaching port; 15% weight)`,
    `Other/unknown:       ${inputs.other}  (excluded from scoring)`,
    `Total vessels:       ${inputs.totalVessels}`,
    `Commercial (scored): ${inputs.commercialVessels}  (ship types 70–89 only)`,
    `AIS message count:   ${inputs.messageCount}`,
    '',
    '───────────────────────────────────────────────────────────────────────────────',
    '3. CONGESTION SCORE METHODOLOGY',
    '───────────────────────────────────────────────────────────────────────────────',
    '',
    `Score components: Anchored 40%, Inner density 25%, Low-speed 20%, Inbound 15%`,
    `Current score: ${inputs.score} — Level: ${inputs.level}`,
    '',
    '───────────────────────────────────────────────────────────────────────────────',
    '4. D&D PRICING METHODOLOGY',
    '───────────────────────────────────────────────────────────────────────────────',
    '',
    `Trade-lane base: $${inputs.baseRate}/day (${tradeLane.label})`,
    `Source: ${tradeLane.source}`,
    `Congestion multiplier: ${inputs.ddMultiplier}× (smooth curve: 0.60× at score 0 → 3.50× at score 100)`,
    `Effective rate: $${inputs.baseRate} × ${inputs.ddMultiplier} = $${Number(inputs.ddRate).toLocaleString()}/day`,
    '',
    'Calibration: FMC filings, Drewry Port Benchmark 2024, DP World/PSA programmes.',
    '',
    '───────────────────────────────────────────────────────────────────────────────',
    '5. LIMITATIONS',
    '───────────────────────────────────────────────────────────────────────────────',
    '',
    'OSRA fields (dwell time, empty return) not available — AIS-only inputs.',
    'Indicative estimates. Actual charges depend on carrier agreements and terminal conditions.',
    '',
    '═══════════════════════════════════════════════════════════════════════════════',
  ];
  return lines.join('\n');
}

export default ComplianceLedger;
