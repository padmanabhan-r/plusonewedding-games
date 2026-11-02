// PlusOne Wedding: Wedding Feast – retro 90s arcade, South Indian dining hall.
(() => {
'use strict';

// ---------- Board ----------
const T = 16, COLS = 21, ROWS = 21, W = COLS * T, H = ROWS * T;
// Tables are 2-wide × 1-tall rectangles (TT = one row, horizontal).
// Counter row 1: not walkable. Row 2: pickup zone.
// Tables are drawn dynamically from G.tables — no T tiles in MAP.
// This lets us have different table layouts per round without a static bg.
const MAP = [
  '#####################',
  '#CCCCCCCCCCCCCCCCCCC#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#...................#',
  '#..........P........#',
  '#####################',
];
const grid = MAP.map(r => r.split(''));
const isFloor = (x, y) =>
  y >= 0 && y < ROWS && x >= 0 && x < COLS &&
  (grid[y][x] === '.' || grid[y][x] === 'P');
// Tables are logical obstacles derived from G.tables at runtime
function isTableTile(x, y) {
  if (!G.tables) return false;
  return G.tables.some(t => (x === t.tx || x === t.tx+1) && y === t.ty);
}
const isWalkable = (x, y) => isFloor(x, y) && !isTableTile(x, y);
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0]; // 0=up 1=right 2=down 3=left
const NONE = -1;
const START = { x: 11, y: 19 };

// Belt: food scrolls left across the counter. Player stands in row 2 to catch a food.
const BELT_START = T;           // pixel x where belt begins (after left wall)
const BELT_END   = W - T;       // pixel x where belt ends (before right wall)
const BELT_PX    = BELT_END - BELT_START; // 304px of belt

// Table layouts — each round adds one more row at the bottom to fill the hall.
// Breakfast: 12 tables (3 rows).  Lunch: 16 tables (4 rows).  Dinner: 20 tables (5 rows).
const ROUND_LAYOUTS = [
  [ // Breakfast — 3 rows of 4 (top, middle, bottom)
    {tx:1,ty:4},  {tx:6,ty:4},  {tx:11,ty:4},  {tx:16,ty:4},
    {tx:1,ty:9},  {tx:6,ty:9},  {tx:11,ty:9},  {tx:16,ty:9},
    {tx:1,ty:15}, {tx:6,ty:15}, {tx:11,ty:15}, {tx:16,ty:15},
  ],
  [ // Lunch — 4 rows of 4 (evenly spaced top-to-bottom)
    {tx:1,ty:4},  {tx:6,ty:4},  {tx:11,ty:4},  {tx:16,ty:4},
    {tx:1,ty:8},  {tx:6,ty:8},  {tx:11,ty:8},  {tx:16,ty:8},
    {tx:1,ty:12}, {tx:6,ty:12}, {tx:11,ty:12}, {tx:16,ty:12},
    {tx:1,ty:16}, {tx:6,ty:16}, {tx:11,ty:16}, {tx:16,ty:16},
  ],
  [ // Dinner — 5 rows of 4 (tight 3-row spacing, full hall)
    {tx:1,ty:4},  {tx:6,ty:4},  {tx:11,ty:4},  {tx:16,ty:4},
    {tx:1,ty:7},  {tx:6,ty:7},  {tx:11,ty:7},  {tx:16,ty:7},
    {tx:1,ty:10}, {tx:6,ty:10}, {tx:11,ty:10}, {tx:16,ty:10},
    {tx:1,ty:13}, {tx:6,ty:13}, {tx:11,ty:13}, {tx:16,ty:13},
    {tx:1,ty:16}, {tx:6,ty:16}, {tx:11,ty:16}, {tx:16,ty:16},
  ],
];
// 20 entries — covers all tables in the largest (dinner) layout
const TABLE_GUESTS = [
  ['elder','aunty'], ['uncle','youth'], ['youth','elder'], ['aunty','uncle'],
  ['elder','uncle'], ['aunty','aunty'], ['uncle','youth'], ['elder','youth'],
  ['uncle','uncle'], ['aunty','elder'], ['youth','aunty'], ['uncle','elder'],
  ['elder','youth'], ['aunty','uncle'], ['uncle','aunty'], ['youth','elder'],
  ['aunty','youth'], ['uncle','elder'], ['elder','uncle'], ['youth','aunty'],
];

// ---------- Rounds & Foods ----------
// beltSpeed: how fast the food conveyor moves (px/s). Faster = harder to grab right food.
const ROUNDS = [
  { name:'Breakfast', orderTime:24, spawnInt:8,   duration:90,  maxOrders:5,  beltSpeed:22 },
  { name:'Lunch',     orderTime:18, spawnInt:5,   duration:105, maxOrders:8,  beltSpeed:40 },
  { name:'Dinner',    orderTime:13, spawnInt:3,   duration:120, maxOrders:14, beltSpeed:65 },
];
const ROUND_FOODS = [
  [ // Breakfast
    { id:'idli',   label:'Idli'   },
    { id:'dosa',   label:'Dosa'   },
    { id:'pongal', label:'Pongal' },
    { id:'poori',  label:'Poori'  },
    { id:'vada',   label:'Vada'   },
    { id:'coffee', label:'Coffee' },
  ],
  [ // Lunch
    { id:'rice',    label:'Rice'    },
    { id:'sambar',  label:'Sambar'  },
    { id:'rasam',   label:'Rasam'   },
    { id:'kootu',   label:'Kootu'   },
    { id:'payasam', label:'Payasam' },
    { id:'appam',   label:'Appam'   },
  ],
  [ // Dinner — fancy/fusion items for the wedding reception
    { id:'biryani',  label:'Biryani'  },
    { id:'cake',     label:'Cake'     },
    { id:'pasta',    label:'Pasta'    },
    { id:'icecream', label:'IceCream' },
    { id:'halwa',    label:'Halwa'    },
    { id:'parotta',  label:'Parotta'  },
  ],
];

// ---------- Food Pixel-Art (16×16 canvases, drawn once at startup) ----------
// Each function draws onto a 16×16 ctx. Hard pixel edges, retro style.
const FOOD_DRAW = {
  idli(c) {
    // two white oval idlis on a green banana leaf
    c.fillStyle='#1e6b1e'; c.fillRect(0,10,16,6);
    c.fillStyle='#2d9c2d'; c.fillRect(1,11,14,4);
    c.fillStyle='#145014'; c.fillRect(1,13,14,1);
    // idli 1
    c.fillStyle='#1a0800'; c.fillRect(0,3,6,6);
    c.fillStyle='#f8f4ec'; c.fillRect(1,4,4,4);
    c.fillStyle='#d8d0c0'; c.fillRect(2,5,2,2);
    // idli 2
    c.fillStyle='#1a0800'; c.fillRect(9,3,6,6);
    c.fillStyle='#f8f4ec'; c.fillRect(10,4,4,4);
    c.fillStyle='#d8d0c0'; c.fillRect(11,5,2,2);
    // sambar puddle between
    c.fillStyle='#c04010'; c.fillRect(6,7,3,2);
    // coconut chutney
    c.fillStyle='#a0d040'; c.fillRect(6,5,3,2);
  },
  dosa(c) {
    // thin golden oval crepe with crispy bits
    c.fillStyle='#1a0800';
    c.fillRect(3,0,10,1); c.fillRect(1,1,14,1);
    c.fillRect(0,2,16,7); c.fillRect(1,9,14,1); c.fillRect(3,10,10,1);
    c.fillStyle='#d49010';
    c.fillRect(3,1,10,1); c.fillRect(1,2,14,7); c.fillRect(3,9,10,1);
    c.fillStyle='#f0c020'; c.fillRect(3,2,10,3);  // top highlight
    c.fillStyle='#a06808';
    c.fillRect(1,2,1,7); c.fillRect(14,2,1,7);   // dark edges
    c.fillStyle='#b87a10';
    c.fillRect(4,5,2,2); c.fillRect(9,4,2,2); c.fillRect(7,7,2,1); // texture spots
    c.fillStyle='#f0e0c8'; c.fillRect(5,8,6,1);  // chutney
  },
  pongal(c) {
    // clay bowl of yellow pongal with pepper & cashews
    c.fillStyle='#7a5010'; // bowl
    c.fillRect(2,8,12,1); c.fillRect(1,9,14,4); c.fillRect(2,13,12,1); c.fillRect(3,14,10,1);
    c.fillStyle='#e8d055'; c.fillRect(2,1,12,7);  // pongal fill
    c.fillStyle='#f8ec70'; c.fillRect(3,2,10,5);  // highlight
    c.fillStyle='#d8b830'; c.fillRect(2,7,12,2);  // bowl rim inner
    c.fillStyle='#1a0800'; // pepper
    c.fillRect(4,4,1,1); c.fillRect(7,3,1,1); c.fillRect(10,4,1,1); c.fillRect(6,5,1,1); c.fillRect(9,3,1,1);
    c.fillStyle='#d4a030'; // cashews
    c.fillRect(3,3,2,1); c.fillRect(11,5,2,1); c.fillRect(8,4,2,1);
    c.fillStyle='#9a7020'; c.fillRect(2,8,12,1);  // rim shadow
  },
  poori(c) {
    // puffed golden fried bread with potato curry
    c.fillStyle='#1a0800';
    c.fillRect(3,0,10,1); c.fillRect(1,1,14,1);
    c.fillRect(0,2,16,9); c.fillRect(1,11,14,1); c.fillRect(3,12,10,1);
    c.fillStyle='#c88c08'; c.fillRect(3,1,10,1); c.fillRect(1,2,14,9); c.fillRect(3,11,10,1);
    c.fillStyle='#e0a818'; c.fillRect(2,2,12,7);  // brighter top
    c.fillStyle='#f8c830'; c.fillRect(4,3,8,4);   // highlight puff
    c.fillStyle='#fff060'; c.fillRect(5,4,6,2);   // specular
    c.fillStyle='#906008'; c.fillRect(1,2,1,9); c.fillRect(14,2,1,9); // edges
    // potato curry sides
    c.fillStyle='#c8a030'; c.fillRect(1,12,3,2); c.fillRect(12,12,3,2);
    c.fillStyle='#e0c040'; c.fillRect(2,13,2,1); c.fillRect(13,13,2,1);
  },
  vada(c) {
    // golden donut ring with hole
    c.fillStyle='#1a0800';
    c.fillRect(2,0,12,1); c.fillRect(1,1,14,1);
    c.fillRect(0,2,16,10); c.fillRect(1,12,14,1); c.fillRect(2,13,12,1);
    c.fillStyle='#c07808'; c.fillRect(2,1,12,1); c.fillRect(1,2,14,10); c.fillRect(2,12,12,1);
    c.fillStyle='#d89018'; c.fillRect(2,2,12,5);  // top sheen
    c.fillStyle='#1a0800'; // hole
    c.fillRect(5,4,6,6); c.fillStyle='#2a1000'; c.fillRect(6,5,4,4);
    // texture dots
    c.fillStyle='#a06010';
    c.fillRect(2,4,1,1); c.fillRect(13,5,1,1); c.fillRect(2,8,1,2); c.fillRect(13,7,1,2);
    c.fillStyle='#f0e080'; // sesame
    c.fillRect(3,5,1,1); c.fillRect(12,5,1,1); c.fillRect(3,9,1,1); c.fillRect(12,9,1,1);
  },
  coffee(c) {
    // South Indian filter coffee in steel tumbler on saucer
    c.fillStyle='#1a0800';
    c.fillRect(2,0,12,1); c.fillRect(1,1,14,9); c.fillRect(2,10,12,1);
    c.fillStyle='#3d2008'; c.fillRect(2,1,12,9);  // dark coffee
    c.fillStyle='#c89060'; c.fillRect(2,1,12,3);  // froth layer
    c.fillStyle='#e0b878'; c.fillRect(3,1,10,2);
    c.fillStyle='#f0d090'; c.fillRect(4,1,8,1);   // top froth bright
    c.fillStyle='#d0c8c0'; // steel rim
    c.fillRect(2,0,12,1); c.fillStyle='#e8e8e8'; c.fillRect(3,0,10,1);
    // saucer
    c.fillStyle='#1a0800'; c.fillRect(0,11,16,1); c.fillRect(1,12,14,1);
    c.fillStyle='#c8c0b8'; c.fillRect(1,11,14,1);
    c.fillStyle='#e0d8d0'; c.fillRect(2,11,12,1);
    // steam
    c.fillStyle='rgba(255,255,255,0.7)';
    c.fillRect(5,0,1,1); c.fillRect(9,0,1,1);
  },
  rice(c) {
    // white rice heap on banana leaf
    c.fillStyle='#1e6b1e'; c.fillRect(0,10,16,6);
    c.fillStyle='#2d9c2d'; c.fillRect(1,11,14,4);
    c.fillStyle='#145014'; c.fillRect(1,13,14,1);
    c.fillStyle='#1a0800';
    c.fillRect(4,0,8,1); c.fillRect(2,1,12,1); c.fillRect(1,2,14,7); c.fillRect(2,9,12,1); c.fillRect(4,10,8,1);
    c.fillStyle='#f8f6f0';
    c.fillRect(4,1,8,1); c.fillRect(2,2,12,7); c.fillRect(4,9,8,1);
    c.fillStyle='#ffffff'; c.fillRect(5,2,4,2);  // highlight
    c.fillStyle='#f0d880'; c.fillRect(6,4,4,2);  // ghee
    c.fillStyle='#e04020'; c.fillRect(10,6,2,2); // pickle
    c.fillStyle='#60b020'; c.fillRect(3,6,2,2);  // curry leaf
  },
  sambar(c) {
    // orange-brown sambar in bowl
    c.fillStyle='#7a5010';
    c.fillRect(2,1,12,1); c.fillRect(1,2,14,9); c.fillRect(2,11,12,1); c.fillRect(3,12,10,1);
    c.fillStyle='#c04818'; c.fillRect(2,2,12,9);
    c.fillStyle='#d85820'; c.fillRect(3,2,10,7);
    c.fillStyle='#f07030'; c.fillRect(4,3,8,5);
    c.fillStyle='#e8a020'; c.fillRect(4,6,2,2);  // onion
    c.fillStyle='#c02010'; c.fillRect(9,5,2,2);  // tomato
    c.fillStyle='#50a020'; c.fillRect(6,7,2,2);  // drumstick
    c.fillStyle='#ff8040'; c.fillRect(5,3,3,1);  // surface sheen
    c.fillStyle='#f0c020'; c.fillRect(9,3,3,1);  // turmeric
    c.fillStyle='#9a5020'; c.fillRect(2,1,12,1); // rim
  },
  rasam(c) {
    // thin red/tomato rasam
    c.fillStyle='#7a3010';
    c.fillRect(3,2,10,1); c.fillRect(2,3,12,8); c.fillRect(3,11,10,1); c.fillRect(4,12,8,1);
    c.fillStyle='#c01808'; c.fillRect(3,3,10,8);
    c.fillStyle='#d82018'; c.fillRect(4,3,8,6);
    c.fillStyle='#f04030'; c.fillRect(5,4,6,4);
    c.fillStyle='#ff6050'; c.fillRect(5,5,2,2); c.fillRect(9,5,2,2); // tomato bits
    c.fillStyle='#1a0800'; c.fillRect(7,4,1,1); c.fillRect(10,7,1,1); // pepper
    c.fillStyle='#50c020'; c.fillRect(8,4,2,1); // coriander
    c.fillStyle='#ff8060'; c.fillRect(5,3,4,1); // highlight
    c.fillStyle='#802010'; c.fillRect(3,2,10,1);
  },
  kootu(c) {
    // thick green coconut-based vegetable curry
    c.fillStyle='#286010';
    c.fillRect(2,1,12,1); c.fillRect(1,2,14,9); c.fillRect(2,11,12,1); c.fillRect(3,12,10,1);
    c.fillStyle='#3a7820'; c.fillRect(2,2,12,9);
    c.fillStyle='#50a028'; c.fillRect(3,2,10,7);
    c.fillStyle='#68c030'; c.fillRect(4,3,8,5);
    c.fillStyle='#f0e8c8'; c.fillRect(5,6,2,1); c.fillRect(9,5,2,1); c.fillRect(7,7,2,1); // coconut
    c.fillStyle='#e8b820'; c.fillRect(4,6,2,2); // potato
    c.fillStyle='#c84018'; c.fillRect(10,6,2,2); // carrot
    c.fillStyle='#1a0800'; c.fillRect(6,3,1,1); c.fillRect(9,8,1,1); // mustard seeds
    c.fillStyle='#208010'; c.fillRect(8,3,2,1); // curry leaf
    c.fillStyle='#286010'; c.fillRect(2,1,12,1);
  },
  payasam(c) {
    // creamy white payasam with saffron swirls
    c.fillStyle='#c0902a';
    c.fillRect(2,1,12,1); c.fillRect(1,2,14,9); c.fillRect(2,11,12,1); c.fillRect(3,12,10,1);
    c.fillStyle='#f0e8d0'; c.fillRect(2,2,12,9);
    c.fillStyle='#f8f0e0'; c.fillRect(3,2,10,7);
    c.fillStyle='#fff8f0'; c.fillRect(5,3,6,4);
    c.fillStyle='#f0a820'; c.fillRect(4,5,3,1); c.fillRect(9,6,3,1); // saffron
    c.fillStyle='#e89010'; c.fillRect(6,7,4,1);
    c.fillStyle='#5a3010'; // cardamom/raisin
    c.fillRect(6,3,1,1); c.fillRect(10,4,1,1); c.fillRect(5,8,1,1); c.fillRect(9,8,1,1);
    c.fillStyle='#d4a030'; c.fillRect(3,5,2,1); c.fillRect(11,4,2,1); // cashew
    c.fillStyle='#c0902a'; c.fillRect(2,1,12,1);
  },
  appam(c) {
    // lacy rice appam (Kerala pancake)
    c.fillStyle='#1a0800';
    c.fillRect(3,1,10,1); c.fillRect(1,2,14,1);
    c.fillRect(0,3,16,8); c.fillRect(1,11,14,1); c.fillRect(3,12,10,1);
    c.fillStyle='#f4f0e4'; c.fillRect(3,2,10,1); c.fillRect(1,3,14,8); c.fillRect(3,11,10,1);
    c.fillStyle='#f8f8f0'; c.fillRect(4,4,8,5); // soft white center
    // lacy edges (darker holes)
    c.fillStyle='#d8d0b8';
    c.fillRect(2,4,1,1); c.fillRect(13,4,1,1); c.fillRect(2,7,1,1); c.fillRect(13,7,1,1);
    c.fillRect(4,3,1,1); c.fillRect(11,3,1,1); c.fillRect(4,11,1,1); c.fillRect(11,11,1,1);
    // lacy holes in body
    c.fillStyle='#ece8d0';
    c.fillRect(3,5,1,1); c.fillRect(5,3,1,1); c.fillRect(10,3,1,1); c.fillRect(12,5,1,1);
    c.fillRect(3,9,1,1); c.fillRect(6,11,1,1); c.fillRect(10,11,1,1); c.fillRect(12,9,1,1);
    c.fillStyle='#c8a818'; c.fillRect(1,3,1,8); c.fillRect(14,3,1,8); // golden rim
  },
  biryani(c) {
    // layered saffron biryani
    c.fillStyle='#7a5010';
    c.fillRect(1,2,14,1); c.fillRect(0,3,16,9); c.fillRect(1,12,14,1); c.fillRect(2,13,12,1);
    c.fillStyle='#c88010'; c.fillRect(1,3,14,9);
    c.fillStyle='#e8a018'; c.fillRect(2,3,12,7);
    c.fillStyle='#f8c028'; c.fillRect(3,3,10,5);
    c.fillStyle='#c07008'; c.fillRect(2,8,12,2); // dark layer
    c.fillStyle='#8a2808'; c.fillRect(5,5,2,2); c.fillRect(10,6,2,2); // fried onion
    c.fillStyle='#c04810'; c.fillRect(3,6,2,2); c.fillRect(11,5,2,2); // meat/veg
    c.fillStyle='#508040'; c.fillRect(8,5,2,2); c.fillRect(4,8,2,1); // greens
    c.fillStyle='#ff9010'; c.fillRect(6,3,4,1); // saffron bright
    c.fillStyle='#3a2008'; c.fillRect(9,7,1,1); c.fillRect(5,8,1,1); // whole spice
    c.fillStyle='#80c030'; c.fillRect(6,3,2,1); c.fillRect(10,3,2,1); // garnish
    c.fillStyle='#8a6020'; c.fillRect(1,2,14,1);
  },
  parotta(c) {
    // flaky layered South Indian parotta
    c.fillStyle='#1a0800';
    c.fillRect(1,0,14,1); c.fillRect(0,1,16,12); c.fillRect(1,13,14,1);
    c.fillStyle='#a07010'; c.fillRect(1,1,14,12); // base
    c.fillStyle='#b88018'; c.fillRect(1,1,14,9);
    c.fillStyle='#d09820'; c.fillRect(2,1,12,6);
    c.fillStyle='#e8b030'; c.fillRect(3,1,10,4);
    c.fillStyle='#f0c840'; c.fillRect(4,1,8,2); // top crispy
    c.fillStyle='#fff0a0'; c.fillRect(6,1,4,1); // butter sheen
    c.fillStyle='#1a0800'; // layer lines
    c.fillRect(1,4,14,1); c.fillRect(1,7,14,1); c.fillRect(1,10,14,1);
    c.fillStyle='#c89020'; // spiral marks
    c.fillRect(5,2,6,1); c.fillRect(5,3,1,1); c.fillRect(10,3,1,1);
    c.fillStyle='rgba(255,240,100,0.4)'; c.fillRect(4,2,3,2); // butter
  },
  kurma(c) {
    // creamy white coconut kurma
    c.fillStyle='#9a7030';
    c.fillRect(2,1,12,1); c.fillRect(1,2,14,9); c.fillRect(2,11,12,1); c.fillRect(3,12,10,1);
    c.fillStyle='#f0e8d8'; c.fillRect(2,2,12,9);
    c.fillStyle='#f8f0e4'; c.fillRect(3,2,10,7);
    c.fillStyle='#fff8f0'; c.fillRect(5,3,6,4);
    c.fillStyle='#e89020'; c.fillRect(3,6,2,2);  // potato
    c.fillStyle='#c84018'; c.fillRect(10,5,2,2); // carrot
    c.fillStyle='#508030'; c.fillRect(7,6,2,2);  // peas
    c.fillStyle='#c89828'; c.fillRect(5,7,2,1); c.fillRect(9,4,2,1); // cashew
    c.fillStyle='#40a820'; c.fillRect(6,3,2,1); // cardamom
    c.fillStyle='#f0d060'; c.fillRect(4,3,2,1); c.fillRect(10,7,2,1); // oil ring
    c.fillStyle='#9a7030'; c.fillRect(2,1,12,1);
  },
  halwa(c) {
    // dense orange/red semolina or carrot halwa
    c.fillStyle='#c0802a';
    c.fillRect(2,1,12,1); c.fillRect(1,2,14,10); c.fillRect(2,12,12,1); c.fillRect(3,13,10,1);
    c.fillStyle='#d04808'; c.fillRect(2,2,12,10);
    c.fillStyle='#e85818'; c.fillRect(3,2,10,8);
    c.fillStyle='#f06828'; c.fillRect(4,3,8,6);
    c.fillStyle='#ff8040'; c.fillRect(5,3,4,2); // top highlight
    c.fillStyle='#ffa060'; c.fillRect(6,3,2,1); // specular
    c.fillStyle='#e8e8f0'; // silver leaf sparkles
    c.fillRect(5,5,1,1); c.fillRect(8,4,1,1); c.fillRect(10,6,1,1); c.fillRect(4,8,1,1);
    c.fillStyle='#d4a030'; c.fillRect(7,4,2,2); c.fillRect(3,7,2,1); c.fillRect(11,7,2,1); // cashew
    c.fillStyle='#1a0800'; c.fillRect(6,6,1,1); c.fillRect(9,8,1,1);
    c.fillStyle='#c0802a'; c.fillRect(2,1,12,1);
  },
  kothu(c) {
    // kothu parotta - chopped, on dark tawa
    c.fillStyle='#3a2808';
    c.fillRect(0,3,16,11); c.fillRect(1,2,14,1); c.fillRect(2,1,12,1); c.fillRect(1,14,14,1);
    c.fillStyle='#8a5010'; c.fillRect(1,3,14,10);
    c.fillStyle='#a06018'; c.fillRect(2,3,12,8);
    c.fillStyle='#c07820'; c.fillRect(3,4,2,2); c.fillRect(7,3,2,2); c.fillRect(11,5,2,2);
    c.fillStyle='#e09028'; c.fillRect(5,5,2,2); c.fillRect(9,4,2,2); c.fillRect(13,6,2,2);
    c.fillStyle='#f0d040'; c.fillRect(4,7,2,1); c.fillRect(10,6,2,1); // egg
    c.fillStyle='#f0e8d0'; c.fillRect(6,9,2,1); c.fillRect(12,9,2,1); // onion
    c.fillStyle='#e03010'; c.fillRect(8,8,2,1); c.fillRect(3,10,2,1); // chilli
    c.fillStyle='#3a2808'; c.fillRect(0,3,1,11); c.fillRect(15,3,1,11); // tawa edge
    c.fillStyle='rgba(255,255,255,0.35)'; // steam
    c.fillRect(4,1,1,2); c.fillRect(8,0,1,2); c.fillRect(12,1,1,2);
  },
  // ── Fancy dinner items ──
  cake(c) {
    // Three-layer wedding cake with frosting and candle
    c.fillStyle='#1a0800';
    c.fillRect(1,7,14,1); c.fillRect(2,11,12,1); c.fillRect(3,14,10,1);
    // Bottom layer
    c.fillStyle='#f5e8d0'; c.fillRect(3,12,10,2);
    c.fillStyle='#ffffff'; c.fillRect(4,12,8,1);
    // Middle layer
    c.fillStyle='#f5e8d0'; c.fillRect(2,8,12,3);
    c.fillStyle='#ffffff'; c.fillRect(3,8,10,1);
    // Top layer
    c.fillStyle='#f5e8d0'; c.fillRect(4,4,8,3);
    c.fillStyle='#ffffff'; c.fillRect(5,4,6,1);
    // Frosting drips
    c.fillStyle='#ff88aa'; c.fillRect(2,7,2,1); c.fillRect(6,7,2,1); c.fillRect(10,7,2,1);
    c.fillStyle='#ff88aa'; c.fillRect(3,11,2,1); c.fillRect(8,11,2,1); c.fillRect(11,11,2,1);
    c.fillStyle='#ff88aa'; c.fillRect(5,14,2,1); c.fillRect(9,14,2,1);
    // Pink roses
    c.fillStyle='#ff4488'; c.fillRect(4,6,2,2); c.fillRect(10,6,2,2); c.fillRect(7,6,2,2);
    // Candle
    c.fillStyle='#f0e040'; c.fillRect(7,2,2,2);
    c.fillStyle='#ff8020'; c.fillRect(7,1,2,1); // flame
    c.fillStyle='#ffffff'; c.fillRect(8,1,1,1);
    // Gold trim
    c.fillStyle='#d4a020'; c.fillRect(3,14,10,1); c.fillRect(2,11,12,1); c.fillRect(4,7,8,1);
    // Plate
    c.fillStyle='#d0c8c0'; c.fillRect(1,15,14,1); c.fillStyle='#e8e0d8'; c.fillRect(2,15,12,1);
  },
  pasta(c) {
    // Pasta in a white bowl with tomato sauce and herb
    c.fillStyle='#1a0800';
    c.fillRect(2,6,12,1); c.fillRect(1,7,14,7); c.fillRect(2,14,12,1); c.fillRect(3,15,10,1);
    // Bowl white
    c.fillStyle='#f5f0e8'; c.fillRect(2,7,12,7);
    c.fillStyle='#ffffff'; c.fillRect(3,7,10,5);
    // Pasta strands (spaghetti, golden-yellow swirls)
    c.fillStyle='#e8c840';
    c.fillRect(3,8,2,1); c.fillRect(6,8,3,1); c.fillRect(10,8,2,1);
    c.fillRect(4,9,4,1); c.fillRect(9,9,3,1);
    c.fillRect(3,10,3,1); c.fillRect(7,10,2,1); c.fillRect(11,10,2,1);
    c.fillRect(5,11,5,1);
    // Tomato sauce (red blobs)
    c.fillStyle='#e03020'; c.fillRect(5,8,2,2); c.fillRect(9,9,2,2);
    c.fillStyle='#c82010'; c.fillRect(5,9,1,1); c.fillRect(10,9,1,1);
    // Basil leaf
    c.fillStyle='#20a020'; c.fillRect(7,8,2,1); c.fillRect(8,7,1,2);
    // Parmesan white dots
    c.fillStyle='#f8f0e0'; c.fillRect(4,12,1,1); c.fillRect(8,12,1,1); c.fillRect(12,11,1,1);
    // Bowl rim highlight
    c.fillStyle='#e0d8c8'; c.fillRect(2,6,12,1);
  },
  icecream(c) {
    // Triple scoop ice cream cone — pink, yellow, white scoops
    // Cone
    c.fillStyle='#1a0800';
    c.fillRect(5,10,6,1); c.fillRect(6,11,4,1); c.fillRect(7,12,2,1);
    c.fillStyle='#d4940a'; c.fillRect(5,10,3,1); c.fillRect(8,10,3,1);
    c.fillStyle='#c08008'; c.fillRect(6,11,2,1); c.fillRect(8,11,2,1);
    c.fillStyle='#e8a810'; c.fillRect(7,12,2,1);
    // Waffle cone grid
    c.fillStyle='#b87008'; c.fillRect(6,10,1,3); c.fillRect(9,10,1,3);
    // Bottom scoop (white vanilla)
    c.fillStyle='#1a0800'; c.fillRect(3,7,10,1); c.fillRect(2,5,12,1);
    c.fillStyle='#ffffff'; c.fillRect(3,5,10,3); c.fillStyle='#f8f8f0'; c.fillRect(4,5,8,2);
    // Middle scoop (mango yellow)
    c.fillStyle='#1a0800'; c.fillRect(4,2,8,1); c.fillRect(3,1,10,1);
    c.fillStyle='#f0c820'; c.fillRect(4,2,8,3); c.fillStyle='#f8d830'; c.fillRect(5,2,6,2);
    // Top scoop (strawberry pink)
    c.fillStyle='#1a0800'; c.fillRect(5,0,6,1); c.fillRect(6,0,4,1);
    c.fillStyle='#f86080'; c.fillRect(5,0,6,2); c.fillStyle='#ffa0b8'; c.fillRect(6,0,4,1);
    // Drizzle
    c.fillStyle='#ff4060'; c.fillRect(4,4,1,3); c.fillRect(11,5,1,2);
    c.fillStyle='#f0c010'; c.fillRect(12,3,1,4);
    // Cherry on top
    c.fillStyle='#cc0020'; c.fillRect(7,0,2,1); c.fillStyle='#ff2040'; c.fillRect(8,0,1,1);
    c.fillStyle='#208020'; c.fillRect(8,0,1,1); // stem
  },
};

// Pre-render all food sprites once to offscreen canvases
const FOOD_SPR = {}, FOOD_SPR_LG = {};
(function buildFoodSprites() {
  for (const foods of ROUND_FOODS) {
    for (const f of foods) {
      const c16 = document.createElement('canvas'); c16.width = c16.height = 16;
      const x16 = c16.getContext('2d'); x16.imageSmoothingEnabled = false;
      if (FOOD_DRAW[f.id]) FOOD_DRAW[f.id](x16);
      FOOD_SPR[f.id] = c16;
      // 22×22 for counter display
      const c22 = document.createElement('canvas'); c22.width = c22.height = 22;
      const x22 = c22.getContext('2d'); x22.imageSmoothingEnabled = false;
      x22.drawImage(c16, 0, 0, 22, 22);
      FOOD_SPR_LG[f.id] = c22;
    }
  }
})();

// ---------- Character Sprites (pixel art via string arrays) ----------
const PAL = {
  k:'#000000', K:'#3a2000',
  w:'#f8f0e0', W:'#d0b890',
  s:'#c89050', S:'#906820',
  h:'#180800',
  // clothes
  r:'#e82020', R:'#a00010',
  b:'#2040c0', B:'#102080',
  g:'#20a030', G:'#106820',
  p:'#d030a0', P:'#900070',
  y:'#f0e000', Y:'#b0a000',
  o:'#e06000', O:'#a04000',
  // env
  t:'#5ee6c1', T:'#2fa88a',
  v:'#180800',
};
const ART = {
  player0: [          // Tamil waiter, white veshti, walking frame 0
    '....kkkk....',
    '...kssssk...',
    '...kSSSSk...',
    '....kkkk....',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    'kwwwwwwwwwwk',
    '.kWWWWWWWWk.',
    '.kwwwwwwwwk.',
    '..kwwwwwwk..',
    '..kwk..kwk..',
    '..kwk..kwk..',
    '...kk...kk..',
  ],
  player1: [          // walking frame 1
    '....kkkk....',
    '...kssssk...',
    '...kSSSSk...',
    '....kkkk....',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    'kwwwwwwwwwwk',
    '.kWWWWWWWWk.',
    '.kwwwwwwwwk.',
    '..kwwwwwwk..',
    '...kwk.kwk..',
    '..kwkk.kwk..',
    '..kk....kk..',
  ],
  elder: [            // grandfather – white dhoti, white hair
    '..kWWWk...',
    '.kssssssk.',
    '.kSSSSSSk.',
    '..kkkkkk..',
    '.kwwwwwwk.',
    'kwwwwwwwwk',
    'kwwwwwwwwk',
    '.kWwwwWwk.',
    '..kwwwwk..',
    '...kkkk...',
  ],
  uncle: [            // middle-aged man – bright blue shirt
    '...kkkkk..',
    '..ksssssk.',
    '..kSSSSsk.',
    '...kkkkk..',
    '..kbbbbbk.',
    '.kbbbbbbbk',
    'kbbbbbbbbbk',
    '.kwwwwwwwk.',
    '..kwwwwwk..',
    '...kkkkk...',
  ],
  aunty: [            // woman – magenta/pink saree
    '..khhhkk..',
    '.ksssssssk.',
    '.kSSSSSSk.',
    '..kkkkkk..',
    '..kpppppp.',
    '.kpppppppp',
    'kpppppppppp',
    '.kpppppppp.',
    '..kpppppp..',
    '...kkkkkk..',
  ],
  youth: [            // young person – orange T-shirt
    '...kkkk...',
    '..ksssssk.',
    '..kSSSSsk.',
    '...kkkkk..',
    '..kooooook',
    '.koooooooook',
    'kooooooooook',
    '.kwwwwwwwk.',
    '..kwwwwwk..',
    '...kkkkk...',
  ],
  angry: [            // angry red face
    '....kkkk....',
    '...kRRRRk...',
    '...kRrRRk...',
    '....kRkR....',
    '...kRRRRRk..',
    '..kRRRRRRRk.',
    '.kRRRRRRRRRk',
    '..kRRRRRRRk.',
    '...kkkkkkk..',
  ],
  tray: [
    '.kKKKKKKKKKk.',
    'kWwwwwwwwwwWk',
    'kWwwwwwwwwwWk',
    '.kKKKKKKKKKk.',
  ],
  monkey0: [   // wedding-crashing monkey, frame 0
    '..kkkk..',
    '.kOOOOk.',
    '.kOsOOk.',
    '..kkkk..',
    '.kOooOk.',
    'kOOooOOk',
    '.kOooOk.',
    '..kOkk..',
    '..kkk.k.',
    '......kk',
  ],
  monkey1: [   // monkey running frame 1 (legs spread)
    '..kkkk..',
    '.kOOOOk.',
    '.kOsOOk.',
    '..kkkk..',
    '.kOooOk.',
    'kOOooOOk',
    '.kOooOk.',
    '.kOk.kk.',
    '.kkk.kkk',
    '......kk',
  ],
};
function makeSprite(rows, mapFn) {
  const wide = Math.max(...rows.map(r => r.length)), tall = rows.length;
  const cv = document.createElement('canvas'); cv.width = wide; cv.height = tall;
  const cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false;
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const col = PAL[row[i]]; if (!col) continue;
      cx.fillStyle = mapFn ? mapFn(col) : col;
      cx.fillRect(i, j, 1, 1);
    }
  });
  return cv;
}
const hexRgb = h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16));
const mix = (a,b,t) => '#'+hexRgb(a).map((v,i)=>Math.round(v+(hexRgb(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
const SPR = {}, SPR_R = {};
for (const k in ART) { SPR[k]=makeSprite(ART[k]); SPR_R[k]=makeSprite(ART[k],c=>mix(c,'#ff1800',0.7)); }

// 3×5 pixel font — digits, symbols, and uppercase letters (for belt food names)
const GLYPH = {
  '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111',
  '4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001001001001',
  '8':'111101111101111','9':'111101111001111','+':'000010111010000','-':'000000111000000',
  'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110',
  'E':'111100111100111','F':'111100111100100','G':'011100101101011','H':'101101111101101',
  'I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111',
  'M':'101111101101101','N':'110101101101101','O':'010101101101010','P':'110101110100100',
  'R':'110101110101101','S':'011100010001110','T':'111010010010010','U':'101101101101111',
  'V':'101101101101010','W':'101101101111101','Y':'101101010010010','Z':'111001010100111',
};
function tinyText(ctx, str, x, y, color) {
  ctx.fillStyle = color; let cx = x;
  for (const ch of String(str)) {
    const g = GLYPH[ch]; if (!g) { cx += 4; continue; }
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++)
      if (g[j*3+i]==='1') ctx.fillRect(cx+i, y+j, 1, 1);
    cx += 4;
  }
}
const tinyW = s => [...String(s)].filter(c=>GLYPH[c]).length*4-1;
const pick = a => a[(Math.random()*a.length)|0];
const clamp = (v,a,b) => Math.max(a, Math.min(b,v));

// ── Belt helpers ──
// Each food item has a virtual position on the belt [0, BELT_PX).
// Items are evenly spaced; the belt scrolls leftward via G.beltOffset.
function beltItemSpacing() { return BELT_PX / (ROUND_FOODS[G.round]||ROUND_FOODS[0]).length; }
function beltFoodScreenX(i) {
  const spacing = beltItemSpacing();
  const foods   = (ROUND_FOODS[G.round]||ROUND_FOODS[0]);
  const totalW  = spacing * foods.length; // ≈ BELT_PX
  const raw = ((i * spacing) - (G.beltOffset % totalW) + totalW * 100) % totalW;
  return BELT_START + raw;  // pixel x of food centre
}
// Return {foodIdx, screenX} of the food closest to player tile px, or null
function beltFoodUnderPlayer(playerTx) {
  const foods   = (ROUND_FOODS[G.round]||ROUND_FOODS[0]);
  const spacing = beltItemSpacing();
  const px      = playerTx * T + T / 2;  // centre pixel of player tile
  let best = -1, bestDist = spacing * 0.55; // must be within 55% of one slot
  for (let i = 0; i < foods.length; i++) {
    const fx   = beltFoodScreenX(i) + 8;   // +8 = centre of 16px sprite
    const dist = Math.abs(fx - px);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

// ---------- Sound ----------
const Sound = (() => {
  let ac=null,master=null,noise=null,timer=null,step=0,nextT=0;
  let muted=false; try{muted=localStorage.getItem('feast-mute')==='1';}catch(e){}
  function init(){
    if(ac){if(ac.state==='suspended')ac.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
    ac=new AC(); master=ac.createGain(); master.gain.value=muted?0:0.5; master.connect(ac.destination);
    noise=ac.createBuffer(1,ac.sampleRate*0.3,ac.sampleRate);
    const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  }
  function tone({f,at,d=0.12,type='triangle',v=0.08,slide=0,vib=0,lp=0,atk=0.01}){
    if(!ac)return; at=at??ac.currentTime;
    const o=ac.createOscillator(),g=ac.createGain(); o.type=type;
    o.frequency.setValueAtTime(f,at);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),at+d);
    if(vib){const l=ac.createOscillator(),lg=ac.createGain();l.frequency.value=vib;lg.gain.value=f*0.012;l.connect(lg);lg.connect(o.frequency);l.start(at);l.stop(at+d+0.05);}
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(v,at+atk);g.gain.exponentialRampToValueAtTime(0.0001,at+d);
    let node=o; if(lp){const fl=ac.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);node=fl;}
    node.connect(g);g.connect(master);o.start(at);o.stop(at+d+0.05);
  }
  function drum(at,low){
    if(!ac)return;
    const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();
    s.buffer=noise;fl.type='bandpass';fl.frequency.value=low?160:2000;fl.Q.value=low?1.5:3;
    g.gain.setValueAtTime(low?0.4:0.15,at);g.gain.exponentialRampToValueAtTime(0.001,at+(low?0.16:0.05));
    s.connect(fl);fl.connect(g);g.connect(master);s.start(at);s.stop(at+0.2);
    if(low)tone({f:100,at,d:0.14,type:'sine',v:0.18,slide:0.5});
  }
  const D4=293.66,st=n=>D4*Math.pow(2,n/12);
  const MEL=[7,9,7,4,2,0,2,4,4,7,9,7,4,2,0,2,0,2,4,7,4,2,0,null,7,9,7,4,7,4,2,0];
  function playStep(s,at,sd){
    const i=s%8;
    if(i===0||i===4)drum(at,true); if(i===2||i===6)drum(at,false); if(i===1||i===5)drum(at,false);
    const n=MEL[s%MEL.length];
    if(n!=null)tone({f:st(n),at,d:sd*1.8,type:'triangle',v:0.05,vib:4,lp:1800,atk:0.025});
    if(s%MEL.length===0)tone({f:st(-12),at,d:sd*3,type:'sine',v:0.07});
  }
  function sched(){const sd=60/100/2;while(nextT<ac.currentTime+0.2){playStep(step,nextT,sd);nextT+=sd;step=(step+1)%32;}}
  return {
    init, get muted(){return muted;},
    setMuted(m){muted=m;try{localStorage.setItem('feast-mute',m?'1':'0');}catch(e){}if(master)master.gain.value=m?0:0.5;},
    startBgm(){if(!ac||timer)return;step=0;nextT=ac.currentTime+0.06;timer=setInterval(sched,50);},
    stopBgm(){clearInterval(timer);timer=null;},
    deliver(){if(!ac)return;const t=ac.currentTime;tone({f:800,at:t,d:0.08,type:'sine',v:0.12});tone({f:1200,at:t+0.07,d:0.12,type:'sine',v:0.1});tone({f:1600,at:t+0.14,d:0.18,type:'sine',v:0.08});},
    wrong(){tone({f:250,d:0.15,type:'square',v:0.06,slide:0.7});},
    angry(){if(!ac)return;const t=ac.currentTime;[200,180,160].forEach((f,k)=>tone({f,at:t+k*0.08,d:0.1,type:'sawtooth',v:0.07}));drum(t,true);},
    roundEnd(){if(!ac)return;const t=ac.currentTime;[0,4,7,12,7,12,16].forEach((n,k)=>tone({f:D4*Math.pow(2,n/12),at:t+k*0.14,d:0.35,type:'triangle',v:0.09}));},
    gameOver(){if(!ac)return;const t=ac.currentTime;[392,370,349,330].forEach((f,k)=>tone({f,at:t+k*0.42,d:0.4,type:'sawtooth',v:0.07,vib:5}));},
    pickup(){tone({f:600,d:0.06,type:'triangle',v:0.07});},
    fanfare(){if(!ac)return;const t=ac.currentTime;[0,2,4,7,4,7,9,12].forEach((n,k)=>tone({f:D4*Math.pow(2,n/12),at:t+k*0.1,d:0.25,type:'triangle',v:0.1,vib:4,lp:2000}));},
  };
})();

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const cvs=$('screen'), out=cvs.getContext('2d');
const buf=document.createElement('canvas'); buf.width=W; buf.height=H;
const b=buf.getContext('2d'); b.imageSmoothingEnabled=false;
const bg=document.createElement('canvas'); bg.width=W; bg.height=H;
const ui={score:$('score'),served:$('served'),happy:$('happy'),roundLbl:$('round-lbl'),round:$('round'),toast:$('toast'),stage:$('stage')};
const overlays=['ov-ready','ov-pause','ov-clear','ov-over'].reduce((o,id)=>(o[id]=$(id),o),{});
function showOverlay(id){for(const k in overlays)overlays[k].classList.toggle('show',k===id);}
function fitCanvas(){const r=cvs.getBoundingClientRect(),dpr=window.devicePixelRatio||1;const k=Math.max(1,Math.ceil(r.width*dpr/W));if(cvs.width!==W*k){cvs.width=W*k;cvs.height=H*k;}}
window.addEventListener('resize',fitCanvas);
let toastTimer=0;
function toast(msg,secs=2.2){ui.toast.textContent=msg;ui.toast.classList.add('show');toastTimer=secs;}
let best=0; try{best=+localStorage.getItem('feast-best')||0;}catch(e){}

// ---------- State ----------
let G={state:'title',tables:[],pops:[],round:0,score:0,served:0,happiness:100,beltOffset:0,monkey:null,puddles:[],monkeySlowT:0};
let shakeT=0,shakeX=0,shakeY=0;

function mkPlayer(){ return {tx:START.x,ty:START.y,dir:0,t:0,want:NONE,held:NONE,animT:0,speed:5.5}; }
function mkTables(round){
  return ROUND_LAYOUTS[round].map((pos,i)=>({
    ...pos, guests:TABLE_GUESTS[i]||['uncle','aunty'],
    order:null, cooldown:1.5+Math.random()*3, fightT:0,
  }));
}
function initRound(round){
  G.tables=mkTables(round);
  G.roundTimer=ROUNDS[round].duration;
  G.nextOrderIn=2+Math.random()*3;
  G.beltOffset=0;
  G.puddles=mkPuddles(round);
}
function mkPuddles(round){
  const count=3+round*2;
  const puddles=[];
  const taken=new Set(ROUND_LAYOUTS[round].flatMap(t=>[`${t.tx},${t.ty}`,`${t.tx+1},${t.ty}`]));
  let att=0;
  while(puddles.length<count&&att++<300){
    const px=2+((Math.random()*(COLS-4))|0);
    const py=4+((Math.random()*(ROWS-6))|0);
    if(!isFloor(px,py)||taken.has(`${px},${py}`))continue;
    if(Math.abs(px-START.x)+Math.abs(py-START.y)<3)continue;
    if(puddles.some(p=>Math.abs(p.tx-px)+Math.abs(p.ty-py)<3))continue;
    const life=5+Math.random()*6;
    puddles.push({tx:px,ty:py,life,maxLife:life,age:0});
  }
  return puddles;
}
function relocatePuddle(pu){
  const taken=new Set((ROUND_LAYOUTS[G.round]||ROUND_LAYOUTS[0]).flatMap(t=>[`${t.tx},${t.ty}`,`${t.tx+1},${t.ty}`]));
  let att=0,nx=pu.tx,ny=pu.ty;
  while(att++<150){
    nx=2+((Math.random()*(COLS-4))|0);
    ny=4+((Math.random()*(ROWS-6))|0);
    if(!isFloor(nx,ny)||taken.has(`${nx},${ny}`))continue;
    if(Math.abs(nx-START.x)+Math.abs(ny-START.y)<3)continue;
    if(G.puddles.some(p=>p!==pu&&Math.abs(p.tx-nx)+Math.abs(p.ty-ny)<3))continue;
    break;
  }
  pu.tx=nx; pu.ty=ny;
  const life=5+Math.random()*7; pu.life=life; pu.maxLife=life; pu.age=0;
}
function updatePuddles(dt){
  if(!G.puddles)return;
  for(const pu of G.puddles){
    pu.life-=dt; pu.age+=dt;
    if(pu.life<=0) relocatePuddle(pu);
  }
}
function newGame(){
  G={state:'ready',round:0,score:0,served:0,happiness:100,roundTimer:0,nextOrderIn:0,
     beltOffset:0,tables:[],pops:[],player:mkPlayer(),readyT:2.5,runId:null,savedName:null,lastSaveId:null,
     monkey:{active:false,cooldown:6+Math.random()*4,x:0,y:0,vx:0,vy:0,lastCollide:0,animT:0},
     puddles:[],monkeySlowT:0};
  try{G.savedName=localStorage.getItem('feast-name');}catch(e){}
  initRound(0); Sound.init(); fitCanvas(); fetchRun();
  showOverlay('ov-ready');
  $('ready-round').textContent='Round 1 · Breakfast';
  $('ready-txt').textContent='Ready?';
  updateHud();
}

// ---------- Movement ----------
function advance(p,dt){
  if(p.t>0){
    p.t=Math.min(p.t+dt*p.speed,1);
    if(p.t>=1){
      p.tx+=DX[p.dir]; p.ty+=DY[p.dir]; p.t=0;
      onLand(p);
      if(p.want!==NONE&&tryStep(p,p.want)){p.want=NONE;}
      else tryStep(p,p.dir);
    }
  } else if(p.want!==NONE){tryStep(p,p.want);p.want=NONE;}
}
function tryStep(p,dir){
  if(dir===NONE)return false;
  const nx=p.tx+DX[dir],ny=p.ty+DY[dir];
  if(isWalkable(nx,ny)){p.dir=dir;p.t=0.001;return true;}
  return false;
}
function posOf(e){return{x:(e.tx+DX[e.dir]*e.t)*T+T/2,y:(e.ty+DY[e.dir]*e.t)*T+T/2};}
function onLand(p){
  if(p.ty===2 && p.tx>=1 && p.tx<=COLS-2){
    const idx = beltFoodUnderPlayer(p.tx);
    if(idx !== -1){ p.held = idx; Sound.pickup(); }
  }
  if(p.held!==NONE){
    // Puddle slip: drop food
    if(G.puddles&&G.puddles.some(pu=>pu.tx===p.tx&&pu.ty===p.ty&&pu.life>0.8&&pu.age>0.5)){
      const pos=posOf(p);
      G.pops.push({x:pos.x,y:pos.y-12,text:'SLIP!',color:'#40c8ff',life:1.8,vy:-22});
      p.held=NONE; shakeT=0.2; Sound.wrong(); return;
    }
    checkDelivery(p);
  }
}
function checkDelivery(p){
  for(let i=0;i<G.tables.length;i++){
    const tbl=G.tables[i];
    if(!tbl.order||tbl.order.state!=='active')continue;
    if(tbl.order.foodIdx!==p.held)continue;
    // table center: tx+1 (mid of TT), ty (single-row table)
    const dist=Math.abs(p.tx-(tbl.tx+1))+Math.abs(p.ty-tbl.ty);
    if(dist<=4){deliverOrder(i,p);return;}
  }
}
function spawnMonkey(){
  const m=G.monkey; if(!m)return;
  const speed=52+G.round*18;
  const side=(Math.random()*4)|0;
  if(side===0){m.x=-16;m.y=(4+((Math.random()*(ROWS-7))|0))*T;m.vx=speed;m.vy=0;}
  else if(side===1){m.x=W+4;m.y=(4+((Math.random()*(ROWS-7))|0))*T;m.vx=-speed;m.vy=0;}
  else if(side===2){m.x=(3+((Math.random()*(COLS-6))|0))*T;m.y=3*T-16;m.vx=0;m.vy=speed;}
  else{m.x=(3+((Math.random()*(COLS-6))|0))*T;m.y=H+4;m.vx=0;m.vy=-speed;}
  m.active=true;m.lastCollide=0;m.animT=0;
}
function monkeyCollide(){
  const p=G.player; if(!p)return;
  const pos=posOf(p);
  if(p.held!==NONE){
    G.pops.push({x:pos.x,y:pos.y-14,text:'STOLEN!',color:'#ff8000',life:2.0,vy:-26});
    p.held=NONE; shakeT=0.35; Sound.angry();
  } else {
    p.speed=2.2; G.monkeySlowT=3.0;
    G.pops.push({x:pos.x,y:pos.y-12,text:'DIZZY!',color:'#ff44aa',life:1.8,vy:-20});
    Sound.wrong();
  }
}
function updateMonkey(dt){
  const m=G.monkey; if(!m)return;
  if(!m.active){m.cooldown-=dt;if(m.cooldown<=0)spawnMonkey();return;}
  m.x+=m.vx*dt; m.y+=m.vy*dt; m.animT+=dt;
  if(m.x<-20||m.x>W+20||m.y<-20||m.y>H+20){m.active=false;m.cooldown=9+Math.random()*7;return;}
  if(m.lastCollide>0){m.lastCollide-=dt;return;}
  if(G.player){
    const pp=posOf(G.player);
    if(Math.abs(m.x+8-pp.x)+Math.abs(m.y+8-pp.y)<18){monkeyCollide();m.lastCollide=1.5;}
  }
}
function deliverOrder(idx,p){
  const ord=G.tables[idx].order;
  const frac=ord.timer/ord.maxTimer;
  const pts=frac>0.66?250:frac>0.33?175:100;
  G.score+=pts; G.served++;
  const pos=posOf(p);
  G.pops.push({x:pos.x,y:pos.y-12,text:'+'+pts,color:'#40ff80',life:1.4,vy:-22});
  spawnSparkle(pos.x,pos.y);
  G.tables[idx].order=null; G.tables[idx].cooldown=5+Math.random()*3;
  p.held=NONE; Sound.deliver();
}

// ---------- Orders ----------
function spawnOrder(){
  const foods=ROUND_FOODS[G.round];
  const free=G.tables.filter(t=>!t.order&&t.cooldown<=0);
  if(!free.length)return;
  const maxO=ROUNDS[G.round].maxOrders;
  if(G.tables.filter(t=>t.order&&t.order.state==='active').length>=maxO)return;
  const tbl=pick(free);
  tbl.order={foodIdx:(Math.random()*foods.length)|0,timer:ROUNDS[G.round].orderTime,maxTimer:ROUNDS[G.round].orderTime,state:'active'};
}
function updateOrders(dt){
  for(const tbl of G.tables){
    if(tbl.cooldown>0)tbl.cooldown-=dt;
    if(tbl.fightT>0){
      tbl.fightT-=dt;
      if(tbl.fightT<=0&&tbl.order&&tbl.order.state==='fight'){
        G.score=Math.max(0,G.score-50);
        G.happiness=Math.max(0,G.happiness-6);
        G.pops.push({x:(tbl.tx+1)*T,y:tbl.ty*T-4,text:'-50',color:'#ff3020',life:1.2,vy:-18});
        tbl.order=null; tbl.cooldown=6;
        if(G.happiness<=0)triggerGameOver();
      }
    }
    if(tbl.order){
      const ord=tbl.order;
      if(ord.state==='active'){
        ord.timer-=dt;
        if(ord.timer<=0){ord.timer=0;ord.state='expired';ord.expireT=0.8;Sound.angry();}
      } else if(ord.state==='expired'){
        ord.expireT-=dt;
        if(ord.expireT<=0){ord.state='fight';tbl.fightT=2.2;shakeT=0.4;}
      }
    }
  }
  G.nextOrderIn-=dt;
  if(G.nextOrderIn<=0){spawnOrder();G.nextOrderIn=ROUNDS[G.round].spawnInt*(0.7+Math.random()*0.6);}
}

// ---------- Particles ----------
function spawnSparkle(x,y){
  const cols=['#ffff00','#ff8000','#ff00c0','#00e0ff','#80ff00','#ff4040'];
  for(let i=0;i<6;i++){
    const a=(i/6)*Math.PI*2;
    G.pops.push({x,y,vx:Math.cos(a)*30,vy:Math.sin(a)*30-8,life:0.65,type:'dot',color:cols[i]});
  }
}
function updatePops(dt){
  for(const p of G.pops){p.life-=dt;p.y+=p.vy*dt;if(p.vx!==undefined){p.x+=p.vx*dt;p.vy+=35*dt;}else p.vy*=0.85;}
  for(let i=G.pops.length-1;i>=0;i--)if(G.pops[i].life<=0)G.pops.splice(i,1);
}

// ---------- Background (build once) ----------
function buildBg(){
  const c=bg.getContext('2d');
  // ── Retro 90s arcade palette ──
  // Floor: very dark green (NES dungeon / Gauntlet vibe)
  // Walls: deep red-brown brickwork
  // Counter: warm wood

  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const ch=grid[y][x];
    if(ch==='#'){
      // Brick wall
      c.fillStyle='#2a0808'; c.fillRect(x*T,y*T,T,T);
      const offY=(y%2)*8;
      c.fillStyle='#3d1010';
      c.fillRect(x*T, y*T+offY%T,   T, 7);
      c.fillRect(x*T, y*T+(offY+8)%T, T, 7);
      // mortar
      c.fillStyle='#1a0404';
      c.fillRect(x*T,   y*T+7,   T, 1);
      c.fillRect(x*T,   y*T+15,  T, 1);
      c.fillRect(x*T,   y*T,     1, T);
      // highlight
      c.fillStyle='#500c0c'; c.fillRect(x*T+1,y*T+1,T-2,2);
    } else if(ch==='C'){
      // Counter – warm wood planks
      c.fillStyle='#603000'; c.fillRect(x*T,y*T,T,T);
      c.fillStyle='#7a4010'; c.fillRect(x*T,y*T,T,T-2);
      c.fillStyle='#904e14'; c.fillRect(x*T,y*T,T,6);
      c.fillStyle='#a85e18'; c.fillRect(x*T,y*T,T,3);
      // wood grain lines
      c.fillStyle='#5a2c0c'; c.fillRect(x*T,y*T+8,T,1); c.fillRect(x*T,y*T+12,T,1);
      // bottom edge shadow
      c.fillStyle='#1a0800'; c.fillRect(x*T,y*T+T-1,T,1);
    } else {
      // Dark dungeon floor – classic 90s RPG look
      c.fillStyle=(x+y)%2===0?'#0e1a08':'#0a1206';
      c.fillRect(x*T,y*T,T,T);
      // subtle grid lines
      c.fillStyle='#060e04';
      c.fillRect(x*T,y*T,T,1); c.fillRect(x*T,y*T,1,T);
      // dot at alternating intersections (kolam-inspired)
      if(x%4===0&&y%4===0&&y>1){
        c.fillStyle='#1e3010'; c.fillRect(x*T+T/2-1,y*T+T/2-1,3,3);
        c.fillStyle='#2a4818'; c.fillRect(x*T+T/2,y*T+T/2,1,1);
      }
      // pickup row tint
      if(y===2){c.fillStyle='rgba(200,150,0,0.10)';c.fillRect(x*T,y*T,T,T);}
    }
  }
  // Top border stripe
  c.fillStyle='#d04000';
  for(let x=1;x<COLS-1;x++){c.fillRect(x*T+2,0,T-4,3);c.fillRect(x*T+2,H-3,T-4,3);}
  // Corner lamps
  for(const [lx,ly] of [[1,1],[COLS-2,1],[1,ROWS-2],[COLS-2,ROWS-2]]){
    c.fillStyle='#f0e000'; c.fillRect(lx*T+4,ly*T+4,8,8);
    c.fillStyle='#ffffff'; c.fillRect(lx*T+6,ly*T+6,4,4);
    c.fillStyle='#f8b000'; c.fillRect(lx*T+5,ly*T+3,6,2); c.fillRect(lx*T+5,ly*T+11,6,2);
    c.fillStyle='rgba(255,220,0,0.3)'; c.fillRect(lx*T,ly*T,T,T);
  }
}

// ---------- Draw ----------
function draw(){
  b.clearRect(0,0,W,H);
  const sx=shakeT>0?shakeX:0, sy=shakeT>0?shakeY:0;
  b.drawImage(bg,sx,sy);

  const foods=ROUND_FOODS[G.round]||ROUND_FOODS[0];
  const now=Date.now();

  // ── Water puddles (fade in/out as they relocate) ──
  if(G.puddles){
    for(const pu of G.puddles){
      const fadeIn=Math.min(pu.age/0.7,1);
      const fadeOut=Math.min(pu.life/0.7,1);
      const alpha=fadeIn*fadeOut;
      if(alpha<0.02)continue;
      const ppx=pu.tx*T+sx,ppy=pu.ty*T+sy;
      const wave=alpha*(0.45+0.12*Math.sin(now/280+pu.tx*1.3));
      b.fillStyle=`rgba(30,120,255,${wave})`;
      b.fillRect(ppx+2,ppy+5,T-4,T-8);
      b.fillStyle=`rgba(140,210,255,${alpha*(0.5+0.15*Math.sin(now/190+pu.ty))})`;
      b.fillRect(ppx+4,ppy+6,T-9,3);
      b.strokeStyle=`rgba(80,180,255,${alpha*0.5})`;b.lineWidth=1;
      b.beginPath();b.ellipse(ppx+T/2,ppy+T/2,5,3,0,0,Math.PI*2);b.stroke();
    }
  }

  // ── Conveyor belt counter ──
  {
    const belty = T + sy;                     // row 1 top pixel
    const belty2 = 2*T + sy;                  // row 2 top pixel (name label zone)
    const spacing = beltItemSpacing();

    // Belt track background — dark moving stripes to sell the motion
    b.fillStyle='#3a1800'; b.fillRect(BELT_START+sx, belty, BELT_PX, T);
    const stripeOff = (G.beltOffset * 1.2) % 8;
    for(let bx=0; bx<BELT_PX; bx+=8){
      b.fillStyle = (((bx + stripeOff)|0) % 8 < 4) ? '#2a1000' : '#4a2200';
      b.fillRect(BELT_START+sx+bx, belty+2, 8, T-4);
    }
    // Belt edge rollers
    b.fillStyle='#1a0800';
    b.fillRect(BELT_START+sx-3, belty, 4, T);
    b.fillRect(BELT_END  +sx-1, belty, 4, T);
    b.fillStyle='#c88020';
    b.fillRect(BELT_START+sx-2, belty+3, 2, T-6);
    b.fillRect(BELT_END  +sx,   belty+3, 2, T-6);

    // Row 2: name strip background
    b.fillStyle='rgba(0,0,0,0.55)'; b.fillRect(BELT_START+sx, belty2, BELT_PX, T);

    // Player "grab zone" highlight in row 2
    const inCounter = G.player && G.player.ty===2 && G.player.tx>=1 && G.player.tx<=COLS-2;
    if(inCounter){
      const px2 = G.player.tx*T+sx;
      b.fillStyle='rgba(255,240,60,0.22)'; b.fillRect(px2, belty, T, T*2);
      // Downward arrows indicating "grab here"
      b.fillStyle='#ffff00';
      b.fillRect(px2+5, belty-5, 6,3); b.fillRect(px2+6, belty-2, 4,3); b.fillRect(px2+7, belty+1, 2,3);
    }

    // Draw each food item scrolling on the belt
    b.save(); b.beginPath(); b.rect(BELT_START+sx, belty-1, BELT_PX, T*2+2); b.clip();
    for(let i=0; i<foods.length; i++){
      const food = foods[i];
      const fx   = beltFoodScreenX(i) + sx;  // left edge of 16px sprite
      const fy   = belty;

      // White card behind food sprite
      b.fillStyle='#ffffff'; b.fillRect(fx-1, fy+1, 18, 14);
      // Food sprite
      const spr = FOOD_SPR[food.id];
      if(spr) b.drawImage(spr, fx, fy, 16, 14);

      // Food name tag moving in row 2
      const name = food.label.toUpperCase();
      const nw   = tinyW(name);
      const nlx  = fx + 8 - (nw>>1);          // centred under sprite
      const nly  = belty2 + 5;
      // Shadow
      b.fillStyle='#000000';
      for(const ch of name){
        const g=GLYPH[ch]; if(!g) continue;
        for(let jj=0;jj<5;jj++) for(let ii=0;ii<3;ii++)
          if(g[jj*3+ii]==='1') b.fillRect(nlx+ii+1,nly+jj+1,1,1);
      }
      // Text
      tinyText(b, name, nlx, nly, '#f0e000');

      // Highlight the food that's directly above the player
      if(inCounter){
        const px2 = G.player.tx*T + T/2 + sx;
        if(Math.abs(fx+8 - px2) < spacing*0.55){
          b.strokeStyle='#ffffff'; b.lineWidth=2;
          b.strokeRect(fx-2, fy, 20, T);
          // Pulsing glow
          b.fillStyle=`rgba(255,255,200,${0.35+0.25*Math.sin(now/120)})`;
          b.fillRect(fx-1, fy+1, 18, T-2);
          if(spr) b.drawImage(spr, fx, fy, 16, 14);
        }
      }
    }
    b.restore();

    // Separator line between belt and hall
    b.fillStyle='#1a0800'; b.fillRect(0+sx, 3*T+sy, W, 2);
  }

  // ── Tables, guests, orders (all drawn dynamically) ──
  const TW=38, TH=20; // visual table size (slightly larger than 2T×T = 32×16)
  for(let i=0;i<(G.tables||[]).length;i++){
    const tbl=G.tables[i];
    const tpx=tbl.tx*T+sx, tpy=tbl.ty*T+sy;
    const angry=tbl.order&&tbl.order.state==='fight';
    const flash=tbl.order&&tbl.order.state==='expired';

    // ── Draw table surface (larger, golden) ──
    b.fillStyle='#100800'; b.fillRect(tpx-1,tpy-1,TW+2,TH+2); // black outline
    b.fillStyle=angry?`hsl(0,90%,${40+15*Math.sin(now/80)}%)` :'#c88010';
    b.fillRect(tpx, tpy, TW, TH);
    if(!angry){
      b.fillStyle='#e0a020'; b.fillRect(tpx+2,tpy+2,TW-4,6); // top sheen
      b.fillStyle='#f8d040'; b.fillRect(tpx+4,tpy+3,TW-8,2); // specular
      b.fillStyle='#a06010'; b.fillRect(tpx+2,tpy+TH-4,TW-4,3); // shadow
    }
    if(flash){
      b.fillStyle=`rgba(255,80,0,${0.5+0.4*Math.sin(now/60)})`;
      b.fillRect(tpx,tpy,TW,TH);
    }

    // ── Guests at each end — draw at 1.5× scale ──
    const g0=tbl.guests[0]||'uncle', g1=tbl.guests[1]||'aunty';
    const gs0=angry?SPR_R.angry:SPR[g0];
    const gs1=angry?SPR_R.angry:SPR[g1];
    const bob=((Math.sin(now/420+i)*1.5)|0);
    const sc=1.5; // guest sprite scale
    if(gs0){
      b.drawImage(gs0, tpx-1, tpy-gs0.height*sc-2+bob,
                  gs0.width*sc, gs0.height*sc);
    }
    if(gs1){
      b.drawImage(gs1, tpx+TW-gs1.width*sc+1, tpy-gs1.height*sc-2+bob,
                  gs1.width*sc, gs1.height*sc);
    }

    // ── Order bubble: floats to the RIGHT of the table so guests stay visible ──
    if(tbl.order){
      const ord=tbl.order;
      // Bubble anchored to the right side of the table
      const bx=tpx+TW+4; // right of table + gap
      const by=tpy-4;     // aligned with top of table
      if(ord.state==='active'||ord.state==='expired'){
        const frac=clamp(ord.timer/ord.maxTimer,0,1);
        const food=foods[ord.foodIdx];
        const bobY=ord.state==='active'?(Math.sin(now/260+i)*2)|0:0;
        // Bubble outline (black → yellow border)
        b.fillStyle='#000000'; b.fillRect(bx-2,by-2+bobY,28,28);
        b.fillStyle=frac>0.35?'#f0e000':'#ff2000'; b.fillRect(bx-1,by-1+bobY,26,26);
        b.fillStyle='#ffffff'; b.fillRect(bx,by+bobY,24,24);
        // Food sprite (16×16)
        const fs=FOOD_SPR[food.id];
        if(fs) b.drawImage(fs,bx+4,by+1+bobY,16,16);
        // Food name text clearly under sprite
        const name=food.label.toUpperCase();
        const nw=tinyW(name);
        b.fillStyle='#1a0800'; // shadow
        tinyText(b,name,bx+12-(nw>>1)+1,by+19+bobY+1,'#1a0800');
        tinyText(b,name,bx+12-(nw>>1),by+19+bobY,'#f0e000');
        // Timer bar
        const barW=22;
        b.fillStyle='#1a0800'; b.fillRect(bx,by+25+bobY,barW,4);
        b.fillStyle=frac>0.5?'#00e820':frac>0.25?'#f0d000':'#ff1010';
        b.fillRect(bx,by+25+bobY,(barW*frac)|0,4);
        // Tail pointing left toward table
        b.fillStyle='#f0e000';
        b.fillRect(bx-4,by+8+bobY,4,3);
      } else if(ord.state==='fight'){
        const ft=now/160;
        for(let s=0;s<5;s++){
          const a=ft+s*1.256;
          b.fillStyle=['#ffff00','#ff4000','#ff80c0','#00e0ff','#80ff00'][s];
          b.fillRect(bx+12+(Math.cos(a)*10)|0, by+12+(Math.sin(a)*8)|0, 4, 4);
        }
        b.fillStyle='#ff2000';
        b.fillRect(bx+8,by+10,8,2); b.fillRect(bx+11,by+7,2,8);
      }
    }
  }

  // ── Player ──
  if(G.player){
    const p=G.player;
    const px=(p.tx+DX[p.dir]*p.t)*T+sx, py=(p.ty+DY[p.dir]*p.t)*T+sy;
    const frame=((p.animT*4)|0)%2;
    const spr=frame===0?SPR.player0:SPR.player1;
    const flip=p.dir===3;
    const psc=1.8;
    if(spr){
      const pw=(spr.width*psc)|0, ph=(spr.height*psc)|0;
      const poffY=py-((ph-T)>>1);
      if(flip){b.save();b.scale(-1,1);b.drawImage(spr,-(px+pw+1),poffY,pw,ph);b.restore();}
      else b.drawImage(spr,px+1,poffY,pw,ph);
    }
    // Slow indicator — blue shimmer around player
    if(G.monkeySlowT>0){
      const pp2=posOf(p);
      b.strokeStyle=`rgba(80,160,255,${0.5+0.4*Math.sin(now/120)})`;b.lineWidth=2;
      b.beginPath();b.ellipse(px+T/2+sx,py+T/2+sy,13,13,0,0,Math.PI*2);b.stroke();
    }
    // Held food
    if(p.held!==NONE&&foods[p.held]){
      const fs=FOOD_SPR[foods[p.held].id];
      if(fs){
        b.fillStyle='#000000'; b.fillRect(px,py-22,18,18);
        b.fillStyle='#f0e000'; b.fillRect(px+1,py-21,16,16);
        b.drawImage(fs,px+1,py-21,16,16);
      }
      if(SPR.tray) b.drawImage(SPR.tray,px,py+9);
    }
  }

  // ── Monkey ──
  {
    const m=G.monkey;
    if(m&&m.active){
      const mframe=((m.animT*7)|0)%2;
      const mspr=mframe===0?SPR.monkey0:SPR.monkey1;
      if(mspr){
        const msc=1.7;
        const mw=(mspr.width*msc)|0, mh=(mspr.height*msc)|0;
        const mx=m.x+sx, my=m.y+sy;
        const mflip=m.vx<0||(m.vx===0&&m.vy>0);
        if(mflip){b.save();b.scale(-1,1);b.drawImage(mspr,-(mx+mw),my,mw,mh);b.restore();}
        else b.drawImage(mspr,mx,my,mw,mh);
      }
      // Orange warning border pulse every other half-second when nearby
      if(G.player){
        const pp3=posOf(G.player);
        const mdist=Math.abs(m.x+8-pp3.x)+Math.abs(m.y+8-pp3.y);
        if(mdist<60&&((now/350|0)%2===0)){
          b.strokeStyle='rgba(255,140,0,0.45)';b.lineWidth=3;
          b.strokeRect(1,1,W-2,H-2);
        }
      }
    }
  }

  // ── Particles ──
  for(const pop of G.pops){
    if(pop.life<=0)continue;
    b.globalAlpha=Math.min(1,pop.life*1.4);
    if(pop.type==='dot'){
      b.fillStyle=pop.color; b.fillRect((pop.x)|0,(pop.y)|0,3,3);
    } else {
      const tw=tinyW(pop.text);
      b.fillStyle='#000000'; tinyText(b,pop.text,(pop.x-tw/2+1)|0,(pop.y+1)|0,'#000000');
      tinyText(b,pop.text,(pop.x-tw/2)|0,(pop.y)|0,pop.color);
    }
  }
  b.globalAlpha=1;

  // ── Round timer bar (bottom) ──
  if(G.state==='play'&&G.roundTimer>0){
    const rt=clamp(G.roundTimer/ROUNDS[G.round].duration,0,1);
    b.fillStyle='#000000'; b.fillRect(0,H-6,W,6);
    const bc=rt>0.4?'#00d820':rt>0.2?'#e0c800':'#e81010';
    b.fillStyle=bc; b.fillRect(1,H-5,(W-2)*rt|0,4);
    b.fillStyle='rgba(255,255,255,0.25)'; b.fillRect(1,H-5,(W-2)*rt|0,2);
  }

  if(G.state==='ready'){b.fillStyle='rgba(0,0,0,0.75)';b.fillRect(0,0,W,H);}

  out.imageSmoothingEnabled=false;
  out.clearRect(0,0,cvs.width,cvs.height);
  out.drawImage(buf,0,0,cvs.width,cvs.height);
}

// ---------- HUD ----------
function updateHud(){
  const sc=G.score||0,sv=G.served||0,hp=G.happiness??100,rd=G.round||0;
  ui.score.textContent=sc.toLocaleString('en-IN');
  ui.served.textContent=sv;
  ui.happy.textContent=hp+'%';
  ui.happy.style.color=hp>50?'#5ee6c1':hp>25?'#e8c020':'#ff6040';
  ui.roundLbl.textContent='Round '+(rd+1);
  ui.round.textContent=ROUNDS[rd]?.name||'Done';
  try{best=Math.max(best,sc);localStorage.setItem('feast-best',best);}catch(e){}
}

// ---------- Update ----------
let lastT=0;
function frame(now){
  const dt=Math.min((now-lastT)/1000,0.05); lastT=now;
  if(G.state==='play')update(dt);
  else if(G.state==='ready'){G.readyT-=dt;if(G.readyT<=0){G.state='play';showOverlay(null);Sound.startBgm();}}
  if(shakeT>0){shakeT-=dt;shakeX=(Math.random()*6-3)|0;shakeY=(Math.random()*5-2)|0;}else{shakeX=shakeY=0;}
  updatePops(dt);
  draw(); updateHud();
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.classList.remove('show');}
  requestAnimationFrame(frame);
}
function update(dt){
  advance(G.player,dt); G.player.animT+=dt;
  G.beltOffset += dt * ROUNDS[G.round].beltSpeed;
  G.roundTimer-=dt; if(G.roundTimer<=0)triggerRoundEnd();
  updateOrders(dt);
  updateMonkey(dt);
  updatePuddles(dt);
  if(G.monkeySlowT>0){G.monkeySlowT-=dt;if(G.monkeySlowT<=0)G.player.speed=5.5;}
}
function triggerRoundEnd(){
  G.state='round_end'; Sound.stopBgm(); Sound.roundEnd();
  showOverlay('ov-clear');
  $('clear-eyebrow').textContent='Round '+(G.round+1)+' done';
  $('clear-title').innerHTML=ROUNDS[G.round].name+', <span class="hi">done!</span>';
  const bonus=G.happiness*5; G.score+=bonus;
  $('clear-bonus').innerHTML=`<dt>Served</dt><dd>${G.served}</dd>
    <dt>Happiness bonus</dt><dd>+${bonus}</dd>
    <dt>Total</dt><dd class="total">${G.score.toLocaleString('en-IN')}</dd>`;
  const btn=$('next');
  if(G.round>=2){btn.textContent='Final score';btn.onclick=()=>triggerGameOver();}
  else{btn.textContent='Next round';btn.onclick=()=>nextRound();}
}
function nextRound(){
  G.round++; G.served=0; G.happiness=Math.min(100,G.happiness+20);
  initRound(G.round); G.state='ready'; G.readyT=2.5; G.player=mkPlayer();
  showOverlay('ov-ready');
  $('ready-round').textContent='Round '+(G.round+1)+' · '+ROUNDS[G.round].name;
  $('ready-txt').textContent='Ready?'; Sound.fanfare();
}
function triggerGameOver(){
  G.state='game_over'; Sound.stopBgm(); Sound.gameOver();
  showOverlay('ov-over');
  $('over-score').textContent=G.score.toLocaleString('en-IN');
  $('over-best').textContent=best.toLocaleString('en-IN');
  $('over-title').innerHTML=G.happiness>60?'Feast complete! <span class="hi">Superb!</span>':
    G.happiness>30?'Guests grumbling. <span class="hi">Could be worse.</span>':
    'Total chaos. <span class="hi">Wedding ruined!</span>';
  $('save-over').hidden=false; $('save-over-done').hidden=true;
  const nm=$('save-over-name'); if(G.savedName)nm.value=G.savedName;
}

// ---------- Input ----------
const KEYS={};
const KMAP={ArrowUp:'u',w:'u',ArrowDown:'d',s:'d',ArrowLeft:'l',a:'l',ArrowRight:'r',d:'r'};
const DMAP={u:0,r:1,d:2,l:3};
function pauseGame(){if(G.state==='play'){G.state='paused';Sound.stopBgm();showOverlay('ov-pause');}}
function resumeGame(){if(G.state==='paused'){G.state='play';Sound.startBgm();showOverlay(null);}}
window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.metaKey||e.ctrlKey||e.altKey)return;
  const n=KMAP[e.key];
  if(n){
    if(!KEYS[n]){KEYS[n]=true;if(G.state==='play'){const dir=DMAP[n];G.player.want=dir;if(G.player.t===0)tryStep(G.player,dir);}}
    e.preventDefault(); return;
  }
  if(e.key==='p'||e.key==='P'||e.key==='Escape'){ if(G.state==='play')pauseGame(); else resumeGame(); e.preventDefault(); }
  else if((e.key==='r'||e.key==='R')&&G.state!=='ready'){ newGame(); e.preventDefault(); }
  else if(e.key==='m'||e.key==='M'){ toggleMute(); e.preventDefault(); }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
