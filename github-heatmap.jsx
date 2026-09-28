// GitHub contribution heatmap for Übersicht, with switchable themes.
// Uses the logged-in `gh` CLI, so no token is stored in this file.
// (No <> fragments: Übersicht's JSX has no React.Fragment.)
// Run `gh auth status` in a terminal if it ever shows an error.

export const command = `/opt/homebrew/bin/gh api graphql -f query='{ viewer { login contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }'`

export const refreshFrequency = 1000 * 60 * 30 // every 30 minutes

// The widget positions itself (drag it anywhere; double-click to reset), so
// this container just covers the origin.
export const className = `
  left: 0;
  top: 0;
  font-family: ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
`

// Each theme: five cell colors (none → most), panel, text, and an emoji.
const THEMES = {
  violet: {
    icon: '✨', label: 'Sparkle',
    levels: ['rgba(255,255,255,0.10)', '#c4b5fd', '#a78bfa', '#8b5cf6', '#6d28d9'],
    panel: 'rgba(20,16,32,0.55)', text: '#ffffff',
  },
  halloween: {
    icon: '🎃', label: 'Halloween',
    levels: ['rgba(255,255,255,0.09)', '#5b3a8c', '#8e44ad', '#f97316', '#ffb703'],
    panel: 'rgba(14,8,20,0.72)', text: '#ffb347',
  },
  winter: {
    icon: '❄️', label: 'Winter',
    levels: ['rgba(255,255,255,0.12)', '#bfe3f7', '#7cc4ec', '#3b93d6', '#1d5fae'],
    panel: 'rgba(12,28,52,0.62)', text: '#e6f4ff',
  },
  fall: {
    icon: '🍂', label: 'Fall',
    levels: ['rgba(255,240,220,0.11)', '#e9c46a', '#e09f3e', '#c1622b', '#8f2d12'],
    panel: 'rgba(38,22,12,0.66)', text: '#f6e3c5',
  },
  christmas: {
    icon: '🎄', label: 'Christmas',
    levels: ['rgba(255,255,255,0.10)', '#8fd19e', '#3fa860', '#1f7a3f', '#d62839'],
    panel: 'rgba(10,32,20,0.66)', text: '#f4fff6',
  },
}
const ORDER = ['violet', 'halloween', 'winter', 'fall', 'christmas']
const LEVEL_INDEX = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

// ------------------------------------------------------------- animations
// Each theme gets its own little weather. Positions come from a seeded hash,
// not Math.random, so particles don't jump every time the widget re-renders
// (which happens on every drag frame).
const rnd = (i, seed) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const KEYFRAMES = `
  @keyframes gh-fall {
    0%   { transform: translate(0, -20px) rotate(0deg); opacity: 0; }
    10%  { opacity: var(--o); }
    90%  { opacity: var(--o); }
    100% { transform: translate(var(--drift), 190px) rotate(var(--spin)); opacity: 0; }
  }
  @keyframes gh-sway {
    0%, 100% { margin-left: -4px; }
    50%      { margin-left: 4px; }
  }
  @keyframes gh-twinkle {
    0%, 100% { opacity: 0.15; transform: scale(0.6); }
    50%      { opacity: 1;    transform: scale(1); }
  }
  @keyframes gh-fly {
    0%   { transform: translate(-40px, 0) scaleX(-1); }
    25%  { transform: translate(calc(var(--w) * 0.25), -10px) scaleX(-1); }
    50%  { transform: translate(calc(var(--w) * 0.5), 6px) scaleX(-1); }
    75%  { transform: translate(calc(var(--w) * 0.75), -8px) scaleX(-1); }
    100% { transform: translate(calc(var(--w) + 40px), 0) scaleX(-1); }
  }
  @keyframes gh-flap {
    0%, 100% { transform: scaleY(1); }
    50%      { transform: scaleY(0.55); }
  }
  @keyframes gh-bob {
    0%, 100% { transform: translateY(0) rotate(-6deg); }
    50%      { transform: translateY(-7px) rotate(6deg); }
  }
  @keyframes gh-blink {
    0%, 100% { opacity: 1;   box-shadow: 0 0 6px 1px currentColor; }
    50%      { opacity: 0.3; box-shadow: none; }
  }
  @keyframes gh-pulse {
    0%, 100% { box-shadow: 0 0 0 0 var(--c); }
    50%      { box-shadow: 0 0 0 3px transparent, 0 0 8px 1px var(--c); }
  }
  @keyframes gh-pop {
    0%   { transform: scale(0.7); }
    60%  { transform: scale(1.25); }
    100% { transform: scale(1.1); }
  }
  .gh-btn { transition: transform 0.15s ease, background 0.2s, border-color 0.2s; }
  .gh-btn:hover { transform: scale(1.18) rotate(-6deg); }
  @media (prefers-reduced-motion: reduce) {
    .gh-fx * { animation: none !important; opacity: 0.35 !important; }
  }
`

const abs = (extra) => ({ position: 'absolute', pointerEvents: 'none', ...extra })

