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
          {data.map(item => (
            <li key={item.id} className="mona-card p-4 flex justify-between">
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-gray-600">by {item.user_display || 'anonymous'}</div>
              </div>
              <div className="text-xl font-bold">{item.computed_score ?? item.score}</div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}
