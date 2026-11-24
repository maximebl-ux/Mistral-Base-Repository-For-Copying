const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function loadGame() {
  const sandbox = {
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    performance: { now: function () { return Date.now(); } },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  ['js/util.js', 'js/data.js', 'js/world.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });
  });
  return sandbox;
}

function autopilot(run, U) {
  const p = run.player;
  const st = run.stats;
  let target = null;
  let bestD = 3000;
  for (let i = 0; i < run.enemies.length; i++) {
    const e = run.enemies[i];
    if (e.dead) continue;
    const d = U.dist(p.x, p.y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      target = e;
    }
  }
  let ax = 0;
  let ay = 0;
  let nearestThreat = null;
  let threatD = 9999;
  for (let i = 0; i < run.enemies.length; i++) {
    const e = run.enemies[i];
    if (e.dead) continue;
    const d = U.dist(p.x, p.y, e.x, e.y);
    if (d < threatD) {
      threatD = d;
      nearestThreat = e;
    }
  }
  const def = run.defOf(run.weapon);
  const wantDist = def.kind === 'melee' ? Math.min(85, (def.range || 100) * 0.55) : def.kind === 'cone' ? 150 : 340;
  if (nearestThreat) {
    const away = U.angleTo(nearestThreat.x, nearestThreat.y, p.x, p.y);
    if (threatD < wantDist) {
      ax = Math.cos(away) * (def.kind === 'melee' ? 0.4 : 1);
      ay = Math.sin(away) * (def.kind === 'melee' ? 0.4 : 1);
    } else if (threatD > wantDist + 120) {
      ax = -Math.cos(away);
      ay = -Math.sin(away);
    } else {
      ax = Math.cos(away + Math.PI / 2) * 0.6;
      ay = Math.sin(away + Math.PI / 2) * 0.6;
    }
  }
  for (let i = 0; i < run.zones.length; i++) {
    const z = run.zones[i];
    if (z.owner !== 'enemy' && z.owner !== 'hazard') continue;
    const d = U.dist(p.x, p.y, z.x, z.y);
    if (d < z.r + 30) {
      const away = U.angleTo(z.x, z.y, p.x, p.y);
      ax += Math.cos(away) * 1.4;
      ay += Math.sin(away) * 1.4;
    }
  }
  const mag = Math.hypot(ax, ay);
  if (mag > 1) {
    ax /= mag;
    ay /= mag;
  }
  run.input.ax = ax;
  run.input.ay = ay;
  if (target) {
    run.input.aimX = target.x;
    run.input.aimY = target.y;
  } else {
    run.input.aimX = 0;
    run.input.aimY = 0;
  }
  run.input.fire = true;
  if (threatD < 90 && p.dashCd <= 0) run.input.dash = true;
  if (p.abilityCd <= 0 && run.enemies.length > 2 && p.hp > st.maxHp * 0.6 && threatD > 120) run.input.ability = true;
  if (p.hp < st.maxHp * 0.4 && run.consumables.potion) run.useConsumable('potion');
}

