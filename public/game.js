// PlusOne Wedding: a wedding-chaos maze game.
(() => {
'use strict';

// ---------- Board ----------
const T = 16, COLS = 21, ROWS = 21, W = COLS * T, H = ROWS * T;
// # wall  D DJ booth  M mandap  = mandap gate  b buffet  t guest table  G gift table  d side door  E entrance
const MAP = [
  '#####################',
  '#DDD..#MMMMMMM#.....#',
  '#DDD..#MMMMMMM#.bbb.#',
  '#.....#MMM=MMM#.....#',
  '#...................#',
  '#.tt.tt.tt.tt.tt.tt.#',
  '#.tt.tt.tt.tt.tt.tt.#',
  '#...................#',
  '#.tt.tt.......tt.tt.#',
  '#.tt.tt.......tt.tt.#',
  'd...................d',
  '#.tt.tt.......tt.tt.#',
  '#.tt.tt.......tt.tt.#',
  '#...................#',
  '#.tt.tt.tt.tt.tt.tt.#',
  '#.tt.tt.tt.tt.tt.tt.#',
  '#...................#',
  '#.GG.tt.tt.tt.tt.tt.#',
  '#.GG.tt.tt.tt.tt.tt.#',
  '#...................#',
  '##########E##########',
];
const grid = MAP.map(r => r.split(''));
const GATE = { x: 10, y: 3 };
const START = { x: 10, y: 19 };
const DOORS = [{ x: 1, y: 10 }, { x: 19, y: 10 }];
const AUNTY_HOME = { x: 16, y: 3 };
const DJ_HOME = { x: 4, y: 3 };
const INVOICE_HOME = { x: 19, y: 1 };
const TABLE14_SEAT = { x: 16, y: 17 };
const NONE = -1, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const opp = d => d === NONE ? NONE : (d + 2) % 4;
const isFloor = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS && grid[y][x] === '.';
let gateOpen = false;
const walkP = (x, y) => isFloor(x, y) || (gateOpen && x === GATE.x && y === GATE.y);

const CORR_R = [4, 7, 10, 13, 16, 19], CORR_C = [1, 4, 7, 10, 13, 16, 19];
const RSVP_SPOTS = [];
for (const y of CORR_R) for (const x of CORR_C) if (!(x === START.x && y === START.y)) RSVP_SPOTS.push([x, y]);
RSVP_SPOTS.push([4, 1], [19, 1], [15, 3], [1, 3], [8, 9], [12, 9], [8, 11], [12, 11]);

const TABLES = [];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
  if (grid[y][x] === 't' && grid[y][x - 1] !== 't' && grid[y - 1][x] !== 't') TABLES.push({ x, y, n: TABLES.length + 1 });
}
{ // Table 14 is the far corner, as far from the DJ's mic as a table can be.
  let n = 0;
  for (const t of TABLES) if (t.x === 17 && t.y === 17) t.n = 14; else { n++; if (n === 14) n++; t.n = n; }
}
const TABLE14_PX = { x: 17 * T - 1, y: 17 * T + 14 };

const LEVELS = ['Mehendi', 'Sangeet', 'Haldi', 'Wedding day', 'Reception'];
const levelName = n => n <= LEVELS.length ? LEVELS[n - 1] : `Reception, round ${n - LEVELS.length + 1}`;

const AUNTY_LINES = [
  'So when are the kids coming?',
  'Beta, why so thin? Eat something.',
  'In our time, weddings were simpler.',
  'Who is doing your mehendi? Not her, I hope.',
  'You did invite Pinky’s in-laws, na?',
  'So what does the groom do, exactly?',
];
const DJ_LINES = [
  'Now playing: a request nobody made.',
  'This one goes out to… nobody.',
  'The same song, for the fourth time.',
  'By popular demand (the DJ’s): more bass.',
  'Up next: Uncle’s ringtone, remixed.',
];
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- Sprites ----------
const PAL = {
  k: '#15121c', s: '#c98a5e', y: '#ff4f8b', Y: '#c22f66', h: '#2a1a14', r: '#c8323c', R: '#8e1f2a',
  w: '#f3e6c8', W: '#d8c69c', g: '#ffd86b', p: '#e0559a', P: '#a8327a', l: '#9fd3e6', n: '#3fae6a', N: '#2a7a49',
  b: '#3b5aa8', G: '#9a9486', c: '#7a4fd0', C: '#5a35a8', a: '#b9bcc8', v: '#2b2b35', o: '#f0a030', O: '#c97a1a',
  m: '#6b3a1f', M: '#8a5230', q: '#f6b8c8', z: '#f2d27a', e: '#fbf8f1', t: '#5ee6c1', T: '#2fa88a', u: '#ff5fb2', i: '#5fd8ff',
};
const ART = {
  couple0: [
    '.yyyy....rrrr.', 'yyYyyy..rhhhhr', 'yyyyyY..rhhhhr', '.ssss...rsRssr', '.kssk...rksskr', '.ssss...rssssr', '.wwww....rrrr.',
    'wwgwww..rrgrrr', 'wwgwwwssrrrrrr', 'wwgwww.rrgrgrr', '.wwww..rrrrrrr', '.W..W..RrRrRrR', '.k..k..RRRRRRR',
  ],
  couple1: [
    '.yyyy....rrrr.', 'yyYyyy..rhhhhr', 'yyyyyY..rhhhhr', '.ssss...rsRssr', '.kssk...rksskr', '.ssss...rssssr', '.wwww....rrrr.',
    'wwgwww..rrgrrr', 'wwgwwwssrrrrrr', 'wwgwww.rrgrgrr', '.wwww..rrrrrrr', '..WW...rRrRrRr', '..kk....RRRRRR',
  ],
  aunty0: [
    '....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hssRsssh..', '..glgssglg..', '..ssssssss..', '...ssRRss...',
    '....ssss....', '..ppppppPP..', '.ppppppPPPp.', 'spppppPPPpps', '.ppppPPPppp.', '.pppPPPpppp.', '..pppppppp..',
  ],
  aunty1: [
    '....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hssRsssh..', '..glgssglg..', '..ssssssss..', '...sskkss...',
    '....ssss....', '..ppppppPP..', '.ppppppPPPp.', 'spppppPPPpps', '.ppppPPPppp.', '.pppPPPpppp.', '..pppppppp..',
  ],
  cousin0: [
    '...h.h.h....', '..hhhhhhh...', '..hhhhhhhh..', '..ssssssss..', '..kkksskkk..', '..ssssssss..', '..ssseesss..',
    '...ssssss...', '.nnnnnnnnn..', 'nnNnnnNnnnee', 'snnnnNnnneoe', '.nnNnnnnNn..', '.nnnnnnnnn..', '..bb...bb...', '..kk...kk...',
  ],
  cousin1: [
    '...h.h.h....', '..hhhhhhh...', '..hhhhhhhh..', '..ssssssss..', '..kkksskkk..', '..ssssssss..', '..ssseesss..',
    '...ssssss...', '.nnnnnnnnn..', 'nnNnnnNnnnee', 'snnnnNnnneoe', '.nnNnnnnNn..', '.nnnnnnnnn..', '...bb.bb....', '...kk.kk....',
  ],
  dj0: [
    '...cccccc...', '..ccccccccC.', '.aassssssaa.', '.aakksskkaa.', '.aassssssaa.', '...sseess...', '....ssss....',
    '..vvvvvvvv..', '.vvvyvvyvvv.', 'svvvvyyvvvvs', '.vvvvvvvvvv.', '..vvvvvvvv..', '..bb....bb..', '..kk....kk..',
  ],
  dj1: [
    '...cccccc...', '..ccccccccC.', '.aassssssaa.', '.aakksskkaa.', '.aassssssaa.', '...sseess...', '....ssss....',
    '..vvvvvvvv..', '.vvvyvvyvvv.', 'svvvvyyvvvvs', '.vvvvvvvvvv.', '..vvvvvvvv..', '...bb..bb...', '...kk..kk...',
  ],
  invoice0: [
    '..eeeeeeee..', '..eRRRRRRe..', '..eeeeeeee..', '..ekkeekke..', '..eekeekee..', '..eeeeeeee..', '..eeRRRRee..',
    '..eReeeeRe..', '..eeeeeeee..', '..eGGGGGGe..', '..eeeeeeee..', '..eGGGGeee..', '..eeeeeeee..', '..ee.ee.ee..',
  ],
  plus1: [
    '..yyyyyyyy..', '.yyyyyyyyyy.', 'yyyyyyyyyyyy', 'yyyyyyyyeeyy', 'yyyyeyyeeeyy', 'yyyyeyyyeeyy',
    'yyeeeeeyeeyy', 'yyyyeyyyeeyy', 'yyyyeyyyeeyy', 'yyyyyyyeeeey', '.yyyyyyyyyy.', '..yyyyyyyy..',
  ],
  env: ['eeeeeeeeee', 'eGeeeeeeGe', 'eeGeeeeGee', 'eeeGyyGeee', 'eeeeyyeeee', 'eeeeeeeeee', 'WWWWWWWWWW'],
  laddoo: ['..oooo..', '.oOooOo.', 'ooooooOo', 'oOoooooo', 'ooooOooo', 'oooooooo', '.oOoooo.', '..oooo..'],
  mehendi: ['.gggggg.', 'mmMmmmmm', 'mmmmMmmm', '.mmmmmm.', '.mMmmmm.', '..mmmm..', '..mMmm..', '...mm...', '...mm...', '...m....'],
  cake: ['.......rr.', '......qqqq', '....qqqqqq', '..qqqqqqqq', 'eeeeeeeeee', 'zzzzzzzzzz', 'eeeeeeeeee', 'zzzzzzzzzz'],
  noteu: ['..uu..', '..uuu.', '..u.uu', '..u...', 'uuu...', 'uuu...', '.u....'],
  notei: ['..ii..', '..iii.', '..i.ii', '..i...', 'iii...', 'iii...', '.i....'],
  day: ['..k....k..', 'ttkttttktt', 'tttttttttt', 'TTTTTTTTTT', 'eeeeeeeeee', 'eeRReeRRee', 'eRRRRRRRRe', 'eeRRRRRRee', 'eeeRRRReee', 'eeeeRReeee', 'WWWWWWWWWW'],
  card: ['eeeeeeeeee', 'eGGGGGGGGe', 'eeeeeeeeee', 'eGGGGGeeee', 'eeeeeeeeee', 'WWWWWWWWWW'],
};
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const pastel = c => mix(mix(c, '#ffffff', 0.55), '#c9b8ff', 0.2);
const whiteish = c => mix(c, '#ffffff', 0.85);
function makeSprite(rows, map) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) {
    const col = PAL[r[i]]; if (!col) continue;
    x.fillStyle = map ? map(col) : col; x.fillRect(i, j, 1, 1);
  } });
  return c;
}
const SPR = {};
for (const k in ART) SPR[k] = { n: makeSprite(ART[k]), p: makeSprite(ART[k], pastel), w: makeSprite(ART[k], whiteish) };

