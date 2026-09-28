// GitHub contribution heatmap for Übersicht, with switchable themes.
// Uses the logged-in `gh` CLI, so no token is stored in this file.
// (No <> fragments: Übersicht's JSX has no React.Fragment.)
// Run `gh auth status` in a terminal if it ever shows an error.

export const command = `/opt/homebrew/bin/gh api graphql -f query='{ viewer { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount contributionLevel } } } } } }'`

export const refreshFrequency = 1000 * 60 * 30 // every 30 minutes

// The widget positions itself (drag it anywhere; double-click to reset), so
// this container just covers the origin.
export const className = `
  left: 0;
  top: 0;
`

// --------------------------------------------------------------- themes
// levels: cell colors, none → most. accent: today's ring and the active button.
const THEMES = {
  violet: {
    label: 'Sparkle',
    levels: ['rgba(255,255,255,0.07)', '#4c3a86', '#6d4fd1', '#8b6cf0', '#c4b5fd'],
    panel: 'rgba(16,15,22,0.78)', accent: '#a78bfa',
  },
  halloween: {
    label: 'Halloween',
    levels: ['rgba(255,255,255,0.07)', '#4a2a6b', '#7a3fa3', '#e8671c', '#ffa62b'],
    panel: 'rgba(18,12,16,0.80)', accent: '#f97316',
  },
  winter: {
    label: 'Winter',
    levels: ['rgba(255,255,255,0.07)', '#1e4d7a', '#2f78b8', '#5aa9e6', '#bfe3f7'],
    panel: 'rgba(12,17,26,0.78)', accent: '#7cc4ec',
  },
  fall: {
    label: 'Fall',
    levels: ['rgba(255,255,255,0.07)', '#6b2f14', '#a8481c', '#d9822b', '#f2c14e'],
    panel: 'rgba(22,16,12,0.80)', accent: '#e09f3e',
  },
  christmas: {
    label: 'Christmas',
    levels: ['rgba(255,255,255,0.07)', '#1b5e37', '#2e8b4f', '#4cc26f', '#e5484d'],
    panel: 'rgba(12,19,15,0.80)', accent: '#e5484d',
  },
}
const ORDER = ['violet', 'halloween', 'winter', 'fall', 'christmas']
const LEVEL_INDEX = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

// ---------------------------------------------------------------- words
// Dry, deadpan lines developers actually repeat to each other. Left
// unattributed on screen to keep the line quiet; credits are in the comments.
const QUOTES = [
  'Talk is cheap. Show me the code.', // Linus Torvalds
  'Real artists ship.', // Steve Jobs
  'Nothing is more permanent than a temporary fix.',
  'Weeks of coding can save you hours of planning.',
  'Deleted code is debugged code.', // Jeff Sickel
  'If it’s stupid and it works, it isn’t stupid.',
  'First, solve the problem. Then, write the code.', // John Johnson
  'Code never lies. Comments sometimes do.', // Ron Jeffries
  'Simplicity is prerequisite for reliability.', // Edsger Dijkstra
  'It works on my machine.',
  'The best code is no code at all.', // Jeff Atwood
  'Two hard things: cache invalidation, naming, off-by-one errors.', // after Phil Karlton
  'One more commit, then sleep.',
]
const QUOTE_SECONDS = 9

// ------------------------------------------------------------------ grid
const CELL = 10
const GAP = 3
const PAD_X = 16
const STORE = 'github-heatmap-theme'
const POS_STORE = 'github-heatmap-pos'

// ---------------------------------------------------------- pixel sprites
// Everything decorative is drawn on a 1px grid with crispEdges, so it stays
// sharp on the desktop instead of blurring like scaled emoji.
// Legend characters map to colors; '.' is transparent.
const Sprite = ({ rows, colors, scale = 2, style }) => {
  const rects = []
  rows.forEach((row, y) =>
    row.split('').forEach((ch, x) => {
      if (ch !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[ch]} />)
    }),
  )
  return (
    <svg
      width={rows[0].length * scale}
      height={rows.length * scale}
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      style={{ display: 'block', ...style }}
    >
      {rects}
    </svg>
  )
}