window.addEventListener('keyup',e=>{const n=KMAP[e.key];if(n)KEYS[n]=false;});

let touchStart=null;
ui.stage.addEventListener('touchstart',e=>{const t=e.touches[0];touchStart={x:t.clientX,y:t.clientY};Sound.init();},{passive:true});
ui.stage.addEventListener('touchend',e=>{
  if(!touchStart)return;
  const t=e.changedTouches[0];
  const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
  const th=18;
  if(Math.abs(dx)>Math.abs(dy)){if(Math.abs(dx)>th){const dir=dx>0?1:3;if(G.state==='play'){G.player.want=dir;if(G.player.t===0)tryStep(G.player,dir);}}}
  else{if(Math.abs(dy)>th){const dir=dy>0?2:0;if(G.state==='play'){G.player.want=dir;if(G.player.t===0)tryStep(G.player,dir);}}}
  touchStart=null;
},{passive:true});
document.querySelectorAll('#pad button').forEach(btn=>{
  const go=()=>{Sound.init();const dir=parseInt(btn.dataset.dir);if(G.state==='play'){G.player.want=dir;if(G.player.t===0)tryStep(G.player,dir);}};
  btn.addEventListener('pointerdown',e=>{btn.classList.add('on');go();e.preventDefault();});
  btn.addEventListener('pointerup',()=>btn.classList.remove('on'));
  btn.addEventListener('pointercancel',()=>btn.classList.remove('on'));
});
$('how').addEventListener('click',()=>{pauseGame();$('rules').classList.add('show');});
$('play').addEventListener('click',()=>{$('rules').classList.remove('show');Sound.init();if(G.state==='title')newGame();});
$('restart').addEventListener('click',()=>{Sound.init();newGame();});
$('resume').addEventListener('click',resumeGame);
$('again').addEventListener('click',()=>{Sound.init();newGame();});
$('lb').addEventListener('click',()=>{pauseGame();openLb();});
$('lb-close').addEventListener('click',()=>$('lbm').classList.remove('show'));
$('share').addEventListener('click',()=>{
  const url=location.origin+location.pathname+'?beat='+G.score;
  if(navigator.share)navigator.share({title:'Wedding Feast',text:`I scored ${G.score.toLocaleString('en-IN')}!`,url});
  else navigator.clipboard?.writeText(url).then(()=>toast('Link copied!'),()=>{});
});
document.querySelectorAll('[data-open-lb]').forEach(el=>el.addEventListener('click',openLb));
function toggleMute(){
  Sound.setMuted(!Sound.muted);
  $('mute').setAttribute('aria-pressed',String(Sound.muted));
  $('mute-long').textContent=Sound.muted?'Sound off':'Sound on';
  $('mute-short').textContent=Sound.muted?'♪̶':'♪';
}
$('mute').addEventListener('click',()=>{Sound.init();toggleMute();});
if(Sound.muted){$('mute').setAttribute('aria-pressed','true');$('mute-long').textContent='Sound off';$('mute-short').textContent='♪̶';}
const beatScore=Math.max(0,parseInt(new URLSearchParams(location.search).get('beat'),10)||0);
if(beatScore){const el=$('beat');if(el){el.hidden=false;el.textContent=`A friend scored ${beatScore.toLocaleString('en-IN')}. Beat it.`;}}