// 3x5 pixel digits for table numbers and score pops.
const GLYPH = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  '+': '000010111010000',
};
function tinyText(c, str, x, y, color) {
  c.fillStyle = color; let cx = x;
  for (const ch of String(str)) { const g = GLYPH[ch]; if (g) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') c.fillRect(cx + i, y + j, 1, 1); cx += 4; }
}
const tinyW = s => String(s).length * 4 - 1;

// ---------- Sound ----------
const Sound = (() => {
  let ac = null, master = null, noise = null, timer = null, step = 0, nextT = 0, mode = 'normal';
  let muted = false; try { muted = localStorage.getItem('aisle-mute') === '1'; } catch (e) {}
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
    noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone({ f, at, d = 0.12, type = 'square', v = 0.08, slide = 0, vib = 0, vibDepth = 0.015, lp = 0, attack = 0.008 }) {
    if (!ac) return; at = at ?? ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), at + d);
    if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f * vibDepth; l.connect(lg); lg.connect(o.frequency); l.start(at); l.stop(at + d + 0.05); }
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
    let node = o; if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
    node.connect(g); g.connect(master); o.start(at); o.stop(at + d + 0.05);
  }
  // A reedy, shehnai-like voice: sawtooth through a lowpass with vibrato.
  const shehnai = (f, at, d, v = 0.06, vib = 5.5) => tone({ f, at, d, type: 'sawtooth', v, vib, lp: 2200, attack: 0.03 });
  function drum(at, low) {
    if (!ac) return;
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; fl.type = 'bandpass'; fl.frequency.value = low ? 140 : 1800; fl.Q.value = low ? 1.5 : 3;
    g.gain.setValueAtTime(low ? 0.5 : 0.18, at); g.gain.exponentialRampToValueAtTime(0.001, at + (low ? 0.18 : 0.06));
    s.connect(fl); fl.connect(g); g.connect(master); s.start(at); s.stop(at + 0.2);
    if (low) tone({ f: 110, at, d: 0.16, type: 'sine', v: 0.22, slide: 0.5 });
  }
  const D4 = 293.66, st = n => D4 * Math.pow(2, n / 12);
  const MEL = [0, null, 4, 5, 7, null, 5, 4, 5, null, 4, 1, 0, null, null, null, 7, null, 8, 7, 5, null, 4, 5, 4, null, 1, 0, 1, null, 0, null];
  function playStep(s, at, sd) {
    const i = s % 16;
    if (i === 0 || i === 7 || i === 10) drum(at, true);
    if (i === 4 || i === 12 || i === 13 || (mode === 'power' && i % 2 === 1)) drum(at, false);
    const n = MEL[s];
    const up = mode === 'power' ? 5 : 0;
    if (n != null) shehnai(st(n + up), at, sd * 1.7, mode === 'power' ? 0.055 : 0.042);
    if (i % 8 === 0) tone({ f: st(up - 12), at, d: sd * 3, type: 'triangle', v: 0.09 });
    if (mode === 'power' && i % 4 === 2) tone({ f: st(up + 12), at, d: sd * 0.8, type: 'square', v: 0.025 });
  }
  function schedule() {
    const sd = 60 / (mode === 'power' ? 168 : 128) / 2;
    while (nextT < ac.currentTime + 0.2) { playStep(step, nextT, sd); nextT += sd; step = (step + 1) % 32; }
  }
  return {
    init,
    get muted() { return muted; },
    setMuted(m) { muted = m; try { localStorage.setItem('aisle-mute', m ? '1' : '0'); } catch (e) {} if (master) master.gain.value = m ? 0 : 0.55; },
    startBgm() { if (!ac || timer) return; step = 0; nextT = ac.currentTime + 0.06; timer = setInterval(schedule, 50); },
    stopBgm() { clearInterval(timer); timer = null; },
    setMode(m) { mode = m; },
    rsvp() { tone({ f: 988, d: 0.05, v: 0.04 }); tone({ f: 1319, at: ac && ac.currentTime + 0.045, d: 0.06, v: 0.04 }); },
    power() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12, 16].forEach((n, k) => shehnai(st(n + 5), t + k * 0.07, 0.5, 0.07)); },
    seat() { if (!ac) return; const t = ac.currentTime; [12, 16, 19, 24].forEach((n, k) => tone({ f: st(n), at: t + k * 0.05, d: 0.12, type: 'triangle', v: 0.1 })); },
    caught() { tone({ f: 620, d: 0.7, v: 0.09, slide: 0.15 }); },
    babble() { if (!ac) return; const t = ac.currentTime; for (let k = 0; k < 7; k++) tone({ f: 280 + Math.random() * 220, at: t + k * 0.075, d: 0.07, type: 'triangle', v: 0.09 }); },
    djFire() { tone({ f: 90, d: 0.35, type: 'sawtooth', v: 0.08, vib: 9, vibDepth: 0.2, lp: 900 }); },
    wub() { tone({ f: 220, d: 0.45, type: 'square', v: 0.06, vib: 7, vibDepth: 0.12, lp: 1200 }); },
    snack() { tone({ f: 660, d: 0.07, type: 'triangle', v: 0.1 }); tone({ f: 990, at: ac && ac.currentTime + 0.07, d: 0.1, type: 'triangle', v: 0.1 }); },
    doorbell() { if (!ac) return; const t = ac.currentTime; tone({ f: 659, at: t, d: 0.35, type: 'sine', v: 0.12 }); tone({ f: 523, at: t + 0.28, d: 0.5, type: 'sine', v: 0.12 }); },
    chime() { tone({ f: 1568, d: 0.25, type: 'sine', v: 0.05 }); },
    gate() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12].forEach((n, k) => shehnai(st(n), t + k * 0.12, 0.6, 0.07)); },
    clear() {
      if (!ac) return; const t = ac.currentTime;
      [0, 4, 7, 12, 7, 12, 16, 19].forEach((n, k) => shehnai(st(n), t + k * 0.13, k === 7 ? 1.2 : 0.3, 0.08));
      for (let k = 0; k < 8; k++) drum(t + k * 0.13, k % 2 === 0);
    },
    // Sad trombone, played on the shehnai.
    over() { if (!ac) return; const t = ac.currentTime; [392, 370, 349].forEach((f, k) => shehnai(f, t + k * 0.42, 0.4, 0.08, 5)); shehnai(330, t + 1.26, 1.3, 0.08, 7); },
  };
})();

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const cvs = $('screen'), out = cvs.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const b = buf.getContext('2d'); b.imageSmoothingEnabled = false;
const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
const ui = {
  score: $('score'), rsvps: $('rsvps'), days: $('days'), level: $('level'), levelLbl: $('level-lbl'),
  toast: $('toast'), bubble: $('bubble'), flag: $('flag'), stage: $('stage'),
};
const overlays = ['ov-ready', 'ov-pause', 'ov-clear', 'ov-over'].reduce((o, id) => (o[id] = $(id), o), {});
function showOverlay(id) { for (const k in overlays) overlays[k].classList.toggle('show', k === id); }

