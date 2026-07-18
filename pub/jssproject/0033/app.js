(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const SAND_MARGIN = 0.055;
  const SAND_EDGE_BAND = 0.13;

  const materials = {
    aluminum: { name: "Aluminum", density: 2700, young: 69e9, poisson: 0.33 },
    steel: { name: "Mild steel", density: 7850, young: 200e9, poisson: 0.30 },
    stainless: { name: "Stainless steel", density: 7900, young: 190e9, poisson: 0.29 },
    brass: { name: "Brass", density: 8500, young: 100e9, poisson: 0.34 },
    copper: { name: "Copper", density: 8960, young: 110e9, poisson: 0.34 },
    glass: { name: "Glass", density: 2500, young: 70e9, poisson: 0.22 },
    acrylic: { name: "Acrylic", density: 1180, young: 3.2e9, poisson: 0.35 }
  };

  const keyMap = {
    a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6, k: 7, l: 8, ";": 9, ":": 9,
    q: 5, w: 6, e: 7, r: 8, t: 9, y: 10, u: 11, i: 12, o: 13, p: 14, "[": 15, "]": 16,
    "1": 10, "2": 11, "3": 12, "4": 13, "5": 14, "6": 15, "7": 16, "8": 17, "9": 18, "0": 19, "-": 20, "=": 21,
    z: -5, x: -4, c: -3, v: -2, b: -1, n: 0, m: 1, ",": 2, ".": 3, "/": 4, "?": 4
  };

  const keyRows = ["1234567890-=", "qwertyuiop[]", "asdfghjkl;", "zxcvbnm,./"];
  const allowedFuncs = {
    abs: Math.abs, acos: Math.acos, asin: Math.asin, atan: Math.atan, atan2: Math.atan2,
    ceil: Math.ceil, cos: Math.cos, exp: Math.exp, floor: Math.floor, log: Math.log,
    log2: Math.log2, log10: Math.log10, max: Math.max, min: Math.min, pow: Math.pow,
    round: Math.round, sin: Math.sin, sqrt: Math.sqrt, tan: Math.tan
  };
  const constants = { pi: Math.PI, tau: TAU, e: Math.E, phi: (1 + Math.sqrt(5)) / 2 };

  let scale = {
    degrees: [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8],
    period: 2
  };
  let modes = [];
  let field = null;
  let particles = [];
  let selectedMode = null;
  let activeKeys = new Map();
  let playing = true;
  let latch = false;
  let viewMode = "combined";
  let lastFrame = performance.now();
  let fpsFilter = 60;
  let sweep = null;
  let audioCtx = null;
  let masterGain = null;
  let safetyLimiter = null;
  let audioVoices = new Map();

  const plateCanvas = $("plateCanvas");
  const sandCanvas = $("sandCanvas");
  const plateCtx = plateCanvas.getContext("2d");
  const sandCtx = sandCanvas.getContext("2d");

  function tokenize(input) {
    const tokens = [];
    let i = 0;
    while (i < input.length) {
      const ch = input[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        let s = ch; i++;
        while (i < input.length && /[0-9.eE+-]/.test(input[i])) {
          const prev = input[i - 1];
          if ((input[i] === "+" || input[i] === "-") && prev !== "e" && prev !== "E") break;
          s += input[i++];
        }
        const n = Number(s);
        if (!Number.isFinite(n)) throw new Error("Bad number: " + s);
        tokens.push({ type: "number", value: n });
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        let s = ch; i++;
        while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) s += input[i++];
        tokens.push({ type: "name", value: s.toLowerCase() });
        continue;
      }
      if ("+-*/^(),".includes(ch)) {
        tokens.push({ type: ch, value: ch });
        i++;
        continue;
      }
      throw new Error("Unexpected token: " + ch);
    }
    tokens.push({ type: "eof" });
    return tokens;
  }

  function evalNumberExpr(input, scope = {}) {
    const tokens = tokenize(String(input || "0"));
    let at = 0;
    const peek = () => tokens[at];
    const take = (type) => {
      if (peek().type !== type) throw new Error("Expected " + type);
      return tokens[at++];
    };
    function primary() {
      const t = peek();
      if (t.type === "number") { at++; return t.value; }
      if (t.type === "name") {
        at++;
        const name = t.value;
        if (peek().type === "(") {
          take("(");
          const args = [];
          if (peek().type !== ")") {
            while (true) {
              args.push(expr());
              if (peek().type !== ",") break;
              take(",");
            }
          }
          take(")");
          if (!allowedFuncs[name]) throw new Error("Function not allowed: " + name);
          const v = allowedFuncs[name](...args);
          if (!Number.isFinite(v)) throw new Error("Expression is not finite");
          return v;
        }
        if (Object.prototype.hasOwnProperty.call(scope, name)) return Number(scope[name]);
        if (Object.prototype.hasOwnProperty.call(constants, name)) return constants[name];
        throw new Error("Unknown symbol: " + name);
      }
      if (t.type === "(") {
        take("(");
        const v = expr();
        take(")");
        return v;
      }
      if (t.type === "+") { take("+"); return primary(); }
      if (t.type === "-") { take("-"); return -primary(); }
      throw new Error("Bad expression");
    }
    function power() {
      let v = primary();
      if (peek().type === "^") {
        take("^");
        v = Math.pow(v, power());
      }
      return v;
    }
    function term() {
      let v = power();
      while (peek().type === "*" || peek().type === "/") {
        const op = tokens[at++].type;
        const b = power();
        v = op === "*" ? v * b : v / b;
      }
      return v;
    }
    function expr() {
      let v = term();
      while (peek().type === "+" || peek().type === "-") {
        const op = tokens[at++].type;
        const b = term();
        v = op === "+" ? v + b : v - b;
      }
      return v;
    }
    const value = expr();
    if (peek().type !== "eof") throw new Error("Unexpected trailing expression");
    if (!Number.isFinite(value)) throw new Error("Expression is not finite");
    return value;
  }

  function parseScaleText() {
    const lines = $("scaleText").value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("Scale needs at least one degree and a period");
    const ratios = lines.map((line) => {
      let r;
      if (/^-?\d+(\.\d*)?\.$/.test(line)) r = Math.pow(2, parseFloat(line) / 1200);
      else r = evalNumberExpr(line);
      if (!Number.isFinite(r) || r <= 0) throw new Error("Bad scale ratio: " + line);
      return r;
    });
    const period = ratios[ratios.length - 1];
    const degrees = [1];
    for (const r of ratios.slice(0, -1)) {
      if (Math.abs(r - 1) > 1e-9) degrees.push(r);
    }
    scale = { degrees, period };
    updateKeyboardLabels();
    logCli("scale: base + " + (degrees.length - 1) + " degrees, period " + period.toFixed(5));
  }

  function noteFreq(step) {
    const degrees = scale.degrees;
    const len = degrees.length;
    const idx = ((step % len) + len) % len;
    const oct = Math.floor((step - idx) / len);
    const base = numberValue("baseHz", 440);
    return clamp(base * degrees[idx] * Math.pow(scale.period, oct), 1, 24000);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function numberValue(id, fallback) {
    const n = Number($(id).value);
    return Number.isFinite(n) ? n : fallback;
  }

  function currentFrequency() {
    const base = numberValue("baseHz", 440);
    const ratio = evalNumberExpr($("ratioExpr").value || "1");
    return clamp(base * ratio, 0.1, 24000);
  }

  function dimensions() {
    return {
      width: numberValue("widthMm", 300) / 1000,
      height: numberValue("heightMm", 300) / 1000,
      thickness: numberValue("thicknessMm", 1) / 1000
    };
  }

  function material() {
    return materials[$("material").value] || materials.aluminum;
  }

  function calculateRectangularModes() {
    const d = dimensions();
    const mat = material();
    const D = mat.young * Math.pow(d.thickness, 3) / (12 * (1 - mat.poisson * mat.poisson));
    const scaleFactor = Math.sqrt(D / (mat.density * d.thickness));
    const boundary = $("boundary").value;
    const boundaryFactor = boundary === "clamped" ? 1.38 : boundary === "center" ? 1.12 : 1;
    const list = [];
    for (let m = 1; m <= 10; m++) {
      for (let n = 1; n <= 10; n++) {
        const k2 = Math.pow(m * Math.PI / d.width, 2) + Math.pow(n * Math.PI / d.height, 2);
        const f = boundaryFactor * scaleFactor * k2 / TAU;
        list.push({ m, n, frequency: f });
      }
    }
    list.sort((a, b) => a.frequency - b.frequency);
    modes = list;
    if (!selectedMode || !modes.some((x) => x.m === selectedMode.m && x.n === selectedMode.n)) {
      selectedMode = modes[0];
    }
  }

  function modeShape(mode, x, y) {
    const base = Math.sin(mode.m * Math.PI * x) * Math.sin(mode.n * Math.PI * y);
    if ($("boundary").value === "center") {
      const dx = x - 0.5;
      const dy = y - 0.5;
      const suppress = 1 - 0.75 * Math.exp(-(dx * dx + dy * dy) / 0.01);
      return base * suppress;
    }
    if ($("boundary").value === "clamped") {
      return base * Math.sin(Math.PI * x) * Math.sin(Math.PI * y) * 1.7;
    }
    return base;
  }

  function shapeMask(x, y) {
    const shape = $("shape").value;
    if (shape === "ellipse") {
      const dx = (x - 0.5) / 0.49;
      const dy = (y - 0.5) / 0.49;
      return dx * dx + dy * dy <= 1;
    }
    if (shape === "diamond") return Math.abs(x - 0.5) + Math.abs(y - 0.5) < 0.5;
    return x >= 0 && x <= 1 && y >= 0 && y <= 1;
  }

  function sandMask(x, y) {
    const margin = SAND_MARGIN;
    if (x < margin || x > 1 - margin || y < margin || y > 1 - margin) return false;
    return shapeMask(x, y);
  }

  function nudgeInsideSandMask(p) {
    const margin = SAND_MARGIN;
    const settle = margin * 1.35;
    p.x = clamp(p.x, settle, 1 - settle);
    p.y = clamp(p.y, settle, 1 - settle);
    if (sandMask(p.x, p.y)) return;
    for (let tries = 0; tries < 24; tries++) {
      const x = margin + Math.random() * (1 - 2 * margin);
      const y = margin + Math.random() * (1 - 2 * margin);
      if (!sandMask(x, y)) continue;
      p.x = x;
      p.y = y;
      p.vx = 0;
      p.vy = 0;
      return;
    }
    p.x = 0.5;
    p.y = 0.5;
    p.vx = 0;
    p.vy = 0;
  }

  function excitationCoupling(mode) {
    const x = numberValue("exciterX", 0.5);
    const y = numberValue("exciterY", 0.5);
    return modeShape(mode, x, y);
  }

  function resonanceStrength(mode, frequency) {
    const damping = numberValue("damping", 0.018);
    const fk = Math.max(0.1, mode.frequency);
    const f = Math.max(0.1, frequency);
    const den = Math.sqrt(Math.pow(fk * fk - f * f, 2) + Math.pow(2 * damping * fk * f, 2));
    return Math.abs(excitationCoupling(mode)) * fk * fk / Math.max(1, den);
  }

  function excitationFrequencies() {
    const list = [];
    try {
      list.push({ frequency: currentFrequency(), amplitude: numberValue("amplitude", 0.8), phase: 0 });
    } catch {
      list.push({ frequency: numberValue("baseHz", 440), amplitude: numberValue("amplitude", 0.8), phase: 0 });
    }
    for (const item of activeKeys.values()) {
      list.push({ frequency: item.frequency, amplitude: 0.72, phase: item.phase || 0 });
    }
    return list;
  }

  function activeModeAmplitudes() {
    const locked = $("lockMode").checked && selectedMode;
    const freqs = excitationFrequencies();
    const result = [];
    for (const mode of modes) {
      if (locked && (mode.m !== selectedMode.m || mode.n !== selectedMode.n)) continue;
      let amp = 0;
      for (const ex of freqs) amp += ex.amplitude * resonanceStrength(mode, ex.frequency);
      if (amp > 0.003 || locked) {
        const item = { mode, amp };
        if (locked && mode.m !== mode.n) {
          const pair = modes.find((candidate) => candidate.m === mode.n && candidate.n === mode.m);
          const mix = numberValue("pairMix", 0);
          if (pair && Math.abs(mix) > 0.001) {
            item.mixMode = pair;
            item.mix = mix;
          }
        }
        result.push(item);
      }
    }
    result.sort((a, b) => b.amp - a.amp);
    return result.slice(0, locked ? 1 : 18);
  }

  function modalShapeForItem(item, x, y) {
    let ph = modeShape(item.mode, x, y);
    if (item.mixMode) {
      ph = (ph + item.mix * modeShape(item.mixMode, x, y)) / Math.sqrt(1 + item.mix * item.mix);
    }
    return ph;
  }

  function buildField(forceSize) {
    const quality = $("quality").value;
    const size = forceSize || (quality === "fine" ? 190 : quality === "eco" ? 96 : 136);
    const value = new Float32Array(size * size);
    const rms = new Float32Array(size * size);
    const mask = new Uint8Array(size * size);
    const active = activeModeAmplitudes();
    const t = performance.now() / 1000;
    let peak = 0;
    let rmsPeak = 0;
    for (let j = 0; j < size; j++) {
      const y = j / (size - 1);
      for (let i = 0; i < size; i++) {
        const x = i / (size - 1);
        const idx = j * size + i;
        if (!shapeMask(x, y)) continue;
        mask[idx] = 1;
        let v = 0;
        let r = 0;
        for (const item of active) {
          const f = item.mode.frequency;
          const ph = modalShapeForItem(item, x, y);
          const a = item.amp;
          v += a * ph * Math.sin(TAU * f * t * 0.04);
          r += a * a * ph * ph;
        }
        value[idx] = v;
        rms[idx] = Math.sqrt(r);
        peak = Math.max(peak, Math.abs(v));
        rmsPeak = Math.max(rmsPeak, rms[idx]);
      }
    }
    field = { size, value, rms, mask, peak: peak || 1, rmsPeak: rmsPeak || 1, active };
    return field;
  }

  function fieldAt(x, y) {
    if (!field || !shapeMask(x, y)) return 2;
    const s = field.size;
    const fx = clamp(x, 0, 1) * (s - 1);
    const fy = clamp(y, 0, 1) * (s - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(s - 1, x0 + 1);
    const y1 = Math.min(s - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const a = field.rms[y0 * s + x0];
    const b = field.rms[y0 * s + x1];
    const c = field.rms[y1 * s + x0];
    const d = field.rms[y1 * s + x1];
    const v = a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
    return v / field.rmsPeak;
  }

  function particlePotentialAt(x, y) {
    const base = fieldAt(x, y);
    const dist = Math.min(x, y, 1 - x, 1 - y);
    const edge = clamp((SAND_EDGE_BAND - dist) / SAND_EDGE_BAND, 0, 1);
    return base + edge * edge * 2.4;
  }

  function resetParticles(randomize) {
    const target = Math.round(numberValue("particleCount", 9000));
    if (!randomize && particles.length === target) return;
    particles = [];
    let guard = 0;
    while (particles.length < target && guard < target * 40) {
      guard++;
      const x = Math.random();
      const y = Math.random();
      if (!sandMask(x, y)) continue;
      particles.push({ x, y, vx: 0, vy: 0 });
    }
  }

  function stepParticles(dt) {
    if (!field) return;
    const mobility = numberValue("mobility", 0.42);
    const friction = numberValue("friction", 0.88);
    const noise = numberValue("noise", 0.025);
    const eps = 1 / field.size;
    const margin = SAND_MARGIN;
    for (const p of particles) {
      const gx = (particlePotentialAt(p.x + eps, p.y) - particlePotentialAt(p.x - eps, p.y)) / (2 * eps);
      const gy = (particlePotentialAt(p.x, p.y + eps) - particlePotentialAt(p.x, p.y - eps)) / (2 * eps);
      let edgeX = 0;
      let edgeY = 0;
      if (p.x < SAND_EDGE_BAND) edgeX += (SAND_EDGE_BAND - p.x) / SAND_EDGE_BAND;
      if (p.x > 1 - SAND_EDGE_BAND) edgeX -= (p.x - (1 - SAND_EDGE_BAND)) / SAND_EDGE_BAND;
      if (p.y < SAND_EDGE_BAND) edgeY += (SAND_EDGE_BAND - p.y) / SAND_EDGE_BAND;
      if (p.y > 1 - SAND_EDGE_BAND) edgeY -= (p.y - (1 - SAND_EDGE_BAND)) / SAND_EDGE_BAND;
      p.vx = (p.vx - gx * mobility * dt * 0.045 + edgeX * dt * 0.055 + (Math.random() - 0.5) * noise * dt) * friction;
      p.vy = (p.vy - gy * mobility * dt * 0.045 + edgeY * dt * 0.055 + (Math.random() - 0.5) * noise * dt) * friction;
      p.vx = clamp(p.vx, -0.018, 0.018);
      p.vy = clamp(p.vy, -0.018, 0.018);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !sandMask(p.x, p.y)) {
        const settle = margin * 1.35;
        p.x = clamp(p.x, settle, 1 - settle);
        p.y = clamp(p.y, settle, 1 - settle);
        p.vx *= -0.15;
        p.vy *= -0.15;
        nudgeInsideSandMask(p);
      }
    }
  }

  function drawField() {
    if (!field) return;
    const w = plateCanvas.width;
    const h = plateCanvas.height;
    const img = plateCtx.createImageData(w, h);
    const data = img.data;
    const s = field.size;
    const drawRms = viewMode === "rms" || viewMode === "nodes" || viewMode === "combined" || viewMode === "sand";
    for (let y = 0; y < h; y++) {
      const gy = Math.floor((y / Math.max(1, h - 1)) * (s - 1));
      for (let x = 0; x < w; x++) {
        const gx = Math.floor((x / Math.max(1, w - 1)) * (s - 1));
        const idx = gy * s + gx;
        const out = (y * w + x) * 4;
        if (!field.mask[idx]) {
          data[out] = 2; data[out + 1] = 4; data[out + 2] = 7; data[out + 3] = 255;
          continue;
        }
        const rawRms = field.rms[idx] / field.rmsPeak;
        const rms = Math.pow(clamp(rawRms, 0, 1), 1.45);
        const disp = Math.sign(field.value[idx]) * Math.pow(Math.abs(field.value[idx] / field.peak), 0.82);
        let r = 10, g = 16, b = 23;
        if (viewMode === "displacement") {
          const pos = Math.max(0, disp);
          const neg = Math.max(0, -disp);
          r = 18 + pos * 190;
          g = 32 + (1 - Math.abs(disp)) * 70;
          b = 38 + neg * 190;
        } else if (drawRms) {
          r = 10 + rms * 48;
          g = 18 + rms * 126;
          b = 28 + rms * 118;
        }
        if ((viewMode === "nodes" || viewMode === "combined") && rawRms < 0.038) {
          r = 238; g = 205; b = 112;
        }
        data[out] = clamp(r, 0, 255);
        data[out + 1] = clamp(g, 0, 255);
        data[out + 2] = clamp(b, 0, 255);
        data[out + 3] = 255;
      }
    }
    plateCtx.putImageData(img, 0, 0);
    plateCtx.strokeStyle = "#344252";
    plateCtx.lineWidth = 2;
    plateCtx.strokeRect(1, 1, w - 2, h - 2);
  }

  function drawSand() {
    const w = sandCanvas.width;
    const h = sandCanvas.height;
    sandCtx.clearRect(0, 0, w, h);
    if (viewMode === "rms" || viewMode === "displacement" || viewMode === "nodes") return;
    sandCtx.globalCompositeOperation = "lighter";
    sandCtx.fillStyle = "rgba(248, 226, 158, 0.86)";
    const r = Math.max(0.85, Math.min(2.1, 9500 / Math.max(3500, particles.length)));
    for (const p of particles) {
      sandCtx.fillRect(p.x * w, p.y * h, r, r);
    }
    sandCtx.globalCompositeOperation = "source-over";
  }

  function resizeCanvases() {
    const rect = plateCanvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(360, Math.floor(rect.width * dpr));
    const h = Math.max(300, Math.floor(rect.height * dpr));
    if (plateCanvas.width !== w || plateCanvas.height !== h) {
      plateCanvas.width = sandCanvas.width = w;
      plateCanvas.height = sandCanvas.height = h;
    }
    updateExciterHandle();
  }

  function updateExciterHandle() {
    $("exciterHandle").style.left = (numberValue("exciterX", 0.5) * 100) + "%";
    $("exciterHandle").style.top = (numberValue("exciterY", 0.5) * 100) + "%";
  }

  function renderModeList() {
    const freq = safeFrequency();
    const scored = modes.map((mode) => ({ mode, score: resonanceStrength(mode, freq) }))
      .sort((a, b) => Math.abs(a.mode.frequency - freq) - Math.abs(b.mode.frequency - freq))
      .slice(0, 14);
    const max = Math.max(0.001, ...scored.map((x) => x.score));
    $("modeList").innerHTML = "";
    for (const item of scored) {
      const row = document.createElement("div");
      row.className = "mode-row" + (selectedMode && selectedMode.m === item.mode.m && selectedMode.n === item.mode.n ? " selected" : "");
      const ratio = item.mode.frequency / Math.max(0.1, modes[0].frequency);
      row.innerHTML = `<span>(${item.mode.m},${item.mode.n})</span><span>${item.mode.frequency.toFixed(1)} Hz</span><span class="bar"><span style="width:${Math.min(100, item.score / max * 100).toFixed(1)}%"></span></span><span>${ratio.toFixed(2)}</span>`;
      row.addEventListener("click", () => selectMode(item.mode, false));
      $("modeList").appendChild(row);
    }
  }

  function selectMode(mode, lock) {
    selectedMode = mode;
    $("ratioExpr").value = (mode.frequency / numberValue("baseHz", 440)).toPrecision(8);
    if (lock) $("lockMode").checked = true;
    updateAll(true);
    saveState();
  }

  function drawAtlasCell(canvas, mode) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const mixMode = mode.m !== mode.n ? modes.find((item) => item.m === mode.n && item.n === mode.m) : null;
    const mix = mixMode ? numberValue("pairMix", 0) : 0;
    for (let y = 0; y < h; y++) {
      const yy = (y + 0.5) / h;
      for (let x = 0; x < w; x++) {
        const xx = (x + 0.5) / w;
        let v = Math.sin(mode.m * Math.PI * xx) * Math.sin(mode.n * Math.PI * yy);
        if (mixMode && Math.abs(mix) > 0.001) {
          const pair = Math.sin(mixMode.m * Math.PI * xx) * Math.sin(mixMode.n * Math.PI * yy);
          v = (v + mix * pair) / Math.sqrt(1 + mix * mix);
        }
        const node = Math.exp(-Math.abs(v) * 18);
        const glow = Math.pow(Math.abs(v), 0.42);
        const i = (y * w + x) * 4;
        data[i] = 7 + glow * 28 + node * 220;
        data[i + 1] = 12 + glow * 82 + node * 200;
        data[i + 2] = 18 + glow * 78 + node * 128;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function renderModeAtlas() {
    const root = $("modeAtlas");
    if (!root || !modes.length) return;
    const rows = Math.round(clamp(numberValue("atlasRows", 6), 3, 10));
    const cols = Math.round(clamp(numberValue("atlasCols", 6), 3, 10));
    root.style.setProperty("--atlas-cols", cols);
    root.innerHTML = "";
    for (let n = 1; n <= rows; n++) {
      for (let m = 1; m <= cols; m++) {
        const mode = modes.find((item) => item.m === m && item.n === n);
        if (!mode) continue;
        const cell = document.createElement("button");
        cell.className = "atlas-cell" + (selectedMode && selectedMode.m === m && selectedMode.n === n ? " selected" : "");
        cell.title = `Mode (${m},${n}) ${mode.frequency.toFixed(2)} Hz`;
        const canvas = document.createElement("canvas");
        canvas.width = 54;
        canvas.height = 54;
        const label = document.createElement("span");
        label.textContent = `${m},${n}`;
        cell.append(canvas, label);
        cell.addEventListener("click", () => selectMode(mode, true));
        root.appendChild(cell);
        drawAtlasCell(canvas, mode);
      }
    }
  }

  function safeFrequency() {
    try { return currentFrequency(); }
    catch { return numberValue("baseHz", 440); }
  }

  function updateReadouts() {
    const f = safeFrequency();
    $("actualHz").textContent = f.toFixed(3) + " Hz";
    $("frequencyBadge").textContent = f.toFixed(2) + " Hz";
    const mat = material();
    $("materialBadge").textContent = mat.name.toUpperCase();
    const best = modes.reduce((acc, mode) => Math.max(acc, resonanceStrength(mode, f)), 0);
    $("resonanceBadge").textContent = "Res " + Math.min(9.99, best).toFixed(2);
    $("particleStatus").textContent = "Particles: " + particles.length.toLocaleString();
    updateKeyboardLabels();
    updateExciterHandle();
  }

  function updateAll(resetField) {
    calculateRectangularModes();
    if (resetField) buildField();
    resetParticles(false);
    renderModeList();
    renderModeAtlas();
    updateReadouts();
  }

  function logCli(text) {
    const log = $("cliLog");
    log.textContent += (log.textContent ? "\n" : "") + "> " + text;
    log.scrollTop = log.scrollHeight;
  }

  function runCommand(raw) {
    const line = raw.trim();
    if (!line) return;
    logCli(line);
    const parts = line.split(/\s+/);
    try {
      if (parts[0] === "help") {
        logCli("commands: set base 440, set ratio 3/2, set frequency 660, set material steel, set size 300 300 1, set particles 12000, damping 0.02, exciter .35 .5, mode 2 3, sweep 100 1200 20, randomize, reset, export png");
      } else if (parts[0] === "set" && parts[1] === "base") {
        $("baseHz").value = Number(parts[2]) || 440;
      } else if (parts[0] === "set" && parts[1] === "ratio") {
        $("ratioExpr").value = parts.slice(2).join(" ");
      } else if (parts[0] === "set" && parts[1] === "frequency") {
        const f = Number(parts[2]) || 440;
        $("ratioExpr").value = (f / numberValue("baseHz", 440)).toPrecision(8);
      } else if (parts[0] === "set" && parts[1] === "material") {
        const key = Object.keys(materials).find((k) => k.startsWith((parts[2] || "").toLowerCase()));
        if (!key) throw new Error("Unknown material");
        $("material").value = key;
      } else if (parts[0] === "set" && parts[1] === "size") {
        $("widthMm").value = Number(parts[2]) || 300;
        $("heightMm").value = Number(parts[3]) || Number(parts[2]) || 300;
        $("thicknessMm").value = Number(parts[4]) || 1;
      } else if (parts[0] === "set" && parts[1] === "particles") {
        $("particleCount").value = clamp(Number(parts[2]) || 9000, 1200, 24000);
        resetParticles(true);
      } else if (parts[0] === "damping" || (parts[0] === "set" && parts[1] === "damping")) {
        $("damping").value = Number(parts[parts[0] === "set" ? 2 : 1]) || 0.018;
      } else if (parts[0] === "exciter") {
        $("exciterX").value = clamp(Number(parts[1]) || 0.5, 0.02, 0.98);
        $("exciterY").value = clamp(Number(parts[2]) || 0.5, 0.02, 0.98);
      } else if (parts[0] === "mode") {
        const m = Number(parts[1]);
        const n = Number(parts[2]);
        const mode = modes.find((x) => x.m === m && x.n === n);
        if (!mode) throw new Error("Mode not found");
        selectedMode = mode;
        $("lockMode").checked = true;
      } else if (parts[0] === "sweep") {
        startSweep(Number(parts[1]) || 100, Number(parts[2]) || 1200, Number(parts[3]) || 20);
      } else if (parts[0] === "randomize") {
        resetParticles(true);
      } else if (parts[0] === "reset") {
        resetParticles(true);
        sweep = null;
      } else if (parts[0] === "export" && parts[1] === "png") {
        exportPng();
      } else {
        logCli("unknown command");
      }
      updateAll(true);
    } catch (err) {
      logCli("error: " + err.message);
    }
  }

  function startSweep(startHz, endHz, duration) {
    sweep = { startHz, endHz, duration: Math.max(1, duration), startTime: performance.now() / 1000 };
    logCli("sweep " + startHz + " -> " + endHz + " Hz in " + duration + " s");
  }

  function updateSweep(now) {
    if (!sweep) return;
    const p = clamp((now - sweep.startTime) / sweep.duration, 0, 1);
    const hz = sweep.startHz > 0 && sweep.endHz > 0
      ? sweep.startHz * Math.pow(sweep.endHz / sweep.startHz, p)
      : sweep.startHz + (sweep.endHz - sweep.startHz) * p;
    $("ratioExpr").value = (hz / numberValue("baseHz", 440)).toPrecision(8);
    if (p >= 1) sweep = null;
  }

  function findResonances() {
    const found = modes.slice(0, 36).filter((mode) => mode.frequency >= 40 && mode.frequency <= 5000).slice(0, 12);
    logCli("detected resonances: " + found.map((m) => m.frequency.toFixed(1)).join(", ") + " Hz");
  }

  function stateObject() {
    return {
      baseHz: $("baseHz").value,
      ratioExpr: $("ratioExpr").value,
      amplitude: $("amplitude").value,
      damping: $("damping").value,
      exciterX: $("exciterX").value,
      exciterY: $("exciterY").value,
      shape: $("shape").value,
      material: $("material").value,
      widthMm: $("widthMm").value,
      heightMm: $("heightMm").value,
      thicknessMm: $("thicknessMm").value,
      boundary: $("boundary").value,
      atlasRows: $("atlasRows").value,
      atlasCols: $("atlasCols").value,
      pairMix: $("pairMix").value,
      scaleText: $("scaleText").value,
      viewMode
    };
  }

  function restoreState() {
    const hash = location.hash.match(/s=([^&]+)/);
    const raw = hash ? decodeURIComponent(hash[1]) : localStorage.getItem("chladniPlateLabState");
    if (!raw) return;
    try {
      const st = JSON.parse(atob(raw));
      for (const [key, value] of Object.entries(st)) {
        if ($(key)) $(key).value = value;
      }
      if (st.viewMode) setView(st.viewMode);
    } catch {
      return;
    }
  }

  function saveState() {
    try {
      localStorage.setItem("chladniPlateLabState", btoa(JSON.stringify(stateObject())));
    } catch {
      return;
    }
  }

  function downloadText(filename, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1200);
  }

  function exportJson() {
    downloadText("chladni_plate_lab_state.json", JSON.stringify(stateObject(), null, 2), "application/json");
  }

  function exportCsv() {
    const rows = ["m,n,frequency_hz,ratio_to_fundamental"];
    const f0 = Math.max(0.1, modes[0].frequency);
    for (const mode of modes.slice(0, 80)) rows.push([mode.m, mode.n, mode.frequency.toFixed(6), (mode.frequency / f0).toFixed(8)].join(","));
    downloadText("chladni_modes.csv", rows.join("\n"), "text/csv");
  }

  function exportPng() {
    const out = document.createElement("canvas");
    out.width = plateCanvas.width;
    out.height = plateCanvas.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(plateCanvas, 0, 0);
    ctx.drawImage(sandCanvas, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "chladni_plate_lab.png";
    a.click();
  }

  async function ensureAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    safetyLimiter = audioCtx.createDynamicsCompressor();
    safetyLimiter.threshold.value = -8;
    safetyLimiter.knee.value = 16;
    safetyLimiter.ratio.value = 10;
    safetyLimiter.attack.value = 0.003;
    safetyLimiter.release.value = 0.12;
    masterGain.gain.value = 0.18;
    masterGain.connect(safetyLimiter).connect(audioCtx.destination);
  }

  async function startTone(key, freq) {
    await ensureAudio();
    if (audioCtx.state !== "running") await audioCtx.resume();
    stopTone(key);
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = clamp(freq, 20, 16000);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.48, audioCtx.currentTime + 0.025);
    osc.connect(gain).connect(masterGain);
    osc.start();
    audioVoices.set(key, { osc, gain });
  }

  function stopTone(key) {
    const voice = audioVoices.get(key);
    if (!voice || !audioCtx) return;
    voice.gain.gain.cancelScheduledValues(audioCtx.currentTime);
    voice.gain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.05);
    voice.osc.stop(audioCtx.currentTime + 0.18);
    audioVoices.delete(key);
  }

  function stopAllKeys() {
    for (const key of Array.from(activeKeys.keys())) {
      activeKeys.delete(key);
      stopTone(key);
      setKeyVisual(key, false);
    }
  }

  function setKeyVisual(key, on) {
    const el = document.querySelector(`.key[data-key="${CSS.escape(key)}"]`);
    if (el) el.classList.toggle("active", on);
  }

  function isEditing() {
    const el = document.activeElement;
    if (!el) return false;
    if (el.tagName === "TEXTAREA" || el.tagName === "SELECT") return true;
    if (el.tagName !== "INPUT") return false;
    return !["range", "checkbox", "radio", "button", "submit"].includes(el.type);
  }

  function onKeyDown(e) {
    if (e.repeat || isEditing()) return;
    const key = e.key.toLowerCase();
    const step = keyMap[key];
    if (step == null) return;
    e.preventDefault();
    const frequency = noteFreq(step);
    if (latch && activeKeys.has(key)) {
      activeKeys.delete(key);
      stopTone(key);
      setKeyVisual(key, false);
      return;
    }
    activeKeys.set(key, { frequency, phase: Math.random() * TAU });
    setKeyVisual(key, true);
    startTone(key, frequency);
  }

  function onKeyUp(e) {
    if (latch) return;
    const key = e.key.toLowerCase();
    if (!activeKeys.has(key)) return;
    activeKeys.delete(key);
    stopTone(key);
    setKeyVisual(key, false);
  }

  function setView(next) {
    viewMode = next;
    for (const btn of document.querySelectorAll("#viewTabs button")) btn.classList.toggle("active", btn.dataset.view === next);
  }

  function buildKeyboard() {
    const root = $("keyboard");
    root.innerHTML = "";
    for (const row of keyRows) {
      for (const key of row) {
        const el = document.createElement("div");
        el.className = "key";
        el.dataset.key = key;
        el.textContent = key;
        root.appendChild(el);
      }
    }
    updateKeyboardLabels();
  }

  function updateKeyboardLabels() {
    if (!$("keyboard")) return;
    for (const el of document.querySelectorAll(".key")) {
      const step = keyMap[el.dataset.key];
      if (step == null) continue;
      const freq = noteFreq(step);
      el.title = el.dataset.key + " = " + freq.toFixed(3) + " Hz";
    }
  }

  function initMaterials() {
    const select = $("material");
    for (const [id, mat] of Object.entries(materials)) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = mat.name;
      select.appendChild(opt);
    }
    select.value = "aluminum";
  }

  function wireEvents() {
    for (const el of document.querySelectorAll("input,select,textarea")) {
      el.addEventListener("change", () => {
        if (el.id === "scaleText") {
          try { parseScaleText(); } catch (err) { logCli("scale error: " + err.message); }
        }
        saveState();
        updateAll(true);
      });
      if (el.type === "range" || el.id === "ratioExpr" || el.id === "baseHz") {
        el.addEventListener("input", () => {
          saveState();
          updateAll(true);
        });
      }
    }
    $("playPause").addEventListener("click", () => {
      playing = !playing;
      $("playPause").textContent = playing ? "Pause" : "Play";
    });
    $("stepOnce").addEventListener("click", () => {
      buildField();
      stepParticles(1 / 30);
      drawField();
      drawSand();
    });
    $("resetSand").addEventListener("click", () => resetParticles(true));
    $("scatterSand").addEventListener("click", () => resetParticles(true));
    $("parseScale").addEventListener("click", () => {
      try { parseScaleText(); } catch (err) { logCli("scale error: " + err.message); }
    });
    $("latchMode").addEventListener("click", () => {
      latch = !latch;
      $("latchMode").textContent = latch ? "Latch" : "Gate";
      if (!latch) stopAllKeys();
    });
    $("panic").addEventListener("click", stopAllKeys);
    $("sweepToggle").addEventListener("click", () => startSweep(safeFrequency(), safeFrequency() * 2.5, 18));
    $("findResonances").addEventListener("click", findResonances);
    $("exportPng").addEventListener("click", exportPng);
    $("exportJson").addEventListener("click", exportJson);
    $("exportCsv").addEventListener("click", exportCsv);
    $("shareUrl").addEventListener("click", async () => {
      const encoded = btoa(JSON.stringify(stateObject()));
      const url = location.origin + location.pathname + "#s=" + encodeURIComponent(encoded);
      history.replaceState(null, "", url);
      try {
        await navigator.clipboard.writeText(url);
        logCli("share url copied");
      } catch {
        logCli("share url written to address bar");
      }
    });
    $("cliInput").addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      runCommand($("cliInput").value);
      $("cliInput").value = "";
    });
    $("viewTabs").addEventListener("click", (e) => {
      if (!e.target.dataset.view) return;
      setView(e.target.dataset.view);
      saveState();
    });
    sandCanvas.addEventListener("pointerdown", (e) => {
      const rect = sandCanvas.getBoundingClientRect();
      $("exciterX").value = clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98).toFixed(3);
      $("exciterY").value = clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98).toFixed(3);
      updateAll(true);
    });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", stopAllKeys);
    window.addEventListener("resize", resizeCanvases);
  }

  function frame(nowMs) {
    resizeCanvases();
    const now = nowMs / 1000;
    const dt = clamp((nowMs - lastFrame) / 1000, 0.001, 0.05);
    lastFrame = nowMs;
    updateSweep(now);
    buildField();
    if (playing) stepParticles(dt * 60);
    drawField();
    drawSand();
    renderModeList();
    updateReadouts();
    fpsFilter = fpsFilter * 0.92 + (1 / dt) * 0.08;
    $("fpsStatus").textContent = "FPS: " + fpsFilter.toFixed(0);
    requestAnimationFrame(frame);
  }

  function init() {
    initMaterials();
    buildKeyboard();
    restoreState();
    try { parseScaleText(); } catch (err) { logCli("scale error: " + err.message); }
    wireEvents();
    calculateRectangularModes();
    buildField();
    resetParticles(true);
    resizeCanvases();
    updateReadouts();
    renderModeList();
    renderModeAtlas();
    logCli("ready: click the plate to move the exciter, press a/s/d to excite scale degrees");
    requestAnimationFrame(frame);
  }

  init();
})();
