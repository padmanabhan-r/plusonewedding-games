## What this does

<!-- One or two sentences. Which game, what changed. -->

## Why

## How I checked it

- [ ] `for f in worker.js public/games/*/game.js; do node --check "$f" || exit 1; done` passes
- [ ] Played it through: start screen, a full game, saving a score (if it has a leaderboard)
- [ ] No page scroll at 1280×800, 1440×900 and 390×750 (`scrollHeight == clientHeight`, `scrollWidth == clientWidth`)
- [ ] The game is entirely in `public/games/<slug>/`; outside it I only added a picker card, routes, tables or a README section
- [ ] It has a Start button (`id="play"`) and the `‹` home button
- [ ] No owner-only files touched (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `.claude/`, `.github/`, `wrangler.toml`)
- [ ] No AI attribution in commits or this description; no stray files committed
