'use client';

import { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { PortState } from '@/lib/types';

interface ComplianceLedgerProps {
  portName: string;
  data: PortState;
}

/** Audit trail of inputs used for congestion/pricing — OSRA-compliant MVP */
function ComplianceLedger({ portName, data }: ComplianceLedgerProps) {
  const [expanded, setExpanded] = useState(false);

  const dq = data.dataQuality;
  const inputs = {
    port: portName,
    timestamp: data.lastUpdated,
    score: data.score,
    level: data.level,
    ddMultiplier: data.ddMultiplier,
    anchored: data.anchored,
    moored: data.moored,
    underway: data.underway,
    inbound: data.inbound,
    other: data.other ?? Math.max(0, data.totalVessels - data.anchored - data.moored - data.underway),
    totalVessels: data.totalVessels,
    commercialVessels: data.commercialVessels ?? '—',
    messageCount: dq?.messageCount ?? '—',
  };

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ complianceLedger: inputs, osraFields: 'Not available (AIS-only)' }, null, 2)],
      { type: 'application/json' }
    );
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
        <span className="text-[10px]" style={{ color: '#64748b' }}>Audit trail</span>
        {expanded ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronDown size={14} style={{ color: '#64748b' }} />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div style={{ color: '#64748b' }}>Port</div>
            <div className="font-medium" style={{ color: '#f1f5f9' }}>{inputs.port}</div>
            <div style={{ color: '#64748b' }}>Timestamp</div>
            <div className="font-mono" style={{ color: '#94a3b8' }}>{inputs.timestamp}</div>
            <div style={{ color: '#64748b' }}>Congestion score</div>
            <div className="font-mono font-bold" style={{ color: data.color }}>{inputs.score}</div>
            <div style={{ color: '#64748b' }}>Level</div>
            <div style={{ color: '#94a3b8' }}>{inputs.level}</div>
            <div style={{ color: '#64748b' }}>D&D multiplier</div>
            <div className="font-mono" style={{ color: '#94a3b8' }}>{inputs.ddMultiplier}×</div>
            <div style={{ color: '#64748b' }}>Anchored</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.anchored}</div>
            <div style={{ color: '#64748b' }}>Moored</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.moored}</div>
            <div style={{ color: '#64748b' }}>Underway</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.underway}</div>
            <div style={{ color: '#64748b' }}>Inbound</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.inbound}</div>
            <div style={{ color: '#64748b' }}>Other</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.other}</div>
            <div style={{ color: '#64748b' }}>Total vessels</div>
            <div className="font-mono font-bold" style={{ color: '#f1f5f9' }}>{inputs.totalVessels}</div>
            <div style={{ color: '#64748b' }}>Commercial (scored)</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.commercialVessels}</div>
            <div style={{ color: '#64748b' }}>AIS message count</div>
            <div className="font-mono" style={{ color: '#f1f5f9' }}>{inputs.messageCount}</div>
          </div>
          <div className="text-[10px] rounded-lg p-2" style={{ background: 'rgba(15,23,42,0.5)', color: '#64748b' }}>
            OSRA fields (dwell time, empty return, etc.): Not available — AIS-only inputs.
          </div>
          <button
            onClick={exportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: 'rgba(51,65,85,0.6)', color: '#94a3b8', border: '1px solid #334155' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(51,65,85,0.8)';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(51,65,85,0.6)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <Download size={12} />
            Export for audit
          </button>
        </div>
      )}
    </div>
  );
}

export default ComplianceLedger;
