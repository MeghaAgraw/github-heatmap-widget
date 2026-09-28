// GitHub contribution heatmap for Übersicht.
// Uses the logged-in `gh` CLI, so no token is stored in this file.
// Run `gh auth status` in a terminal if it ever shows an error.

export const command = `/opt/homebrew/bin/gh api graphql -f query='{ viewer { login contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }'`

export const refreshFrequency = 1000 * 60 * 30 // every 30 minutes

// Position on the desktop (px from the edges). Change freely.
export const className = `
  left: 40px;
  bottom: 40px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  color: #fff;
`

const LEVELS = {
  NONE: 'rgba(255,255,255,0.10)',
  FIRST_QUARTILE: '#c4b5fd',
  SECOND_QUARTILE: '#a78bfa',
  THIRD_QUARTILE: '#8b5cf6',
  FOURTH_QUARTILE: '#6d28d9',
}

const CELL = 11
const GAP = 3

export const render = ({ output, error }) => {
  let data
  try {
    data = JSON.parse(output).data.viewer
  } catch (e) {
    return <div style={{ opacity: 0.7, fontSize: 12 }}>GitHub heatmap: {String(error || output || 'no data').slice(0, 120)}</div>
  }
  const cal = data.contributionsCollection.contributionCalendar
  return (
    <div style={{ padding: 16, borderRadius: 16, background: 'rgba(20,16,32,0.55)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div style={{ fontSize: 12, marginBottom: 10, opacity: 0.85 }}>
        <strong>{cal.totalContributions}</strong> contributions in the last year · @{data.login}
      </div>
      <div style={{ display: 'flex', gap: GAP }}>
        {cal.weeks.map((w, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
            {w.contributionDays.map((d) => (
              <div
                key={d.date}
                title={`${d.contributionCount} on ${d.date}`}
                style={{ width: CELL, height: CELL, borderRadius: 2, background: LEVELS[d.contributionLevel] }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
