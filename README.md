<div align="center">

<img src="assets/banner.jpg" width="100%" alt="PlusOne Wedding banner: the pixel banquet hall with tables, RSVP envelopes and the mandap, beside the line Collect every RSVP. Run up the aisle.">

# PlusOne Wedding

[![Play now](https://img.shields.io/badge/Play_now-plusonewedding.site-ff4f8b?style=for-the-badge&logo=googlechrome&logoColor=white)](https://plusonewedding.site)

![Studio](https://img.shields.io/badge/studio-Devs_on_Crack-ff4f8b?style=flat-square&labelColor=1a0e22)
![Genre](https://img.shields.io/badge/genre-wedding--chaos_games-5ee6c1?style=flat-square&labelColor=1a0e22)
![Games](https://img.shields.io/badge/games-2-ff76a5?style=flat-square&labelColor=1a0e22)
![Status](https://img.shields.io/badge/status-live-5ee6c1?style=flat-square&labelColor=1a0e22)
![Site](https://img.shields.io/badge/site-plusonewedding.site-c4a8c8?style=flat-square&labelColor=1a0e22)

<table align="center">
  <tr>
    <td align="center" width="200"><img src="assets/logos/html5.svg" width="56" height="56" alt="HTML5"><br><b>HTML Canvas</b><br><sub>The game. Pixel art drawn in code, at 336 × 336, scaled up crisp.</sub></td>
    <td align="center" width="200"><img src="assets/logos/cloudflareworkers.svg" width="56" height="56" alt="Cloudflare Workers"><br><b>Cloudflare Workers</b><br><sub>The platform. Serves the site and the leaderboard API.</sub></td>
    <td align="center" width="200"><img src="assets/logos/sqlite.svg" width="56" height="56" alt="SQLite"><br><b>Cloudflare D1</b><br><sub>The memory. Keeps every saved name and score.</sub></td>
  </tr>
</table>

![JavaScript](https://img.shields.io/badge/JavaScript-no_framework-f7df1e?style=flat-square&logo=javascript&logoColor=1a0e22&labelColor=1a0e22)
![Web Audio](https://img.shields.io/badge/Web_Audio-synthesised_music-ff76a5?style=flat-square&labelColor=1a0e22)
![Wrangler](https://img.shields.io/badge/Wrangler-4-f38020?style=flat-square&logo=cloudflare&logoColor=white&labelColor=1a0e22)

</div>

PlusOne Wedding is a set of pixel games about Indian weddings. The home page is a game picker; each game has its own page and its own leaderboard. They run in any browser, on a phone or a laptop, with nothing to install.

- **Aisle Run** (`/games/aisle-run/`): a maze game about the week before the wedding. You play the couple-to-be, racing round a banquet hall to collect every guest's RSVP while the wedding chaos tries to stop you. Get every RSVP in, then run up the aisle to the mandap.
- **Wedding Feast** (`/games/wedding-feast/`): you're the server at a South Indian wedding. Grab the right dish off the food belt and get it to the table before the guests turn hangry.

Made by **Devs on Crack**. This repository is the home of the wedding-themed games on plusonewedding.site.

## Aisle Run: how it plays

1. **Read the rules.** A pop-up explains the game, the four steps, the power-ups and the chaos before the first game. The **How to play** button brings it back at any time.
2. **Collect every RSVP.** There are 49 envelopes around the hall. You start with **three days** until the wedding, and the days carry across all five levels.
3. **Dodge the chaos.** Each character has its own trick, listed below. A gatecrasher or the budget catching you costs a day.
4. **Grab the power-ups.** The **+1** is a boost, not a life. For a few seconds the chaos panics, and touching them seats them for points. The **extra day** shows up once a level if you've lost a day, and wins it back.
5. **Run up the aisle.** With every RSVP in, the mandap gate opens. Reach it to clear the level and bank a time bonus.

| The rules, before the first game | The board, mid-level |
|---|---|
| ![Rules pop-up](assets/screens/rules.jpg) | ![The banquet hall mid-level](assets/screens/play.jpg) |

<p align="center"><img src="assets/screens/power.jpg" width="640" alt="The +1 power-up in play: the chaos turns pastel and runs from the couple"></p>

### The chaos

| Character | What it does |
|---|---|
| **Aunty Inquiry** | Stops you for a chat ("So when are the kids coming?"). Mash the arrows to excuse yourself. |
| **Gatecrasher** | Walks in through the side doors uninvited, and keeps multiplying: up to 2, then 3, then 4. |
| **Budget Blowout** | An invoice that floats straight over the tables, and speeds up the longer a level runs. |
| **The DJ** | Fires waves of requests you didn't make down the corridors. One hit flips your controls. |

Seated by the +1, Aunty goes to Table 14, far from the mic. The gatecrasher gets a polite name card, the invoice gets negotiated down, and the DJ finally plays your song. Snacks float across the hall for extra points: a laddoo, a mehendi cone, and a slice of cake the caterer swore was gluten-free.

### Levels

Mehendi, Sangeet, Haldi, Wedding day, Reception. Every level uses the same hall and gets harder: more gatecrashers, a faster budget, a quicker aunty and DJ, and a shorter +1. Clearing Reception says "New levels coming soon."

### Leaderboard

At game over, or after clearing all five levels, players put their name on the public leaderboard. The top 20 show from the **Leaderboard** button.

| The leaderboard | On a phone |
|---|---|
| ![Leaderboard](assets/screens/leaderboard.jpg) | <img src="assets/screens/phone-play.jpg" width="320" alt="The game on a phone, with the direction pad"> |

## Wedding Feast: how it plays

Orders float above the tables, each with a timer. Walk to the food belt along the top of the hall, step under the dish a table wants to pick it up, and carry it over before the timer runs out. A late order starts a fight between relatives and the wedding's happiness drops; at zero, the feast is over. Three rounds, each with more tables, faster orders and a faster belt: **Breakfast** (12 tables), **Lunch** (16) and **Dinner** (20). Scores go on their own leaderboard.

## The tech, part by part

| Part | Built with | What it does |
|---|---|---|
| Game engine | Plain JavaScript and HTML Canvas, `public/games/<game>/game.js` | A 21 × 21 tile hall drawn at 336 × 336 and scaled up pixel-sharp. Grid movement with turn buffering, breadth-first pathfinding for the chasers, and a frame loop with a capped time step. |
| Pixel art | String-map sprites in each game's `game.js` | Every character, table and pickup is drawn from code; the pastel "panic" versions are recoloured at load. |
| Sound | Web Audio API | A shehnai-style tune, dhol beats and every sound effect are synthesised in the browser. No audio files. |
| Game picker | `public/index.html`, `public/home.css` | The home page: one card per game, with a real frame from the game and this browser's best score. |
| Page and layout | Each game's `index.html` and `style.css` | One screen with no scrolling: the board grows to fit, with a touch pad on phones. Pixelify Sans and Outfit from Google Fonts. |
| Hosting | Cloudflare Workers with static assets, `worker.js`, `wrangler.toml` | Serves the site on `plusonewedding.site` and `www`, and redirects `www` to the apex. |
| Leaderboard API | `worker.js` | Aisle Run: `POST /api/run` starts a run, `POST /api/score` saves one score per run, `GET /api/leaderboard` returns the top 20. Wedding Feast has the same three under `/api/feast/`. |
| Leaderboard data | Cloudflare D1 `plusone-wedding-scores`, `schema.sql` | `runs` and `scores` for Aisle Run, `feast_runs` and `feast_scores` for Wedding Feast. |
| Fair play | `worker.js` | Each run saves once, a score must be reachable in the time played, and names with common English and Hindi slurs are refused. |

## Run it yourself

You need a current Node LTS, and a Cloudflare account for the leaderboard.

```bash
gh repo clone padmanabhan-r/plusonewedding-games && cd plusonewedding-games
npx wrangler dev          # site and leaderboard API on http://localhost:8787
```

The games also run without the API (the leaderboards just won't load):

```bash
cd public && python3 -m http.server 8788
```

Deploy to the live site. Apply the schema first whenever `schema.sql` gains a table; every statement is `IF NOT EXISTS`, so it's safe to re-run:

```bash
npx wrangler d1 execute plusone-wedding-scores --remote --file schema.sql
npx wrangler deploy
```

First-time database setup, already done for the live site:

```bash
npx wrangler d1 create plusone-wedding-scores
npx wrangler d1 execute plusone-wedding-scores --remote --file schema.sql
```

There are no environment variables. The Worker's only bindings are `ASSETS` (the `public/` folder) and `DB` (the D1 database), both in `wrangler.toml`.

## Status and limits

Live at [plusonewedding.site](https://plusonewedding.site) with two games, sound, keyboard and touch controls, and a leaderboard for each.

- All five Aisle Run levels share one hall layout.
- The fair-play checks stop casual cheating, not a determined script.
- The leaderboard shows the top 20; ranks beyond that are only shown to the player who saved.

## Next steps

- **New levels:** new halls with their own layouts.
- **More games:** more wedding-themed games, each in its own folder (see [Adding a game](#adding-a-game)).
- **Weekly leaderboard:** a this-week board beside the all-time one.

## Adding a game

1. Make a folder `public/games/<slug>/` with the game's own `index.html`, `game.js` and `style.css`. Use absolute paths to its files (`/games/<slug>/game.js`), and a home button in the top bar linking to `/` (copy the `.brand` markup from an existing game).
2. Add a 336 × 336 `thumb.png`: a frame from the game's canvas.
3. Add a card for it in `public/index.html`.
4. If it has a leaderboard, give it its own tables in `schema.sql` and its own routes under `/api/<slug>/` in `worker.js`.
5. Check every page still fits one screen at 1280 × 800, 1440 × 900 and 390 × 750.

## Repository

| Path | What it is |
|---|---|
| `public/index.html`, `public/home.css` | The game picker (home page) |
| `public/games/aisle-run/` | Aisle Run: `index.html`, `game.js` (map, sprites, movement, chasers, power-ups, sound, leaderboard client), `style.css`, `thumb.png` |
| `public/games/wedding-feast/` | Wedding Feast: `index.html`, `game.js`, `style.css`, `thumb.png` |
| `public/og.png`, `public/favicon.svg` | Share card and icon, shared by every page |
| `worker.js` | Cloudflare Worker: static files, `www` redirect, old `/?beat=` share links, both leaderboard APIs |
| `schema.sql` | D1 tables for both games' runs and scores |
| `wrangler.toml` | Worker name, custom domains, assets and D1 bindings |
| `assets/` | README banner (with its HTML source), screenshots and logos |

Check every script parses before deploying:

```bash
for f in worker.js public/games/*/game.js; do node --check "$f" || exit 1; done
```