// Things that drift down from the top: snow, leaves.
const falling = (n, seed, glyphs, opts) =>
  Array.from({ length: n }, (_, i) => {
    const size = opts.min + rnd(i, seed + 1) * (opts.max - opts.min)
    return (
      <div key={`${seed}-${i}`} style={abs({ left: `${rnd(i, seed) * 100}%`, top: 0, animation: `gh-sway ${2.5 + rnd(i, seed + 5) * 2}s ease-in-out infinite` })}>
        <div
          style={{
            fontSize: size,
            lineHeight: 1,
            color: opts.color,
            '--o': opts.opacity,
            '--drift': `${(rnd(i, seed + 2) - 0.5) * opts.drift}px`,
            '--spin': `${(rnd(i, seed + 3) - 0.5) * opts.spin}deg`,
            opacity: 0,
            animation: `gh-fall ${opts.speed + rnd(i, seed + 4) * opts.speed}s linear ${-rnd(i, seed + 6) * opts.speed * 2}s infinite`,
            filter: opts.blur && size < opts.min + 2 ? 'blur(0.4px)' : 'none',
          }}
        >
          {glyphs[i % glyphs.length]}
        </div>
      </div>
    )
  })

const twinkles = (n, seed, glyph, color, size) =>
  Array.from({ length: n }, (_, i) => (
    <div
      key={`t${seed}-${i}`}
      style={abs({
        left: `${4 + rnd(i, seed) * 92}%`,
        top: `${6 + rnd(i, seed + 1) * 88}%`,
        fontSize: size * (0.6 + rnd(i, seed + 2) * 0.7),
        color,
        lineHeight: 1,
        animation: `gh-twinkle ${1.8 + rnd(i, seed + 3) * 2.2}s ease-in-out ${-rnd(i, seed + 4) * 4}s infinite`,
      })}
    >
      {glyph}
    </div>
  ))

const FX = {
  violet: () => twinkles(14, 1, '✦', '#e9d5ff', 9),

  winter: () =>
    falling(22, 2, ['❄', '•', '•', '❅', '•'], {
      min: 6, max: 12, color: '#ffffff', opacity: 0.85, speed: 5, drift: 40, spin: 180, blur: true,
    }),

  fall: () =>
    falling(9, 3, ['🍂', '🍁', '🍂'], { min: 10, max: 15, opacity: 0.9, speed: 6, drift: 70, spin: 540 }),

  halloween: () => [
    ...twinkles(8, 4, '•', '#ffd89b', 5),
    ...[0, 1, 2].map((i) => (
      <div
        key={`bat${i}`}
        style={abs({
          left: 0,
          top: `${10 + i * 26}%`,
          '--w': '760px',
          animation: `gh-fly ${9 + i * 3}s linear ${-i * 4}s infinite`,
        })}
      >
        <div style={{ fontSize: 14 - i * 2, filter: 'drop-shadow(0 0 3px rgba(255,170,60,0.9))', animation: `gh-flap ${0.25 + i * 0.05}s ease-in-out infinite` }}>🦇</div>
      </div>
    )),
    <div key="ghost" style={abs({ right: 22, bottom: 30, fontSize: 14, opacity: 0.85, animation: 'gh-bob 3s ease-in-out infinite' })}>👻</div>,
  ],

  christmas: () => [
    ...falling(12, 5, ['•', '•', '❄'], { min: 5, max: 9, color: '#ffffff', opacity: 0.7, speed: 6, drift: 30, spin: 90 }),
    // A string of fairy lights along the top edge.
    <svg key="wire" width="100%" height="16" style={abs({ left: 0, top: -2 })} preserveAspectRatio="none" viewBox="0 0 100 16">
      <path d="M0 4 Q 6.25 12 12.5 4 T 25 4 T 37.5 4 T 50 4 T 62.5 4 T 75 4 T 87.5 4 T 100 4" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
    </svg>,
    ...Array.from({ length: 16 }, (_, i) => {
      const colors = ['#ff5a6e', '#ffd166', '#7ee081', '#6ec6ff']
      return (
        <div
          key={`bulb${i}`}
          style={abs({
            left: `calc(${(i + 0.5) * 6.25}% - 3px)`,
            top: i % 2 ? 2 : 8,
            width: 6,
            height: 8,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: colors[i % 4],
            color: colors[i % 4],
            animation: `gh-blink ${1.2 + (i % 3) * 0.4}s ease-in-out ${-(i % 4) * 0.3}s infinite`,
          })}
        />
      )
    }),
  ],
}

const CELL = 11
const GAP = 3
const STORE = 'github-heatmap-theme'
const POS_STORE = 'github-heatmap-pos'

const savedTheme = () => {
  try {
    const t = localStorage.getItem(STORE)
    return THEMES[t] ? t : 'violet'
  } catch (e) {
    return 'violet'
  }
}

const savedPos = () => {
  try {
    const p = JSON.parse(localStorage.getItem(POS_STORE))
    return p && typeof p.x === 'number' && typeof p.y === 'number' ? p : null
  } catch (e) {
    return null
  }
}

