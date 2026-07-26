import { useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '../components/AppShell'
import ElementComposer from '../components/ElementComposer'
import cancerTypes from '../../data/cancer_types.json'

function formatMetric(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  if (Number.isFinite(number)) {
    return number >= 10 ? number.toFixed(0) : number.toFixed(2)
  }
  return String(value)
}

export default function Submit() {
  const [title, setTitle] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [cancerType, setCancerType] = useState('Glioma')
  const [elements, setElements] = useState({ H: 0.6, O: 0.4 })
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const elementEntries = useMemo(() => Object.entries(elements).filter(([, amount]) => Number(amount) > 0).sort((a, b) => b[1] - a[1]), [elements])
  const formulaPreview = elementEntries.map(([symbol, amount]) => `${symbol}${Number(amount).toFixed(2)}`).join(' + ')
  const activeCancer = useMemo(() => cancerTypes.find((entry) => entry.name === cancerType) || null, [cancerType])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')
    setResult(null)

    const payload = {
      title: title.trim(),
      submitted_by: submittedBy.trim() || null,
      cancer_type: cancerType.trim() || null,
      elements
    }

    try {
      const res = await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.detail || json.error || 'Submission failed')
      }

      setResult(json)
      setStatus('submitted')
    } catch (error) {
      setErrorMessage(error.message)
      setStatus('error')
    }
  }

  return (
    <AppShell title="Submit a finding" subtitle="Publish a new composition for the MONA field to score and rank.">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="mona-card p-8">
          <p className="mona-pill">Research lens</p>
          <h2 className="mt-4 text-2xl font-semibold">Turn an element map into a live experiment profile.</h2>
          <p className="mt-3 text-sm text-slate-700">
            Each submission is parsed into a composition vector, scored against the target cancer profile, and returned with a ranking signal, sensitivity band, and formula preview.
          </p>

          <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/35 bg-white/80 p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-mona-orange">Formula preview</p>
            <p className="mt-2 text-xl font-semibold text-mona-blue">{formulaPreview || 'No active elements'}</p>
            <p className="mt-2 text-sm text-slate-700">The engine evaluates the vector from the field input you provide.</p>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/35 bg-white/80 p-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-mona-orange">Cancer context</p>
            {activeCancer ? (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="font-semibold text-mona-blue">{activeCancer.name}</p>
                <p>{activeCancer.description}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Aggressiveness {activeCancer.aggressiveness_score}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-700">Choose a cancer target to refine the scoring context.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/leaderboard">
              <a className="mona-btn">Review rankings</a>
            </Link>
            <Link href="/">
              <a className="mona-btn mona-btn--accent">Back to overview</a>
            </Link>
          </div>
        </div>

        <div className="mona-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mona-label" htmlFor="title">Discovery title</label>
              <input id="title" className="mona-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Lanthanum-manganese lattice" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mona-label" htmlFor="submittedBy">Submitted by</label>
                <input id="submittedBy" className="mona-input" value={submittedBy} onChange={(e) => setSubmittedBy(e.target.value)} placeholder="Dr. A. Rivera" />
              </div>
              <div>
                <label className="mona-label" htmlFor="cancerType">Target cancer</label>
                <input id="cancerType" className="mona-input" list="cancer-types" value={cancerType} onChange={(e) => setCancerType(e.target.value)} placeholder="Breast / Glioblastoma / etc." />
                <datalist id="cancer-types">
                  {cancerTypes.map((entry) => (
                    <option key={entry.name} value={entry.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="mona-label" htmlFor="elements">Element composer</label>
              <ElementComposer value={elements} onChange={setElements} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="mona-btn mona-btn--accent" type="submit">Publish finding</button>
              <span className="text-sm text-slate-600">
                {status === 'submitting' ? 'Publishing…' : status === 'submitted' ? 'Submission sent.' : status === 'error' ? 'Submission failed.' : 'Ready to publish.'}
              </span>
            </div>
            {errorMessage ? <p className="text-sm text-orange-600">{errorMessage}</p> : null}
          </form>

          {result?.entry ? (
            <div className="mt-6 rounded-2xl border border-dashed border-mona-blue/35 bg-white/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-mona-orange">Engine output</p>
                  <h3 className="mt-2 text-xl font-semibold">{result.entry.recipe_name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold text-mona-blue">{formatMetric(result.entry.prediction)}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">signal</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="mona-panel">
                  <p className="mona-kicker">Rank</p>
                  <p className="mt-2 text-xl font-semibold text-mona-blue">#{result.rank || '—'}</p>
                </div>
                <div className="mona-panel">
                  <p className="mona-kicker">AUC</p>
                  <p className="mt-2 text-xl font-semibold text-mona-blue">{formatMetric(result.entry.predicted_auc)}</p>
                </div>
                <div className="mona-panel">
                  <p className="mona-kicker">Band</p>
                  <p className="mt-2 text-xl font-semibold text-mona-blue">{result.entry.sensitivity_band}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-mona-orange/40 bg-white/80 p-4 text-sm text-slate-700">
                <p className="font-semibold text-mona-blue">Interpretation</p>
                <p className="mt-2">
                  {result.entry.effective
                    ? 'This composition is currently interpreted as an effective candidate within the scoring surface.'
                    : 'This composition sits in the review band; it should be treated as a hypothesis until more evidence is gathered.'}
                </p>
                <p className="mt-2">
                  Sensitivity percentile {formatMetric(result.entry.sensitivity_percentile)} and threshold {formatMetric(result.entry.threshold_auc)} frame the current decision boundary.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  )
}
