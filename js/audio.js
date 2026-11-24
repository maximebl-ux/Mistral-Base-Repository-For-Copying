(function () {
  const SF = (window.SF = window.SF || {});

  const Audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    enabled: true,
    musicOn: true,
    started: false,
    musicTimer: null,
    step: 0
  };

  function ensure() {
    if (Audio.ctx) return Audio.ctx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    Audio.ctx = new Ctx();
    Audio.master = Audio.ctx.createGain();
    Audio.master.gain.value = 0.9;
    Audio.master.connect(Audio.ctx.destination);
    Audio.sfxGain = Audio.ctx.createGain();
    Audio.sfxGain.gain.value = 0.7;
    Audio.sfxGain.connect(Audio.master);
    Audio.musicGain = Audio.ctx.createGain();
    Audio.musicGain.gain.value = 0.0;
    Audio.musicGain.connect(Audio.master);
    return Audio.ctx;
  }

  Audio.unlock = function () {
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (!Audio.started) {
      Audio.started = true;
      startMusic();
    }
  };

  Audio.setVolume = function (master, music) {
    ensure();
    if (!Audio.master) return;
    Audio.master.gain.value = master;
    Audio.musicGain.gain.value = Audio.musicOn ? music * 0.22 : 0;
  };

  Audio.setMusic = function (on) {
    Audio.musicOn = on;
    if (Audio.musicGain && Audio.ctx) {
      Audio.musicGain.gain.setTargetAtTime(on ? 0.045 : 0, Audio.ctx.currentTime, 0.2);
    }
  };

  function tone(freq, dur, type, vol, slideTo, delay) {
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(Audio.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, filterFreq, type, delay) {
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type || 'lowpass';
    filter.frequency.setValueAtTime(filterFreq || 1200, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, (filterFreq || 1200) * 0.25), t0 + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(Audio.sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  const SOUNDS = {
    shoot: function () {
      tone(320, 0.07, 'square', 0.05, 180);
      noise(0.06, 0.05, 2400);
    },
    shootHeavy: function () {
      tone(140, 0.16, 'sawtooth', 0.08, 60);
      noise(0.14, 0.09, 1400);
    },
    melee: function () {
      noise(0.11, 0.07, 3200, 'bandpass');
      tone(220, 0.08, 'triangle', 0.04, 140);
    },
    hit: function () {
      noise(0.05, 0.05, 1800);
    },
    crit: function () {
      tone(880, 0.09, 'square', 0.06, 1500);
      noise(0.06, 0.05, 3000);
    },
    hurt: function () {
      tone(180, 0.2, 'sawtooth', 0.09, 70);
      noise(0.16, 0.06, 900);
    },
    kill: function () {
      noise(0.12, 0.06, 900);
      tone(260, 0.1, 'triangle', 0.04, 120);
    },
    explode: function () {
      noise(0.4, 0.14, 900);
      tone(70, 0.35, 'sine', 0.1, 40);
    },
    pickup: function () {
      tone(880, 0.07, 'triangle', 0.05, 1320);
    },
    coin: function () {
      tone(1180, 0.05, 'square', 0.03, 1560);
    },
    levelup: function () {
      [523, 659, 784, 1046].forEach(function (f, i) {
        tone(f, 0.18, 'triangle', 0.06, null, i * 0.08);
      });
    },
    ui: function () {
      tone(520, 0.04, 'square', 0.03, 700);
    },
    uiBig: function () {
      tone(300, 0.1, 'triangle', 0.05, 500);
    },
    boss: function () {
      tone(60, 0.9, 'sawtooth', 0.12, 34);
      noise(0.8, 0.1, 500);
    },
    dash: function () {
      noise(0.16, 0.05, 2600, 'highpass');
    },
    shield: function () {
      tone(660, 0.16, 'sine', 0.05, 990);
    },
    death: function () {
      [220, 180, 140, 90].forEach(function (f, i) {
        tone(f, 0.4, 'sawtooth', 0.08, f * 0.5, i * 0.14);
      });
      noise(1.2, 0.1, 700);
    },
    heal: function () {
      [440, 660, 880].forEach(function (f, i) {
        tone(f, 0.2, 'sine', 0.05, null, i * 0.06);
      });
    },
    evolve: function () {
      [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) {
        tone(f, 0.3, 'triangle', 0.06, null, i * 0.07);
      });
      noise(0.6, 0.06, 3000, 'highpass');
    }
  };

  Audio.play = function (name) {
    if (!Audio.enabled) return;
    const fn = SOUNDS[name];
    if (!fn) return;
    try {
      fn();
    } catch (e) {
      Audio.enabled = false;
    }
  };

  let lastMusic = 0;
  function startMusic() {
    if (Audio.musicTimer) return;
    const ctx = ensure();
    if (!ctx) return;
    Audio.musicGain.gain.setTargetAtTime(0.045, ctx.currentTime, 1.2);
    const scale = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66];
    Audio.musicTimer = setInterval(function () {
      if (!Audio.ctx || !Audio.musicOn) return;
      const now = performance.now();
      if (now - lastMusic < 320) return;
      lastMusic = now;
      Audio.step = (Audio.step + 1) % 16;
      const t = Audio.ctx.currentTime;
      if (Audio.step % 4 === 0) {
        const bass = scale[(Audio.step / 4) % 4] / 2;
        const osc = Audio.ctx.createOscillator();
        const gain = Audio.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = bass;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        osc.connect(gain);
        gain.connect(Audio.musicGain);
        osc.start(t);
        osc.stop(t + 0.75);
      }
      if (Audio.step % 8 === 3 || Audio.step % 8 === 6) {
        const note = scale[Math.floor(Math.random() * scale.length)] * 2;
        const osc = Audio.ctx.createOscillator();
        const gain = Audio.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = note;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain);
        gain.connect(Audio.musicGain);
        osc.start(t);
        osc.stop(t + 1);
      }
    }, 160);
  }

  SF.Audio = Audio;
})();
