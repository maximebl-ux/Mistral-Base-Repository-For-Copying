(function () {
  const SF = (window.SF = window.SF || {});
  const D = SF.DATA;
  const KEY = 'shardfall_save_v2';

  const BASE_WEAPONS = ['cleaver', 'fangs', 'rifle', 'shotgun', 'arc'];
  const BASE_ARMOURS = ['rags', 'vanguard', 'bulwark', 'ghostweave'];

  function defaults() {
    return {
      v: 2,
      shards: 0,
      unlocks: {
        weapons: BASE_WEAPONS.slice(),
        armours: BASE_ARMOURS.slice()
      },
      upgrades: { core: 0, edge: 0, cache: 0, dash: 0, ward: 0 },
      achievements: [],
      settings: {
        master: 0.85,
        music: true,
        shake: true,
        numbers: true,
        aimAssist: true,
        quality: 1
      },
      stats: {
        runs: 0,
        totalKills: 0,
        bossesKilled: 0,
        elitesKilled: 0,
        bestLevel: 0,
        totalDamage: 0,
        totalHealed: 0,
        bestTime: 0,
        nightmareBest: 0,
        evolutions: 0,
        weaponsFound: BASE_WEAPONS.slice(),
        armoursFound: BASE_ARMOURS.slice(),
        charactersPlayed: {},
        weaponUse: {},
        byChallenge: {}
      },
      lastSetup: { character: 'rook', challenge: 'normal', modifiers: [] }
    };
  }

  const Save = {
    data: defaults(),
    available: true
  };

  function merge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        merge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
    return target;
  }

  Save.load = function () {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return Save.data;
      const parsed = JSON.parse(raw);
      Save.data = merge(defaults(), parsed);
      if (!Array.isArray(Save.data.unlocks.weapons) || !Save.data.unlocks.weapons.length) Save.data.unlocks.weapons = BASE_WEAPONS.slice();
      if (!Array.isArray(Save.data.unlocks.armours) || !Save.data.unlocks.armours.length) Save.data.unlocks.armours = BASE_ARMOURS.slice();
    } catch (e) {
      Save.available = false;
      Save.data = defaults();
    }
    return Save.data;
  };

  Save.write = function () {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(Save.data));
    } catch (e) {
      Save.available = false;
    }
  };

  Save.reset = function () {
    Save.data = defaults();
    Save.write();
  };

  Save.settings = function () {
    return Save.data.settings;
  };

  Save.setSetting = function (key, value) {
    Save.data.settings[key] = value;
    Save.write();
  };

  Save.meta = function () {
    return {
      upgrades: Save.data.upgrades,
      weapons: Save.data.unlocks.weapons,
      armours: Save.data.unlocks.armours
    };
  };

  Save.hasWeapon = function (id) {
    return Save.data.unlocks.weapons.indexOf(id) >= 0;
  };

  Save.hasArmour = function (id) {
    return Save.data.unlocks.armours.indexOf(id) >= 0;
  };

  Save.addShards = function (n) {
    Save.data.shards = Math.max(0, Math.round(Save.data.shards + n));
    Save.write();
    return Save.data.shards;
  };

  Save.weaponCost = function (id) {
    const def = D.WEAPONS[id];
    if (!def) return 999;
    const base = def.price || 80;
    return Math.round(base * 0.9);
  };

  Save.armourCost = function (id) {
    const def = D.ARMOURS[id];
    if (!def) return 999;
    const base = def.price || 80;
    return Math.round(base * 0.85);
  };

  Save.buyWeapon = function (id) {
    if (Save.hasWeapon(id)) return { ok: false, reason: 'owned' };
    const cost = Save.weaponCost(id);
    if (Save.data.shards < cost) return { ok: false, reason: 'shards' };
    Save.data.shards -= cost;
    Save.data.unlocks.weapons.push(id);
    if (Save.data.stats.weaponsFound.indexOf(id) < 0) Save.data.stats.weaponsFound.push(id);
    Save.write();
    return { ok: true, cost: cost };
  };

  Save.buyArmour = function (id) {
    if (Save.hasArmour(id)) return { ok: false, reason: 'owned' };
    const cost = Save.armourCost(id);
    if (Save.data.shards < cost) return { ok: false, reason: 'shards' };
    Save.data.shards -= cost;
    Save.data.unlocks.armours.push(id);
    if (Save.data.stats.armoursFound.indexOf(id) < 0) Save.data.stats.armoursFound.push(id);
    Save.write();
    return { ok: true, cost: cost };
  };

  Save.buyUpgrade = function (id) {
    const def = D.META_UPGRADES.find(function (u) { return u.id === id; });
    if (!def) return { ok: false };
    const rank = Save.data.upgrades[id] || 0;
    if (rank >= def.max) return { ok: false, reason: 'max' };
    const cost = def.cost(rank);
    if (Save.data.shards < cost) return { ok: false, reason: 'shards' };
    Save.data.shards -= cost;
    Save.data.upgrades[id] = rank + 1;
    Save.write();
    return { ok: true, cost: cost };
  };

  Save.characterUnlocked = function (id) {
    const def = D.CHARACTERS[id];
    if (!def) return false;
    if (def.unlock.type === 'default') return true;
    const s = Save.statsView();
    if (def.unlock.type === 'runs') return s.runs >= def.unlock.value;
    if (def.unlock.type === 'weapons') return s.weaponsUnlocked >= def.unlock.value;
    if (def.unlock.type === 'bosses') return s.bossesKilled >= def.unlock.value;
    if (def.unlock.type === 'level') return s.bestLevel >= def.unlock.value;
    return false;
  };

  Save.statsView = function () {
    const s = Save.data.stats;
    return {
      runs: s.runs,
      totalKills: s.totalKills,
      bossesKilled: s.bossesKilled,
      elitesKilled: s.elitesKilled,
      bestLevel: s.bestLevel,
      totalDamage: s.totalDamage,
      totalHealed: s.totalHealed,
      bestTime: s.bestTime,
      nightmareBest: s.nightmareBest,
      evolutions: s.evolutions,
      weaponsUnlocked: Save.data.unlocks.weapons.length,
      armoursUnlocked: Save.data.unlocks.armours.length
    };
  };

  Save.checkAchievements = function () {
    const view = Save.statsView();
    const unlocked = Save.data.achievements;
    const gained = [];
    D.ACHIEVEMENTS.forEach(function (a) {
      if (unlocked.indexOf(a.id) >= 0) return;
      let done = false;
      try {
        done = !!a.check(view);
      } catch (e) {
        done = false;
      }
      if (done) {
        unlocked.push(a.id);
        Save.data.shards += a.reward;
        gained.push(a);
      }
    });
    if (gained.length) Save.write();
    return gained;
  };

  Save.recordRun = function (summary, challengeId, modifierIds) {
    const s = Save.data.stats;
    const challenge = D.CHALLENGES.find(function (c) { return c.id === challengeId; }) || D.CHALLENGES[0];
    s.runs++;
    s.totalKills += summary.kills;
    s.bossesKilled += summary.bosses;
    s.elitesKilled += summary.elites;
    s.totalDamage += Math.round(summary.damage);
    s.totalHealed += Math.round(summary.healed);
    s.bestLevel = Math.max(s.bestLevel, summary.level);
    s.bestTime = Math.max(s.bestTime, Math.round(summary.time));
    s.evolutions += summary.evolutions;
    if (challengeId === 'nightmare') s.nightmareBest = Math.max(s.nightmareBest, summary.level);
    s.charactersPlayed[summary.character] = (s.charactersPlayed[summary.character] || 0) + 1;
    s.weaponUse[summary.weapon] = (s.weaponUse[summary.weapon] || 0) + 1;
    s.byChallenge[challengeId] = (s.byChallenge[challengeId] || 0) + 1;

    const modMul = (modifierIds || []).reduce(function (acc, id) {
      const m = D.MODIFIERS.find(function (x) { return x.id === id; });
      return acc * (m ? m.shards : 1);
    }, 1);

    const rawShards = (summary.level * 5 + summary.bosses * 30 + summary.elites * 3 + summary.kills * 0.2) * challenge.shards * modMul;
    const shards = Math.max(8, Math.round(rawShards));
    Save.data.shards += shards;

    const newItems = summary.newUnlocks || [];
    newItems.forEach(function (u) {
      if (u.kind === 'weapon' && Save.data.unlocks.weapons.indexOf(u.id) < 0) Save.data.unlocks.weapons.push(u.id);
      if (u.kind === 'armour' && Save.data.unlocks.armours.indexOf(u.id) < 0) Save.data.unlocks.armours.push(u.id);
      if (u.kind === 'weapon' && s.weaponsFound.indexOf(u.id) < 0) s.weaponsFound.push(u.id);
      if (u.kind === 'armour' && s.armoursFound.indexOf(u.id) < 0) s.armoursFound.push(u.id);
    });

    const achievements = Save.checkAchievements();
    Save.write();
    return { shards: shards, achievements: achievements, unlocks: newItems };
  };

  SF.Save = Save;
})();
