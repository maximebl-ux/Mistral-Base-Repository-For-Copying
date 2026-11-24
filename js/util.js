(function () {
  const SF = (window.SF = window.SF || {});

  const TAU = Math.PI * 2;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function damp(a, b, rate, dt) {
    return lerp(a, b, 1 - Math.exp(-rate * dt));
  }

  function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function chance(p) {
    return Math.random() < p;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function pickMany(list, n) {
    return shuffle(list).slice(0, n);
  }

  function weightedPick(list, weightOf) {
    let total = 0;
    for (let i = 0; i < list.length; i++) total += Math.max(0, weightOf(list[i]));
    if (total <= 0) return list.length ? pick(list) : null;
    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      roll -= Math.max(0, weightOf(list[i]));
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  function dist2(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  }

  function angleTo(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax);
  }

  function normAngle(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }

  function angleDiff(a, b) {
    return normAngle(b - a);
  }

  function inArc(angle, center, halfArc) {
    return Math.abs(normAngle(angle - center)) <= halfArc;
  }

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeIn(t) {
    return t * t * t;
  }

  function fmt(n) {
    const v = Math.round(n);
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 10000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(v);
  }

  function pct(v, digits) {
    return (v * 100).toFixed(digits === undefined ? 0 : digits) + '%';
  }

  let uidCounter = 1;
  function uid() {
    return uidCounter++;
  }

  function copy(obj) {
    if (Array.isArray(obj)) return obj.map(copy);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const k in obj) out[k] = copy(obj[k]);
      return out;
    }
    return obj;
  }

  function rectCircle(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return dist2(cx, cy, nx, ny) <= r * r;
  }

  SF.U = {
    TAU,
    clamp,
    lerp,
    damp,
    rand,
    randInt,
    chance,
    pick,
    shuffle,
    pickMany,
    weightedPick,
    dist,
    dist2,
    angleTo,
    normAngle,
    angleDiff,
    inArc,
    easeOut,
    easeIn,
    fmt,
    pct,
    uid,
    copy,
    rectCircle
  };
})();
