import Link from 'next/link'
import useSWR from 'swr'
import AppShell from '../components/AppShell'

const fetcher = (url) => fetch(url).then((r) => r.json())

function formatMetric(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isFinite(number)) {
    return number >= 10 ? number.toFixed(0) : number.toFixed(2)
  }
  return String(value)
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch (error) {
    return value
  }
}

export default function Leaderboard() {
  const { data, error } = useSWR('/api/leaderboard', fetcher)
  const entries = data?.entries || []
  const total = data?.total ?? entries.length

  return (
    <AppShell title="Discovery leaderboard" subtitle="A ranked view of the submissions currently driving the MONA field.">
      <section className="mona-card p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mona-pill">Live field activity</p>
            <h2 className="mt-3 text-2xl font-semibold">Ranked findings</h2>
            <p className="mt-2 text-sm text-slate-700">
              {total} submission{total === 1 ? '' : 's'} currently visible in the field.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/submit">
              <a className="mona-btn mona-btn--accent">Publish a finding</a>
            </Link>
            <Link href="/">
              <a className="mona-btn">Return home</a>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
            The leaderboard is temporarily unavailable. Please try again in a moment.
          </div>
        ) : !data ? (
          <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
            Loading live findings…
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/40 bg-white/70 p-4 text-sm text-slate-700">
            No entries yet. Be the first to publish a finding.
          </div>
        ) : (
          <ol className="mt-6 space-y-4">
            {entries.map((item, index) => (
              <li key={item.id || `${item.recipe_name}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-dashed border-mona-blue/40 bg-white/85 p-5 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-dashed border-mona-blue/40 px-3 py-1 text-sm font-semibold text-mona-blue">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-lg">{item.recipe_name}</div>
                      <div className="text-sm text-slate-600">
                        Submitted by {item.submitted_by || 'anonymous'} • {item.cancer_type || 'targeted profile'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="mona-chip">{item.formula || 'formula pending'}</span>
                    <span className="mona-chip">Band {item.sensitivity_band || '—'}</span>
                    <span className="mona-chip">AUC {formatMetric(item.predicted_auc)}</span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">Published {formatDate(item.created_at)}</p>
                </div>

                <div className="min-w-[160px] rounded-2xl border border-dashed border-mona-blue/35 bg-white/70 p-4 text-right">
                  <div className="text-2xl font-semibold text-mona-blue">{formatMetric(item.prediction)}</div>
                  <div className="text-xs uppercase tracking-[0.25em] text-mona-orange">signal strength</div>
                  <div className="mt-2 text-sm text-slate-600">{item.effective ? 'Effective' : 'Needs review'}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  )
}
