const TAU_MIN_IM = 0.05;

const els = {
  tauReadout: document.getElementById("tauReadout"),
  xSlider: document.getElementById("xSlider"),
  ySlider: document.getElementById("ySlider"),
  xInput: document.getElementById("xInput"),
  yInput: document.getElementById("yInput"),
  upperCanvas: document.getElementById("upperCanvas"),
  latticeCanvas: document.getElementById("latticeCanvas"),
  torusCanvas: document.getElementById("torusCanvas"),
  qCanvas: document.getElementById("qCanvas"),
  patternCanvas: document.getElementById("patternCanvas"),
  upperStageLabel: document.getElementById("upperStageLabel"),
  patternStageLabel: document.getElementById("patternStageLabel"),
  upperMeta: document.getElementById("upperMeta"),
  latticeMeta: document.getElementById("latticeMeta"),
  qMeta: document.getElementById("qMeta"),
  patternMeta: document.getElementById("patternMeta"),
  seriesGrid: document.getElementById("seriesGrid"),
  accuracyNote: document.getElementById("accuracyNote"),
  explanationText: document.getElementById("explanationText"),
  modeNote: document.getElementById("modeNote"),
  tMinusBtn: document.getElementById("tMinusBtn"),
  tBtn: document.getElementById("tBtn"),
  sBtn: document.getElementById("sBtn"),
  reduceBtn: document.getElementById("reduceBtn"),
  patternDiskBtn: document.getElementById("patternDiskBtn"),
  patternHalfBtn: document.getElementById("patternHalfBtn"),
  patternFunctionSelect: document.getElementById("patternFunctionSelect"),
  patternColorModeSelect: document.getElementById("patternColorModeSelect"),
  patternPaletteBtn: document.getElementById("patternPaletteBtn"),
  savePatternBtn: document.getElementById("savePatternBtn"),
  modePanelMeta: document.getElementById("modePanelMeta"),
  modFormSelect: document.getElementById("modFormSelect"),
  gammaSelect: document.getElementById("gammaSelect"),
  modFormCanvas: document.getElementById("modFormCanvas"),
  modFormReadout: document.getElementById("modFormReadout"),
  levelInput: document.getElementById("levelInput"),
  levelNumberInput: document.getElementById("levelNumberInput"),
  levelCanvas: document.getElementById("levelCanvas"),
  levelReadout: document.getElementById("levelReadout"),
  matrixA: document.getElementById("matrixA"),
  matrixB: document.getElementById("matrixB"),
  matrixC: document.getElementById("matrixC"),
  matrixD: document.getElementById("matrixD"),
  applyMatrixBtn: document.getElementById("applyMatrixBtn"),
  matrixReadout: document.getElementById("matrixReadout"),
  ellipticPresetSelect: document.getElementById("ellipticPresetSelect"),
  ellipticA: document.getElementById("ellipticA"),
  ellipticB: document.getElementById("ellipticB"),
  finiteFieldToggle: document.getElementById("finiteFieldToggle"),
  finitePrime: document.getElementById("finitePrime"),
  ellipticMaxN: document.getElementById("ellipticMaxN"),
  ellipticCoeffMode: document.getElementById("ellipticCoeffMode"),
  ellipticCanvas: document.getElementById("ellipticCanvas"),
  ellipticApCanvas: document.getElementById("ellipticApCanvas"),
  roughLevelBtn: document.getElementById("roughLevelBtn"),
  ellipticReadout: document.getElementById("ellipticReadout"),
  atlasWeightInput: document.getElementById("atlasWeightInput"),
  atlasWeightNumberInput: document.getElementById("atlasWeightNumberInput"),
  atlasSummary: document.getElementById("atlasSummary"),
  atlasList: document.getElementById("atlasList")
};

const state = {
  tau: complex(0.32, 1.18),
  message: "normal",
  tab: "intuition",
  dragging: false,
  patternMode: "disk",
  patternFunction: "domain",
  patternAtlasMonomial: null,
  patternPalette: 0,
  colorMode: "tile",
  activeMode: "modform"
};

const gamma0Cache = new Map();
const representativeColorCache = new Map();

const explanations = {
  normal: {
    intuition: "τ は上半平面上の点です。半透明の τ_F は、同じモジュラー軌道を基本領域へ戻した代表点です。",
    detail: "1 と τ を基底にして、複素平面に Z + Zτ という格子を作ります。τ を動かすと、τ_F、格子、q、q展開が同時に動きます。",
    formula: "Λ = {m + nτ | m,n ∈ Z},  q = exp(2πiτ)。Im(τ) が大きいほど |q| = exp(-2π Im(τ)) は 0 に近づきます。"
  },
  T: {
    intuition: "τ を τ+1 に動かしました。見た目の基底は変わりますが、同じ庭を別の向きから見ている気分です。",
    detail: "T 変換はモジュラー群の基本操作です。格子の生成元を取り替えているので、トーラスの本質的な形は同じものとして扱われます。",
    formula: "T: τ -> τ + 1。行列で書くと [[1,1],[0,1]] が τ に作用しています。"
  },
  S: {
    intuition: "τ を -1/τ に動かしました。格子の基底を大きく取り替える、反転に似た操作です。",
    detail: "S 変換は、横方向と τ 方向の役割を入れ替えるような基本操作です。上半平面は上半平面へ写ります。",
    formula: "S: τ -> -1/τ。行列で書くと [[0,-1],[1,0]] で、ad - bc = 1 を満たします。"
  },
  reduce: {
    intuition: "τ を基本領域へ戻しました。いろいろな τ の代表を、中央の標準的な庭に集めています。",
    detail: "Re(τ) を -1/2 から 1/2 に寄せ、|τ| が 1 未満なら S 変換で外へ押し出す操作を繰り返しています。",
    formula: "基本領域は |Re(τ)| <= 1/2 かつ |τ| >= 1。ここでは T と S を反復して近似的に代表元へ戻しています。"
  },
  q: {
    intuition: "q は単位円の中の点です。τ が上へ行くほど q は中心へ近づき、τ が横へ動くと q は回転します。",
    detail: "q 展開は、τ をそのまま見る代わりに q = exp(2πiτ) で関数を見る方法です。上半平面の上の方では収束がよくなります。",
    formula: "τ = x + iy のとき q = exp(2πix) exp(-2πy)。したがって |q| = exp(-2πy), arg(q) = 2πx です。"
  },
  pattern: {
    intuition: "赤とシアンの模様は、上半平面を基本領域のコピーで敷き詰めた地図です。関数を選ぶと、その値の位相でも色が変わります。",
    detail: "各点を S と T の操作で基本領域へ戻し、基本領域、E4、E6、Δ、j のどれを見るかで色分けを切り替えています。",
    formula: "T: τ -> τ+1 と S: τ -> -1/τ を繰り返し、|Re(τ)| <= 1/2, |τ| >= 1 へ還元します。円板表示には w = (τ - i)/(τ + i) を使っています。"
  }
};

function complex(re, im) {
  return { re, im };
}

function add(a, b) {
  return complex(a.re + b.re, a.im + b.im);
}

function sub(a, b) {
  return complex(a.re - b.re, a.im - b.im);
}

function mul(a, b) {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}

function mulReal(a, r) {
  return complex(a.re * r, a.im * r);
}

function div(a, b) {
  const d = b.re * b.re + b.im * b.im;
  return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
}

function abs(a) {
  return Math.hypot(a.re, a.im);
}

function arg(a) {
  return Math.atan2(a.im, a.re);
}

function expComplex(a) {
  const er = Math.exp(a.re);
  return complex(er * Math.cos(a.im), er * Math.sin(a.im));
}

function powComplex(a, n) {
  let result = complex(1, 0);
  for (let i = 0; i < n; i += 1) result = mul(result, a);
  return result;
}

function qFromTau(tau) {
  return expComplex(complex(-2 * Math.PI * tau.im, 2 * Math.PI * tau.re));
}

function sigma(n, k) {
  let sum = 0;
  for (let d = 1; d <= n; d += 1) {
    if (n % d === 0) sum += Math.pow(d, k);
  }
  return sum;
}

function E4(q, terms = 20) {
  let sum = complex(1, 0);
  for (let n = 1; n <= terms; n += 1) {
    sum = add(sum, mulReal(powComplex(q, n), 240 * sigma(n, 3)));
  }
  return sum;
}

function E6(q, terms = 20) {
  let sum = complex(1, 0);
  for (let n = 1; n <= terms; n += 1) {
    sum = add(sum, mulReal(powComplex(q, n), -504 * sigma(n, 5)));
  }
  return sum;
}

const tauCoeffs = [0, 1, -24, 252, -1472, 4830, -6048, -16744, 84480, -113643, -115920];
const e4Coeffs = [1, ...Array.from({ length: 12 }, (_, i) => 240 * sigma(i + 1, 3))];
const e6Coeffs = [1, ...Array.from({ length: 12 }, (_, i) => -504 * sigma(i + 1, 5))];

function Delta(q, terms = 10) {
  let sum = complex(0, 0);
  const max = Math.min(terms, tauCoeffs.length - 1);
  for (let n = 1; n <= max; n += 1) {
    sum = add(sum, mulReal(powComplex(q, n), tauCoeffs[n]));
  }
  return sum;
}

function seriesFromCoeffs(q, coeffs, startAt = 0) {
  let sum = complex(startAt === 0 ? coeffs[0] : 0, 0);
  let power = complex(1, 0);
  for (let n = 1; n < coeffs.length; n += 1) {
    power = mul(power, q);
    sum = add(sum, mulReal(power, coeffs[n]));
  }
  return sum;
}

function convolveSeries(a, b, terms) {
  const out = Array.from({ length: terms + 1 }, () => 0);
  for (let i = 0; i <= terms; i += 1) {
    for (let j = 0; j <= terms - i; j += 1) {
      out[i + j] += (a[i] || 0) * (b[j] || 0);
    }
  }
  return out;
}

function powSeries(base, exponent, terms) {
  let out = Array.from({ length: terms + 1 }, (_, i) => (i === 0 ? 1 : 0));
  for (let i = 0; i < exponent; i += 1) out = convolveSeries(out, base, terms);
  return out;
}

function monomialCoeffs(aPower, bPower, terms = 8) {
  const e4 = e4Coeffs.slice(0, terms + 1);
  const e6 = e6Coeffs.slice(0, terms + 1);
  return convolveSeries(powSeries(e4, aPower, terms), powSeries(e6, bPower, terms), terms);
}

function levelOneBasis(weight) {
  const basis = [];
  for (let a = 0; a * 4 <= weight; a += 1) {
    const rest = weight - a * 4;
    if (rest >= 0 && rest % 6 === 0) basis.push({ a, b: rest / 6 });
  }
  return basis.sort((x, y) => x.b - y.b || y.a - x.a);
}

function monomialName(aPower, bPower) {
  const parts = [];
  if (aPower > 0) parts.push(aPower === 1 ? "E4" : `E4^${aPower}`);
  if (bPower > 0) parts.push(bPower === 1 ? "E6" : `E6^${bPower}`);
  return parts.length ? parts.join(" ") : "1";
}

function formatQExpansion(coeffs) {
  return coeffs.map((coeff, n) => {
    const rounded = Math.round(coeff);
    if (n === 0) return `${rounded}`;
    const sign = rounded < 0 ? " - " : " + ";
    const absCoeff = Math.abs(rounded);
    const coeffText = absCoeff === 1 ? "" : `${absCoeff}`;
    const qText = n === 1 ? "q" : `q^${n}`;
    return `${sign}${coeffText}${qText}`;
  }).join("").replace(/^0 \+ /, "");
}

