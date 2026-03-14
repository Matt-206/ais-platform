import Link from 'next/link';
import { ArrowLeft, FileText, BarChart3, DollarSign, Shield } from 'lucide-react';

export const metadata = {
  title: 'Methodology | Port Congestion Intelligence',
  description: 'How congestion scores and dynamic D&D pricing are computed from live AIS data.',
};

export default function MethodologyPage() {
  return (
    <div className="h-screen overflow-y-auto bg-[#0a0f1a] text-slate-200">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to map
          </Link>
          <h1 className="text-lg font-bold text-white">Methodology</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
            <FileText size={20} className="text-sky-400" />
            Data sources
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The platform uses <strong className="text-slate-100">live AIS (Automatic Identification System)</strong> vessel
              position and static data from AISstream.io. Vessels are filtered to port-specific inner and outer zones
              (bounding boxes) for Rotterdam, Singapore, Los Angeles, Hamburg, and Antwerp.
            </p>
            <p>
              Only <strong className="text-slate-100">commercial vessels</strong> (ship types 70–89: cargo and tanker)
              drive the congestion score. Vessel records expire after 5 hours of no updates to avoid stale counts.
            </p>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
            <BarChart3 size={20} className="text-sky-400" />
            Congestion score (0–100)
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The score is a weighted combination of four AIS-derived signals:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
              <li><strong className="text-slate-200">Anchored (40%)</strong> — vessels at anchor outside port; strongest congestion signal</li>
              <li><strong className="text-slate-200">Inner density (25%)</strong> — commercial vessels in inner zone vs capacity</li>
              <li><strong className="text-slate-200">Low speed (20%)</strong> — fraction of inner-zone vessels moving &lt;2 kn</li>
              <li><strong className="text-slate-200">Inbound pressure (15%)</strong> — vessels underway in outer zone approaching port</li>
            </ul>
            <p>
              Nav status is inferred from AIS NavigationalStatus when available; otherwise speed &lt;0.5 kn uses zone: inner = moored (at berth), outer = anchored (waiting).
              Saturation thresholds are calibrated so scores distribute meaningfully across typical port conditions.
            </p>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
            <DollarSign size={20} className="text-sky-400" />
            Dynamic D&amp;D pricing
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              A <strong className="text-slate-100">smooth piecewise-linear multiplier curve</strong> maps congestion score
              to a rate multiplier. Anchor points are calibrated to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
              <li>Score 0: 0.60× (terminal competing for cargo; DP World incentive programmes)</li>
              <li>Score 25: 1.00× (neutral / published base rate)</li>
              <li>Score 50: 1.35× (FMC-filed congestion surcharges)</li>
              <li>Score 75: 2.00× (Drewry peak-backlog data)</li>
              <li>Score 100: 3.50× (2021 supply chain crisis peaks)</li>
            </ul>
            <p>
              <strong className="text-slate-100">Trade-lane base rates</strong> vary by port (e.g. North Europe $975, SE Asia $720).
              <strong className="text-slate-100"> WTP elasticity</strong> adjusts surcharges by container type: reefer (1.30–1.35×)
              absorbs more; dry commodity (0.85×) gets larger discounts at low occupancy. <strong className="text-slate-100">Bonus free days</strong>
              (+5 at score &lt;10, +2 at score &lt;25) reflect DP World / PSA off-peak incentive programmes.
            </p>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
            <Shield size={20} className="text-sky-400" />
            Confidence and data quality
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Per-port <strong className="text-slate-100">confidence</strong> is derived from vessel coverage:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-slate-400">
              <li><strong className="text-slate-200">High</strong> — ≥5 commercial vessels and ≥3 total</li>
              <li><strong className="text-slate-200">Medium</strong> — ≥2 commercial or ≥2 total</li>
              <li><strong className="text-slate-200">Low</strong> — sparse coverage; interpret with caution</li>
            </ul>
            <p>
              Data lineage (vessel counts, message count) is shown in the port panel.
            </p>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
            <BarChart3 size={20} className="text-sky-400" />
            12-hour forecast
          </h2>
          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              The forecast blends <strong className="text-slate-100">60% same-hour average</strong> (from up to 7 days of
              persisted history) with <strong className="text-slate-100">40% current score</strong>. A short-term
              <strong className="text-slate-100"> trend</strong> (momentum from recent hours) nudges the forecast up or
              down, fading over the 12-hour horizon. When no history exists, scores mean-revert toward a neutral level (38).
            </p>
            <p>
              A <strong className="text-slate-100">port-specific time-of-day multiplier</strong> (1.08× during 06:00–20:00
              local time, 0.88× at night) reflects that ports are typically busier during business hours in their time zone.
            </p>
          </div>
        </section>

        <section className="rounded-xl p-4 border border-slate-700/50 bg-slate-900/50">
          <p className="text-xs text-slate-500">
            Indicative estimates only. Actual D&amp;D charges depend on individual carrier agreements, terminal conditions,
            and vessel timing. Sources: Maersk/MSC/CMA CGM published tariffs 2025; FMC filings; Drewry Port Benchmark 2024;
            DP World and PSA terminal conditions.
          </p>
        </section>
      </main>
    </div>
  );
}