function fitCanvas() {
  const r = cvs.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const k = Math.max(1, Math.ceil(r.width * dpr / W));
  if (cvs.width !== W * k) { cvs.width = W * k; cvs.height = H * k; }
}
window.addEventListener('resize', fitCanvas);

let toastTimer = 0;
function toast(msg, secs = 2.4) { ui.toast.textContent = msg; ui.toast.classList.add('show'); toastTimer = secs; }
function hideBubble() { ui.bubble.classList.remove('show'); }
function placeBubble(px, py) {
  ui.bubble.style.left = clamp(px / W * 100, 22, 78) + '%';
  ui.bubble.style.top = Math.max(py / H * 100, 14) + '%';
}

let best = 0; try { best = +localStorage.getItem('aisle-best') || 0; } catch (e) {}
const beatScore = Math.max(0, parseInt(new URLSearchParams(location.search).get('beat'), 10) || 0);
if (beatScore) { const el = $('beat'); el.hidden = false; el.textContent = `A friend scored ${beatScore.toLocaleString('en-IN')}. Beat it.`; }

// ---------- State ----------
const G = {
  state: 'title', score: 0, level: 1, days: 3, levelTime: 0, time: 0,
  rsvps: new Set(), total: 0, powerT: 0, power: null, nextPowerAt: 6, nextSnackAt: 10,
  snacks: [], waves: [], pops: [], parts: [], cards: [], cousinCount: 1,
  readyT: 0, dyingT: 0, clearT: 0, killer: null, lastPTile: '', toldMash: false, toldFlip: false,
};
let player, aunty, dj, cousins = [], invoice;
const DIST = new Int16Array(COLS * ROWS);

function computeDist(sx, sy) {
  DIST.fill(999); const q = [sx + sy * COLS]; DIST[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], x = c % COLS, y = (c / COLS) | 0;
    for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d], ni = nx + ny * COLS; if (isFloor(nx, ny) && DIST[ni] === 999) { DIST[ni] = DIST[c] + 1; q.push(ni); } }
  }
}

const speeds = () => {
  const L = G.level - 1;
  return { player: 5.2 + Math.min(0.6, L * 0.1), aunty: Math.min(4.8, 3.9 + L * 0.15), cousin: Math.min(4.9, 3.5 + L * 0.2), dj: 2.6 + L * 0.1, invoice: 1.0 + L * 0.3 };
};
function walker(kind, at) {
  const sp = speeds();
  return { kind, tx: at.x, ty: at.y, dir: NONE, t: 0, speed: sp[kind], state: 'chase', timer: 0, anim: 0, cool: 2, windup: 0, fireDir: NONE, talkT: 0, aggr: Math.min(0.8, 0.45 + 0.08 * G.level) };
}
const posOf = e => ({ x: e.tx + (e.dir === NONE ? 0 : DX[e.dir] * e.t), y: e.ty + (e.dir === NONE ? 0 : DY[e.dir] * e.t) });
const d2 = (a, b2) => (a.x - b2.x) ** 2 + (a.y - b2.y) ** 2;
const walkers = () => [aunty, dj, ...cousins];

function resetActors() {
  player = { tx: START.x, ty: START.y, dir: NONE, t: 0, want: NONE, face: 1, stuckT: 0, revT: 0, anim: 0 };
  aunty = walker('aunty', AUNTY_HOME); aunty.state = 'cool'; aunty.timer = 2.5;
  dj = walker('dj', DJ_HOME);
  cousins = []; for (let i = 0; i < G.cousinCount; i++) cousins.push(walker('cousin', DOORS[i % 2]));
  invoice = { x: INVOICE_HOME.x, y: INVOICE_HOME.y, state: 'chase', timer: 0, rampStart: G.levelTime, scale: 1 };
  G.waves = []; G.power = null; G.powerT = 0; G.lastPTile = '';
  if (G.dayPick) { G.dayPick = null; G.dayAt = G.levelTime + 10; }
  computeDist(START.x, START.y); hideBubble(); Sound.setMode('normal');
}
function startGame() { G.score = 0; G.level = 1; G.days = 3; startLevel(); }
function startLevel() {
  gateOpen = false;
  G.rsvps = new Set(RSVP_SPOTS.map(([x, y]) => x + ',' + y)); G.total = G.rsvps.size;
  G.levelTime = 0; G.cousinCount = 1; G.snacks = []; G.cards = []; G.nextSnackAt = 10; G.nextPowerAt = 6;
  G.dayPick = null; G.dayDone = false; G.dayAt = 25 + Math.random() * 20;
  resetActors(); enterReady();
}
function enterReady() {
  G.state = 'ready'; G.readyT = 1.7;
  $('ready-lvl').textContent = `Level ${G.level} · ${levelName(G.level)}`;
  $('ready-txt').textContent = 'Ready?';
  showOverlay('ov-ready');
}

// ---------- Movement ----------
function advance(e, dist, choose) {
  for (let guard = 0; dist > 1e-6 && guard < 8; guard++) {
    if (e.dir === NONE) { const nd = choose(); if (nd == null) return; e.dir = nd; e.t = 0; }
    const rem = 1 - e.t;
    if (dist < rem) { e.t += dist; return; }
    dist -= rem; e.tx += DX[e.dir]; e.ty += DY[e.dir]; e.t = 0;
    const nd = choose();
    if (nd == null) { e.dir = NONE; return; }
    e.dir = nd;
  }
}
function playerChoose() {
  const p = player;
  if (p.want !== NONE && walkP(p.tx + DX[p.want], p.ty + DY[p.want])) return p.want;
  if (p.dir !== NONE && walkP(p.tx + DX[p.dir], p.ty + DY[p.dir])) return p.dir;
  return null;
}
function enemyChoose(e) {
  const opts = [];
  for (let d = 0; d < 4; d++) { if (e.dir !== NONE && d === opp(e.dir)) continue; if (isFloor(e.tx + DX[d], e.ty + DY[d])) opts.push(d); }
  if (!opts.length) { const r = opp(e.dir); return r !== NONE && isFloor(e.tx + DX[r], e.ty + DY[r]) ? r : null; }
  let mode = 'random';
  if (e.state === 'scared') mode = 'flee';
  else if (e.kind === 'aunty') mode = e.state === 'chase' ? 'chase' : 'random';
  else if (e.kind === 'cousin') mode = Math.random() < e.aggr ? 'chase' : 'random';
  else if (e.kind === 'dj') mode = Math.random() < 0.3 ? 'chase' : 'random';
  if (mode === 'random') return pick(opts);
  let bestD = [], bv = mode === 'chase' ? Infinity : -Infinity;
  for (const d of opts) {
    const v = DIST[(e.tx + DX[d]) + (e.ty + DY[d]) * COLS];
    if (mode === 'chase' ? v < bv : v > bv) { bv = v; bestD = [d]; } else if (v === bv) bestD.push(d);
  }
  return pick(bestD);
}
function djSight(e) {
  if (player.stuckT > 0) return NONE;
  const [px, py] = G.lastPTile.split(',').map(Number);
  let dir = NONE, n = 0;
  if (e.ty === py && e.tx !== px) { dir = px > e.tx ? 1 : 3; n = Math.abs(px - e.tx); }
  else if (e.tx === px && e.ty !== py) { dir = py > e.ty ? 2 : 0; n = Math.abs(py - e.ty); }
  if (dir === NONE || n > 9) return NONE;
  for (let k = 1; k < n; k++) if (!isFloor(e.tx + DX[dir] * k, e.ty + DY[dir] * k)) return NONE;
  return dir;
}

function setWant(d) {
  if (G.state === 'title' || G.state === 'over') return;
  if (G.state !== 'play' && G.state !== 'ready') return;
  const p = player;
  if (p.stuckT > 0) { p.stuckT -= 0.17; return; }
  if (p.revT > 0) d = opp(d);
  p.want = d;
  if (G.state !== 'play') return;
  if (p.dir !== NONE && d === opp(p.dir) && p.t > 0) { p.tx += DX[p.dir]; p.ty += DY[p.dir]; p.dir = d; p.t = 1 - p.t; }
  else if (p.dir !== NONE && d !== p.dir && d !== opp(p.dir) && p.t < 0.2 && walkP(p.tx + DX[d], p.ty + DY[d])) { p.dir = d; p.t = 0; }
}