const ICONS = {
  violet: {
    rows: ['...a...', '...a...', '..aba..', 'aabbbaa', '..aba..', '...a...', '...a...'],
    colors: { a: '#a78bfa', b: '#ede9fe' },
  },
  halloween: {
    rows: ['...s...', '..s....', '.ooooo.', 'oOoOoOo', 'oOoOoOo', 'oOoOoOo', '.ooooo.'],
    colors: { s: '#4ade80', o: '#f97316', O: '#c2410c' },
  },
  winter: {
    rows: ['a..a..a', '.a.a.a.', '..aba..', 'aabbbaa', '..aba..', '.a.a.a.', 'a..a..a'],
    colors: { a: '#7cc4ec', b: '#e0f2fe' },
  },
  fall: {
    rows: ['...aaaa', '..aaaab', '.aaaaba', '.aaabaa', '.abaaa.', '.baa...', 'b......'],
    colors: { a: '#e8822b', b: '#7c2d12' },
  },
  christmas: {
    rows: ['...y...', '...g...', '..ggg..', '.grgGg.', '..ggg..', '.gGgrg.', 'ggggggg', '...t...'],
    colors: { y: '#ffd166', g: '#2e8b4f', G: '#4cc26f', r: '#e5484d', t: '#8b5a2b' },
  },
}

const BAT_A = ['a.......a', 'aa.a.a.aa', '.aaaaaaa.', '...a.a...', '.........']
const BAT_B = ['.........', '...a.a...', '.aaaaaaa.', 'aa.....aa', 'a.......a']
const GHOST = ['..aaa..', '.aaaaa.', 'aa.a.aa', 'aaaaaaa', 'aaaaaaa', 'a.a.a.a']
const STAR = ['.a.', 'aba', '.a.']
const LEAF = ['.aa', 'aab', 'ab.']

// ------------------------------------------------------------- animation
// Positions come from a seeded hash, not Math.random, so particles don't jump
// every time the widget re-renders (which happens on every drag frame).
// Falls use steps() so particles land on whole pixels as they move.
const rnd = (i, seed) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const quoteKeyframes = () => {
  const slot = 100 / QUOTES.length
  const f = (n) => `${n.toFixed(3)}%`
  return `
  @keyframes gh-quote {
    0%              { opacity: 0; transform: translateY(3px); }
    ${f(slot * 0.08)} { opacity: 1; transform: translateY(0); }
    ${f(slot * 0.92)} { opacity: 1; transform: translateY(0); }
    ${f(slot)}        { opacity: 0; transform: translateY(-3px); }
    100%            { opacity: 0; transform: translateY(-3px); }
  }`
}

const KEYFRAMES = `
  ${quoteKeyframes()}
  @keyframes gh-fall {
    0%   { transform: translate(0, 0); opacity: 0; }
    8%   { opacity: var(--o); }
    85%  { opacity: var(--o); }
    100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
  }
  @keyframes gh-tumble {
    to { transform: rotate(360deg); }
  }
  @keyframes gh-twinkle {
    0%, 100% { opacity: 0; }
    40%, 60% { opacity: 1; }
  }
  @keyframes gh-fly {
    from { transform: translateX(-24px); }
    to   { transform: translateX(var(--w)); }
  }
  @keyframes gh-frame-a { 0%, 49.9% { opacity: 1; } 50%, 100% { opacity: 0; } }
  @keyframes gh-frame-b { 0%, 49.9% { opacity: 0; } 50%, 100% { opacity: 1; } }
  @keyframes gh-bob {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes gh-ring {
    0%, 100% { outline-color: var(--c); }
    50%      { outline-color: transparent; }
  }
  .gh-btn { transition: background 120ms ease, border-color 120ms ease; }
  .gh-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.14) !important; }
  @media (prefers-reduced-motion: reduce) {
    .gh-fx, .gh-fx * { animation: none !important; opacity: 0 !important; }
    .gh-q { animation: none !important; }
    .gh-q:not(:first-child) { display: none; }
    .gh-q:first-child { opacity: 1 !important; }
  }
`

const abs = (extra) => ({ position: 'absolute', pointerEvents: 'none', ...extra })

