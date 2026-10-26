# plusonewedding-games

Wedding-themed browser games on **plusonewedding.site**, made by **Devs on Crack**. All development for the site happens in this repo (moved out of the plusone-app repo's `private/aisle-run` on 26 Oct 2026).

## Rules for this site

- **Completely separate from PlusOne Events.** Never link, redirect, proxy or mention plusoneevents.site, the PlusOne Events app, its brand or its products, in either direction. No early access, no email capture, no sign-ups.
- **The game's name is "PlusOne Wedding".** Not "a game from PlusOne Wedding". The **+1** is a boost or power-up in the game, never a product reference.
- **Look:** plum `#1a0e22`, rose `#ff4f8b`, mint `#5ee6c1`, with Pixelify Sans and Outfit. Never use the PlusOne Events look (ink and marigold, EB Garamond, the italic wordmark) or the old ivory and navy.
- **One screen, no page scroll.** Check 1280×800, 1440×900 and a 390×750 phone. Measure `scrollHeight` against `clientHeight`; don't judge it by eye.
- **No credit line** on the site.
- The Halloween card shows Paddy's photo with his OK. It hides itself after 1 November.

## Deploy

```bash
node --check public/game.js && node --check worker.js
npx wrangler deploy        # Worker "aisle-run", custom domains plusonewedding.site + www
```

The old Worker `plusonewedding-apex-redirect` is retired; never redeploy it.

## Leaderboard

D1 database `plusone-wedding-scores` (binding `DB`), tables `runs` and `scores` (`schema.sql`).

```bash
npx wrangler d1 execute plusone-wedding-scores --remote --command "SELECT id, name, score, level FROM scores ORDER BY score DESC"
npx wrangler d1 execute plusone-wedding-scores --remote --command "DELETE FROM scores WHERE id = N"
```

## Git

Commits are authored as "Devs on Crack". No AI attribution in commits, ever. `private/` is git-ignored and holds originals (such as the full-size Halloween photo).
