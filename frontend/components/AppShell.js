import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import FlowField from './FlowField'

const NAV_ITEMS = [
  { href: '/', label: 'Overview', index: '01' },
  { href: '/submit', label: 'Element lab', index: '02' },
  { href: '/leaderboard', label: 'Discoveries', index: '03' },
]

export default function AppShell({ children, compactHeader = false }) {
  const router = useRouter()

  return (
    <div className="site-shell">
      <div className="top-line">
        <span>MONA / computational oncology</span>
        <span className="top-line-center">Model of Natural Ascension</span>
        <a href="https://mona-cancer-api.onrender.com/status" target="_blank" rel="noreferrer">
          API field <i className="status-pulse" />
        </a>
      </div>

      <header className={`site-header ${compactHeader ? 'site-header--compact' : ''}`}>
        <Link href="/">
          <a className="brand" aria-label="MONA home">
            <Image
              src="/mona-logo-transparent.png"
              alt="MONA — AI for Cancer Solutions"
              width={148}
              height={148}
              priority
              className="brand-image"
            />
          </a>
        </Link>

        <nav className="primary-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = router.pathname === item.href
            return (
              <Link href={item.href} key={item.href}>
                <a className={active ? 'is-active' : ''}>
                  <small>{item.index}</small>
                  <span>{item.label}</span>
                </a>
              </Link>
            )
          })}
        </nav>

        <Link href="/submit">
          <a className="header-cta">
            Start analysis
            <span aria-hidden="true">↗</span>
          </a>
        </Link>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <FlowField compact />
        <div className="footer-content">
          <div>
            <Image src="/mona-logo-transparent.png" alt="" width={92} height={92} />
            <p>Expanding the search space for elemental cancer research.</p>
          </div>
          <div className="footer-meta">
            <span>Research-use computational projections</span>
            <span>Not medical guidance</span>
            <span>© {new Date().getFullYear()} Touch of DaVinci Studios</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
