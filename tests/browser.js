const path = require('path');

let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  console.log('jsdom is not installed - skipping DOM integration tests.');
  console.log('Install the dev-only test tools with: npm i -D jsdom canvas');
  process.exit(0);
}
let nodeCanvas = null;
try {
  nodeCanvas = require('canvas');
} catch (e) {
  nodeCanvas = null;
}
const { JSDOM, VirtualConsole } = jsdom;

const root = path.join(__dirname, '..');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', function (e) {
  if (String(e.message).indexOf('Not implemented') >= 0) return;
  errors.push('jsdomError: ' + e.message);
});
vc.on('error', function (msg) {
  errors.push('console.error: ' + msg);
});

const dom = new JSDOM('', {
  url: 'http://localhost/index.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  resources: 'usable',
  virtualConsole: vc
});

const { window } = dom;
const fs = require('fs');
const vm = require('vm');

window.eval(fs.readFileSync(path.join(root, 'js/util.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/audio.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/save.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/world.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/render.js'), 'utf8'));
window.eval(fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8'));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const bodyMatch = html.match(/<body>([\s\S]*)<script/);
window.document.body.innerHTML = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/g, '');

const canvas = window.document.getElementById('game');
if (nodeCanvas) {
  canvas.getContext = function () {
    if (!canvas._ctx) canvas._ctx = nodeCanvas.createCanvas(1280, 720).getContext('2d');
    return canvas._ctx;
  };
}

window.eval(fs.readFileSync(path.join(root, 'js/main.js'), 'utf8'));