function jInvariant(q) {
  const e4 = E4(q);
  const delta = Delta(q);
  if (abs(delta) < 1e-14) return complex(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  return div(powComplex(e4, 3), delta);
}

function modFormValue(name, tau) {
  const q = qFromTau(tau);
  if (name === "E6") return E6(q);
  if (name === "Delta") return Delta(q);
  return E4(q);
}

function modFormWeight(name) {
  if (name === "E6") return 6;
  if (name === "Delta") return 12;
  return 4;
}

function getGammaMatrix(key) {
  if (key === "T") return { a: 1, b: 1, c: 0, d: 1 };
  if (key === "ST") return { a: 0, b: -1, c: 1, d: 1 };
  return { a: 0, b: -1, c: 1, d: 0 };
}

function applyMatrix(tau, matrix) {
  return div(add(mulReal(tau, matrix.a), complex(matrix.b, 0)), add(mulReal(tau, matrix.c), complex(matrix.d, 0)));
}

function matrixDet(matrix) {
  return matrix.a * matrix.d - matrix.b * matrix.c;
}

function multiplyMatrices(left, right) {
  return {
    a: left.a * right.a + left.b * right.c,
    b: left.a * right.b + left.b * right.d,
    c: left.c * right.a + left.d * right.c,
    d: left.c * right.b + left.d * right.d
  };
}

function inverseMatrix(matrix) {
  return { a: matrix.d, b: -matrix.b, c: -matrix.c, d: matrix.a };
}

function complexPowInteger(z, n) {
  let result = complex(1, 0);
  for (let i = 0; i < n; i += 1) result = mul(result, z);
  return result;
}

function transformS(tau) {
  return div(complex(-1, 0), tau);
}

function transformT(tau, n = 1) {
  return add(tau, complex(n, 0));
}

function normalizeByT(tau) {
  const shift = Math.round(tau.re);
  return {
    z: transformT(tau, -shift),
    shift
  };
}

function reduceToFundamentalDomain(tau) {
  let z = complex(tau.re, tau.im);
  for (let i = 0; i < 50; i += 1) {
    const n = Math.round(z.re);
    z = sub(z, complex(n, 0));
    if (abs(z) < 1) {
      z = transformS(z);
      continue;
    }
    if (Math.abs(z.re) <= 0.5 && abs(z) >= 1) return z;
  }
  return z;
}

function clampTau(tau) {
  return complex(Math.max(-5, Math.min(5, tau.re)), Math.max(TAU_MIN_IM, Math.min(3, tau.im)));
}

function setTau(tau, message = state.message) {
  state.tau = clampTau(tau);
  state.message = message;
  syncInputs();
  render();
}

function syncInputs() {
  const x = state.tau.re.toFixed(2);
  const y = state.tau.im.toFixed(2);
  els.xSlider.value = x;
  els.ySlider.value = y;
  els.xInput.value = x;
  els.yInput.value = y;
}

function formatComplex(z, digits = 4) {
  if (!Number.isFinite(z.re) || !Number.isFinite(z.im)) return "huge";
  const re = formatNumber(z.re, digits);
  const im = formatNumber(Math.abs(z.im), digits);
  const sign = z.im < 0 ? "-" : "+";
  return `${re} ${sign} ${im}i`;
}

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) return "huge";
  const absValue = Math.abs(value);
  if ((absValue > 0 && absValue < 0.0001) || absValue >= 100000) return value.toExponential(3);
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
}

function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0b0f0d";
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(ctx, width, height, toScreen, xMin, xMax, yMin, yMax, step = 0.5) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#263126";
  for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
    const a = toScreen(complex(x, yMin));
    const b = toScreen(complex(x, yMax));
    line(ctx, a.x, a.y, b.x, b.y);
  }
  for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) {
    const a = toScreen(complex(xMin, y));
    const b = toScreen(complex(xMax, y));
    line(ctx, a.x, a.y, b.x, b.y);
  }
  ctx.strokeStyle = "#536050";
  const ax = toScreen(complex(0, yMin));
  const bx = toScreen(complex(0, yMax));
  line(ctx, ax.x, ax.y, bx.x, bx.y);
  const ay = toScreen(complex(xMin, 0));
  const by = toScreen(complex(xMax, 0));
  line(ctx, ay.x, ay.y, by.x, by.y);
}

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawPoint(ctx, x, y, color, radius = 5) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#10140f";
  ctx.stroke();
}

function drawGhostPoint(ctx, x, y, color, radius = 8) {
  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#f4f1e7";
  ctx.stroke();
  ctx.restore();
}

function drawArrow(ctx, from, to, color, label) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  line(ctx, from.x, from.y, to.x, to.y);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - 10 * Math.cos(angle - 0.45), to.y - 10 * Math.sin(angle - 0.45));
  ctx.lineTo(to.x - 10 * Math.cos(angle + 0.45), to.y - 10 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = "13px Segoe UI, sans-serif";
    ctx.fillText(label, to.x + 8, to.y - 8);
  }
}