// ---------- Game events ----------
function addScore(n, x, y) {
  G.score += n;
  if (x != null) G.pops.push({ x, y, text: '+' + n, t: 1 });
}
function puff(x, y, cols) {
  for (let k = 0; k < 14; k++) { const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5; G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.6, col: pick(cols), g: 0 }); }
}
function openGate() {
  gateOpen = true; Sound.gate();
  toast('Every RSVP is in. Run up the aisle!', 3);
}
function spawnPower() {
  const free = RSVP_SPOTS.filter(([x, y]) => DIST[x + y * COLS] >= 6 && !walkers().some(e => e.tx === x && e.ty === y));
  if (!free.length) { G.nextPowerAt = G.levelTime + 3; return; }
  const [x, y] = pick(free); G.power = { x, y, t: 9 }; Sound.chime();
}
function spawnDay() {
  const free = RSVP_SPOTS.filter(([x, y]) => DIST[x + y * COLS] >= 5 && !(G.power && G.power.x === x && G.power.y === y));
  if (!free.length) { G.dayAt = G.levelTime + 3; return; }
  const [x, y] = pick(free); G.dayPick = { x, y, t: 9 }; Sound.chime();
  toast('An extra day just appeared. Grab it!');
}
function activatePower() {
  const at = G.power; G.power = null; G.nextPowerAt = G.levelTime + 18;
  G.powerT = Math.max(4, 7.5 - 0.5 * (G.level - 1));
  for (const e of walkers()) {
    if (e.state !== 'chase' && e.state !== 'cool') continue;
    e.state = 'scared'; e.windup = 0;
    if (e.dir !== NONE && e.t > 0) { e.tx += DX[e.dir]; e.ty += DY[e.dir]; e.dir = opp(e.dir); e.t = 1 - e.t; }
  }
  if (invoice.state === 'chase') invoice.state = 'scared';
  hideBubble(); player.stuckT = 0;
  addScore(50, at.x, at.y); Sound.power(); Sound.setMode('power');
  toast('+1 to the rescue. Go seat them!');
}
function endPower() {
  G.powerT = 0;
  for (const e of walkers()) if (e.state === 'scared') e.state = 'chase';
  if (invoice.state === 'scared') invoice.state = 'chase';
  Sound.setMode('normal');
}
function seat(e) {
  Sound.seat();
  const p = e === invoice ? { x: e.x, y: e.y } : posOf(e);
  puff(p.x * T + 8, p.y * T + 8, ['#ff4f8b', '#fbf8f1', '#5ee6c1']);
  if (e === invoice) {
    e.state = 'seated'; e.timer = 6; e.x = INVOICE_HOME.x; e.y = INVOICE_HOME.y; e.rampStart = G.levelTime; e.scale = 1;
    addScore(500, p.x, p.y); toast('Invoice negotiated down.');
  } else if (e.kind === 'aunty') {
    e.state = 'seated'; e.timer = 10; e.dir = NONE; e.t = 0; e.tx = TABLE14_SEAT.x; e.ty = TABLE14_SEAT.y;
    addScore(300, p.x, p.y); toast('Aunty is seated at Table 14, far from the mic.', 2.8);
  } else if (e.kind === 'cousin') {
    e.state = 'gone'; e.timer = 8; e.dir = NONE; e.t = 0;
    G.cards.push({ x: p.x, y: p.y, t: 1.6 });
    addScore(200, p.x, p.y); toast('Gatecrasher handed a polite name card.');
  } else {
    e.state = 'playing'; e.timer = 10; e.dir = NONE; e.t = 0; e.tx = DJ_HOME.x; e.ty = DJ_HOME.y; e.windup = 0;
    G.waves = [];
    addScore(250, p.x, p.y); toast('The DJ is finally playing your song.');
  }
}
function release(e) {
  const scared = G.powerT > 0;
  if (e.kind === 'aunty') { e.tx = TABLE14_SEAT.x; e.ty = TABLE14_SEAT.y; e.state = scared ? 'scared' : 'cool'; e.timer = 1.5; }
  else if (e.kind === 'cousin') { const dr = pick(DOORS); e.tx = dr.x; e.ty = dr.y; e.state = scared ? 'scared' : 'chase'; }
  else { e.state = scared ? 'scared' : 'chase'; e.cool = 2; }
}
function stick(e) {
  player.stuckT = 1.8; e.state = 'cool'; e.timer = 5; e.talkT = 1.8; e.dir = NONE; e.t = 0;
  const p = posOf(player); e.tx = Math.round(p.x); e.ty = Math.round(p.y);
  ui.bubble.textContent = pick(AUNTY_LINES); ui.bubble.classList.add('show');
  Sound.babble();
  if (!G.toldMash) { G.toldMash = true; toast('Mash the arrows to excuse yourself.'); }
}
function flip() {
  const was = player.revT > 0; player.revT = 3; Sound.wub();
  if (!was) toast(pick(DJ_LINES));
  if (!G.toldFlip) { G.toldFlip = true; setTimeout(() => G.state === 'play' && toast('Your controls are flipped for a moment.'), 2300); }
}
function die(kind) {
  G.state = 'dying'; G.dyingT = 1.4; G.killer = kind; hideBubble();
  Sound.stopBgm(); Sound.caught();
}
function levelClear() {
  G.state = 'clear'; G.clearT = 0; Sound.stopBgm(); Sound.setMode('normal'); Sound.clear(); hideBubble();
  for (let k = 0; k < 120; k++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, s = 40 + Math.random() * 110;
    G.parts.push({ x: GATE.x * T + 8, y: GATE.y * T + 8, vx: Math.cos(a) * s / 16, vy: Math.sin(a) * s / 16, t: 2.6, col: pick(['#ff4f8b', '#ff9cc0', '#fbf8f1', '#5ee6c1', '#5fd8ff', '#c9a6ff']), g: 5, conf: true });
  }
  const timeBonus = Math.max(0, Math.round(120 - G.levelTime)) * 15, dayBonus = G.days * 300, lvlBonus = 500 * G.level;
  G.score += timeBonus + dayBonus + lvlBonus;
  $('clear-eyebrow').textContent = `Level ${G.level} cleared`;
  $('clear-title').innerHTML = `${levelName(G.level)}, <span class="hi">done.</span>`;
  $('clear-bonus').innerHTML = [
    ['RSVPs collected', `${G.total}`], ['Mandap bonus', `+${lvlBonus}`], ['Time bonus', `+${timeBonus}`],
    [`Days to spare (${G.days})`, `+${dayBonus}`],
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + `<dt class="total">Score</dt><dd class="total">${G.score.toLocaleString('en-IN')}</dd>`;
  G.final = G.level >= LEVELS.length;
  $('clear-soon').hidden = !G.final;
  $('final-save').hidden = !G.final;
  if (G.final) prepSave('save-final');
  if (G.final) $('clear-eyebrow').textContent = `All ${LEVELS.length} levels cleared`;
  $('next').textContent = G.final ? 'Play again' : `Next: ${levelName(G.level + 1)}`;
  saveBest();
}
function saveBest() { if (G.score > best) { best = G.score; try { localStorage.setItem('aisle-best', String(best)); } catch (e) {} } }
function gameOver() {
  G.state = 'over'; saveBest(); Sound.setMode('normal'); Sound.over();
  $('over-score').textContent = G.score.toLocaleString('en-IN');
  $('over-best').textContent = best.toLocaleString('en-IN');
  prepSave('save-over');
  setTimeout(() => G.state === 'over' && showOverlay('ov-over'), 700);
}

// ---------- Update ----------
const SNACKS = { laddoo: 100, mehendi: 200, cake: 300 };
function spawnSnack() {
  const k = pick(Object.keys(SNACKS));
  const sp = 2.3, s = { k, bob: Math.random() * 6 };
  if (Math.random() < 0.6) { const ltr = Math.random() < 0.5; Object.assign(s, { x: ltr ? -0.6 : COLS - 0.4, y: pick(CORR_R), vx: ltr ? sp : -sp, vy: 0 }); }
  else { const ttb = Math.random() < 0.5; Object.assign(s, { x: pick([1, 4, 7, 13, 16, 19]), y: ttb ? -0.6 : ROWS - 0.4, vx: 0, vy: ttb ? sp : -sp }); }
  G.snacks.push(s);
}
function updateWalker(e, dt) {
  e.talkT = Math.max(0, e.talkT - dt); e.cool -= dt;
  if (e.state === 'seated' || e.state === 'gone' || e.state === 'playing') { e.timer -= dt; if (e.timer <= 0) release(e); return; }
  if (e.state === 'cool') { e.timer -= dt; if (e.timer <= 0) e.state = 'chase'; }
  if (e.kind === 'dj' && e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) { G.waves.push({ x: e.tx, y: e.ty, dir: e.fireDir, ph: Math.random() * 6 }); e.cool = 3.4; Sound.djFire(); }
    return;
  }
  const choose = e.kind === 'dj'
    ? () => { if (e.state === 'chase' && e.cool <= 0) { const fd = djSight(e); if (fd !== NONE) { e.windup = 0.45; e.fireDir = fd; return null; } } return enemyChoose(e); }
    : () => enemyChoose(e);
  const before = e.tx + e.ty * 100 + e.t;
  advance(e, e.speed * (e.state === 'scared' ? 0.55 : 1) * dt, choose);
  if (before !== e.tx + e.ty * 100 + e.t) e.anim += dt;
}
function updateInvoice(dt, pp) {
  const inv = invoice;
  if (inv.state === 'seated') { inv.timer -= dt; if (inv.timer <= 0) inv.state = G.powerT > 0 ? 'scared' : 'chase'; return; }
  let dx = pp.x - inv.x, dy = pp.y - inv.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  let sp;
  if (inv.state === 'scared') { dx = -dx; dy = -dy; sp = 1.3; }
  else { const ramp = Math.min(1.6, (G.levelTime - inv.rampStart) * 0.025); sp = speeds().invoice + ramp; inv.scale = 1 + ramp * 0.2; }
  const wob = Math.sin(G.time * 2.3) * 0.3;
  inv.x = clamp(inv.x + (dx - dy * wob) * sp * dt, 1, COLS - 2);
  inv.y = clamp(inv.y + (dy + dx * wob) * sp * dt, 1, ROWS - 2);
}
function updatePlay(dt) {
  G.levelTime += dt;
  const p = player;
  p.revT = Math.max(0, p.revT - dt);
  if (G.powerT > 0) { G.powerT -= dt; if (G.powerT <= 0) endPower(); }

  const allowed = Math.min(Math.min(4, 1 + G.level), 1 + Math.floor(G.levelTime / 15));
  if (G.cousinCount < allowed) {
    G.cousinCount++; const c = walker('cousin', DOORS[(G.cousinCount - 1) % 2]);
    if (G.powerT > 0) c.state = 'scared';
    cousins.push(c); Sound.doorbell(); toast('Another gatecrasher just walked in.');
  }

  if (p.stuckT > 0) { p.stuckT -= dt; if (p.stuckT <= 0) hideBubble(); }
  else {
    const before = p.tx + p.ty * 100 + p.t;
    advance(p, speeds().player * dt, playerChoose);
    if (before !== p.tx + p.ty * 100 + p.t) p.anim += dt;
    if (p.dir === 1) p.face = 1; else if (p.dir === 3) p.face = -1;
  }
  const pp = posOf(p), ptx = Math.round(pp.x), pty = Math.round(pp.y), key = ptx + ',' + pty;
  if (key !== G.lastPTile) { G.lastPTile = key; if (isFloor(ptx, pty)) computeDist(ptx, pty); }
  if (G.rsvps.has(key)) { G.rsvps.delete(key); G.score += 10; Sound.rsvp(); if (G.rsvps.size === 0) openGate(); }
  if (gateOpen && ptx === GATE.x && pty === GATE.y && Math.abs(pp.y - GATE.y) < 0.2) { levelClear(); return; }

  if (G.power) {
    G.power.t -= dt;
    if (G.power.t <= 0) { G.power = null; G.nextPowerAt = G.levelTime + 10; }
    else if (G.power.x === ptx && G.power.y === pty) activatePower();
  } else if (G.powerT <= 0 && G.levelTime >= G.nextPowerAt) spawnPower();

  if (G.dayPick) {
    G.dayPick.t -= dt;
    if (G.dayPick.t <= 0) { G.dayPick = null; G.dayDone = true; }
    else if (G.dayPick.x === ptx && G.dayPick.y === pty) {
      const at = G.dayPick; G.dayPick = null; G.dayDone = true;
      G.days = Math.min(3, G.days + 1); addScore(100, at.x, at.y); Sound.seat();
      toast('Extra day! The wedding can wait one more day.');
    }
  } else if (!G.dayDone && G.levelTime >= G.dayAt) {
    if (G.days < 3) spawnDay(); else G.dayAt = G.levelTime + 8;
  }

  if (G.levelTime >= G.nextSnackAt) { spawnSnack(); G.nextSnackAt = G.levelTime + 13 + Math.random() * 6; }
  for (const s of G.snacks) {
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (d2(s, pp) < 0.75 * 0.75) { s.dead = true; addScore(SNACKS[s.k], s.x, s.y); Sound.snack(); }
    else if (s.x < -1 || s.x > COLS || s.y < -1 || s.y > ROWS) s.dead = true;
  }
  G.snacks = G.snacks.filter(s => !s.dead);

  for (const e of walkers()) updateWalker(e, dt);
  updateInvoice(dt, pp);

  for (const w of G.waves) {
    w.x += DX[w.dir] * 7 * dt; w.y += DY[w.dir] * 7 * dt;
    if (!isFloor(Math.round(w.x), Math.round(w.y))) w.dead = true;
    else if (d2(w, pp) < 0.5 * 0.5) { w.dead = true; flip(); }
  }
  G.waves = G.waves.filter(w => !w.dead);

  for (const e of walkers()) {
    if (e.state !== 'chase' && e.state !== 'cool' && e.state !== 'scared') continue;
    if (d2(posOf(e), pp) > 0.62 * 0.62) continue;
    if (e.state === 'scared') { seat(e); continue; }
    if (e.kind === 'aunty') { if (e.state === 'chase' && p.stuckT <= 0) stick(e); }
    else if (e.kind === 'cousin') { die('cousin'); return; }
    else if (p.revT <= 0) flip();
  }
  if (invoice.state === 'chase' || invoice.state === 'scared') {
    const r = 0.5 * invoice.scale + 0.1;
    if (d2(invoice, pp) < r * r) { if (invoice.state === 'scared') seat(invoice); else { die('invoice'); return; } }
  }
}
function update(dt) {
  G.time += dt;
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) ui.toast.classList.remove('show'); }
  for (const q of G.parts) { q.t -= dt; q.vy += (q.g || 0) * dt; q.x += q.vx * dt * 16; q.y += q.vy * dt * 16; if (q.conf) { q.vx *= 0.985; } }
  G.parts = G.parts.filter(q => q.t > 0);
  for (const q of G.pops) { q.t -= dt; q.y -= dt * 0.7; }
  G.pops = G.pops.filter(q => q.t > 0);
  for (const c of G.cards) c.t -= dt;
  G.cards = G.cards.filter(c => c.t > 0);

  if (G.state === 'ready') {
    G.readyT -= dt;
    if (G.readyT < 0.45) $('ready-txt').textContent = 'Go!';
    if (G.readyT <= 0) { G.state = 'play'; showOverlay(null); Sound.startBgm(); }
  } else if (G.state === 'play') updatePlay(dt);
  else if (G.state === 'dying') {
    G.dyingT -= dt;
    if (G.dyingT <= 0) {
      G.days--;
      if (G.days <= 0) { gameOver(); return; }
      const who = G.killer === 'cousin' ? 'A gatecrasher caught you.' : 'The budget blew out.';
      resetActors(); enterReady();
      toast(`${who} ${G.days} day${G.days === 1 ? '' : 's'} to go.`, 2.6);
    }
  } else if (G.state === 'clear') {
    G.clearT += dt;
    if (G.clearT > 1.8 && !overlays['ov-clear'].classList.contains('show')) showOverlay('ov-clear');
  }

  if (aunty && aunty.talkT > 0 && player.stuckT > 0) { const p = posOf(aunty); placeBubble(p.x * T + 8, p.y * T); }
}

