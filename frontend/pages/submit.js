import { useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '../components/AppShell'

function parseElements(text) {
  const normalized = {}
  text.split(/\n|,/).forEach((entry) => {
    const trimmed = entry.trim()
    if (!trimmed) return
    const [symbol, value] = trimmed.split(':').map((part) => part.trim())
    if (symbol && value) normalized[symbol] = Number(value)
  })
  return normalized
}

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
  const [cancerType, setCancerType] = useState('')
  const [elements, setElements] = useState('H: 0.6\nO: 0.4')
  const [status, setStatus] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const parsedElements = useMemo(() => parseElements(elements), [elements])
  const elementEntries = Object.entries(parsedElements).sort((a, b) => b[1] - a[1])
  const formulaPreview = elementEntries.map(([symbol, amount]) => `${symbol}${amount}`).join(' + ')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')
    setResult(null)

    const payload = {
      title: title.trim(),
      submitted_by: submittedBy.trim() || null,
      cancer_type: cancerType.trim() || null,
      elements: parsedElements
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

          <div className="mt-6 space-y-3">
            {elementEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-mona-blue/35 bg-white/70 p-4 text-sm text-slate-700">
                Add at least one element pair to build a submission profile.
              </div>
            ) : (
              elementEntries.slice(0, 5).map(([symbol, amount]) => (
                <div key={symbol} className="flex items-center justify-between rounded-2xl border border-dashed border-mona-blue/35 bg-white/70 px-4 py-3 text-sm text-slate-700">
                  <span className="font-semibold text-mona-blue">{symbol}</span>
                  <span>{amount}</span>
                </div>
              ))
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
                <input id="cancerType" className="mona-input" value={cancerType} onChange={(e) => setCancerType(e.target.value)} placeholder="Breast / Glioblastoma / etc." />
              </div>
            </div>

            <div>
              <label className="mona-label" htmlFor="elements">Element map</label>
              <textarea id="elements" className="mona-input min-h-[140px]" value={elements} onChange={(e) => setElements(e.target.value)} placeholder="Use lines like H: 0.6 or Fe: 0.3" />
              <p className="mt-2 text-sm text-slate-600">Use simple pairs such as Fe: 0.4, Cu: 0.2, or one per line.</p>
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
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  )
}
