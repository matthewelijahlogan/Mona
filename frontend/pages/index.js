import Link from 'next/link'
import useSWR from 'swr'
import AppShell from '../components/AppShell'

const fetcher = (url) =>
  fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error('Unable to reach the live field.')
    }
    return response.json()
  })

function formatMetric(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isFinite(number)) {
    return number >= 10 ? number.toFixed(0) : number.toFixed(2)
  }
  return String(value)
}

export default function Home() {
  const { data, error, isLoading } = useSWR('/api/leaderboard', fetcher)
  const entries = data?.entries || []
  const topEntry = entries[0] || null
  const total = data?.total ?? entries.length

  return (
    <AppShell
      title="MONA — Model of Natural Ascension"
      subtitle="A celestial research console for elemental cancer discovery."
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="mona-card p-8">
          <p className="mona-pill">Live field pulse</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">
            Push a composition into the field, score it against the target profile, and watch the leaderboard evolve in real time.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-slate-700">
            MONA now exposes the same ranking signal used by the backend engine: each finding produces a numeric prediction, a sensitivity band, and a ranked placement in the discovery surface.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="mona-panel">
              <p className="mona-kicker">Visible submissions</p>
              <p className="mt-2 text-3xl font-semibold text-mona-blue">{isLoading ? '…' : total}</p>
            </div>
            <div className="mona-panel">
              <p className="mona-kicker">Top signal</p>
              <p className="mt-2 text-3xl font-semibold text-mona-blue">
                {isLoading ? '…' : formatMetric(topEntry?.prediction)}
              </p>
            </div>
            <div className="mona-panel">
              <p className="mona-kicker">Current band</p>
              <p className="mt-2 text-xl font-semibold text-mona-blue">
                {isLoading ? '…' : topEntry?.sensitivity_band || 'pending'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/submit">
              <a className="mona-btn mona-btn--accent">Launch a submission</a>
            </Link>
            <Link href="/leaderboard">
              <a className="mona-btn">Open leaderboard</a>
            </Link>
          </div>
        </div>

        <div className="mona-card p-8">
          <p className="mona-pill">Operational view</p>
          {error ? (
            <div className="mt-4 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
              The field is currently unavailable. The interface is still ready to receive submissions.
            </div>
          ) : isLoading ? (
            <div className="mt-4 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
              Loading the live discovery surface…
            </div>
          ) : topEntry ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-dashed border-mona-blue/35 bg-white/85 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] text-mona-orange">Current leader</p>
                <h3 className="mt-2 text-xl font-semibold">{topEntry.recipe_name}</h3>
                <p className="mt-2 text-sm text-slate-700">
                  {topEntry.submitted_by || 'Anonymous'} • {topEntry.cancer_type || 'target profile'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="mona-chip">{topEntry.formula || 'formula pending'}</span>
                  <span className="mona-chip">AUC {formatMetric(topEntry.predicted_auc)}</span>
                  <span className="mona-chip">{topEntry.effective ? 'effective' : 'review'}</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="text-mona-orange">01</span>
                  <span>Capture the composition and the target cancer profile.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-mona-orange">02</span>
                  <span>Publish it to the MONA pipeline to receive a scored result.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-mona-orange">03</span>
                  <span>Track where it lands across the leaderboard as the field grows.</span>
                </li>
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
              No entries are in the field yet. Be the first to publish a finding.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Research workflow</h3>
          <p className="mt-2 text-sm text-slate-700">Move from a composition sketch to a scored submission with a clear output profile.</p>
        </div>
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Field intelligence</h3>
          <p className="mt-2 text-sm text-slate-700">Track ranking signal, sensitivity bands, and the live peptide-like formula of each finding.</p>
        </div>
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Future-ready</h3>
          <p className="mt-2 text-sm text-slate-700">The interface is already structured to expand from known drugs into a full periodic-table model.</p>
        </div>
      </section>
    </AppShell>
  )
}