// ---------- Drawing ----------
function disc(c, cx, cy, r, color) {
  c.fillStyle = color;
  for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(cx - w, cy + y, w * 2, 1); }
}
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
function drawBg() {
  const c = bg.getContext('2d'), R = rng(7);
  c.fillStyle = '#140a1a'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    c.fillStyle = (x + y) & 1 ? '#1e1028' : '#1a0d23'; c.fillRect(x * T, y * T, T, T);
    c.fillStyle = '#261432'; c.fillRect(x * T + 7, y * T + 6, 2, 4); c.fillRect(x * T + 6, y * T + 7, 4, 2);
  }
  // Dance floor
  for (let y = 7 * 2; y < 14 * 2; y++) for (let x = 7 * 2; x < 14 * 2; x++) { c.fillStyle = (x + y) & 1 ? '#2a1638' : '#35204a'; c.fillRect(x * 8, y * 8, 8, 8); }
  // The aisle
  c.fillStyle = '#8a1f4a'; c.fillRect(10 * T + 1, 4 * T - 4, T - 2, 16 * T + 4);
  c.fillStyle = '#f2b8c6'; c.fillRect(10 * T + 1, 4 * T - 4, 1, 16 * T + 4); c.fillRect(11 * T - 2, 4 * T - 4, 1, 16 * T + 4);
  for (let k = 0; k < 60; k++) { c.fillStyle = pick(['#ff9cc0', '#5ee6c1', '#f6b8c8', '#fbf8f1']); c.fillRect(10 * T + 3 + (R() * 10 | 0), 4 * T + (R() * 16 * T | 0), 1 + (R() < 0.3), 1); }
  // Walls
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const ch = grid[y][x];
    if (ch !== '#' && ch !== 'd' && ch !== 'E') continue;
    c.fillStyle = '#2c1839'; c.fillRect(x * T, y * T, T, T);
    c.fillStyle = '#3d2252'; if (!isWallish(x, y - 1)) c.fillRect(x * T, y * T, T, 2);
    c.fillStyle = '#170b1e'; if (!isWallish(x, y + 1)) c.fillRect(x * T, y * T + T - 2, T, 2);
  }
  // String-light wire along the top wall
  c.fillStyle = '#4a2a5e';
  for (let x = 4; x < W - 4; x++) c.fillRect(x, 8 + Math.round(Math.abs(Math.sin(x / 24 * Math.PI)) * 3), 1, 1);
  // Side doors
  for (const dx of [0, 20]) { const px = dx * T, py = 10 * T; c.fillStyle = '#8a5230'; c.fillRect(px + 2, py, 12, T); c.fillStyle = '#5a3320'; c.fillRect(px + 3, py + 1, 10, T - 1); c.fillStyle = '#e6aab4'; c.fillRect(px + (dx ? 4 : 10), py + 8, 2, 2); }
  // Entrance arch
  { const px = 10 * T, py = 20 * T; c.fillStyle = '#07080c'; c.fillRect(px + 1, py, T - 2, T); for (let i = 0; i < 8; i++) { c.fillStyle = i & 1 ? '#ff4f8b' : '#fbf8f1'; c.fillRect(px + 1 + i * 2, py, 2, 2); } }
  // Guest tables
  for (const t of TABLES) {
    const cx = t.x * T + 16, cy = t.y * T + 16;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.fillStyle = '#b97a86'; c.fillRect(Math.round(cx + Math.cos(a) * 13) - 2, Math.round(cy + Math.sin(a) * 13) - 2, 4, 4); c.fillStyle = '#e6aab4'; c.fillRect(Math.round(cx + Math.cos(a) * 13) - 2, Math.round(cy + Math.sin(a) * 13) - 2, 4, 1); }
    disc(c, cx + 1, cy + 2, 11, 'rgba(0,0,0,.35)');
    disc(c, cx, cy, 11, '#c9b99a'); disc(c, cx, cy - 1, 10, '#efe7d6');
    c.fillStyle = '#3fae6a'; c.fillRect(cx - 3, cy - 6, 6, 2);
    c.fillStyle = '#ff76a5'; c.fillRect(cx - 4, cy - 7, 2, 2); c.fillRect(cx + 2, cy - 7, 2, 2); c.fillStyle = '#fbf8f1'; c.fillRect(cx - 1, cy - 8, 2, 2);
    const w = tinyW(t.n); c.fillStyle = '#fbf8f1'; c.fillRect(cx - Math.ceil(w / 2) - 2, cy - 1, w + 4, 8);
    c.fillStyle = '#c9b99a'; c.fillRect(cx - Math.ceil(w / 2) - 2, cy + 6, w + 4, 1);
    tinyText(c, t.n, cx - Math.ceil(w / 2), cy, t.n === 14 ? '#c8323c' : '#2a1230');
  }
  // Gift table
  { const px = 2 * T, py = 17 * T; c.fillStyle = '#c9b99a'; c.fillRect(px + 2, py + 10, 28, 20); c.fillStyle = '#efe7d6'; c.fillRect(px + 2, py + 9, 28, 16);
    [[5, 3, 8, 8, '#e0559a'], [14, 6, 9, 6, '#3fa7a0'], [24, 4, 5, 8, '#5ee6c1'], [8, 13, 7, 7, '#7a4fd0'], [17, 14, 9, 6, '#c8323c']].forEach(([x, y, w, h, col]) => {
      c.fillStyle = col; c.fillRect(px + x, py + y, w, h); c.fillStyle = '#fbf8f1'; c.fillRect(px + x + (w >> 1), py + y, 1, h); c.fillRect(px + x, py + y + (h >> 1), w, 1);
    }); }
  // DJ booth
  { const px = T, py = T; c.fillStyle = '#2a2140'; c.fillRect(px + 1, py + 6, 46, 24); c.fillStyle = '#3d3160'; c.fillRect(px + 1, py + 6, 46, 5);
    for (const sx of [px + 3, px + 35]) { c.fillStyle = '#15121c'; c.fillRect(sx, py + 12, 10, 17); disc(c, sx + 5, py + 20, 3, '#6a6480'); disc(c, sx + 5, py + 20, 1, '#b9bcc8'); }
    c.fillStyle = '#15121c'; c.fillRect(px + 16, py + 13, 16, 9); c.fillStyle = '#b9bcc8'; for (let k = 0; k < 4; k++) c.fillRect(px + 18 + k * 4, py + 15, 2, 2);
    c.fillStyle = '#7a4fd0'; c.fillRect(px + 16, py + 24, 16, 4); }
  // Buffet
  { const px = 16 * T, py = 2 * T; c.fillStyle = '#b8a479'; c.fillRect(px + 1, py + 4, 46, 11); c.fillStyle = '#efe7d6'; c.fillRect(px + 1, py + 3, 46, 6);
    for (const dx of [8, 24, 40]) { c.fillStyle = '#8e939f'; c.fillRect(px + dx - 6, py + 4, 12, 3); c.fillStyle = '#c0c4cf'; c.fillRect(px + dx - 5, py, 10, 4); c.fillStyle = '#e8eaef'; c.fillRect(px + dx - 1, py - 1, 2, 1); } }
  // Mandap
  { const px = 7 * T, py = T, w = 7 * T, h = 3 * T;
    c.fillStyle = '#3d1530'; c.fillRect(px, py, w, h); c.fillStyle = '#5c1f45'; c.fillRect(px + 6, py + 10, w - 12, h - 16);
    c.fillStyle = '#7d2c5c'; for (let y = py + 12; y < py + h - 8; y += 4) for (let x = px + 8 + ((y >> 2) & 1) * 2; x < px + w - 8; x += 4) c.fillRect(x, y, 1, 1);
    c.fillStyle = '#ff4f8b'; c.fillRect(px, py, w, 4);
    for (let i = 0; i < 14; i++) { const col = i & 1 ? '#fbf8f1' : '#ff76a5'; c.fillStyle = col; c.fillRect(px + i * 8 + 1, py + 4, 6, 2); c.fillRect(px + i * 8 + 2, py + 6, 4, 1); }
    for (const gx of [px + 14, px + 26, px + w - 27, px + w - 15]) for (let y = py + 7; y < py + 30; y += 3) { c.fillStyle = (y / 3) & 1 ? '#fbf8f1' : '#ff9cc0'; c.fillRect(gx, y, 2, 2); }
    c.fillStyle = '#c98a96'; c.fillRect(px + 2, py + 2, 4, h - 2); c.fillRect(px + w - 6, py + 2, 4, h - 2);
    c.fillStyle = '#f2c4cc'; c.fillRect(px + 2, py + 2, 1, h - 2); c.fillRect(px + w - 6, py + 2, 1, h - 2);
    for (const sx of [px + 36, px + w - 46]) { c.fillStyle = '#c8323c'; c.fillRect(sx, py + 16, 10, 10); c.fillStyle = '#f2c4cc'; c.fillRect(sx, py + 14, 10, 3); c.fillRect(sx + 4, py + 12, 2, 2); }
    c.fillStyle = '#6b3a1f'; c.fillRect(px + w / 2 - 4, py + 26, 8, 4); c.fillStyle = '#8a5230'; c.fillRect(px + w / 2 - 4, py + 26, 8, 1);
    c.fillStyle = '#d8c69c'; for (let k = 0; k < 3; k++) c.fillRect(GATE.x * T, GATE.y * T + 6 + k * 4, T, 2);
  }
}
const isWallish = (x, y) => { if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return true; const ch = grid[y][x]; return ch === '#' || ch === 'd' || ch === 'E'; };

