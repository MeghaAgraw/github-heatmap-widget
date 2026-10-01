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
// levels: cell colors, none → most, each a single light→dark ramp (ColorBrewer
// and Tailwind steps) so every level reads on the light panel, colorblind too.
const EMPTY = '#ebedf0'
const THEMES = {
  violet: {
    label: 'Sparkle',
    levels: [EMPTY, '#c4b5fd', '#8b5cf6', '#6d28d9', '#3b0764'],
    panel: 'rgba(251,250,255,0.88)',
  },
  halloween: {
    label: 'Halloween',
    levels: [EMPTY, '#fdba74', '#f97316', '#c2410c', '#4c1d95'],
    panel: 'rgba(255,250,245,0.88)',
  },
  winter: {
    label: 'Winter',
    levels: [EMPTY, '#9ecae1', '#4292c6', '#08519c', '#0b2752'],
    panel: 'rgba(248,251,255,0.88)',
  },
  fall: {
    label: 'Fall',
    levels: [EMPTY, '#fca572', '#ef6548', '#b30000', '#5c0a0a'],
    panel: 'rgba(255,250,246,0.88)',
  },
  christmas: {
    label: 'Christmas',
    levels: [EMPTY, '#a1d99b', '#41ab5d', '#238b45', '#00441b'],
    panel: 'rgba(249,252,249,0.88)',
  },
}
const ORDER = ['violet', 'halloween', 'winter', 'fall', 'christmas']
const LEVEL_INDEX = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

// ---------------------------------------------------------------- words
const QUOTES = [
  'Make it work, make it right, make it fast.',
  'Ship small. Ship often.',
  'Build the thing you wish existed.',
  'Taste is a muscle. Use it daily.',
  'Every commit is a vote for who you’re becoming.',
  'Done is better than perfect.',
  'Quality is a decision, not an accident.',
  'Start before you’re ready.',
  'Small steps, every day.',
  'The details are not the details. They make the design.',
  'Simple things, done well, compound.',
  'Momentum beats motivation.',
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
    colors: { a: '#8b5cf6', b: '#c4b5fd' },
  },
  halloween: {
    rows: ['...s...', '..s....', '.ooooo.', 'oOoOoOo', 'oOoOoOo', 'oOoOoOo', '.ooooo.'],
    colors: { s: '#4ade80', o: '#f97316', O: '#c2410c' },
  },
  winter: {
    rows: ['a..a..a', '.a.a.a.', '..aba..', 'aabbbaa', '..aba..', '.a.a.a.', 'a..a..a'],
    colors: { a: '#4292c6', b: '#9ecae1' },
  },
  fall: {
    rows: ['...aaaa', '..aaaab', '.aaaaba', '.aaabaa', '.abaaa.', '.baa...', 'b......'],
    colors: { a: '#e8822b', b: '#7c2d12' },
  },
  christmas: {
    rows: ['...y...', '...g...', '..ggg..', '.grgGg.', '..ggg..', '.gGgrg.', 'ggggggg', '...t...'],
    colors: { y: '#f59e0b', g: '#238b45', G: '#41ab5d', r: '#dc2626', t: '#8b5a2b' },
  },
}

const BAT_A = ['a.......a', 'aa.a.a.aa', '.aaaaaaa.', '...a.a...', '.........']
const BAT_B = ['.........', '...a.a...', '.aaaaaaa.', 'aa.....aa', 'a.......a']
const GHOST = ['..aaa..', '.aaaaa.', 'aa.a.aa', 'aaaaaaa', 'aaaaaaa', 'a.a.a.a']
const STAR = ['.a.', 'aba', '.a.']
const LEAF = ['.aa', 'aab', 'ab.']
const FLAKE = ['a.a', '.b.', 'a.a']

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
  .gh-btn { transition: background 120ms ease; }
  .gh-btn:hover { background: #e4e6e9 !important; }
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
    ) : opts.flake ? (
      <Sprite rows={FLAKE} colors={{ a: color, b: color }} scale={size} />
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
  violet: (W, H) => twinkles(12, 1, W, H, ['#8b5cf6', '#c4b5fd'], 2),

  winter: (W, H) =>
    falling(16, 2, W, H, { sizes: [1, 2, 2], colors: ['#6baed6', '#9ecae1'], opacity: 0.85, speed: 8, drift: 36, flake: true }),

  fall: (W, H) =>
    falling(10, 3, W, H, { sizes: [2, 2, 3], colors: ['#e8822b', '#d9582b', '#f2c14e'], stem: '#7c2d12', opacity: 0.95, speed: 8, drift: 80, leaf: true }),

  halloween: (W, H) => [
    ...falling(8, 4, W, H, { sizes: [2, 3], colors: ['#fdba74', '#f97316'], opacity: 0.8, speed: 9, drift: 20 }),
    ...[0, 1].map((i) => (
      <div
        key={`bat${i}`}
        style={abs({ left: 0, top: 10 + i * 34, '--w': `${W + 24}px`, animation: `gh-fly ${12 + i * 5}s steps(${Math.round((W + 48) / 2)}) ${-i * 6}s infinite` })}
      >
        <div style={{ position: 'relative', width: 18, height: 10 }}>
          <div style={abs({ inset: 0, animation: 'gh-frame-a 0.36s infinite' })}>
            <Sprite rows={BAT_A} colors={{ a: '#3b0764' }} />
          </div>
          <div style={abs({ inset: 0, animation: 'gh-frame-b 0.36s infinite' })}>
            <Sprite rows={BAT_B} colors={{ a: '#3b0764' }} />
          </div>
        </div>
      </div>
    )),
    <div key="ghost" style={abs({ right: 10, bottom: 10, opacity: 0.9, animation: 'gh-bob 3.2s steps(8) infinite' })}>
      <Sprite rows={GHOST} colors={{ a: '#d4d4d8' }} />
    </div>,
  ],

  // Quiet snow with the odd gold glint, rather than a busy light string.
  christmas: (W, H) => [
    ...falling(12, 5, W, H, { sizes: [1, 2, 2], colors: ['#9ecae1'], opacity: 0.85, speed: 9, drift: 24, flake: true }),
    ...twinkles(5, 6, W, H, ['#f59e0b'], 2),
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
        color: '#1f2328',
        background: t.panel,
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.05), 0 4px 16px -8px rgba(0,0,0,0.12)',
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
                    color: '#57606a',
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
              <div style={{ fontSize: 12, lineHeight: '16px', color: '#6e7781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {output === undefined ? 'Loading…' : `GitHub heatmap: ${String(error || output || 'no data').slice(0, 120)}`}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 8, background: '#f2f3f5' }}>
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
                    width: 22,
                    height: 22,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    border: 'none',
                    background: on ? '#ffffff' : 'transparent',
                    boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
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