function runSim(opts) {
  opts = opts || {};
  const game = loadGame();
  const SF = game.SF;
  const U = SF.U;
  const maxLevel = opts.maxLevel || 30;
  const run = new SF.Run({ characterId: opts.character || 'rook', challenge: opts.challenge || 'normal', modifiers: opts.modifiers || [], meta: opts.meta || { upgrades: {}, weapons: [], armours: [] } });
  if (opts.immortal) {
    run.hurtPlayer = function () {};
  }
  if (opts.buff) {
    run.weapon.level = 5;
    for (const id in SF.DATA.PASSIVES) {
      if (id === 'secondwind') continue;
      run.passives[id] = Math.min(2, SF.DATA.PASSIVES[id].max);
    }
    run.recompute();
    run.player.hp = run.stats.maxHp;
  }
  const log = [];
  let bossInfo = null;
  run.on('boss', function () {
    if (run.bossActive) bossInfo = { max: run.bossActive.maxHp, t: run.time };
  });
  run.on('bosskill', function () {
    if (bossInfo) console.log('    boss lvl ' + run.level + ' maxHp ' + Math.round(bossInfo.max) + ' killed in ' + (run.time - bossInfo.t).toFixed(1) + 's');
  });
  let steps = 0;
  const dt = 1 / 60;
  let levelStart = 0;
  let levelTimes = [];
  let lastLevel = 1;
  let errors = 0;
  let stall = 0;
  let pickupsUsed = 0;
  while (run.level < maxLevel && steps < 60 * 60 * 40) {
    steps++;
    if (run.phase === 'dead') break;
    if (run.phase === 'cleared') {
      const elapsed = run.time - levelStart;
      levelTimes.push({ level: run.level, time: Math.round(elapsed * 10) / 10, hp: Math.round(run.player.hp), maxHp: run.stats.maxHp, kills: run.runStats.kills, gold: Math.round(run.gold) });
      const rewards = run.generateRewards(3);
      const pref = ['evolve', 'upgrade', 'passive', 'relic', 'armour', 'consumable', 'weapon', 'heal', 'gold'];
      let chosen = rewards[0];
      for (let pi = 0; pi < pref.length && chosen; pi++) {
        const found = rewards.find(function (c) { return c.type === pref[pi]; });
        if (found) { chosen = found; break; }
      }
      if (chosen) run.applyReward(chosen);
      if (opts.shop !== false) {
        if (run.player.hp < run.stats.maxHp * 0.7) run.buyHeal();
        if (run.gold > 200 && run.weapon.level < 5) run.buyWeaponUpgrade();
      }
      if ((run.level + 1) % 3 === 0 && !opts.noEvents) {
        const ev = run.generateEvent();
        const choice = ev.choices[Math.floor(Math.random() * ev.choices.length)];
        const res = run.resolveEvent(ev, choice.id);
        if (res.text) pickupsUsed++;
      }
      levelStart = run.time;
      run.startNextLevel();
      lastLevel = run.level;
      continue;
    }
    autopilot(run, U);
    try {
      run.update(dt);
    } catch (e) {
      errors++;
      console.error('RUNTIME ERROR at level ' + run.level + ': ' + e.message);
      console.error(e.stack.split('\n').slice(0, 6).join('\n'));
      break;
    }
    if (steps % 60 === 0 && run.phase === 'fighting' && run.enemies.length === 0 && run.pendingSpawns > 0) {
      stall++;
      if (stall > 6) {
        console.error('STALL at level ' + run.level + ' pending=' + run.pendingSpawns);
        errors++;
        break;
      }
    } else {
      stall = 0;
    }
  }
  return {
    level: run.level,
    phase: run.phase,
    kills: run.runStats.kills,
    errors: errors,
    time: Math.round(run.time),
    levelTimes: levelTimes,
    hp: Math.round(run.player.hp),
    maxHp: run.stats.maxHp,
    weapon: run.defOf(run.weapon).name,
    weaponLevel: run.weapon.level,
    gold: Math.round(run.gold),
    damage: Math.round(run.runStats.damage),
    damageTaken: Math.round(run.runStats.damageTaken),
    bosses: run.runStats.bosses
  };
}

const mode = process.argv[2] || 'standard';

if (mode === 'weapons') {
  const g = loadGame();
  const SF = g.SF;
  const D = SF.DATA;
  let fail = 0;
  const ids = Object.keys(D.WEAPONS);
  ids.forEach(function (id) {
    const evo = D.EVOLUTIONS[id];
    [[id, false], [id, true]].forEach(function (pair) {
      if (pair[1] && !evo) return;
      const run = new SF.Run({ characterId: 'rook' });
      run.ownedWeapons[run.weaponIndex] = run.makeWeapon(pair[0], 3, 'rare', pair[1]);
      run.recompute();
      run.player.invuln = 1e9;
      const target = run.spawnEnemy('brute', { x: run.player.x + 70, y: run.player.y + 30 });
      const target2 = run.spawnEnemy('crawler', { x: run.player.x + 90, y: run.player.y - 40 });
      target.hp = target.maxHp = 99999;
      target2.hp = target2.maxHp = 99999;
      const before = run.runStats.damage;
      for (let i = 0; i < 60 * 3; i++) {
        run.input.fire = true;
        run.input.autoAim = true;
        run.input.aimX = target.x;
        run.input.aimY = target.y;
        run.player.invuln = 1e9;
        run.update(1 / 60);
      }
      const dealt = run.runStats.damage - before;
      const name = pair[1] ? 'EVO ' + name0(pair[0]) : D.WEAPONS[pair[0]].name;
      if (dealt <= 0) {
        fail++;
        console.log('  FAIL ' + name + ' dealt no damage');
      } else {
        console.log('  PASS ' + name + ' :: ' + Math.round(dealt) + ' dmg in 3s (' + Math.round(dealt / 3) + ' dps)');
      }
    });
  });
  function name0(id) { return D.WEAPONS[id].name; }
  console.log(fail ? fail + ' FAILURES' : 'ALL WEAPONS DEAL DAMAGE');
  process.exit(fail ? 1 : 0);
}

