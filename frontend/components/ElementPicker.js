import { useEffect, useState } from 'react'

export default function ElementPicker({ onAdd }) {
  const [elements, setElements] = useState([])
  const [selected, setSelected] = useState('')
  const [amount, setAmount] = useState('1')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/elements')
        const json = await res.json()
        if (mounted) {
          setElements(json || [])
          setSelected((json && json[0]) || '')
        }
      } catch (e) {
        console.error('Failed to load elements', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  const filtered = elements.filter(e => !q || e.toLowerCase().includes(q.toLowerCase())).slice(0, 200)

  function handleAdd(e) {
    e.preventDefault()
    if (!selected) return
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) return
    onAdd(selected, amt)
    setAmount('1')
  }

  if (loading) return <div className="p-2">Loading elements...</div>

  return (
    <form onSubmit={handleAdd} className="space-y-2">
      <div className="flex gap-2">
        <input className="input" placeholder="Search symbol" value={q} onChange={(e)=>setQ(e.target.value)} />
        <select className="input" value={selected} onChange={(e)=>setSelected(e.target.value)}>
          {filtered.map(sym => (
            <option key={sym} value={sym}>{sym}</option>
          ))}
        </select>
        <input className="input" style={{width:110}} value={amount} onChange={(e)=>setAmount(e.target.value)} />
        <button className="mona-btn mona-btn--accent" type="submit">Add</button>
      </div>
      <div className="text-xs text-gray-500">Search elements by symbol (e.g., H, Fe, Au). Add amount as relative units.</div>
    </form>
  )
}
