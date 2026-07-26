import useSWR from 'swr'

const fetcher = (url) => fetch(url).then(r=>r.json())

export default function Leaderboard(){
  const { data, error } = useSWR('/api/leaderboard', fetcher)
  if (error) return <div className="p-8">Failed to load</div>
  if (!data) return <div className="p-8">Loading...</div>
  return (
    <main className="min-h-screen bg-white p-8 text-mona-blue">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-6">Leaderboard</h1>
        <ol className="space-y-4">
          {(data.entries || []).map(item => (
            <li key={item.id || item.recipe_name} className="mona-card p-4 flex justify-between">
              <div>
                <div className="font-semibold">{item.recipe_name}</div>
                <div className="text-sm text-gray-600">by {item.submitted_by || 'anonymous'}</div>
              </div>
              <div className="text-xl font-bold">{item.prediction ?? item.score ?? '—'}</div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}