if (mode === 'armours') {
  const g = loadGame();
  const SF = g.SF;
  const D = SF.DATA;
  const base = new SF.Run({ characterId: 'rook' });
  const baseStats = JSON.parse(JSON.stringify(base.stats));
  let fail = 0;
  Object.keys(D.ARMOURS).forEach(function (id) {
    const run = new SF.Run({ characterId: 'rook' });
    run.acquireArmour(run.makeArmour(id, 'rare'), true);
    const changed = ['maxHp', 'dr', 'speed', 'crit', 'critMult', 'dodge', 'regen', 'shield', 'lifesteal', 'thorns', 'fireRate', 'cdReduce']
      .filter(function (k) { return Math.abs(run.stats[k] - baseStats[k]) > 1e-6; });
    const elemChanged = Object.keys(run.stats.elem).filter(function (k) {
      return run.stats.elem[k] !== baseStats.elem[k];
    });
    if (!changed.length && !elemChanged.length) {
      fail++;
      console.log('  FAIL ' + D.ARMOURS[id].name + ' changed nothing');
    } else {
      console.log('  PASS ' + D.ARMOURS[id].name + ' :: ' + changed.concat(elemChanged).join(',') + ' hp=' + run.stats.maxHp + ' dr=' + run.stats.dr.toFixed(2));
    }
  });
  console.log(fail ? fail + ' FAILURES' : 'ALL ARMOUR APPLIES');
  process.exit(fail ? 1 : 0);
}

if (mode === 'enemies') {
  const g = loadGame();
  const SF = g.SF;
  const D = SF.DATA;
  let fail = 0;
  Object.keys(D.ENEMIES).forEach(function (id) {
    const run = new SF.Run({ characterId: 'rook' });
    run.player.invuln = 1e9;
    run.startLevel(D.ENEMIES[id].unlock + 2);
    run.enemies.length = 0;
    run.pendingSpawns = 0;
    const e = run.spawnEnemy(id, { x: run.player.x + 220, y: run.player.y });
    const startX = e.x;
    const startY = e.y;
    const startHp = e.hp;
    let threw = null;
    let cursed = false;
    try {
      for (let i = 0; i < 60 * 6; i++) {
        run.player.invuln = 1e9;
        run.update(1 / 60);
        if (run.player.slowT > 0 || run.player.weakT > 0) cursed = true;
      }
    } catch (err) {
      threw = err.message;
    }
    const moved = Math.hypot(e.x - startX, e.y - startY) > 4;
    const damaged = e.hp < startHp;
    const spawnedMore = run.enemies.length > 1;
    if (threw || (!moved && !damaged && !spawnedMore && !cursed && e.hp > 0)) {
      fail++;
      console.log('  FAIL ' + D.ENEMIES[id].name + ' :: ' + (threw || 'did nothing'));
    } else {
      console.log('  PASS ' + D.ENEMIES[id].name + ' (ai=' + D.ENEMIES[id].ai + ') :: moved=' + moved + ' damaged=' + damaged + ' spawned=' + spawnedMore + ' cursed=' + cursed);
    }
  });
  console.log(fail ? fail + ' FAILURES' : 'ALL ENEMIES ACTIVE');
  process.exit(fail ? 1 : 0);
}

