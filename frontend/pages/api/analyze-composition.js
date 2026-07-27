export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.MONA_API_URL ||
    'https://mona-cancer-api.onrender.com'

  try {
    const response = await fetch(`${apiUrl}/composition/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const payload = await response.json().catch(() => ({}))
    return res.status(response.status).json(payload)
  } catch (error) {
    console.error(error)
    return res.status(502).json({ error: 'The MONA analysis service is unavailable.' })
  }
}
