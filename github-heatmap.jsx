// GitHub contribution heatmap for Übersicht, with switchable themes.
// Uses the logged-in `gh` CLI, so no token is stored in this file.
// Run `gh auth status` in a terminal if it ever shows an error.

export const command = `/opt/homebrew/bin/gh api graphql -f query='{ viewer { login contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }'`

export const refreshFrequency = 1000 * 60 * 30 // every 30 minutes

// Position on the desktop (px from the edges). Change freely.
export const className = `
  left: 40px;
  bottom: 40px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`

// Each theme: five cell colors (none → most), panel, text, and an emoji.
const THEMES = {
  violet: {
    icon: '●', label: 'Violet',
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

const CELL = 11
const GAP = 3
const STORE = 'github-heatmap-theme'

const savedTheme = () => {
  try {
    const t = localStorage.getItem(STORE)
    return THEMES[t] ? t : 'violet'
  } catch (e) {
    return 'violet'
  }
}

export const initialState = { theme: savedTheme() }

export const updateState = (event, prev) => {
  if (event.type === 'SET_THEME') {
    try { localStorage.setItem(STORE, event.theme) } catch (e) {}
    return { ...prev, theme: event.theme }
  }
  if (event.type === 'UB/COMMAND_RAN') {
    return { ...prev, output: event.output, error: event.error }
  }
  return prev
}

export const render = ({ output, error, theme }, dispatch) => {
  const t = THEMES[theme] || THEMES.violet

  let data = null
  try { data = JSON.parse(output).data.viewer } catch (e) {}

  const cal = data && data.contributionsCollection.contributionCalendar

  return (
    <div style={{ padding: 16, borderRadius: 16, color: t.text, background: t.panel, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'background 0.3s, color 0.3s' }}>
      {cal ? (
        <>
          <div style={{ fontSize: 12, marginBottom: 10, opacity: 0.9 }}>
            {t.icon} <strong>{cal.totalContributions}</strong> contributions in the last year · @{data.login}
          </div>
          <div style={{ display: 'flex', gap: GAP }}>
            {cal.weeks.map((w, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {w.contributionDays.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.contributionCount} on ${d.date}`}
                    style={{ width: CELL, height: CELL, borderRadius: 2, background: t.levels[LEVEL_INDEX[d.contributionLevel]], transition: 'background 0.3s' }}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ opacity: 0.7, fontSize: 12 }}>
          GitHub heatmap: {output === undefined ? 'loading…' : String(error || output || 'no data').slice(0, 120)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
        {ORDER.map((key) => (
          <button
            key={key}
            title={THEMES[key].label}
            onClick={() => dispatch({ type: 'SET_THEME', theme: key })}
            style={{
              cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '4px 7px', borderRadius: 999, color: t.text,
              background: key === theme ? 'rgba(255,255,255,0.22)' : 'transparent',
              border: `1px solid ${key === theme ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.16)'}`,
            }}
          >
            {THEMES[key].icon}
          </button>
        ))}
      </div>
    </div>
  )
}
