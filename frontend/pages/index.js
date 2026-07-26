import Link from 'next/link'
import AppShell from '../components/AppShell'

export default function Home() {
  return (
    <AppShell
      title="MONA — Model of Natural Ascension"
      subtitle="A celestial research command center for elemental cancer discovery."
    >
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="mona-card p-8">
          <p className="mona-pill">Live workspace</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">
            Build a submission, publish it to the field, and watch the leaderboard evolve.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-slate-700">
            MONA turns elemental chemistry profiles into a collaborative discovery surface. Submit a finding, review its signal strength, and help shape the next generation of cancer-fighting compositions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/submit">
              <a className="mona-btn mona-btn--accent">Launch a submission</a>
            </Link>
            <Link href="/leaderboard">
              <a className="mona-btn">Open leaderboard</a>
            </Link>
          </div>
        </div>

        <div className="mona-card p-8">
          <p className="mona-pill">How the app works</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="text-mona-orange">01</span>
              <span>Document a composition and the cancer profile it targets.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-mona-orange">02</span>
              <span>Submit it to the MONA pipeline for review and ranking.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-mona-orange">03</span>
              <span>Watch ranked findings rise as the field grows.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Research flow</h3>
          <p className="mt-2 text-sm text-slate-700">Step from composition sketch to publication in one clean workspace.</p>
        </div>
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Leaderboard signal</h3>
          <p className="mt-2 text-sm text-slate-700">Promote promising discoveries and compare them against the field.</p>
        </div>
        <div className="mona-card p-6">
          <h3 className="text-lg font-semibold">Future-ready</h3>
          <p className="mt-2 text-sm text-slate-700">Built to expand from known drugs to a full periodic-table operating model.</p>
        </div>
      </section>
    </AppShell>
  )
}