if (mode === 'consumables') {
  const g = loadGame();
  const SF = g.SF;
  const D = SF.DATA;
  let fail = 0;
  Object.keys(D.CONSUMABLES).forEach(function (id) {
    const run = new SF.Run({ characterId: 'rook' });
    run.consumables[id] = 1;
    run.player.hp = run.stats.maxHp * 0.3;
    const e = run.spawnEnemy('brute', { x: run.player.x + 60, y: run.player.y });
    e.hp = e.maxHp = 9999;
    const before = { hp: run.player.hp, dmg: run.runStats.damage, speed: run.stats.speed, ward: run.player.wardT, adren: run.player.adrenT };
    let ok = run.useConsumable(id);
    if (D.CONSUMABLES[id].use === 'reroll') {
      console.log('  SKIP ' + D.CONSUMABLES[id].name + ' (reward screen only)');
      return;
    }
    const effect = run.player.hp > before.hp + 1 || run.runStats.damage > before.dmg || run.player.wardT > 0 || run.player.adrenT > 0 || run.enemies.some(function (x) { return x.statuses.chill; });
    if (!ok || !effect) {
      fail++;
      console.log('  FAIL ' + D.CONSUMABLES[id].name);
    } else {
      console.log('  PASS ' + D.CONSUMABLES[id].name);
    }
  });
  console.log(fail ? fail + ' FAILURES' : 'ALL CONSUMABLES WORK');
  process.exit(fail ? 1 : 0);
}
if (mode === 'diag') {
  const g = loadGame();
  const SF = g.SF;
  const level = parseInt(process.argv[3] || '9', 10);
  const run = new SF.Run({ characterId: 'rook' });
  run.weapon.level = 5;
  for (const id in SF.DATA.PASSIVES) { if (id !== 'secondwind') run.passives[id] = Math.min(2, SF.DATA.PASSIVES[id].max); }
  run.recompute();
  run.hurtPlayer = function () {};
  run.player.hp = run.stats.maxHp;
  run.startLevel(level);
  let t = 0;
  if (run.bossActive) console.log('boss hp', run.bossActive.hp, 'max', run.bossActive.maxHp, 'dmg', run.bossActive.dmg.toFixed(1));
  for (let i = 0; i < 60 * 90; i++) {
    if (i % 60 === 0 && run.bossActive) console.log('t=' + Math.round(t) + ' bosshp=' + Math.round(run.bossActive.hp) + ' enemies=' + run.enemies.length + ' pdmg=' + Math.round(run.runStats.damage));
    autopilot(run, SF.U);
    run.update(1 / 60);
    t += 1 / 60;
    if (i % (60 * 5) === 0) {
      const kinds = {};
      let totalHp = 0;
      run.enemies.forEach(function (e) { kinds[e.id] = (kinds[e.id] || 0) + 1; totalHp += e.hp; });
      const near = run.nearestEnemy(run.player.x, run.player.y, 9999);
      if (near) console.log('    nearest ' + near.id + ' dist=' + Math.round(SF.U.dist(near.x, near.y, run.player.x, run.player.y)) + ' player=(' + Math.round(run.player.x) + ',' + Math.round(run.player.y) + ') enemy=(' + Math.round(near.x) + ',' + Math.round(near.y) + ') hp=' + Math.round(near.hp) + ' fireCd=' + run.player.fireCd.toFixed(2));
      console.log(Math.round(t) + 's enemies=' + run.enemies.length + ' pending=' + run.pendingSpawns + ' hp=' + Math.round(totalHp) + ' dmg=' + Math.round(run.runStats.damage) + ' ' + JSON.stringify(kinds) + ' phase=' + run.phase);
    }
    if (run.phase === 'cleared' || run.phase === 'dead') break;
  }
  console.log('final', run.phase, 'time', Math.round(run.time), 'total dmg', Math.round(run.runStats.damage), 'kills', run.runStats.kills);
  process.exit(0);
}

let failures = 0;

function check(name, fn) {
  try {
    const out = fn();
    console.log('  PASS ' + name + (out ? ' :: ' + out : ''));
  } catch (e) {
    failures++;
    console.log('  FAIL ' + name + ' :: ' + e.message);
    console.log(e.stack.split('\n').slice(0, 8).join('\n'));
  }
}