const SF = window.SF;
const results = [];
function check(name, fn) {
  try {
    const out = fn();
    results.push('PASS ' + name + (out ? ' :: ' + out : ''));
  } catch (e) {
    results.push('FAIL ' + name + ' :: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 5).join('\n'));
  }
}

function frames(n) {
  const run = SF.Game.run;
  for (let i = 0; i < n; i++) {
    if (SF.Game.state === 'playing' && run.phase === 'fighting') {
      const enemies = run.enemies;
      let target = null;
      let best = 1e9;
      for (let k = 0; k < enemies.length; k++) {
        const e = enemies[k];
        const d = Math.hypot(e.x - run.player.x, e.y - run.player.y);
        if (d < best) {
          best = d;
          target = e;
        }
      }
      run.player.invuln = Math.max(run.player.invuln, 0.5);
      const wdef = run.defOf(run.weapon);
      const want = wdef.kind === 'melee' ? Math.min(85, (wdef.range || 100) * 0.55) : wdef.kind === 'cone' ? 140 : 330;
      let ax = 0;
      let ay = 0;
      if (target) {
        const d = Math.hypot(target.x - run.player.x, target.y - run.player.y);
        const a = Math.atan2(target.y - run.player.y, target.x - run.player.x);
        if (d > want) {
          ax = Math.cos(a);
          ay = Math.sin(a);
        } else if (d < want - 40) {
          ax = -Math.cos(a);
          ay = -Math.sin(a);
        } else {
          ax = Math.cos(a + Math.PI / 2) * 0.5;
          ay = Math.sin(a + Math.PI / 2) * 0.5;
        }
      }
      run.input.ax = ax;
      run.input.ay = ay;
      run.input.fire = true;
      run.input.autoAim = true;
      run.input.aimX = 0;
      run.input.aimY = 0;
      run.update(1 / 60);
      SF.UI.renderHUD(run);
      if (i % 8 === 0) SF.Render.draw(run, 1 / 60);
    }
    if (SF.Game.state === 'reward') break;
  }
}

check('page loads without errors', function () {
  if (!SF || !SF.Game || !SF.UI) throw new Error('modules missing');
  if (errors.length) throw new Error(errors[0]);
  return 'ok';
});

check('menu is visible on boot', function () {
  const menu = window.document.getElementById('screen-menu');
  if (!menu.classList.contains('active')) throw new Error('menu not active');
  return 'ok';
});

check('play -> character select renders 5 characters', function () {
  window.document.querySelector('[data-menu="play"]').click();
  const cards = window.document.querySelectorAll('#setup-characters .char-card');
  if (cards.length !== 5) throw new Error('cards=' + cards.length);
  return cards.length + ' cards';
});

check('start run begins in playing state', function () {
  window.document.getElementById('btn-start-run').click();
  if (SF.Game.state !== 'playing') throw new Error('state=' + SF.Game.state);
  if (!SF.Game.run) throw new Error('no run');
  if (!window.document.getElementById('hud').classList.contains('hidden') === false) throw new Error('hud hidden');
  return 'level ' + SF.Game.run.level;
});

check('hud renders values', function () {
  frames(3);
  const hp = window.document.getElementById('hud-hp-text').textContent;
  const weapon = window.document.getElementById('hud-weapon-name').textContent;
  if (!hp || hp.indexOf('/') < 0) throw new Error('bad hp text: ' + hp);
  if (!weapon) throw new Error('no weapon name');
  return hp + ' / ' + weapon;
});

check('level clears and reward screen shows 3 cards', function () {
  let guard = 0;
  while (SF.Game.state === 'playing' && guard++ < 60 * 90) frames(1);
  if (SF.Game.state !== 'reward') throw new Error('state=' + SF.Game.state + ' after ' + guard + ' frames');
  const cards = window.document.querySelectorAll('#reward-cards .reward-card');
  if (cards.length < 2) throw new Error('cards=' + cards.length);
  return cards.length + ' cards, level ' + SF.Game.run.level;
});

check('picking a reward opens the hub', function () {
  const card = window.document.querySelector('#reward-cards .reward-card');
  card.click();
  if (SF.Game.state !== 'hub') throw new Error('state=' + SF.Game.state);
  const rows = window.document.querySelectorAll('#hub-weapons .item-row');
  if (!rows.length) throw new Error('no weapon rows');
  return rows.length + ' weapons listed';
});

check('equipping armour updates stats', function () {
  const run = SF.Game.run;
  run.acquireArmour(run.makeArmour('titanheart', 'rare'), true);
  SF.UI.renderHub(run, SF.Game.hubOffers);
  const rows = window.document.querySelectorAll('#hub-armours .item-row');
  if (rows.length < 2) throw new Error('armour rows=' + rows.length);
  if (run.armour.id !== 'titanheart') throw new Error('not equipped');
  return 'hp ' + run.stats.maxHp;
});

check('descend starts the next level', function () {
  window.document.getElementById('btn-descend').click();
  if (SF.Game.state !== 'playing' && SF.Game.state !== 'event') throw new Error('state=' + SF.Game.state);
  return 'level ' + SF.Game.run.level;
});

check('pause and resume work', function () {
  if (SF.Game.state === 'event') {
    const btn = window.document.querySelector('#event-choices .btn');
    btn.click();
    window.document.querySelector('#event-choices .btn').click();
  }
  if (SF.Game.state !== 'playing') throw new Error('not playing: ' + SF.Game.state);
  window.document.getElementById('btn-pause').click();
  if (SF.Game.state !== 'paused') throw new Error('not paused');
  window.document.getElementById('btn-resume').click();
  if (SF.Game.state !== 'playing') throw new Error('not resumed');
  return 'ok';
});

check('renderer draws a boss level without errors', function () {
  const run = SF.Game.run;
  run.startLevel(run.level + 5 - (run.level % 5));
  const boss = run.bossActive;
  if (!boss) throw new Error('no boss');
  for (let i = 0; i < 120; i++) {
    run.input.fire = true;
    run.input.autoAim = true;
    run.update(1 / 60);
    SF.Render.draw(run, 1 / 60);
    SF.UI.renderHUD(run);
  }
  if (!window.document.getElementById('boss-name').textContent) throw new Error('boss bar empty');
  return boss.def.name + ' ' + Math.round((boss.hp / boss.maxHp) * 100) + '%';
});

check('death -> game over screen with stats', function () {
  const run = SF.Game.run;
  run.player.invuln = 0;
  run.hurtPlayer(99999, null, { ignoreInvuln: true });
  if (SF.Game.state !== 'gameover') throw new Error('state=' + SF.Game.state);
  const cells = window.document.querySelectorAll('#go-stats .stat-cell');
  if (cells.length < 5) throw new Error('stat cells=' + cells.length);
  if (!SF.Save.data.stats.runs) throw new Error('run not recorded');
  return cells.length + ' stat cells';
});

check('campaign: 7 levels driven through the real UI flow', function () {
  if (SF.Game.state === 'gameover') window.document.getElementById('btn-retry').click();
  SF.Game.run.hurtPlayer = function () {};
  let guard = 0;
  const eventsSeen = [];
  while (SF.Game.run.level <= 7 && guard++ < 500) {
    const st = SF.Game.state;
    if (st === 'playing') frames(900);
    else if (st === 'reward') {
      const card = window.document.querySelector('#reward-cards .reward-card');
      if (!card) throw new Error('no reward card at level ' + SF.Game.run.level);
      card.click();
    } else if (st === 'hub') {
      const heal = window.document.getElementById('btn-buy-heal');
      if (!heal.disabled) heal.click();
      const up = window.document.getElementById('btn-buy-upgrade');
      if (!up.disabled) up.click();
      window.document.getElementById('btn-descend').click();
    } else if (st === 'event') {
      eventsSeen.push(SF.Game.pendingEvent.id);
      const btn = window.document.querySelector('#event-choices .btn');
      if (!btn) throw new Error('event without choices');
      btn.click();
      const cont = window.document.querySelector('#event-choices .btn');
      if (!cont) throw new Error('event without continue');
      cont.click();
    } else if (st === 'gameover') {
      SF.Game.run.hurtPlayer = function () {};
      window.document.getElementById('btn-retry').click();
    } else {
      throw new Error('unexpected state ' + st);
    }
  }
  if (SF.Game.run.level <= 7) throw new Error('stalled at level ' + SF.Game.run.level);
  if (errors.length) throw new Error(errors[0]);
  return 'level ' + SF.Game.run.level + ', gold ' + SF.Game.run.gold + ', events: ' + (eventsSeen.join(',') || 'none');
});

check('shop purchase deducts gold', function () {
  const run = SF.Game.run;
  SF.Game.state = 'hub';
  SF.Game.hubOffers = run.generateShop();
  run.gold = 5000;
  const before = run.gold;
  const offer = SF.Game.hubOffers.find(function (o) { return !o.sold; });
  run.buyOffer(offer);
  if (run.gold >= before) throw new Error('gold not spent');
  return 'spent ' + (before - run.gold);
});

check('evolution through the reward pipeline', function () {
  const run = SF.Game.run;
  run.ownedWeapons[run.weaponIndex] = run.makeWeapon('cleaver', 5, 'rare');
  run.passives.pyre = 2;
  run.recompute();
  const evo = run.availableEvolution();
  if (!evo) throw new Error('evolution not offered');
  run.applyReward({ type: 'evolve' });
  if (!run.weapon.evolved) throw new Error('weapon not evolved');
  return run.defOf(run.weapon).name;
});

check('retry from game over restarts a run', function () {
  window.document.getElementById('btn-retry').click();
  if (SF.Game.state !== 'playing') throw new Error('state=' + SF.Game.state);
  if (SF.Game.run.level !== 1) throw new Error('level=' + SF.Game.run.level);
  return 'ok';
});

check('codex renders all tabs', function () {
  SF.Game.state = 'menu';
  SF.UI.renderCodex();
  const tabs = window.document.querySelectorAll('#codex-tabs .tab');
  if (tabs.length < 5) throw new Error('tabs=' + tabs.length);
  let count = 0;
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].click();
    count += window.document.querySelectorAll('#codex-body .codex-item').length;
  }
  if (count < 20) throw new Error('codex items=' + count);
  return count + ' entries';
});

check('achievements and settings render', function () {
  SF.UI.renderAchievements();
  const ach = window.document.querySelectorAll('#achievements-body .achievement');
  if (ach.length < 10) throw new Error('achievements=' + ach.length);
  SF.UI.renderSettings();
  const rows = window.document.querySelectorAll('#settings-body .setting-row');
  if (rows.length < 5) throw new Error('settings rows=' + rows.length);
  return ach.length + ' achievements, ' + rows.length + ' settings';
});

check('save persists to localStorage', function () {
  SF.Save.write();
  const raw = window.localStorage.getItem('shardfall_save_v2');
  if (!raw) throw new Error('no save data');
  const parsed = JSON.parse(raw);
  if (typeof parsed.shards !== 'number') throw new Error('bad shards');
  return 'save ' + raw.length + ' bytes';
});

console.log(results.join('\n'));
if (errors.length) {
  console.log('\nRUNTIME ERRORS:');
  errors.slice(0, 10).forEach(function (e) { console.log('  ' + e); });
}
const failed = results.filter(function (r) { return r.indexOf('FAIL') === 0; });
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed');
process.exit(failed.length || errors.length ? 1 : 0);