function drawUpperHalfPlane() {
  const { ctx, width, height } = setupCanvas(els.upperCanvas);
  clear(ctx, width, height);
  const margin = 28;
  const xMin = -5;
  const xMax = 5;
  const yMin = 0;
  const yMax = 3;
  const toScreen = (z) => ({
    x: margin + ((z.re - xMin) / (xMax - xMin)) * (width - margin * 2),
    y: height - margin - ((z.im - yMin) / (yMax - yMin)) * (height - margin * 2)
  });

  drawGrid(ctx, width, height, toScreen, xMin, xMax, yMin, yMax, 0.5);
  if (state.activeMode === "level") drawLevelOverlayOnUpper(ctx, toScreen, currentLevel(), yMax);

  ctx.fillStyle = "rgba(117, 197, 216, 0.12)";
  ctx.strokeStyle = "#75c5d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const leftTop = toScreen(complex(-0.5, yMax));
  const rightTop = toScreen(complex(0.5, yMax));
  ctx.moveTo(leftTop.x, leftTop.y);
  ctx.lineTo(leftTop.x, toScreen(complex(-0.5, Math.sqrt(0.75))).y);
  for (let t = Math.PI * 5 / 6; t >= Math.PI / 6; t -= 0.02) {
    const p = toScreen(complex(Math.cos(t), Math.sin(t)));
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(rightTop.x, rightTop.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const levelReduction = state.activeMode === "level" ? reduceToGamma0Domain(state.tau, currentLevel()) : null;
  const representativeTau = levelReduction ? levelReduction.z : reduceToFundamentalDomain(state.tau);
  const pf = toScreen(representativeTau);
  const sameTau = abs(sub(state.tau, representativeTau)) < 0.01;
  const representativeLabel = levelReduction ? "τ_Γ0" : "τ_F";
  if (pf.x >= 0 && pf.x <= width && pf.y >= 0 && pf.y <= height) {
    drawGhostPoint(ctx, pf.x, pf.y, "#f4f1e7", sameTau ? 10 : 8);
    if (!sameTau) {
      const p0 = toScreen(state.tau);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#f4f1e7";
      ctx.lineWidth = 1.5;
      line(ctx, p0.x, p0.y, pf.x, pf.y);
      ctx.restore();
    }
    ctx.fillStyle = "rgba(244, 241, 231, 0.82)";
    ctx.font = "12px Cascadia Mono, Consolas, monospace";
    ctx.fillText(representativeLabel, pf.x + 10, pf.y + 16);
  }

  const p = toScreen(state.tau);
  drawPoint(ctx, p.x, p.y, "#efc769", 7);
  ctx.fillStyle = "#f4f1e7";
  ctx.font = "13px Cascadia Mono, Consolas, monospace";
  ctx.fillText("τ", p.x + 10, p.y - 10);
  if (state.activeMode === "level") {
    const patchText = levelReduction.inPatch ? levelReduction.representative.label : "WARNING outside patches";
    els.upperMeta.textContent = sameTau
      ? `Γ0(${currentLevel()}) ${patchText}`
      : `Γ0(${currentLevel()}) ${patchText} / τ_Γ0 = ${formatComplex(representativeTau, 2)}`;
  } else {
    els.upperMeta.textContent = sameTau ? "τ = τ_F" : `τ_F = ${formatComplex(representativeTau, 2)}`;
  }
}

function drawLevelOverlayOnUpper(ctx, toScreen, n, yMax) {
  if (n === 1) return;
  const tilePalette = ["#75c5d8", "#efc769", "#86d48b", "#ee7c7c", "#b99cff", "#ff9ab0", "#78a8ff", "#f0a35d"];
  const reps = gamma0CosetRepresentatives(n).slice(0, 12);
  ctx.save();
  reps.forEach((rep, index) => {
    const color = tilePalette[index % tilePalette.length];
    drawGamma0CosetPatch(ctx, toScreen, rep, color, `${color}18`, yMax);
    const label = toScreen(applyMatrix(complex(0, Math.min(yMax - 0.4, 1.45)), inverseMatrix(rep.matrix)));
    ctx.fillStyle = "rgba(244, 241, 231, 0.82)";
    ctx.font = "10px Cascadia Mono, Consolas, monospace";
    if (Number.isFinite(label.x) && Number.isFinite(label.y)) ctx.fillText(rep.label, label.x - 16, label.y);
  });
  drawCusps(ctx, toScreen, n);
  ctx.restore();
}

function drawLattice() {
  const { ctx, width, height } = setupCanvas(els.latticeCanvas);
  clear(ctx, width, height);
  const center = { x: width / 2, y: height / 2 };
  const scale = Math.min(width, height) / 7;
  const toScreen = (z) => ({ x: center.x + z.re * scale, y: center.y - z.im * scale });

  ctx.strokeStyle = "#263126";
  ctx.lineWidth = 1;
  for (let x = -4; x <= 4; x += 1) line(ctx, center.x + x * scale, 0, center.x + x * scale, height);
  for (let y = -4; y <= 4; y += 1) line(ctx, 0, center.y + y * scale, width, center.y + y * scale);

  const pts = [];
  for (let m = -7; m <= 7; m += 1) {
    for (let n = -7; n <= 7; n += 1) pts.push(add(complex(m, 0), mulReal(state.tau, n)));
  }
  pts.forEach((z) => {
    const p = toScreen(z);
    if (p.x >= -8 && p.x <= width + 8 && p.y >= -8 && p.y <= height + 8) drawPoint(ctx, p.x, p.y, "#86d48b", 2.4);
  });

  const zero = toScreen(complex(0, 0));
  const one = toScreen(complex(1, 0));
  const tau = toScreen(state.tau);
  const oneTau = toScreen(add(complex(1, 0), state.tau));
  ctx.strokeStyle = "rgba(239, 199, 105, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(zero.x, zero.y);
  ctx.lineTo(one.x, one.y);
  ctx.lineTo(oneTau.x, oneTau.y);
  ctx.lineTo(tau.x, tau.y);
  ctx.closePath();
  ctx.stroke();
  drawArrow(ctx, zero, one, "#75c5d8", "1");
  drawArrow(ctx, zero, tau, "#efc769", "τ");
  els.latticeMeta.textContent = `τ = ${formatComplex(state.tau, 2)}`;
}

function drawTorus() {
  const { ctx, width, height } = setupCanvas(els.torusCanvas);
  clear(ctx, width, height);
  const center = { x: width / 2, y: height / 2 + 12 };
  const scale = Math.min(width, height) / 4.6;
  const toScreen = (z) => ({ x: center.x + z.re * scale, y: center.y - z.im * scale });
  const z0 = toScreen(complex(0, 0));
  const z1 = toScreen(complex(1, 0));
  const zt = toScreen(state.tau);
  const z1t = toScreen(add(complex(1, 0), state.tau));

  ctx.fillStyle = "rgba(185, 161, 241, 0.12)";
  ctx.strokeStyle = "#b9a1f1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(z0.x, z0.y);
  ctx.lineTo(z1.x, z1.y);
  ctx.lineTo(z1t.x, z1t.y);
  ctx.lineTo(zt.x, zt.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawArrow(ctx, z0, z1, "#75c5d8", "1");
  drawArrow(ctx, z0, zt, "#efc769", "τ");
  ctx.strokeStyle = "#86d48b";
  ctx.setLineDash([6, 6]);
  line(ctx, z0.x, z0.y, zt.x, zt.y);
  line(ctx, z1.x, z1.y, z1t.x, z1t.y);
  ctx.strokeStyle = "#ee7c7c";
  line(ctx, z0.x, z0.y, z1.x, z1.y);
  line(ctx, zt.x, zt.y, z1t.x, z1t.y);
  ctx.setLineDash([]);
  ctx.fillStyle = "#b8bdad";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText("opposite edges are glued", 14, 22);
}

function drawQDisk() {
  const q = qFromTau(state.tau);
  const { ctx, width, height } = setupCanvas(els.qCanvas);
  clear(ctx, width, height);
  const center = { x: width / 2, y: height / 2 };
  const r = Math.max(28, Math.min(width, height) * 0.38);
  ctx.strokeStyle = "#536050";
  ctx.lineWidth = 1;
  line(ctx, center.x - r - 16, center.y, center.x + r + 16, center.y);
  line(ctx, center.x, center.y - r - 16, center.x, center.y + r + 16);
  ctx.strokeStyle = "#75c5d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
  ctx.stroke();
  const p = { x: center.x + q.re * r, y: center.y - q.im * r };
  drawPoint(ctx, p.x, p.y, "#efc769", 6);
  ctx.strokeStyle = "rgba(239,199,105,0.45)";
  line(ctx, center.x, center.y, p.x, p.y);
  els.qMeta.textContent = `|q| = ${formatNumber(abs(q), 4)}`;
}

function diskToUpper(w) {
  return mul(complex(0, 1), div(add(complex(1, 0), w), sub(complex(1, 0), w)));
}

function upperToDisk(z) {
  return div(sub(z, complex(0, 1)), add(z, complex(0, 1)));
}

function reduceWithTrace(z) {
  let w = complex(z.re, Math.max(z.im, 0.00001));
  let matrix = { a: 1, b: 0, c: 0, d: 1 };
  let steps = 0;
  let flips = 0;
  let shifts = 0;
  for (let i = 0; i < 80; i += 1) {
    const n = Math.round(w.re);
    if (n !== 0) {
      w = sub(w, complex(n, 0));
      matrix = multiplyMatrices({ a: 1, b: -n, c: 0, d: 1 }, matrix);
      shifts += Math.abs(n);
      steps += Math.abs(n);
    }
    if (abs(w) < 1) {
      w = transformS(w);
      matrix = multiplyMatrices({ a: 0, b: -1, c: 1, d: 0 }, matrix);
      flips += 1;
      steps += 1;
      continue;
    }
    break;
  }
  return { z: w, matrix, steps, flips, shifts };
}

function modularPatternValue(z) {
  if (state.patternAtlasMonomial) {
    return monomialValueAtTau(z, state.patternAtlasMonomial.a, state.patternAtlasMonomial.b);
  }
  const q = qFromTau(z);
  if (state.patternFunction === "e4") return seriesFromCoeffs(q, e4Coeffs);
  if (state.patternFunction === "e6") return seriesFromCoeffs(q, e6Coeffs);
  if (state.patternFunction === "delta") return seriesFromCoeffs(q, tauCoeffs);
  if (state.patternFunction === "j") {
    const e4 = seriesFromCoeffs(q, e4Coeffs);
    const delta = seriesFromCoeffs(q, tauCoeffs);
    if (abs(delta) < 1e-12) return complex(1e12, 0);
    return div(powComplex(e4, 3), delta);
  }
  return null;
}

function functionLabel() {
  if (state.patternAtlasMonomial) return monomialName(state.patternAtlasMonomial.a, state.patternAtlasMonomial.b);
  if (state.patternFunction === "e4") return "E4";
  if (state.patternFunction === "e6") return "E6";
  if (state.patternFunction === "delta") return "Delta";
  if (state.patternFunction === "j") return "j";
  return "domain";
}

function patternColor(trace, source, mode, radius) {
  if (state.activeMode === "level") return levelPatternColor(trace, source, mode, radius, currentLevel());
  return functionPatternColor(trace, source, mode, radius);
}

function functionPatternColor(trace, source, mode, radius) {
  const local = trace.z;
  const value = modularPatternValue(local);
  const phase = value ? arg(value) : 0;
  const magnitude = value ? Math.log1p(Math.min(1e6, abs(value))) : 0;
  const stripe = value
    ? Math.floor((phase + Math.PI) / (Math.PI / 8))
    : Math.floor((local.re + 0.5) * 8);
  const curveBand = Math.floor(Math.max(0, -Math.log(Math.max(0.00001, local.im))) * 3.2);
  const parity = (trace.flips + trace.shifts + stripe + curveBand + Math.floor(magnitude)) % 2;
  const edge = mode === "disk" ? Math.max(0, Math.min(1, radius)) : Math.exp(-Math.min(4, source.im));
  const wave = value
    ? Math.sin(phase * 3 + magnitude * 0.8 + trace.steps * 0.35)
    : Math.sin(18 * Math.atan2(source.im, source.re) + trace.steps * 0.7);
  const glow = Math.max(0, Math.min(1, 0.52 + 0.32 * wave + 0.2 * edge));
  const palettes = [
    parity === 0 ? [255, 25, 17] : [8, 218, 221],
    parity === 0 ? [255, 42, 13] : [16, 184, 238],
    parity === 0 ? [220, 18, 196] : [10, 216, 229]
  ];
  const base = palettes[state.patternPalette % palettes.length];
  return [
    Math.round(base[0] * glow + 18 * (1 - glow)),
    Math.round(base[1] * glow + 18 * (1 - glow)),
    Math.round(base[2] * glow + 18 * (1 - glow)),
    255
  ];
}

function levelPatternColor(trace, source, mode, radius, n) {
  if (state.colorMode === "function") return functionPatternColor(trace, source, mode, radius);
  if (state.colorMode === "representative") return representativePatternColor(source, mode, radius, n);
  const reps = gamma0CosetRepresentatives(n);
  const classIndex = p1ClassIndexForMatrix(trace.matrix, n);
  const inGamma0 = (reps[classIndex] || reps[0])?.label === "[0:1]";
  const cuspBand = Math.floor((trace.z.re + 0.5) * Math.max(2, reps.length));
  const heightBand = Math.floor(Math.max(0, -Math.log(Math.max(0.00001, trace.z.im))) * 2.8);
  const parity = mod(classIndex + cuspBand + heightBand + trace.flips, 2);
  return classIndexedColor(classIndex, parity, source, radius, mode, inGamma0);
}

function representativePatternColor(source, mode, radius, n) {
  const key = `${n}:${Math.round(source.re * 45)}:${Math.round(source.im * 45)}`;
  let classIndex = representativeColorCache.get(key);
  if (classIndex === undefined) {
    const reduced = reduceToGamma0Domain(source, n);
    classIndex = reduced.representative ? reduced.representative.index : 0;
    representativeColorCache.set(key, classIndex);
  }
  return classIndexedColor(classIndex, classIndex % 2, source, radius, mode, classIndex === 0);
}

function classIndexedColor(classIndex, parity, source, radius, mode, highlight = false) {
  const hueIndex = mod(classIndex, 8);
  const palette = [
    [117, 197, 216],
    [239, 199, 105],
    [134, 212, 139],
    [238, 124, 124],
    [185, 156, 255],
    [255, 154, 176],
    [120, 168, 255],
    [240, 163, 93]
  ];
  const base = palette[hueIndex];
  const edge = mode === "disk" ? Math.max(0, Math.min(1, radius)) : Math.exp(-Math.min(4, source.im));
  const wave = Math.sin(classIndex * 1.7 + source.re * 3 + source.im * 0.8);
  const glow = Math.max(0, Math.min(1, 0.48 + 0.25 * wave + 0.18 * edge + (highlight ? 0.16 : 0)));
  const contrast = parity === 0 ? 1 : 0.62;
  return [
    Math.round(base[0] * glow * contrast + 18 * (1 - glow)),
    Math.round(base[1] * glow * contrast + 18 * (1 - glow)),
    Math.round(base[2] * glow * contrast + 18 * (1 - glow)),
    255
  ];
}

function monomialValueAtTau(z, aPower, bPower) {
  const q = qFromTau(z);
  return mul(complexPowInteger(seriesFromCoeffs(q, e4Coeffs), aPower), complexPowInteger(seriesFromCoeffs(q, e6Coeffs), bPower));
}

function atlasPatternColor(trace, source, radius, aPower, bPower) {
  const value = monomialValueAtTau(trace.z, aPower, bPower);
  const phase = arg(value);
  const magnitude = Math.log1p(Math.min(1e6, abs(value)));
  const stripe = Math.floor((phase + Math.PI) / (Math.PI / 9));
  const parity = (trace.flips + trace.shifts + stripe + Math.floor(magnitude)) % 2;
  const wave = Math.sin(phase * 4 + magnitude * 0.7 + trace.steps * 0.4);
  const glow = Math.max(0, Math.min(1, 0.52 + 0.28 * wave + 0.18 * radius));
  const base = parity === 0 ? [255, 36, 18] : [8, 214, 224];
  return [
    Math.round(base[0] * glow + 20 * (1 - glow)),
    Math.round(base[1] * glow + 20 * (1 - glow)),
    Math.round(base[2] * glow + 20 * (1 - glow)),
    255
  ];
}

function drawPatternOverlay(ctx, width, height, mode, mapPoint) {
  const tauPoint = mode === "disk" ? upperToDisk(state.tau) : state.tau;
  const p = mapPoint(tauPoint);
  if (!p) return;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#f4f1e7";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#11140f";
  ctx.stroke();
  ctx.fillStyle = "#f4f1e7";
  ctx.font = "13px Cascadia Mono, Consolas, monospace";
  ctx.fillText("τ", Math.min(width - 22, p.x + 9), Math.max(16, p.y - 8));
}

function drawModularPattern() {
  representativeColorCache.clear();
  const canvas = els.patternCanvas;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);
  const data = image.data;
  const mode = state.patternMode;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.46;

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const i = (py * width + px) * 4;
      let z = null;
      let radius = 0;
      if (mode === "disk") {
        const u = (px - cx) / r;
        const v = (cy - py) / r;
        radius = Math.hypot(u, v);
        if (radius < 0.995) z = diskToUpper(complex(u, v));
      } else {
        const x = -3 + (px / Math.max(1, width - 1)) * 6;
        const y = 2.9 - (py / Math.max(1, height - 1)) * 2.9;
        if (y > 0.015) z = complex(x, y);
        radius = Math.min(1, Math.exp(-y));
      }
      if (!z || !Number.isFinite(z.re) || !Number.isFinite(z.im) || z.im <= 0) {
        data[i] = 244;
        data[i + 1] = 241;
        data[i + 2] = 231;
        data[i + 3] = mode === "disk" ? 255 : 0;
        continue;
      }
      const color = patternColor(reduceWithTrace(z), z, mode, radius);
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }
  }

  ctx.putImageData(image, 0, 0);
  ctx.save();
  ctx.scale(dpr, dpr);
  const cssWidth = rect.width;
  const cssHeight = rect.height;
  if (mode === "disk") {
    const cr = Math.min(cssWidth, cssHeight) * 0.46;
    const ccx = cssWidth / 2;
    const ccy = cssHeight / 2;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(244, 241, 231, 0.8)";
    ctx.beginPath();
    ctx.arc(ccx, ccy, cr, 0, Math.PI * 2);
    ctx.stroke();
    const mapPoint = (w) => ({ x: ccx + w.re * cr, y: ccy - w.im * cr });
    drawPatternOverlay(ctx, cssWidth, cssHeight, mode, mapPoint);
  } else {
    const mapPoint = (z) => ({
      x: ((z.re + 3) / 6) * cssWidth,
      y: ((2.9 - z.im) / 2.9) * cssHeight
    });
    ctx.strokeStyle = "rgba(244, 241, 231, 0.72)";
    ctx.lineWidth = 1;
    for (let x = -3; x <= 3; x += 1) {
      const sx = mapPoint(complex(x, 1)).x;
      line(ctx, sx, 0, sx, cssHeight);
    }
    drawPatternOverlay(ctx, cssWidth, cssHeight, mode, mapPoint);
  }
  ctx.restore();
  els.patternMeta.textContent = state.activeMode === "level"
    ? `Γ0(${currentLevel()}) / ${state.colorMode} / ${mode === "disk" ? "Poincare disk" : "upper half-plane"}`
    : `${functionLabel()} / ${mode === "disk" ? "Poincare disk" : "upper half-plane"}`;
}