function spr(name, v, cx, cy, flipX, scale = 1) {
  const s = SPR[name][v || 'n'], w = Math.round(s.width * scale), h = Math.round(s.height * scale);
  const x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
  if (flipX) { b.save(); b.translate(x + w, y); b.scale(-1, 1); b.drawImage(s, 0, 0, w, h); b.restore(); }
  else b.drawImage(s, x, y, w, h);
}
function shadow(cx, cy, w = 10) { b.fillStyle = 'rgba(0,0,0,.38)'; b.fillRect(Math.round(cx - w / 2), Math.round(cy), w, 2); b.fillRect(Math.round(cx - w / 2 + 2), Math.round(cy + 2), w - 4, 1); }

function drawDecor() {
  const t = G.time;
  for (let i = 0, x = 6; x < W - 4; x += 8, i++) {
    const a = 0.45 + 0.55 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
    b.globalAlpha = a; b.fillStyle = i % 3 === 0 ? '#fbf8f1' : i % 3 === 1 ? '#5ee6c1' : '#ff9cc0';
    b.fillRect(x, 9 + Math.round(Math.abs(Math.sin(x / 24 * Math.PI)) * 3), 2, 2);
  }
  b.globalAlpha = 1;
  // Disco light on the dance floor
  b.save(); b.beginPath(); b.rect(7 * T, 7 * T, 7 * T, 7 * T); b.clip();
  const djOn = dj && dj.state === 'playing';
  [['#ff5fb2', 0], ['#5fd8ff', 2.1], ['#5ee6c1', 4.2]].forEach(([col, ph]) => {
    b.globalAlpha = djOn ? 0.2 : 0.11;
    disc(b, Math.round(10.5 * T + Math.cos(t * 0.9 + ph) * 34), Math.round(10.5 * T + Math.sin(t * 1.3 + ph) * 30), 14, col);
  });
  b.restore(); b.globalAlpha = 1;
  // DJ booth lights
  for (let k = 0; k < 6; k++) { b.fillStyle = ((Math.floor(t * 6) + k) % 3 === 0) ? pick(['#ff5fb2', '#5fd8ff', '#5ee6c1']) : '#3d3160'; b.fillRect(T + 6 + k * 7, T + 8, 3, 2); }
  // Havan flame
  const fx = 10.5 * T, fy = T + 25;
  b.fillStyle = '#c8323c'; b.fillRect(fx - 2, fy - 3, 4, 3);
  b.fillStyle = '#f0a030'; b.fillRect(fx - 1, fy - 5 - (Math.sin(t * 13) > 0 ? 1 : 0), 2, 3);
  b.fillStyle = '#ffd86b'; b.fillRect(fx - 1 + (Math.sin(t * 9) > 0 ? 1 : 0), fy - 6 - (Math.sin(t * 11) > 0 ? 1 : 0), 1, 2);
  // Gate
  const gx = GATE.x * T, gy = GATE.y * T;
  if (!gateOpen) {
    b.fillStyle = '#c98a96'; b.fillRect(gx - 1, gy + 4, 2, 10); b.fillRect(gx + T - 1, gy + 4, 2, 10);
    for (let i = 0; i < 8; i++) { b.fillStyle = i & 1 ? '#fbf8f1' : '#ff4f8b'; b.fillRect(gx + 1 + i * 2, gy + 7 + (i > 1 && i < 6 ? 1 : 0), 2, 2); }
  } else {
    const a = 0.35 + 0.3 * Math.sin(t * 5);
    b.globalAlpha = a; b.fillStyle = '#5ee6c1'; b.fillRect(gx, gy, T, T); b.globalAlpha = 1;
    for (let k = 0; k < 4; k++) {
      const yy = 19 * T - ((t * 60 + k * 64) % (16 * T));
      b.globalAlpha = 0.7; b.fillStyle = '#5ee6c1';
      b.fillRect(10 * T + 5, yy, 6, 1); b.fillRect(10 * T + 6, yy - 1, 4, 1); b.fillRect(10 * T + 7, yy - 2, 2, 1);
    }
    b.globalAlpha = 1;
  }
}

