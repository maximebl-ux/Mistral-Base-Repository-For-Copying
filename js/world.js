(function () {
  const SF = window.SF;
  const U = SF.U;
  const D = SF.DATA;

  const ARENA_W = 1900;
  const ARENA_H = 1400;
  const MAX_ALIVE = 30;
  const BASE_UNLOCK_WEAPONS = ['cleaver', 'fangs', 'rifle', 'shotgun', 'arc'];
  const BASE_UNLOCK_ARMOUR = ['rags', 'vanguard', 'bulwark', 'ghostweave'];
  const BOSS_ORDER = ['butcher', 'matron', 'colossus', 'sovereign'];

  function scaleFor(level) {
    const L = Math.max(0, level - 1);
    return {
      hp: 1 + 0.155 * L + 0.011 * Math.pow(L, 1.62),
      dmg: 1 + 0.05 * L + 0.0022 * Math.pow(L, 1.5),
      speed: Math.min(1.45, 1 + 0.009 * L),
      gold: 1 + 0.06 * L,
      elite: Math.min(0.36, 0.03 + 0.012 * L)
    };
  }

  class Run {
    constructor(opts) {
      opts = opts || {};
      const self = this;
      this.listeners = {};
      this.characterId = opts.characterId || 'rook';
      this.character = D.CHARACTERS[this.characterId] || D.CHARACTERS.rook;
      this.challengeId = opts.challenge || 'normal';
      this.challenge = D.CHALLENGES.find(function (c) { return c.id === self.challengeId; }) || D.CHALLENGES[0];
      this.modifierIds = opts.modifiers ? opts.modifiers.slice() : [];
      this.modifiers = this.modifierIds.map(function (id) {
        return D.MODIFIERS.find(function (m) { return m.id === id; });
      }).filter(Boolean);
      this.meta = opts.meta || { upgrades: {}, weapons: [], armours: [] };
      this.unlockedWeapons = {};
      (this.meta.weapons || []).concat(BASE_UNLOCK_WEAPONS).forEach(function (id) { self.unlockedWeapons[id] = true; });
      this.unlockedArmours = {};
      (this.meta.armours || []).concat(BASE_UNLOCK_ARMOUR).forEach(function (id) { self.unlockedArmours[id] = true; });
      this.newUnlocks = [];

      this.time = 0;
      this.level = 0;
      this.phase = 'fighting';
      this.biome = D.BIOMES[0];
      this.enemies = [];
      this.bullets = [];
      this.slashes = [];
      this.beams = [];
      this.particles = [];
      this.floaters = [];
      this.pickups = [];
      this.zones = [];
      this.rings = [];
      this.timers = [];
      this.pendingSpawns = 0;
      this.spawnTimer = 0;
      this.maxAlive = 12;
      this.slowMoT = 0;
      this.shake = 0;
      this.scale = scaleFor(1);
      this.isBossLevel = false;
      this.bossActive = null;
      this.lastBossId = 'butcher';
      this.pendingSpecialReward = null;
      this.gold = 55;
      this.passives = {};
      this.relics = [];
      this.consumables = {};
      this.ownedWeapons = [];
      this.ownedArmours = [];
      this.weaponIndex = 0;
      this.armourIndex = 0;
      this.runStats = { kills: 0, damage: 0, damageTaken: 0, bosses: 0, elites: 0, levels: 1, evolutions: 0, healed: 0 };
      this.reviveUsed = false;
      this.input = { ax: 0, ay: 0, aimX: 0, aimY: 0, fire: false, autoAim: false, dash: false, ability: false };

      this.player = {
        x: ARENA_W / 2, y: ARENA_H / 2, r: 15, vx: 0, vy: 0,
        hp: 100, shield: 0, aim: 0, invuln: 0, fireCd: 0, dashCd: 0,
        abilityCd: 0, slowT: 0, weakT: 0, poisonT: 0, poisonStacks: 0,
        adrenT: 0, wardT: 0, focusT: 0, anim: 0, dead: false, hurtFlash: 0, facing: 0
      };

      this.ownedWeapons.push(this.makeWeapon(this.character.weapon, 1, 'uncommon'));
      this.ownedArmours.push(this.makeArmour(this.character.armour, 'uncommon'));
      this.recompute();
      this.player.hp = this.stats.maxHp;
      this.player.shield = this.stats.shield;

      this.startLevel(1);
    }

    on(type, fn) {
      (this.listeners[type] = this.listeners[type] || []).push(fn);
    }

    emit(type, data) {
      const list = this.listeners[type];
      if (!list) return;
      for (let i = 0; i < list.length; i++) list[i](data);
    }

    hasModifier(id) {
      return this.modifierIds.indexOf(id) >= 0;
    }

    get weapon() {
      return this.ownedWeapons[this.weaponIndex];
    }

    get armour() {
      return this.ownedArmours[this.armourIndex];
    }

    defOf(item) {
      if (!item) return D.WEAPONS.cleaver;
      return item.evolved ? D.EVOLUTIONS[item.id] : D.WEAPONS[item.id];
    }

    makeWeapon(id, level, rarityId, evolved) {
      return {
        kind: 'weapon', id: id, level: level || 1, rarity: rarityId || 'common',
        evolved: !!evolved, uid: U.uid()
      };
    }

    makeArmour(id, rarityId) {
      const base = D.ARMOURS[id];
      const rar = D.RARITY_BY_ID[rarityId] || D.RARITY_BY_ID.common;
      const stats = {
        maxHp: Math.round((base.hp || 0) * (1 + (rar.mult - 1) * 1.05)),
        dr: Math.min(0.5, (base.dr || 0) * (1 + (rar.mult - 1) * 0.85)),
        speed: base.speed || 0,
        crit: base.crit || 0,
        critMult: base.critMult || 0,
        dodge: base.dodge || 0,
        regen: base.regen || 0,
        shield: Math.round((base.shield || 0) * (1 + (rar.mult - 1) * 0.8)),
        shieldRegen: base.shieldRegen || 0,
        lifesteal: base.lifesteal || 0,
        thorns: base.thorns || 0,
        fireRate: base.fireRate || 0,
        cdReduce: base.cdReduce || 0,
        dmg: 0,
        elem: U.copy(base.elem || {})
      };
      const affixes = [];
      for (let i = 0; i < rar.affixes; i++) {
        const choices = D.AFFIXES.filter(function (a) {
          return !affixes.some(function (x) { return x.id === a.id; });
        });
        const affix = U.pick(choices);
        if (!affix) break;
        const value = affix.roll(rar.mult);
        affix.apply(stats, value);
        affixes.push({ id: affix.id, value: value, text: affix.text(value) });
      }
      return {
        kind: 'armour', id: id, rarity: rar.id, uid: U.uid(), stats: stats, affixes: affixes, name: base.name
      };
    }

    recompute() {
      const cs = this.character.stats || {};
      const s = {
        maxHp: 100, dr: 0, speed: 1, crit: 0.05, critMult: 1.6, lifesteal: 0,
        shield: 0, shieldRegen: 2, regen: 0, dmg: 1, fireRate: 1, area: 1, dodge: 0,
        thorns: 0, extraProj: 0, extraPierce: 0, gold: 1, pickup: 105, revives: 0,
        ricochet: 0, cdReduce: 0, healBonus: 1, aura: null,
        elem: { fire: 0, ice: 0, lightning: 0, poison: 0, shadow: 0 }
      };
      s.dmg += cs.dmg || 0;
      s.dr += cs.dr || 0;
      s.fireRate += cs.fireRate || 0;
      s.speed += cs.speed || 0;
      s.crit += cs.crit || 0;
      s.critMult += cs.critMult || 0;
      s.shield += cs.shield || 0;
      if (cs.elemFire) s.elem.fire += cs.elemFire;
      if (cs.shadow) s.elem.shadow += cs.shadow;

      const armour = this.armour;
      if (armour) {
        const a = armour.stats;
        s.maxHp += a.maxHp || 0;
        s.dr += a.dr || 0;
        s.speed += a.speed || 0;
        s.crit += a.crit || 0;
        s.critMult += a.critMult || 0;
        s.dodge += a.dodge || 0;
        s.regen += a.regen || 0;
        s.shield += a.shield || 0;
        s.shieldRegen += a.shieldRegen || 0;
        s.lifesteal += a.lifesteal || 0;
        s.thorns += a.thorns || 0;
        s.fireRate += a.fireRate || 0;
        s.cdReduce += a.cdReduce || 0;
        s.dmg += a.dmg || 0;
        if (a.elem) for (const k in a.elem) s.elem[k] = (s.elem[k] || 0) + a.elem[k];
        const baseDef = D.ARMOURS[armour.id];
        if (baseDef && baseDef.aura) s.aura = baseDef.aura;
        if (baseDef && baseDef.passive === 'lifesteal') s.lifesteal += 0.02 * D.RARITY_BY_ID[armour.rarity].mult;
      }

      for (const id in this.passives) {
        const def = D.PASSIVES[id];
        const stacks = this.passives[id];
        if (def && stacks > 0) def.apply(s, stacks);
      }

      for (let i = 0; i < this.relics.length; i++) {
        const relic = D.RELICS[this.relics[i]];
        if (relic && relic.apply) relic.apply(s);
      }

      const up = this.meta.upgrades || {};
      s.maxHp += 6 * (up.core || 0);
      s.dmg += 0.03 * (up.edge || 0);
      s.gold += 0.06 * (up.cache || 0);
      s.cdReduce += 0.08 * (up.dash || 0);
      s.dr += 0.02 * (up.ward || 0);

      if (this.hasModifier('glass')) {
        s.maxHp *= 0.6;
        s.dmg += 0.4;
      }

      s.dr = U.clamp(s.dr, 0, 0.75);
      s.dodge = U.clamp(s.dodge, 0, 0.6);
      s.speed = Math.max(0.55, s.speed);
      s.maxHp = Math.round(s.maxHp);
      s.shield = Math.round(s.shield);

      const prev = this.stats;
      this.stats = s;
      const p = this.player;
      if (p && prev) {
        if (s.maxHp > prev.maxHp) p.hp += s.maxHp - prev.maxHp;
        if (s.shield > prev.shield) p.shield += s.shield - prev.shield;
      }
      if (p) {
        p.hp = Math.min(p.hp, s.maxHp);
        p.shield = Math.min(Math.max(p.shield, 0), s.shield);
      }
      return s;
    }

    elemBonus(element) {
      if (!element || element === 'physical') return 0;
      return this.stats.elem[element] || 0;
    }

    weaponDamage(item) {
      const def = this.defOf(item);
      const rar = D.RARITY_BY_ID[item.rarity] || D.RARITY_BY_ID.common;
      const levelMul = 1 + 0.2 * (item.level - 1);
      const rarityMul = 1 + (rar.mult - 1) * 0.55;
      return def.dmg * levelMul * rarityMul * this.stats.dmg;
    }

    weaponInterval(item) {
      const def = this.defOf(item);
      let interval = def.interval / this.stats.fireRate;
      if (this.player.focusT > 0) interval /= 1.35;
      if (this.player.adrenT > 0) interval /= 1.45;
      return Math.max(0.04, interval);
    }

    startLevel(level) {
      this.level = level;
      this.phase = 'fighting';
      this.scale = scaleFor(level);
      this.runStats.levels = Math.max(this.runStats.levels, level);
      const block = Math.floor((level - 1) / 5);
      this.biome = D.BIOMES[block % D.BIOMES.length];
      this.enemies.length = 0;
      this.bullets.length = 0;
      this.slashes.length = 0;
      this.beams.length = 0;
      this.particles.length = 0;
      this.floaters.length = 0;
      this.pickups.length = 0;
      this.rings.length = 0;
      this.timers.length = 0;
      this.zones = this.makeHazards(level);
      this.bossActive = null;
      this.isBossLevel = level % 5 === 0;
      this.maxAlive = Math.min(MAX_ALIVE, 9 + Math.floor(level * 0.8));
      this.player.x = ARENA_W / 2;
      this.player.y = ARENA_H / 2;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.invuln = 1.2;
      this.player.slowT = 0;
      this.player.poisonT = 0;
      this.player.poisonStacks = 0;
      this.player.dead = false;
      this.levelStartTime = this.time;
      this.enraged = false;
      this.fatigue = false;

      if (this.isBossLevel) {
        this.pendingSpawns = 0;
        this.spawnBoss(level);
      } else {
        let count = Math.min(42, 5 + level * 1.05);
        if (this.hasModifier('swarm')) count *= 1.5;
        this.pendingSpawns = Math.round(count);
        this.spawnTimer = 0.5;
        if (level % 3 === 0) this.spawnMiniboss(level);
        if (this.nextLevelChallenge) {
          this.nextLevelChallenge = false;
          this.spawnMiniboss(level);
        }
      }
      this.emit('levelstart', { level: level, biome: this.biome, boss: this.isBossLevel });
    }

    makeHazards(level) {
      const zones = [];
      const biome = this.biome;
      const count = Math.min(7, 2 + Math.floor(level / 6));
      for (let i = 0; i < count; i++) {
        const x = U.rand(200, ARENA_W - 200);
        const y = U.rand(200, ARENA_H - 200);
        if (U.dist(x, y, ARENA_W / 2, ARENA_H / 2) < 250) continue;
        if (biome.hazard === 'ice') {
          zones.push({ x: x, y: y, r: U.rand(90, 145), delay: 0, armed: true, duration: 9999, dmg: 0, owner: 'hazard', kind: 'ice', color: '#9fe0ff' });
        } else if (biome.hazard === 'spore') {
          zones.push({ x: x, y: y, r: U.rand(70, 120), delay: 0, armed: true, duration: 9999, dmg: biome.hazardDamage, tick: 0.85, tickTimer: U.rand(0, 0.85), owner: 'hazard', kind: 'spore', element: 'poison', color: '#9dff6b' });
        } else if (biome.hazard === 'vent') {
          zones.push({ x: x, y: y, r: U.rand(58, 100), delay: 0, armed: true, duration: 9999, dmg: biome.hazardDamage, tick: 0.95, tickTimer: U.rand(0, 0.95), owner: 'hazard', kind: 'vent', element: 'fire', color: '#ff7a3c' });
        } else {
          zones.push({ x: x, y: y, r: U.rand(80, 130), delay: 0, armed: true, duration: 9999, dmg: biome.hazardDamage, tick: 0.75, tickTimer: U.rand(0, 0.75), owner: 'hazard', kind: 'rift', element: 'shadow', color: '#b07cff' });
        }
      }
      return zones;
    }

    enemyPool() {
      const self = this;
      const pool = [];
      const seen = {};
      this.biome.enemies.forEach(function (id) {
        const def = D.ENEMIES[id];
        if (!def || def.unlock > self.level || seen[id]) return;
        seen[id] = true;
        let weight = def.weight;
        if (def.unlock >= self.level - 2) weight *= 1.4;
        pool.push({ id: id, weight: weight });
      });
      if (!pool.length) pool.push({ id: 'crawler', weight: 1 });
      return pool;
    }

    spawnPosition() {
      const p = this.player;
      for (let i = 0; i < 24; i++) {
        const a = U.rand(0, U.TAU);
        const d = U.rand(520, 760);
        const x = U.clamp(p.x + Math.cos(a) * d, 90, ARENA_W - 90);
        const y = U.clamp(p.y + Math.sin(a) * d, 90, ARENA_H - 90);
        if (U.dist(x, y, p.x, p.y) > 420) return { x: x, y: y };
      }
      return { x: U.rand(120, ARENA_W - 120), y: U.rand(120, ARENA_H - 120) };
    }

    rollEliteModifiers(tier) {
      const ids = Object.keys(D.ELITE_MODIFIERS);
      const count = tier >= 2 ? 2 : 1;
      return U.pickMany(ids, count).map(function (id) { return D.ELITE_MODIFIERS[id]; });
    }

    spawnEnemy(id, opts) {
      opts = opts || {};
      const def = D.ENEMIES[id];
      if (!def) return null;
      const sc = this.scale;
      const ch = this.challenge;
      const pos = opts.x !== undefined ? { x: opts.x, y: opts.y } : this.spawnPosition();
      const tier = opts.tier || 0;
      let hp = def.hp * sc.hp * ch.hp;
      let dmg = def.dmg * sc.dmg * ch.dmg;
      let speed = def.speed * sc.speed * (this.hasModifier('swift') ? 1.25 : 1);
      let gold = def.gold * (1 + 0.08 * (this.level - 1));
      let radius = def.r;
      if (tier === 1) {
        hp *= 2.6;
        dmg *= 1.25;
        gold *= 3.2;
        speed *= 0.96;
        radius *= 1.16;
      } else if (tier === 2) {
        hp *= 5.5;
        dmg *= 1.4;
        gold *= 6;
        speed *= 0.92;
        radius *= 1.4;
      }
      const mods = tier > 0 ? this.rollEliteModifiers(tier) : [];
      mods.forEach(function (m) {
        if (m.hp) hp *= m.hp;
        if (m.dmg) dmg *= m.dmg;
        if (m.speed) speed *= m.speed;
      });
      const e = {
        uid: U.uid(), def: def, id: id, x: pos.x, y: pos.y, vx: 0, vy: 0, r: radius,
        hp: Math.round(hp), maxHp: Math.round(hp), dmg: dmg, speed: speed,
        gold: Math.round(gold), tier: tier, mods: mods,
        dr: (def.dr || 0) + mods.reduce(function (a, m) { return a + (m.dr || 0); }, 0),
        shield: 0, maxShield: 0, shieldRegen: 0,
        atkCd: U.rand(0.2, 1.2), state: 'idle', stateT: 0, anim: 0,
        statuses: { burn: null, chill: null, poison: null, mark: null },
        kx: 0, ky: 0, dead: false, boss: null, charge: null, facing: 0, bob: U.rand(0, 6.28)
      };
      const shieldMod = mods.find(function (m) { return m.shield; });
      const baseShield = (def.shield || 0) * (1 + 0.06 * (this.level - 1));
      e.summonBudget = def.summon ? 8 : 0;
      e.maxShield = Math.round(baseShield + (shieldMod ? hp * shieldMod.shield : 0));
      e.shield = e.maxShield;
      e.shieldRegen = (def.shieldRegen || 0) * (1 + 0.03 * (this.level - 1));
      this.enemies.push(e);
      return e;
    }

    spawnMiniboss(level) {
      const pool = ['crusher', 'brute', 'warden', 'bulwark'];
      const id = pool[Math.floor(level / 3) % pool.length];
      const pos = this.spawnPosition();
      const e = this.spawnEnemy(id, { tier: 2, x: pos.x, y: pos.y });
      if (e) {
        e.isMiniboss = true;
        this.rings.push({ x: e.x, y: e.y, r: e.r, maxR: e.r + 120, t: 0, dur: 0.9, color: '#ffd166', width: 3 });
        this.emit('sfx', 'boss');
      }
    }

    spawnBoss(level) {
      const index = (Math.floor(level / 5) - 1) % BOSS_ORDER.length;
      const tier = Math.floor((level - 1) / 20);
      const id = BOSS_ORDER[index];
      const def = D.BOSSES[id];
      const ch = this.challenge;
      const sc = this.scale;
      const hp = Math.round(def.hp * sc.hp * ch.hp * (1 + 0.2 * tier) * 1.6);
      const e = {
        uid: U.uid(), def: def, id: id, x: ARENA_W / 2, y: 240, r: def.r,
        hp: hp, maxHp: hp, dmg: 17 * sc.dmg * ch.dmg * (1 + 0.08 * tier), speed: def.speed * sc.speed,
        gold: Math.round(def.gold * (1 + 0.1 * level)), tier: 3, mods: [],
        dr: 0, shield: 0, maxShield: 0, shieldRegen: 0,
        atkCd: 1.5, state: 'idle', stateT: 0, anim: 0, kx: 0, ky: 0,
        statuses: { burn: null, chill: null, poison: null, mark: null },
        dead: false, isBoss: true, facing: 0, bob: 0,
        boss: { phase: 1, phases: def.phases, attackT: 2.4, patternIndex: 0, charge: null, addTimer: 9 }
      };
      this.enemies.push(e);
      this.bossActive = e;
      this.lastBossId = id;
      this.rings.push({ x: e.x, y: e.y, r: 20, maxR: 420, t: 0, dur: 1.2, color: def.accent, width: 5 });
      this.emit('sfx', 'boss');
      this.emit('boss', { name: def.name, title: def.title });
      return e;
    }

    completeLevel() {
      if (this.phase !== 'fighting') return;
      this.phase = 'cleared';
      const bonus = Math.round((22 + this.level * 7) * this.stats.gold);
      this.gold += bonus;
      if (this.level % 5 === 0) this.healPlayer(this.stats.maxHp * 0.2, true);
      this.emit('sfx', 'levelup');
      this.emit('levelclear', { level: this.level, gold: bonus });
    }

    update(dt) {
      if (this.phase === 'dead') {
        this.updateEffects(dt);
        return;
      }
      dt = Math.min(dt, 0.05);
      this.time += dt;
      if (this.slowMoT > 0) this.slowMoT -= dt;
      this.updatePlayer(dt);
      if (this.phase === 'fighting') this.updateSpawns(dt);
      if (!this.enraged && this.phase === 'fighting' && this.time - (this.levelStartTime || 0) > 75 && this.enemies.length > 0) {
        this.enraged = true;
        this.emit('enrage', {});
        this.emit('notice', { text: 'The horde grows relentless', color: '#ffb066' });
        for (let i = 0; i < this.enemies.length; i++) {
          const en = this.enemies[i];
          en.speed *= 1.25;
          en.fleeDisabled = true;
        }
      }
      if (!this.fatigue && this.phase === 'fighting' && this.time - (this.levelStartTime || 0) > 110) {
        this.fatigue = true;
        this.emit('notice', { text: 'Enemies are overwhelmed', color: '#ffd166' });
      }
      const eDt = dt * (this.slowMoT > 0 ? 0.4 : 1);
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.dead) {
          this.enemies.splice(i, 1);
          continue;
        }
        this.updateEnemy(e, eDt);
      }
      this.updateBullets(dt);
      this.updateZones(dt);
      this.updatePickups(dt);
      this.updateEffects(dt);
      this.updateTimers(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
      if (this.phase === 'fighting' && this.pendingSpawns <= 0 && this.enemies.length === 0) this.completeLevel();
    }

    updateTimers(dt) {
      for (let i = this.timers.length - 1; i >= 0; i--) {
        const t = this.timers[i];
        t.t -= dt;
        if (t.t <= 0) {
          this.timers.splice(i, 1);
          t.fn();
        }
      }
    }

    after(delay, fn) {
      this.timers.push({ t: delay, fn: fn });
    }

    updateSpawns(dt) {
      if (this.pendingSpawns <= 0) return;
      if (this.enemies.length >= this.maxAlive) return;
      this.spawnTimer -= dt;
      if (this.spawnTimer > 0) return;
      const pool = this.enemyPool();
      const batch = this.enemies.length < this.maxAlive - 4 ? 2 : 1;
      for (let i = 0; i < batch && this.pendingSpawns > 0; i++) {
        const choice = U.weightedPick(pool, function (o) { return o.weight; });
        const eliteChance = this.scale.elite * (this.hasModifier('elite') ? 2 : 1);
        const isElite = U.chance(eliteChance) && this.level > 2;
        this.spawnEnemy(choice.id, { tier: isElite ? 1 : 0 });
        this.pendingSpawns--;
      }
      this.spawnTimer = U.clamp(1.45 - this.level * 0.022, 0.42, 1.45);
    }

    updatePlayer(dt) {
      const p = this.player;
      const st = this.stats;
      p.invuln = Math.max(0, p.invuln - dt);
      p.hurtFlash = Math.max(0, p.hurtFlash - dt * 3);
      p.fireCd -= dt;
      p.dashCd = Math.max(0, p.dashCd - dt);
      p.abilityCd = Math.max(0, p.abilityCd - dt);
      p.anim += dt;
      if (p.slowT > 0) p.slowT -= dt;
      if (p.weakT > 0) p.weakT -= dt;
      if (p.adrenT > 0) p.adrenT -= dt;
      if (p.wardT > 0) p.wardT -= dt;
      if (p.focusT > 0) p.focusT -= dt;
      if (p.poisonT > 0) {
        p.poisonT -= dt;
        if (p.poisonT <= 0) p.poisonStacks = 0;
        else if (p.poisonStacks > 0) this.hurtPlayer(p.poisonStacks * 1.1 * dt, null, { silent: true, ignoreInvuln: true });
      }
      if (st.regen > 0 && p.hp < st.maxHp) this.healPlayer(st.regen * dt * (p.slowT > 0 ? 0.6 : 1), true);
      if (st.shield > 0 && p.shield < st.shield) p.shield = Math.min(st.shield, p.shield + st.shieldRegen * dt);

      let speed = 250 * st.speed;
      if (p.slowT > 0) speed *= 0.66;
      if (p.adrenT > 0) speed *= 1.25;
      if (p.focusT > 0) speed *= 1.1;
      let ax = this.input.ax;
      let ay = this.input.ay;
      const mag = Math.hypot(ax, ay);
      if (mag > 1) {
        ax /= mag;
        ay /= mag;
      }
      p.vx = U.damp(p.vx, ax * speed, 18, dt);
      p.vy = U.damp(p.vy, ay * speed, 18, dt);
      p.x = U.clamp(p.x + p.vx * dt, 30, ARENA_W - 30);
      p.y = U.clamp(p.y + p.vy * dt, 30, ARENA_H - 30);
      if (mag > 0.05) p.facing = Math.atan2(ay, ax);

      let aimX = this.input.aimX;
      let aimY = this.input.aimY;
      if (this.input.autoAim || (aimX === 0 && aimY === 0)) {
        const t = this.nearestEnemy(p.x, p.y, 900);
        if (t) {
          aimX = t.x;
          aimY = t.y;
        } else {
          aimX = p.x + Math.cos(p.facing) * 100;
          aimY = p.y + Math.sin(p.facing) * 100;
        }
      }
      p.aim = Math.atan2(aimY - p.y, aimX - p.x);

      if (this.input.fire) this.tryFire();
      if (this.input.dash) {
        this.doDash();
        this.input.dash = false;
      }
      if (this.input.ability) {
        this.doAbility();
        this.input.ability = false;
      }

      const aura = st.aura;
      if (aura === 'burn') this.auraTick(dt, 'burn', 110, 12);
      else if (aura === 'chill') this.auraTick(dt, 'chill', 150, 0);
      else if (aura === 'zap') this.auraTick(dt, 'zap', 150, 8);
      if (this.defOf(this.weapon).stormAura) this.auraTick(dt, 'zap', 165, 6);
    }

    auraTick(dt, kind, radius, power) {
      const p = this.player;
      this.auraTimers = this.auraTimers || {};
      if (kind === 'chill') {
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (U.dist(e.x, e.y, p.x, p.y) < radius + e.r) this.applyChill(e, 0.7, 0.4);
        }
        return;
      }
      this.auraTimers[kind] = (this.auraTimers[kind] || 0) - dt;
      if (this.auraTimers[kind] > 0) return;
      this.auraTimers[kind] = kind === 'zap' ? 0.55 : 0.7;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (U.dist(e.x, e.y, p.x, p.y) > radius + e.r) continue;
        if (kind === 'burn') {
          this.damageEnemy(e, power, { element: 'fire', silent: true });
          this.applyBurn(e, 5, 2);
        } else if (kind === 'zap') {
          this.damageEnemy(e, power, { element: 'lightning', silent: true });
          this.beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, t: 0, dur: 0.12, color: '#ffe680', width: 4, jitter: 8 });
        }
      }
    }

    nearestEnemy(x, y, maxDist) {
      let best = null;
      let bestD = maxDist || 99999;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) continue;
        const d = U.dist(x, y, e.x, e.y);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      return best;
    }

    doDash() {
      const p = this.player;
      if (p.dashCd > 0) return;
      p.dashCd = 1.7 * (1 - this.stats.cdReduce);
      const len = 210;
      let ax = Math.cos(p.aim);
      let ay = Math.sin(p.aim);
      if (Math.hypot(this.input.ax, this.input.ay) > 0.3) {
        const m = Math.hypot(this.input.ax, this.input.ay);
        ax = this.input.ax / m;
        ay = this.input.ay / m;
      }
      for (let i = 0; i < 14; i++) {
        this.particles.push({
          x: p.x + U.rand(-10, 10), y: p.y + U.rand(-10, 10), vx: U.rand(-40, 40),
          vy: U.rand(-40, 40), life: 0.5, maxLife: 0.5, size: U.rand(2, 5), color: '#8fd0ff'
        });
      }
      p.x = U.clamp(p.x + ax * len, 40, ARENA_W - 40);
      p.y = U.clamp(p.y + ay * len, 40, ARENA_H - 40);
      p.invuln = Math.max(p.invuln, 0.28);
      this.emit('sfx', 'dash');
    }

    doAbility() {
      const p = this.player;
      if (p.abilityCd > 0) return;
      const active = this.character.active;
      p.abilityCd = active.cd * (1 - this.stats.cdReduce);
      const baseDmg = active.id === 'slam' ? 90 : active.id === 'blink' ? 70 : active.id === 'nova' ? 110 : active.id === 'rift' ? 130 : 0;
      const dmg = baseDmg * this.stats.dmg;
      this.emit('sfx', active.id === 'focus' ? 'shield' : 'explode');
      if (active.id === 'slam') {
        this.explode(p.x, p.y, 230 * this.stats.area, dmg, 'physical', { knockback: 520, color: '#7fb2ea' });
        p.invuln = Math.max(p.invuln, 1.2);
      } else if (active.id === 'blink') {
        const ax = Math.cos(p.aim);
        const ay = Math.sin(p.aim);
        const tx = U.clamp(p.x + ax * 300, 40, ARENA_W - 40);
        const ty = U.clamp(p.y + ay * 300, 40, ARENA_H - 40);
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          const t = U.clamp((e.x - p.x) * ax + (e.y - p.y) * ay, 0, 300);
          if (U.dist(e.x, e.y, p.x + ax * t, p.y + ay * t) < 70 + e.r) {
            this.damageEnemy(e, dmg, { element: 'shadow', crit: true });
          }
        }
        this.beams.push({ x1: p.x, y1: p.y, x2: tx, y2: ty, t: 0, dur: 0.25, color: '#9b5cff', width: 14, jitter: 0 });
        p.x = tx;
        p.y = ty;
        p.invuln = Math.max(p.invuln, 0.4);
      } else if (active.id === 'focus') {
        this.slowMoT = 3.5;
        p.focusT = 3.5;
        this.rings.push({ x: p.x, y: p.y, r: 20, maxR: 320, t: 0, dur: 0.6, color: '#5fb7ff', width: 4 });
      } else if (active.id === 'nova') {
        this.explode(p.x, p.y, 250 * this.stats.area, dmg, 'fire', { knockback: 240, color: '#ff9b4a', burn: { dps: 14, dur: 4 } });
      } else if (active.id === 'rift') {
        this.zones.push({
          x: p.x, y: p.y, r: 210, delay: 0.7, armed: false, duration: 0.01, dmg: dmg,
          owner: 'player', kind: 'riftburst', element: 'shadow', color: '#b07cff', pull: 260, knock: 120
        });
      }
    }

    tryFire() {
      const p = this.player;
      if (p.fireCd > 0) return;
      const item = this.weapon;
      const def = this.defOf(item);
      p.fireCd = this.weaponInterval(item);
      this.attack(def, item);
    }

    attack(def, item) {
      const p = this.player;
      const dmg = this.weaponDamage(item);
      const critChance = U.clamp(this.stats.crit + (def.crit || 0), 0, 0.95);
      const crit = Math.random() < critChance;
      const element = def.element || 'physical';
      const total = dmg * (1 + this.elemBonus(element));
      const aim = p.aim;

      if (def.kind === 'melee') {
        const extra = this.stats.extraProj;
        const range = def.range * (1 + extra * 0.05) * (1 + (this.stats.area - 1) * 0.5);
        const arc = (def.arc || 1.5) * (1 + extra * 0.08);
        let hits = 0;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead) continue;
          if (U.dist(e.x, e.y, p.x, p.y) > range + e.r) continue;
          if (!U.inArc(U.angleTo(p.x, p.y, e.x, e.y), aim, arc / 2)) continue;
          this.damageEnemy(e, total, { element: element, crit: crit, knockback: def.knockback || 140 });
          hits++;
        }
        this.slashes.push({ x: p.x, y: p.y, angle: aim, arc: arc, range: range, t: 0, dur: 0.2, color: def.color, accent: def.accent });
        if (def.wave) {
          this.spawnBullet({
            x: p.x, y: p.y, angle: aim, speed: 620, dmg: total * 0.75, element: element,
            pierce: 99, life: 0.85, color: def.accent, r: 22, waveArc: arc, burn: def.burn
          });
        }
        this.emit('sfx', hits > 0 && crit ? 'crit' : 'melee');
        if (def.echo) {
          const self = this;
          this.after(0.11, function () {
            for (let i = 0; i < self.enemies.length; i++) {
              const e = self.enemies[i];
              if (e.dead) continue;
              if (U.dist(e.x, e.y, p.x, p.y) > range + e.r) continue;
              if (!U.inArc(U.angleTo(p.x, p.y, e.x, e.y), aim, arc / 2)) continue;
              self.damageEnemy(e, total * 0.55, { element: element, crit: false, knockback: 40 });
            }
            self.slashes.push({ x: p.x, y: p.y, angle: aim, arc: arc, range: range, t: 0, dur: 0.16, color: '#c0a0ff', accent: '#8a4dff' });
          });
        }
        return;
      }

      if (def.kind === 'cone') {
        const range = def.range * (1 + (this.stats.area - 1) * 0.6);
        const arc = def.arc;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead) continue;
          if (U.dist(e.x, e.y, p.x, p.y) > range + e.r) continue;
          if (!U.inArc(U.angleTo(p.x, p.y, e.x, e.y), aim, arc / 2)) continue;
          this.damageEnemy(e, total, { element: element, crit: crit, silent: true });
          if (def.burn) this.applyBurn(e, def.burn.dps * (1 + this.elemBonus('fire')), def.burn.dur);
        }
        for (let i = 0; i < 3; i++) {
          const a = aim + U.rand(-arc / 2, arc / 2);
          const sp = U.rand(range * 0.5, range);
          this.particles.push({
            x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: U.rand(0.2, 0.42), maxLife: 0.42, size: U.rand(4, 11),
            color: i % 2 ? '#ffcf6b' : '#ff6a24', drag: 3
          });
        }
        if (def.nova) {
          this.novaTimer = (this.novaTimer || 0) - this.weaponInterval(item);
          if (this.novaTimer <= 0) {
            this.novaTimer = 2.2;
            this.explode(p.x, p.y, 200 * this.stats.area, total * 6, 'fire', { color: '#ff4d1a', burn: { dps: 10, dur: 3 } });
          }
        }
        this.emit('sfx', 'shoot');
        return;
      }

      if (def.kind === 'beam') {
        if (def.chains) {
          let originX = p.x;
          let originY = p.y;
          const hitSet = {};
          let count = 0;
          let guard = 0;
          let sx = p.x;
          let sy = p.y;
          let searchRange = 430;
          while (count < def.chains && guard++ < 12) {
            let best = null;
            let bestD = searchRange;
            for (let i = 0; i < this.enemies.length; i++) {
              const e = this.enemies[i];
              if (e.dead || hitSet[e.uid]) continue;
              const d = U.dist(sx, sy, e.x, e.y);
              if (d < bestD) {
                bestD = d;
                best = e;
              }
            }
            if (!best) break;
            hitSet[best.uid] = true;
            this.beams.push({ x1: originX, y1: originY, x2: best.x, y2: best.y, t: 0, dur: 0.18, color: def.color, width: 5, jitter: 10 });
            this.damageEnemy(best, total * (1 - count * 0.12), { element: element, crit: crit, knockback: 40 });
            originX = best.x;
            originY = best.y;
            sx = best.x;
            sy = best.y;
            searchRange = 260;
            count++;
          }
          this.emit('sfx', count ? 'shoot' : 'hit');
          return;
        }
        const range = def.range * (1 + (this.stats.area - 1) * 0.25);
        const ex = p.x + Math.cos(aim) * range;
        const ey = p.y + Math.sin(aim) * range;
        const dx = Math.cos(aim);
        const dy = Math.sin(aim);
        const hits = [];
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead) continue;
          const relx = e.x - p.x;
          const rely = e.y - p.y;
          const proj = relx * dx + rely * dy;
          if (proj < 0 || proj > range) continue;
          if (Math.abs(relx * dy - rely * dx) > 26 + e.r) continue;
          hits.push({ e: e, proj: proj });
        }
        hits.sort(function (a, b) { return a.proj - b.proj; });
        const max = (def.pierce || 0) + this.stats.extraPierce + 1;
        for (let i = 0; i < Math.min(hits.length, max); i++) {
          this.damageEnemy(hits[i].e, total, { element: element, crit: crit, knockback: 60, implode: def.implode });
        }
        this.beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, t: 0, dur: 0.18, color: def.color, width: def.pierce > 5 ? 9 : 5, jitter: def.pierce > 5 ? 4 : 2 });
        this.emit('sfx', 'shootHeavy');
        return;
      }

      const pellets = (def.pellets || 1) + this.stats.extraProj + (def.burst ? def.burst - 1 : 0);
      const spread = def.spread || 0.05;
      for (let i = 0; i < pellets; i++) {
        const offset = pellets > 1 ? (i - (pellets - 1) / 2) * spread : 0;
        this.spawnBullet({
          x: p.x + Math.cos(aim) * 20 + Math.cos(aim + Math.PI / 2) * offset * 16,
          y: p.y + Math.sin(aim) * 20 + Math.sin(aim + Math.PI / 2) * offset * 16,
          angle: aim + offset, speed: def.speed || 900, dmg: total,
          element: element, crit: crit, pierce: (def.pierce || 0) + this.stats.extraPierce,
          life: def.life || 0.7, color: def.color, accent: def.accent, r: def.splash ? 8 : 5,
          splash: def.splash, splashMult: def.splashMult, burn: def.burn, poison: def.poison,
          chill: def.chill, chain: (def.chain || 0) + (this.relics.indexOf('staticCoil') >= 0 ? 1 : 0),
          ricochet: (def.ricochet || 0) + this.stats.ricochet,
          boomerang: def.boomerang, cloud: def.cloud, mark: def.mark,
          implode: def.implode, shatter: def.shatter, falloff: def.falloff,
          maxRange: (def.speed || 900) * (def.life || 0.7)
        });
      }
      this.emit('sfx', def.splash ? 'shootHeavy' : 'shoot');
      if (def.splash) this.shake = Math.max(this.shake, 3);
    }

    spawnBullet(o) {
      const b = {
        friendly: true, x: o.x, y: o.y,
        vx: Math.cos(o.angle) * o.speed, vy: Math.sin(o.angle) * o.speed,
        r: o.r || 5, dmg: o.dmg, element: o.element, crit: !!o.crit,
        pierce: o.pierce || 0, hit: {}, life: o.life || 0.7, maxLife: o.life || 0.7,
        color: o.color || '#fff', accent: o.accent, splash: o.splash, splashMult: o.splashMult,
        burn: o.burn, poison: o.poison, chill: o.chill, chain: o.chain || 0,
        ricochet: o.ricochet || 0, boomerang: o.boomerang, cloud: o.cloud,
        mark: o.mark, implode: o.implode, shatter: o.shatter, waveArc: o.waveArc,
        falloff: o.falloff, maxRange: o.maxRange,
        t: 0, dead: false, returning: false, originX: o.x, originY: o.y
      };
      this.bullets.push(b);
      return b;
    }

    updateBullets(dt) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (!b) continue;
        b.t += dt;
        b.life -= dt;
        if (b.boomerang) {
          const p = this.player;
          if (b.t > b.maxLife * 0.42) {
            if (!b.returning) {
              b.returning = true;
              b.hit = {};
            }
            const a = U.angleTo(b.x, b.y, p.x, p.y);
            const sp = Math.hypot(b.vx, b.vy);
            b.vx = U.damp(b.vx, Math.cos(a) * sp, 8, dt);
            b.vy = U.damp(b.vy, Math.sin(a) * sp, 8, dt);
            if (U.dist(b.x, b.y, p.x, p.y) < 40) b.dead = true;
          }
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < 20 || b.y < 20 || b.x > ARENA_W - 20 || b.y > ARENA_H - 20) b.dead = true;
        if (b.cloud) {
          b.cloudTimer = (b.cloudTimer || 0) - dt;
          if (b.cloudTimer <= 0) {
            b.cloudTimer = 0.4;
            this.zones.push({
              x: b.x, y: b.y, r: 74 * this.stats.area, delay: 0, armed: true, duration: 2.4,
              dmg: (b.dmg || 10) * 0.5, tick: 0.5, tickTimer: 0, owner: 'player',
              kind: 'cloud', element: b.element, color: b.element === 'poison' ? '#8fff5c' : '#ff8a3c'
            });
          }
        }
        if (b.friendly) {
          for (let j = 0; j < this.enemies.length; j++) {
            const e = this.enemies[j];
            if (e.dead || b.hit[e.uid]) continue;
            const rr = b.r + e.r;
            if (U.dist2(b.x, b.y, e.x, e.y) > rr * rr) continue;
            b.hit[e.uid] = true;
            let dmg = b.dmg;
            if (b.falloff) {
              const travelled = U.dist(b.originX, b.originY, b.x, b.y);
              dmg *= U.clamp(1 - (travelled / (b.maxRange || 400)) * 0.55, 0.45, 1);
            }
            this.damageEnemy(e, dmg, { element: b.element, crit: b.crit, knockback: 60, implode: b.implode, shatter: b.shatter });
            if (b.burn) this.applyBurn(e, b.burn.dps * (1 + this.elemBonus('fire')), b.burn.dur);
            if (b.poison) this.applyPoison(e, 2, b.poison.dps * (1 + this.elemBonus('poison')), b.poison.dur);
            if (b.chill) this.applyChill(e, b.chill.mult, b.chill.dur);
            if (b.mark) this.applyMark(e, 3.5);
            if (b.chain) this.chainFrom(e, b.chain, b.dmg * 0.55, b.element);
            if (b.splash) {
              this.explode(b.x, b.y, b.splash * this.stats.area, dmg * (b.splashMult || 0.7), b.element, {
                color: b.accent || '#ffa04a', burn: b.burn
              });
              b.dead = true;
            }
            if (b.pierce <= 0) {
              this.burstParticles(b.x, b.y, b.element || 'physical', 4);
              b.dead = true;
              break;
            }
            b.pierce--;
            if (b.ricochet > 0) {
              let next = null;
              let bestD = 320;
              for (let k = 0; k < this.enemies.length; k++) {
                const en = this.enemies[k];
                if (en.dead || b.hit[en.uid]) continue;
                const dd = U.dist(en.x, en.y, b.x, b.y);
                if (dd < bestD) {
                  bestD = dd;
                  next = en;
                }
              }
              if (next) {
                b.ricochet--;
                const a = U.angleTo(b.x, b.y, next.x, next.y);
                const sp = Math.hypot(b.vx, b.vy);
                b.vx = Math.cos(a) * sp;
                b.vy = Math.sin(a) * sp;
                b.life = Math.max(b.life, 0.35);
              }
            }
          }
          if (b.waveArc) {
            for (let j = 0; j < 2; j++) {
              this.particles.push({
                x: b.x + U.rand(-20, 20), y: b.y + U.rand(-20, 20), vx: -b.vx * 0.1,
                vy: -b.vy * 0.1, life: 0.3, maxLife: 0.3, size: U.rand(3, 8), color: '#ff9b3c'
              });
            }
          }
        } else {
          const p = this.player;
          const rr = b.r + p.r;
          if (U.dist2(b.x, b.y, p.x, p.y) <= rr * rr) {
            this.hurtPlayer(b.dmg, b, {});
            b.dead = true;
          }
        }
        if (b.life <= 0 || b.dead) {
          if (b.dead && b.splash && b.friendly) {
            this.explode(b.x, b.y, b.splash * this.stats.area, b.dmg * (b.splashMult || 0.7), b.element, {
              color: b.accent || '#ffa04a', burn: b.burn
            });
          }
          this.bullets.splice(i, 1);
        }
      }
    }

    chainFrom(source, count, dmg, element) {
      let from = source;
      const hit = {};
      hit[source.uid] = true;
      for (let c = 0; c < count; c++) {
        let best = null;
        let bestD = 300;
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead || hit[e.uid]) continue;
          const d = U.dist(from.x, from.y, e.x, e.y);
          if (d < bestD) {
            bestD = d;
            best = e;
          }
        }
        if (!best) break;
        hit[best.uid] = true;
        this.beams.push({ x1: from.x, y1: from.y, x2: best.x, y2: best.y, t: 0, dur: 0.14, color: '#ffe680', width: 4, jitter: 10 });
        this.damageEnemy(best, dmg, { element: element, silent: true });
        from = best;
      }
    }

    explode(x, y, radius, dmg, element, opts) {
      opts = opts || {};
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) continue;
        const d = U.dist(x, y, e.x, e.y);
        if (d > radius + e.r) continue;
        const falloff = U.clamp(1 - (d / (radius + e.r)) * 0.45, 0.5, 1);
        this.damageEnemy(e, dmg * falloff, { element: element, knockback: opts.knockback || 120, silent: true });
        if (opts.burn) this.applyBurn(e, opts.burn.dps, opts.burn.dur);
      }
      this.rings.push({ x: x, y: y, r: 8, maxR: radius, t: 0, dur: 0.42, color: opts.color || '#ffb066', width: 6 });
      this.burstParticles(x, y, element || 'physical', 16);
      this.shake = Math.max(this.shake, 7);
      this.emit('sfx', 'explode');
    }

    burstParticles(x, y, element, n) {
      const el = D.ELEMENTS[element] || D.ELEMENTS.physical;
      for (let i = 0; i < n; i++) {
        const a = U.rand(0, U.TAU);
        const sp = U.rand(60, 320);
        this.particles.push({
          x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: U.rand(0.2, 0.5), maxLife: 0.5, size: U.rand(2, 5), color: el.color, drag: 4
        });
      }
      if (this.particles.length > 700) this.particles.splice(0, this.particles.length - 700);
    }

    applyBurn(e, dps, dur) {
      if (!e.statuses) return;
      const cur = e.statuses.burn;
      const value = Math.max(cur ? cur.dps : 0, dps);
      e.statuses.burn = { dps: value, until: this.time + dur };
      if (this.relics.indexOf('emberSigil') >= 0) {
        for (let i = 0; i < this.enemies.length; i++) {
          const o = this.enemies[i];
          if (o === e || o.dead) continue;
          if (U.dist(o.x, o.y, e.x, e.y) < 100) o.statuses.burn = { dps: value * 0.6, until: this.time + dur * 0.8 };
        }
      }
    }

    applyPoison(e, stacks, dps, dur) {
      if (!e.statuses) return;
      const cur = e.statuses.poison;
      e.statuses.poison = {
        stacks: Math.min(12, (cur && cur.until > this.time ? cur.stacks : 0) + stacks),
        dps: dps,
        until: this.time + dur
      };
    }

    applyChill(e, mult, dur) {
      if (!e.statuses) return;
      const cur = e.statuses.chill;
      const value = Math.min(cur && cur.until > this.time ? cur.mult : 1, mult);
      e.statuses.chill = { mult: value, until: this.time + dur };
    }

    applyMark(e, dur) {
      if (!e.statuses) return;
      e.statuses.mark = { until: this.time + dur };
    }

    damageEnemy(e, amount, opts) {
      opts = opts || {};
      if (e.dead) return 0;
      const element = opts.element || 'physical';
      const def = e.def || {};
      let dmg = amount;
      const resist = (def.resist && def.resist[element]) || 0;
      const weak = (def.weak && def.weak[element]) || 0;
      dmg *= 1 - resist;
      dmg *= 1 + weak;
      dmg *= 1 - (e.dr || 0);
      if (opts.crit) {
        let mult = this.stats.critMult;
        if (e.statuses && e.statuses.mark) mult += 0.4;
        if (e.statuses && e.statuses.chill && opts.shatter) mult += 0.5;
        dmg *= mult;
      }
      if (e.statuses && e.statuses.chill) dmg *= 1.1;
      if (opts.implode) dmg *= 1.1;
      if (this.fatigue) dmg *= 1.3;
      dmg = Math.max(1, dmg);
      if (e.shield > 0) {
        const absorbed = Math.min(e.shield, dmg);
        e.shield -= absorbed;
        dmg -= absorbed;
        if (absorbed > 0) this.floaters.push({ x: e.x, y: e.y - e.r - 6, text: U.fmt(absorbed), color: '#8fd0ff', life: 0.5, vy: -50, size: 12 });
      }
      if (dmg <= 0) return 0;
      e.hp -= dmg;
      e.anim = Math.max(e.anim, 0.18);
      this.runStats.damage += dmg;
      if (this.stats.lifesteal > 0) this.healPlayer(dmg * this.stats.lifesteal, true);
      if (!opts.silent) {
        this.floaters.push({
          x: e.x + U.rand(-8, 8), y: e.y - e.r - 4, text: U.fmt(dmg),
          color: opts.crit ? '#ffd166' : '#ffffff', life: opts.crit ? 0.85 : 0.6,
          vy: -70, size: opts.crit ? 17 : 13, crit: opts.crit
        });
        this.emit('sfx', opts.crit ? 'crit' : 'hit');
      }
      if (opts.knockback && e.tier < 3) {
        const a = U.angleTo(this.player.x, this.player.y, e.x, e.y);
        const resistKb = e.tier === 2 ? 0.35 : e.tier === 1 ? 0.6 : 1;
        e.kx += Math.cos(a) * opts.knockback * resistKb;
        e.ky += Math.sin(a) * opts.knockback * resistKb;
      }
      if (opts.implode) {
        for (let i = 0; i < this.enemies.length; i++) {
          const o = this.enemies[i];
          if (o === e || o.dead) continue;
          if (U.dist(o.x, o.y, e.x, e.y) < 170) {
            const a = U.angleTo(o.x, o.y, e.x, e.y);
            o.kx += Math.cos(a) * 160;
            o.ky += Math.sin(a) * 160;
          }
        }
      }
      if (e.hp <= 0) this.killEnemy(e);
      return dmg;
    }

    killEnemy(e) {
      if (e.dead) return;
      e.dead = true;
      this.runStats.kills++;
      if (e.tier === 1) this.runStats.elites++;
      this.burstParticles(e.x, e.y, 'physical', e.isBoss ? 40 : 10);
      this.rings.push({ x: e.x, y: e.y, r: e.r * 0.4, maxR: e.r * 2.4, t: 0, dur: 0.35, color: e.def.color, width: 2 });
      this.emit('sfx', e.isBoss ? 'explode' : 'kill');

      const p = this.player;
      const goldMul = this.stats.gold;
      const amount = Math.max(1, Math.round(e.gold * goldMul));
      const drops = Math.max(1, Math.min(4, Math.round(1 + e.gold / 14)));
      for (let i = 0; i < drops; i++) {
        this.pickups.push({
          x: e.x + U.rand(-14, 14), y: e.y + U.rand(-14, 14), type: 'gold',
          value: Math.max(1, Math.round(amount / drops)), vx: U.rand(-60, 60), vy: U.rand(-60, 60),
          t: 0, dead: false
        });
      }
      if (U.chance(0.055) && p.hp < this.stats.maxHp * 0.92) {
        this.pickups.push({ x: e.x, y: e.y, type: 'health', value: 14, vx: 0, vy: 0, t: 0, dead: false });
      }
      if (this.relics.indexOf('hungryMaw') >= 0) this.healPlayer(this.stats.maxHp * 0.015, true);
      if (this.relics.indexOf('frostHeart') >= 0) {
        for (let i = 0; i < this.enemies.length; i++) {
          const o = this.enemies[i];
          if (!o.dead && U.dist(o.x, o.y, e.x, e.y) < 150) this.applyChill(o, 0.6, 1.6);
        }
      }

      if (e.def.split && !e.isBoss) {
        for (let i = 0; i < (e.def.splitCount || 2); i++) {
          const child = this.spawnEnemy(e.def.split, { x: e.x + U.rand(-26, 26), y: e.y + U.rand(-26, 26) });
          if (child) child.hp = Math.max(6, Math.round(child.maxHp * 0.5));
        }
      }

      const deathMod = e.mods.find(function (m) { return m.onDeath === 'explode'; });
      if ((deathMod || e.id === 'bomber') && !e.isBoss) {
        const radius = e.id === 'bomber' ? 96 : 110;
        const dmg = (e.dmg || 20) * (e.id === 'bomber' ? 1.6 : 0.9);
        if (U.dist(e.x, e.y, p.x, p.y) < radius + p.r) this.hurtPlayer(dmg * 0.85, e, {});
        this.explodeEnemy(e.x, e.y, radius, dmg * 0.5);
      }

      if (e.isBoss) {
        this.runStats.bosses++;
        this.bossActive = null;
        this.pendingSpecialReward = 'boss';
        this.shake = 22;
        for (let i = 0; i < 40; i++) {
          this.pickups.push({
            x: e.x + U.rand(-40, 40), y: e.y + U.rand(-40, 40), type: 'gold',
            value: Math.ceil(18 * goldMul), vx: U.rand(-160, 160), vy: U.rand(-160, 160), t: 0, dead: false
          });
        }
        this.emit('bosskill', { name: e.def.name });
        for (let bi = 0; bi < this.bullets.length; bi++) this.bullets[bi].dead = true;
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          if (!this.enemies[i].isBoss) this.enemies.splice(i, 1);
        }
        this.enemies.length = 0;
        this.pendingSpawns = 0;
      }
    }

    explodeEnemy(x, y, radius, dmg) {
      this.rings.push({ x: x, y: y, r: 6, maxR: radius, t: 0, dur: 0.35, color: '#ff8a3c', width: 4 });
      this.burstParticles(x, y, 'fire', 14);
      this.emit('sfx', 'explode');
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.dead) continue;
        if (U.dist(e.x, e.y, x, y) < radius + e.r) this.damageEnemy(e, dmg, { element: 'fire', silent: true });
      }
    }

    hurtPlayer(amount, source, opts) {
      opts = opts || {};
      const p = this.player;
      if (p.dead) return;
      if (!opts.ignoreInvuln && (p.invuln > 0 || p.wardT > 0)) return;
      if (!opts.ignoreInvuln && U.chance(this.stats.dodge)) {
        this.floaters.push({ x: p.x, y: p.y - 24, text: 'DODGE', color: '#9fe8ff', life: 0.7, vy: -60, size: 14 });
        p.invuln = 0.2;
        return;
      }
      let dmg = amount * (1 - this.stats.dr);
      if (p.shield > 0) {
        const absorbed = Math.min(p.shield, dmg);
        p.shield -= absorbed;
        dmg -= absorbed;
        if (absorbed > 0) {
          this.floaters.push({ x: p.x, y: p.y - 30, text: U.fmt(absorbed), color: '#8fd0ff', life: 0.6, vy: -70, size: 13 });
          this.emit('sfx', 'shield');
        }
      }
      if (dmg <= 0) {
        p.invuln = Math.max(p.invuln, 0.25);
        return;
      }
      p.hp -= dmg;
      this.runStats.damageTaken += dmg;
      p.hurtFlash = 1;
      if (!opts.ignoreInvuln) p.invuln = 0.55;
      this.shake = Math.max(this.shake, 6);
      if (!opts.silent) {
        this.floaters.push({ x: p.x, y: p.y - 30, text: '-' + U.fmt(dmg), color: '#ff6b6b', life: 0.8, vy: -70, size: 15 });
        this.emit('sfx', 'hurt');
      }
      if (source && source.x !== undefined && !opts.silent) {
        const a = U.angleTo(source.x, source.y, p.x, p.y);
        p.vx += Math.cos(a) * 120;
        p.vy += Math.sin(a) * 120;
      }
      if (this.stats.thorns > 0 && source && source.def) {
        this.damageEnemy(source, this.stats.thorns, { element: 'physical', silent: true });
      }
      if (source && source.mods) {
        const poisonMod = source.mods.find(function (m) { return m.onHit === 'poison'; });
        if (poisonMod) {
          p.poisonStacks = Math.min(6, p.poisonStacks + 1);
          p.poisonT = 4;
        }
      }
      if (this.stats.aura === 'zap' && source && source.def) {
        this.damageEnemy(source, 14, { element: 'lightning', silent: true });
        this.beams.push({ x1: p.x, y1: p.y, x2: source.x, y2: source.y, t: 0, dur: 0.12, color: '#ffe680', width: 4, jitter: 8 });
      } else if (this.stats.aura === 'burn' && source && source.def) {
        this.applyBurn(source, 7, 3);
      }
      if (p.hp <= 0) {
        if (this.stats.revives > 0 && !this.reviveUsed) {
          this.reviveUsed = true;
          p.hp = this.stats.maxHp * 0.45;
          p.invuln = 2.2;
          this.explode(p.x, p.y, 240, 60 * this.stats.dmg, 'fire', { color: '#ffd166', knockback: 400 });
          this.floaters.push({ x: p.x, y: p.y - 40, text: 'SECOND WIND', color: '#ffd166', life: 1.4, vy: -50, size: 18 });
          this.emit('sfx', 'evolve');
          return;
        }
        p.hp = 0;
        p.dead = true;
        this.phase = 'dead';
        this.emit('sfx', 'death');
        this.emit('death', { level: this.level });
      }
    }

    healPlayer(amount, silent) {
      const p = this.player;
      if (p.dead) return;
      const before = p.hp;
      p.hp = Math.min(this.stats.maxHp, p.hp + amount * this.stats.healBonus);
      const gained = p.hp - before;
      if (gained > 0.5) {
        this.runStats.healed += gained;
        if (!silent) {
          this.floaters.push({ x: p.x, y: p.y - 34, text: '+' + U.fmt(gained), color: '#7dffb0', life: 0.8, vy: -70, size: 14 });
          this.emit('sfx', 'heal');
        }
      }
    }

    updateEnemy(e, dt) {
      if (e.isBoss) this.updateBoss(e, dt);
      else this.updateEnemyAI(e, dt);
      e.atkCd -= dt;
      e.anim = Math.max(0, e.anim - dt * 4);
      e.bob += dt * 4;
      if (e.kx || e.ky) {
        e.x += e.kx * dt;
        e.y += e.ky * dt;
        e.kx = U.damp(e.kx, 0, 9, dt);
        e.ky = U.damp(e.ky, 0, 9, dt);
      }
      e.x = U.clamp(e.x, e.r, ARENA_W - e.r);
      e.y = U.clamp(e.y, e.r, ARENA_H - e.r);
      if (e.shieldRegen > 0 && e.shield < e.maxShield) e.shield = Math.min(e.maxShield, e.shield + e.shieldRegen * dt);
      const mod = e.mods.find(function (m) { return m.regen; });
      if (mod) e.hp = Math.min(e.maxHp, e.hp + mod.regen * dt);

      const st = e.statuses;
      if (st.burn && st.burn.until > this.time) {
        this.damageEnemy(e, st.burn.dps * dt, { element: 'fire', silent: true });
        if (U.chance(dt * 8)) this.particles.push({ x: e.x + U.rand(-e.r, e.r), y: e.y + U.rand(-e.r, e.r), vx: 0, vy: -40, life: 0.3, maxLife: 0.3, size: U.rand(2, 5), color: '#ff9b3c' });
      }
      if (st.poison && st.poison.until > this.time) {
        this.damageEnemy(e, st.poison.dps * st.poison.stacks * dt, { element: 'poison', silent: true });
        if (U.chance(dt * 6)) this.particles.push({ x: e.x + U.rand(-e.r, e.r), y: e.y + U.rand(-e.r, e.r), vx: 0, vy: -30, life: 0.35, maxLife: 0.35, size: U.rand(2, 4), color: '#9dff6b' });
      }
    }

    updateEnemyAI(e, dt) {
      const p = this.player;
      const def = e.def;
      const chillMul = e.statuses.chill && e.statuses.chill.until > this.time ? e.statuses.chill.mult : 1;
      const speed = e.speed * chillMul;
      const d = U.dist(e.x, e.y, p.x, p.y);
      const ang = U.angleTo(e.x, e.y, p.x, p.y);
      e.facing = ang;
      let moveAngle = ang;
      let moveSpeed = speed;

      switch (def.ai) {
        case 'chase':
          if (d < e.r + p.r + 4) {
            moveSpeed = 0;
            if (e.atkCd <= 0) {
              e.atkCd = 0.95;
              e.anim = 0.2;
              this.hurtPlayer(e.dmg, e, {});
            }
          }
          break;
        case 'fly':
          moveSpeed = speed * (d > 220 ? 1 : 0.7);
          if (d < e.r + p.r + 6 && e.atkCd <= 0) {
            e.atkCd = 1.1;
            this.hurtPlayer(e.dmg, e, {});
          }
          moveAngle = ang + Math.sin(this.time * 2 + e.bob) * 0.4;
          break;
        case 'ranged':
          if (d > (def.range || 320) * 0.75) moveSpeed = speed;
          else if (d < (def.range || 320) * 0.45 && !e.fleeDisabled) {
            moveAngle = ang + Math.PI;
            moveSpeed = speed * 0.8;
          } else {
            moveSpeed = speed * 0.25;
            moveAngle = ang + Math.PI / 2;
          }
          if (d < (def.range || 320) && e.atkCd <= 0) {
            e.atkCd = def.attackCd || 2;
            this.enemyShoot(e, ang, def.projSpeed || 350, e.dmg, '#a8ff9b');
          }
          break;
        case 'bomber':
          if (d < 92 && e.atkCd <= 0 && e.state !== 'arming') {
            e.atkCd = 1.4;
            e.state = 'arming';
            e.stateT = 0.55;
          }
          if (e.state === 'arming') {
            moveSpeed = 0;
            e.stateT -= dt;
            if (e.stateT <= 0) {
              e.hp = 0;
              this.killEnemy(e);
              return;
            }
          }
          break;
        case 'support':
          {
            let target = null;
            let bestD = 300;
            for (let i = 0; i < this.enemies.length; i++) {
              const o = this.enemies[i];
              if (o === e || o.dead || o.hp >= o.maxHp || o.id === 'mender') continue;
              const od = U.dist(e.x, e.y, o.x, o.y);
              if (od < bestD) {
                bestD = od;
                target = o;
              }
            }
            if (target) {
              this.menderHeal(e, target, def, dt);
              moveAngle = U.angleTo(e.x, e.y, target.x, target.y);
              moveSpeed = d < 200 ? 0 : speed;
            }
            if (d < 240 && !e.fleeDisabled) {
              moveAngle = ang + Math.PI;
              moveSpeed = speed;
            }
          }
          break;
        case 'summon':
          if (d < (def.range || 420) && !e.fleeDisabled) {
            moveAngle = ang + Math.PI;
            moveSpeed = speed * 0.6;
          }
          if (e.atkCd <= 0 && this.enemies.length < MAX_ALIVE + 4 && e.summonBudget > 0) {
            e.atkCd = def.attackCd || 5;
            for (let i = 0; i < (def.summonCount || 2) && e.summonBudget > 0; i++) {
              e.summonBudget--;
              const child = this.spawnEnemy(def.summon, { x: e.x + U.rand(-40, 40), y: e.y + U.rand(-40, 40) });
              if (child) this.rings.push({ x: child.x, y: child.y, r: 4, maxR: 40, t: 0, dur: 0.4, color: '#c6a8ff', width: 2 });
            }
            if (e.summonBudget <= 0) e.fleeDisabled = true;
            this.floaters.push({ x: e.x, y: e.y - e.r - 10, text: 'SUMMON', color: '#c6a8ff', life: 0.8, vy: -40, size: 12 });
          }
          break;
        case 'brute':
          if (d < (def.range || 130) && e.atkCd <= 0 && e.state !== 'windup') {
            e.atkCd = def.attackCd || 3;
            e.state = 'windup';
            e.stateT = 0.7;
          }
          if (e.state === 'windup') {
            moveSpeed = 0;
            e.stateT -= dt;
            if (e.stateT <= 0) {
              e.state = 'idle';
              this.zones.push({
                x: e.x, y: e.y, r: 168, delay: 0.12, armed: false, duration: 0.001, dmg: e.dmg * 1.3,
                owner: 'enemy', kind: 'slam', element: 'physical', color: '#ffb066', knock: 260
              });
            }
          }
          break;
        case 'assassin':
          if (e.atkCd <= 0 && d < 460) {
            e.atkCd = def.attackCd || 3.4;
            e.state = 'blink';
            e.stateT = 0.35;
            const a = U.rand(0, U.TAU);
            this.rings.push({ x: e.x, y: e.y, r: 4, maxR: 46, t: 0, dur: 0.3, color: '#b9a6ff', width: 2 });
            e.x = U.clamp(p.x + Math.cos(a) * 90, 40, ARENA_W - 40);
            e.y = U.clamp(p.y + Math.sin(a) * 90, 40, ARENA_H - 40);
            this.rings.push({ x: e.x, y: e.y, r: 4, maxR: 46, t: 0, dur: 0.3, color: '#b9a6ff', width: 2 });
          }
          if (e.state === 'blink') {
            moveSpeed = 0;
            e.stateT -= dt;
            if (e.stateT <= 0) {
              e.state = 'idle';
              if (U.dist(e.x, e.y, p.x, p.y) < 130) this.hurtPlayer(e.dmg * 1.2, e, {});
              this.slashes.push({ x: e.x, y: e.y, angle: U.angleTo(e.x, e.y, p.x, p.y), arc: 1.2, range: 120, t: 0, dur: 0.15, color: '#b9a6ff', accent: '#5b2fd0' });
            }
          }
          break;
        case 'hex':
          if (d > 340) moveSpeed = speed;
          else if (d < 220 && !e.fleeDisabled) {
            moveAngle = ang + Math.PI;
            moveSpeed = speed;
          } else if (d <= 340 && d >= 220) {
            moveAngle = ang + Math.PI / 2;
            moveSpeed = speed * 0.45;
          } else moveSpeed = e.fleeDisabled ? speed : speed * 0.2;
          if (e.atkCd <= 0 && d < 420) {
            e.atkCd = def.attackCd || 4.2;
            this.beams.push({ x1: e.x, y1: e.y, x2: p.x, y2: p.y, t: 0, dur: 0.35, color: '#d8b0ff', width: 6, jitter: 6 });
            p.slowT = Math.max(p.slowT, 3.2);
            p.weakT = Math.max(p.weakT, 3.2);
            this.floaters.push({ x: p.x, y: p.y - 40, text: 'CURSED', color: '#d8b0ff', life: 1, vy: -40, size: 13 });
          }
          break;
        default:
          break;
      }

      if (e.state === 'arming' || e.state === 'windup' || e.state === 'blink') moveSpeed = 0;

      let sepX = 0;
      let sepY = 0;
      for (let i = 0; i < this.enemies.length; i++) {
        const o = this.enemies[i];
        if (o === e || o.dead) continue;
        const dd = U.dist(e.x, e.y, o.x, o.y);
        const minD = e.r + o.r;
        if (dd > 0.01 && dd < minD) {
          const push = (minD - dd) / minD;
          sepX += ((e.x - o.x) / dd) * push;
          sepY += ((e.y - o.y) / dd) * push;
        }
      }

      e.vx = U.damp(e.vx, Math.cos(moveAngle) * moveSpeed + sepX * 220, 8, dt);
      e.vy = U.damp(e.vy, Math.sin(moveAngle) * moveSpeed + sepY * 220, 8, dt);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }

    menderHeal(e, target, def, dt) {
      e.healTick = (e.healTick || 0) + dt;
      e.x += Math.cos(U.angleTo(e.x, e.y, target.x, target.y)) * 14 * dt;
      e.y += Math.sin(U.angleTo(e.x, e.y, target.x, target.y)) * 14 * dt;
      if (e.healTick > 0.7) {
        e.healTick = 0;
        target.hp = Math.min(target.maxHp, target.hp + (def.healAmount || 6) * this.scale.hp);
        this.particles.push({ x: target.x, y: target.y - target.r, vx: 0, vy: -60, life: 0.5, maxLife: 0.5, size: 4, color: '#8ffbd0' });
      }
    }

    enemyShoot(e, angle, speed, dmg, color, opts) {
      opts = opts || {};
      const count = opts.count || 1;
      for (let i = 0; i < count; i++) {
        const a = angle + (count > 1 ? (i - (count - 1) / 2) * (opts.spread || 0.16) : 0);
        this.bullets.push({
          friendly: false, x: e.x + Math.cos(a) * (e.r + 4), y: e.y + Math.sin(a) * (e.r + 4),
          vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: opts.r || 7,
          dmg: dmg, life: opts.life || 3, maxLife: opts.life || 3, color: color, hit: {},
          element: opts.element || 'physical', dead: false, t: 0
        });
      }
    }

    updateBoss(e, dt) {
      const b = e.boss;
      const p = this.player;
      const chillMul = e.statuses.chill && e.statuses.chill.until > this.time ? e.statuses.chill.mult : 1;
      const d = U.dist(e.x, e.y, p.x, p.y);
      const ang = U.angleTo(e.x, e.y, p.x, p.y);
      e.facing = ang;
      const frac = e.hp / e.maxHp;
      if (b.phase < e.def.phases && frac <= 0.55) {
        b.phase++;
        b.attackT = 1.1;
        this.shake = 18;
        this.rings.push({ x: e.x, y: e.y, r: 20, maxR: 460, t: 0, dur: 0.9, color: e.def.accent, width: 6 });
        this.emit('sfx', 'boss');
        this.floaters.push({ x: e.x, y: e.y - e.r - 20, text: 'PHASE ' + b.phase, color: '#ffd166', life: 1.6, vy: -40, size: 18 });
        if (e.id === 'butcher' || e.id === 'sovereign' || e.id === 'matron') {
          for (let i = 0; i < 3; i++) this.spawnEnemy(U.pick(['crawler', 'sprinter']), {});
        }
        this.emit('bossphase', { phase: b.phase, name: e.def.name });
      }

      if (b.charge) {
        b.charge.t -= dt;
        if (b.charge.t > 0) {
          const sp = b.charge.speed * chillMul;
          e.x += Math.cos(b.charge.dir) * sp * dt;
          e.y += Math.sin(b.charge.dir) * sp * dt;
          this.particles.push({
            x: e.x + U.rand(-20, 20), y: e.y + U.rand(-20, 20), vx: U.rand(-30, 30), vy: U.rand(-30, 30),
            life: 0.35, maxLife: 0.35, size: U.rand(4, 10), color: e.def.accent
          });
          if (d < e.r + p.r + 8) {
            this.hurtPlayer(e.dmg * 1.5, e, {});
            b.charge.t = 0;
            this.shake = 14;
          }
        } else {
          b.charge = null;
          b.attackT = 1.6;
        }
        e.x = U.clamp(e.x, e.r, ARENA_W - e.r);
        e.y = U.clamp(e.y, e.r, ARENA_H - e.r);
        return;
      }

      b.attackT -= dt;
      b.addTimer -= dt;
      if (b.addTimer <= 0) {
        b.addTimer = b.phase > 1 ? 8 : 11;
        const self = this;
        const pool = this.biome.enemies.filter(function (id) {
          const dd = D.ENEMIES[id];
          return dd && dd.unlock <= self.level - 2;
        });
        const pickId = pool.length ? U.pick(pool) : 'crawler';
        for (let i = 0; i < (b.phase > 1 ? 3 : 2); i++) this.spawnEnemy(pickId, {});
      }

      if (b.attackT <= 0) this.runBossPattern(e);

      if (d > e.r + p.r + 30) {
        const speed = e.speed * chillMul * 0.75;
        e.x += Math.cos(ang) * speed * dt;
        e.y += Math.sin(ang) * speed * dt;
      } else if (b.attackT > 0.6 && U.chance(dt * 1.2)) {
        this.hurtPlayer(e.dmg * 0.7, e, {});
      }
      e.x = U.clamp(e.x, e.r, ARENA_W - e.r);
      e.y = U.clamp(e.y, e.r, ARENA_H - e.r);
    }

    runBossPattern(e) {
      const b = e.boss;
      const p = this.player;
      const ang = U.angleTo(e.x, e.y, p.x, p.y);
      const patterns = this.bossPatterns(e);
      const pattern = patterns[b.patternIndex % patterns.length];
      b.patternIndex++;
      pattern.run(e, ang, b.phase);
      b.attackT = pattern.cd(b.phase);
    }

    bossPatterns(e) {
      const self = this;
      const pl = function () { return self.player; };
      switch (e.id) {
        case 'butcher':
          return [
            {
              cd: function (ph) { return ph > 1 ? 1.9 : 2.6; },
              run: function (b) {
                self.zones.push({ x: b.x, y: b.y, r: 230, delay: 0.5, armed: false, duration: 0.001, dmg: b.dmg * 1.2, owner: 'enemy', kind: 'slam', color: '#ff8f6b', knock: 280 });
                for (let i = 1; i <= 2; i++) {
                  self.zones.push({ x: b.x, y: b.y, r: 230 + i * 90, delay: 0.5 + i * 0.3, armed: false, duration: 0.001, dmg: b.dmg * 0.9, owner: 'enemy', kind: 'slam', color: '#ff7a5c', knock: 200 });
                }
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 2.2 : 3.2; },
              run: function (b, angle) {
                b.boss.charge = { t: 0.75, dir: angle, speed: 900 };
                self.zones.push({ x: b.x, y: b.y, r: 130, delay: 0.7, armed: false, duration: 0.001, dmg: b.dmg * 0.9, owner: 'enemy', kind: 'slam', color: '#ffbc8a', knock: 160 });
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 1.6 : 2.2; },
              run: function (b, angle) {
                for (let i = -2; i <= 2; i++) {
                  const a = angle + i * 0.22;
                  self.zones.push({
                    x: b.x + Math.cos(a) * 150, y: b.y + Math.sin(a) * 150, r: 92, delay: 0.45 + Math.abs(i) * 0.05,
                    armed: false, duration: 0.001, dmg: b.dmg * 0.85, owner: 'enemy', kind: 'slam', color: '#ffa27a', knock: 180
                  });
                }
              }
            },
            {
              cd: function () { return 3.4; },
              run: function (b) {
                for (let i = 0; i < 3; i++) self.spawnEnemy('crawler', { x: b.x + U.rand(-60, 60), y: b.y + U.rand(-60, 60) });
              }
            }
          ];
        case 'matron':
          return [
            {
              cd: function (ph) { return ph > 1 ? 2.6 : 3.6; },
              run: function (b) {
                for (let i = 0; i < 3; i++) self.spawnEnemy(U.pick(['crawler', 'sprinter', 'splitter']), { x: b.x + U.rand(-70, 70), y: b.y + U.rand(-70, 70) });
                self.rings.push({ x: b.x, y: b.y, r: 10, maxR: 160, t: 0, dur: 0.5, color: '#a8ff9b', width: 4 });
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 2.3 : 3.4; },
              run: function () {
                const p = pl();
                for (let i = 0; i < 5; i++) {
                  self.zones.push({
                    x: p.x + U.rand(-140, 140), y: p.y + U.rand(-140, 140), r: 92, delay: 0.8,
                    armed: false, duration: 4.5, dmg: 6, tick: 1, tickTimer: 0, owner: 'enemy',
                    kind: 'acid', element: 'poison', color: '#8fff5c'
                  });
                }
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 1.7 : 2.7; },
              run: function (b, angle) {
                self.enemyShoot(b, angle, 420, b.dmg * 0.75, '#a8ff9b', { count: 7, spread: 0.19, r: 9, life: 3.2, element: 'poison' });
              }
            },
            {
              cd: function () { return 4.2; },
              run: function (b) {
                for (let i = 0; i < 2; i++) self.spawnEnemy('brute', { x: b.x + U.rand(-90, 90), y: b.y + U.rand(-90, 90) });
              }
            }
          ];
        case 'colossus':
          return [
            {
              cd: function (ph) { return ph > 1 ? 2.4 : 3.4; },
              run: function (b, angle) {
                for (let i = 0; i < 6; i++) {
                  self.zones.push({
                    x: b.x + Math.cos(angle) * (i + 1) * 100, y: b.y + Math.sin(angle) * (i + 1) * 100, r: 80,
                    delay: 0.45 + i * 0.12, armed: false, duration: 0.001, dmg: b.dmg * 0.72, owner: 'enemy',
                    kind: 'beam', element: 'ice', color: '#9fe0ff'
                  });
                }
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 2.6 : 3.6; },
              run: function () {
                const p = pl();
                self.zones.push({
                  x: p.x, y: p.y, r: 150, delay: 0.75, armed: false, duration: 3.6, dmg: 4,
                  tick: 0.9, tickTimer: 0, owner: 'enemy', kind: 'ice', element: 'ice', color: '#6fd6ff', chill: true
                });
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 1.8 : 2.8; },
              run: function (b) {
                for (let i = 0; i < 12; i++) {
                  self.bullets.push({
                    friendly: false, x: b.x, y: b.y, vx: Math.cos((i / 12) * U.TAU) * 300, vy: Math.sin((i / 12) * U.TAU) * 300,
                    r: 8, dmg: b.dmg * 0.6, life: 3.4, maxLife: 3.4, color: '#9fe0ff', hit: {}, element: 'ice', dead: false, t: 0
                  });
                }
              }
            },
            {
              cd: function () { return 4.6; },
              run: function (b) {
                for (let i = 0; i < 4; i++) {
                  const a = (i / 4) * U.TAU;
                  self.spawnEnemy('warden', { x: b.x + Math.cos(a) * 130, y: b.y + Math.sin(a) * 130 });
                }
              }
            }
          ];
        default:
          return [
            {
              cd: function (ph) { return ph > 1 ? 2.1 : 2.9; },
              run: function (b) {
                for (let i = 0; i < 12; i++) {
                  const a = (i / 12) * U.TAU + b.boss.phase * 0.2;
                  self.bullets.push({
                    friendly: false, x: b.x, y: b.y, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
                    r: 8, dmg: b.dmg * 0.55, life: 3.6, maxLife: 3.6, color: '#c6a8ff', hit: {}, element: 'shadow', dead: false, t: 0
                  });
                }
                if (b.boss.phase > 1) {
                  self.after(0.45, function () {
                    for (let i = 0; i < 10; i++) {
                      const a = (i / 10) * U.TAU + 0.2;
                      self.bullets.push({
                        friendly: false, x: b.x, y: b.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220,
                        r: 7, dmg: b.dmg * 0.45, life: 3.4, maxLife: 3.4, color: '#b07cff', hit: {}, element: 'shadow', dead: false, t: 0
                      });
                    }
                  });
                }
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 2.2 : 3.2; },
              run: function (b) {
                const p = pl();
                const a = U.rand(0, U.TAU);
                self.rings.push({ x: b.x, y: b.y, r: 10, maxR: 220, t: 0, dur: 0.5, color: '#c6a8ff', width: 4 });
                b.x = U.clamp(p.x + Math.cos(a) * 120, 60, ARENA_W - 60);
                b.y = U.clamp(p.y + Math.sin(a) * 120, 60, ARENA_H - 60);
                self.zones.push({
                  x: b.x, y: b.y, r: 195, delay: 0.35, armed: false, duration: 0.001, dmg: b.dmg * 1.1,
                  owner: 'enemy', kind: 'slam', color: '#b07cff', knock: 260
                });
              }
            },
            {
              cd: function (ph) { return ph > 1 ? 2.6 : 3.8; },
              run: function () {
                const p = pl();
                self.zones.push({
                  x: p.x, y: p.y, r: 215, delay: 0.7, armed: false, duration: 1.4, dmg: b_dmgFallback(self, p),
                  tick: 0.45, tickTimer: 0, owner: 'enemy', kind: 'rift', element: 'shadow', color: '#b07cff'
                });
              }
            },
            {
              cd: function () { return 4.4; },
              run: function (b) {
                for (let i = 0; i < 2; i++) self.spawnEnemy('stalker', { x: b.x + U.rand(-80, 80), y: b.y + U.rand(-80, 80) });
                self.spawnEnemy('hexer', { x: b.x + U.rand(-80, 80), y: b.y + U.rand(-80, 80) });
              }
            }
          ];
      }
    }

    updateZones(dt) {
      const p = this.player;
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        if (z.delay > 0) {
          z.delay -= dt;
          if (z.delay <= 0) {
            z.armed = true;
            if (z.dmg && !z.tick) this.zoneHit(z);
          }
          continue;
        }
        if (!z.armed) {
          z.armed = true;
          if (z.dmg && !z.tick) this.zoneHit(z);
        }
        if (z.duration !== undefined && z.duration < 9000) {
          z.duration -= dt;
          if (z.duration <= 0) {
            this.zones.splice(i, 1);
            continue;
          }
        }
        if (z.tick && z.dmg) {
          z.tickTimer -= dt;
          if (z.tickTimer <= 0) {
            z.tickTimer = z.tick;
            this.zoneHit(z);
          }
        }
        if (z.kind === 'rift' && U.dist(p.x, p.y, z.x, z.y) < z.r + 40) {
          const a = U.angleTo(p.x, p.y, z.x, z.y);
          p.vx += Math.cos(a) * 900 * dt;
          p.vy += Math.sin(a) * 900 * dt;
        }
        if (z.kind === 'ice' && U.dist(p.x, p.y, z.x, z.y) < z.r) p.slowT = Math.max(p.slowT, 0.25);
      }
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        if (z.kind === 'riftburst' && z.armed) {
          this.explode(z.x, z.y, z.r * this.stats.area, z.dmg, 'shadow', { color: '#b07cff', knockback: 260 });
          this.zones.splice(i, 1);
        }
      }
    }

    zoneHit(z) {
      const p = this.player;
      if (z.owner === 'enemy' || z.owner === 'hazard') {
        if (U.dist(p.x, p.y, z.x, z.y) < z.r + p.r * 0.6) {
          if (z.dmg) {
            if (z.tick) {
              this.hurtPlayer(z.dmg, null, { silent: true, ignoreInvuln: true });
              if (z.element === 'poison') {
                p.poisonStacks = Math.min(6, p.poisonStacks + 1);
                p.poisonT = 3;
              }
              if (z.chill || z.element === 'ice') p.slowT = Math.max(p.slowT, 0.6);
            } else {
              this.hurtPlayer(z.dmg, null, {});
            }
          }
        }
      } else if (z.owner === 'player') {
        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.dead) continue;
          if (U.dist(e.x, e.y, z.x, z.y) < z.r + e.r) {
            this.damageEnemy(e, z.dmg, { element: z.element || 'physical', silent: true });
            if (z.element === 'poison') this.applyPoison(e, 1, 5, 3);
          }
        }
      }
    }

    updatePickups(dt) {
      const p = this.player;
      const magnet = this.stats.pickup;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const k = this.pickups[i];
        k.t += dt;
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.vx = U.damp(k.vx, 0, 5, dt);
        k.vy = U.damp(k.vy, 0, 5, dt);
        const d = U.dist(k.x, k.y, p.x, p.y);
        if (d < magnet) {
          const a = U.angleTo(k.x, k.y, p.x, p.y);
          const sp = 260 + (magnet - d) * 2.4;
          k.x += Math.cos(a) * sp * dt;
          k.y += Math.sin(a) * sp * dt;
        }
        if (d < 26) {
          if (k.type === 'gold') {
            this.gold += k.value;
            if (U.chance(0.2)) this.emit('sfx', 'coin');
          } else if (k.type === 'health') {
            this.healPlayer(k.value, false);
          }
          this.pickups.splice(i, 1);
        }
      }
    }

    updateEffects(dt) {
      for (let i = this.slashes.length - 1; i >= 0; i--) {
        const s = this.slashes[i];
        s.t += dt;
        if (s.t >= s.dur) this.slashes.splice(i, 1);
      }
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.t += dt;
        if (b.t >= b.dur) this.beams.splice(i, 1);
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.t += dt;
        if (r.t >= r.dur) this.rings.splice(i, 1);
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const q = this.particles[i];
        q.life -= dt;
        if (q.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        if (q.drag) {
          q.vx = U.damp(q.vx, 0, q.drag, dt);
          q.vy = U.damp(q.vy, 0, q.drag, dt);
        }
      }
      for (let i = this.floaters.length - 1; i >= 0; i--) {
        const f = this.floaters[i];
        f.life -= dt;
        f.y += (f.vy || -60) * dt;
        if (f.life <= 0) this.floaters.splice(i, 1);
      }
    }

    availableEvolution() {
      const item = this.weapon;
      if (!item || item.evolved || item.level < 5) return null;
      const evo = D.EVOLUTIONS[item.id];
      if (!evo || !evo.req || !evo.req.element) return null;
      const key = elementPassiveKey(evo.req.element);
      if ((this.passives[key] || 0) < (evo.req.count || 2)) return null;
      return evo;
    }

    evolutionRequirementText() {
      const item = this.weapon;
      if (!item) return '';
      const evo = D.EVOLUTIONS[item.id];
      if (!evo) return 'This weapon has no evolution';
      if (item.evolved) return 'Evolved';
      const key = elementPassiveKey(evo.req.element);
      const name = D.PASSIVES[key].name;
      return 'Requires level 5 (' + item.level + '/5) and ' + (evo.req.count || 2) + 'x ' + name + ' (' + (this.passives[key] || 0) + '/' + (evo.req.count || 2) + ')';
    }

    upgradeCost(item) {
      return Math.round(38 + (item ? item.level : 1) * 34 + this.level * 5);
    }

    healCost() {
      const base = 30 + this.level * 4;
      return Math.round(this.hasModifier('noheal') ? base * 2 : base);
    }

    rewardCandidates() {
      const self = this;
      const out = [];
      const weaponIds = Object.keys(D.WEAPONS).filter(function (id) {
        return id !== self.weapon.id || self.weapon.evolved;
      });
      weaponIds.forEach(function (id) {
        const locked = !self.unlockedWeapons[id];
        out.push({ type: 'weapon', id: id, weight: locked ? 26 : 12 });
      });
      const armourIds = Object.keys(D.ARMOURS).filter(function (id) { return id !== self.armour.id; });
      armourIds.forEach(function (id) {
        const locked = !self.unlockedArmours[id];
        out.push({ type: 'armour', id: id, weight: locked ? 24 : 13 });
      });
      for (const id in D.PASSIVES) {
        const stacks = this.passives[id] || 0;
        if (stacks >= D.PASSIVES[id].max) continue;
        out.push({ type: 'passive', id: id, weight: 20, stacks: stacks });
      }
      if (this.weapon.level < 5) out.push({ type: 'upgrade', id: 'upgrade', weight: 24 });
      for (const id in D.RELICS) {
        if (this.relics.indexOf(id) >= 0) continue;
        out.push({ type: 'relic', id: id, weight: 9 });
      }
      for (const id in D.CONSUMABLES) out.push({ type: 'consumable', id: id, weight: 7 });
      out.push({ type: 'gold', id: 'gold', weight: 8, amount: Math.round(60 + this.level * 16) });
      out.push({ type: 'heal', id: 'heal', weight: 6, amount: Math.round(this.stats.maxHp * 0.35) });
      return out;
    }

    generateRewards(count) {
      const cards = [];
      const evo = this.availableEvolution();
      if (evo) {
        cards.push({ type: 'evolve', id: this.weapon.id, evoId: evo.id, weight: 0 });
      }
      if (this.pendingSpecialReward === 'boss') {
        const combo = bossDropFor(this.lastBossId);
        if (combo) cards.push(Object.assign({ weight: 0, guaranteed: true }, combo));
        this.pendingSpecialReward = null;
      }
      const pool = this.rewardCandidates();
      const used = {};
      cards.forEach(function (c) { used[c.type + ':' + c.id] = true; });
      const target = count || 3;
      let guard = 0;
      while (cards.length < target && guard++ < 80) {
        const available = pool.filter(function (c) { return !used[c.type + ':' + c.id]; });
        if (!available.length) break;
        const choice = U.weightedPick(available, function (c) { return c.weight; });
        if (!choice) break;
        used[choice.type + ':' + choice.id] = true;
        const card = Object.assign({}, choice);
        if (card.type === 'weapon' || card.type === 'armour') card.rarity = this.rollRarityForLevel().id;
        cards.push(card);
      }
      return cards;
    }

    rollRarityForLevel() {
      const bonus = Math.min(45, this.level * 2.2);
      const roll = Math.random() * 100;
      const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const weights = [55, 30, 14, 6, 2];
      let acc = 0;
      for (let i = 0; i < order.length; i++) {
        let w = weights[i] * (1 + bonus / 100);
        acc += w;
        if (roll < acc) return D.RARITY_BY_ID[order[i]];
      }
      return D.RARITY_BY_ID.common;
    }

    applyReward(card) {
      if (!card) return;
      if (card.type === 'weapon') {
        this.acquireWeapon(this.makeWeapon(card.id, 1, card.rarity || 'common'), true);
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'armour') {
        this.acquireArmour(this.makeArmour(card.id, card.rarity || 'common'), true);
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'passive') {
        this.passives[card.id] = (this.passives[card.id] || 0) + 1;
        this.recompute();
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'upgrade') {
        if (this.weapon.level < 5) this.weapon.level++;
        this.recompute();
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'relic') {
        if (this.relics.indexOf(card.id) < 0) this.relics.push(card.id);
        this.recompute();
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'consumable') {
        this.consumables[card.id] = (this.consumables[card.id] || 0) + 1;
        this.emit('sfx', 'uiBig');
      } else if (card.type === 'gold') {
        this.gold += Math.round(card.amount * this.stats.gold);
        this.emit('sfx', 'coin');
      } else if (card.type === 'heal') {
        this.healPlayer(card.amount, false);
        this.emit('sfx', 'heal');
      } else if (card.type === 'evolve') {
        const evo = D.EVOLUTIONS[this.weapon.id];
        if (evo) {
          this.weapon.evolved = true;
          this.runStats.evolutions++;
          this.emit('sfx', 'evolve');
          this.emit('evolved', { name: evo.name });
          this.shake = 10;
          for (let i = 0; i < 30; i++) {
            const a = U.rand(0, U.TAU);
            this.particles.push({
              x: this.player.x, y: this.player.y, vx: Math.cos(a) * U.rand(80, 420), vy: Math.sin(a) * U.rand(80, 420),
              life: 0.9, maxLife: 0.9, size: U.rand(2, 6), color: evo.color, drag: 2
            });
          }
        }
      }
    }

    acquireWeapon(item, equip) {
      const existing = this.ownedWeapons.find(function (w) { return w.id === item.id && w.evolved === item.evolved; });
      if (existing) {
        existing.level = Math.max(existing.level, item.level);
        if (D.RARITY_BY_ID[item.rarity].mult > D.RARITY_BY_ID[existing.rarity].mult) existing.rarity = item.rarity;
        if (equip) this.weaponIndex = this.ownedWeapons.indexOf(existing);
      } else {
        this.ownedWeapons.push(item);
        if (equip) this.weaponIndex = this.ownedWeapons.length - 1;
      }
      if (!this.unlockedWeapons[item.id]) {
        this.unlockedWeapons[item.id] = true;
        this.newUnlocks.push({ kind: 'weapon', id: item.id });
        this.emit('unlock', { kind: 'weapon', id: item.id });
      }
      this.recompute();
    }

    acquireArmour(item, equip) {
      const existing = this.ownedArmours.find(function (a) { return a.id === item.id; });
      if (existing) {
        if (D.RARITY_BY_ID[item.rarity].mult > D.RARITY_BY_ID[existing.rarity].mult) {
          existing.rarity = item.rarity;
          existing.stats = item.stats;
          existing.affixes = item.affixes;
        }
        if (equip) this.armourIndex = this.ownedArmours.indexOf(existing);
      } else {
        this.ownedArmours.push(item);
        if (equip) this.armourIndex = this.ownedArmours.length - 1;
      }
      if (!this.unlockedArmours[item.id]) {
        this.unlockedArmours[item.id] = true;
        this.newUnlocks.push({ kind: 'armour', id: item.id });
        this.emit('unlock', { kind: 'armour', id: item.id });
      }
      this.recompute();
    }

    equipWeapon(index) {
      if (index < 0 || index >= this.ownedWeapons.length) return;
      this.weaponIndex = index;
      this.recompute();
      this.emit('sfx', 'ui');
    }

    equipArmour(index) {
      if (index < 0 || index >= this.ownedArmours.length) return;
      this.armourIndex = index;
      this.recompute();
      this.emit('sfx', 'ui');
    }

    generateShop() {
      const offers = [];
      const pool = this.rewardCandidates().filter(function (c) {
        return c.type === 'weapon' || c.type === 'armour' || c.type === 'relic' || c.type === 'passive' || c.type === 'consumable';
      });
      const used = {};
      const offerCount = 4 + (this.relics.indexOf('scavengerKit') >= 0 ? 1 : 0);
      let guard = 0;
      while (offers.length < offerCount && guard++ < 80) {
        const c = U.weightedPick(pool, function (o) { return o.weight; });
        if (!c) break;
        const key = c.type + ':' + c.id;
        if (used[key]) continue;
        used[key] = true;
        const offer = Object.assign({}, c);
        if (offer.type === 'weapon' || offer.type === 'armour') offer.rarity = this.rollRarityForLevel().id;
        let base = 60;
        if (offer.type === 'weapon') base = D.WEAPONS[offer.id].price || 70;
        else if (offer.type === 'armour') base = D.ARMOURS[offer.id].price || 70;
        else if (offer.type === 'relic') base = D.RELICS[offer.id].price || 100;
        else if (offer.type === 'consumable') base = D.CONSUMABLES[offer.id].price || 35;
        const rarityMul = offer.rarity ? D.RARITY_BY_ID[offer.rarity].mult : 1;
        let price = Math.round(base * (0.9 + this.level * 0.02) * (0.85 + rarityMul * 0.25));
        if (this.relics.indexOf('scavengerKit') >= 0) price = Math.round(price * 0.88);
        offer.price = price;
        offer.sold = false;
        offers.push(offer);
      }
      return offers;
    }

    buyOffer(offer) {
      if (!offer || offer.sold) return false;
      if (this.gold < offer.price) return false;
      this.gold -= offer.price;
      offer.sold = true;
      this.applyReward(Object.assign({}, offer));
      this.emit('sfx', 'coin');
      return true;
    }

    buyHeal() {
      const cost = this.healCost();
      if (this.gold < cost) return false;
      if (this.player.hp >= this.stats.maxHp) return false;
      this.gold -= cost;
      this.healPlayer(this.stats.maxHp * 0.5, false);
      this.emit('sfx', 'heal');
      return true;
    }

    buyWeaponUpgrade() {
      const cost = this.upgradeCost(this.weapon);
      if (this.gold < cost) return false;
      if (this.weapon.level >= 5) return false;
      this.gold -= cost;
      this.weapon.level++;
      this.recompute();
      this.emit('sfx', 'uiBig');
      return true;
    }

    useConsumable(id) {
      if (!this.consumables[id] || this.consumables[id] <= 0) return false;
      const def = D.CONSUMABLES[id];
      if (!def || def.use === 'reroll') return false;
      this.consumables[id]--;
      if (this.consumables[id] <= 0) delete this.consumables[id];
      const p = this.player;
      if (def.use === 'heal') {
        this.healPlayer(this.stats.maxHp * 0.45, false);
      } else if (def.use === 'bomb') {
        this.explode(p.x, p.y, 240, 160 * this.stats.dmg, 'fire', { color: '#ff7a3c', knockback: 320, burn: { dps: 8, dur: 3 } });
      } else if (def.use === 'adren') {
        p.adrenT = 6;
        this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 90, t: 0, dur: 0.4, color: '#ffd166', width: 3 });
      } else if (def.use === 'ward') {
        p.wardT = 3.5;
        this.rings.push({ x: p.x, y: p.y, r: 10, maxR: 80, t: 0, dur: 0.5, color: '#8fd0ff', width: 4 });
      } else if (def.use === 'freeze') {
        for (let i = 0; i < this.enemies.length; i++) {
          if (!this.enemies[i].dead) this.applyChill(this.enemies[i], 0.1, 2.5);
        }
        this.rings.push({ x: p.x, y: p.y, r: 20, maxR: 900, t: 0, dur: 0.8, color: '#9fe0ff', width: 6 });
      }
      this.emit('sfx', 'uiBig');
      return true;
    }

    startNextLevel() {
      this.startLevel(this.level + 1);
    }

    generateEvent() {
      const weighted = [
        { id: 'merchant', w: 22 }, { id: 'treasure', w: 16 }, { id: 'shrine', w: 16 },
        { id: 'sanctuary', w: 18 }, { id: 'challenge', w: 14 }, { id: 'mystery', w: 16 }, { id: 'forge', w: 12 }
      ];
      const choice = U.weightedPick(weighted, function (o) { return o.w; });
      const def = D.EVENTS[choice.id];
      return Object.assign({}, def, { resolved: false, resultText: '' });
    }

    resolveEvent(event, choiceId) {
      const p = this.player;
      const st = this.stats;
      event.resolved = true;
      const result = { text: '' };
      if (event.id === 'merchant') {
        if (choiceId === 'buy') {
          const cost = Math.round((40 + this.level * 6) * (this.relics.indexOf('scavengerKit') >= 0 ? 0.88 : 1));
          if (this.gold >= cost) {
            this.gold -= cost;
            const pool = this.rewardCandidates().filter(function (c) {
              return c.type === 'passive' || c.type === 'relic' || c.type === 'consumable';
            });
            const c = U.weightedPick(pool, function (o) { return o.weight; });
            if (c) this.applyReward(Object.assign({}, c, { rarity: this.rollRarityForLevel().id }));
            result.text = 'The merchant hands over the goods with a toothy grin.';
          } else {
            result.text = 'Your purse is too light. The merchant shrugs and folds the cloth.';
          }
        } else {
          result.text = 'You walk on. The merchant calls after you about "next time".';
        }
      } else if (event.id === 'treasure') {
        if (choiceId === 'open') {
          this.gold += Math.round(60 + this.level * 14);
          result.text = 'The vault holds a stack of coin. You take it all.';
        } else {
          this.hurtPlayer(st.maxHp * 0.12, null, { ignoreInvuln: true, silent: true });
          const pool = this.rewardCandidates().filter(function (c) { return c.type === 'passive' || c.type === 'relic'; });
          const c = U.weightedPick(pool, function (o) { return o.weight; });
          if (c) this.applyReward(c);
          result.text = 'The lock bites your hand, but the hidden compartment opens.';
        }
      } else if (event.id === 'shrine') {
        if (choiceId === 'accept') {
          p.hp = Math.max(1, p.hp - st.maxHp * 0.2);
          const self = this;
          const keys = Object.keys(D.PASSIVES).filter(function (k) {
            return (self.passives[k] || 0) < D.PASSIVES[k].max;
          });
          const pickId = U.pick(keys);
          if (pickId) {
            this.passives[pickId] = (this.passives[pickId] || 0) + 2;
            this.recompute();
            result.text = 'The altar drinks your blood. ' + D.PASSIVES[pickId].name + ' surges within you (x2).';
          } else {
            this.gold += 80;
            result.text = 'You have nothing left to give. The shrine spits out coins instead.';
          }
        } else {
          this.healPlayer(st.maxHp * 0.15, false);
          result.text = 'You scatter salt over the altar. The whispers fade and your wounds itch closed.';
        }
      } else if (event.id === 'sanctuary') {
        if (choiceId === 'rest') {
          this.healPlayer(st.maxHp * 0.55, false);
          result.text = 'You rest in the light. Most of your wounds close.';
        } else {
          this.healPlayer(st.maxHp * 0.25, false);
          p.shield = this.stats.shield;
          result.text = 'A calm settles over you and the air hardens into a barrier.';
        }
      } else if (event.id === 'challenge') {
        if (choiceId === 'fight') {
          this.nextLevelChallenge = true;
          result.text = 'A warden will be waiting in the next arena. Defeat it for a bonus reward.';
        } else {
          result.text = 'You decline. The warden sneers and dissolves into mist.';
        }
      } else if (event.id === 'mystery') {
        if (choiceId === 'gamble') {
          const roll = Math.random();
          if (roll < 0.4) {
            const pool = this.rewardCandidates().filter(function (c) {
              return c.type === 'relic' || c.type === 'weapon' || c.type === 'passive';
            });
            const c = U.weightedPick(pool, function (o) { return o.weight; });
            if (c) this.applyReward(Object.assign({}, c, { rarity: 'epic' }));
            result.text = 'The box contains something extraordinary.';
          } else if (roll < 0.7) {
            this.gold += Math.round(90 + this.level * 18);
            result.text = 'A shower of coins bursts out of the box.';
          } else {
            this.hurtPlayer(st.maxHp * 0.15, null, { ignoreInvuln: true, silent: true });
            result.text = 'The box was a mimic. It bites you and vanishes.';
          }
        } else {
          result.text = 'You leave the humming box alone. Probably wise.';
        }
      } else if (event.id === 'forge') {
        if (choiceId === 'forge') {
          if (this.weapon.level < 5) {
            this.weapon.level++;
            this.recompute();
            result.text = 'You hammer the weapon into a finer form. It is now level ' + this.weapon.level + '.';
          } else {
            this.gold += 90;
            result.text = 'The forge cannot improve it further, so you melt the coals for coin.';
          }
        } else {
          this.gold += Math.round(50 + this.level * 10);
          result.text = 'You strip the forge of salvage and pocket the gold.';
        }
      }
      event.resultText = result.text;
      this.emit('sfx', 'uiBig');
      return result;
    }

    summary() {
      return {
        level: this.level,
        kills: this.runStats.kills,
        damage: this.runStats.damage,
        damageTaken: this.runStats.damageTaken,
        bosses: this.runStats.bosses,
        elites: this.runStats.elites,
        evolutions: this.runStats.evolutions,
        healed: this.runStats.healed,
        time: this.time,
        character: this.characterId,
        challenge: this.challengeId,
        modifiers: this.modifierIds.slice(),
        weapon: this.weapon ? this.defOf(this.weapon).name : '',
        newUnlocks: this.newUnlocks.slice()
      };
    }
  }

  function elementPassiveKey(element) {
    return element === 'fire' ? 'pyre' : element === 'ice' ? 'rime' : element === 'lightning' ? 'volt' : element === 'poison' ? 'toxin' : 'umbra';
  }

  function bossDropFor(id) {
    const def = D.BOSSES[id];
    if (!def) return null;
    const drop = U.pick(def.drops);
    if (D.WEAPONS[drop]) return { type: 'weapon', id: drop, rarity: 'epic' };
    if (D.ARMOURS[drop]) return { type: 'armour', id: drop, rarity: 'epic' };
    return { type: 'relic', id: drop };
  }

  function b_dmgFallback(run, p) {
    const boss = run.bossActive;
    return boss ? boss.dmg * 0.6 : 8;
  }

  Run.ARENA_W = ARENA_W;
  Run.ARENA_H = ARENA_H;
  Run.scaleFor = scaleFor;
  SF.Run = Run;
})();
