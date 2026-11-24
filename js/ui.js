(function () {
  const SF = (window.SF = window.SF || {});
  const U = SF.U;
  const D = SF.DATA;

  function q(sel) {
    return document.querySelector(sel);
  }

  function make(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function rarityColor(id) {
    const r = D.RARITY_BY_ID[id];
    return r ? r.color : '#9fb0c4';
  }

  function rarityName(id) {
    const r = D.RARITY_BY_ID[id];
    return r ? r.name : 'Common';
  }

  function pct(v) {
    return Math.round(v * 100) + '%';
  }

  const UI = {
    handlers: {},
    hud: {},
    hudCache: {},
    setup: { character: 'rook', challenge: 'normal', modifiers: [] },
    codexTab: 'weapons',
    settingsReturn: 'menu'
  };

  UI.init = function (handlers) {
    UI.handlers = handlers || {};
    const menu = q('#screen-menu');
    menu.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-menu]');
      if (!btn) return;
      const action = btn.getAttribute('data-menu');
      if (action === 'play') UI.handlers.onPlay();
      else if (action === 'codex') UI.handlers.onCodex();
      else if (action === 'achievements') UI.handlers.onAchievements();
      else if (action === 'settings') UI.handlers.onSettings('menu');
      else if (action === 'help') UI.handlers.onHelp();
      else if (action === 'back-menu') UI.handlers.onBackToMenu();
    });

    q('#btn-start-run').addEventListener('click', function () {
      UI.handlers.onStartRun(UI.setup);
    });

    document.querySelectorAll('[data-menu="back-menu"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        UI.handlers.onBackToMenu();
      });
    });

    q('#btn-buy-heal').addEventListener('click', function () {
      UI.handlers.onBuyHeal();
    });
    q('#btn-buy-upgrade').addEventListener('click', function () {
      UI.handlers.onBuyUpgrade();
    });
    q('#btn-descend').addEventListener('click', function () {
      UI.handlers.onDescend();
    });
    q('#btn-resume').addEventListener('click', function () {
      UI.handlers.onResume();
    });
    q('#btn-pause-settings').addEventListener('click', function () {
      UI.handlers.onSettings('pause');
    });
    q('#btn-abandon').addEventListener('click', function () {
      UI.handlers.onAbandon();
    });
    q('#btn-settings-back').addEventListener('click', function () {
      UI.handlers.onSettingsBack();
    });
    q('#btn-retry').addEventListener('click', function () {
      UI.handlers.onRetry();
    });
    q('#btn-go-codex').addEventListener('click', function () {
      UI.handlers.onCodex();
    });
    q('#btn-go-menu').addEventListener('click', function () {
      UI.handlers.onBackToMenu();
    });
    q('#btn-pause').addEventListener('click', function () {
      UI.handlers.onPause();
    });
    q('#btn-ability').addEventListener('click', function () {
      UI.handlers.onAbility();
    });
  };

  UI.show = function (id) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === 'screen-' + id);
    });
    UI.screen = id;
  };

  UI.hideScreens = function () {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    UI.screen = null;
  };

  UI.showHud = function (visible) {
    q('#hud').classList.toggle('hidden', !visible);
  };

  UI.toast = function (text, color) {
    const wrap = q('#toasts');
    const node = make('div', 'toast', text);
    if (color) node.style.borderColor = color;
    wrap.appendChild(node);
    setTimeout(function () {
      node.classList.add('fade');
      setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      }, 420);
    }, 1500);
  };

  UI.renderMenu = function () {
    const s = SF.Save.statsView();
    const shards = SF.Save.data.shards;
    const meta = q('#menu-meta');
    clear(meta);
    const items = [
      ['SHARDS', U.fmt(shards)],
      ['BEST LEVEL', String(s.bestLevel)],
      ['RUNS', String(s.runs)],
      ['KILLS', U.fmt(s.totalKills)],
      ['BOSSES', String(s.bossesKilled)]
    ];
    items.forEach(function (it) {
      const span = make('span');
      span.appendChild(make('b', null, it[1]));
      span.appendChild(document.createTextNode(' ' + it[0]));
      meta.appendChild(span);
    });
    UI.show('menu');
  };

  UI.renderSetup = function () {
    const last = SF.Save.data.lastSetup || {};
    UI.setup.character = SF.Save.characterUnlocked(last.character) ? last.character : 'rook';
    UI.setup.challenge = last.challenge || 'normal';
    UI.setup.modifiers = (last.modifiers || []).slice();
    q('#setup-shards').textContent = U.fmt(SF.Save.data.shards);
    UI.paintSetup();
    UI.show('setup');
  };

  UI.paintSetup = function () {
    const charWrap = q('#setup-characters');
    clear(charWrap);
    Object.keys(D.CHARACTERS).forEach(function (id) {
      const def = D.CHARACTERS[id];
      const unlocked = SF.Save.characterUnlocked(id);
      const card = make('button', 'char-card' + (UI.setup.character === id ? ' selected' : '') + (unlocked ? '' : ' locked'));
      const top = make('div', 'char-top');
      const avatar = make('div', 'char-avatar', def.name.charAt(0));
      avatar.style.background = def.color;
      const nameWrap = make('div');
      nameWrap.appendChild(make('div', 'char-name', def.name));
      nameWrap.appendChild(make('div', 'char-title', def.title));
      top.appendChild(avatar);
      top.appendChild(nameWrap);
      card.appendChild(top);
      card.appendChild(make('div', 'char-line', 'Weapon: ' + D.WEAPONS[def.weapon].name));
      card.appendChild(make('div', 'char-line', 'Passive: ' + def.passive.name + ' \u2014 ' + def.passive.desc));
      card.appendChild(make('div', 'char-line', 'Active: ' + def.active.name + ' \u2014 ' + def.active.desc));
      if (!unlocked) card.appendChild(make('div', 'lock-req', 'LOCKED: ' + def.unlock.desc));
      card.addEventListener('click', function () {
        if (!unlocked) {
          UI.toast('Locked \u2014 ' + def.unlock.desc, '#ff5c6c');
          return;
        }
        UI.setup.character = id;
        SF.Audio.play('ui');
        UI.paintSetup();
      });
      charWrap.appendChild(card);
    });

    const chalWrap = q('#setup-challenges');
    clear(chalWrap);
    D.CHALLENGES.forEach(function (c) {
      const pill = make('button', 'pill' + (UI.setup.challenge === c.id ? ' active' : ''), c.name);
      pill.title = c.desc;
      pill.addEventListener('click', function () {
        UI.setup.challenge = c.id;
        SF.Audio.play('ui');
        UI.paintSetup();
      });
      chalWrap.appendChild(pill);
    });

    const modWrap = q('#setup-modifiers');
    clear(modWrap);
    D.MODIFIERS.forEach(function (m) {
      const active = UI.setup.modifiers.indexOf(m.id) >= 0;
      const node = make('div', 'mod' + (active ? ' active' : ''));
      node.appendChild(make('div', 'mod-check', active ? '\u2713' : ''));
      const body = make('div');
      body.appendChild(make('div', 'mod-name', m.name));
      body.appendChild(make('div', 'mod-desc', m.desc));
      node.appendChild(body);
      node.addEventListener('click', function () {
        const idx = UI.setup.modifiers.indexOf(m.id);
        if (idx >= 0) UI.setup.modifiers.splice(idx, 1);
        else UI.setup.modifiers.push(m.id);
        SF.Audio.play('ui');
        UI.paintSetup();
      });
      modWrap.appendChild(node);
    });

    const def = D.CHARACTERS[UI.setup.character];
    const challenge = D.CHALLENGES.find(function (c) { return c.id === UI.setup.challenge; }) || D.CHALLENGES[0];
    const modMul = UI.setup.modifiers.reduce(function (acc, id) {
      const m = D.MODIFIERS.find(function (x) { return x.id === id; });
      return acc * (m ? m.shards : 1);
    }, 1);
    const shardMul = (challenge.shards * modMul).toFixed(2);
    const summary = q('#setup-summary');
    clear(summary);
    summary.appendChild(make('h3', null, 'Run Preview'));
    const lines = [
      ['Runner', def.name + ' \u2014 ' + def.title],
      ['Weapon', D.WEAPONS[def.weapon].name + ' (' + D.WEAPONS[def.weapon].cat + ')'],
      ['Armour', D.ARMOURS[def.armour].name],
      ['Passive', def.passive.name],
      ['Ability', def.active.name + ' \u2014 ' + def.active.cd + 's cooldown'],
      ['Difficulty', challenge.name + ' \u2014 enemy hp x' + challenge.hp + ', damage x' + challenge.dmg],
      ['Modifiers', UI.setup.modifiers.length ? UI.setup.modifiers.map(function (id) {
        const m = D.MODIFIERS.find(function (x) { return x.id === id; });
        return m ? m.name : id;
      }).join(', ') : 'None'],
      ['Shard multiplier', 'x' + shardMul]
    ];
    lines.forEach(function (l) {
      const row = make('div', 'build-row');
      row.appendChild(make('span', null, l[0]));
      row.appendChild(make('span', null, l[1]));
      summary.appendChild(row);
    });
  };

  UI.renderHUD = function (run) {
    const s = run.stats;
    const p = run.player;
    const cache = UI.hudCache;

    const levelText = 'LEVEL ' + run.level;
    if (cache.level !== levelText) {
      q('#hud-level').textContent = levelText;
      cache.level = levelText;
    }
    const biomeText = run.biome.name + (run.isBossLevel ? ' \u00B7 BOSS' : '');
    if (cache.biome !== biomeText) {
      q('#hud-biome').textContent = biomeText;
      q('#hud-biome').style.color = run.biome.accent;
      cache.biome = biomeText;
    }

    const hpFrac = U.clamp(p.hp / s.maxHp, 0, 1);
    q('#hud-hp-fill').style.transform = 'scaleX(' + hpFrac + ')';
    const hpText = Math.ceil(p.hp) + ' / ' + Math.round(s.maxHp);
    if (cache.hpText !== hpText) {
      q('#hud-hp-text').textContent = hpText;
      cache.hpText = hpText;
    }
    const shieldWrap = q('#hud-shield-wrap');
    if (s.shield > 0) {
      shieldWrap.classList.remove('hidden');
      q('#hud-shield-fill').style.transform = 'scaleX(' + U.clamp(p.shield / s.shield, 0, 1) + ')';
    } else {
      shieldWrap.classList.add('hidden');
    }

    const goldText = U.fmt(run.gold);
    if (cache.gold !== goldText) {
      q('#hud-gold').textContent = goldText;
      cache.gold = goldText;
    }

    const def = run.defOf(run.weapon);
    const wname = def.name + (run.weapon.evolved ? ' \u2726' : '');
    if (cache.wname !== wname) {
      q('#hud-weapon-name').textContent = wname;
      q('#hud-weapon-icon').textContent = def.icon || '\u2694';
      cache.wname = wname;
    }
    const sub = def.cat + ' \u00B7 Lv ' + run.weapon.level + ' \u00B7 ' + rarityName(run.weapon.rarity);
    if (cache.wsub !== sub) {
      q('#hud-weapon-sub').textContent = sub;
      q('#hud-weapon-sub').style.color = rarityColor(run.weapon.rarity);
      cache.wsub = sub;
    }
    const pips = q('#hud-weapon-pips');
    if (cache.wlevel !== run.weapon.level + ':' + (run.weapon.evolved ? 1 : 0)) {
      clear(pips);
      for (let i = 0; i < 5; i++) {
        pips.appendChild(make('div', 'pip' + (i < run.weapon.level ? ' on' : '')));
      }
      cache.wlevel = run.weapon.level + ':' + (run.weapon.evolved ? 1 : 0);
    }

    const ability = run.character.active;
    const cdFrac = p.abilityCd > 0 ? p.abilityCd / (ability.cd * (1 - s.cdReduce)) : 0;
    const btn = q('#btn-ability');
    if (p.abilityCd > 0) {
      btn.classList.remove('ready');
      q('#ability-cd').textContent = p.abilityCd.toFixed(1);
      q('#ability-cd').style.display = '';
    } else {
      btn.classList.add('ready');
      q('#ability-cd').style.display = 'none';
    }
    if (cache.ability !== ability.name) {
      q('#ability-name').textContent = ability.name;
      q('#ability-icon').textContent = run.character.id === 'vex' ? '\u25C6' : run.character.id === 'cinder' ? '\u25B2' : run.character.id === 'mara' ? '\u25CE' : '\u2726';
      cache.ability = ability.name;
    }

    const boss = run.bossActive;
    const bossBar = q('#boss-bar');
    if (boss && !boss.dead) {
      bossBar.classList.remove('hidden');
      const frac = U.clamp(boss.hp / boss.maxHp, 0, 1);
      q('#boss-fill').style.width = (frac * 100) + '%';
      if (cache.bossName !== boss.def.name) {
        q('#boss-name').textContent = boss.def.name.toUpperCase() + ' \u2014 ' + boss.def.title;
        cache.bossName = boss.def.name;
      }
      const phaseText = 'PHASE ' + boss.boss.phase + ' / ' + boss.boss.phases;
      if (cache.bossPhase !== phaseText) {
        q('#boss-phase').textContent = phaseText;
        cache.bossPhase = phaseText;
      }
    } else {
      bossBar.classList.add('hidden');
      cache.bossName = null;
    }

    const statuses = [];
    if (p.slowT > 0) statuses.push(['SLOWED', '#d8b0ff']);
    if (p.weakT > 0) statuses.push(['WEAKENED', '#ff9b9b']);
    if (p.poisonT > 0 && p.poisonStacks > 0) statuses.push(['POISON x' + p.poisonStacks, '#9dff6b']);
    if (p.adrenT > 0) statuses.push(['ADRENALINE', '#ffd166']);
    if (p.wardT > 0) statuses.push(['WARDED', '#8fd0ff']);
    if (p.focusT > 0) statuses.push(['FOCUS', '#5fb7ff']);
    const statusKey = statuses.map(function (x) { return x[0]; }).join(',');
    if (cache.status !== statusKey) {
      const row = q('#hud-status');
      clear(row);
      statuses.forEach(function (st) {
        const chip = make('span', 'status-chip', st[0]);
        chip.style.color = st[1];
        row.appendChild(chip);
      });
      cache.status = statusKey;
    }

    const consKey = JSON.stringify(run.consumables);
    if (cache.cons !== consKey) {
      const wrap = q('#consumables');
      clear(wrap);
      const ids = Object.keys(run.consumables);
      ids.forEach(function (id, index) {
        const cdef = D.CONSUMABLES[id];
        const btn2 = make('button', 'consumable');
        btn2.title = cdef.name + ' \u2014 ' + cdef.desc;
        btn2.appendChild(make('span', null, cdef.icon));
        btn2.appendChild(make('span', 'count', String(run.consumables[id])));
        btn2.appendChild(make('span', 'key', String(index + 1)));
        btn2.addEventListener('click', function () {
          UI.handlers.onConsumable(id);
        });
        wrap.appendChild(btn2);
      });
      const touchWrap = q('#touch-consumables');
      clear(touchWrap);
      ids.forEach(function (id) {
        const cdef = D.CONSUMABLES[id];
        const b = make('button', 'touch-btn small', cdef.icon);
        b.addEventListener('click', function () {
          UI.handlers.onConsumable(id);
        });
        touchWrap.appendChild(b);
      });
      cache.cons = consKey;
    }

    const hint = run.isBossLevel ? 'BOSS LEVEL \u2014 survive the fight' : 'Enemies remaining: ' + Math.max(0, run.pendingSpawns + run.enemies.length);
    if (cache.hint !== hint) {
      q('#hud-hint').textContent = hint;
      cache.hint = hint;
    }
  };

  function cardInfo(run, card) {
    const out = { icon: '\u2726', kind: 'Reward', name: 'Reward', desc: '', tag: '', color: '#4fd6ff' };
    if (!card) return out;
    if (card.type === 'weapon') {
      const def = D.WEAPONS[card.id];
      out.icon = def.icon;
      out.kind = 'Weapon \u00B7 ' + rarityName(card.rarity);
      out.name = def.name;
      out.desc = def.desc + ' ' + def.strength + ' Weakness: ' + def.weakness;
      const dmg = run.weaponDamage({ id: card.id, level: 1, rarity: card.rarity || 'common', evolved: false });
      out.tag = def.cat + ' \u00B7 ' + Math.round(dmg) + ' dmg \u00B7 ' + def.interval.toFixed(2) + 's';
      out.color = rarityColor(card.rarity);
    } else if (card.type === 'armour') {
      const def = D.ARMOURS[card.id];
      const fake = run.makeArmour(card.id, card.rarity || 'common');
      out.icon = def.icon;
      out.kind = 'Armour \u00B7 ' + rarityName(card.rarity);
      out.name = def.name;
      out.desc = def.desc + ' ' + (def.passiveText || '');
      const bits = [];
      if (fake.stats.maxHp) bits.push('+' + fake.stats.maxHp + ' HP');
      if (fake.stats.dr) bits.push('+' + pct(fake.stats.dr) + ' DR');
      if (fake.stats.speed) bits.push((fake.stats.speed > 0 ? '+' : '') + pct(fake.stats.speed) + ' speed');
      if (fake.stats.shield) bits.push('+' + fake.stats.shield + ' shield');
      (fake.affixes || []).forEach(function (a) { bits.push(a.text); });
      out.tag = bits.join(' \u00B7 ');
      out.color = rarityColor(card.rarity);
    } else if (card.type === 'passive') {
      const def = D.PASSIVES[card.id];
      const stack = (run.passives[card.id] || 0) + 1;
      out.icon = def.icon;
      out.kind = 'Upgrade \u00B7 Stack ' + stack + '/' + def.max;
      out.name = def.name;
      out.desc = def.desc + (stack > 1 ? ' \u2014 stacked effect: ' + def.text(stack) : '');
      out.tag = 'Passive ability';
      out.color = '#5ee38f';
    } else if (card.type === 'upgrade') {
      const def = run.defOf(run.weapon);
      out.icon = '\u2191';
      out.kind = 'Weapon Upgrade';
      out.name = def.name + ' \u2192 Lv ' + Math.min(5, run.weapon.level + 1);
      out.desc = 'Increase base damage by 20%. At level 5 the weapon can evolve.';
      out.tag = 'Current weapon';
      out.color = '#54a9ff';
    } else if (card.type === 'relic') {
      const def = D.RELICS[card.id];
      out.icon = def.icon;
      out.kind = 'Relic';
      out.name = def.name;
      out.desc = def.desc;
      out.tag = 'Unique passive';
      out.color = '#ffb347';
    } else if (card.type === 'consumable') {
      const def = D.CONSUMABLES[card.id];
      out.icon = def.icon;
      out.kind = 'Consumable';
      out.name = def.name;
      out.desc = def.desc;
      out.tag = 'Use in combat';
      out.color = '#7dffb0';
    } else if (card.type === 'gold') {
      out.icon = '\u25CF';
      out.kind = 'Currency';
      out.name = U.fmt(card.amount) + ' Gold';
      out.desc = 'Spend gold in the market between levels.';
      out.color = '#ffd166';
    } else if (card.type === 'heal') {
      out.icon = '\u271A';
      out.kind = 'Recovery';
      out.name = 'Field Repairs';
      out.desc = 'Instantly restore ' + Math.round(card.amount) + ' health.';
      out.color = '#5ee38f';
    } else if (card.type === 'evolve') {
      const evo = D.EVOLUTIONS[card.id];
      out.icon = '\u2726';
      out.kind = 'Weapon Evolution';
      out.name = evo.name;
      out.desc = evo.desc;
      out.tag = evo.strength;
      out.color = '#ffb347';
      out.guaranteed = true;
    }
    return out;
  }

  UI.cardInfo = cardInfo;

  UI.renderReward = function (run, cards, onPick) {
    const wrap = q('#reward-cards');
    clear(wrap);
    q('#reward-title').textContent = 'LEVEL ' + run.level + ' CLEARED';
    q('#reward-sub').textContent = 'Choose one reward \u00B7 ' + run.biome.name;
    const skipGold = Math.round(45 + run.level * 12);
    q('#btn-skip-reward').textContent = 'Skip \u2014 take ' + skipGold + ' gold instead';
    q('#btn-skip-reward').onclick = function () {
      UI.handlers.onSkipReward(skipGold);
    };
    cards.forEach(function (card) {
      const info = cardInfo(run, card);
      const node = make('button', 'reward-card' + (info.guaranteed ? ' guaranteed' : ''));
      node.style.setProperty('--rarity', info.color);
      const icon = make('div', 'reward-icon', info.icon);
      icon.style.color = info.color;
      node.appendChild(icon);
      const kind = make('div', 'reward-kind', info.kind);
      kind.style.color = info.color;
      node.appendChild(kind);
      node.appendChild(make('div', 'reward-name', info.name));
      node.appendChild(make('div', 'reward-desc', info.desc));
      node.appendChild(make('div', 'reward-tag', info.tag));
      node.addEventListener('click', function () {
        SF.Audio.play('uiBig');
        onPick(card);
      });
      wrap.appendChild(node);
    });
    UI.show('reward');
  };

  function itemRow(opts) {
    const row = make('button', 'item-row' + (opts.equipped ? ' equipped' : '') + (opts.locked ? ' locked' : ''));
    const icon = make('span', 'item-icon', opts.icon || '\u2726');
    if (opts.color) icon.style.color = opts.color;
    row.appendChild(icon);
    const main = make('div', 'item-main');
    main.appendChild(make('div', 'item-name', opts.name));
    main.appendChild(make('div', 'item-sub', opts.sub || ''));
    row.appendChild(main);
    if (opts.badge) row.appendChild(make('span', 'item-badge', opts.badge));
    if (opts.onClick) {
      row.addEventListener('click', opts.onClick);
    } else {
      row.disabled = true;
    }
    return row;
  }

  UI.renderHub = function (run, offers) {
    const st = run.stats;
    q('#hub-title').textContent = 'LEVEL ' + run.level + ' CLEARED';
    q('#hub-sub').textContent = run.biome.name + ' \u00B7 prepare for level ' + (run.level + 1) + (run.nextLevelHasBoss ? ' (BOSS)' : '');

    const hubStats = q('#hub-stats');
    clear(hubStats);
    const statsBits = [
      ['HP', Math.ceil(run.player.hp) + '/' + st.maxHp],
      ['DR', pct(st.dr)],
      ['DMG', 'x' + st.dmg.toFixed(2)],
      ['ATK SPD', 'x' + st.fireRate.toFixed(2)],
      ['CRIT', pct(st.crit) + '/' + st.critMult.toFixed(2) + 'x'],
      ['GOLD', U.fmt(run.gold)]
    ];
    statsBits.forEach(function (b) {
      const span = make('span');
      span.appendChild(make('b', null, b[1]));
      span.appendChild(document.createTextNode(' ' + b[0]));
      hubStats.appendChild(span);
    });

    const weaponWrap = q('#hub-weapons');
    clear(weaponWrap);
    run.ownedWeapons.forEach(function (item, index) {
      const def = run.defOf(item);
      const dmg = run.weaponDamage(item);
      const dps = Math.round(dmg / (def.interval / st.fireRate) * ((def.pellets || 1) + st.extraProj));
      weaponWrap.appendChild(itemRow({
        icon: def.icon,
        color: rarityColor(item.rarity),
        name: def.name + (item.evolved ? ' \u2726' : ''),
        sub: def.cat + ' \u00B7 Lv ' + item.level + ' \u00B7 ' + rarityName(item.rarity) + ' \u00B7 ~' + dps + ' dps',
        equipped: index === run.weaponIndex,
        badge: index === run.weaponIndex ? 'EQUIPPED' : 'EQUIP',
        onClick: function () {
          run.equipWeapon(index);
          UI.handlers.onRefreshHub();
        }
      }));
    });

    const armourWrap = q('#hub-armours');
    clear(armourWrap);
    run.ownedArmours.forEach(function (item, index) {
      const def = D.ARMOURS[item.id];
      const bits = [];
      if (item.stats.maxHp) bits.push('+' + item.stats.maxHp + ' HP');
      if (item.stats.dr) bits.push('+' + pct(item.stats.dr) + ' DR');
      if (item.stats.speed) bits.push((item.stats.speed > 0 ? '+' : '') + pct(item.stats.speed) + ' spd');
      if (item.stats.shield) bits.push('+' + item.stats.shield + ' shield');
      armourWrap.appendChild(itemRow({
        icon: def.icon,
        color: rarityColor(item.rarity),
        name: def.name,
        sub: rarityName(item.rarity) + ' \u00B7 ' + bits.join(', '),
        equipped: index === run.armourIndex,
        badge: index === run.armourIndex ? 'WORN' : 'WEAR',
        onClick: function () {
          run.equipArmour(index);
          UI.handlers.onRefreshHub();
        }
      }));
    });

    const buildWrap = q('#hub-build');
    clear(buildWrap);
    const buildRows = [];
    buildRows.push(['Weapon', run.defOf(run.weapon).name + ' Lv' + run.weapon.level + (run.weapon.evolved ? ' (evolved)' : '')]);
    buildRows.push(['Armour', D.ARMOURS[run.armour.id].name]);
    const evo = D.EVOLUTIONS[run.weapon.id];
    if (evo && !run.weapon.evolved) buildRows.push(['Evolution', run.evolutionRequirementText()]);
    const passives = Object.keys(run.passives);
    if (passives.length) {
      buildRows.push(['Passives', passives.map(function (id) {
        return D.PASSIVES[id].name + ' x' + run.passives[id];
      }).join(', ')]);
    }
    if (run.relics.length) {
      buildRows.push(['Relics', run.relics.map(function (id) { return D.RELICS[id].name; }).join(', ')]);
    }
    const cons = Object.keys(run.consumables);
    if (cons.length) {
      buildRows.push(['Items', cons.map(function (id) { return D.CONSUMABLES[id].name + ' x' + run.consumables[id]; }).join(', ')]);
    }
    buildRows.push(['Damage reduction', pct(st.dr) + (st.dodge ? ' \u00B7 ' + pct(st.dodge) + ' dodge' : '')]);
    buildRows.push(['Lifesteal', pct(st.lifesteal, 1)]);
    buildRows.push(['Regen', st.regen.toFixed(1) + '/s']);
    buildRows.push(['Pickup radius', Math.round(st.pickup)]);
    buildRows.forEach(function (b) {
      const row = make('div', 'build-row');
      row.appendChild(make('span', null, b[0]));
      row.appendChild(make('span', null, b[1]));
      buildWrap.appendChild(row);
    });

    const shopWrap = q('#hub-shop');
    clear(shopWrap);
    if (!offers.length) shopWrap.appendChild(make('div', 'muted small', 'Sold out.'));
    offers.forEach(function (offer) {
      const info = cardInfo(run, offer);
      const row = make('div', 'shop-row' + (offer.sold ? ' sold' : ''));
      row.appendChild(make('span', 'item-icon', info.icon));
      const main = make('div', 'item-main');
      main.appendChild(make('div', 'item-name', info.name));
      main.appendChild(make('div', 'item-sub', info.kind + (info.tag ? ' \u00B7 ' + info.tag : '')));
      row.appendChild(main);
      const btn = make('button', 'btn small shop-buy');
      btn.appendChild(make('span', 'shop-price', U.fmt(offer.price)));
      btn.disabled = offer.sold || run.gold < offer.price;
      btn.addEventListener('click', function () {
        UI.handlers.onBuyOffer(offer);
      });
      if (offer.sold) btn.textContent = 'SOLD';
      row.appendChild(btn);
      shopWrap.appendChild(row);
    });

    const healBtn = q('#btn-buy-heal');
    const healCost = run.healCost();
    healBtn.textContent = 'Heal 50% \u2014 ' + U.fmt(healCost) + 'g';
    healBtn.disabled = run.gold < healCost || run.player.hp >= st.maxHp;
    const upBtn = q('#btn-buy-upgrade');
    const upCost = run.upgradeCost(run.weapon);
    upBtn.textContent = run.weapon.level >= 5 ? 'Weapon at max level' : 'Upgrade to Lv ' + (run.weapon.level + 1) + ' \u2014 ' + U.fmt(upCost) + 'g';
    upBtn.disabled = run.weapon.level >= 5 || run.gold < upCost;

    const nextInfo = q('#hub-next');
    nextInfo.textContent = 'Level ' + (run.level + 1) + ' \u00B7 ' + (run.nextLevelHasBoss ? 'BOSS ENCOUNTER' : run.level + 1 === 3 || (run.level + 1) % 3 === 0 ? 'Elite presence' : 'Standard wave');
    UI.show('hub');
  };

  UI.renderEvent = function (event, onChoice) {
    q('#event-icon').textContent = event.icon;
    q('#event-name').textContent = event.name;
    q('#event-text').textContent = event.text;
    const choices = q('#event-choices');
    clear(choices);
    q('#event-result').classList.add('hidden');
    event.choices.forEach(function (c) {
      const btn = make('button', 'btn', c.label);
      btn.addEventListener('click', function () {
        SF.Audio.play('ui');
        onChoice(c.id);
      });
      choices.appendChild(btn);
    });
    UI.show('event');
  };

  UI.showEventResult = function (event, text, onContinue) {
    q('#event-text').textContent = event.text;
    const choices = q('#event-choices');
    clear(choices);
    const result = q('#event-result');
    result.classList.remove('hidden');
    result.textContent = text;
    const btn = make('button', 'btn primary', 'CONTINUE');
    btn.addEventListener('click', function () {
      SF.Audio.play('ui');
      onContinue();
    });
    choices.appendChild(btn);
  };

  UI.renderPause = function (run) {
    const grid = q('#pause-stats');
    clear(grid);
    const s = run.stats;
    const cells = [
      ['LEVEL', run.level],
      ['KILLS', run.runStats.kills],
      ['DAMAGE', U.fmt(run.runStats.damage)],
      ['TAKEN', U.fmt(run.runStats.damageTaken)],
      ['GOLD', U.fmt(run.gold)],
      ['HP', Math.ceil(run.player.hp) + '/' + s.maxHp]
    ];
    cells.forEach(function (c) {
      const cell = make('div', 'stat-cell');
      cell.appendChild(make('div', 'stat-label', c[0]));
      cell.appendChild(make('div', 'stat-value', String(c[1])));
      grid.appendChild(cell);
    });
    UI.show('pause');
  };

  UI.renderGameOver = function (summary, result) {
    q('#go-title').textContent = 'RUN ENDED';
    q('#go-sub').textContent = 'You fell on level ' + summary.level + ' \u00B7 ' + D.CHALLENGES.find(function (c) { return c.id === summary.challenge; }).name;
    const stats = q('#go-stats');
    clear(stats);
    stats.appendChild(make('h3', null, 'Run Statistics'));
    const grid = make('div', 'stat-grid');
    const cells = [
      ['LEVEL', summary.level],
      ['TIME', Math.floor(summary.time / 60) + 'm ' + Math.floor(summary.time % 60) + 's'],
      ['KILLS', summary.kills],
      ['ELITES', summary.elites],
      ['BOSSES', summary.bosses],
      ['DAMAGE', U.fmt(summary.damage)],
      ['TAKEN', U.fmt(summary.damageTaken)],
      ['HEALED', U.fmt(summary.healed)],
      ['EVOLUTIONS', summary.evolutions],
      ['WEAPON', summary.weapon]
    ];
    cells.forEach(function (c) {
      const cell = make('div', 'stat-cell');
      cell.appendChild(make('div', 'stat-label', c[0]));
      cell.appendChild(make('div', 'stat-value', String(c[1])));
      grid.appendChild(cell);
    });
    stats.appendChild(grid);

    const rewards = q('#go-rewards');
    clear(rewards);
    rewards.appendChild(make('h3', null, 'Run Rewards'));
    const shardRow = make('div', 'build-row');
    shardRow.appendChild(make('span', null, 'Shards earned'));
    const sv = make('span', null, '+' + U.fmt(result.shards));
    sv.style.color = '#ffb347';
    shardRow.appendChild(sv);
    rewards.appendChild(shardRow);
    const balRow = make('div', 'build-row');
    balRow.appendChild(make('span', null, 'Shard balance'));
    balRow.appendChild(make('span', null, U.fmt(SF.Save.data.shards)));
    rewards.appendChild(balRow);
    if (result.unlocks && result.unlocks.length) {
      rewards.appendChild(make('h4', null, 'New unlocks'));
      result.unlocks.forEach(function (u) {
        const name = u.kind === 'weapon' ? D.WEAPONS[u.id].name : D.ARMOURS[u.id].name;
        rewards.appendChild(make('div', 'build-row', (u.kind === 'weapon' ? 'Weapon' : 'Armour') + ': ' + name));
      });
    }
    if (result.achievements && result.achievements.length) {
      rewards.appendChild(make('h4', null, 'Achievements'));
      result.achievements.forEach(function (a) {
        const row = make('div', 'build-row');
        row.appendChild(make('span', null, a.name));
        row.appendChild(make('span', null, '+' + a.reward + ' shards'));
        rewards.appendChild(row);
      });
    }
    const best = SF.Save.statsView();
    const bestRow = make('div', 'build-row');
    bestRow.appendChild(make('span', null, 'Best level ever'));
    bestRow.appendChild(make('span', null, String(best.bestLevel)));
    rewards.appendChild(bestRow);
    UI.show('gameover');
  };

  UI.renderCodex = function () {
    q('#codex-shards').textContent = U.fmt(SF.Save.data.shards);
    const tabs = q('#codex-tabs');
    clear(tabs);
    const tabDefs = [
      ['weapons', 'Weapons'],
      ['armours', 'Armour'],
      ['relics', 'Relics'],
      ['enemies', 'Enemies'],
      ['bosses', 'Bosses'],
      ['upgrades', 'Permanent']
    ];
    tabDefs.forEach(function (t) {
      const btn = make('button', 'tab' + (UI.codexTab === t[0] ? ' active' : ''), t[1]);
      btn.addEventListener('click', function () {
        UI.codexTab = t[0];
        SF.Audio.play('ui');
        UI.renderCodex();
      });
      tabs.appendChild(btn);
    });
    const body = q('#codex-body');
    clear(body);
    if (UI.codexTab === 'weapons') {
      const group = make('div', 'codex-group');
      Object.keys(D.WEAPONS).forEach(function (id) {
        const def = D.WEAPONS[id];
        const owned = SF.Save.hasWeapon(id);
        const evo = D.EVOLUTIONS[id];
        const item = make('div', 'codex-item' + (owned ? '' : ' locked'));
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.name));
        nameRow.appendChild(make('span', 'codex-tag', def.cat));
        item.appendChild(nameRow);
        const statsRow = make('div', 'codex-stats');
        [['DMG', Math.round(def.dmg)], ['RATE', def.interval.toFixed(2) + 's'], ['ELEM', def.element || 'physical']].forEach(function (s) {
          const sp = make('span');
          sp.appendChild(make('b', null, String(s[1])));
          sp.appendChild(document.createTextNode(' ' + s[0]));
          statsRow.appendChild(sp);
        });
        item.appendChild(statsRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        item.appendChild(make('div', 'codex-desc', 'Strength: ' + def.strength + ' Weakness: ' + def.weakness));
        if (evo) {
          item.appendChild(make('div', 'codex-desc', 'Evolves into ' + evo.name + ': ' + evo.desc));
        }
        if (!owned) {
          const actions = make('div', 'codex-actions');
          const btn = make('button', 'btn small', 'UNLOCK \u2014 ' + SF.Save.weaponCost(id) + ' shards');
          btn.disabled = SF.Save.data.shards < SF.Save.weaponCost(id);
          btn.addEventListener('click', function () {
            const res = SF.Save.buyWeapon(id);
            if (res.ok) {
              SF.Audio.play('uiBig');
              UI.toast('Weapon unlocked: ' + def.name, '#5ee38f');
              UI.renderCodex();
            } else {
              UI.toast('Not enough shards', '#ff5c6c');
            }
          });
          actions.appendChild(btn);
          item.appendChild(actions);
        } else {
          item.appendChild(make('div', 'item-badge', 'UNLOCKED'));
        }
        group.appendChild(item);
      });
      body.appendChild(group);
    } else if (UI.codexTab === 'armours') {
      const group = make('div', 'codex-group');
      Object.keys(D.ARMOURS).forEach(function (id) {
        const def = D.ARMOURS[id];
        const owned = SF.Save.hasArmour(id);
        const item = make('div', 'codex-item' + (owned ? '' : ' locked'));
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.icon + ' ' + def.name));
        nameRow.appendChild(make('span', 'codex-tag', owned ? 'Owned' : 'Locked'));
        item.appendChild(nameRow);
        const statsRow = make('div', 'codex-stats');
        const bits = [];
        if (def.hp) bits.push(['HP', '+' + def.hp]);
        if (def.dr) bits.push(['DR', pct(def.dr)]);
        if (def.speed) bits.push(['SPD', (def.speed > 0 ? '+' : '') + pct(def.speed)]);
        if (def.shield) bits.push(['SHIELD', def.shield]);
        if (def.regen) bits.push(['REGEN', def.regen + '/s']);
        if (def.lifesteal) bits.push(['LIFESTEAL', pct(def.lifesteal)]);
        if (def.dodge) bits.push(['DODGE', pct(def.dodge)]);
        bits.forEach(function (s) {
          const sp = make('span');
          sp.appendChild(make('b', null, String(s[1])));
          sp.appendChild(document.createTextNode(' ' + s[0]));
          statsRow.appendChild(sp);
        });
        item.appendChild(statsRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        if (def.passiveText) item.appendChild(make('div', 'codex-desc', def.passiveText));
        if (!owned) {
          const actions = make('div', 'codex-actions');
          const btn = make('button', 'btn small', 'UNLOCK \u2014 ' + SF.Save.armourCost(id) + ' shards');
          btn.disabled = SF.Save.data.shards < SF.Save.armourCost(id);
          btn.addEventListener('click', function () {
            const res = SF.Save.buyArmour(id);
            if (res.ok) {
              SF.Audio.play('uiBig');
              UI.toast('Armour unlocked: ' + def.name, '#5ee38f');
              UI.renderCodex();
            } else {
              UI.toast('Not enough shards', '#ff5c6c');
            }
          });
          actions.appendChild(btn);
          item.appendChild(actions);
        }
        group.appendChild(item);
      });
      body.appendChild(group);
    } else if (UI.codexTab === 'relics') {
      const group = make('div', 'codex-group');
      Object.keys(D.RELICS).forEach(function (id) {
        const def = D.RELICS[id];
        const item = make('div', 'codex-item');
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.icon + ' ' + def.name));
        nameRow.appendChild(make('span', 'codex-tag', 'Relic'));
        item.appendChild(nameRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        group.appendChild(item);
      });
      Object.keys(D.CONSUMABLES).forEach(function (id) {
        const def = D.CONSUMABLES[id];
        const item = make('div', 'codex-item');
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.icon + ' ' + def.name));
        nameRow.appendChild(make('span', 'codex-tag', 'Consumable'));
        item.appendChild(nameRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        group.appendChild(item);
      });
      body.appendChild(group);
    } else if (UI.codexTab === 'enemies') {
      const group = make('div', 'codex-group');
      Object.keys(D.ENEMIES).forEach(function (id) {
        const def = D.ENEMIES[id];
        const item = make('div', 'codex-item');
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.name));
        nameRow.appendChild(make('span', 'codex-tag', 'Level ' + def.unlock + '+'));
        item.appendChild(nameRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        const statsRow = make('div', 'codex-stats');
        [['HP', def.hp], ['DMG', def.dmg], ['SPD', def.speed]].forEach(function (s) {
          const sp = make('span');
          sp.appendChild(make('b', null, String(s[1])));
          sp.appendChild(document.createTextNode(' ' + s[0]));
          statsRow.appendChild(sp);
        });
        if (def.resist) {
          const res = Object.keys(def.resist).map(function (k) { return k; }).join('/');
          const sp = make('span');
          sp.appendChild(make('b', null, res));
          sp.appendChild(document.createTextNode(' resist'));
          statsRow.appendChild(sp);
        }
        if (def.weak) {
          const wk = Object.keys(def.weak).map(function (k) { return k; }).join('/');
          const sp = make('span');
          sp.appendChild(make('b', null, wk));
          sp.appendChild(document.createTextNode(' weak'));
          statsRow.appendChild(sp);
        }
        item.appendChild(statsRow);
        group.appendChild(item);
      });
      body.appendChild(group);
    } else if (UI.codexTab === 'bosses') {
      const group = make('div', 'codex-group');
      Object.keys(D.BOSSES).forEach(function (id) {
        const def = D.BOSSES[id];
        const item = make('div', 'codex-item');
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.name));
        nameRow.appendChild(make('span', 'codex-tag', def.phases + ' phases'));
        item.appendChild(nameRow);
        item.appendChild(make('div', 'codex-desc', def.desc));
        const statsRow = make('div', 'codex-stats');
        [['HP', def.hp], ['DMG', Math.round(def.dmg || 0)], ['SPEED', def.speed]].forEach(function (s) {
          const sp = make('span');
          sp.appendChild(make('b', null, String(s[1])));
          sp.appendChild(document.createTextNode(' ' + s[0]));
          statsRow.appendChild(sp);
        });
        item.appendChild(statsRow);
        item.appendChild(make('div', 'codex-desc', 'Drops: ' + def.drops.map(function (d) {
          return D.WEAPONS[d] ? D.WEAPONS[d].name : D.ARMOURS[d] ? D.ARMOURS[d].name : D.RELICS[d] ? D.RELICS[d].name : d;
        }).join(', ')));
        group.appendChild(item);
      });
      body.appendChild(group);
    } else if (UI.codexTab === 'upgrades') {
      const group = make('div', 'codex-group');
      D.META_UPGRADES.forEach(function (def) {
        const rank = SF.Save.data.upgrades[def.id] || 0;
        const item = make('div', 'codex-item');
        const nameRow = make('div', 'codex-name');
        nameRow.appendChild(make('span', null, def.icon + ' ' + def.name));
        nameRow.appendChild(make('span', 'codex-tag', rank + '/' + def.max));
        item.appendChild(nameRow);
        item.appendChild(make('div', 'codex-desc', def.desc + ' per rank. Permanent, applies to every run.'));
        const actions = make('div', 'codex-actions');
        if (rank >= def.max) {
          actions.appendChild(make('span', 'item-badge', 'MAXED'));
        } else {
          const cost = def.cost(rank);
          const btn = make('button', 'btn small', 'UPGRADE \u2014 ' + cost + ' shards');
          btn.disabled = SF.Save.data.shards < cost;
          btn.addEventListener('click', function () {
            const res = SF.Save.buyUpgrade(def.id);
            if (res.ok) {
              SF.Audio.play('uiBig');
              UI.toast(def.name + ' upgraded', '#5ee38f');
              UI.renderCodex();
            } else {
              UI.toast('Not enough shards', '#ff5c6c');
            }
          });
          actions.appendChild(btn);
        }
        item.appendChild(actions);
        group.appendChild(item);
      });
      body.appendChild(group);
    }
    UI.show('codex');
  };

  UI.renderAchievements = function () {
    const body = q('#achievements-body');
    clear(body);
    const done = SF.Save.data.achievements;
    D.ACHIEVEMENTS.forEach(function (a) {
      const isDone = done.indexOf(a.id) >= 0;
      const item = make('div', 'achievement' + (isDone ? ' done' : ''));
      const row = make('div', 'ach-name');
      row.appendChild(make('span', null, a.name));
      row.appendChild(make('span', 'ach-reward', isDone ? 'CLAIMED' : '+' + a.reward));
      item.appendChild(row);
      item.appendChild(make('div', 'ach-desc', a.desc));
      body.appendChild(item);
    });
    const stats = SF.Save.statsView();
    const summary = make('div', 'panel');
    summary.style.gridColumn = '1 / -1';
    summary.appendChild(make('h3', null, 'Lifetime Statistics'));
    const grid = make('div', 'stat-grid');
    const cells = [
      ['TOTAL KILLS', U.fmt(stats.totalKills)],
      ['BOSSES', stats.bossesKilled],
      ['ELITES', stats.elitesKilled],
      ['BEST LEVEL', stats.bestLevel],
      ['TOTAL DAMAGE', U.fmt(stats.totalDamage)],
      ['RUNS', stats.runs],
      ['EVOLUTIONS', stats.evolutions],
      ['WEAPONS', stats.weaponsUnlocked + '/' + Object.keys(D.WEAPONS).length],
      ['ARMOUR', stats.armoursUnlocked + '/' + Object.keys(D.ARMOURS).length],
      ['NIGHTMARE BEST', stats.nightmareBest]
    ];
    cells.forEach(function (c) {
      const cell = make('div', 'stat-cell');
      cell.appendChild(make('div', 'stat-label', c[0]));
      cell.appendChild(make('div', 'stat-value', String(c[1])));
      grid.appendChild(cell);
    });
    summary.appendChild(grid);
    body.appendChild(summary);
    UI.show('achievements');
  };

  UI.renderHelp = function () {
    const body = q('#help-body');
    clear(body);
    const cards = [
      ['Goal', 'Survive endless waves. Each cleared level offers a reward; every 5th level is a boss. There is no final level \u2014 the goal is to push your best run.'],
      ['Desktop controls', '<span class="kbd">WASD</span> move \u00B7 <span class="kbd">Mouse</span> aim \u00B7 <span class="kbd">Left click</span> (hold) fire \u00B7 <span class="kbd">Space</span> dash \u00B7 <span class="kbd">E</span> ability \u00B7 <span class="kbd">1-6</span> items \u00B7 <span class="kbd">Esc</span> pause'],
      ['Mobile controls', 'Left thumbstick moves. FIRE auto-aims at the nearest enemy. Dash and ability buttons sit on the right, consumables above them.'],
      ['Build strategy', 'Weapon level caps at 5. To evolve a weapon you need level 5 plus two stacks of the matching elemental attunement (Fire, Ice, Lightning, Poison, Shadow). Evolutions change attack patterns entirely.'],
      ['Elements', 'Fire burns over time. Ice chills and slows. Lightning chains between enemies. Poison stacks. Shadow marks targets for extra critical damage. Enemies resist and fear different elements \u2014 check the Codex.'],
      ['Economy', 'Gold is per-run: earned from kills, elites, bosses and level clears, spent in the market between levels. Shards are permanent: earned at the end of every run, spent on unlocks and permanent upgrades.'],
      ['Tips', 'Dash gives brief invulnerability \u2014 use it to pass through attacks. Menders heal other enemies, so kill them first. Bombers detonate, so never let them reach you. Elites have coloured auras and modifiers; hovering later is safer.']
    ];
    cards.forEach(function (c) {
      const card = make('div', 'help-card');
      card.appendChild(make('h3', null, c[0]));
      const p = make('p');
      p.innerHTML = c[1];
      card.appendChild(p);
      body.appendChild(card);
    });
    UI.show('help');
  };

  UI.renderSettings = function () {
    const body = q('#settings-body');
    clear(body);
    const s = SF.Save.settings();
    function row(label, hint, control) {
      const wrap = make('div', 'setting-row');
      const lab = make('div', 'setting-label', label);
      if (hint) lab.appendChild(make('small', null, hint));
      wrap.appendChild(lab);
      wrap.appendChild(control);
      body.appendChild(wrap);
    }
    function slider(key, min, max, step, fmt) {
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = s[key];
      const out = make('span', 'small muted', fmt ? fmt(s[key]) : String(s[key]));
      input.addEventListener('input', function () {
        const v = parseFloat(input.value);
        out.textContent = fmt ? fmt(v) : String(v);
        UI.handlers.onSetting(key, v);
      });
      const holder = make('div');
      holder.style.display = 'flex';
      holder.style.alignItems = 'center';
      holder.style.gap = '0.6rem';
      holder.appendChild(input);
      holder.appendChild(out);
      return holder;
    }
    function toggle(key) {
      const btn = make('button', 'switch' + (s[key] ? ' on' : ''));
      btn.addEventListener('click', function () {
        const next = !SF.Save.settings()[key];
        btn.classList.toggle('on', next);
        UI.handlers.onSetting(key, next);
      });
      return btn;
    }
    row('Master volume', 'All game audio', slider('master', 0, 1, 0.05, function (v) { return Math.round(v * 100) + '%'; }));
    row('Ambient music', 'Low pulsing background loop', toggle('music'));
    row('Screen shake', 'Impact feedback', toggle('shake'));
    row('Damage numbers', 'Floating combat text', toggle('numbers'));
    row('Aim assist', 'Snap aim toward the nearest enemy', toggle('aimAssist'));
    row('Effect density', 'Lower this on slower devices', slider('quality', 0.3, 1, 0.1, function (v) { return Math.round(v * 100) + '%'; }));
    const reset = make('button', 'btn small', 'RESET ALL PROGRESS');
    reset.addEventListener('click', function () {
      if (reset.dataset.confirm === '1') {
        SF.Save.reset();
        UI.toast('Progress reset', '#ff5c6c');
        UI.handlers.onBackToMenu();
      } else {
        reset.dataset.confirm = '1';
        reset.textContent = 'TAP AGAIN TO CONFIRM';
        setTimeout(function () {
          reset.dataset.confirm = '0';
          reset.textContent = 'RESET ALL PROGRESS';
        }, 4000);
      }
    });
    row('Danger zone', 'Wipes shards, unlocks and stats', reset);
    UI.show('settings');
  };

  SF.UI = UI;
})();