function syncModeControls() {
  document.querySelectorAll(".mode-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.activeMode);
  });
  document.querySelectorAll(".mode-body").forEach((body) => {
    body.classList.toggle("active", body.dataset.modeBody === state.activeMode);
  });
  els.patternDiskBtn.classList.toggle("active", state.patternMode === "disk");
  els.patternHalfBtn.classList.toggle("active", state.patternMode === "half");
  els.patternFunctionSelect.value = state.patternFunction;
  els.patternColorModeSelect.value = state.colorMode;
  els.levelInput.value = Math.min(30, currentLevel());
  els.levelNumberInput.value = currentLevel();
}

function restoreStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tauText = params.get("tau");
  if (tauText) {
    const [re, im] = tauText.split(",").map(Number);
    if (Number.isFinite(re) && Number.isFinite(im)) state.tau = clampTau(complex(re, im));
  }
  const mode = params.get("activeMode");
  if (["modform", "level", "matrix", "elliptic", "atlas"].includes(mode)) state.activeMode = mode;
  const n = Number(params.get("N"));
  if (Number.isFinite(n) && n >= 1) {
    els.levelNumberInput.value = String(Math.round(n));
    els.levelInput.value = String(Math.min(30, Math.round(n)));
  }
  const patternMode = params.get("patternMode");
  if (["disk", "half"].includes(patternMode)) state.patternMode = patternMode;
  const patternFunction = params.get("patternFunction");
  if (["domain", "e4", "e6", "delta", "j"].includes(patternFunction)) state.patternFunction = patternFunction;
  const palette = Number(params.get("patternPalette"));
  if (Number.isFinite(palette)) state.patternPalette = Math.max(0, Math.round(palette));
  const colorMode = params.get("colorMode");
  if (["tile", "representative", "function"].includes(colorMode)) state.colorMode = colorMode;
  syncModeControls();
}

function updateUrlState() {
  const params = new URLSearchParams();
  params.set("tau", `${formatNumber(state.tau.re, 4)},${formatNumber(state.tau.im, 4)}`);
  params.set("activeMode", state.activeMode);
  params.set("N", String(currentLevel()));
  params.set("patternMode", state.patternMode);
  params.set("patternFunction", state.patternFunction);
  params.set("patternPalette", String(state.patternPalette));
  params.set("colorMode", state.colorMode);
  const next = `${window.location.pathname}?${params.toString()}`;
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState(null, "", next);
  }
}

function savePatternPng() {
  const link = document.createElement("a");
  link.download = `modular-garden-${state.activeMode}-N${currentLevel()}-${state.patternMode}-${state.colorMode}.png`;
  link.href = els.patternCanvas.toDataURL("image/png");
  link.click();
}

function renderSeries() {
  const q = qFromTau(state.tau);
  const e4 = E4(q);
  const e6 = E6(q);
  const delta = Delta(q);
  const j = jInvariant(q);
  const items = [
    ["τ", formatComplex(state.tau, 4)],
    ["q", formatComplex(q, 5)],
    ["E4(q)", formatComplex(e4, 5)],
    ["E6(q)", formatComplex(e6, 5)],
    ["Δ(q)", formatComplex(delta, 5)],
    ["j(q)", formatComplex(j, 5)]
  ];
  els.seriesGrid.innerHTML = items.map(([name, value]) => (
    `<div class="series-item"><strong>${name}</strong><code>${value}</code></div>`
  )).join("");
  els.accuracyNote.textContent = state.tau.im < 0.35
    ? "Im(τ) is small: rough q-series"
    : "q-series approximation";
}

function renderExplanation() {
  const key = state.message in explanations ? state.message : "normal";
  els.explanationText.textContent = explanations[key][state.tab];
  els.modeNote.textContent = state.tab;
}

function renderModFormMode() {
  const name = els.modFormSelect.value;
  const weight = modFormWeight(name);
  const matrix = getGammaMatrix(els.gammaSelect.value);
  const gammaTau = applyMatrix(state.tau, matrix);
  const left = modFormValue(name, gammaTau);
  const right = mul(complexPowInteger(add(mulReal(state.tau, matrix.c), complex(matrix.d, 0)), weight), modFormValue(name, state.tau));
  const diff = sub(left, right);
  drawModFormVectors(left, right, diff);
  els.modFormReadout.innerHTML = modeLines([
    `<strong>${name} の重さ ${weight}</strong>`,
    `γτ = ${formatComplex(gammaTau, 4)}`,
    `f(γτ) = ${formatComplex(left, 4)}`,
    `(cτ+d)^k f(τ) = ${formatComplex(right, 4)}`,
    `差 = ${formatComplex(diff, 4)}`
  ]);
}

function modeLines(lines) {
  return lines.map((line) => `<div>${line}</div>`).join("");
}

function drawModFormVectors(left, right, diff) {
  const { ctx, width, height } = setupCanvas(els.modFormCanvas);
  clear(ctx, width, height);
  const center = { x: width / 2, y: height / 2 };
  const maxAbs = Math.max(0.0001, abs(left), abs(right), abs(diff) * 5);
  const scale = Math.min(width, height) * 0.36 / maxAbs;
  const toPoint = (z) => ({ x: center.x + z.re * scale, y: center.y - z.im * scale });
  ctx.strokeStyle = "#536050";
  ctx.lineWidth = 1;
  line(ctx, 10, center.y, width - 10, center.y);
  line(ctx, center.x, 10, center.x, height - 10);
  drawArrow(ctx, center, toPoint(left), "#75c5d8", "f(γτ)");
  drawArrow(ctx, center, toPoint(right), "#efc769", "(cτ+d)^k f");
  drawArrow(ctx, center, toPoint(mulReal(diff, 5)), "#ee7c7c", "5x diff");
}

function currentLevel() {
  const n = Math.max(1, Math.round(Number(els.levelNumberInput.value) || Number(els.levelInput.value) || 1));
  return n;
}

function renderLevelMode() {
  const n = currentLevel();
  const matrix = readMatrixInputs();
  const matrixStatus = gamma0Status(matrix, n);
  const reps = gamma0RepresentativeSamples(n);
  const p1Count = p1Classes(n).length;
  const repCount = gamma0CosetRepresentatives(n).length;
  const index = gamma0Index(n);
  const cusps = cuspSamples(n);
  const examples = smallLevelExamples(n);
  const reduction = reduceToGamma0Domain(state.tau, n);
  els.levelInput.value = Math.min(30, n);
  els.levelNumberInput.value = n;
  drawLevelDomain(n);
  els.levelReadout.innerHTML = modeLines([
    `<strong>検算 / Γ0(${n})</strong>`,
    `N = ${n}`,
    `index = N * Π_{p|N}(1 + 1/p) = ${index}`,
    `P^1(Z/${n}Z) classes = ${p1Count}`,
    `gamma0CosetRepresentatives(${n}).length = ${repCount}`,
    `index と tiles: ${index === p1Count && index === repCount ? "OK" : "WARNING mismatch"}`,
    `classes: ${gamma0CosetRepresentatives(n).map((item) => item.label).join(", ")}`,
    `domain: D = union σ_i^-1(F), then T-normalized`,
    `条件: det=1, c ≡ 0 mod ${n}`,
    `入力行列 ${matrixLabel(matrix)}: det=${matrixStatus.det}, class=${matrixStatus.p1Label}, ${matrixStatus.ok ? "Γ0(N) OK" : "not in Γ0(N)"}`,
    `τ_Γ0 = ${formatComplex(reduction.z, 4)}, patch=${reduction.inPatch ? reduction.representative.label : "WARNING: outside patches"}, T shift=${reduction.tShift}`,
    `P^1(Z/${n}Z): ${reps.map((item) => item.coset).join(" / ")}`,
    `代表行列: ${reps.map((item) => `${item.coset} ${matrixLabel(item.matrix)}`).join(" / ")}`,
    `cusps: ${cusps.map((item) => item.label).join(", ")}`,
    `小さいN: ${examples.join(" / ")}`
  ]);
}

function drawLevelDomain(n) {
  const { ctx, width, height } = setupCanvas(els.levelCanvas);
  clear(ctx, width, height);
  const margin = 20;
  const xMin = -2.2;
  const xMax = 2.2;
  const yMin = 0;
  const yMax = 2.2;
  const toScreen = (z) => ({
    x: margin + ((z.re - xMin) / (xMax - xMin)) * (width - margin * 2),
    y: height - margin - ((z.im - yMin) / (yMax - yMin)) * (height - margin * 2)
  });
  drawGrid(ctx, width, height, toScreen, xMin, xMax, yMin, yMax, 0.5);
  if (n === 1) {
    drawFundamentalPatch(ctx, toScreen, 0, "#75c5d8", "rgba(117, 197, 216, 0.12)");
    ctx.fillStyle = "#f4f1e7";
    ctx.font = "12px Segoe UI, sans-serif";
    ctx.fillText("Γ0(1) = SL2(Z): fundamental domain F", 12, 18);
    return;
  }
  const tilePalette = ["#75c5d8", "#efc769", "#86d48b", "#ee7c7c", "#b99cff", "#ff9ab0", "#78a8ff", "#f0a35d"];
  const reps = gamma0CosetRepresentatives(n);
  reps.slice(0, 12).forEach((rep, index) => {
    const color = tilePalette[index % tilePalette.length];
    drawGamma0CosetPatch(ctx, toScreen, rep, color, `${color}24`);
    const label = toScreen(applyMatrix(complex(0, 1.35), inverseMatrix(rep.matrix)));
    ctx.fillStyle = "#f4f1e7";
    ctx.font = "10px Segoe UI, sans-serif";
    if (Number.isFinite(label.x) && Number.isFinite(label.y)) ctx.fillText(rep.label, label.x - 16, label.y);
  });
  ctx.fillStyle = "#f4f1e7";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText(`Γ0(${n}): D = union sigma_i^-1(F), ${reps.length} tiles`, 12, 18);
  drawCusps(ctx, toScreen, n);
}

