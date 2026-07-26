export default async function handler(req, res) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.MONA_API_URL || 'https://mona-cancer-api.onrender.com'
  if (req.method === 'POST') {
    try {
      const payload = {
        recipe_name: req.body.title || req.body.recipe_name || 'untitled',
        submitted_by: req.body.submitted_by || req.body.user || null,
        cancer_type: req.body.cancer_type || null,
        elements: req.body.composition || req.body.elements || {}
      }
      const r = await fetch(`${API_URL}/leaderboard/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await r.json()
      return res.status(r.status).json(json)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Server error' })
    }
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
