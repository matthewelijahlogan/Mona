import { useState } from 'react'
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

export default function Submit() {
  const [title, setTitle] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [cancerType, setCancerType] = useState('')
  const [elements, setElements] = useState('H: 0.6\nO: 0.4')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')

    const payload = {
      title,
      submitted_by: submittedBy || null,
      cancer_type: cancerType || null,
      elements: parseElements(elements)
    }

    const res = await fetch('/api/findings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    setStatus(res.ok ? 'submitted' : 'error')
  }

  return (
    <AppShell title="Submit a finding" subtitle="Publish a new composition for the MONA field to score and rank.">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mona-card p-8">
          <p className="mona-pill">Submission workflow</p>
          <h2 className="mt-4 text-2xl font-semibold">A focused intake form for real research notes.</h2>
          <p className="mt-3 text-sm text-slate-700">
            Capture the discovery title, the target cancer profile, the submitter, and a simple element map. This is the first step toward a shared ranking layer.
          </p>
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
              <span className="text-sm text-slate-600">{status === 'submitting' ? 'Publishing…' : status === 'submitted' ? 'Submission sent.' : status === 'error' ? 'Submission failed.' : 'Ready to publish.'}</span>
            </div>
          </form>
        </div>
      </section>
    </AppShell>
  )
}
