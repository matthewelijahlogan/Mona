import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import logo from '../public/logo.svg'

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/submit', label: 'Submit finding' },
  { href: '/leaderboard', label: 'Leaderboard' }
]

export default function AppShell({ title, subtitle, children }) {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,111,255,0.08),_transparent_38%),linear-gradient(135deg,_#ffffff_0%,_#f7faff_100%)] p-6 text-mona-blue md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="mona-card flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-mona-blue/70 bg-white/80 p-2 shadow-sm">
              <Image src={logo} alt="MONA logo" width={48} height={48} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-mona-orange">MONA / research console</p>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <a className={`mona-btn ${isActive ? 'mona-btn--accent' : ''}`}>{item.label}</a>
                </Link>
              )
            })}
            <a href="/api/auth/login" className="mona-btn">Sign in</a>
          </nav>
        </header>

        {children}
      </div>
    </main>
  )
}