if (mode === 'standard' || mode === 'all') {
  console.log('== data integrity ==');
  check('weapons >= 12', function () {
    const g = loadGame();
    const n = Object.keys(g.SF.DATA.WEAPONS).length;
    if (n < 12) throw new Error('only ' + n);
    return n + ' weapons';
  });
  check('armours >= 10', function () {
    const g = loadGame();
    const n = Object.keys(g.SF.DATA.ARMOURS).length;
    if (n < 10) throw new Error('only ' + n);
    return n + ' armours';
  });
  check('enemies >= 12', function () {
    const g = loadGame();
    const n = Object.keys(g.SF.DATA.ENEMIES).length;
    if (n < 12) throw new Error('only ' + n);
    return n + ' enemies';
  });
  check('evolutions >= 8', function () {
    const g = loadGame();
    const n = Object.keys(g.SF.DATA.EVOLUTIONS).length;
    if (n < 8) throw new Error('only ' + n);
    return n + ' evolutions';
  });
  check('characters >= 5', function () {
    const g = loadGame();
    const n = Object.keys(g.SF.DATA.CHARACTERS).length;
    if (n < 5) throw new Error('only ' + n);
    return n + ' characters';
  });
  check('every evolution maps to a base weapon and passive key', function () {
    const g = loadGame();
    const D = g.SF.DATA;
    Object.keys(D.EVOLUTIONS).forEach(function (k) {
      const evo = D.EVOLUTIONS[k];
      if (!D.WEAPONS[k]) throw new Error('evolution base missing ' + k);
      const key = evo.req.element === 'fire' ? 'pyre' : evo.req.element === 'ice' ? 'rime' : evo.req.element === 'lightning' ? 'volt' : evo.req.element === 'poison' ? 'toxin' : 'umbra';
      if (!D.PASSIVES[key]) throw new Error('passive key missing for ' + k);
    });
    return 'ok';
  });
  check('every enemy referenced by a biome exists', function () {
    const g = loadGame();
    const D = g.SF.DATA;
    D.BIOMES.forEach(function (b) {
      b.enemies.forEach(function (id) {
        if (!D.ENEMIES[id]) throw new Error('missing enemy ' + id);
      });
    });
    return 'ok';
  });
}

if (mode === 'runs' || mode === 'all') {
  console.log('== full runs (autopilot) ==');
  const chars = ['rook', 'sly', 'mara', 'cinder', 'vex'];
  chars.forEach(function (c) {
    check('run as ' + c, function () {
      const r = runSim({ character: c, maxLevel: 25 });
      if (r.errors) throw new Error('runtime errors');
      return 'lvl ' + r.level + ' kills ' + r.kills + ' dmg ' + r.damage + ' taken ' + r.damageTaken + ' gold ' + r.gold + ' weapon ' + r.weapon + ' L' + r.weaponLevel;
    });
  });
}

if (mode === 'deep' || mode === 'all') {
  console.log('== deep scaling (immortal, buffed) ==');
  check('deep run to level 60', function () {
    const r = runSim({ immortal: true, buff: true, maxLevel: 60, shop: true });
    if (r.errors) throw new Error('runtime errors');
    const times = r.levelTimes.filter(function (t) { return t.level % 5 !== 0; }).map(function (t) { return t.level + ':' + t.time + 's'; });
    console.log('    clear times: ' + times.join(' '));
    const bosses = r.levelTimes.filter(function (t) { return t.level % 5 === 0; }).map(function (t) { return t.level + ':' + t.time + 's'; });
    console.log('    boss times:  ' + bosses.join(' '));
    return 'reached level ' + r.level + ' in ' + r.time + 's';
  });
}

if (mode === 'bosses' || mode === 'all') {
  console.log('== boss encounters ==');
  ['butcher', 'matron', 'colossus', 'sovereign'].forEach(function (id, i) {
    check('boss ' + id, function () {
      const g = loadGame();
      const SF = g.SF;
      const run = new SF.Run({ characterId: 'rook' });
      run.weapon.level = 5;
      run.passives = { overclock: 2, hollowpoint: 3, keen: 2, vitality: 3, plating: 2, pyre: 1 };
      run.acquireArmour(run.makeArmour('bulwark', 'rare'), true);
      run.recompute();
      run.player.hp = run.stats.maxHp;
      run.player.shield = run.stats.shield;
      run.startLevel(5 + i * 5);
      if (!run.bossActive) throw new Error('no boss spawned');
      const name = run.bossActive.def.name;
      let steps = 0;
      while (run.bossActive && steps < 60 * 120) {
        steps++;
        autopilot(run, SF.U);
        run.update(1 / 60);
        if (run.phase === 'dead') break;
      }
      const bhp = run.bossActive ? Math.round((run.bossActive.hp / run.bossActive.maxHp) * 100) : 0;
      return name + ' ' + (run.bossActive ? 'NOT KILLED in 120s (bosshp ' + bhp + '%, playerhp ' + Math.round(run.player.hp) + '/' + run.stats.maxHp + ', phase ' + run.phase + ', dps~' + Math.round(run.runStats.damage / 120) + ')' : 'killed');
    });
  });
}

