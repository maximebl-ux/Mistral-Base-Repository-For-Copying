(function () {
  const SF = window.SF;
  const U = SF.U;
  const D = SF.DATA;

  const Game = {
    run: null,
    state: 'menu',
    playing: false,
    pendingCards: null,
    hubOffers: null,
    pendingEvent: null,
    lastSetup: { character: 'rook', challenge: 'normal', modifiers: [] },
    isTouch: false,
    lastFrame: 0,
    accum: 0,
    mouseSeen: false,
    mouse: { x: 0, y: 0 },
    keys: {},
    firing: false,
    joystick: { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 }
  };

  SF.Game = Game;

  function $(id) {
    return document.getElementById(id);
  }

  function resetHudCache() {
    SF.UI.hudCache = {};
  }

  function applySettings() {
    const s = SF.Save.settings();
    SF.Audio.setVolume(s.master, s.music ? s.master : 0);
    SF.Audio.setMusic(!!s.music);
    SF.Render.showNumbers = s.numbers !== false;
    SF.Render.reducedShake = s.shake === false;
    SF.Render.quality = typeof s.quality === 'number' ? s.quality : 1;
  }

  function startRun(setup) {
    const opts = setup || Game.lastSetup;
    Game.lastSetup = { character: opts.character, challenge: opts.challenge, modifiers: (opts.modifiers || []).slice() };
    SF.Save.data.lastSetup = {
      character: Game.lastSetup.character,
      challenge: Game.lastSetup.challenge,
      modifiers: Game.lastSetup.modifiers.slice()
    };
    SF.Save.write();
    SF.Audio.unlock();
    SF.Audio.play('uiBig');

    const run = new SF.Run({
      characterId: Game.lastSetup.character,
      challenge: Game.lastSetup.challenge,
      modifiers: Game.lastSetup.modifiers,
      meta: SF.Save.meta()
    });
    Game.run = run;
    Game.pendingCards = null;
    Game.hubOffers = null;
    Game.pendingEvent = null;
    Game.firing = false;

    run.on('sfx', function (name) {
      SF.Audio.play(name);
    });
    run.on('notice', function (d) {
      SF.UI.toast(d.text, d.color);
    });
    run.on('levelstart', function (d) {
      SF.UI.toast('LEVEL ' + d.level + ' \u00B7 ' + d.biome.name, d.biome.accent);
      resetHudCache();
    });
    run.on('levelclear', function () {
      onLevelClear();
    });
    run.on('death', function () {
      onDeath();
    });
    run.on('boss', function (d) {
      SF.UI.toast('BOSS: ' + d.name, '#ff5c6c');
    });
    run.on('bossphase', function (d) {
      SF.UI.toast(d.name + ' \u2014 PHASE ' + d.phase, '#ffb347');
    });
    run.on('bosskill', function (d) {
      SF.UI.toast(d.name + ' defeated', '#ffd166');
    });
    run.on('evolved', function (d) {
      SF.UI.toast('EVOLVED: ' + d.name, '#ffb347');
    });
    run.on('unlock', function (d) {
      const name = d.kind === 'weapon' ? D.WEAPONS[d.id].name : D.ARMOURS[d.id].name;
      SF.UI.toast('Unlocked: ' + name, '#5ee38f');
    });
    run.on('enrage', function () {
      SF.UI.toast('The horde grows relentless', '#ffb066');
    });

    Game.state = 'playing';
    Game.playing = true;
    SF.UI.hideScreens();
    SF.UI.showHud(true);
    resetHudCache();
    SF.UI.renderHUD(run);
  }

  function onLevelClear() {
    Game.playing = false;
    Game.state = 'reward';
    Game.pendingCards = Game.run.generateRewards(3);
    SF.UI.renderReward(Game.run, Game.pendingCards, pickReward);
  }

  function pickReward(card) {
    Game.run.applyReward(card);
    Game.pendingCards = null;
    openHub();
  }

  function openHub() {
    Game.run.gold = Math.round(Game.run.gold);
    Game.hubOffers = Game.run.generateShop();
    Game.state = 'hub';
    SF.UI.renderHub(Game.run, Game.hubOffers);
  }

  function descend() {
    if (!Game.run) return;
    const next = Game.run.level + 1;
    const wantsEvent = next % 3 === 0 && next % 5 !== 0 && Math.random() < 0.85;
    if (wantsEvent) {
      Game.pendingEvent = Game.run.generateEvent();
      Game.state = 'event';
      SF.UI.renderEvent(Game.pendingEvent, function (choiceId) {
        const res = Game.run.resolveEvent(Game.pendingEvent, choiceId);
        SF.UI.showEventResult(Game.pendingEvent, res.text, function () {
          Game.run.startNextLevel();
          Game.state = 'playing';
          Game.playing = true;
          SF.UI.hideScreens();
          SF.UI.showHud(true);
          resetHudCache();
        });
      });
      return;
    }
    Game.run.startNextLevel();
    Game.state = 'playing';
    Game.playing = true;
    SF.UI.hideScreens();
    SF.UI.showHud(true);
    resetHudCache();
  }

  function onDeath() {
    Game.playing = false;
    Game.state = 'gameover';
    const summary = Game.run.summary();
    const result = SF.Save.recordRun(summary, Game.run.challengeId, Game.run.modifierIds);
    SF.Save.data.lastSetup = {
      character: Game.lastSetup.character,
      challenge: Game.lastSetup.challenge,
      modifiers: Game.lastSetup.modifiers.slice()
    };
    SF.Save.write();
    SF.UI.showHud(false);
    SF.UI.renderGameOver(summary, result);
    document.exitPointerLock && document.exitPointerLock();
  }

  function pauseGame() {
    if (Game.state !== 'playing') return;
    Game.state = 'paused';
    Game.playing = false;
    Game.firing = false;
    SF.UI.renderPause(Game.run);
  }

  function resumeGame() {
    if (Game.state !== 'paused') return;
    Game.state = 'playing';
    Game.playing = true;
    SF.UI.hideScreens();
    SF.UI.showHud(true);
    resetHudCache();
  }

  function menu() {
    Game.state = 'menu';
    Game.playing = false;
    Game.run = null;
    SF.UI.showHud(false);
    SF.UI.renderMenu();
  }

  function screenToWorld(sx, sy) {
    const R = SF.Render;
    const zoom = R.zoom;
    return {
      x: R.camX + (sx - R.w / 2) / zoom,
      y: R.camY + (sy - R.h / 2) / zoom
    };
  }

  function syncInput(dt) {
    const run = Game.run;
    if (!run) return;
    let ax = 0;
    let ay = 0;
    if (Game.keys['a'] || Game.keys['arrowleft']) ax -= 1;
    if (Game.keys['d'] || Game.keys['arrowright']) ax += 1;
    if (Game.keys['w'] || Game.keys['arrowup']) ay -= 1;
    if (Game.keys['s'] || Game.keys['arrowdown']) ay += 1;
    if (Game.joystick.active) {
      ax = Game.joystick.x;
      ay = Game.joystick.y;
    }
    run.input.ax = ax;
    run.input.ay = ay;

    const settings = SF.Save.settings();
    const autoAim = Game.isTouch || (settings.aimAssist && !Game.mouseSeen);
    run.input.autoAim = autoAim;
    if (autoAim) {
      run.input.aimX = 0;
      run.input.aimY = 0;
    } else {
      const world = screenToWorld(Game.mouse.x, Game.mouse.y);
      let axx = world.x;
      let ayy = world.y;
      if (settings.aimAssist) {
        const target = run.nearestEnemy(run.player.x, run.player.y, 700);
        if (target) {
          const angleToMouse = Math.atan2(world.y - run.player.y, world.x - run.player.x);
          const angleToTarget = Math.atan2(target.y - run.player.y, target.x - run.player.x);
          if (Math.abs(U.angleDiff(angleToMouse, angleToTarget)) < 0.22) {
            axx = target.x;
            ayy = target.y;
          }
        }
      }
      run.input.aimX = axx;
      run.input.aimY = ayy;
    }
    run.input.fire = Game.firing;
  }

  function loop(ts) {
    const now = ts / 1000;
    let dt = Game.lastFrame ? now - Game.lastFrame : 0.016;
    Game.lastFrame = now;
    if (dt > 0.1) dt = 0.016;
    if (dt < 0) dt = 0;

    const run = Game.run;
    if (run) {
      if (Game.state === 'playing' && !document.hidden) {
        syncInput(dt);
        Game.accum += dt;
        let steps = 0;
        while (Game.accum > 1 / 120 && steps < 4) {
          run.update(1 / 120);
          Game.accum -= 1 / 120;
          steps++;
        }
        if (Game.state === 'playing') SF.UI.renderHUD(run);
      }
      SF.Render.draw(run, Game.state === 'playing' ? dt : Math.min(dt, 0.033));
    }
    requestAnimationFrame(loop);
  }

  function bindInput() {
    window.addEventListener('keydown', function (e) {
      const key = e.key.toLowerCase();
      if (key === 'escape' || key === 'p') {
        if (Game.state === 'playing') pauseGame();
        else if (Game.state === 'paused') resumeGame();
        e.preventDefault();
        return;
      }
      if (Game.state === 'playing') {
        if (key === ' ') {
          Game.run.input.dash = true;
          e.preventDefault();
        }
        if (key === 'e' || key === 'q') Game.run.input.ability = true;
        if (key === 'f') Game.firing = !Game.firing;
        const num = parseInt(key, 10);
        if (num >= 1 && num <= 9) {
          const ids = Object.keys(Game.run.consumables);
          const id = ids[num - 1];
          if (id) useConsumable(id);
        }
      }
      Game.keys[key] = true;
      if (key === ' ' || key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright') e.preventDefault();
    });
    window.addEventListener('keyup', function (e) {
      Game.keys[e.key.toLowerCase()] = false;
    });
    window.addEventListener('blur', function () {
      Game.keys = {};
      Game.firing = false;
      if (Game.state === 'playing') pauseGame();
    });

    const canvas = $('game');
    canvas.addEventListener('mousemove', function (e) {
      Game.mouse.x = e.clientX;
      Game.mouse.y = e.clientY;
      Game.mouseSeen = true;
    });
    canvas.addEventListener('mousedown', function (e) {
      if (e.button === 0) {
        Game.firing = true;
      } else if (e.button === 2) {
        if (Game.state === 'playing') Game.run.input.dash = true;
      }
    });
    window.addEventListener('mouseup', function (e) {
      if (e.button === 0) Game.firing = false;
    });
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    const fire = $('touch-fire');
    const dash = $('touch-dash');
    const ability = $('touch-ability');
    function pressStart(node, cb) {
      node.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        node.classList.add('active');
        cb(true);
      });
      node.addEventListener('pointerup', function (e) {
        e.preventDefault();
        node.classList.remove('active');
        cb(false);
      });
      node.addEventListener('pointercancel', function () {
        node.classList.remove('active');
        cb(false);
      });
      node.addEventListener('pointerleave', function () {
        node.classList.remove('active');
        cb(false);
      });
    }
    pressStart(fire, function (down) {
      Game.firing = down;
    });
    pressStart(dash, function (down) {
      if (down && Game.run && Game.state === 'playing') Game.run.input.dash = true;
    });
    pressStart(ability, function (down) {
      if (down && Game.run && Game.state === 'playing') Game.run.input.ability = true;
    });

    const stick = $('joystick');
    const knob = $('joystick-knob');
    function stickMove(e) {
      const rect = stick.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const max = rect.width / 2;
      const mag = Math.hypot(dx, dy);
      if (mag > max) {
        dx = (dx / mag) * max;
        dy = (dy / mag) * max;
      }
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      Game.joystick.x = dx / max;
      Game.joystick.y = dy / max;
      Game.joystick.active = true;
    }
    stick.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      stick.setPointerCapture(e.pointerId);
      Game.joystick.id = e.pointerId;
      stickMove(e);
    });
    stick.addEventListener('pointermove', function (e) {
      if (Game.joystick.id !== e.pointerId) return;
      stickMove(e);
    });
    function stickEnd(e) {
      if (Game.joystick.id !== null && e.pointerId !== Game.joystick.id) return;
      Game.joystick.id = null;
      Game.joystick.active = false;
      Game.joystick.x = 0;
      Game.joystick.y = 0;
      knob.style.transform = '';
    }
    stick.addEventListener('pointerup', stickEnd);
    stick.addEventListener('pointercancel', stickEnd);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && Game.state === 'playing') pauseGame();
    });
  }

  function useConsumable(id) {
    if (!Game.run) return;
    if (Game.state !== 'playing' && Game.state !== 'hub') return;
    if (Game.run.useConsumable(id)) {
      resetHudCache();
      if (Game.state === 'hub') openHub();
    }
  }

  function detectTouch() {
    Game.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const touchUi = $('touch-ui');
    if (Game.isTouch) touchUi.classList.remove('hidden');
    else touchUi.classList.add('hidden');
  }

  const handlers = {
    onPlay: function () {
      SF.Audio.unlock();
      SF.Audio.play('ui');
      detectTouch();
      SF.UI.renderSetup();
    },
    onStartRun: function (setup) {
      startRun(setup);
    },
    onCodex: function () {
      SF.Audio.play('ui');
      SF.UI.renderCodex();
    },
    onAchievements: function () {
      SF.Audio.play('ui');
      SF.UI.renderAchievements();
    },
    onHelp: function () {
      SF.Audio.play('ui');
      SF.UI.renderHelp();
    },
    onSettings: function (returnTo) {
      SF.Audio.play('ui');
      Game.settingsReturn = returnTo || 'menu';
      SF.UI.renderSettings();
    },
    onSettingsBack: function () {
      if (Game.settingsReturn === 'pause' && Game.run && Game.state === 'paused') {
        SF.UI.renderPause(Game.run);
      } else if (Game.state === 'gameover' && Game.run) {
        menu();
      } else {
        menu();
      }
    },
    onBackToMenu: function () {
      SF.Audio.play('ui');
      if (Game.state === 'playing' || Game.state === 'paused') {
        if (Game.run) {
          const summary = Game.run.summary();
          SF.Save.recordRun(summary, Game.run.challengeId, Game.run.modifierIds);
        }
      }
      menu();
    },
    onSkipReward: function (gold) {
      if (!Game.run) return;
      const amount = gold || Math.round(45 + Game.run.level * 12);
      Game.run.gold += Math.round(amount * Game.run.stats.gold);
      SF.Audio.play('coin');
      Game.pendingCards = null;
      openHub();
    },
    onBuyOffer: function (offer) {
      if (!Game.run) return;
      const ok = Game.run.buyOffer(offer);
      if (!ok) SF.UI.toast('Not enough gold', '#ff5c6c');
      openHub();
    },
    onBuyHeal: function () {
      if (!Game.run) return;
      const ok = Game.run.buyHeal();
      if (!ok) SF.UI.toast('Cannot heal right now', '#ff5c6c');
      openHub();
    },
    onBuyUpgrade: function () {
      if (!Game.run) return;
      const ok = Game.run.buyWeaponUpgrade();
      if (!ok) SF.UI.toast('Not enough gold or weapon maxed', '#ff5c6c');
      openHub();
    },
    onRefreshHub: function () {
      if (Game.run && Game.hubOffers) SF.UI.renderHub(Game.run, Game.hubOffers);
    },
    onDescend: function () {
      SF.Audio.play('uiBig');
      descend();
    },
    onPause: function () {
      pauseGame();
    },
    onResume: function () {
      resumeGame();
    },
    onAbandon: function () {
      if (Game.run) {
        const summary = Game.run.summary();
        SF.Save.recordRun(summary, Game.run.challengeId, Game.run.modifierIds);
      }
      menu();
    },
    onRetry: function () {
      startRun(Game.lastSetup);
    },
    onConsumable: function (id) {
      useConsumable(id);
    },
    onAbility: function () {
      if (Game.run && Game.state === 'playing') Game.run.input.ability = true;
    },
    onSetting: function (key, value) {
      SF.Save.setSetting(key, value);
      applySettings();
      if (key === 'aimAssist') Game.mouseSeen = false;
    }
  };

  function init() {
    SF.Save.load();
    SF.Render.init($('game'));
    detectTouch();
    SF.UI.init(handlers);
    applySettings();
    bindInput();
    SF.UI.renderMenu();
    requestAnimationFrame(function (ts) {
      Game.lastFrame = ts / 1000;
      requestAnimationFrame(loop);
    });
    window.addEventListener('resize', detectTouch);
    window.addEventListener('orientationchange', detectTouch);
    window.addEventListener('pointerdown', function once() {
      SF.Audio.unlock();
      window.removeEventListener('pointerdown', once);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
