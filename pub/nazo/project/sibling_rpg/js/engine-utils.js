// ─── UTILITY ────────────────────────────────────────────────────────
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const roll = (n) => Math.floor(Math.random() * n) + 1;
    const chance = (pct) => Math.random() * 100 < pct;
    const pickN = (arr, n) => {
      const copy = [...arr];
      const result = [];
      for (let i = 0; i < Math.min(n, copy.length); i++) {
        const idx = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
      }
      return result;
    };

    const gaussRandom = (mean, stddev) => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stddev + mean;
    };
    const rollLevel = (center, spread) => Math.max(1, Math.min(200, Math.round(gaussRandom(center, spread))));

// ─── HELPERS ────────────────────────────────────────────────────────
    const esc = s => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const nl2br = s => esc(s).replace(/\n/g, '<br>');

    function levelColor(lv) {
      if (lv <= 5) return "#6ec46e"; if (lv <= 15) return "#8bc34a"; if (lv <= 30) return "#ffc107";
      if (lv <= 50) return "#ff9800"; if (lv <= 70) return "#f44336"; if (lv <= 100) return "#9c27b0";
      if (lv <= 150) return "#e040fb"; return "#ff1744";
    }
    function eventColor(t) { return { treasure: "#ffd700", npc: "#66bbff", trap: "#ff6666", phenomenon: "#bb88ff", campsite: "#66cc88" }[t] || "#888" }

// --- SE ---------------------
    let audioCtx = null;

    function getAudioCtx() {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      return audioCtx;
    }

    function playBeep(freq = 660, duration = 0.08, type = "sine", gainValue = 0.03) {
      const ctx = getAudioCtx();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainValue;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    }

    function playAdventureReadySound() {
      playBeep(880, 0.07, "triangle", 0.025);
      setTimeout(() => playBeep(1175, 0.09, "triangle", 0.02), 90);
    }

    function playAdventureStartSound() {
      playBeep(520, 0.06, "square", 0.02);
      setTimeout(() => playBeep(780, 0.08, "square", 0.018), 70);
    }

    function playRestSound() {
      playBeep(440, 0.08, "sine", 0.02);
      setTimeout(() => playBeep(554, 0.08, "sine", 0.018), 100);
    }

    function playExhaustedSound() {
      playBeep(280, 0.12, "sawtooth", 0.02);
      setTimeout(() => playBeep(220, 0.14, "sawtooth", 0.018), 110);
    }

// ─── WEIGHTED PICK UTILS ────────────────────────────────────────────
    function pickWeighted(entries) {
      if (!entries || entries.length === 0) return null;

      const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight ?? 0), 0);
      if (total <= 0) return null;

      let r = Math.random() * total;
      for (const entry of entries) {
        r -= Math.max(0, entry.weight ?? 0);
        if (r < 0) return entry.value;
      }

      return entries[entries.length - 1].value;
    }

    function pushWeightedEntries(target, items, weight, sourceTag = "") {
      if (!items || items.length === 0 || weight <= 0) return;
      for (const item of items) {
        target.push({
          value: item,
          weight,
          source: sourceTag,
        });
      }
    }