(function () {
  const SF = (window.SF = window.SF || {});
  const U = SF.U;

  const ELEMENTS = {
    physical: { id: 'physical', name: 'Physical', color: '#e8eef7', icon: '\u2694', desc: 'Raw impact damage.' },
    fire: { id: 'fire', name: 'Fire', color: '#ff7a3c', icon: '\u25B2', desc: 'Ignites enemies for damage over time.' },
    ice: { id: 'ice', name: 'Ice', color: '#6fd6ff', icon: '\u2744', desc: 'Chills enemies, slowing movement and attacks.' },
    lightning: { id: 'lightning', name: 'Lightning', color: '#ffe680', icon: '\u26A1', desc: 'Arcs between nearby enemies.' },
    poison: { id: 'poison', name: 'Poison', color: '#9dff6b', icon: '\u2620', desc: 'Stacks corrosive damage over time.' },
    shadow: { id: 'shadow', name: 'Shadow', color: '#b07cff', icon: '\u25C6', desc: 'Marks targets, amplifying critical damage.' }
  };

  const RARITIES = [
    { id: 'common', name: 'Common', color: '#9fb0c4', mult: 1.0, affixes: 0, weight: 100, shards: 6 },
    { id: 'uncommon', name: 'Uncommon', color: '#5ee38f', mult: 1.15, affixes: 0, weight: 55, shards: 12 },
    { id: 'rare', name: 'Rare', color: '#54a9ff', mult: 1.32, affixes: 1, weight: 26, shards: 22 },
    { id: 'epic', name: 'Epic', color: '#c07bff', mult: 1.52, affixes: 1, weight: 10, shards: 38 },
    { id: 'legendary', name: 'Legendary', color: '#ffb347', mult: 1.78, affixes: 2, weight: 3, shards: 60 }
  ];

  const RARITY_BY_ID = {};
  RARITIES.forEach(function (r) {
    RARITY_BY_ID[r.id] = r;
  });

  function rollRarity(luck) {
    const roll = Math.random() * 100 * (1 + (luck || 0) * 0.35);
    let acc = 0;
    const list = RARITIES.slice().reverse();
    for (let i = 0; i < list.length; i++) {
      acc += list[i].weight;
      if (roll < acc) return list[i];
    }
    return RARITIES[0];
  }

  const AFFIXES = [
    { id: 'dmg', name: 'Damage', apply: function (s, v) { s.dmg += v; }, roll: function (r) { return r ? 0.06 + r * 0.03 : 0.06; }, text: function (v) { return '+' + U.pct(v) + ' damage'; } },
    { id: 'fireRate', name: 'Attack Speed', apply: function (s, v) { s.fireRate += v; }, roll: function (r) { return r ? 0.06 + r * 0.03 : 0.06; }, text: function (v) { return '+' + U.pct(v) + ' attack speed'; } },
    { id: 'crit', name: 'Crit', apply: function (s, v) { s.crit += v; }, roll: function (r) { return r ? 0.04 + r * 0.02 : 0.04; }, text: function (v) { return '+' + U.pct(v) + ' crit chance'; } },
    { id: 'hp', name: 'Health', apply: function (s, v) { s.maxHp += v; }, roll: function (r) { return r ? 10 + r * 8 : 10; }, text: function (v) { return '+' + Math.round(v) + ' max health'; } },
    { id: 'speed', name: 'Speed', apply: function (s, v) { s.speed += v; }, roll: function (r) { return r ? 0.04 + r * 0.02 : 0.04; }, text: function (v) { return '+' + U.pct(v) + ' move speed'; } },
    { id: 'lifesteal', name: 'Lifesteal', apply: function (s, v) { s.lifesteal += v; }, roll: function (r) { return r ? 0.015 + r * 0.01 : 0.015; }, text: function (v) { return '+' + U.pct(v, 1) + ' lifesteal'; } },
    { id: 'dr', name: 'Armour', apply: function (s, v) { s.dr += v; }, roll: function (r) { return r ? 0.03 + r * 0.02 : 0.03; }, text: function (v) { return '+' + U.pct(v) + ' damage reduction'; } }
  ];

  const WEAPONS = {
    cleaver: {
      id: 'cleaver', name: 'Iron Cleaver', cat: 'Sword', icon: '\u2694', kind: 'melee',
      dmg: 31, interval: 0.46, range: 106, arc: 1.75, knockback: 220, crit: 0.1, critMult: 1.7,
      element: 'physical', color: '#d8e4f2', accent: '#7fb2ea',
      desc: 'Broad heavy arcs that cleave through packs of enemies.',
      strength: 'Excellent crowd clear at close range.', weakness: 'No reach; whiffs on kiters.',
      price: 60
    },
    fangs: {
      id: 'fangs', name: 'Twin Fangs', cat: 'Dual Blades', icon: '\u2694', kind: 'melee',
      dmg: 13, interval: 0.155, range: 82, arc: 1.1, knockback: 70, crit: 0.16, critMult: 1.6,
      element: 'physical', color: '#c8f2dd', accent: '#57e0a0',
      desc: 'Blistering fast slashes. Rewards aggressive footwork.',
      strength: 'Highest sustained hit rate; melts single targets.', weakness: 'Tiny arc, low per-hit damage.',
      price: 65
    },
    shotgun: {
      id: 'shotgun', name: 'Breach Shotgun', cat: 'Shotgun', icon: '\u25A3', kind: 'projectile',
      dmg: 15, interval: 0.84, pellets: 6, spread: 0.42, speed: 880, life: 0.34,
      crit: 0.06, critMult: 1.6, knockback: 90, element: 'physical', color: '#ffd9a0', accent: '#ff9b3d',
      falloff: true,
      desc: 'Six-pellet blast. Devastating inside a body-length, useless across the arena.',
      strength: 'Enormous burst at point blank.', weakness: 'Severe range falloff and slow reload.',
      price: 75
    },
    rifle: {
      id: 'rifle', name: 'Warden Rifle', cat: 'Assault Rifle', icon: '\u25AC', kind: 'projectile',
      dmg: 11, interval: 0.13, speed: 1300, spread: 0.07, life: 0.62,
      crit: 0.08, critMult: 1.6, element: 'physical', color: '#bfe8ff', accent: '#5fb7ff',
      desc: 'Steady automatic fire with tight spread. The reliable baseline.',
      strength: 'Consistent damage at any range.', weakness: 'Nothing exceptional; no burst.',
      price: 70
    },
    sniper: {
      id: 'sniper', name: 'Railspike', cat: 'Sniper', icon: '\u27A4', kind: 'beam',
      dmg: 108, interval: 1.5, range: 900, pierce: 2, crit: 0.22, critMult: 2.0,
      element: 'physical', color: '#e6f0ff', accent: '#8fb6ff',
      desc: 'A hypersonic spike that punches through a line of bodies.',
      strength: 'Massive single-hit damage and pierce.', weakness: 'Very slow; punishes bad aim.',
      price: 90
    },
    flame: {
      id: 'flame', name: 'Cinder Thrower', cat: 'Flamethrower', icon: '\u25B2', kind: 'cone',
      dmg: 8, interval: 0.08, range: 238, arc: 0.62, crit: 0.02, critMult: 1.4,
      element: 'fire', burn: { dps: 7, dur: 3 }, color: '#ff9b4a', accent: '#ff5a1f',
      desc: 'A pressurised jet of burning fuel. Damage over time does the real work.',
      strength: 'Shreds packs and ignores armour over time.', weakness: 'Dagger range; burn needs time.',
      price: 80
    },
    arc: {
      id: 'arc', name: 'Arc Lance', cat: 'Energy', icon: '\u26A1', kind: 'projectile',
      dmg: 36, interval: 0.33, speed: 1750, pierce: 3, life: 0.7,
      crit: 0.12, critMult: 1.7, element: 'lightning', chain: 1, color: '#ffe680', accent: '#ffc400',
      desc: 'Superheated energy lance that skewers a whole column of enemies.',
      strength: 'Pierces three targets and arcs lightning.', weakness: 'Thin projectile, needs lining up.',
      price: 85
    },
    havoc: {
      id: 'havoc', name: 'Havoc Launcher', cat: 'Explosive', icon: '\u25C9', kind: 'projectile',
      dmg: 56, interval: 1.02, speed: 760, life: 1.1, splash: 116, splashMult: 0.8,
      crit: 0.05, critMult: 1.6, element: 'physical', color: '#ffbb66', accent: '#ff6a2a',
      desc: 'Lobbed warheads that detonate in a wide blast radius.',
      strength: 'Area denial and multi-kills.', weakness: 'Slow; self-harming in melee.',
      price: 95
    },
    venom: {
      id: 'venom', name: 'Venom Spitter', cat: 'Special', icon: '\u2620', kind: 'projectile',
      dmg: 12, interval: 0.26, speed: 1020, life: 0.72, pierce: 1,
      crit: 0.08, critMult: 1.5, element: 'poison', poison: { dps: 6, dur: 4 },
      color: '#a8ff77', accent: '#4fd23a',
      desc: 'Corrosive darts that stack a creeping toxin on everything they touch.',
      strength: 'Stacking damage over time across many targets.', weakness: 'Low instant damage.',
      price: 78
    },
    frost: {
      id: 'frost', name: 'Frost Musket', cat: 'Sniper', icon: '\u2744', kind: 'projectile',
      dmg: 47, interval: 0.62, speed: 1560, life: 0.9, pierce: 1,
      crit: 0.14, critMult: 1.8, element: 'ice', chill: { mult: 0.55, dur: 2.2 },
      color: '#bff0ff', accent: '#4ec8ff',
      desc: 'Fires a freezing slug that locks dangerous enemies in place.',
      strength: 'Controls chargers, elites and bosses.', weakness: 'Moderate DPS, slow cadence.',
      price: 82
    },
    scythe: {
      id: 'scythe', name: 'Umbral Scythe', cat: 'Sword', icon: '\u25C6', kind: 'melee',
      dmg: 58, interval: 0.78, range: 132, arc: 2.6, knockback: 260, crit: 0.25, critMult: 2.1,
      element: 'shadow', color: '#d0b6ff', accent: '#8a4dff', mark: true,
      desc: 'A sweeping reaper arc that marks souls for critical punishment.',
      strength: 'Huge arc and crit damage.', weakness: 'Slow swings leave you exposed.',
      price: 100
    },
    storm: {
      id: 'storm', name: 'Storm Caller', cat: 'Magic', icon: '\u26A1', kind: 'beam',
      dmg: 32, interval: 0.46, range: 400, chains: 3,
      crit: 0.12, critMult: 1.7, element: 'lightning', color: '#ffeaa0', accent: '#7fb2ff',
      desc: 'Calls down a chain of lightning that leaps between clustered foes.',
      strength: 'Great vs groups without aiming precision.', weakness: 'Falls off against lone targets.',
      price: 92
    },
    glaive: {
      id: 'glaive', name: 'Cyclone Glaive', cat: 'Special', icon: '\u2739', kind: 'projectile',
      dmg: 26, interval: 0.5, speed: 640, life: 1.4, pierce: 4, boomerang: true,
      crit: 0.1, critMult: 1.6, element: 'physical', color: '#d7f7ff', accent: '#54d9ff',
      desc: 'A whirling blade that boomerangs out and back through everything.',
      strength: 'Hits each enemy twice per throw.', weakness: 'Slow travel; needs positioning.',
      price: 88
    },
    mortar: {
      id: 'mortar', name: 'Sunfire Mortar', cat: 'Explosive', icon: '\u25C9', kind: 'projectile',
      dmg: 44, interval: 1.3, speed: 620, life: 1.5, splash: 150, splashMult: 0.9,
      burn: { dps: 10, dur: 3 }, crit: 0.06, critMult: 1.6, element: 'fire',
      color: '#ffb066', accent: '#ff4d1a',
      desc: 'Lobs an incendiary shell that leaves a burning pool on impact.',
      strength: 'Zone control and burn spread.', weakness: 'Slowest weapon; easy to whiff.',
      price: 96
    }
  };

  const EVOLUTIONS = {
    cleaver: {
      id: 'sunbreaker', base: 'cleaver', name: 'Sunbreaker', cat: 'Sword', icon: '\u2694', kind: 'melee',
      dmg: 34, interval: 0.4, range: 128, arc: 2.0, knockback: 300, crit: 0.16, critMult: 1.9,
      element: 'fire', burn: { dps: 9, dur: 3 }, wave: true,
      color: '#ffcf8a', accent: '#ff6a1f',
      desc: 'Every swing releases a crescent of solar fire that travels forward.',
      strength: 'Melee crowd control plus ranged fire waves.', weakness: 'Still wants you in the fight.',
      req: { element: 'fire', count: 2 }
    },
    fangs: {
      id: 'mirrorstorm', base: 'fangs', name: 'Mirror Storm', cat: 'Dual Blades', icon: '\u2694', kind: 'melee',
      dmg: 17, interval: 0.12, range: 96, arc: 1.35, knockback: 100, crit: 0.24, critMult: 1.9,
      element: 'shadow', mark: true, echo: true,
      color: '#d9c6ff', accent: '#9b5cff',
      desc: 'Spectral echoes mirror each slash a heartbeat later.',
      strength: 'Doubles your hit count; brutal with crit builds.', weakness: 'Fragile if surrounded.',
      req: { element: 'shadow', count: 2 }
    },
    shotgun: {
      id: 'siegebreaker', base: 'shotgun', name: 'Siegebreaker', cat: 'Shotgun', icon: '\u25A3', kind: 'projectile',
      dmg: 19, interval: 0.72, pellets: 8, spread: 0.5, speed: 950, life: 0.42,
      crit: 0.1, critMult: 1.7, knockback: 130, element: 'physical', splash: 70, splashMult: 0.6,
      color: '#ffd9a0', accent: '#ff7a1f', falloff: true,
      desc: 'Eight explosive slugs. Anything that survives is knocked flat.',
      strength: 'Room-clearing burst damage.', weakness: 'Close range and slow cadence.',
      req: { element: 'fire', count: 2 }
    },
    rifle: {
      id: 'havocrepeater', base: 'rifle', name: 'Havoc Repeater', cat: 'Assault Rifle', icon: '\u25AC', kind: 'projectile',
      dmg: 13, interval: 0.11, speed: 1450, spread: 0.09, life: 0.7, burst: 2, ricochet: 1,
      crit: 0.14, critMult: 1.8, element: 'lightning', chain: 1,
      color: '#c9f0ff', accent: '#4fb8ff',
      desc: 'Twin-linked rounds that ricochet into a second target.',
      strength: 'Sustained fire that never wastes a bullet.', weakness: 'Low burst per shot.',
      req: { element: 'lightning', count: 2 }
    },
    sniper: {
      id: 'eventhorizon', base: 'sniper', name: 'Event Horizon', cat: 'Sniper', icon: '\u27A4', kind: 'beam',
      dmg: 132, interval: 1.2, range: 1100, pierce: 99, crit: 0.3, critMult: 2.3,
      element: 'shadow', implode: true, mark: true,
      color: '#e0ccff', accent: '#8f4dff',
      desc: 'Pierces everything and collapses space on impact.',
      strength: 'Deletes entire lines of enemies.', weakness: 'Relentlessly slow.',
      req: { element: 'shadow', count: 2 }
    },
    flame: {
      id: 'infernochoir', base: 'flame', name: 'Inferno Choir', cat: 'Flamethrower', icon: '\u25B2', kind: 'cone',
      dmg: 11, interval: 0.075, range: 268, arc: 0.78, crit: 0.04, critMult: 1.5,
      element: 'fire', burn: { dps: 13, dur: 4 }, nova: true,
      color: '#ffb066', accent: '#ff2d00',
      desc: 'The jet ignites the air itself, detonating a ring of flame periodically.',
      strength: 'Melts swarms and applies spreading burns.', weakness: 'Short reach.',
      req: { element: 'fire', count: 2 }
    },
    arc: {
      id: 'singularity', base: 'arc', name: 'Singularity Lance', cat: 'Energy', icon: '\u26A1', kind: 'projectile',
      dmg: 46, interval: 0.3, speed: 1900, pierce: 99, life: 0.85,
      crit: 0.18, critMult: 1.9, element: 'lightning', chain: 3, implode: true,
      color: '#fff2a8', accent: '#ffb700',
      desc: 'An unbroken beam of plasma that pulls struck enemies together.',
      strength: 'Pierces everything and clusters foes.', weakness: 'Narrow line of fire.',
      req: { element: 'lightning', count: 2 }
    },
    havoc: {
      id: 'novabarrage', base: 'havoc', name: 'Nova Barrage', cat: 'Explosive', icon: '\u25C9', kind: 'projectile',
      dmg: 62, interval: 0.92, speed: 800, life: 1.2, splash: 138, splashMult: 0.95,
      cluster: 3, crit: 0.08, critMult: 1.7, element: 'fire', burn: { dps: 8, dur: 2 },
      color: '#ffc470', accent: '#ff4d12',
      desc: 'Each shell splits into a cluster of secondary detonations.',
      strength: 'Absurd area damage.', weakness: 'Slow projectiles, no single-target focus.',
      req: { element: 'fire', count: 2 }
    },
    venom: {
      id: 'plagueheart', base: 'venom', name: 'Plagueheart', cat: 'Special', icon: '\u2620', kind: 'projectile',
      dmg: 15, interval: 0.24, speed: 1080, life: 0.8, pierce: 2,
      crit: 0.1, critMult: 1.6, element: 'poison', poison: { dps: 10, dur: 5 }, cloud: true,
      color: '#b6ff84', accent: '#3fc41f',
      desc: 'Darts seed lingering plague clouds that rot everything inside.',
      strength: 'Area denial that scales with enemy density.', weakness: 'Needs time to kill.',
      req: { element: 'poison', count: 2 }
    },
    frost: {
      id: 'permafrost', base: 'frost', name: 'Permafrost', cat: 'Sniper', icon: '\u2744', kind: 'projectile',
      dmg: 56, interval: 0.55, speed: 1620, life: 1.0, pierce: 2,
      crit: 0.18, critMult: 1.9, element: 'ice', chill: { mult: 0.35, dur: 3 }, shatter: true,
      color: '#d6f7ff', accent: '#2fb6ff',
      desc: 'Freezes targets solid. Frozen enemies take bonus critical damage.',
      strength: 'Trivialises dangerous elites.', weakness: 'Requires landing hits.',
      req: { element: 'ice', count: 2 }
    },
    scythe: {
      id: 'reaper', base: 'scythe', name: "Reaper's Eclipse", cat: 'Sword', icon: '\u25C6', kind: 'melee',
      dmg: 72, interval: 0.68, range: 152, arc: 3.15, knockback: 320, crit: 0.34, critMult: 2.4,
      element: 'shadow', mark: true, drain: 0.06,
      color: '#e2ccff', accent: '#a34dff',
      desc: 'A full circle of eclipse-steel that drains the life of everything cut.',
      strength: '360-degree cleave with healing.', weakness: 'Commits you to melee range.',
      req: { element: 'shadow', count: 2 }
    },
    storm: {
      id: 'thunderhead', base: 'storm', name: 'Thunderhead', cat: 'Magic', icon: '\u26A1', kind: 'beam',
      dmg: 42, interval: 0.4, range: 460, chains: 6, stormAura: true,
      crit: 0.18, critMult: 1.9, element: 'lightning',
      color: '#fff4b8', accent: '#7fa8ff',
      desc: 'A permanent storm orbits you, striking anything that comes close.',
      strength: 'Passive damage plus huge chain lightning.', weakness: 'Modest single-target DPS.',
      req: { element: 'lightning', count: 2 }
    },
    glaive: {
      id: 'tempestblade', base: 'glaive', name: 'Tempest Blade', cat: 'Special', icon: '\u2739', kind: 'projectile',
      dmg: 32, interval: 0.42, speed: 720, life: 1.6, pierce: 99, boomerang: true, ricochet: 1,
      crit: 0.16, critMult: 1.8, element: 'lightning', chain: 1,
      color: '#e4fbff', accent: '#48c8ff',
      desc: 'The glaive never stops spinning, arcing lightning on every pass.',
      strength: 'Endless multi-hits in dense packs.', weakness: 'Low single-target focus.',
      req: { element: 'lightning', count: 2 }
    },
    mortar: {
      id: 'ashesun', base: 'mortar', name: 'Ashen Sun', cat: 'Explosive', icon: '\u25C9', kind: 'projectile',
      dmg: 52, interval: 1.1, speed: 680, life: 1.6, splash: 175, splashMult: 1.0,
      burn: { dps: 14, dur: 4 }, crit: 0.1, critMult: 1.7, element: 'fire', cloud: true,
      color: '#ffb066', accent: '#ff3300',
      desc: 'Calls down a miniature sun that leaves an inferno in its wake.',
      strength: 'Turns the arena into a furnace.', weakness: 'Slow, indirect damage.',
      req: { element: 'fire', count: 2 }
    }
  };

  const ARMOURS = {
    rags: {
      id: 'rags', name: 'Drifter Rags', icon: '\u25A9',
      hp: 12, dr: 0.02, speed: 0.06, crit: 0.01, desc: 'Light cloth. No protection, plenty of freedom.',
      passive: 'none', price: 30
    },
    bulwark: {
      id: 'bulwark', name: 'Bulwark Plate', icon: '\u25A8',
      hp: 58, dr: 0.26, speed: -0.12, desc: 'Slab armour that turns hits into shoves.',
      passive: 'none', passiveText: 'High damage reduction, slower movement.', price: 85
    },
    ghostweave: {
      id: 'ghostweave', name: 'Ghostweave', icon: '\u25A7',
      hp: 14, dr: 0.04, speed: 0.18, dodge: 0.14, desc: 'Woven silk that makes you hard to pin down.',
      passive: 'dodge', passiveText: '14% chance to fully evade incoming hits.', price: 80
    },
    vanguard: {
      id: 'vanguard', name: 'Vanguard Rig', icon: '\u25A6',
      hp: 32, dr: 0.14, speed: 0.02, dmg: 0.08, desc: 'Standard-issue assault plating with recoil dampers.',
      passive: 'none', passiveText: 'Balanced protection with +8% damage.', price: 70
    },
    verdant: {
      id: 'verdant', name: 'Verdant Carapace', icon: '\u2740',
      hp: 38, dr: 0.08, regen: 1.8, desc: 'Living chitin that knits your wounds shut.',
      passive: 'regen', passiveText: 'Regenerates 1.8 health per second.', price: 88
    },
    aegis: {
      id: 'aegis', name: 'Aegis Core', icon: '\u25C8',
      hp: 16, dr: 0.06, shield: 70, shieldRegen: 9, desc: 'A humming energy core projecting a rechargeable barrier.',
      passive: 'shield', passiveText: 'Rechargeable shield absorbs damage before health.', price: 95
    },
    emberplate: {
      id: 'emberplate', name: 'Emberplate', icon: '\u25B2',
      hp: 30, dr: 0.1, elem: { fire: 0.2 }, aura: 'burn', desc: 'Heat-sink plating that ignites anything that touches you.',
      passive: 'burnAura', passiveText: 'Attackers are set on fire. +20% fire damage.', price: 92
    },
    frostmantle: {
      id: 'frostmantle', name: 'Frostmantle', icon: '\u2744',
      hp: 28, dr: 0.09, elem: { ice: 0.2 }, aura: 'chill', desc: 'A cloak of frozen air that saps the speed of nearby foes.',
      passive: 'chillAura', passiveText: 'Nearby enemies are chilled. +20% ice damage.', price: 92
    },
    stormhide: {
      id: 'stormhide', name: 'Stormhide', icon: '\u26A1',
      hp: 24, dr: 0.07, speed: 0.05, elem: { lightning: 0.2 }, aura: 'zap', desc: 'Charged hide that discharges into attackers.',
      passive: 'zap', passiveText: 'Attackers are struck by lightning. +20% lightning damage.', price: 90
    },
    bloodmail: {
      id: 'bloodmail', name: 'Bloodmail', icon: '\u2665',
      hp: 26, dr: 0.06, lifesteal: 0.06, desc: 'Linked chains that drink the wounds of your enemies.',
      passive: 'lifesteal', passiveText: '+6% lifesteal on all damage dealt.', price: 96
    },
    voidshroud: {
      id: 'voidshroud', name: 'Voidshroud', icon: '\u25C6',
      hp: 8, dr: 0.03, crit: 0.12, critMult: 0.35, dodge: 0.08, elem: { shadow: 0.2 },
      desc: 'A shifting absence of space. Rewards precise aggression.',
      passive: 'crit', passiveText: '+12% crit chance and +35% crit damage.', price: 100
    },
    titanheart: {
      id: 'titanheart', name: 'Titanheart', icon: '\u25A9',
      hp: 88, dr: 0.18, speed: -0.08, thorns: 14, desc: 'A reactor-heart in a shell of scarred alloy.',
      passive: 'thorns', passiveText: 'Reflects 14 damage to melee attackers.', price: 105
    },
    chronosuit: {
      id: 'chronosuit', name: 'Chronosuit', icon: '\u25F4',
      hp: 18, dr: 0.05, speed: 0.1, fireRate: 0.16, cdReduce: 0.15, desc: 'Temporal servos that accelerate your reflexes.',
      passive: 'haste', passiveText: '+16% attack speed, -15% ability cooldown.', price: 110
    }
  };

  const PASSIVES = {
    overclock: { id: 'overclock', name: 'Overclock', icon: '\u26A1', max: 5, desc: '+12% attack speed', tag: 'offence', apply: function (s, n) { s.fireRate += 0.12 * n; }, text: function (n) { return '+' + (12 * n) + '% attack speed'; } },
    hollowpoint: { id: 'hollowpoint', name: 'Hollow Points', icon: '\u25C9', max: 8, desc: '+14% damage', tag: 'offence', apply: function (s, n) { s.dmg += 0.14 * n; }, text: function (n) { return '+' + (14 * n) + '% damage'; } },
    keen: { id: 'keen', name: 'Keen Edge', icon: '\u2694', max: 6, desc: '+7% crit chance', tag: 'offence', apply: function (s, n) { s.crit += 0.07 * n; }, text: function (n) { return '+' + (7 * n) + '% crit chance'; } },
    executioner: { id: 'executioner', name: 'Executioner', icon: '\u2620', max: 5, desc: '+30% crit damage', tag: 'offence', apply: function (s, n) { s.critMult += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% crit damage'; } },
    bloodthirst: { id: 'bloodthirst', name: 'Bloodthirst', icon: '\u2665', max: 4, desc: '+3% lifesteal', tag: 'sustain', apply: function (s, n) { s.lifesteal += 0.03 * n; }, text: function (n) { return '+' + (3 * n) + '% lifesteal'; } },
    vitality: { id: 'vitality', name: 'Vitality', icon: '\u271A', max: 8, desc: '+20 max health', tag: 'defence', apply: function (s, n) { s.maxHp += 20 * n; }, text: function (n) { return '+' + (20 * n) + ' max health'; } },
    plating: { id: 'plating', name: 'Reactive Plating', icon: '\u25A8', max: 5, desc: '+5% damage reduction', tag: 'defence', apply: function (s, n) { s.dr += 0.05 * n; }, text: function (n) { return '+' + (5 * n) + '% damage reduction'; } },
    regeneration: { id: 'regeneration', name: 'Regeneration', icon: '\u2740', max: 5, desc: '+1.2 health per second', tag: 'sustain', apply: function (s, n) { s.regen += 1.2 * n; }, text: function (n) { return '+' + (1.2 * n).toFixed(1) + ' health/sec'; } },
    shieldcell: { id: 'shieldcell', name: 'Shield Cell', icon: '\u25C8', max: 4, desc: '+30 shield and +3 shield regen', tag: 'defence', apply: function (s, n) { s.shield += 30 * n; s.shieldRegen += 3 * n; }, text: function (n) { return '+' + (30 * n) + ' shield'; } },
    boots: { id: 'boots', name: 'Servo Boots', icon: '\u27A4', max: 5, desc: '+8% move speed', tag: 'utility', apply: function (s, n) { s.speed += 0.08 * n; }, text: function (n) { return '+' + (8 * n) + '% move speed'; } },
    multishot: { id: 'multishot', name: 'Split Chamber', icon: '\u2236', max: 3, desc: '+1 projectile per shot', tag: 'offence', apply: function (s, n) { s.extraProj += n; }, text: function (n) { return '+' + n + ' projectile' + (n > 1 ? 's' : ''); } },
    pierce: { id: 'pierce', name: 'Piercing Rounds', icon: '\u27A4', max: 3, desc: '+1 pierce on projectiles', tag: 'offence', apply: function (s, n) { s.extraPierce += n; }, text: function (n) { return '+' + n + ' pierce'; } },
    blast: { id: 'blast', name: 'Blast Radius', icon: '\u25C9', max: 4, desc: '+18% area of effect', tag: 'offence', apply: function (s, n) { s.area += 0.18 * n; }, text: function (n) { return '+' + (18 * n) + '% area'; } },
    thorns: { id: 'thorns', name: 'Spiked Hide', icon: '\u2731', max: 4, desc: '+12 damage reflected', tag: 'defence', apply: function (s, n) { s.thorns += 12 * n; }, text: function (n) { return '+' + (12 * n) + ' reflect damage'; } },
    fortune: { id: 'fortune', name: 'Fortune', icon: '\u25CF', max: 4, desc: '+20% currency', tag: 'utility', apply: function (s, n) { s.gold += 0.2 * n; }, text: function (n) { return '+' + (20 * n) + '% currency'; } },
    magnetism: { id: 'magnetism', name: 'Magnet Field', icon: '\u25CE', max: 3, desc: '+45 pickup radius', tag: 'utility', apply: function (s, n) { s.pickup += 45 * n; }, text: function (n) { return '+' + (45 * n) + ' pickup radius'; } },
    ricochet: { id: 'ricochet', name: 'Ricochet', icon: '\u21BB', max: 2, desc: 'Projectiles bounce to 1 extra enemy', tag: 'offence', apply: function (s, n) { s.ricochet += n; }, text: function (n) { return '+' + n + ' ricochet'; } },
    secondwind: { id: 'secondwind', name: 'Second Wind', icon: '\u2726', max: 1, desc: 'Survive one lethal hit at 45% health', tag: 'defence', apply: function (s, n) { s.revives += n; }, text: function () { return 'Cheat death once per run'; } },
    pyre: { id: 'pyre', name: 'Pyre Attunement', icon: '\u25B2', max: 3, desc: '+30% fire damage', tag: 'element', element: 'fire', apply: function (s, n) { s.elem.fire += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% fire damage'; } },
    rime: { id: 'rime', name: 'Rime Attunement', icon: '\u2744', max: 3, desc: '+30% ice damage', tag: 'element', element: 'ice', apply: function (s, n) { s.elem.ice += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% ice damage'; } },
    volt: { id: 'volt', name: 'Volt Attunement', icon: '\u26A1', max: 3, desc: '+30% lightning damage', tag: 'element', element: 'lightning', apply: function (s, n) { s.elem.lightning += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% lightning damage'; } },
    toxin: { id: 'toxin', name: 'Toxin Attunement', icon: '\u2620', max: 3, desc: '+30% poison damage', tag: 'element', element: 'poison', apply: function (s, n) { s.elem.poison += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% poison damage'; } },
    umbra: { id: 'umbra', name: 'Umbra Attunement', icon: '\u25C6', max: 3, desc: '+30% shadow damage', tag: 'element', element: 'shadow', apply: function (s, n) { s.elem.shadow += 0.3 * n; }, text: function (n) { return '+' + (30 * n) + '% shadow damage'; } }
  };

  const RELICS = {
    emberSigil: { id: 'emberSigil', name: 'Ember Sigil', icon: '\u25B2', desc: 'Burns you inflict spread to enemies within 90 units.', price: 110 },
    phaseCloak: { id: 'phaseCloak', name: 'Phase Cloak', icon: '\u25A7', desc: '+12% dodge chance.', price: 105, apply: function (s) { s.dodge += 0.12; } },
    gunnerChip: { id: 'gunnerChip', name: 'Gunner Chip', icon: '\u2236', desc: '+1 projectile on every shot.', price: 120, apply: function (s) { s.extraProj += 1; } },
    bloodIdol: { id: 'bloodIdol', name: 'Blood Idol', icon: '\u2665', desc: '+7% lifesteal.', price: 115, apply: function (s) { s.lifesteal += 0.07; } },
    staticCoil: { id: 'staticCoil', name: 'Static Coil', icon: '\u26A1', desc: 'All hits arc lightning to one nearby enemy.', price: 110 },
    frostHeart: { id: 'frostHeart', name: 'Frost Heart', icon: '\u2744', desc: 'Kills chill nearby enemies.', price: 100 },
    voidLens: { id: 'voidLens', name: 'Void Lens', icon: '\u25C6', desc: '+45% critical damage.', price: 112, apply: function (s) { s.critMult += 0.45; }, },
    titanBelt: { id: 'titanBelt', name: 'Titan Belt', icon: '\u25A8', desc: '+45 max health and +8% damage reduction.', price: 108, apply: function (s) { s.maxHp += 45; s.dr += 0.08; }, },
    scavengerKit: { id: 'scavengerKit', name: 'Scavenger Kit', icon: '\u25CF', desc: '+1 shop offer and 12% cheaper prices.', price: 95 },
    duelistGlove: { id: 'duelistGlove', name: 'Duelist Glove', icon: '\u2694', desc: '+14% attack speed and +5% crit chance.', price: 118, apply: function (s) { s.fireRate += 0.14; s.crit += 0.05; } },
    hungryMaw: { id: 'hungryMaw', name: 'Hungry Maw', icon: '\u2620', desc: 'Kills restore 1.5% of your max health.', price: 100 },
    overcharger: { id: 'overcharger', name: 'Overcharger', icon: '\u2726', desc: 'Ability cooldown reduced by 25%.', price: 105, apply: function (s) { s.cdReduce += 0.25; } }
  };

  const CONSUMABLES = {
    potion: { id: 'potion', name: 'Field Medkit', icon: '\u271A', desc: 'Restore 45% of max health instantly.', price: 35, use: 'heal' },
    bomb: { id: 'bomb', name: 'Frag Charge', icon: '\u25C9', desc: 'Detonate for heavy damage around you.', price: 40, use: 'bomb' },
    adren: { id: 'adren', name: 'Adrenal Shot', icon: '\u26A1', desc: '+45% attack and move speed for 6s.', price: 35, use: 'adren' },
    ward: { id: 'ward', name: 'Ward Sigil', icon: '\u25C8', desc: 'Become invulnerable for 3.5s.', price: 45, use: 'ward' },
    freeze: { id: 'freeze', name: 'Cryo Grenade', icon: '\u2744', desc: 'Freeze all enemies for 2.5s.', price: 42, use: 'freeze' },
    reroll: { id: 'reroll', name: 'Reward Beacon', icon: '\u21BB', desc: 'Refresh the current reward selection.', price: 30, use: 'reroll' }
  };

  const ENEMIES = {
    crawler: {
      id: 'crawler', name: 'Crawler', hp: 26, speed: 92, dmg: 8, r: 15, gold: 4,
      ai: 'chase', weight: 100, unlock: 1, color: '#c9d6e6', accent: '#7d8ea3', shape: 'blob',
      desc: 'Slow, plentiful melee fodder.'
    },
    sprinter: {
      id: 'sprinter', name: 'Sprinter', hp: 17, speed: 178, dmg: 6, r: 12, gold: 5,
      ai: 'chase', weight: 80, unlock: 1, color: '#ffe08a', accent: '#c99a2b', shape: 'spike',
      desc: 'Fast and fragile. Never let them surround you.', weak: { ice: 0.5 }
    },
    spitter: {
      id: 'spitter', name: 'Spitter', hp: 28, speed: 72, dmg: 9, r: 15, gold: 7,
      ai: 'ranged', range: 330, attackCd: 2.1, projSpeed: 360, weight: 65, unlock: 2,
      color: '#a8ff9b', accent: '#3fa02f', shape: 'blob', resist: { poison: 0.6 }, weak: { fire: 0.35 },
      desc: 'Keeps its distance and spits acid.'
    },
    bulwark: {
      id: 'bulwark', name: 'Bulwark', hp: 74, speed: 56, dmg: 13, r: 21, gold: 10,
      ai: 'chase', weight: 55, unlock: 4, color: '#9fb0c8', accent: '#4a5a74', shape: 'block',
      dr: 0.32, resist: { physical: 0.35, poison: 0.5 }, weak: { lightning: 0.4 },
      desc: 'Armoured front-line unit. Physical hits glance off.'
    },
    bomber: {
      id: 'bomber', name: 'Bomber', hp: 24, speed: 118, dmg: 0, r: 15, gold: 8,
      ai: 'bomber', explode: { dmg: 30, radius: 96 }, weight: 50, unlock: 3,
      color: '#ffb066', accent: '#ff4d1a', shape: 'orb', resist: { fire: 0.7 },
      desc: 'Charges and detonates. Kill it early or run.'
    },
    mender: {
      id: 'mender', name: 'Mender', hp: 36, speed: 74, dmg: 0, r: 16, gold: 12,
      ai: 'support', healRadius: 190, healAmount: 14, weight: 40, unlock: 4,
      color: '#8ffbd0', accent: '#20b98a', shape: 'ring', resist: { poison: 0.4 },
      desc: 'Heals other enemies. Focus it down first.'
    },
    summoner: {
      id: 'summoner', name: 'Summoner', hp: 52, speed: 62, dmg: 0, r: 18, gold: 14,
      ai: 'summon', range: 420, attackCd: 5.2, summon: 'crawler', summonCount: 2, weight: 35, unlock: 5,
      color: '#c6a8ff', accent: '#7a3fd8', shape: 'ring', weak: { shadow: 0.4 },
      desc: 'Spawns endless crawlers. Kill it or drown.'
    },
    brute: {
      id: 'brute', name: 'Brute', hp: 150, speed: 64, dmg: 20, r: 27, gold: 16,
      ai: 'brute', range: 120, attackCd: 3.0, weight: 42, unlock: 4,
      color: '#c98f6f', accent: '#7c4526', shape: 'block', dr: 0.12, weak: { fire: 0.3 },
      desc: 'Tanky slammer that telegraphs ground pounds.'
    },
    stalker: {
      id: 'stalker', name: 'Stalker', hp: 38, speed: 132, dmg: 17, r: 14, gold: 12,
      ai: 'assassin', range: 300, attackCd: 3.4, weight: 38, unlock: 6,
      color: '#b9a6ff', accent: '#5b2fd0', shape: 'spike', resist: { shadow: 0.5 }, weak: { lightning: 0.3 },
      desc: 'Blinks behind you and strikes. Watch your back.'
    },
    drifter: {
      id: 'drifter', name: 'Drifter', hp: 30, speed: 148, dmg: 10, r: 13, gold: 9,
      ai: 'fly', weight: 45, unlock: 5, color: '#9be7ff', accent: '#2f8fbf', shape: 'wing',
      resist: { poison: 0.5 }, weak: { ice: 0.3 },
      desc: 'Hovers over hazards and dives at you.'
    },
    warden: {
      id: 'warden', name: 'Aegis Warden', hp: 78, speed: 70, dmg: 14, r: 19, gold: 14,
      ai: 'chase', shield: 48, shieldRegen: 6, weight: 40, unlock: 7,
      color: '#a8c8ff', accent: '#3557a8', shape: 'hex', resist: { lightning: 0.4 }, weak: { shadow: 0.35 },
      desc: 'Carries a regenerating barrier. Burst it down fast.'
    },
    hexer: {
      id: 'hexer', name: 'Hexer', hp: 44, speed: 82, dmg: 0, r: 16, gold: 15,
      ai: 'hex', range: 340, attackCd: 4.2, weight: 32, unlock: 8,
      color: '#d8b0ff', accent: '#8228c8', shape: 'ring', resist: { shadow: 0.5 }, weak: { poison: 0.4 },
      desc: 'Curses you with weakness and sluggishness.'
    },
    crusher: {
      id: 'crusher', name: 'Crusher', hp: 220, speed: 70, dmg: 24, r: 30, gold: 26,
      ai: 'brute', range: 140, attackCd: 2.6, weight: 16, unlock: 9,
      color: '#c9b08f', accent: '#6b4a23', shape: 'block', dr: 0.2, weak: { ice: 0.3 },
      desc: 'A walking siege engine with brutal shockwaves.'
    },
    splitter: {
      id: 'splitter', name: 'Splitter', hp: 60, speed: 96, dmg: 12, r: 18, gold: 11,
      ai: 'chase', split: 'sprinter', splitCount: 2, weight: 30, unlock: 10,
      color: '#b0f0c8', accent: '#2f9a6a', shape: 'blob', weak: { fire: 0.3 },
      desc: 'Splits into two sprinters when it dies.'
    },
    tallow: {
      id: 'tallow', name: 'Tallow Wraith', hp: 48, speed: 104, dmg: 13, r: 15, gold: 13,
      ai: 'fly', weight: 30, unlock: 11, color: '#ffd0e0', accent: '#c04070', shape: 'wing',
      resist: { fire: 0.5 }, weak: { shadow: 0.4 },
      desc: 'Fire-resistant wraith that weaves through the fight.'
    }
  };

  const ELITE_MODIFIERS = {
    armoured: { id: 'armoured', name: 'Armoured', color: '#9fb0c8', hp: 1.5, dmg: 1.0, speed: 0.9, dr: 0.3, desc: 'Heavily armoured: 50% more health, 30% damage reduction.' },
    regenerating: { id: 'regenerating', name: 'Regenerating', color: '#5ee38f', hp: 1.25, regen: 3.2, desc: 'Heals rapidly over time.' },
    explosive: { id: 'explosive', name: 'Volatile', color: '#ffa04a', hp: 0.9, onDeath: 'explode', desc: 'Explodes on death.' },
    enraged: { id: 'enraged', name: 'Enraged', color: '#ff5c5c', dmg: 1.45, speed: 1.2, hp: 0.95, desc: 'Hits 45% harder and moves faster.' },
    poisonous: { id: 'poisonous', name: 'Poisonous', color: '#a8ff77', onHit: 'poison', desc: 'Attacks inflict stacking poison.' },
    swift: { id: 'swift', name: 'Swift', color: '#8fe3ff', speed: 1.55, hp: 0.85, desc: 'Dramatically faster.' },
    shielded: { id: 'shielded', name: 'Shielded', color: '#a8c8ff', shield: 0.55, desc: 'Carries an energy barrier worth 55% of its health.' }
  };

  const BOSSES = {
    butcher: {
      id: 'butcher', name: 'The Butcher', title: 'Fleshrender', hp: 720, r: 46, speed: 96,
      color: '#e08a72', accent: '#7a1d12', gold: 120, phases: 2, weak: { ice: 0.25 },
      desc: 'A hulking cleaver-fiend. Charges, slams and sweeps.',
      drops: ['bloodmail', 'havoc', 'titanBelt']
    },
    matron: {
      id: 'matron', name: 'Hive Matron', title: 'Broodmother', hp: 780, r: 44, speed: 66,
      color: '#a8ff9b', accent: '#2f6b1d', gold: 140, phases: 2, weak: { fire: 0.35 },
      desc: 'A bloated hive queen. Spawns broods and floods the floor with acid.',
      drops: ['verdant', 'venom', 'bloodIdol']
    },
    colossus: {
      id: 'colossus', name: 'Frost Colossus', title: 'Rimebound Titan', hp: 880, r: 52, speed: 74,
      color: '#9fe0ff', accent: '#1f5a8a', gold: 160, phases: 2, resist: { ice: 0.7 }, weak: { fire: 0.4 },
      desc: 'A glacier given form. Sweeping beams and shattering novas.',
      drops: ['frostmantle', 'frost', 'phaseCloak']
    },
    sovereign: {
      id: 'sovereign', name: 'Void Sovereign', title: 'The Unmade', hp: 980, r: 44, speed: 88,
      color: '#c6a8ff', accent: '#3a1060', gold: 200, phases: 3, resist: { shadow: 0.6 }, weak: { lightning: 0.3 },
      desc: 'A hole in reality wearing a crown. Teleports, pulls and fires bullet rings.',
      drops: ['voidshroud', 'sniper', 'voidLens']
    }
  };

  const BIOMES = [
    {
      id: 'foundry', name: 'Ashen Foundry', tag: 'Heat vents scorch the floor.',
      bg1: '#241318', bg2: '#3a2018', floor: '#4b2c22', grid: 'rgba(255,150,90,0.13)',
      accent: '#ff7a3c', fog: 'rgba(255,110,40,0.07)',
      hazard: 'vent', hazardDamage: 9, enemies: ['crawler', 'sprinter', 'bomber', 'brute', 'bulwark', 'mender']
    },
    {
      id: 'mire', name: 'Fungal Mire', tag: 'Toxic pools sap your strength.',
      bg1: '#111a16', bg2: '#1a2e23', floor: '#26402f', grid: 'rgba(130,255,180,0.12)',
      accent: '#7dff9b', fog: 'rgba(90,255,150,0.06)',
      hazard: 'spore', hazardDamage: 7, enemies: ['crawler', 'spitter', 'summoner', 'splitter', 'mender', 'hexer']
    },
    {
      id: 'reach', name: 'Frozen Reach', tag: 'Ice slicks slow your movement.',
      bg1: '#0f1626', bg2: '#18273c', floor: '#23394f', grid: 'rgba(150,225,255,0.13)',
      accent: '#6fd6ff', fog: 'rgba(110,200,255,0.07)',
      hazard: 'ice', hazardDamage: 5, enemies: ['bulwark', 'brute', 'warden', 'drifter', 'stalker', 'crawler']
    },
    {
      id: 'rift', name: 'Void Rift', tag: 'Rifts drag you toward hungry nothing.',
      bg1: '#150e20', bg2: '#241636', floor: '#2f2149', grid: 'rgba(195,150,255,0.13)',
      accent: '#b07cff', fog: 'rgba(160,110,255,0.07)',
      hazard: 'rift', hazardDamage: 8, enemies: ['stalker', 'hexer', 'tallow', 'summoner', 'crusher', 'warden']
    }
  ];

  const CHARACTERS = {
    rook: {
      id: 'rook', name: 'Rook', title: 'The Bulwark', color: '#7fb2ea', weapon: 'cleaver', armour: 'vanguard',
      passive: { name: 'Stalwart', desc: 'Deals +12% damage while above half health and takes 6% less damage.' },
      active: { id: 'slam', name: 'Bulwark Slam', cd: 9, desc: 'Slam the ground: 90 damage in a wide radius, knock enemies away, gain 1.2s invulnerability.' },
      unlock: { type: 'default', desc: 'Available from the start.' },
      stats: { dmg: 0.06, dr: 0.06 }
    },
    sly: {
      id: 'sly', name: 'Sly', title: 'The Duelist', color: '#57e0a0', weapon: 'fangs', armour: 'ghostweave',
      passive: { name: 'Flurry', desc: '+18% attack speed and +10% move speed.' },
      active: { id: 'blink', name: 'Blink Strike', cd: 7, desc: 'Dash forward, dealing 70 damage to everything you pass through.' },
      unlock: { type: 'runs', value: 3, desc: 'Complete 3 runs.' },
      stats: { fireRate: 0.18, speed: 0.1 }
    },
    mara: {
      id: 'mara', name: 'Mara', title: 'The Marksman', color: '#5fb7ff', weapon: 'rifle', armour: 'vanguard',
      passive: { name: 'Deadeye', desc: '+18% crit chance and +35% crit damage.' },
      active: { id: 'focus', name: 'Focus Fire', cd: 12, desc: 'Time slows for 3.5s while your damage and attack speed rise 35%.' },
      unlock: { type: 'weapons', value: 6, desc: 'Unlock 6 weapons across your runs.' },
      stats: { crit: 0.18, critMult: 0.35 }
    },
    cinder: {
      id: 'cinder', name: 'Cinder', title: 'The Pyromancer', color: '#ff9b4a', weapon: 'flame', armour: 'emberplate',
      passive: { name: 'Pyromania', desc: '+35% fire damage and burns spread between enemies.' },
      active: { id: 'nova', name: 'Flame Nova', cd: 10, desc: 'Release a ring of fire dealing 110 fire damage and igniting everything.' },
      unlock: { type: 'bosses', value: 2, desc: 'Defeat 2 bosses.' },
      stats: { elemFire: 0.35, spread: 1 }
    },
    vex: {
      id: 'vex', name: 'Vex', title: 'The Voidwalker', color: '#b07cff', weapon: 'arc', armour: 'aegis',
      passive: { name: 'Phase Ward', desc: 'Gain 60 shield that recharges quickly, and +15% shadow damage.' },
      active: { id: 'rift', name: 'Void Rift', cd: 11, desc: 'Open a rift that pulls enemies inward and detonates for 130 shadow damage.' },
      unlock: { type: 'level', value: 12, desc: 'Reach level 12 in a single run.' },
      stats: { shield: 60, shadow: 0.15 }
    }
  };

  const META_UPGRADES = [
    { id: 'core', name: 'Vital Core', icon: '\u271A', desc: '+6 max health', max: 5, cost: function (n) { return 60 + n * 45; } },
    { id: 'edge', name: 'Edge Training', icon: '\u2694', desc: '+3% damage', max: 5, cost: function (n) { return 70 + n * 55; } },
    { id: 'cache', name: 'Shard Cache', icon: '\u25CF', desc: '+6% currency', max: 5, cost: function (n) { return 50 + n * 40; } },
    { id: 'dash', name: 'Phase Training', icon: '\u27A4', desc: '-8% ability cooldown', max: 4, cost: function (n) { return 80 + n * 60; } },
    { id: 'ward', name: 'Ward Plating', icon: '\u25A8', desc: '+2% damage reduction', max: 4, cost: function (n) { return 90 + n * 70; } }
  ];

  const ACHIEVEMENTS = [
    { id: 'firstblood', name: 'First Blood', desc: 'Defeat your first enemy.', reward: 10, check: function (s) { return s.totalKills >= 1; } },
    { id: 'centurion', name: 'Centurion', desc: 'Defeat 100 enemies in total.', reward: 30, check: function (s) { return s.totalKills >= 100; } },
    { id: 'exterminator', name: 'Exterminator', desc: 'Defeat 1000 enemies in total.', reward: 120, check: function (s) { return s.totalKills >= 1000; } },
    { id: 'bosslayer', name: 'Boss Slayer', desc: 'Defeat a boss.', reward: 40, check: function (s) { return s.bossesKilled >= 1; } },
    { id: 'bossmaster', name: 'Titan Killer', desc: 'Defeat 10 bosses.', reward: 150, check: function (s) { return s.bossesKilled >= 10; } },
    { id: 'depth5', name: 'Descent I', desc: 'Reach level 5.', reward: 25, check: function (s) { return s.bestLevel >= 5; } },
    { id: 'depth10', name: 'Descent II', desc: 'Reach level 10.', reward: 50, check: function (s) { return s.bestLevel >= 10; } },
    { id: 'depth20', name: 'Descent III', desc: 'Reach level 20.', reward: 100, check: function (s) { return s.bestLevel >= 20; } },
    { id: 'depth30', name: 'Descent IV', desc: 'Reach level 30.', reward: 180, check: function (s) { return s.bestLevel >= 30; } },
    { id: 'evolver', name: 'Evolutionist', desc: 'Evolve a weapon.', reward: 60, check: function (s) { return s.evolutions >= 1; } },
    { id: 'collector', name: 'Collector', desc: 'Unlock 12 weapons.', reward: 80, check: function (s) { return s.weaponsUnlocked >= 12; } },
    { id: 'survivor', name: 'Survivor', desc: 'Complete 5 runs.', reward: 40, check: function (s) { return s.runs >= 5; } },
    { id: 'nightmare', name: 'Nightmare Walker', desc: 'Reach level 10 on Nightmare.', reward: 200, check: function (s) { return (s.nightmareBest || 0) >= 10; } },
    { id: 'critking', name: 'Critical Mass', desc: 'Deal 100,000 total damage.', reward: 70, check: function (s) { return s.totalDamage >= 100000; } }
  ];

  const CHALLENGES = [
    { id: 'normal', name: 'Normal', desc: 'The intended experience.', hp: 1, dmg: 1, gold: 1, shards: 1 },
    { id: 'hard', name: 'Hard', desc: 'Enemies are tougher and hit harder. More rewards.', hp: 1.25, dmg: 1.25, gold: 1.3, shards: 1.6 },
    { id: 'nightmare', name: 'Nightmare', desc: 'Punishing scaling. Only for the fearless.', hp: 1.5, dmg: 1.55, gold: 1.7, shards: 2.4 }
  ];

  const MODIFIERS = [
    { id: 'swift', name: 'Swift Horde', desc: 'Enemies move 25% faster.', shards: 1.25 },
    { id: 'elite', name: 'Elite Heavy', desc: 'Elites spawn twice as often.', shards: 1.3 },
    { id: 'noheal', name: 'Frailty', desc: 'No healing between levels; shop healing costs double.', shards: 1.35 },
    { id: 'glass', name: 'Glass Cannon', desc: 'You deal +40% damage but have 40% less health.', shards: 1.3 },
    { id: 'swarm', name: 'Swarm', desc: 'Far more enemies, but each is weaker.', shards: 1.25 }
  ];

  const EVENTS = {
    merchant: {
      id: 'merchant', name: 'Travelling Merchant', icon: '\u25CF',
      text: 'A hooded trader unfolds a stained cloth of wares. "Coin for power, friend?"',
      choices: [{ id: 'buy', label: 'Trade (spend gold)' }, { id: 'leave', label: 'Walk away' }]
    },
    treasure: {
      id: 'treasure', name: 'Treasure Vault', icon: '\u25A0',
      text: 'A rusted vault hangs open, humming with stored charge.',
      choices: [
        { id: 'open', label: 'Take the cache (loot)' },
        { id: 'force', label: 'Force the lock (+loot, -health)' }
      ]
    },
    shrine: {
      id: 'shrine', name: 'Cursed Shrine', icon: '\u25C6',
      text: 'A black altar offers power for blood. The whispers are persuasive.',
      choices: [
        { id: 'accept', label: 'Accept the curse (power for health)' },
        { id: 'cleanse', label: 'Cleanse it (small heal)' }
      ]
    },
    sanctuary: {
      id: 'sanctuary', name: 'Healing Sanctuary', icon: '\u271A',
      text: 'Warm light pools in a cracked basin. Your wounds close just standing here.',
      choices: [
        { id: 'rest', label: 'Rest (heal 55%)' },
        { id: 'pray', label: 'Pray (heal 25% and gain shield)' }
      ]
    },
    challenge: {
      id: 'challenge', name: 'Elite Challenge', icon: '\u2694',
      text: 'A warden of the arena offers a duel. Victory pays well.',
      choices: [
        { id: 'fight', label: 'Accept the duel' },
        { id: 'decline', label: 'Decline' }
      ]
    },
    mystery: {
      id: 'mystery', name: 'Shimmering Cache', icon: '\u2726',
      text: 'A sealed box of unknown origin. It hums when you touch it.',
      choices: [
        { id: 'gamble', label: 'Open it' },
        { id: 'skip', label: 'Leave it alone' }
      ]
    },
    forge: {
      id: 'forge', name: 'Abandoned Forge', icon: '\u2692',
      text: 'Coals still glow. You could reforge a weapon here.',
      choices: [
        { id: 'forge', label: 'Reforge weapon (upgrade)' },
        { id: 'scrap', label: 'Scrap it for gold' }
      ]
    }
  };

  SF.DATA = {
    ELEMENTS, RARITIES, RARITY_BY_ID, AFFIXES, WEAPONS, EVOLUTIONS, ARMOURS, PASSIVES,
    RELICS, CONSUMABLES, ENEMIES, ELITE_MODIFIERS, BOSSES, BIOMES, CHARACTERS,
    META_UPGRADES, ACHIEVEMENTS, CHALLENGES, MODIFIERS, EVENTS,
    rollRarity
  };
})();
