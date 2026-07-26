import { useState } from 'react'
import ElementPicker from '../components/ElementPicker'

export default function Submit() {
  const [title, setTitle] = useState('')
  const [composition, setComposition] = useState({})
  const [status, setStatus] = useState(null)

  function handleAddElement(symbol, amount) {
    setComposition(prev => {
      const next = { ...prev }
      next[symbol] = (parseFloat(next[symbol] || 0) + parseFloat(amount))
      return next
    })
  }

  function handleRemove(symbol) {
    setComposition(prev => {
      const next = { ...prev }
      delete next[symbol]
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    const payload = { title, composition }
    try {
      const res = await fetch('/api/findings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if (res.ok) setStatus('submitted')
      else {
        const txt = await res.text()
        setStatus('error: ' + (txt || res.status))
      }
    } catch (err) {
      setStatus('error: ' + err.message)
    }
  }

  return (
    <main className="min-h-screen bg-white p-8 text-mona-ink">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl mb-6">Submit a Finding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Descriptive title" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Build composition</label>
            <ElementPicker onAdd={handleAddElement} />
            <div className="mt-4">
              <div className="mona-card p-4">
                <h3 className="font-semibold mb-2">Composition</h3>
                <ul className="space-y-2">
                  {Object.keys(composition).length === 0 && <li className="text-sm text-gray-500">No elements added yet.</li>}
                  {Object.entries(composition).map(([sym, amt]) => (
                    <li key={sym} className="flex items-center justify-between">
                      <div><span className="font-medium">{sym}</span> — {amt}</div>
                      <div>
                        <button type="button" className="mona-btn" onClick={()=>handleRemove(sym)}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <button className="mona-btn mona-btn--accent" type="submit">Post Finding</button>
          </div>
        </form>

        {status && <p className="mt-4">Status: {status}</p>}
      </div>
    </main>
  )
}
