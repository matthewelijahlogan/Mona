import { ELEMENTS } from '../data/elements'
import PeriodicTable from './PeriodicTable'

const ELEMENT_MAP = Object.fromEntries(ELEMENTS.map((element) => [element.symbol, element]))

function formatAmount(amount) {
  return Number(amount).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

export default function ElementComposer({ value, onChange }) {
  const entries = Object.entries(value || {})
    .filter(([, amount]) => Number(amount) > 0)
    .sort((a, b) => ELEMENT_MAP[a[0]].number - ELEMENT_MAP[b[0]].number)
  const total = entries.reduce((sum, [, amount]) => sum + Number(amount), 0)

  function setAmount(symbol, rawAmount) {
    const amount = Number(rawAmount)
    const next = { ...(value || {}) }
    if (!Number.isFinite(amount) || amount <= 0) delete next[symbol]
    else next[symbol] = Math.min(amount, 9999)
    onChange(next)
  }

  return (
    <div className="composer">
      <PeriodicTable value={value} onChange={onChange} />

      <div className="composition-dock">
        <div className="dock-heading">
          <div>
            <p className="eyebrow">Composition vector</p>
            <h3>{entries.length ? `${entries.length} active element${entries.length === 1 ? '' : 's'}` : 'Awaiting a selection'}</h3>
          </div>
          {entries.length ? (
            <button className="text-button" type="button" onClick={() => onChange({})}>
              Clear all
            </button>
          ) : null}
        </div>

        {entries.length ? (
          <div className="composition-list">
            {entries.map(([symbol, amount]) => {
              const element = ELEMENT_MAP[symbol]
              const percentage = total ? (Number(amount) / total) * 100 : 0
              return (
                <div className="composition-row" key={symbol}>
                  <button className={`mini-element element-${element.category}`} type="button" onClick={() => setAmount(symbol, 0)} aria-label={`Remove ${element.name}`}>
                    <small>{element.number}</small>
                    <strong>{symbol}</strong>
                  </button>
                  <div className="composition-identity">
                    <strong>{element.name}</strong>
                    <span>{percentage.toFixed(1)}% normalized</span>
                  </div>
                  <input
                    aria-label={`${element.name} amount`}
                    type="range"
                    min="0.05"
                    max="10"
                    step="0.05"
                    value={amount}
                    onChange={(event) => setAmount(symbol, event.target.value)}
                  />
                  <label className="amount-field">
                    <span className="sr-only">{element.name} relative amount</span>
                    <input
                      type="number"
                      min="0.01"
                      max="9999"
                      step="0.05"
                      value={amount}
                      onChange={(event) => setAmount(symbol, event.target.value)}
                    />
                    <small>parts</small>
                  </label>
                  <span className="amount-readout">{formatAmount(amount)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="empty-state">Choose one or more elements above. MONA normalizes the relative amounts before analysis.</p>
        )}
      </div>
    </div>
  )
}