function drawWalker(e) {
  if (e.state === 'gone') return;
  let cx, cy;
  if (e.kind === 'aunty' && e.state === 'seated') { cx = TABLE14_PX.x; cy = TABLE14_PX.y; }
  else { const p = posOf(e); cx = p.x * T + 8; cy = p.y * T + 6; }
  const frame = Math.floor(e.anim * 7) % 2;
  let v = 'n';
  if (e.state === 'scared') { v = G.powerT < 1.6 && Math.floor(G.time * 8) % 2 ? 'w' : 'p'; cx += Math.sin(G.time * 45) * 0.7; }
  if (e.kind === 'dj' && e.windup > 0 && Math.floor(G.time * 16) % 2) v = 'w';
  const name = e.kind === 'aunty' ? (e.talkT > 0 && Math.floor(G.time * 8) % 2 ? 'aunty1' : 'aunty0') : e.kind + frame;
  shadow(cx, cy + 6);
  spr(name, v, cx, cy - (e.kind === 'aunty' && frame ? 1 : 0), e.dir === 3);
  if (e.state === 'scared') { b.fillStyle = '#9fd3e6'; b.fillRect(Math.round(cx) + 6, Math.round(cy) - 5, 1, 2); b.fillRect(Math.round(cx) + 5, Math.round(cy) - 3, 3, 2); }
  if (e.kind === 'dj' && e.state === 'playing') spr('noteu', 'n', cx + 6, cy - 9 - Math.round(Math.sin(G.time * 4) * 2));
  if (e.kind === 'aunty' && e.state === 'seated') { b.fillStyle = '#fbf8f1'; b.fillRect(Math.round(cx) + 7, Math.round(cy) + 1, 4, 3); b.fillStyle = '#c98a5e'; b.fillRect(Math.round(cx) + 8, Math.round(cy) + 2, 2, 1); }
}
function drawPlayer() {
  const p = player, pp = posOf(p);
  let cx = pp.x * T + 8, cy = pp.y * T + 6;
  if (G.state === 'dying') {
    const k = 1 - G.dyingT / 1.4;
    shadow(cx, cy + 6, 12);
    if (Math.floor(G.time * 12) % 2) spr('couple0', 'w', cx, cy - Math.sin(k * Math.PI) * 6, p.face < 0);
    else spr('couple0', 'n', cx, cy - Math.sin(k * Math.PI) * 6, p.face < 0);
    return;
  }
  if (p.stuckT > 0) cx += Math.sin(G.time * 30) * 0.6;
  const frame = Math.floor(p.anim * 8) % 2;
  shadow(cx, cy + 6, 12);
  spr('couple' + frame, 'n', cx, cy, p.face < 0);
  if (p.revT > 0) spr(Math.floor(G.time * 4) % 2 ? 'noteu' : 'notei', 'n', cx, cy - 11);
}

function draw() {
  b.drawImage(bg, 0, 0);
  drawDecor();
  for (const key of G.rsvps) {
    const [x, y] = key.split(',').map(Number);
    spr('env', 'n', x * T + 8, y * T + 8 + Math.round(Math.sin(G.time * 3 + x + y)));
  }
  if (G.power) {
    const cx = G.power.x * T + 8, cy = G.power.y * T + 8;
    if (G.power.t > 3 || Math.floor(G.time * 6) % 2) {
      b.globalAlpha = 0.25 + 0.15 * Math.sin(G.time * 6); disc(b, cx, cy, 10, '#ff4f8b'); b.globalAlpha = 1;
      spr('plus1', 'n', cx, cy + Math.round(Math.sin(G.time * 4)));
    }
  }
  if (G.dayPick && (G.dayPick.t > 3 || Math.floor(G.time * 6) % 2)) {
    const cx = G.dayPick.x * T + 8, cy = G.dayPick.y * T + 8;
    b.globalAlpha = 0.25 + 0.15 * Math.sin(G.time * 6); disc(b, cx, cy, 10, '#5ee6c1'); b.globalAlpha = 1;
    spr('day', 'n', cx, cy + Math.round(Math.sin(G.time * 4)));
  }
  for (const w of G.waves) {
    const cx = w.x * T + 8, cy = w.y * T + 8, s = Math.sin(G.time * 18 + w.ph) * 2;
    spr('noteu', 'n', cx - DX[w.dir] * 5 + (w.dir % 2 ? 0 : s), cy - DY[w.dir] * 5 + (w.dir % 2 ? s : 0));
    spr('notei', 'n', cx + DX[w.dir] * 3 - (w.dir % 2 ? 0 : s), cy + DY[w.dir] * 3 - (w.dir % 2 ? s : 0));
  }
  for (const c of G.cards) { b.globalAlpha = Math.min(1, c.t * 2); spr('card', 'n', c.x * T + 8, c.y * T + 8 - (1.6 - c.t) * 6); b.globalAlpha = 1; }
  if (player) {
    const list = [...walkers(), player].sort((a, c) => posOf(a).y - posOf(c).y);
    for (const e of list) e === player ? drawPlayer() : drawWalker(e);
    if (invoice.state !== 'seated' || Math.floor(G.time * 4) % 2) {
      const cx = invoice.x * T + 8, cy = invoice.y * T + 4 + Math.sin(G.time * 3) * 2;
      shadow(invoice.x * T + 8, invoice.y * T + 13, 10);
      const v = invoice.state === 'scared' ? (G.powerT < 1.6 && Math.floor(G.time * 8) % 2 ? 'w' : 'p') : 'n';
      spr('invoice0', v, cx, cy, false, invoice.state === 'seated' ? 0.75 : invoice.scale);
    }
  }
  for (const s of G.snacks) spr(s.k, 'n', s.x * T + 8, s.y * T + 6 + Math.sin(G.time * 4 + s.bob) * 2);
  for (const q of G.parts) { b.globalAlpha = Math.min(1, q.t * 2); b.fillStyle = q.col; b.fillRect(Math.round(q.x), Math.round(q.y), q.conf ? 2 : 1, q.conf ? (Math.sin(q.t * 20) > 0 ? 2 : 1) : 1); }
  b.globalAlpha = 1;
  for (const q of G.pops) {
    const w = tinyW(q.text), x = Math.round(q.x * T + 8 - w / 2), y = Math.round(q.y * T - 4);
    b.globalAlpha = Math.min(1, q.t * 2);
    tinyText(b, q.text, x + 1, y + 1, '#1a0e22'); tinyText(b, q.text, x, y, '#5ee6c1');
    b.globalAlpha = 1;
  }
  out.imageSmoothingEnabled = false;
  out.drawImage(buf, 0, 0, cvs.width, cvs.height);
}

