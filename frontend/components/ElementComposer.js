import { useMemo, useState } from 'react'

const periodicElements = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1 },
  { symbol: 'He', name: 'Helium', atomicNumber: 2 },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3 },
  { symbol: 'Be', name: 'Beryllium', atomicNumber: 4 },
  { symbol: 'B', name: 'Boron', atomicNumber: 5 },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6 },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7 },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8 },
  { symbol: 'F', name: 'Fluorine', atomicNumber: 9 },
  { symbol: 'Ne', name: 'Neon', atomicNumber: 10 },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11 },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12 },
  { symbol: 'Al', name: 'Aluminum', atomicNumber: 13 },
  { symbol: 'Si', name: 'Silicon', atomicNumber: 14 },
  { symbol: 'P', name: 'Phosphorus', atomicNumber: 15 },
  { symbol: 'S', name: 'Sulfur', atomicNumber: 16 },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17 },
  { symbol: 'K', name: 'Potassium', atomicNumber: 19 },
  { symbol: 'Ca', name: 'Calcium', atomicNumber: 20 },
  { symbol: 'Sc', name: 'Scandium', atomicNumber: 21 },
  { symbol: 'Ti', name: 'Titanium', atomicNumber: 22 },
  { symbol: 'V', name: 'Vanadium', atomicNumber: 23 },
  { symbol: 'Cr', name: 'Chromium', atomicNumber: 24 },
  { symbol: 'Mn', name: 'Manganese', atomicNumber: 25 },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26 },
  { symbol: 'Co', name: 'Cobalt', atomicNumber: 27 },
  { symbol: 'Ni', name: 'Nickel', atomicNumber: 28 },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29 },
  { symbol: 'Zn', name: 'Zinc', atomicNumber: 30 },
  { symbol: 'Ga', name: 'Gallium', atomicNumber: 31 },
  { symbol: 'Ge', name: 'Germanium', atomicNumber: 32 },
  { symbol: 'As', name: 'Arsenic', atomicNumber: 33 },
  { symbol: 'Se', name: 'Selenium', atomicNumber: 34 },
  { symbol: 'Br', name: 'Bromine', atomicNumber: 35 },
  { symbol: 'Kr', name: 'Krypton', atomicNumber: 36 },
  { symbol: 'Rb', name: 'Rubidium', atomicNumber: 37 },
  { symbol: 'Sr', name: 'Strontium', atomicNumber: 38 },
  { symbol: 'Y', name: 'Yttrium', atomicNumber: 39 },
  { symbol: 'Zr', name: 'Zirconium', atomicNumber: 40 },
  { symbol: 'Nb', name: 'Niobium', atomicNumber: 41 },
  { symbol: 'Mo', name: 'Molybdenum', atomicNumber: 42 },
  { symbol: 'Ru', name: 'Ruthenium', atomicNumber: 44 },
  { symbol: 'Rh', name: 'Rhodium', atomicNumber: 45 },
  { symbol: 'Pd', name: 'Palladium', atomicNumber: 46 },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47 },
  { symbol: 'Cd', name: 'Cadmium', atomicNumber: 48 },
  { symbol: 'In', name: 'Indium', atomicNumber: 49 },
  { symbol: 'Sn', name: 'Tin', atomicNumber: 50 },
  { symbol: 'Sb', name: 'Antimony', atomicNumber: 51 },
  { symbol: 'Te', name: 'Tellurium', atomicNumber: 52 },
  { symbol: 'I', name: 'Iodine', atomicNumber: 53 },
  { symbol: 'Xe', name: 'Xenon', atomicNumber: 54 },
  { symbol: 'Cs', name: 'Cesium', atomicNumber: 55 },
  { symbol: 'Ba', name: 'Barium', atomicNumber: 56 },
  { symbol: 'La', name: 'Lanthanum', atomicNumber: 57 },
  { symbol: 'Ce', name: 'Cerium', atomicNumber: 58 },
  { symbol: 'Pr', name: 'Praseodymium', atomicNumber: 59 },
  { symbol: 'Nd', name: 'Neodymium', atomicNumber: 60 },
  { symbol: 'Pm', name: 'Promethium', atomicNumber: 61 },
  { symbol: 'Sm', name: 'Samarium', atomicNumber: 62 },
  { symbol: 'Eu', name: 'Europium', atomicNumber: 63 },
  { symbol: 'Gd', name: 'Gadolinium', atomicNumber: 64 },
  { symbol: 'Tb', name: 'Terbium', atomicNumber: 65 },
  { symbol: 'Dy', name: 'Dysprosium', atomicNumber: 66 },
  { symbol: 'Ho', name: 'Holmium', atomicNumber: 67 },
  { symbol: 'Er', name: 'Erbium', atomicNumber: 68 },
  { symbol: 'Tm', name: 'Thulium', atomicNumber: 69 },
  { symbol: 'Yb', name: 'Ytterbium', atomicNumber: 70 },
  { symbol: 'Lu', name: 'Lutetium', atomicNumber: 71 },
  { symbol: 'Hf', name: 'Hafnium', atomicNumber: 72 },
  { symbol: 'Ta', name: 'Tantalum', atomicNumber: 73 },
  { symbol: 'W', name: 'Tungsten', atomicNumber: 74 },
  { symbol: 'Re', name: 'Rhenium', atomicNumber: 75 },
  { symbol: 'Os', name: 'Osmium', atomicNumber: 76 },
  { symbol: 'Ir', name: 'Iridium', atomicNumber: 77 },
  { symbol: 'Pt', name: 'Platinum', atomicNumber: 78 },
  { symbol: 'Au', name: 'Gold', atomicNumber: 79 },
  { symbol: 'Hg', name: 'Mercury', atomicNumber: 80 },
  { symbol: 'Tl', name: 'Thallium', atomicNumber: 81 },
  { symbol: 'Pb', name: 'Lead', atomicNumber: 82 },
  { symbol: 'Bi', name: 'Bismuth', atomicNumber: 83 },
  { symbol: 'Po', name: 'Polonium', atomicNumber: 84 },
  { symbol: 'At', name: 'Astatine', atomicNumber: 85 },
  { symbol: 'Rn', name: 'Radon', atomicNumber: 86 },
  { symbol: 'Fr', name: 'Francium', atomicNumber: 87 },
  { symbol: 'Ra', name: 'Radium', atomicNumber: 88 },
  { symbol: 'Ac', name: 'Actinium', atomicNumber: 89 },
  { symbol: 'Th', name: 'Thorium', atomicNumber: 90 },
  { symbol: 'Pa', name: 'Protactinium', atomicNumber: 91 },
  { symbol: 'U', name: 'Uranium', atomicNumber: 92 },
  { symbol: 'Np', name: 'Neptunium', atomicNumber: 93 },
  { symbol: 'Pu', name: 'Plutonium', atomicNumber: 94 },
  { symbol: 'Am', name: 'Americium', atomicNumber: 95 },
  { symbol: 'Cm', name: 'Curium', atomicNumber: 96 },
  { symbol: 'Bk', name: 'Berkelium', atomicNumber: 97 },
  { symbol: 'Cf', name: 'Californium', atomicNumber: 98 },
  { symbol: 'Es', name: 'Einsteinium', atomicNumber: 99 },
  { symbol: 'Fm', name: 'Fermium', atomicNumber: 100 },
  { symbol: 'Md', name: 'Mendelevium', atomicNumber: 101 },
  { symbol: 'No', name: 'Nobelium', atomicNumber: 102 },
  { symbol: 'Lr', name: 'Lawrencium', atomicNumber: 103 },
  { symbol: 'Rf', name: 'Rutherfordium', atomicNumber: 104 },
  { symbol: 'Db', name: 'Dubnium', atomicNumber: 105 },
  { symbol: 'Sg', name: 'Seaborgium', atomicNumber: 106 },
  { symbol: 'Bh', name: 'Bohrium', atomicNumber: 107 },
  { symbol: 'Hs', name: 'Hassium', atomicNumber: 108 },
  { symbol: 'Mt', name: 'Meitnerium', atomicNumber: 109 },
  { symbol: 'Ds', name: 'Darmstadtium', atomicNumber: 110 },
  { symbol: 'Rg', name: 'Roentgenium', atomicNumber: 111 },
  { symbol: 'Cn', name: 'Copernicium', atomicNumber: 112 },
  { symbol: 'Nh', name: 'Nihonium', atomicNumber: 113 },
  { symbol: 'Fl', name: 'Flerovium', atomicNumber: 114 },
  { symbol: 'Mc', name: 'Moscovium', atomicNumber: 115 },
  { symbol: 'Lv', name: 'Livermorium', atomicNumber: 116 },
  { symbol: 'Ts', name: 'Tennessine', atomicNumber: 117 },
  { symbol: 'Og', name: 'Oganesson', atomicNumber: 118 }
]

