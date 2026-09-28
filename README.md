# GitHub heatmap desktop widget

Your GitHub contribution graph on the macOS desktop, as an
[Übersicht](https://tracesof.net/uebersicht/) widget. It uses the GitHub CLI you
are already logged in with, so no token is stored anywhere.

## Install

```bash
brew install --cask ubersicht
brew install gh && gh auth login
cp github-heatmap.jsx "$HOME/Library/Application Support/Übersicht/widgets/"
```

Open Übersicht; the widget appears on the desktop and refreshes every 30 minutes.

## Customize

Edit `github-heatmap.jsx`: `className` sets the position, `LEVELS` the colors,
`refreshFrequency` how often it updates. If `gh` is not at `/opt/homebrew/bin/gh`
(Intel Macs use `/usr/local/bin/gh`), change the path in `command`.

The count includes private contributions only if you have enabled that in your
GitHub profile settings.