// ---------- HUD ----------
const hudCache = {};
function setText(el, key, v) { if (hudCache[key] !== v) { hudCache[key] = v; el.textContent = v; } }
function hud() {
  setText(ui.score, 'score', G.score.toLocaleString('en-IN'));
  setText(ui.rsvps, 'rsvps', gateOpen ? 'All in' : `${G.total - G.rsvps.size}/${G.total}`);
  setText(ui.days, 'days', String(Math.max(G.days, 0)));
  ui.days.classList.toggle('low', G.days <= 1);
  setText(ui.level, 'level', levelName(G.level));
  setText(ui.levelLbl, 'lvl', `Level ${G.level}`);
  const flagOn = player && player.revT > 0 && G.state === 'play';
  ui.flag.classList.toggle('show', !!flagOn);
  if (flagOn) setText(ui.flag, 'flag', '♫ Controls flipped');
}

// ---------- Loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  if (G.state !== 'paused') update(dt);
  draw(); hud();
  requestAnimationFrame(frame);
}

// ---------- Input ----------
const KEYS = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
let pausedFrom = null;
function pause() { if (G.state === 'play' || G.state === 'ready') { pausedFrom = G.state; G.state = 'paused'; Sound.stopBgm(); hideBubble(); showOverlay('ov-pause'); } }
function resume() { if (G.state !== 'paused') return; Sound.init(); $('rules').classList.remove('show'); $('lbm').classList.remove('show'); G.state = pausedFrom; showOverlay(pausedFrom === 'ready' ? 'ov-ready' : null); if (pausedFrom === 'play') Sound.startBgm(); last = performance.now(); }
document.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code in KEYS) { e.preventDefault(); setWant(KEYS[e.code]); return; }
  if (e.code === 'Escape' && $('lbm').classList.contains('show')) { closeBoard(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { G.state === 'paused' ? resume() : pause(); }
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyR') restart();
  else if ((e.code === 'Enter' || e.code === 'Space') && (G.state === 'title' || G.state === 'over')) { e.preventDefault(); rules.classList.contains('show') ? $('play').click() : begin(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

let touch = null;
ui.stage.addEventListener('touchstart', e => { const t0 = e.touches[0]; touch = { x: t0.clientX, y: t0.clientY }; }, { passive: true });
ui.stage.addEventListener('touchmove', e => {
  if (!touch) return; const t0 = e.touches[0], dx = t0.clientX - touch.x, dy = t0.clientY - touch.y;
  if (G.state === 'play' || G.state === 'ready') e.preventDefault();
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
  setWant(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
  touch = { x: t0.clientX, y: t0.clientY };
}, { passive: false });
ui.stage.addEventListener('touchend', () => { touch = null; });
document.querySelectorAll('#pad button').forEach(btn => {
  btn.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); setWant(+btn.dataset.dir); btn.classList.add('on'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, () => btn.classList.remove('on')));
});

function begin() { Sound.init(); G.saved = false; newRun(); startGame(); }
const rules = $('rules');
function openRules() {
  if (G.state === 'play' || G.state === 'ready') { pausedFrom = G.state; G.state = 'paused'; Sound.stopBgm(); hideBubble(); }
  $('play').textContent = G.state === 'paused' ? 'Resume' : 'Play';
  rules.classList.add('show'); $('play').focus();
}
$('play').addEventListener('click', () => {
  rules.classList.remove('show'); Sound.init();
  if (G.state === 'paused') resume(); else begin();
});
$('how').addEventListener('click', openRules);

// ---------- Leaderboard ----------
// Each game gets a run id from the server; a score can be saved once per run.
let runId = null, myScoreId = null;
let savedName = ''; try { savedName = localStorage.getItem('aisle-name') || ''; } catch (e) {}
function newRun() {
  runId = null;
  fetch('/api/run', { method: 'POST' }).then(r => r.ok ? r.json() : null).then(j => { if (j) runId = j.id; }).catch(() => {});
}
function prepSave(id) {
  const form = $(id), done = $(id + '-done');
  form.hidden = !!G.saved; done.hidden = !G.saved;
  form.querySelector('.msg').textContent = ''; form.querySelector('.msg').classList.remove('err');
  form.name.value = savedName;
}
const SAVE_ERRORS = {
  name: 'Pick a name of 1 to 16 characters.',
  'name-blocked': 'Please pick a different name.',
  run: 'This game is already on the leaderboard.',
  score: 'That score couldn\u2019t be saved.',
};
document.querySelectorAll('form[data-save]').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = form.querySelector('.msg'), btn = form.querySelector('button'), name = form.name.value.trim();
    if (!name) return;
    msg.classList.remove('err'); msg.textContent = 'Saving\u2026'; btn.disabled = true;
    try {
      if (!runId) throw new Error('Couldn\u2019t reach the leaderboard. Try again in a moment.');
      const r = await fetch('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ run: runId, name, score: G.score, level: G.level }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(SAVE_ERRORS[j.error] || 'Couldn\u2019t save that. Try again in a moment.');
      G.saved = true; myScoreId = j.id; savedName = name;
      try { localStorage.setItem('aisle-name', name); } catch (err) {}
      const done = $(form.id + '-done');
      done.querySelector('p').textContent = `Saved! You're #${j.rank} of ${j.total}.`;
      form.hidden = true; done.hidden = false;
    } catch (err) { msg.classList.add('err'); msg.textContent = err.message; }
    btn.disabled = false;
  });
});

const lbm = $('lbm');
async function openBoard() {
  if (G.state === 'play' || G.state === 'ready') { pausedFrom = G.state; G.state = 'paused'; Sound.stopBgm(); hideBubble(); }
  lbm.classList.add('show'); $('lb-close').focus();
  const list = $('lb-list'), status = $('lb-status');
  list.replaceChildren(); status.textContent = 'Loading\u2026';
  try {
    const r = await fetch('/api/leaderboard'); if (!r.ok) throw new Error();
    const { top } = await r.json();
    status.textContent = top.length ? '' : 'No scores yet. Finish a game and be the first.';
    top.forEach((row, i) => {
      const li = document.createElement('li'); if (row.id === myScoreId) li.className = 'me';
      const rk = document.createElement('span'); rk.className = 'rk'; rk.textContent = i + 1;
      const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = row.name;
      const lv = document.createElement('small'); lv.textContent = levelName(row.level); nm.append(lv);
      const sc = document.createElement('b'); sc.className = 'sc'; sc.textContent = row.score.toLocaleString('en-IN');
      li.append(rk, nm, sc); list.append(li);
    });
  } catch (e) { status.textContent = 'Couldn\u2019t load the leaderboard. Try again in a moment.'; }
}
function closeBoard() {
  lbm.classList.remove('show');
  if (G.state === 'paused' && !rules.classList.contains('show')) resume();
}
$('lb').addEventListener('click', openBoard);
$('lb-close').addEventListener('click', closeBoard);
document.querySelectorAll('[data-open-lb]').forEach(b => b.addEventListener('click', openBoard));

// Restart: a fresh wedding from Level 1 with three days, from any screen.
function restart() {
  rules.classList.remove('show'); lbm.classList.remove('show'); hideBubble();
  Sound.stopBgm(); Sound.setMode('normal'); Sound.init();
  G.parts = []; G.pops = []; G.final = false;
  begin();
  toast('Fresh start. Three days to go.');
}
$('restart').addEventListener('click', e => { e.currentTarget.blur(); restart(); });
$('again').addEventListener('click', begin);
$('resume').addEventListener('click', resume);
$('next').addEventListener('click', () => { Sound.init(); if (G.final) { G.final = false; begin(); } else { G.level++; startLevel(); } });
const muteBtn = $('mute');
function syncMute() { $('mute-long').textContent = Sound.muted ? 'Sound off' : 'Sound on'; $('mute-short').textContent = Sound.muted ? '\u{1F507}' : '\u{1F50A}'; muteBtn.setAttribute('aria-pressed', String(Sound.muted)); }
function toggleMute() { Sound.setMuted(!Sound.muted); syncMute(); }
muteBtn.addEventListener('click', toggleMute); syncMute();

$('share').addEventListener('click', async () => {
  const url = `${location.origin}/?beat=${G.score}`;
  const text = `I scored ${G.score.toLocaleString('en-IN')} in PlusOne Wedding. Beat my score:`;
  try {
    if (navigator.share) { await navigator.share({ title: 'PlusOne Wedding', text, url }); return; }
    await navigator.clipboard.writeText(`${text} ${url}`); toast('Link copied. Send it to someone.');
  } catch (e) { if (e && e.name !== 'AbortError') toast('Copy this: ' + url, 4); }
});


// Cast portraits beside the board.
document.querySelectorAll('canvas[data-sprite]').forEach(c => {
  const s = SPR[c.dataset.sprite].n; c.width = s.width; c.height = s.height; c.getContext('2d').drawImage(s, 0, 0);
});

// ---------- Boot ----------
drawBg();
G.cousinCount = 1; G.rsvps = new Set(RSVP_SPOTS.map(([x, y]) => x + ',' + y)); G.total = G.rsvps.size; resetActors();
fitCanvas();
window.__aisle = { G, get player() { return player; }, setWant, begin };
requestAnimationFrame(frame);
})();