const presets = [
  { name: 'Balanced', elements: { H: 0.45, O: 0.3, C: 0.25 } },
  { name: 'Halogen-rich', elements: { Cl: 0.35, Br: 0.25, I: 0.2 } },
  { name: 'Metallic', elements: { Fe: 0.25, Cu: 0.2, Zn: 0.15, Co: 0.1 } },
  { name: 'Rare-earth', elements: { Gd: 0.2, La: 0.15, Y: 0.1, Ce: 0.1 } }
]

function formatAmount(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

export default function ElementComposer({ value, onChange }) {
  const [query, setQuery] = useState('')
  const entries = Object.entries(value || {}).filter(([, amount]) => Number(amount) > 0)
  const selectedSymbols = new Set(entries.map(([symbol]) => symbol))

  const filteredElements = useMemo(() => {
    const lower = query.trim().toLowerCase()
    return periodicElements.filter((element) => {
      if (!lower) return true
      return element.symbol.toLowerCase().includes(lower) || element.name.toLowerCase().includes(lower)
    })
  }, [query])

  function setAmount(symbol, amount) {
    const nextValue = { ...(value || {}) }
    if (amount <= 0) {
      delete nextValue[symbol]
    } else {
      nextValue[symbol] = Number(amount)
    }
    onChange(nextValue)
  }

  function toggleElement(symbol) {
    const nextValue = { ...(value || {}) }
    if (nextValue[symbol]) {
      delete nextValue[symbol]
    } else {
      nextValue[symbol] = 0.2
    }
    onChange(nextValue)
  }

  function applyPreset(preset) {
    onChange({ ...preset.elements })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="mona-chip"
            onClick={() => applyPreset(preset)}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div>
        <label className="mona-label" htmlFor="element-search">Search the lattice</label>
        <input
          id="element-search"
          className="mona-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search H, Iron, Gold..."
        />
      </div>

      <div className="mona-element-grid">
        {filteredElements.map((element) => {
          const isSelected = selectedSymbols.has(element.symbol)
          return (
            <button
              key={element.symbol}
              type="button"
              className={`mona-element-tile ${isSelected ? 'is-selected' : ''}`}
              onClick={() => toggleElement(element.symbol)}
            >
              <span className="mona-element-symbol">{element.symbol}</span>
              <span className="mona-element-name">{element.name}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mona-blue/35 bg-white/70 p-4 text-sm text-slate-700">
            Select elements to build a composition vector and preview the chemistry profile.
          </div>
        ) : (
          entries
            .sort((a, b) => b[1] - a[1])
            .map(([symbol, amount]) => (
              <div key={symbol} className="flex flex-col gap-3 rounded-2xl border border-dashed border-mona-blue/35 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-mona-blue">{symbol}</p>
                  <p className="text-sm text-slate-600">Weight {formatAmount(amount)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={amount}
                    onChange={(event) => setAmount(symbol, Number(event.target.value))}
                    className="w-36 accent-[#ff7a2d]"
                  />
                  <input
                    type="number"
                    min="0.05"
                    max="1"
                    step="0.05"
                    value={amount}
                    onChange={(event) => setAmount(symbol, Number(event.target.value))}
                    className="mona-input w-20"
                  />
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