function drawFundamentalPatch(ctx, toScreen, shift, stroke, fill = "rgba(117, 197, 216, 0.09)", topY = 2.2) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  const topL = toScreen(complex(shift - 0.5, topY));
  const topR = toScreen(complex(shift + 0.5, topY));
  ctx.moveTo(topL.x, topL.y);
  ctx.lineTo(toScreen(complex(shift - 0.5, Math.sqrt(0.75))).x, toScreen(complex(shift - 0.5, Math.sqrt(0.75))).y);
  for (let t = Math.PI * 5 / 6; t >= Math.PI / 6; t -= 0.04) {
    const p = toScreen(complex(shift + Math.cos(t), Math.sin(t)));
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(topR.x, topR.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTransformedFundamentalPatch(ctx, toScreen, matrix, stroke, fill = "rgba(117, 197, 216, 0.09)", topY = 2.2, normalizeT = false) {
  const boundary = [];
  boundary.push(complex(-0.5, topY));
  boundary.push(complex(-0.5, Math.sqrt(0.75)));
  for (let t = Math.PI * 5 / 6; t >= Math.PI / 6; t -= 0.04) {
    boundary.push(complex(Math.cos(t), Math.sin(t)));
  }
  boundary.push(complex(0.5, Math.sqrt(0.75)));
  boundary.push(complex(0.5, topY));
  const transformed = boundary
    .map((z) => applyMatrix(z, matrix))
    .filter((z) => Number.isFinite(z.re) && Number.isFinite(z.im) && z.im > 0.001);
  const shift = normalizeT && transformed.length
    ? Math.round(transformed.reduce((sum, z) => sum + z.re, 0) / transformed.length)
    : 0;
  const points = transformed
    .map((z) => shift ? transformT(z, -shift) : z)
    .map(toScreen)
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (points.length < 3) return;
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  points.forEach((p, index) => {
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGamma0CosetPatch(ctx, toScreen, representative, stroke, fill = "rgba(117, 197, 216, 0.09)", topY = 2.2) {
  drawTransformedFundamentalPatch(ctx, toScreen, inverseMatrix(representative.matrix), stroke, fill, topY, false);
}

function drawCusps(ctx, toScreen, n) {
  const cusps = cuspSamples(n).slice(0, 10);
  ctx.save();
  cusps.forEach((cusp, index) => {
    const x = cusp.value === Infinity ? 2.05 : Math.max(-2.05, Math.min(2.05, cusp.value));
    const p = toScreen(complex(x, 0.03));
    ctx.beginPath();
    ctx.fillStyle = cusp.value === Infinity ? "#f4f1e7" : "#0f1712";
    ctx.strokeStyle = "#f4f1e7";
    ctx.lineWidth = 1;
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (index < 6) {
      ctx.fillStyle = "#f4f1e7";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(cusp.label, p.x + 5, p.y - 5);
    }
  });
  ctx.restore();
}

function drawCircleArc(ctx, toScreen, cx, r) {
  ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) {
    const t = Math.PI * i / 64;
    const p = toScreen(complex(cx + r * Math.cos(t), r * Math.sin(t)));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function mod(value, modulus) {
  return ((value % modulus) + modulus) % modulus;
}

function primeFactors(n) {
  const factors = [];
  let rest = Math.max(1, Math.round(n));
  for (let p = 2; p * p <= rest; p += 1) {
    if (rest % p !== 0) continue;
    factors.push(p);
    while (rest % p === 0) rest /= p;
  }
  if (rest > 1) factors.push(rest);
  return factors;
}

function divisors(n) {
  const result = [];
  for (let d = 1; d <= n; d += 1) {
    if (n % d === 0) result.push(d);
  }
  return result;
}

function gamma0Index(n) {
  return Math.round(primeFactors(n).reduce((acc, p) => acc * (1 + 1 / p), n));
}

function unitResidues(n) {
  const units = [];
  for (let value = 0; value < n; value += 1) {
    if (gcd(value, n) === 1) units.push(value);
  }
  return units;
}

function isPrimitivePair(c, d, n) {
  if (mod(c, n) === 0 && mod(d, n) === 0) return n === 1;
  return gcd(gcd(c, d), n) === 1;
}

function canonicalP1Pair(c, d, n) {
  if (n === 1) return [0, 1];
  const c0 = mod(c, n);
  const d0 = mod(d, n);
  if (!isPrimitivePair(c0, d0, n)) return null;
  return unitResidues(n)
    .map((unit) => [mod(unit * c0, n), mod(unit * d0, n)])
    .sort((left, right) => left[0] - right[0] || left[1] - right[1])[0];
}

function p1Label(pair) {
  return `[${pair[0]}:${pair[1]}]`;
}

function p1Key(pair) {
  return `${pair[0]}:${pair[1]}`;
}

function p1ClassOfMatrix(matrix, n) {
  return canonicalP1Pair(matrix.c, matrix.d, n);
}

function p1Classes(n) {
  const cacheKey = `p1:${n}`;
  if (gamma0Cache.has(cacheKey)) return gamma0Cache.get(cacheKey);
  if (n === 1) return [[0, 1]];
  const classes = [];
  const seen = new Set();
  for (let c = 0; c < n; c += 1) {
    for (let d = 0; d < n; d += 1) {
      const pair = canonicalP1Pair(c, d, n);
      if (!pair) continue;
      const key = p1Key(pair);
      if (seen.has(key)) continue;
      seen.add(key);
      classes.push(pair);
    }
  }
  const sorted = classes.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
  gamma0Cache.set(cacheKey, sorted);
  return sorted;
}

function extendedGcd(a, b) {
  if (b === 0) return { g: Math.abs(a), x: a < 0 ? -1 : 1, y: 0 };
  const next = extendedGcd(b, a % b);
  return { g: next.g, x: next.y, y: next.x - Math.trunc(a / b) * next.y };
}

function representativeMatrixForP1(pair) {
  const c = pair[0];
  const d = pair[1];
  const eg = extendedGcd(d, c);
  const sign = eg.g < 0 ? -1 : 1;
  return {
    a: eg.x * sign,
    b: -eg.y * sign,
    c,
    d
  };
}

function gamma0CosetRepresentatives(n) {
  const cacheKey = `reps:${n}`;
  if (gamma0Cache.has(cacheKey)) return gamma0Cache.get(cacheKey);
  const reps = p1Classes(n).map((pair, index) => ({
    index,
    pair,
    label: p1Label(pair),
    matrix: representativeMatrixForP1(pair)
  }));
  gamma0Cache.set(cacheKey, reps);
  return reps;
}

function gamma0RepresentativeForMatrix(matrix, n) {
  const pair = p1ClassOfMatrix(matrix, n);
  const key = pair ? p1Key(pair) : "";
  return gamma0CosetRepresentatives(n).find((rep) => p1Key(rep.pair) === key) || gamma0CosetRepresentatives(n)[0];
}

function p1ClassIndexForMatrix(matrix, n) {
  const representative = gamma0RepresentativeForMatrix(matrix, n);
  return representative ? representative.index : 0;
}

function pointInStandardFundamentalDomain(z) {
  const eps = 1e-7;
  return z.im > eps && Math.abs(z.re) <= 0.5 + eps && abs(z) >= 1 - eps;
}

function pointInGamma0Patch(z, representative) {
  for (let shift = -12; shift <= 12; shift += 1) {
    const lifted = transformT(z, shift);
    const w = applyMatrix(lifted, representative.matrix);
    if (pointInStandardFundamentalDomain(w)) return { ok: true, shift, witness: w };
  }
  return { ok: false, shift: 0, witness: null };
}

function findGamma0Patch(z, n) {
  return gamma0CosetRepresentatives(n)
    .map((representative) => ({ representative, test: pointInGamma0Patch(z, representative) }))
    .find((item) => item.test.ok) || null;
}

function reduceToGamma0Domain(tau, n) {
  const trace = reduceWithTrace(tau);
  const rep = gamma0RepresentativeForMatrix(trace.matrix, n);
  const lifted = applyMatrix(trace.z, inverseMatrix(rep.matrix));
  const normalized = normalizeByT(lifted);
  const patch = findGamma0Patch(normalized.z, n);
  return {
    z: normalized.z,
    beforeT: lifted,
    representative: patch ? patch.representative : rep,
    originalRepresentative: rep,
    tShift: normalized.shift,
    patch,
    inPatch: Boolean(patch),
    trace
  };
}

function gamma0Status(matrix, n) {
  const det = matrixDet(matrix);
  const sl2 = det === 1;
  const p1 = p1ClassOfMatrix(matrix, n);
  return {
    det,
    sl2,
    cMod: mod(matrix.c, n),
    p1,
    p1Label: p1 ? p1Label(p1) : "not primitive",
    ok: sl2 && mod(matrix.c, n) === 0
  };
}

function matrixLabel(matrix) {
  return `[${matrix.a} ${matrix.b}; ${matrix.c} ${matrix.d}]`;
}

function gamma0RepresentativeSamples(n) {
  return gamma0CosetRepresentatives(n).map((item) => ({
    label: `R${item.index}`,
    matrix: item.matrix,
    coset: item.label,
    status: gamma0Status(item.matrix, n)
  }));
}

function cuspSamples(n) {
  const cusps = [{ label: "∞", value: Infinity }];
  divisors(n).forEach((denominator) => {
    if (denominator === 1) return;
    if (denominator === n) {
      cusps.push({ label: "0", value: 0 });
      return;
    }
    const widthClass = gcd(denominator, n / denominator);
    if (widthClass === 1) {
      cusps.push({ label: `1/${denominator}`, value: 1 / denominator });
      return;
    }
    for (let numerator = 1; numerator <= widthClass; numerator += 1) {
      if (gcd(numerator, widthClass) !== 1) continue;
      cusps.push({ label: `${numerator}/${denominator}`, value: numerator / denominator });
    }
  });
  return cusps.slice(0, 14);
}

function smallLevelExamples(n) {
  return [1, 2, 3, 4, 5, 6].map((level) => {
    const selected = level === n ? "*" : "";
    return `${selected}N=${level}: index ${gamma0Index(level)}, tiles ${p1Classes(level).length}${selected}`;
  });
}

function readMatrixInputs() {
  return {
    a: Math.round(Number(els.matrixA.value) || 0),
    b: Math.round(Number(els.matrixB.value) || 0),
    c: Math.round(Number(els.matrixC.value) || 0),
    d: Math.round(Number(els.matrixD.value) || 0)
  };
}

function renderMatrixMode() {
  const matrix = readMatrixInputs();
  const det = matrixDet(matrix);
  const n = currentLevel();
  const status = gamma0Status(matrix, n);
  const sl2 = status.sl2;
  const gamma0 = status.ok;
  const transformed = sl2 ? applyMatrix(state.tau, matrix) : null;
  els.matrixReadout.innerHTML = modeLines([
    `<strong>[ ${matrix.a} ${matrix.b}; ${matrix.c} ${matrix.d} ]</strong>`,
    `det = ${det}`,
    `SL2(Z): ${sl2 ? "OK" : "NG"}`,
    `Γ0(${n}): ${gamma0 ? "OK" : "NG"} (class ${status.p1Label})`,
    `γτ = ${transformed ? formatComplex(transformed, 4) : "det=1 の行列を入力"}`
  ]);
}

function renderEllipticMode() {
  const a = Number(els.ellipticA.value) || 0;
  const b = Number(els.ellipticB.value) || 0;
  const preset = currentEllipticPreset();
  const finiteMode = els.finiteFieldToggle.checked;
  const p = normalizedPrime(Number(els.finitePrime.value) || 17);
  const maxN = Number(els.ellipticMaxN.value) || 30;
  const coeffMode = els.ellipticCoeffMode.value;
  const discCore = 4 * a * a * a + 27 * b * b;
  const discriminant = -16 * discCore;
  const curveJ = Math.abs(discCore) < 1e-12 ? Number.POSITIVE_INFINITY : 1728 * (4 * a * a * a) / discCore;
  const modularJ = jInvariant(qFromTau(state.tau));
  if (finiteMode) drawFiniteFieldCurve(a, b, p);
  else drawEllipticCurve(a, b, discriminant);
  const finiteCount = finiteMode ? countFinitePoints(a, b, p) : null;
  const primeRows = ellipticPrimeRows(a, b, discriminant, maxN);
  const completedRows = completeEllipticCoefficients(primeRows, maxN);
  const badPrimes = primeRows.filter((row) => row.bad).map((row) => row.p);
  const roughLevel = roughLevelCandidate(badPrimes);
  els.roughLevelBtn.disabled = roughLevel < 1;
  els.roughLevelBtn.dataset.level = String(roughLevel);
  els.roughLevelBtn.textContent = `rough level candidate ${roughLevel} を Γ0(N) ビューで見る`;
  drawApBarChart(coeffMode === "completed" ? completedRows : primeRows, coeffMode);
  els.ellipticReadout.innerHTML = modeLines([
    `<strong>y^2 = x^3 + ax + b</strong>`,
    preset ? ellipticPresetSummary(preset) : `preset: custom`,
    `bad primes: ${badPrimes.length ? badPrimes.join(", ") : "none among tested primes"}`,
    `rough level candidate: ${roughLevel}`,
    `rough level candidate は bad primes の積から作る粗い候補です。厳密な conductor ではありません。`,
    `a = ${formatNumber(a, 3)}, b = ${formatNumber(b, 3)}`,
    `Δ = ${formatNumber(discriminant, 5)}`,
    `j(E) = ${formatNumber(curveJ, 5)}`,
    `j(τ) ≈ ${formatComplex(modularJ, 3)}`,
    finiteMode ? `#E(F_${p}) = ${finiteCount}` : "実数グラフ表示",
    Math.abs(discriminant) < 1e-8 ? "特異: 曲線が尖る/交わる可能性" : "非特異: 楕円曲線",
    `<strong>有限体の点数と a_p</strong>`,
    `有限体計算では a,b を整数に丸めて mod p へ写します`,
    ellipticPrimeTable(primeRows),
    `<strong>prime only q-expansion</strong>`,
    `<code>${ellipticPrimeQExperiment(primeRows)}</code>`,
    `<strong>補完係数 a_n / maxN=${maxN}</strong>`,
    `表示モード: ${coeffMode === "completed" ? "completed" : "prime only"}`,
    `<strong>${coeffMode === "completed" ? "completed q-expansion" : "completed preview"} / maxN=${maxN}</strong>`,
    `<code>${ellipticCompletedQExperiment(completedRows, maxN)}</code>`,
    `<strong>completed coefficient table</strong>`,
    ellipticCompletedTable(completedRows, coeffMode),
    `注: これは楕円曲線から現れるモジュラー形式の係数を実験的に可視化するものです。good prime では a_p = p + 1 - #E(F_p) を使い、素数冪と互いに素な積については標準的な関係で補完しています。ただし bad prime を含む係数や導手・newform の厳密な扱いは未実装です。`
  ]);
}

function currentEllipticPreset() {
  return ellipticPresets[els.ellipticPresetSelect.value] || null;
}

function ellipticPresetSummary(preset) {
  const watchList = preset.watchPoints && preset.watchPoints.length
    ? `<br>観察ポイント:<ul class="preset-watch-list">${preset.watchPoints.map((point) => `<li>${point}</li>`).join("")}</ul>`
    : "";
  return [
    `preset: ${preset.name}`,
    `description: ${preset.description}`,
    `known features: ${preset.features.join("; ")}`,
    `preset bad primes: ${preset.badPrimes.join(", ")}${watchList}`
  ].join("<br>");
}

function applyEllipticPreset(key) {
  const preset = ellipticPresets[key];
  if (!preset) return;
  els.ellipticA.value = String(preset.a);
  els.ellipticB.value = String(preset.b);
  els.ellipticMaxN.value = String(preset.maxN);
  els.ellipticCoeffMode.value = preset.coeffMode;
  renderModePanel();
}

function currentAtlasWeight() {
  let weight = Math.round(Number(els.atlasWeightNumberInput.value) || Number(els.atlasWeightInput.value) || 0);
  if (weight % 2 !== 0) weight += 1;
  weight = Math.max(0, Math.min(80, weight));
  return weight;
}

function renderAtlasMode() {
  const weight = currentAtlasWeight();
  const sliderWeight = Math.min(40, weight);
  els.atlasWeightInput.value = sliderWeight;
  els.atlasWeightNumberInput.value = weight;
  const basis = levelOneBasis(weight);
  const dimText = basis.length === 0 ? "基底なし" : `${basis.length} 個の候補`;
  els.atlasSummary.innerHTML = modeLines([
    `<strong>レベル1 / weight ${weight}</strong>`,
    `M_${weight}(SL2(Z)) の単項式表示`,
    dimText
  ]);
  if (basis.length === 0) {
    els.atlasList.innerHTML = `<div class="mode-readout"><div>この重さには E4^a E6^b 型の正則モジュラー形式がありません。</div></div>`;
    return;
  }
  els.atlasList.innerHTML = basis.map((item, index) => {
    const coeffs = monomialCoeffs(item.a, item.b, 6);
    return `
      <article class="atlas-card">
        <canvas data-atlas-index="${index}" width="96" height="96" role="button" tabindex="0" aria-label="${monomialName(item.a, item.b)} を大きい模様に表示"></canvas>
        <div>
          <h3>${monomialName(item.a, item.b)}</h3>
          <code>${formatQExpansion(coeffs)} + ...</code>
        </div>
      </article>
    `;
  }).join("");
  els.atlasList.querySelectorAll("canvas").forEach((canvas) => {
    const item = basis[Number(canvas.dataset.atlasIndex)];
    drawAtlasMiniPattern(canvas, item.a, item.b);
    const sendToPattern = () => {
      state.patternAtlasMonomial = { a: item.a, b: item.b };
      state.message = "pattern";
      render();
      requestAnimationFrame(() => els.patternCanvas.scrollIntoView({ behavior: "smooth", block: "center" }));
    };
    canvas.addEventListener("click", sendToPattern);
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sendToPattern();
      }
    });
  });
}

function drawAtlasMiniPattern(canvas, aPower, bPower) {
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const data = image.data;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const i = (py * size + px) * 4;
      const u = (px - cx) / r;
      const v = (cy - py) / r;
      const radius = Math.hypot(u, v);
      if (radius >= 0.995) {
        data[i] = 244;
        data[i + 1] = 241;
        data[i + 2] = 231;
        data[i + 3] = 255;
        continue;
      }
      const z = diskToUpper(complex(u, v));
      const color = atlasPatternColor(reduceWithTrace(z), z, radius, aPower, bPower);
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }
  }
  ctx.putImageData(image, 0, 0);
  ctx.strokeStyle = "rgba(20, 22, 18, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.stroke();
}

function normalizedPrime(value) {
  const n = Math.max(3, Math.min(97, Math.round(value)));
  for (let p = n; p <= 97; p += 1) {
    if (isPrime(p)) {
      els.finitePrime.value = p;
      return p;
    }
  }
  els.finitePrime.value = 97;
  return 97;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) {
    if (n % d === 0) return false;
  }
  return true;
}

