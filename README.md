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

## Themes

Five pixel-art buttons in the top-right switch themes: sparkle, Halloween,
winter, fall and Christmas. Each has a small pixel animation (twinkling stars,
bats and a ghost, snowfall, tumbling leaves, snow with gold glints). The
top-left line rotates through short notes about building, starting on a
different one each day. Animations respect macOS "Reduce motion".

## Moving it

Drag the panel anywhere on the screen; the position is remembered. Double-click
the panel to snap it back to the bottom-left.

## Customize

Edit `github-heatmap.jsx`: `THEMES` the colors (add your own entry and list it in `ORDER`),
`refreshFrequency` how often it updates. If `gh` is not at `/opt/homebrew/bin/gh`
(Intel Macs use `/usr/local/bin/gh`), change the path in `command`.

The count includes private contributions only if you have enabled that in your
GitHub profile settings.
