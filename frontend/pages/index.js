import Link from 'next/link'
import useSWR from 'swr'
import AppShell from '../components/AppShell'
import FlowField from '../components/FlowField'

const fetcher = (url) => fetch(url).then((response) => {
  if (!response.ok) throw new Error('Service unavailable')
  return response.json()
})

function formatScore(value) {
  const score = Number(value)
  return Number.isFinite(score) ? score.toFixed(3) : '—'
}

export default function Home() {
  const { data, error, isLoading } = useSWR('/api/leaderboard', fetcher)
  const entries = data?.entries || []
  const topEntry = entries[0]

  return (
    <AppShell>
      <section className="hero">
        <FlowField />
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-copy">
          <p className="eyebrow"><span>Open research field</span> / elemental intelligence</p>
          <h1>
            <span>Go beyond the</span>
            <em>known compound.</em>
          </h1>
          <p className="hero-intro">
            Explore any elemental combination against cancer-response data in a transparent,
            evidence-aware computational workspace.
          </p>
          <div className="hero-actions">
            <Link href="/submit">
              <a className="button button--primary">Enter the element lab <span>↗</span></a>
            </Link>
            <Link href="/leaderboard">
              <a className="button button--ghost">View discoveries <span>→</span></a>
            </Link>
          </div>
        </div>

        <aside className="hero-signal">
          <div className="signal-index">MONA—01</div>
          <p>Processing field</p>
          <strong>118</strong>
          <span>recognized elements</span>
          <div className="signal-line"><i /></div>
          <small>Any ratio. Any combination. Coverage disclosed with every projection.</small>
        </aside>
      </section>

      <section className="metric-rail" aria-label="Live service metrics">
        <div>
          <span>01</span>
          <p>Element space</p>
          <strong>118</strong>
          <small>complete periodic table</small>
        </div>
        <div>
          <span>02</span>
          <p>Live findings</p>
          <strong>{isLoading ? '···' : data?.total ?? 0}</strong>
          <small>{error ? 'field reconnecting' : 'ranked experiments'}</small>
        </div>
        <div>
          <span>03</span>
          <p>Leading signal</p>
          <strong>{isLoading ? '···' : formatScore(topEntry?.prediction)}</strong>
          <small>{topEntry?.recipe_name || 'awaiting discovery'}</small>
        </div>
        <div>
          <span>04</span>
          <p>Service state</p>
          <strong className="service-word">{error ? 'Partial' : 'Online'}</strong>
          <small>analysis API connected</small>
        </div>
      </section>

      <section className="method-section">
        <div className="section-heading">
          <p className="eyebrow">A wider research aperture</p>
          <h2>From periodic field to an interpretable signal.</h2>
          <p>
            MONA keeps the exploratory layer separate from validated evidence. The result is a
            faster way to frame hypotheses without disguising projections as clinical fact.
          </p>
        </div>

        <div className="method-grid">
          <article>
            <span className="method-number">01</span>
            <div className="method-icon atom-icon" aria-hidden="true"><i /><i /><i /></div>
            <h3>Compose</h3>
            <p>Select any of 118 elements and set relative proportions in a full periodic-table interface.</p>
          </article>
          <article>
            <span className="method-number">02</span>
            <div className="method-icon field-icon" aria-hidden="true"><i /><i /><i /></div>
            <h3>Project</h3>
            <p>Compare the composition with cancer-specific signals and neighboring elemental behavior.</p>
          </article>
          <article>
            <span className="method-number">03</span>
            <div className="method-icon clarity-icon" aria-hidden="true"><i /><i /><i /></div>
            <h3>Interpret</h3>
            <p>Read score, evidence coverage, composition descriptors, and limitations together.</p>
          </article>
        </div>
      </section>

      <section className="research-note">
        <p className="eyebrow">The principle</p>
        <blockquote>
          “The unexplored spaces between disciplines are often where the next useful question begins.”
        </blockquote>
        <div>
          <span />
          <p>MONA research direction</p>
        </div>
      </section>
    </AppShell>
  )
}