function mod(n, p) {
  return ((Math.round(n) % p) + p) % p;
}

function finitePoints(a, b, p) {
  const aa = mod(a, p);
  const bb = mod(b, p);
  const points = [];
  for (let x = 0; x < p; x += 1) {
    const rhs = mod(x * x * x + aa * x + bb, p);
    for (let y = 0; y < p; y += 1) {
      if (mod(y * y, p) === rhs) points.push({ x, y });
    }
  }
  return points;
}

function countFinitePoints(a, b, p) {
  return finitePoints(a, b, p).length + 1;
}

const ellipticPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];

const ellipticPresets = {
  default: {
    name: "default: y^2 = x^3 - x + 1",
    a: -1,
    b: 1,
    maxN: 50,
    coeffMode: "completed",
    description: "A small nonsingular curve with mixed positive and negative a_p values.",
    features: ["compact default example", "bad reduction at 2 and 23 in this short model", "good for comparing prime and completed coefficients"],
    watchPoints: [
      "good prime と bad prime の表示の違いを見る",
      "a_p の符号がどの素数で変わるかを観察する",
      "completed q-expansion と completed coefficient table の対応を確認する"
    ],
    badPrimes: [2, 23]
  },
  cm1728: {
    name: "CM j=1728: y^2 = x^3 - x",
    a: -1,
    b: 0,
    maxN: 50,
    coeffMode: "completed",
    description: "A classic complex multiplication example with j(E)=1728.",
    features: ["CM by Gaussian integers", "symmetric real roots", "many visible zero-patterns in a_p"],
    watchPoints: [
      "j=1728 のCM曲線",
      "good prime p で p ≡ 3 mod 4 のとき a_p=0 が現れやすい",
      "a_p のゼロがどの素数に出るかを観察する"
    ],
    badPrimes: [2]
  },
  cm0: {
    name: "CM j=0: y^2 = x^3 + 1",
    a: 0,
    b: 1,
    maxN: 50,
    coeffMode: "completed",
    description: "A classic complex multiplication example with j(E)=0.",
    features: ["CM by Eisenstein integers", "cubic symmetry", "bad reduction concentrated at 2 and 3 in this short model"],
    watchPoints: [
      "j=0 のCM曲線",
      "good prime p で p ≡ 2 mod 3 のとき a_p=0 が現れやすい",
      "y^2 = x^3 - 2 と比較して quadratic twist 的な違いを見る"
    ],
    badPrimes: [2, 3]
  },
  congruent24: {
    name: "congruent-style: y^2 = x^3 - 4x",
    a: -4,
    b: 0,
    maxN: 50,
    coeffMode: "completed",
    description: "A simple x^3 - n^2 x shape related to congruent-number style examples.",
    features: ["three rational 2-torsion points", "j(E)=1728", "bad reduction at 2 in this short model"],
    watchPoints: [
      "y^2 = x^3 - n^2x 型の例",
      "j=1728 系",
      "y^2 = x^3 - x と a_p や bad primes を比較する"
    ],
    badPrimes: [2]
  },
  twist2: {
    name: "quadratic twist sample: y^2 = x^3 - 2",
    a: 0,
    b: -2,
    maxN: 50,
    coeffMode: "completed",
    description: "A small j=0 twist-like sample with a different a_p texture.",
    features: ["j(E)=0", "few coefficients vanish or change sign in a recognizable way", "bad reduction at 2 and 3 in this short model"],
    watchPoints: [
      "j=0 系の twist 的な見本",
      "y^2 = x^3 + 1 と a_p の符号やゼロの出方を比較する",
      "同じ bad primes を持つ曲線でも good prime の係数が変わる様子を見る"
    ],
    badPrimes: [2, 3]
  }
};

