import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-mona-ink p-8">
      <div className="main-container">
        <header className="site-header mb-8">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="/logo.svg" alt="MONA logo" className="logo" />
            <div className="brand-title">MONA</div>
          </div>
          <nav className="space-x-4">
            <Link href="/submit"><a className="mona-btn">Submit</a></Link>
            <Link href="/leaderboard"><a className="mona-btn mona-btn--accent">Leaderboard</a></Link>
            <a href="/api/auth/login" className="mona-btn">Sign in</a>
          </nav>
        </header>

        <section className="hero mona-card p-8 mb-8">
          <div className="flex items-start gap-6">
            <div style={{flex:1}}>
              <h2 className="text-3xl font-semibold mb-3">A heavenly, futuristic interface for collaborative findings</h2>
              <div className="accent-line mb-4" />
              <p className="text-gray-600">Share elemental chemistry findings and contribute to a curated leaderboard. Serene, minimalist aesthetic with dashed outlines and calm blue/orange accents.</p>
            </div>
            <div style={{width:260}}>
              <div className="mona-card p-4">Top insights and highlights will appear here.</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mona-card p-6">Explore elements, submit compositions, and view top-scoring findings.</div>
          <div className="mona-card p-6">Designed with a white, dashed-outline aesthetic and calm blue/orange accents.</div>
        </section>
      </div>
    </main>
  )
}