// Square pixels drifting down: snow, embers, leaves.
const falling = (n, seed, W, H, opts) =>
  Array.from({ length: n }, (_, i) => {
    const size = opts.sizes[Math.floor(rnd(i, seed + 1) * opts.sizes.length)]
    const dur = opts.speed * (0.8 + rnd(i, seed + 4) * 0.6)
    const dy = H + 12
    const color = opts.colors[i % opts.colors.length]
    const body = opts.leaf ? (
      <div style={{ animation: `gh-tumble ${2 + rnd(i, seed + 7) * 2}s steps(8) infinite` }}>
        <Sprite rows={LEAF} colors={{ a: color, b: opts.stem }} scale={size} />
      </div>
    ) : (
      <div style={{ width: size, height: size, background: color }} />
    )
    return (
      <div
        key={`${seed}-${i}`}
        style={abs({
          left: Math.round(rnd(i, seed) * W),
          top: -6,
          opacity: 0,
          '--o': opts.opacity,
          '--dx': `${Math.round((rnd(i, seed + 2) - 0.5) * opts.drift)}px`,
          '--dy': `${dy}px`,
          animation: `gh-fall ${dur}s steps(${dy}) ${-rnd(i, seed + 6) * dur}s infinite`,
        })}
      >
        {body}
      </div>
    )
  })

const twinkles = (n, seed, W, H, colors, scale = 1) =>
  Array.from({ length: n }, (_, i) => (
    <div
      key={`t${seed}-${i}`}
      style={abs({
        left: Math.round(8 + rnd(i, seed) * (W - 16)),
        top: Math.round(44 + rnd(i, seed + 1) * (H - 56)), // below the header row
        opacity: 0,
        animation: `gh-twinkle ${2.4 + rnd(i, seed + 3) * 2.4}s steps(4) ${-rnd(i, seed + 4) * 5}s infinite`,
      })}
    >
      <Sprite rows={STAR} colors={{ a: colors[i % colors.length], b: '#ffffff' }} scale={scale} />
    </div>
  ))

const FX = {
  violet: (W, H) => twinkles(12, 1, W, H, ['#a78bfa', '#c4b5fd'], 2),

  winter: (W, H) =>
    falling(26, 2, W, H, { sizes: [1, 2, 2, 3], colors: ['#ffffff', '#e0f2fe'], opacity: 0.8, speed: 7, drift: 36 }),

  fall: (W, H) =>
    falling(10, 3, W, H, { sizes: [2, 2, 3], colors: ['#e8822b', '#d9582b', '#f2c14e'], stem: '#7c2d12', opacity: 0.95, speed: 8, drift: 80, leaf: true }),

  halloween: (W, H) => [
    ...falling(8, 4, W, H, { sizes: [1, 2], colors: ['#ffa62b', '#f97316'], opacity: 0.55, speed: 9, drift: 20 }),
    ...[0, 1].map((i) => (
      <div
        key={`bat${i}`}
        style={abs({ left: 0, top: 10 + i * 34, '--w': `${W + 24}px`, animation: `gh-fly ${12 + i * 5}s steps(${Math.round((W + 48) / 2)}) ${-i * 6}s infinite` })}
      >
        <div style={{ position: 'relative', width: 18, height: 10 }}>
          <div style={abs({ inset: 0, animation: 'gh-frame-a 0.36s infinite' })}>
            <Sprite rows={BAT_A} colors={{ a: '#1a1016' }} style={{ filter: 'drop-shadow(0 0 2px rgba(255,166,43,0.8))' }} />
          </div>
          <div style={abs({ inset: 0, animation: 'gh-frame-b 0.36s infinite' })}>
            <Sprite rows={BAT_B} colors={{ a: '#1a1016' }} style={{ filter: 'drop-shadow(0 0 2px rgba(255,166,43,0.8))' }} />
          </div>
        </div>
      </div>
    )),
    <div key="ghost" style={abs({ right: 10, bottom: 10, opacity: 0.75, animation: 'gh-bob 3.2s steps(8) infinite' })}>
      <Sprite rows={GHOST} colors={{ a: '#e5e7eb' }} />
    </div>,
  ],

  // Quiet snow with the odd gold glint, rather than a busy light string.
  christmas: (W, H) => [
    ...falling(18, 5, W, H, { sizes: [1, 2, 2], colors: ['#ffffff'], opacity: 0.7, speed: 9, drift: 24 }),
    ...twinkles(5, 6, W, H, ['#ffd166'], 2),
  ],
}