function primesUpTo(limit) {
  const max = Math.max(2, Math.round(limit));
  const primes = [];
  for (let n = 2; n <= max; n += 1) {
    if (isPrime(n)) primes.push(n);
  }
  return primes;
}

function ellipticBadPrime(a, b, p) {
  const aa = mod(a, p);
  const bb = mod(b, p);
  return mod(-16 * (4 * aa * aa * aa + 27 * bb * bb), p) === 0;
}

function ellipticPrimeRows(a, b, discriminant, maxPrime = 31) {
  const primes = maxPrime <= 31 ? ellipticPrimes : primesUpTo(maxPrime);
  return primes.map((p) => {
    const count = countFinitePoints(a, b, p);
    const bad = ellipticBadPrime(a, b, p);
    const ap = bad ? null : p + 1 - count;
    const hasse = 2 * Math.sqrt(p);
    return {
      p,
      count,
      bad,
      ap,
      hasse,
      discriminant
    };
  });
}

function ellipticPrimeTableLegacy(rows) {
  const cells = rows.map((row) => (
    row.bad
      ? `bad p=${row.p}: #E(F_${row.p})=${row.count}, Hasse対象外`
      : `good p=${row.p}: #E(F_${row.p})=${row.count}, a_p=${row.ap}, Hasse ${formatNumber(-row.hasse, 3)}..${formatNumber(row.hasse, 3)}`
  ));
  return `<div class="ap-table">${cells.map((cell) => `<span>${cell}</span>`).join("")}</div>`;
}

function ellipticPrimeQExperiment(rows) {
  const terms = rows
    .filter((row) => !row.bad)
    .map((row) => formatQTerm(row.ap, row.p))
    .join(" ");
  return `prime only: f_E(q) ≈ q ${terms}`;
}

function factorization(n) {
  const factors = [];
  let rest = n;
  for (let p = 2; p * p <= rest; p += 1) {
    if (rest % p !== 0) continue;
    let exp = 0;
    while (rest % p === 0) {
      rest /= p;
      exp += 1;
    }
    factors.push({ p, exp });
  }
  if (rest > 1) factors.push({ p: rest, exp: 1 });
  return factors;
}

function formatFactorization(factors) {
  if (factors.length === 0) return "1";
  return factors.map(({ p, exp }) => exp === 1 ? `${p}` : `${p}^${exp}`).join(" * ");
}

function primePowerCoefficient(ap, p, exp) {
  if (exp === 0) return 1;
  if (exp === 1) return ap;
  let prev2 = 1;
  let prev1 = ap;
  for (let r = 2; r <= exp; r += 1) {
    const next = ap * prev1 - p * prev2;
    prev2 = prev1;
    prev1 = next;
  }
  return prev1;
}

function completeEllipticCoefficients(primeRows, maxN) {
  const primeMap = new Map(primeRows.map((row) => [row.p, row]));
  const rows = [];
  for (let n = 1; n <= maxN; n += 1) {
    if (n === 1) {
      rows.push({ n, factorText: "1", status: "good", an: 1 });
      continue;
    }
    const factors = factorization(n);
    const factorText = formatFactorization(factors);
    const unknown = factors.find(({ p }) => !primeMap.has(p));
    if (unknown) {
      rows.push({ n, factorText, status: "skipped", an: null });
      continue;
    }
    const bad = factors.find(({ p }) => primeMap.get(p).bad);
    if (bad) {
      rows.push({ n, factorText, status: "bad prime included", an: null });
      continue;
    }
    let an = 1;
    factors.forEach(({ p, exp }) => {
      an *= primePowerCoefficient(primeMap.get(p).ap, p, exp);
    });
    let status = "multiplicative";
    if (factors.length === 1 && factors[0].exp === 1) status = "prime";
    else if (factors.length === 1) status = "prime power";
    rows.push({ n, factorText, status, an });
  }
  return rows;
}

function ellipticCompletedQExperiment(rows, maxN) {
  const terms = rows
    .filter((row) => row.an !== null && row.an !== 0)
    .map((row) => formatQTerm(row.an, row.n))
    .join(" ");
  return `completed: f_E(q) ≈ Σ_{n=1}^{${maxN}} a_n q^n = ${terms}`;
}

function ellipticCompletedTableLegacy(rows, mode) {
  const visibleRows = mode === "completed" ? rows : rows.filter((row) => row.status === "prime" || row.n === 1);
  return `<div class="an-table">${visibleRows.map((row) => (
    `<span><b>${row.n}</b> | ${row.factorText} | ${row.status} | a_n=${row.an === null ? "skip" : row.an}</span>`
  )).join("")}</div>`;
}

