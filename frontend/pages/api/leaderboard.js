export default async function handler(req, res) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.MONA_API_URL || 'https://mona-cancer-api.onrender.com'
  try {
    const r = await fetch(`${API_URL}/leaderboard`)
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' })
    const json = await r.json()
    return res.status(200).json(json)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