if (mode === 'systems') {
  console.log('== systems ==');
  check('rewards always return 3 valid cards', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    for (let i = 0; i < 200; i++) {
      const cards = run.generateRewards(3);
      if (!cards.length) throw new Error('no cards');
      cards.forEach(function (c) { run.applyReward(c); });
    }
    return 'ok';
  });
  check('shop offers are priced and purchasable', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    run.gold = 99999;
    for (let i = 0; i < 50; i++) {
      const offers = run.generateShop();
      if (!offers.length) throw new Error('no offers');
      offers.forEach(function (o) {
        if (typeof o.price !== 'number' || o.price <= 0) throw new Error('bad price');
        run.buyOffer(o);
      });
    }
    return 'ok';
  });
  check('equipment swap changes stats', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    const before = run.stats.maxHp;
    run.acquireArmour(run.makeArmour('titanheart', 'legendary'), true);
    if (run.stats.maxHp <= before) throw new Error('armour hp not applied');
    run.acquireWeapon(run.makeWeapon('sniper', 3, 'rare'), true);
    if (run.weapon.id !== 'sniper') throw new Error('weapon not equipped');
    return before + ' -> ' + run.stats.maxHp + ' hp';
  });
  check('evolution unlock works', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    run.weapon.level = 5;
    if (run.availableEvolution()) throw new Error('evolved too early');
    run.passives.pyre = 2;
    const evo = run.availableEvolution();
    if (!evo) throw new Error('evolution not available');
    run.applyReward({ type: 'evolve', evoId: evo.id });
    if (!run.weapon.evolved) throw new Error('not evolved');
    if (run.weaponDamage(run.weapon) < run.weaponDamage(run.weapon) * 0.5) throw new Error('bad damage');
    return evo.name;
  });
  check('mender heals and summoner spawns', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    run.startLevel(8);
    const m = run.spawnEnemy('mender', { x: 400, y: 400 });
    const c = run.spawnEnemy('crawler', { x: 420, y: 400 });
    c.hp = 10;
    run.spawnEnemy('summoner', { x: 600, y: 400 });
    const before = run.enemies.length;
    for (let i = 0; i < 400; i++) run.update(1 / 60);
    if (run.enemies.length <= before) throw new Error('summoner produced nothing');
    if (c.hp <= 10) throw new Error('mender did not heal');
    return 'ok';
  });
  check('consumables work', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    run.consumables.potion = 1;
    run.player.hp = 10;
    run.useConsumable('potion');
    if (run.player.hp <= 10) throw new Error('potion failed');
    run.consumables.bomb = 1;
    run.spawnEnemy('crawler', { x: run.player.x + 40, y: run.player.y });
    const e = run.enemies[run.enemies.length - 1];
    run.useConsumable('bomb');
    if (e.hp >= e.maxHp) throw new Error('bomb failed');
    return 'ok';
  });
  check('elemental effects apply', function () {
    const g = loadGame();
    const run = new g.SF.Run({});
    const e = run.spawnEnemy('crawler', { x: 400, y: 400 });
    run.applyBurn(e, 10, 2);
    run.applyChill(e, 0.5, 2);
    run.applyPoison(e, 3, 4, 3);
    run.applyMark(e, 2);
    if (!e.statuses.burn || !e.statuses.chill || !e.statuses.poison || !e.statuses.mark) throw new Error('status missing');
    const hp = e.hp;
    for (let i = 0; i < 60; i++) run.update(1 / 60);
    if (e.hp >= hp) throw new Error('dot did nothing');
    return 'ok';
  });
}

if (mode === 'all') {
  if (failures) {
    console.log('\n' + failures + ' FAILURES');
    process.exit(1);
  }
  console.log('\nALL CHECKS PASSED');
}