export const initialState = { theme: savedTheme(), pos: savedPos() }

export const updateState = (event, prev) => {
  if (event.type === 'SET_THEME') {
    try { localStorage.setItem(STORE, event.theme) } catch (e) {}
    return { ...prev, theme: event.theme }
  }
  if (event.type === 'SET_POS') {
    if (event.save) {
      try {
        if (event.pos) localStorage.setItem(POS_STORE, JSON.stringify(event.pos))
        else localStorage.removeItem(POS_STORE)
      } catch (e) {}
    }
    return { ...prev, pos: event.pos }
  }
  if (event.type === 'UB/COMMAND_RAN') {
    return { ...prev, output: event.output, error: event.error }
  }
  return prev
}

// Drag anywhere on the panel except the theme buttons.
const startDrag = (e, dispatch) => {
  if (e.button !== 0 || e.target.closest('button')) return
  const box = e.currentTarget.getBoundingClientRect()
  const dx = e.clientX - box.left
  const dy = e.clientY - box.top
  const at = (ev) => ({
    x: Math.max(0, Math.min(window.innerWidth - box.width, ev.clientX - dx)),
    y: Math.max(0, Math.min(window.innerHeight - box.height, ev.clientY - dy)),
  })
  let last = at(e)
  const move = (ev) => {
    last = at(ev)
    dispatch({ type: 'SET_POS', pos: last })
  }
  const up = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', up)
    dispatch({ type: 'SET_POS', pos: last, save: true })
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', up)
  e.preventDefault()
}

export const render = ({ output, error, theme, pos }, dispatch) => {
  const t = THEMES[theme] || THEMES.violet

  let data = null
  try { data = JSON.parse(output).data.viewer } catch (e) {}

  const cal = data && data.contributionsCollection.contributionCalendar

  const today = cal && cal.weeks[cal.weeks.length - 1].contributionDays.slice(-1)[0].date
  const fx = FX[theme] || FX.violet

  return (
    <div
      onMouseDown={(e) => startDrag(e, dispatch)}
      onDoubleClick={(e) => !e.target.closest('button') && dispatch({ type: 'SET_POS', pos: null, save: true })}
      style={{
        position: 'fixed',
        ...(pos ? { left: pos.x, top: pos.y } : { left: 40, bottom: 40 }),
        cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none',
        overflow: 'hidden',
        padding: theme === 'christmas' ? '22px 18px 16px' : '14px 18px 16px',
        borderRadius: 20,
        color: t.text,
        background: t.panel,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 12px 40px -12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)',
        backdropFilter: 'blur(22px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
        transition: 'background 0.4s, color 0.4s, padding 0.3s',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* key={theme} restarts the animation cleanly on every theme switch */}
      <div key={theme} className="gh-fx" style={abs({ inset: 0, zIndex: 0 })}>
        {fx()}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, letterSpacing: 0.1, whiteSpace: 'nowrap' }}>
            {cal ? (
              <span>
                <strong style={{ fontSize: 15, fontWeight: 700 }}>{cal.totalContributions}</strong>
                <span style={{ opacity: 0.75 }}> contributions in the last year · </span>
                <span style={{ opacity: 0.95, fontWeight: 600 }}>@{data.login}</span>
              </span>
            ) : (
              <span style={{ opacity: 0.7 }}>
                {output === undefined ? 'loading…' : `GitHub heatmap: ${String(error || output || 'no data').slice(0, 120)}`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 999, background: 'rgba(0,0,0,0.18)' }}>
            {ORDER.map((key) => {
              const on = key === theme
              return (
                <button
                  key={key}
                  className="gh-btn"
                  title={THEMES[key].label}
                  onClick={() => dispatch({ type: 'SET_THEME', theme: key })}
                  style={{
                    cursor: 'pointer',
                    width: 24,
                    height: 24,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    lineHeight: 1,
                    borderRadius: 999,
                    background: on ? 'rgba(255,255,255,0.24)' : 'transparent',
                    border: `1px solid ${on ? 'rgba(255,255,255,0.45)' : 'transparent'}`,
                    opacity: on ? 1 : 0.6,
                    animation: on ? 'gh-pop 0.35s ease-out both' : 'none',
                  }}
                >
                  {THEMES[key].icon}
                </button>
              )
            })}
          </div>
        </div>

        {cal && (
          <div style={{ display: 'flex', gap: GAP }}>
            {cal.weeks.map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {w.contributionDays.map((d) => {
                  const color = t.levels[LEVEL_INDEX[d.contributionLevel]]
                  return (
                    <div
                      key={d.date}
                      title={`${d.contributionCount} on ${d.date}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 3,
                        background: color,
                        transition: 'background 0.4s',
                        ...(d.date === today ? { '--c': t.levels[4], animation: 'gh-pulse 2.4s ease-in-out infinite', outline: `1px solid ${t.levels[4]}`, outlineOffset: 1 } : {}),
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
