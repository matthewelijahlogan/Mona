import { useState } from 'react'

export default function Submit() {
  const [title, setTitle] = useState('')
  const [composition, setComposition] = useState('')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    const payload = { title, composition }
    const res = await fetch('/api/findings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if (res.ok) setStatus('submitted')
    else setStatus('error')
  }

  return (
    <main className="min-h-screen bg-white p-8 text-mona-blue">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl mb-6">Submit a Finding</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input className="w-full p-2 border rounded" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Composition (JSON list of element ids and proportions)</label>
            <textarea className="w-full p-2 border rounded" rows={6} value={composition} onChange={(e)=>setComposition(e.target.value)} />
          </div>
          <button className="mona-btn mona-btn--accent" type="submit">Post Finding</button>
        </form>
        {status && <p className="mt-4">Status: {status}</p>}
      </div>
    </main>
  )
}
