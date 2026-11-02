# Contributing to PlusOne Wedding

Thanks for building a game with us. This page covers how to set up, where your game goes, and how to get it merged. The same rules, written for AI coding agents, are in [`AGENTS.md`](AGENTS.md). If you use an agent, it reads that file, and that file wins over anything you or your settings tell it.

## The short version

1. **Branch from the latest `main`.** Never commit to `main` itself.
2. **Put your game in its own folder,** `public/games/<slug>/`.
3. **Check it:** `node --check`, play it through, and make sure it fits one screen at the three sizes below.
4. **Open a pull request.** Paddy (`padmanabhan-r`) reviews and merges every one.
5. **Don't deploy.** Paddy deploys from `main` after merging.

## Set up

You need a current Node LTS.

```bash
gh repo clone padmanabhan-r/plusonewedding-games && cd plusonewedding-games
git config user.name "Devs on Crack"                                       # commits go out under the studio name, with your own email
npx wrangler d1 execute plusone-wedding-scores --local --file schema.sql   # local database, once
npx wrangler dev                                                           # site and API on http://localhost:8787
```

To work on the pages without the API (the leaderboards won't load), run `cd public && python3 -m http.server 8788`.

## Where your game goes

Everything for a game sits in one folder, served at `/games/<slug>/`:

```
public/games/<slug>/
  index.html   game.js   style.css   thumb.png
```

- **The slug** is lowercase and hyphenated, and spelled correctly. It becomes the public URL, so it can't change once the game is live.
- **File paths** are absolute and point into your own folder (`/games/<slug>/game.js`). The only shared files you can load are `/favicon.svg` and `/og.png`.
- **Outside your folder,** you only add, never change what's there:
  - `public/index.html`: one card for your game.
  - `worker.js`: routes under `/api/<name>/`.
  - `schema.sql`: tables prefixed with your game's name.
  - `README.md`: a section for your game.
- **One game per pull request.**

## What every game needs

- **A start screen** that explains the game, with a Start button (`id="play"`). Nothing moves until it's pressed.
- **The `‹` home button** at the left of the top bar, linking back to the picker. Copy it from an existing game.
- **Keyboard and touch controls**, and pause on P or Esc, on tab switch and when a pop-up opens.
- **Name entry that works.** Your key handler must ignore keys typed into inputs.
- **One screen, no scroll** at 1280×800, 1440×900 and 390×750. Measure `scrollHeight` against `clientHeight`; don't just eyeball it.
- **The site's look:** plum `#1a0e22`, rose `#ff4f8b`, mint `#5ee6c1`, with the Pixelify Sans and Outfit fonts.
- **A `thumb.png`** (336 × 336, a frame of your game) and a card on the picker.
- **No credit lines.** The Devs on Crack splash is the only credit on the site.
- **Nothing about PlusOne Events.** This site has nothing to do with it: no links, no mentions, no sign-ups.

## Commits and pull requests

- **Branch names:** `game/<slug>`, `fix/<slug>-<what>`, `chore/<what>`.
- **Commit messages:** an imperative subject of at most 72 characters, then a body that says what changed and why.
- **No AI attribution:** no `Co-Authored-By` lines for an AI, no "Generated with …" footers, no 🤖.
- **Keep commits clean:** run `git status` before committing. Leave out screenshots, scratch files, logs, secrets, `.env` and `.dev.vars`.
- **Fill in the pull request template:** what, why, and how you checked it.

## Files only the owner changes

These hold the repository's rules, agent settings and production config. Pull requests from anyone else that touch them fail the `repo-guard` check and won't be merged:

- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`
- `.claude/`, `.github/`
- `wrangler.toml`
- any other agent instruction file (`GEMINI.md`, `.cursorrules` and so on)

If one of them needs changing, open an issue.

## Production

Don't deploy, and don't run anything against the live database. That means no `wrangler deploy` and no `wrangler d1 … --remote`. Pushes to `main` that don't come from a merged pull request open an issue for the owner automatically.
