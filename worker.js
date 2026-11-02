// PlusOne Wedding on plusonewedding.site: the static game plus a public leaderboard.
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const MAX_SCORE = 200_000;
const DAY_MS = 86_400_000;
// Names are public, so a short list of slurs and swearing (English and Hindi) is refused.
const BLOCKED = ['fuck', 'shit', 'cunt', 'bitch', 'nigg', 'fag', 'rape', 'whore', 'slut', 'dick', 'pussy', 'porn', 'nazi', 'hitler',
  'chutiya', 'chutia', 'madarchod', 'bhenchod', 'behenchod', 'bhosdi', 'bsdk', 'gandu', 'randi', 'lund', 'lauda', 'loda', 'harami', 'kutta', 'kutti'];

function cleanName(raw) {
  return String(raw ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
}
const isBlocked = name => { const flat = name.toLowerCase().replace(/[^a-z]/g, ''); return BLOCKED.some(w => flat.includes(w)); };

async function newRun(env) {
  const id = crypto.randomUUID(), now = Date.now();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM runs WHERE started_at < ?').bind(now - DAY_MS),
    env.DB.prepare('INSERT INTO runs (id, started_at) VALUES (?, ?)').bind(id, now),
  ]);
  return json({ id });
}

async function saveScore(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad-json' }, 400); }
  const name = cleanName(body?.name);
  if (name.length < 1 || [...name].length > 16) return json({ error: 'name' }, 400);
  if (isBlocked(name)) return json({ error: 'name-blocked' }, 400);
  const score = Math.floor(Number(body?.score));
  const level = Math.floor(Number(body?.level));
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return json({ error: 'score' }, 400);
  if (!Number.isFinite(level) || level < 1 || level > 5) return json({ error: 'score' }, 400);

  const run = String(body?.run ?? '');
  const row = await env.DB.prepare('SELECT started_at, used FROM runs WHERE id = ?').bind(run).first();
  if (!row || row.used) return json({ error: 'run' }, 400);
  // A score has to be reachable in the time the game has been running.
  const secs = (Date.now() - row.started_at) / 1000;
  if (secs < 5 || score > secs * 500 + 6000) return json({ error: 'score' }, 400);

  const claimed = await env.DB.prepare('UPDATE runs SET used = 1 WHERE id = ? AND used = 0').bind(run).run();
  if (claimed.meta.changes !== 1) return json({ error: 'run' }, 400);
  const inserted = await env.DB.prepare('INSERT INTO scores (name, score, level, created_at) VALUES (?, ?, ?, ?) RETURNING id')
    .bind(name, score, level, Date.now()).first();
  const [above, total] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE score > ?').bind(score),
    env.DB.prepare('SELECT COUNT(*) AS n FROM scores'),
  ]);
  return json({ ok: true, id: inserted.id, rank: above.results[0].n + 1, total: total.results[0].n });
}

async function leaderboard(env) {
  const { results } = await env.DB.prepare('SELECT id, name, score, level FROM scores ORDER BY score DESC, created_at ASC LIMIT 20').all();
  return json({ top: results });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'www.plusonewedding.site') {
      url.hostname = 'plusonewedding.site';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/run' && request.method === 'POST') return await newRun(env);
        if (url.pathname === '/api/score' && request.method === 'POST') return await saveScore(request, env);
        if (url.pathname === '/api/leaderboard' && request.method === 'GET') return await leaderboard(env);
        return json({ error: 'not-found' }, 404);
      } catch (err) {
        console.error(err);
        return json({ error: 'server' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
