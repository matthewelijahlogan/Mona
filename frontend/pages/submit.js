import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import ElementComposer from '../components/ElementComposer'
import { CANCER_TYPES as cancerTypes } from '../data/cancerTypes'

const SUPPORTED_CANCERS = new Set([
  'Breast Cancer',
  'Colon Adenocarcinoma',
  'Lung Adenocarcinoma',
  'Lung Squamous Cell Carcinoma',
  'Melanoma',
  'Ovarian Serous Cystadenocarcinoma',
  'Prostate Cancer',
])

const CANCER_OPTIONS = cancerTypes
  .map((entry) => entry.name)
  .filter(Boolean)
  .sort((a, b) => {
    const supportDelta = Number(SUPPORTED_CANCERS.has(b)) - Number(SUPPORTED_CANCERS.has(a))
    return supportDelta || a.localeCompare(b)
  })

function percent(value) {
  const number = Number(value)
  return Number.isFinite(number) ? `${Math.round(number * 100)}%` : '—'
}

export default function Submit() {
  const [cancerType, setCancerType] = useState('Breast Cancer')
  const [elements, setElements] = useState({ C: 1, H: 2, O: 1 })
  const [analysis, setAnalysis] = useState(null)
  const [analysisState, setAnalysisState] = useState('idle')
  const [analysisError, setAnalysisError] = useState('')
  const [title, setTitle] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [publishState, setPublishState] = useState('idle')
  const [published, setPublished] = useState(null)

  const entryCount = Object.values(elements).filter((amount) => Number(amount) > 0).length
  const canAnalyze = entryCount > 0 && cancerType
  const formula = analysis?.formula || Object.entries(elements).map(([symbol, amount]) => `${symbol}${amount}`).join('')

  const activeCancer = useMemo(
    () => cancerTypes.find((entry) => entry.name === cancerType),
    [cancerType],
  )

  async function analyze() {
    if (!canAnalyze) return
    setAnalysisState('loading')
    setAnalysisError('')
    setAnalysis(null)
    setPublished(null)
    try {
      const response = await fetch('/api/analyze-composition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancer_type: cancerType, elements }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || payload.error || 'Analysis failed')
      setAnalysis(payload)
      setAnalysisState('complete')
      if (!title) setTitle(`${formula || 'Elemental'} field study`)
    } catch (error) {
      setAnalysisError(error.message)
      setAnalysisState('error')
    }
  }

  async function publish(event) {
    event.preventDefault()
    if (!analysis || !title.trim()) return
    setPublishState('loading')
    try {
      const response = await fetch('/api/findings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          submitted_by: submittedBy.trim() || null,
          cancer_type: cancerType,
          elements,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.detail || payload.error || 'Unable to publish')
      setPublished(payload)
      setPublishState('complete')
    } catch (error) {
      setPublishState('error')
      setAnalysisError(error.message)
    }
  }

  return (
    <AppShell compactHeader>
      <section className="lab-intro">
        <div>
          <p className="eyebrow">Element lab / composition analysis</p>
          <h1>Build beyond the known.</h1>
          <p>
            Select any elemental combination, set the relative parts, and choose a cancer context.
            MONA will state how much of the result is evidence-backed and how much is projected.
          </p>
        </div>
        <div className="lab-index">
          <span>Workspace</span>
          <strong>02</strong>
          <small>research mode</small>
        </div>
      </section>

      <section className="lab-layout">
        <div className="lab-main">
          <ElementComposer value={elements} onChange={(next) => {
            setElements(next)
            setAnalysis(null)
            setAnalysisState('idle')
          }} />
        </div>

        <aside className="analysis-console">
          <div className="console-heading">
            <p className="eyebrow">Analysis context</p>
            <span className="console-status"><i /> {analysisState === 'loading' ? 'processing' : 'ready'}</span>
          </div>

          <label className="field-label" htmlFor="cancer-type">Cancer profile</label>
          <select
            id="cancer-type"
            className="select-field"
            value={cancerType}
            onChange={(event) => {
              setCancerType(event.target.value)
              setAnalysis(null)
            }}
          >
            {CANCER_OPTIONS.map((name) => (
              <option value={name} key={name}>
                {name}{SUPPORTED_CANCERS.has(name) ? ' · direct dataset' : ' · projected'}
              </option>
            ))}
          </select>

          <div className="context-card">
            <span>{SUPPORTED_CANCERS.has(cancerType) ? 'Direct context' : 'Projected context'}</span>
            <strong>{cancerType}</strong>
            <p>{activeCancer?.description || 'Cancer profile from the MONA target map.'}</p>
          </div>

          <div className="formula-card">
            <span>Current composition</span>
            <strong>{formula || '—'}</strong>
            <small>{entryCount} active / 118 recognized</small>
          </div>

          <button className="button button--primary button--wide" type="button" disabled={!canAnalyze || analysisState === 'loading'} onClick={analyze}>
            {analysisState === 'loading' ? 'Resolving field…' : 'Analyze composition'}
            <span>↗</span>
          </button>

          <p className="console-disclaimer">
            Exploratory computation only. Results are not clinical evidence, a treatment recommendation,
            or a substitute for laboratory validation.
          </p>
        </aside>
      </section>

      {analysisError ? <div className="error-banner">{analysisError}</div> : null}

      {analysis ? (
        <section className="results-section">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Resolved field / {analysis.analysis_mode}</p>
              <h2>{analysis.formula}</h2>
            </div>
            <div className="result-score">
              <span>Exploration signal</span>
              <strong>{Number(analysis.exploration_score).toFixed(3)}</strong>
            </div>
          </div>

          <div className="results-grid">
            <article className="gauge-card">
              <div
                className="score-gauge"
                style={{ '--score': `${Math.round(analysis.exploration_score * 100) * 3.6}deg` }}
              >
                <div><strong>{percent(analysis.exploration_score)}</strong><span>signal</span></div>
              </div>
              <h3>{analysis.signal_band}</h3>
              <p>{analysis.interpretation}</p>
            </article>

            <article className="coverage-card">
              <p className="eyebrow">Evidence coverage</p>
              <strong>{percent(analysis.evidence_coverage)}</strong>
              <div className="coverage-track"><i style={{ width: percent(analysis.evidence_coverage) }} /></div>
              <p>
                {analysis.direct_elements.length} direct · {analysis.projected_elements.length} projected element
                {analysis.projected_elements.length === 1 ? '' : 's'}
              </p>
              {analysis.projected_elements.length ? (
                <div className="projection-list">
                  {analysis.projected_elements.map((item) => (
                    <span key={item.symbol}>{item.symbol} via {item.based_on.join(', ')}</span>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="descriptor-card">
              <p className="eyebrow">Composition descriptors</p>
              <dl>
                <div><dt>Weighted atomic no.</dt><dd>{analysis.descriptors.weighted_atomic_number.toFixed(2)}</dd></div>
                <div><dt>Molar mass index</dt><dd>{analysis.descriptors.weighted_atomic_mass.toFixed(2)}</dd></div>
                <div><dt>Element families</dt><dd>{analysis.descriptors.category_count}</dd></div>
                <div><dt>Normalized total</dt><dd>1.000</dd></div>
              </dl>
            </article>
          </div>

          <div className="limits-note">
            <span>Read before use</span>
            <p>{analysis.limitations.join(' ')}</p>
          </div>

          <form className="publish-panel" onSubmit={publish}>
            <div>
              <p className="eyebrow">Optional / public field</p>
              <h3>Publish this analysis to discoveries.</h3>
              <p>Your result can be ranked with other MONA explorations. Publishing is optional.</p>
            </div>
            <label>
              <span>Study title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength="80" placeholder="Name this elemental study" />
            </label>
            <label>
              <span>Researcher</span>
              <input value={submittedBy} onChange={(event) => setSubmittedBy(event.target.value)} maxLength="80" placeholder="Anonymous" />
            </label>
            <button className="button button--ghost" type="submit" disabled={publishState === 'loading'}>
              {publishState === 'loading' ? 'Publishing…' : published ? `Published · rank #${published.rank || '—'}` : 'Publish finding'}
              <span>→</span>
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  )
}
