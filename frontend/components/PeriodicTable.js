import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, ELEMENTS } from '../data/elements'

const CATEGORY_ORDER = [
  'alkali-metal',
  'alkaline-earth',
  'transition-metal',
  'post-transition',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble-gas',
  'lanthanide',
  'actinide',
]

export default function PeriodicTable({ value, onChange }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const selected = new Set(Object.keys(value || {}))

  const matches = useMemo(() => {
    if (!normalizedQuery) return null
    return new Set(
      ELEMENTS.filter(
        (element) =>
          element.symbol.toLowerCase().includes(normalizedQuery) ||
          element.name.toLowerCase().includes(normalizedQuery) ||
          CATEGORY_LABELS[element.category].toLowerCase().includes(normalizedQuery),
      ).map((element) => element.symbol),
    )
  }, [normalizedQuery])

  function toggle(symbol) {
    const next = { ...(value || {}) }
    if (next[symbol] !== undefined) delete next[symbol]
    else next[symbol] = 1
    onChange(next)
  }

  return (
    <div className="periodic-composer">
      <div className="table-toolbar">
        <div>
          <p className="eyebrow">Elemental input</p>
          <h2>Select from the complete periodic field.</h2>
        </div>
        <label className="search-field">
          <span className="sr-only">Search elements</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search element or family"
          />
        </label>
      </div>

      <div className="periodic-scroll" tabIndex="0" aria-label="Scrollable periodic table">
        <div className="periodic-table">
          <div className="periodic-axis" style={{ gridRow: 1, gridColumn: '1 / span 12' }}>
            <span>Atomic number</span>
            <i />
            <span>Element symbol</span>
          </div>
          <div className="series-label lanthanide-label">Lanthanides</div>
          <div className="series-label actinide-label">Actinides</div>
          {ELEMENTS.map((element) => {
            const isSelected = selected.has(element.symbol)
            const isMuted = matches && !matches.has(element.symbol)
            return (
              <button
                key={element.symbol}
                type="button"
                className={`element-cell element-${element.category} ${isSelected ? 'is-selected' : ''} ${isMuted ? 'is-muted' : ''}`}
                style={{
                  gridRow: element.row >= 8 ? element.row + 2 : element.row + 1,
                  gridColumn: element.column,
                }}
                onClick={() => toggle(element.symbol)}
                aria-pressed={isSelected}
                title={`${element.number} · ${element.name} · ${CATEGORY_LABELS[element.category]}`}
              >
                <span className="element-number">{element.number}</span>
                <strong>{element.symbol}</strong>
                <span className="element-name">{element.name}</span>
                {isSelected ? <span className="selected-dot" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="category-legend" aria-label="Element category legend">
        {CATEGORY_ORDER.map((category) => (
          <span key={category}>
            <i className={`legend-dot element-${category}`} />
            {CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>
    </div>
  )
}
