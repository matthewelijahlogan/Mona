import Link from 'next/link'
import useSWR from 'swr'
import AppShell from '../components/AppShell'

const fetcher = (url) => fetch(url).then((response) => {
  if (!response.ok) throw new Error('Unable to load discoveries')
  return response.json()
})

function formatMetric(value, digits = 3) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(digits) : '—'
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

export default function Leaderboard() {
  const { data, error, isLoading } = useSWR('/api/leaderboard', fetcher, {
    refreshInterval: 30000,
  })
  const entries = data?.entries || []

  return (
    <AppShell compactHeader>
      <section className="discoveries-hero">
        <div>
          <p className="eyebrow">Public field / live rankings</p>
          <h1>Discoveries in motion.</h1>
          <p>
            A transparent record of published elemental analyses, ranked by exploratory signal.
            Every result remains a research hypothesis until externally validated.
          </p>
        </div>
        <div className="discovery-count">
          <span>Visible findings</span>
          <strong>{isLoading ? '··' : data?.total ?? entries.length}</strong>
          <small>refreshes every 30 seconds</small>
        </div>
      </section>

      <section className="leaderboard-section">
        <div className="leaderboard-toolbar">
          <div>
            <span className="status-pulse" />
            Live MONA field
          </div>
          <Link href="/submit">
            <a className="button button--primary">Start an analysis <span>↗</span></a>
          </Link>
        </div>

        {error ? (
          <div className="field-message">The public field is reconnecting. Please try again shortly.</div>
        ) : isLoading ? (
          <div className="field-message">Resolving live discoveries…</div>
        ) : entries.length === 0 ? (
          <div className="field-message">The field is open. Publish the first elemental analysis.</div>
        ) : (
          <ol className="rank-list">
            {entries.map((item, index) => (
              <li key={item.id || `${item.recipe_name}-${index}`}>
                <div className="rank-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="rank-identity">
                  <p>{item.cancer_type || 'Unspecified profile'}</p>
                  <h2>{item.recipe_name}</h2>
                  <span>by {item.submitted_by || 'Anonymous'} · {formatDate(item.created_at)}</span>
                </div>
                <div className="rank-formula">
                  <span>Composition</span>
                  <strong>{item.formula || '—'}</strong>
                  <small>{item.analysis_mode || 'legacy'} analysis</small>
                </div>
                <div className="rank-coverage">
                  <span>Coverage</span>
                  <strong>{item.evidence_coverage == null ? '—' : `${Math.round(item.evidence_coverage * 100)}%`}</strong>
                  <small>{item.sensitivity_band || 'Unclassified signal'}</small>
                </div>
                <div className="rank-score">
                  <span>Signal</span>
                  <strong>{formatMetric(item.prediction)}</strong>
                  <i style={{ '--rank-score': `${Math.max(0, Math.min(1, Number(item.prediction) || 0)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  )
}