// ----------------------------------------------------------------- state
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

// Drag anywhere on the panel except the theme buttons. Snaps to whole pixels.
const startDrag = (e, dispatch) => {
  if (e.button !== 0 || e.target.closest('button')) return
  const box = e.currentTarget.getBoundingClientRect()
  const dx = e.clientX - box.left
  const dy = e.clientY - box.top
  const at = (ev) => ({
    x: Math.round(Math.max(0, Math.min(window.innerWidth - box.width, ev.clientX - dx))),
    y: Math.round(Math.max(0, Math.min(window.innerHeight - box.height, ev.clientY - dy))),
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

// ---------------------------------------------------------------- render
export const render = ({ output, error, theme, pos }, dispatch) => {
  const t = THEMES[theme] || THEMES.violet

  let weeks = null
  try { weeks = JSON.parse(output).data.viewer.contributionsCollection.contributionCalendar.weeks } catch (e) {}

  const cols = weeks ? weeks.length : 53
  const W = cols * (CELL + GAP) - GAP + PAD_X * 2
  const H = 7 * (CELL + GAP) - GAP + 62
  const today = weeks && weeks[weeks.length - 1].contributionDays.slice(-1)[0].date

  // Start on a different line each day, but stay put within the day.
  const day = Math.floor(Date.now() / 86400000)
  const phase = (day % QUOTES.length) * QUOTE_SECONDS
  const cycle = QUOTES.length * QUOTE_SECONDS

  return (
    <div
      onMouseDown={(e) => startDrag(e, dispatch)}
      onDoubleClick={(e) => !e.target.closest('button') && dispatch({ type: 'SET_POS', pos: null, save: true })}
      style={{
        position: 'fixed',
        ...(pos ? { left: pos.x, top: pos.y } : { left: 40, bottom: 40 }),
        width: W,
        boxSizing: 'border-box',
        padding: `12px ${PAD_X}px ${PAD_X}px`,
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        color: 'rgba(255,255,255,0.9)',
        background: t.panel,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.4), 0 16px 40px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
        transition: 'background 240ms ease',
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* key={theme} restarts the animation cleanly on every theme switch */}
      <div key={theme} className="gh-fx" style={abs({ inset: 0, zIndex: 0 })}>
        {FX[theme](W, H)}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 24, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1, height: 16, overflow: 'hidden' }}>
            {weeks ? (
              QUOTES.map((q, i) => (
                <div
                  key={q}
                  className="gh-q"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontSize: 12,
                    lineHeight: '16px',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'rgba(255,255,255,0.72)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    opacity: 0,
                    animation: `gh-quote ${cycle}s linear ${i * QUOTE_SECONDS - phase}s infinite`,
                  }}
                >
                  {q}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, lineHeight: '16px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {output === undefined ? 'Loading…' : `GitHub heatmap: ${String(error || output || 'no data').slice(0, 120)}`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {ORDER.map((key) => {
              const on = key === theme
              const icon = ICONS[key]
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
                    borderRadius: 6,
                    background: on ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${on ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: on ? `inset 0 -1px 0 ${THEMES[key].accent}` : 'none',
                  }}
                >
                  <Sprite rows={icon.rows} colors={icon.colors} scale={2} />
                </button>
              )
            })}
          </div>
        </div>

        {weeks && (
          <div style={{ display: 'flex', gap: GAP }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {w.contributionDays.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.contributionCount} on ${d.date}`}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      background: t.levels[LEVEL_INDEX[d.contributionLevel]],
                      transition: 'background 240ms ease',
                      ...(d.date === today
                        ? { '--c': t.accent, outline: `1px solid ${t.accent}`, outlineOffset: 1, animation: 'gh-ring 2.4s steps(6) infinite' }
                        : {}),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