// ---------- Leaderboard ----------
async function fetchRun(){try{const r=await fetch('/api/feast/run',{method:'POST'});const d=await r.json();G.runId=d.id;}catch(e){}}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function openLb(){
  $('lbm').classList.add('show');
  const list=$('lb-list'),status=$('lb-status');
  status.textContent='Loading…';list.innerHTML='';
  try{
    const d=await (await fetch('/api/feast/leaderboard')).json();
    list.innerHTML=d.top.map((row,i)=>`
      <li class="${G.lastSaveId===row.id?'me':''}">
        <span class="rk">#${i+1}</span>
        <span class="nm">${esc(row.name)}<small>${['Breakfast','Lunch','Dinner'][row.level-1]||''}</small></span>
        <span class="sc">${row.score.toLocaleString('en-IN')}</span>
      </li>`).join('');
    status.textContent=d.top.length?'':'No scores yet — be the first!';
  }catch(e){status.textContent='Could not load scores.';}
}
document.querySelectorAll('[data-save]').forEach(form=>{
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const input=form.querySelector('input[name=name]');
    const name=input.value.trim();if(!name)return;
    const msg=form.querySelector('.msg');msg.textContent='Saving…';msg.className='msg';
    try{
      const d=await(await fetch('/api/feast/score',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({run:G.runId,name,score:G.score,level:G.round+1})})).json();
      if(d.ok){
        try{localStorage.setItem('feast-name',name);}catch(e){}
        G.savedName=name;G.lastSaveId=d.id;
        form.hidden=true;
        const done=$('save-over-done');done.hidden=false;
        done.querySelector('p').textContent=`#${d.rank} of ${d.total} — nice work, ${name}!`;
      } else {
        msg.className='msg err';
        msg.textContent=d.error==='name-blocked'?'Try a different name.':d.error==='run'?'Already saved.':'Something went wrong.';
      }
    }catch(e){msg.className='msg err';msg.textContent='Network error.';}
  });
});

// ---------- Boot ----------
buildBg();
$('rules').classList.add('show');
fitCanvas();
requestAnimationFrame(t=>{lastT=t;requestAnimationFrame(frame);});
})();
