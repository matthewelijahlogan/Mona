export default function FlowField({ compact = false }) {
  return (
    <svg
      className={`flow-field ${compact ? 'flow-field--compact' : ''}`}
      viewBox="0 0 1200 460"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="blueFlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#075aa6" />
          <stop offset=".5" stopColor="#12a8df" />
          <stop offset="1" stopColor="#075aa6" />
        </linearGradient>
        <linearGradient id="orangeFlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f26722" />
          <stop offset=".55" stopColor="#ff9a42" />
          <stop offset="1" stopColor="#ee541a" />
        </linearGradient>
      </defs>
      <path className="flow-line flow-line--blue" d="M-60 282C145 128 266 382 473 218S793 112 1260 260" />
      <path className="flow-line flow-line--orange" d="M-80 334C154 180 303 424 519 265S889 169 1260 316" />
      <path className="flow-hair flow-hair--blue" d="M-50 242C164 102 286 346 474 187S810 87 1250 231" />
      <path className="flow-hair flow-hair--orange" d="M-40 372C177 229 335 443 548 306S908 218 1240 353" />
      <path className="flow-hair flow-hair--blue two" d="M-30 404C186 298 337 474 585 351S920 277 1240 402" />
    </svg>
  )
}