function formatSignedCoeff(value) {
  if (value === 0) return "+ 0";
  return value > 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function ellipticPrimeTable(rows) {
  const cells = rows.map((row) => (
    row.bad
      ? `bad p=${row.p}: #E(F_${row.p})=${row.count}, Hasse range: outside good-prime check`
      : `good p=${row.p}: #E(F_${row.p})=${row.count}, a_p=${row.ap}, Hasse range: ${formatNumber(-row.hasse, 3)} <= a_p <= ${formatNumber(row.hasse, 3)}`
  ));
  return `<div class="ap-table">${cells.map((cell) => `<span>${cell}</span>`).join("")}</div>`;
}

function formatFactorization(factors) {
  if (factors.length === 0) return "1";
  return factors.map(({ p, exp }) => exp === 1 ? `${p}` : `${p}^${exp}`).join("*");
}

function formatQTerm(coefficient, exponent) {
  if (coefficient === 0 || coefficient === null) return "";
  const sign = coefficient < 0 ? "-" : "+";
  const absCoeff = Math.abs(coefficient);
  const coeffText = absCoeff === 1 ? "" : `${absCoeff}`;
  const qText = exponent === 1 ? "q" : `q^${exponent}`;
  return `${sign} ${coeffText}${qText}`;
}

function ellipticPrimeQExperiment(rows) {
  const terms = rows
    .filter((row) => !row.bad)
    .map((row) => formatQTerm(row.ap, row.p))
    .filter(Boolean)
    .join(" ");
  return `prime only q-expansion: f_E(q) ≈ q ${terms}`;
}

function ellipticCompletedQExperiment(rows, maxN) {
  const terms = rows
    .filter((row) => row.an !== null && row.an !== 0)
    .map((row) => formatQTerm(row.an, row.n))
    .filter(Boolean)
    .join(" ");
  return `completed q-expansion: f_E(q) ≈ Σ_{n=1}^{${maxN}} a_n q^n = ${trimLeadingPlus(terms)}`;
}

function ellipticPrimeQExperiment(rows) {
  const terms = rows
    .filter((row) => !row.bad)
    .map((row) => formatQTerm(row.ap, row.p))
    .filter(Boolean)
    .join(" ");
  return `f_E(q) ≈ q ${terms}`;
}

function ellipticCompletedQExperiment(rows, maxN) {
  const terms = rows
    .filter((row) => row.an !== null && row.an !== 0)
    .map((row) => formatQTerm(row.an, row.n))
    .filter(Boolean)
    .join(" ");
  return `f_E(q) ≈ Σ_{n=1}^{${maxN}} a_n q^n = ${trimLeadingPlus(terms)}`;
}

function trimLeadingPlus(text) {
  return text.replace(/^\+\s*/, "");
}

function roughLevelCandidate(badPrimes) {
  if (badPrimes.length === 0) return 1;
  return badPrimes.reduce((product, p) => product * p, 1);
}

function ellipticCompletedTable(rows, mode) {
  const visibleRows = rows;
  return `
    <table class="coeff-table">
      <thead>
        <tr><th>n</th><th>factorization</th><th>status</th><th>a_n</th></tr>
      </thead>
      <tbody>
        ${visibleRows.map((row) => (
          `<tr>
            <td>${row.n}</td>
            <td>${row.factorText}</td>
            <td>${row.status}</td>
            <td>${row.an === null ? "skipped" : row.an}</td>
          </tr>`
        )).join("")}
      </tbody>
    </table>
  `;
}

function drawApBarChart(rows, mode = "prime") {
  const { ctx, width, height } = setupCanvas(els.ellipticApCanvas);
  clear(ctx, width, height);
  const padX = 26;
  const padY = 24;
  const entries = mode === "completed"
    ? rows.map((row) => ({
      label: String(row.n),
      value: row.an,
      muted: row.an === null,
      hasse: null
    }))
    : rows.map((row) => ({
      label: String(row.p),
      value: row.ap,
      muted: row.bad,
      hasse: row.bad ? null : row.hasse
    }));
  const numericEntries = entries.filter((entry) => Number.isFinite(entry.value));
  const hasseValues = mode === "prime" ? entries.map((entry) => entry.hasse || 0) : [];
  const maxAbs = Math.max(1, ...numericEntries.map((entry) => Math.abs(entry.value)), ...hasseValues);
  const zeroY = height / 2;
  ctx.strokeStyle = "#536050";
  ctx.lineWidth = 1;
  line(ctx, padX, zeroY, width - 10, zeroY);
  ctx.fillStyle = "#b8bdad";
  ctx.font = "11px Segoe UI, sans-serif";
  ctx.fillText(mode === "completed" ? "a_n" : "a_p", 8, 16);
  const slot = (width - padX - 16) / Math.max(1, entries.length);
  entries.forEach((entry, index) => {
    const x = padX + index * slot + slot * 0.18;
    const barW = Math.max(4, slot * 0.58);
    if (mode === "prime" && entry.hasse) {
      const guideH = (entry.hasse / maxAbs) * (height / 2 - padY);
      ctx.fillStyle = "rgba(117, 197, 216, 0.10)";
      ctx.fillRect(x - slot * 0.08, zeroY - guideH, barW + slot * 0.16, guideH * 2);
      ctx.strokeStyle = "rgba(117, 197, 216, 0.38)";
      ctx.lineWidth = 1;
      line(ctx, x - slot * 0.08, zeroY - guideH, x + barW + slot * 0.08, zeroY - guideH);
      line(ctx, x - slot * 0.08, zeroY + guideH, x + barW + slot * 0.08, zeroY + guideH);
    }
    if (entry.muted) {
      ctx.fillStyle = "rgba(160, 142, 132, 0.55)";
      ctx.fillRect(x, zeroY - 5, barW, 10);
    } else {
      const barH = (Math.abs(entry.value) / maxAbs) * (height / 2 - padY);
      ctx.fillStyle = entry.value >= 0 ? "#75c5d8" : "#efc769";
      ctx.fillRect(x, entry.value >= 0 ? zeroY - barH : zeroY, barW, Math.max(2, barH));
    }
    const labelEvery = entries.length <= 31 ? 1 : entries.length <= 60 ? 5 : 10;
    if (index % labelEvery === 0 || index === entries.length - 1) {
      ctx.fillStyle = "#b8bdad";
      ctx.font = "10px Segoe UI, sans-serif";
      ctx.fillText(entry.label, x - 1, height - 8);
    }
  });
  ctx.fillStyle = mode === "prime" ? "rgba(117, 197, 216, 0.75)" : "rgba(184, 189, 173, 0.75)";
  ctx.font = "10px Segoe UI, sans-serif";
  ctx.fillText(mode === "prime" ? "thin bands: +/- 2sqrt(p)" : "completed coefficients; skipped values dimmed", padX + 4, 16);
}

function drawFiniteFieldCurve(a, b, p) {
  const { ctx, width, height } = setupCanvas(els.ellipticCanvas);
  clear(ctx, width, height);
  const pad = 18;
  const step = Math.min((width - pad * 2) / Math.max(1, p - 1), (height - pad * 2) / Math.max(1, p - 1));
  const ox = (width - step * (p - 1)) / 2;
  const oy = (height - step * (p - 1)) / 2;
  ctx.strokeStyle = "#263126";
  ctx.lineWidth = 1;
  for (let i = 0; i < p; i += 1) {
    line(ctx, ox + i * step, oy, ox + i * step, oy + (p - 1) * step);
    line(ctx, ox, oy + i * step, ox + (p - 1) * step, oy + i * step);
  }
  finitePoints(a, b, p).forEach(({ x, y }) => {
    const px = ox + x * step;
    const py = oy + (p - 1 - y) * step;
    drawPoint(ctx, px, py, "#efc769", Math.max(2.5, Math.min(5, step * 0.28)));
  });
  ctx.fillStyle = "#b8bdad";
  ctx.font = "12px Segoe UI, sans-serif";
  ctx.fillText(`F_${p}`, 10, 16);
}

function drawEllipticCurve(a, b, discriminant) {
  const { ctx, width, height } = setupCanvas(els.ellipticCanvas);
  clear(ctx, width, height);
  const range = 4;
  const toScreen = (x, y) => ({
    x: width / 2 + (x / range) * (width * 0.44),
    y: height / 2 - (y / range) * (height * 0.44)
  });
  ctx.strokeStyle = "#263126";
  ctx.lineWidth = 1;
  for (let t = -4; t <= 4; t += 1) {
    const vx = toScreen(t, 0);
    line(ctx, vx.x, 0, vx.x, height);
    const hy = toScreen(0, t);
    line(ctx, 0, hy.y, width, hy.y);
  }
  ctx.strokeStyle = "#536050";
  line(ctx, 0, height / 2, width, height / 2);
  line(ctx, width / 2, 0, width / 2, height);

  const drawBranch = (sign) => {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 720; i += 1) {
      const x = -4 + (8 * i) / 720;
      const rhs = x * x * x + a * x + b;
      if (rhs < 0) {
        started = false;
        continue;
      }
      const y = sign * Math.sqrt(rhs);
      if (Math.abs(y) > 4.2) {
        started = false;
        continue;
      }
      const p = toScreen(x, y);
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  };
  ctx.strokeStyle = Math.abs(discriminant) < 1e-8 ? "#ee7c7c" : "#86d48b";
  ctx.lineWidth = 2;
  drawBranch(1);
  drawBranch(-1);
}

function renderModePanel() {
  els.modePanelMeta.textContent = state.activeMode;
  renderModFormMode();
  renderLevelMode();
  renderMatrixMode();
  renderEllipticMode();
  renderAtlasMode();
}

function renderStageLabels() {
  const n = currentLevel();
  const viewName = state.patternMode === "disk" ? "Poincare disk" : "upper half-plane";
  const functionName = functionLabel();
  if (state.activeMode === "level") {
    const tileText = `Γ0(${n}) / P^1(Z/${n}Z) / ${state.colorMode} color`;
    els.upperStageLabel.textContent = `${tileText} / D = union sigma_i^-1(F)`;
    els.patternStageLabel.textContent = `${tileText} / ${viewName}`;
    return;
  }
  els.upperStageLabel.textContent = "SL2(Z) / fundamental domain / upper half-plane";
  els.patternStageLabel.textContent = `${functionName} / ${state.colorMode === "function" ? "function color" : "tile color"} / ${viewName}`;
}

function render() {
  const q = qFromTau(state.tau);
  els.tauReadout.textContent = `τ = ${formatComplex(state.tau, 3)}   q = ${formatComplex(q, 3)}`;
  drawUpperHalfPlane();
  drawLattice();
  drawTorus();
  drawQDisk();
  drawModularPattern();
  renderSeries();
  renderExplanation();
  renderModePanel();
  renderStageLabels();
  updateUrlState();
}

function readInputs() {
  const x = Number.parseFloat(els.xInput.value);
  const y = Number.parseFloat(els.yInput.value);
  if (Number.isFinite(x) && Number.isFinite(y)) setTau(complex(x, y), "normal");
}

function bindControls() {
  [els.xSlider, els.ySlider].forEach((el) => {
    el.addEventListener("input", () => setTau(complex(Number(els.xSlider.value), Number(els.ySlider.value)), "normal"));
  });
  [els.xInput, els.yInput].forEach((el) => {
    el.addEventListener("change", readInputs);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") readInputs();
    });
  });

  els.tMinusBtn.addEventListener("click", () => setTau(transformT(state.tau, -1), "T"));
  els.tBtn.addEventListener("click", () => setTau(transformT(state.tau, 1), "T"));
  els.sBtn.addEventListener("click", () => setTau(transformS(state.tau), "S"));
  els.reduceBtn.addEventListener("click", () => setTau(reduceToFundamentalDomain(state.tau), "reduce"));
  els.patternDiskBtn.addEventListener("click", () => {
    state.patternMode = "disk";
    els.patternDiskBtn.classList.add("active");
    els.patternHalfBtn.classList.remove("active");
    state.message = "pattern";
    render();
  });
  els.patternHalfBtn.addEventListener("click", () => {
    state.patternMode = "half";
    els.patternHalfBtn.classList.add("active");
    els.patternDiskBtn.classList.remove("active");
    state.message = "pattern";
    render();
  });
  els.patternPaletteBtn.addEventListener("click", () => {
    state.patternPalette += 1;
    state.message = "pattern";
    render();
  });
  els.patternFunctionSelect.addEventListener("change", () => {
    state.patternFunction = els.patternFunctionSelect.value;
    state.patternAtlasMonomial = null;
    state.message = "pattern";
    render();
  });
  els.patternColorModeSelect.addEventListener("change", () => {
    state.colorMode = els.patternColorModeSelect.value;
    state.message = "pattern";
    render();
  });
  els.savePatternBtn.addEventListener("click", savePatternPng);
  document.querySelectorAll(".mode-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-tabs button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".mode-body").forEach((body) => body.classList.remove("active"));
      button.classList.add("active");
      state.activeMode = button.dataset.mode;
      document.querySelector(`[data-mode-body="${state.activeMode}"]`)?.classList.add("active");
      render();
    });
  });
  [els.modFormSelect, els.gammaSelect].forEach((el) => {
    el.addEventListener("change", renderModePanel);
  });
  els.levelInput.addEventListener("input", () => {
    els.levelNumberInput.value = els.levelInput.value;
    render();
  });
  const syncLevelNumber = () => {
    els.levelInput.value = Math.min(30, currentLevel());
    render();
  };
  els.levelNumberInput.addEventListener("input", syncLevelNumber);
  els.levelNumberInput.addEventListener("change", syncLevelNumber);
  [els.matrixA, els.matrixB, els.matrixC, els.matrixD].forEach((el) => {
    el.addEventListener("input", renderModePanel);
  });
  els.applyMatrixBtn.addEventListener("click", () => {
    const matrix = readMatrixInputs();
    if (matrixDet(matrix) === 1) setTau(applyMatrix(state.tau, matrix), "normal");
  });
  els.ellipticPresetSelect.addEventListener("change", () => {
    applyEllipticPreset(els.ellipticPresetSelect.value);
  });
  [els.ellipticA, els.ellipticB, els.finiteFieldToggle, els.finitePrime, els.ellipticMaxN, els.ellipticCoeffMode].forEach((el) => {
    el.addEventListener("input", () => {
      if (el !== els.finiteFieldToggle && el !== els.finitePrime) els.ellipticPresetSelect.value = "custom";
      renderModePanel();
    });
    el.addEventListener("change", () => {
      if (el !== els.finiteFieldToggle && el !== els.finitePrime) els.ellipticPresetSelect.value = "custom";
      renderModePanel();
    });
  });
  els.roughLevelBtn.addEventListener("click", () => {
    const level = Math.max(1, Math.round(Number(els.roughLevelBtn.dataset.level) || 1));
    els.levelNumberInput.value = String(level);
    els.levelInput.value = String(Math.min(30, level));
    const levelTab = document.querySelector('.mode-tabs button[data-mode="level"]');
    if (levelTab) levelTab.click();
    else {
      state.activeMode = "level";
      render();
    }
  });
  els.atlasWeightInput.addEventListener("input", () => {
    els.atlasWeightNumberInput.value = els.atlasWeightInput.value;
    renderModePanel();
  });
  els.atlasWeightNumberInput.addEventListener("input", () => {
    els.atlasWeightInput.value = Math.min(40, currentAtlasWeight());
    renderModePanel();
  });

  document.querySelectorAll(".tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      state.tab = button.dataset.tab;
      renderExplanation();
    });
  });

  els.qCanvas.addEventListener("pointerenter", () => {
    state.message = "q";
    renderExplanation();
  });
  els.qCanvas.addEventListener("pointerleave", () => {
    if (state.message === "q") state.message = "normal";
    renderExplanation();
  });
  els.patternCanvas.addEventListener("pointerenter", () => {
    state.message = "pattern";
    renderExplanation();
  });
  els.patternCanvas.addEventListener("pointerleave", () => {
    if (state.message === "pattern") state.message = "normal";
    renderExplanation();
  });
}

function pointerToTau(event) {
  const rect = els.upperCanvas.getBoundingClientRect();
  const margin = 28;
  const xMin = -5;
  const xMax = 5;
  const yMin = 0;
  const yMax = 3;
  const sx = Math.max(margin, Math.min(rect.width - margin, event.clientX - rect.left));
  const sy = Math.max(margin, Math.min(rect.height - margin, event.clientY - rect.top));
  const re = xMin + ((sx - margin) / (rect.width - margin * 2)) * (xMax - xMin);
  const im = yMin + ((rect.height - margin - sy) / (rect.height - margin * 2)) * (yMax - yMin);
  return complex(re, im);
}

function bindDrag() {
  els.upperCanvas.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    els.upperCanvas.setPointerCapture(event.pointerId);
    setTau(pointerToTau(event), "normal");
  });
  els.upperCanvas.addEventListener("pointermove", (event) => {
    if (state.dragging) setTau(pointerToTau(event), "normal");
  });
  els.upperCanvas.addEventListener("pointerup", () => {
    state.dragging = false;
  });
  els.upperCanvas.addEventListener("pointercancel", () => {
    state.dragging = false;
  });
}

window.addEventListener("resize", render);
bindControls();
bindDrag();
restoreStateFromUrl();
syncInputs();
render();
