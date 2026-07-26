import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-mona-blue p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-semibold">MONA — Model Of Natural Ascension</h1>
          <nav className="space-x-4">
            <Link href="/submit"><a className="mona-btn">Submit</a></Link>
            <Link href="/leaderboard"><a className="mona-btn mona-btn--accent">Leaderboard</a></Link>
            <a href="/api/auth/login" className="mona-btn">Sign in</a>
          </nav>
        </header>

        <section className="mona-card p-8 mb-8">
          <h2 className="text-2xl font-medium mb-4">A heavenly, futuristic interface for collaborative findings</h2>
          <p className="text-gray-700">Share elemental chemistry findings and contribute to a curated leaderboard. This frontend is a scaffold — connect Auth0 and Supabase to make it live.</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mona-card p-6">Explore elements, submit compositions, and view top-scoring findings.</div>
          <div className="mona-card p-6">Designed with a white, dashed-outline aesthetic and calm blue/orange accents.</div>
        </section>
      </div>
    </main>
  )
}
