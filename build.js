// Builds the public site from ret-sim.html.
//   node build.js   ->  public/index.html
//
// ret-sim.html is the working version: the whole simulator in one file (interface, engine, item and enchant data, icons).
// The public version is the same file with two changes applied when the page loads:
//   1. the developer features are removed (the "Copy setup (for troubleshooting)" button and its dialog, and the
//      Assumptions tab where the game values can be retuned);
//   2. the gear sets in public_presets.json are shown as fixed "Preset Gear Sets" buttons.
// Never edit public/index.html by hand: change ret-sim.html or public_presets.json and build again.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'ret-sim.html');
const outDir = path.join(__dirname, 'public'), out = path.join(outDir, 'index.html');
let s = fs.readFileSync(src, 'utf8').replace(/\r\n/g, '\n');
// presets: {name: {gear:{slot:itemId}, enchants:{slot:enchantName}, mode:rotationKey}}
let presets = {};
try { presets = JSON.parse(fs.readFileSync(path.join(__dirname, 'public_presets.json'), 'utf8')); } catch (e) { console.log('no public_presets.json, building without presets'); }
// The removed button and tab leave the page once it has loaded. The hidden Assumptions fields stay, because the sim reads its game values from them.
const tail = `
<script>
(() => {
  for (const sel of ['#copy-setup', '#setup-dlg', '[data-tab="assumptions"]']){ const e = document.querySelector(sel); if (e) e.remove(); }
  const p = document.querySelector('[data-panel="assumptions"]');
  if (p){ if (!p.hidden && typeof showTab === 'function') showTab('gear'); p.hidden = true; p.setAttribute('aria-hidden', 'true'); }
  // fixed gear presets, shown above the viewer's own saved sets
  const PRESETS = ${JSON.stringify(presets)};
  const names = Object.keys(PRESETS); if (!names.length) return;
  const side = document.querySelector('.gearside'), first = side && side.querySelector('h3'); if (!first) return;
  const h = document.createElement('h3'); h.textContent = 'Preset Gear Sets';
  const box = document.createElement('div'); box.className = 'pills'; box.id = 'gp-pills';
  first.before(h, box);
  const same = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => a[k] === b[k]); };
  const sync = () => { const cur = {}, ce = {}; for (const k in gear) cur[k] = gear[k].id; for (const k in ench) ce[k] = ench[k].n; for (const b of box.children) b.setAttribute('aria-pressed', String(same(PRESETS[b.dataset.preset].gear, cur) && same(PRESETS[b.dataset.preset].enchants || {}, ce))); };
  for (const n of names){
    const P = PRESETS[n], b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.dataset.preset = n;
    const cnt = Object.keys(P.gear).length, en = Object.keys(P.enchants || {}).length;
    b.dataset.tip = n + '|' + cnt + ' items' + (en ? ', ' + en + ' enchants' : '') + (typeof gsRotName === 'function' && gsRotName(P.mode) ? ' · rotation ' + gsRotName(P.mode) : '') + '. Click to equip.';
    b.addEventListener('click', () => {
      gear = {}; ench = {};
      for (const k in P.gear){ const it = ITEMS.find(i => i.id === P.gear[k] && i.s === slotType(k)); if (it) gear[k] = it; }
      for (const k in P.enchants || {}){ const x = ENCHANTS.find(y => y.n === P.enchants[k] && y.s === slotType(k)); if (x) ench[k] = x; }
      const rot = typeof gsRotName === 'function' ? gsRotName(P.mode) : '';
      if (rot){ document.getElementById('f6-mode').value = P.mode; save(); }
      gearChanged(); gsMsg('Loaded ' + n + (rot ? ' with rotation ' + rot : '') + '.');
    });
    box.appendChild(b);
  }
  const orig = gearChanged; gearChanged = function(){ orig.apply(this, arguments); sync(); };
  sync();
})();
</script>`;
const i = s.lastIndexOf('</script>');
if (i < 0){ console.error('ret-sim.html has no script block'); process.exit(1); }
s = s.slice(0, i + 9) + tail + s.slice(i + 9);
const mark = '</style>';
if (s.split(mark).length !== 2){ console.error('expected exactly one </style> in ret-sim.html'); process.exit(1); }
// never flash the removed controls before the script runs
s = s.replace(mark, '#copy-setup,[data-tab="assumptions"]{display:none}\n#gp-pills{margin:2px 0 10px}\n</style>');
// the artifact platform wrapped the page in a document skeleton; a plain host needs it in the file
if (!/^\s*<!doctype html>/i.test(s)){
  s = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>html,body{margin:0;padding:0}[hidden]:not([hidden=until-found i]){display:none!important}</style>\n</head>\n<body>\n' + s + '\n</body>\n</html>\n';
}
fs.mkdirSync(outDir, {recursive:true});
fs.writeFileSync(out, s);
console.log('built', path.relative(__dirname, out), (s.length / 1e6).toFixed(2) + ' MB', '| presets:', Object.keys(presets).join(', ') || 'none');
