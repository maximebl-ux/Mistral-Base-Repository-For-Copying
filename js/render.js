(function () {
  const SF = (window.SF = window.SF || {});
  const U = SF.U;
  const D = SF.DATA;

  const Render = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    dpr: 1,
    zoom: 1,
    camX: 0,
    camY: 0,
    time: 0,
    quality: 1,
    showNumbers: true,
    reducedShake: false,
    vignette: null
  };

  Render.init = function (canvas) {
    Render.canvas = canvas;
    Render.ctx = canvas.getContext('2d');
    Render.resize();
    window.addEventListener('resize', Render.resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', Render.resize);
  };

  Render.resize = function () {
    const canvas = Render.canvas;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    Render.dpr = Math.min(2, window.devicePixelRatio || 1);
    Render.w = w;
    Render.h = h;
    canvas.width = Math.floor(w * Render.dpr);
    canvas.height = Math.floor(h * Render.dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    Render.zoom = U.clamp(Math.max(w, h) / 1250, 0.62, 1.25);
  };


  const spriteCache = {};

  function makeSprite(w, h) {
    try {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      if (!g) return null;
      return { canvas: c, ctx: g };
    } catch (e) {
      return null;
    }
  }

  function glowSprite(biome) {
    const key = 'glow_' + biome.id;
    if (spriteCache[key] !== undefined) return spriteCache[key];
    const size = 160;
    const sprite = makeSprite(size, size);
    if (!sprite) {
      spriteCache[key] = null;
      return null;
    }
    const g = sprite.ctx;
    const grd = g.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,0.08)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.02)');
    grd.addColorStop(1, biome.fog);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    spriteCache[key] = sprite.canvas;
    return sprite.canvas;
  }

  function highlightSprite() {
    if (spriteCache.highlight !== undefined) return spriteCache.highlight;
    const size = 64;
    const sprite = makeSprite(size, size);
    if (!sprite) {
      spriteCache.highlight = null;
      return null;
    }
    const g = sprite.ctx;
    const grd = g.createRadialGradient(size * 0.36, size * 0.3, 1, size * 0.5, size * 0.5, size * 0.52);
    grd.addColorStop(0, 'rgba(255,255,255,0.85)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.22)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    spriteCache.highlight = sprite.canvas;
    return sprite.canvas;
  }

  function vignetteSprite() {
    if (spriteCache.vignette !== undefined) return spriteCache.vignette;
    const size = 256;
    const sprite = makeSprite(size, size);
    if (!sprite) {
      spriteCache.vignette = null;
      return null;
    }
    const g = sprite.ctx;
    const grd = g.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size * 0.52);
    grd.addColorStop(0, 'rgba(200,0,0,0)');
    grd.addColorStop(1, 'rgba(200,0,0,0.85)');
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    spriteCache.vignette = sprite.canvas;
    return sprite.canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  Render.draw = function (run, dt) {
    const ctx = Render.ctx;
    if (!ctx || !run) return;
    const w = Render.w;
    const h = Render.h;
    const zoom = Render.zoom;
    Render.time += dt;

    const p = run.player;
    let shakeX = 0;
    let shakeY = 0;
    if (run.shake > 0.2 && !Render.reducedShake) {
      shakeX = U.rand(-run.shake, run.shake) * 0.8;
      shakeY = U.rand(-run.shake, run.shake) * 0.8;
    }
    const halfW = w / 2 / zoom;
    const halfH = h / 2 / zoom;
    const arenaW = SF.Run.ARENA_W;
    const arenaH = SF.Run.ARENA_H;
    let cx = p.x;
    let cy = p.y;
    if (arenaW > halfW * 2) cx = U.clamp(cx, halfW, arenaW - halfW);
    else cx = arenaW / 2;
    if (arenaH > halfH * 2) cy = U.clamp(cy, halfH, arenaH - halfH);
    else cy = arenaH / 2;
    Render.camX = cx;
    Render.camY = cy;

    ctx.setTransform(Render.dpr, 0, 0, Render.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, run.biome.bg1);
    bg.addColorStop(1, run.biome.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    drawFloor(ctx, run, cx, cy, halfW, halfH);
    drawZones(ctx, run, true);
    drawPickups(ctx, run);
    drawEnemies(ctx, run);
    drawZones(ctx, run, false);
    drawBullets(ctx, run);
    drawSlashes(ctx, run);
    drawParticles(ctx, run);
    drawPlayer(ctx, run);
    drawBeams(ctx, run);
    drawRings(ctx, run);
    drawFloaters(ctx, run);

    ctx.restore();

    drawWorldBorder(ctx, run, zoom, cx, cy);
    drawScreenEffects(ctx, run, w, h);
  };

  function floorLayer(biome) {
    const key = 'floor_' + biome.id;
    if (spriteCache[key] !== undefined) return spriteCache[key];
    const W = SF.Run.ARENA_W;
    const H = SF.Run.ARENA_H;
    const sprite = makeSprite(W, H);
    if (!sprite) {
      spriteCache[key] = null;
      return null;
    }
    const g = sprite.ctx;
    g.fillStyle = biome.floor;
    g.fillRect(0, 0, W, H);

    const grid = 100;
    g.strokeStyle = biome.grid;
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= W; x += grid) {
      g.moveTo(x, 0);
      g.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += grid) {
      g.moveTo(0, y);
      g.lineTo(W, y);
    }
    g.stroke();

    g.globalAlpha = 0.075;
    g.fillStyle = biome.accent;
    g.strokeStyle = biome.accent;
    for (let gx = 0; gx < W; gx += grid) {
      for (let gy = 0; gy < H; gy += grid) {
        const seed = Math.abs(((gx / grid) * 73 + (gy / grid) * 151) % 17);
        const kind = Math.floor(seed) % 3;
        const jx = gx + ((seed * 37) % 70) + 15;
        const jy = gy + ((seed * 53) % 70) + 15;
        if (kind === 0) {
          g.fillRect(jx, jy, 3, 3);
        } else if (kind === 1) {
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(jx, jy);
          g.lineTo(jx + 22, jy + 14);
          g.stroke();
        } else {
          g.beginPath();
          g.arc(jx, jy, 6, 0, U.TAU);
          g.fill();
        }
      }
    }
    g.globalAlpha = 1;

    const grd = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, Math.max(W, H) * 0.62);
    grd.addColorStop(0, 'rgba(255,255,255,0.05)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.012)');
    grd.addColorStop(1, 'rgba(0,0,0,0.28)');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);

    g.strokeStyle = biome.accent;
    g.globalAlpha = 0.35;
    g.lineWidth = 6;
    g.strokeRect(3, 3, W - 6, H - 6);
    g.globalAlpha = 1;
    spriteCache[key] = sprite.canvas;
    const floorKeys = Object.keys(spriteCache).filter(function (k) { return k.indexOf('floor_') === 0; });
    if (floorKeys.length > 2) {
      for (let i = 0; i < floorKeys.length - 2; i++) delete spriteCache[floorKeys[i]];
    }
    return sprite.canvas;
  }

  function drawFloor(ctx, run, cx, cy, halfW, halfH) {
    const layer = floorLayer(run.biome);
    if (!layer) {
      ctx.fillStyle = run.biome.floor;
      ctx.fillRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2);
      ctx.strokeStyle = run.biome.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= SF.Run.ARENA_W; x += 100) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, SF.Run.ARENA_H);
      }
      for (let y = 0; y <= SF.Run.ARENA_H; y += 100) {
        ctx.moveTo(0, y);
        ctx.lineTo(SF.Run.ARENA_W, y);
      }
      ctx.stroke();
    } else {
      ctx.drawImage(layer, 0, 0);
    }
    for (let i = 0; i < run.zones.length; i++) {
      const z = run.zones[i];
      if (z.owner !== 'hazard') continue;
      drawHazard(ctx, z, run.biome);
    }
  }

  function drawHazard(ctx, z, biome) {
    const pulse = 0.5 + Math.sin(Render.time * 2 + z.x * 0.01) * 0.15;
    ctx.save();
    ctx.globalAlpha = 0.16 + pulse * 0.08;
    ctx.fillStyle = z.color;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, U.TAU);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, U.TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.25;
    for (let k = 0; k < 3; k++) {
      const r = z.r * (0.3 + 0.25 * k) + Math.sin(Render.time * 1.5 + k) * 6;
      ctx.beginPath();
      ctx.arc(z.x, z.y, r, 0, U.TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawZones(ctx, run, telegraphOnly) {
    for (let i = 0; i < run.zones.length; i++) {
      const z = run.zones[i];
      if (z.owner === 'hazard') continue;
      const isTelegraph = z.delay > 0 || !z.armed;
      if (isTelegraph !== telegraphOnly) continue;
      if (z.owner === 'player' && z.kind === 'riftburst') {
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#b07cff';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, U.TAU);
        ctx.fill();
        ctx.restore();
        continue;
      }
      if (isTelegraph) {
        const total = z.delay + 0.001;
        const prog = 1 - U.clamp(z.delay / 0.9, 0, 1);
        ctx.save();
        ctx.globalAlpha = 0.12 + prog * 0.16;
        ctx.fillStyle = z.color || '#ff7a5c';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = z.color || '#ff7a5c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, U.TAU);
        ctx.stroke();
        ctx.globalAlpha = 0.5 + prog * 0.4;
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r * prog, 0, U.TAU);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(Render.time * 5) * 0.05;
        ctx.fillStyle = z.color || '#8fff5c';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, U.TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawPickups(ctx, run) {
    for (let i = 0; i < run.pickups.length; i++) {
      const k = run.pickups[i];
      const bob = Math.sin(Render.time * 6 + k.x * 0.05) * 2;
      if (k.type === 'gold') {
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(k.x, k.y + bob, 4.5, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#fff2b8';
        ctx.beginPath();
        ctx.arc(k.x, k.y + bob, 8, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#5bffa0';
        ctx.fillRect(k.x - 6, k.y - 2 + bob, 12, 4);
        ctx.fillRect(k.x - 2, k.y - 6 + bob, 4, 12);
      }
    }
  }

  function drawEnemies(ctx, run) {
    for (let i = 0; i < run.enemies.length; i++) {
      const e = run.enemies[i];
      if (e.dead) continue;
      const def = e.def;
      const isElite = e.tier > 0;
      const hit = e.anim > 0 ? e.anim / 0.2 : 0;
      const chilled = e.statuses.chill && e.statuses.chill.until > run.time;
      const poisoned = e.statuses.poison && e.statuses.poison.until > run.time;
      const burning = e.statuses.burn && e.statuses.burn.until > run.time;
      const marked = e.statuses.mark && e.statuses.mark.until > run.time;

      ctx.save();
      ctx.translate(e.x, e.y);

      if (isElite || e.isBoss) {
        const pulse = 0.5 + Math.sin(Render.time * 4 + e.bob) * 0.2;
        ctx.globalAlpha = pulse * 0.5;
        ctx.strokeStyle = e.isBoss ? def.accent : (e.mods && e.mods[0] ? e.mods[0].color : '#ffd166');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 6, 0, U.TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (e.state === 'arming' || e.state === 'windup') {
        ctx.globalAlpha = 0.35 + Math.sin(Render.time * 20) * 0.2;
        ctx.fillStyle = '#ff5c5c';
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 12, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const body = chilled ? '#8fd8ff' : def.color;
      const accent = def.accent || '#333';
      const scale = 1 + hit * 0.1;
      ctx.scale(scale, scale);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, e.r * 0.7, e.r * 0.9, e.r * 0.4, 0, 0, U.TAU);
      ctx.fill();

      if (e.isBoss) {
        drawBossShape(ctx, e, body, accent);
      } else {
        drawEnemyShape(ctx, def.shape, e, body, accent);
      }

      const hi = highlightSprite();
      if (hi) {
        ctx.globalAlpha = 0.16;
        ctx.drawImage(hi, -e.r * 1.05, -e.r * 1.05, e.r * 2.1, e.r * 2.1);
        ctx.globalAlpha = 1;
      }

      if (e.shield > 0) {
        ctx.globalAlpha = 0.35 + (e.shield / Math.max(1, e.maxShield)) * 0.35;
        ctx.strokeStyle = '#9fd8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 5, 0, U.TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (burning) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff8a3c';
        for (let k = 0; k < 3; k++) {
          const a = Render.time * 6 + k * 2.1;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * e.r * 0.7, Math.sin(a) * e.r * 0.7 - 4, 3, 0, U.TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (poisoned) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#9dff6b';
        ctx.beginPath();
        ctx.arc(0, 0, e.r + 2, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (marked) {
        ctx.strokeStyle = '#b07cff';
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -e.r - 10);
        ctx.lineTo(0, -e.r - 18);
        ctx.lineTo(6, -e.r - 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      if (e.hp < e.maxHp && !e.isBoss) {
        const wBar = Math.max(28, e.r * 2.2);
        const pct = U.clamp(e.hp / e.maxHp, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - wBar / 2, e.y - e.r - 12, wBar, 4);
        ctx.fillStyle = isElite ? '#ffd166' : '#ff6b6b';
        ctx.fillRect(e.x - wBar / 2, e.y - e.r - 12, wBar * pct, 4);
        if (e.maxShield > 0 && e.shield > 0) {
          ctx.fillStyle = '#8fd0ff';
          ctx.fillRect(e.x - wBar / 2, e.y - e.r - 16, wBar * (e.shield / e.maxShield), 2);
        }
      }
    }
  }

  function drawEnemyShape(ctx, shape, e, body, accent) {
    const r = e.r;
    ctx.fillStyle = body;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    if (shape === 'spike') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * U.TAU + Math.PI / 6;
        const rr = i % 2 === 0 ? r : r * 0.62;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'block') {
      roundRect(ctx, -r, -r * 0.9, r * 2, r * 1.8, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-r * 0.6, -r * 0.2, r * 1.2, r * 0.35);
      ctx.globalAlpha = 1;
    } else if (shape === 'orb') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      const pulse = 0.5 + Math.sin(Render.time * 8) * 0.5;
      ctx.globalAlpha = pulse * 0.6;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (shape === 'ring') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, U.TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (shape === 'wing') {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 1.5, -r * 0.2, r * 0.5, r * 0.7);
      ctx.quadraticCurveTo(0, r * 0.2, -r * 0.5, r * 0.7);
      ctx.quadraticCurveTo(-r * 1.5, -r * 0.2, 0, -r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'hex') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * U.TAU;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, Math.sin(e.bob) * 1.5, r, r * 0.86, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.18, 0, U.TAU);
      ctx.arc(r * 0.3, -r * 0.15, r * 0.18, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const ang = e.facing || 0;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, ang - 0.5, ang + 0.5);
    ctx.stroke();
  }

  function drawBossShape(ctx, e, body, accent) {
    const r = e.r;
    const t = Render.time;
    const pulse = 1 + Math.sin(t * 3) * 0.03;
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;

    if (e.id === 'butcher') {
      ctx.fillStyle = body;
      roundRect(ctx, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.45, -r * 0.8);
        ctx.lineTo(i * r * 0.75, -r * 1.35);
        ctx.lineTo(i * r * 0.18, -r * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      ctx.save();
      ctx.rotate(-0.5 + Math.sin(t * 2) * 0.08);
      ctx.fillStyle = '#e8eef7';
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r * 0.2);
      ctx.lineTo(r * 1.5, -r * 0.55);
      ctx.lineTo(r * 1.35, r * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#12060a';
      ctx.beginPath();
      ctx.arc(-r * 0.25, -r * 0.12, r * 0.14, 0, U.TAU);
      ctx.arc(r * 0.2, -r * 0.12, r * 0.14, 0, U.TAU);
      ctx.fill();
    } else if (e.id === 'matron') {
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.92, 0, 0, U.TAU);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * U.TAU + t * 0.6;
        const sx = Math.cos(a) * r * 0.95;
        const sy = Math.sin(a) * r * 0.95;
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.22 + Math.sin(t * 4 + i) * 2, 0, U.TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#0b1a10';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.42, r * 0.3, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = '#c9ff9b';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * r * 0.24, -r * 0.25, r * 0.1, 0, U.TAU);
        ctx.fill();
      }
    } else if (e.id === 'colossus') {
      ctx.fillStyle = body;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * U.TAU + Math.PI / 6;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * U.TAU + Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * U.TAU + t * 0.25;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02);
        ctx.lineTo(Math.cos(a + 0.09) * r * 1.42, Math.sin(a + 0.09) * r * 1.42);
        ctx.lineTo(Math.cos(a + 0.18) * r * 1.02, Math.sin(a + 0.18) * r * 1.02);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#eaf9ff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.26, 0, U.TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = '#120a1e';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = body;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, t % U.TAU, (t % U.TAU) + 2.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, -t % U.TAU, (-t % U.TAU) + 2.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = body;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * U.TAU + t * 0.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
        ctx.lineTo(Math.cos(a + 0.12) * r * 1.55, Math.sin(a + 0.12) * r * 1.55);
        ctx.lineTo(Math.cos(a + 0.24) * r * 0.95, Math.sin(a + 0.24) * r * 0.95);
        ctx.closePath();
        ctx.fill();
      }
      const core = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.5);
      core.addColorStop(0, '#ffffff');
      core.addColorStop(0.4, body);
      core.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, U.TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let ph = 0; ph < e.boss.phases; ph++) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 12 + ph * 6, ph * 0.9, ph * 0.9 + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBullets(ctx, run) {
    for (let i = 0; i < run.bullets.length; i++) {
      const b = run.bullets[i];
      const speed = Math.hypot(b.vx, b.vy);
      const len = Math.min(26, speed * 0.022);
      const nx = speed > 1 ? b.vx / speed : 1;
      const ny = speed > 1 ? b.vy / speed : 0;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(2, b.r * 0.9);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(b.x - nx * len, b.y - ny * len);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, U.TAU);
      ctx.fill();
      if (!b.friendly) {
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 2, 0, U.TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawSlashes(ctx, run) {
    for (let i = 0; i < run.slashes.length; i++) {
      const s = run.slashes[i];
      const t = U.clamp(s.t / s.dur, 0, 1);
      const alpha = (1 - t) * 0.75;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      const grad = ctx.createRadialGradient(0, 0, s.range * 0.2, 0, 0, s.range);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, s.color || '#ffffff');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, s.range * (0.75 + t * 0.35), -s.arc / 2 + t * 0.3, s.arc / 2 + t * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = s.accent || s.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, s.range * (0.8 + t * 0.3), -s.arc / 2, s.arc / 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBeams(ctx, run) {
    for (let i = 0; i < run.beams.length; i++) {
      const b = run.beams[i];
      const t = b.t / b.dur;
      const jitter = b.jitter || 0;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = (b.width || 4) * (1 - t * 0.6);
      ctx.beginPath();
      const segs = jitter > 0 ? 5 : 1;
      const dx = b.x2 - b.x1;
      const dy = b.y2 - b.y1;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      ctx.moveTo(b.x1, b.y1);
      for (let s = 1; s <= segs; s++) {
        const f = s / segs;
        const off = jitter > 0 && s < segs ? U.rand(-jitter, jitter) : 0;
        ctx.lineTo(b.x1 + dx * f + px * off, b.y1 + dy * f + py * off);
      }
      ctx.stroke();
      ctx.globalAlpha = (1 - t) * 0.25;
      ctx.lineWidth = (b.width || 4) * 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRings(ctx, run) {
    for (let i = 0; i < run.rings.length; i++) {
      const r = run.rings[i];
      const t = U.clamp(r.t / r.dur, 0, 1);
      const rad = U.lerp(r.r, r.maxR, U.easeOut(t));
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = (r.width || 4) * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, U.TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles(ctx, run) {
    const limit = Render.quality > 0.5 ? run.particles.length : Math.floor(run.particles.length * 0.4);
    for (let i = 0; i < limit; i++) {
      const q = run.particles[i];
      const a = U.clamp(q.life / q.maxLife, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = q.color;
      const s = q.size * (0.4 + a * 0.6);
      ctx.beginPath();
      ctx.arc(q.x, q.y, s, 0, U.TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(ctx, run) {
    const p = run.player;
    if (p.dead) return;
    const st = run.stats;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.wardT > 0) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#8fd0ff';
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 14, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (st.shield > 0) {
      ctx.strokeStyle = '#8fd0ff';
      ctx.globalAlpha = 0.4 + (p.shield / Math.max(1, st.shield)) * 0.4;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.r + 7, 0, U.TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (p.invuln > 0 && Math.floor(Render.time * 20) % 2 === 0) ctx.globalAlpha = 0.55;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, p.r * 0.75, p.r * 0.9, p.r * 0.4, 0, 0, U.TAU);
    ctx.fill();

    const aura = ctx.createRadialGradient(0, 0, p.r * 0.3, 0, 0, p.r * 2.7);
    aura.addColorStop(0, 'rgba(150,230,255,0.30)');
    aura.addColorStop(0.55, 'rgba(120,200,255,0.10)');
    aura.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 2.7, 0, U.TAU);
    ctx.fill();

    const bodyColor = run.character.color;
    ctx.fillStyle = p.hurtFlash > 0.4 ? '#ffffff' : bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = '#f2fbff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(8,14,22,0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.46, 0, U.TAU);
    ctx.fill();

    const phi = highlightSprite();
    if (phi) {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(phi, -p.r, -p.r, p.r * 2, p.r * 2);
      ctx.globalAlpha = 1;
    }

    const pulse = 0.6 + Math.sin(Render.time * 3.4) * 0.18;
    ctx.strokeStyle = 'rgba(180,240,255,' + pulse + ')';
    ctx.lineWidth = 2;
    const br = p.r + 8;
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.arc(0, 0, br, b * (U.TAU / 4) + 0.25, b * (U.TAU / 4) + 1.1);
      ctx.stroke();
    }

    ctx.rotate(p.aim);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(p.r * 0.7, -4);
    ctx.lineTo(p.r * 1.75, 0);
    ctx.lineTo(p.r * 0.7, 4);
    ctx.closePath();
    ctx.fill();

    const def = run.defOf(run.weapon);
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    if (def.kind === 'melee') {
      ctx.beginPath();
      ctx.arc(0, 0, (def.range || 100) * 0.92, -(def.arc || 1.4) / 2, (def.arc || 1.4) / 2);
      ctx.stroke();
    } else if (def.kind === 'cone') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, (def.range || 200) * 0.9, -(def.arc || 0.6) / 2, (def.arc || 0.6) / 2);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (p.slowT > 0) {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#d8b0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 5, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (p.focusT > 0) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#5fb7ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const rr = p.r + 16 + i * 10 + Math.sin(Render.time * 6 + i) * 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, U.TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (p.adrenT > 0) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 10, 0, U.TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFloaters(ctx, run) {
    if (!Render.showNumbers) return;
    ctx.textAlign = 'center';
    for (let i = 0; i < run.floaters.length; i++) {
      const f = run.floaters[i];
      const a = U.clamp(f.life / 0.8, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color;
      ctx.font = '700 ' + (f.size || 13) + 'px "Rajdhani", "Segoe UI", sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function drawWorldBorder(ctx, run, zoom, cx, cy) {
    const arenaW = SF.Run.ARENA_W;
    const arenaH = SF.Run.ARENA_H;
    const left = (0 - cx) * zoom + Render.w / 2;
    const top = (0 - cy) * zoom + Render.h / 2;
    const right = (arenaW - cx) * zoom + Render.w / 2;
    const bottom = (arenaH - cy) * zoom + Render.h / 2;
    ctx.save();
    ctx.strokeStyle = run.biome.accent;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.lineTo(right, bottom);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawScreenEffects(ctx, run, w, h) {
    const p = run.player;
    const hpFrac = p.hp / Math.max(1, run.stats.maxHp);
    if (hpFrac < 0.35) {
      const a = U.clamp((0.35 - hpFrac) * 0.9 + Math.sin(Render.time * 5) * 0.03, 0, 0.62);
      const vig = vignetteSprite();
      if (vig) {
        ctx.globalAlpha = a;
        ctx.drawImage(vig, 0, 0, w, h);
        ctx.globalAlpha = 1;
      } else {
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
        grad.addColorStop(0, 'rgba(255,0,0,0)');
        grad.addColorStop(1, 'rgba(200,0,0,' + a + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }
    if (p.hurtFlash > 0) {
      ctx.fillStyle = 'rgba(255,60,60,' + (p.hurtFlash * 0.16) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    if (run.slowMoT > 0) {
      ctx.fillStyle = 'rgba(90,170,255,0.06)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  SF.Render = Render;
})();
