"use strict";

const canvas = document.getElementById("curveCanvas");
const ctx = canvas.getContext("2d");

const els = {
  rhs: document.getElementById("rhsInput"),
  a: document.getElementById("aInput"),
  b: document.getElementById("bInput"),
  aSlider: document.getElementById("aSlider"),
  bSlider: document.getElementById("bSlider"),
  liveStandard: document.getElementById("liveStandardInput"),
  apply: document.getElementById("applyCurveBtn"),
  standard: document.getElementById("standardBtn"),
  finiteMode: document.getElementById("finiteModeInput"),
  prime: document.getElementById("primeInput"),
  range: document.getElementById("rangeInput"),
  grid: document.getElementById("gridInput"),
  density: document.getElementById("densityInput"),
  reset: document.getElementById("resetViewBtn"),
  clear: document.getElementById("clearPointsBtn"),
  pMode: document.getElementById("selectPBtn"),
  qMode: document.getElementById("selectQBtn"),
  status: document.getElementById("statusText"),
  label: document.getElementById("curveLabel"),
  note: document.getElementById("formulaNote"),
  pText: document.getElementById("pText"),
  qText: document.getElementById("qText"),
  sumText: document.getElementById("sumText"),
  pProjectiveText: document.getElementById("pProjectiveText"),
  qProjectiveText: document.getElementById("qProjectiveText"),
  sumProjectiveText: document.getElementById("sumProjectiveText"),
  calculationText: document.getElementById("calculationText"),
  formulaStepsText: document.getElementById("formulaStepsText"),
  discriminantCard: document.getElementById("discriminantCard"),
  discriminantTitle: document.getElementById("discriminantTitle"),
  discriminantText: document.getElementById("discriminantText"),
  multiplesEnabled: document.getElementById("multiplesEnabledInput"),
  multiplesCount: document.getElementById("multiplesCountInput"),
  multiplesStatus: document.getElementById("multiplesStatusText"),
  multiplesCountText: document.getElementById("multiplesCountText"),
  multiplesList: document.getElementById("multiplesList"),
  groupSummary: document.getElementById("groupSummaryText"),
  cycleList: document.getElementById("cycleList"),
  clearOrderHighlight: document.getElementById("clearOrderHighlightBtn"),
};

const state = {
  fn: null,
  expr: "x^3 - x + 1",
  range: 4,
  grid: 1,
  density: 700,
  prime: 17,
  selectMode: "P",
  P: null,
  Q: null,
  result: null,
  multiples: [],
  singular: { status: "unknown", value: null, points: [] },
  groupStats: null,
  highlightedOrder: null,
  curvePoints: [],
  finitePoints: [],
  segments: [],
  warnings: [],
  labelBoxes: [],
};

function tokenizeExpression(expr) {
  const tokens = [];
  const tokenRe = /\d*\.?\d+(?:e[+-]?\d+)?|[A-Za-z_]+|[()+\-*/^.,]/gi;
  let lastIndex = 0;
  let match;
  while ((match = tokenRe.exec(expr)) !== null) {
    if (expr.slice(lastIndex, match.index).trim()) {
      throw new Error("式の中に読めない文字があります。");
    }
    tokens.push(match[0]);
    lastIndex = tokenRe.lastIndex;
  }
  if (expr.slice(lastIndex).trim()) {
    throw new Error("式の中に読めない文字があります。");
  }
  return tokens;
}

function insertImplicitMultiplication(expr) {
  const functionNames = new Set(["sin", "cos", "tan", "sqrt", "abs", "exp", "log", "pow"]);
  const valueNames = new Set(["x", "X", "PI", "E"]);
  const tokens = tokenizeExpression(expr);
  const out = [];

  const isNumber = (token) => /^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(token);
  const isFunction = (token) => functionNames.has(token);
  const isValue = (token) => isNumber(token) || valueNames.has(token) || token === ")";
  const startsValue = (token) => isNumber(token) || valueNames.has(token) || isFunction(token) || token === "(";

  tokens.forEach((token, index) => {
    const prev = tokens[index - 1];
    if (index > 0 && isValue(prev) && startsValue(token)) {
      const functionCallParen = isFunction(prev) && token === "(";
      if (!functionCallParen) out.push("*");
    }
    out.push(token);
  });

  return out.join("");
}

function compileExpression(expr) {
  const cleaned = expr.trim();
  const allowed = /^[0-9xX+\-*/^()., \t_sincotaqrplegbmd]+$/i;
  const names = cleaned.match(/[A-Za-z_]+/g) || [];
  const okNames = new Set(["x", "X", "sin", "cos", "tan", "sqrt", "abs", "exp", "log", "pow", "PI", "E"]);
  if (!cleaned || !allowed.test(cleaned) || names.some((name) => !okNames.has(name))) {
    throw new Error("式には x、数値、四則演算、^、sin/cos/sqrt/exp/log/abs などを使えます。");
  }

  const jsExpr = insertImplicitMultiplication(cleaned)
    .replace(/\^/g, "**")
    .replace(/\bPI\b/g, "Math.PI")
    .replace(/\bE\b/g, "Math.E")
    .replace(/\bsin\b/g, "Math.sin")
    .replace(/\bcos\b/g, "Math.cos")
    .replace(/\btan\b/g, "Math.tan")
    .replace(/\bsqrt\b/g, "Math.sqrt")
    .replace(/\babs\b/g, "Math.abs")
    .replace(/\bexp\b/g, "Math.exp")
    .replace(/\blog\b/g, "Math.log")
    .replace(/\bpow\b/g, "Math.pow");

  const fn = new Function("x", `"use strict"; return (${jsExpr});`);
  for (const test of [-2, -0.5, 0, 0.7, 2]) {
    const value = fn(test);
    if (!Number.isFinite(value) && !Number.isNaN(value)) {
      throw new Error("式の値が無限大になります。範囲や式を調整してください。");
    }
  }
  return fn;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(480, Math.round(rect.width * dpr));
  const h = Math.max(420, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function worldToScreen(point) {
  if (els.finiteMode.checked) {
    const pad = 58;
    const p = state.prime;
    const scale = Math.min((canvas.width - pad * 2) / Math.max(1, p - 1), (canvas.height - pad * 2) / Math.max(1, p - 1));
    return {
      x: pad + point.x * scale,
      y: canvas.height - pad - point.y * scale,
    };
  }
  const pad = 46;
  const scale = Math.min((canvas.width - pad * 2) / (state.range * 2), (canvas.height - pad * 2) / (state.range * 2));
  return {
    x: canvas.width / 2 + point.x * scale,
    y: canvas.height / 2 - point.y * scale,
  };
}

function screenToWorld(point) {
  if (els.finiteMode.checked) {
    const pad = 58;
    const p = state.prime;
    const scale = Math.min((canvas.width - pad * 2) / Math.max(1, p - 1), (canvas.height - pad * 2) / Math.max(1, p - 1));
    return {
      x: Math.round((point.x - pad) / scale),
      y: Math.round((canvas.height - pad - point.y) / scale),
    };
  }
  const pad = 46;
  const scale = Math.min((canvas.width - pad * 2) / (state.range * 2), (canvas.height - pad * 2) / (state.range * 2));
  return {
    x: (point.x - canvas.width / 2) / scale,
    y: (canvas.height / 2 - point.y) / scale,
  };
}

function fmt(value) {
  if (!Number.isFinite(value)) return "∞";
  const rounded = Math.abs(value) < 1e-9 ? 0 : value;
  return rounded.toFixed(4).replace(/\.?0+$/, "");
}

function fmtPoint(point) {
  if (!point) return "未選択";
  if (point.infinity) return "無限遠点";
  if (point.finite || els.finiteMode.checked) return `(${mod(point.x)}, ${mod(point.y)})`;
  return `(${fmt(point.x)}, ${fmt(point.y)})`;
}

function fmtProjectivePoint(point) {
  if (!point) return "未選択";
  if (point.infinity) return "[0 : 1 : 0]";
  if (point.finite || els.finiteMode.checked) return `[${mod(point.x)} : ${mod(point.y)} : 1]`;
  return `[${fmt(point.x)} : ${fmt(point.y)} : 1]`;
}

function fmtMath(value) {
  if (!Number.isFinite(value)) return "∞";
  const text = fmt(value);
  return text === "-0" ? "0" : text;
}

function formulaStepsText() {
  if (!state.P || !state.Q) {
    return "P と Q を選ぶと、傾き m と x_R, y_R の計算式を表示します。";
  }

  const result = state.result;
  const line = result?.line;
  const sum = result?.sum;
  if (!result || !line || !sum) {
    if (els.finiteMode.checked && result?.sum) {
      return finiteFormulaStepsText(result.sum);
    }
    return "標準形 y² = x³ + ax + b として計算できる場合、ここに代数的な計算過程が表示されます。";
  }

  const P = state.P;
  const Q = state.Q;
  const samePoint = Math.hypot(P.x - Q.x, P.y - Q.y) < 1e-6;
  const a = Number(els.a.value);

  if (sum.infinity) {
    if (line.vertical) {
      return [
        `x_P = x_Q = ${fmtMath(P.x)} かつ y_P = -y_Q`,
        "P と Q を結ぶ直線は垂直線です。",
        "したがって P + Q = O = [0 : 1 : 0]。"
      ].join("\n");
    }
    return [
      `P = Q かつ y_P = ${fmtMath(P.y)} なので接線は垂直です。`,
      "したがって 2P = O = [0 : 1 : 0]。"
    ].join("\n");
  }

  const third = result.third || result.algebraThird;
  if (!third || !Number.isFinite(line.m)) {
    return "第三交点が得られた場合、ここに m, R, P+Q の式を表示します。";
  }

  const slopeLine = samePoint
    ? `m = (3x_P² + a) / (2y_P) = (3(${fmtMath(P.x)})² + ${fmtMath(a)}) / (2(${fmtMath(P.y)})) = ${fmtMath(line.m)}`
    : `m = (y_Q - y_P) / (x_Q - x_P) = (${fmtMath(Q.y)} - ${fmtMath(P.y)}) / (${fmtMath(Q.x)} - ${fmtMath(P.x)}) = ${fmtMath(line.m)}`;

  const source = result.visualMissing ? "範囲内未検出。標準形の計算結果:" : "標準形の計算結果:";
  return [
    source,
    slopeLine,
    `x_R = m² - x_P - x_Q = (${fmtMath(line.m)})² - ${fmtMath(P.x)} - ${fmtMath(Q.x)} = ${fmtMath(third.x)}`,
    `y_R = m(x_R - x_P) + y_P = ${fmtMath(line.m)}(${fmtMath(third.x)} - ${fmtMath(P.x)}) + ${fmtMath(P.y)} = ${fmtMath(third.y)}`,
    `P + Q = (x_R, -y_R) = ${fmtPoint(sum)} = ${fmtProjectivePoint(sum)}`
  ].join("\n");
}

function finiteFormulaStepsText(sum) {
  if (!state.P || !state.Q || !sum) return "有限体上の点を選ぶと、mod p での計算式を表示します。";
  const P = state.P;
  const Q = state.Q;
  const p = state.prime;
  if (sum.infinity) {
    return [
      `mod ${p}: x_P = x_Q かつ y_P = -y_Q`,
      "したがって P + Q = O = [0 : 1 : 0]。"
    ].join("\n");
  }
  const samePoint = mod(P.x - Q.x, p) === 0 && mod(P.y - Q.y, p) === 0;
  const a = mod(Number(els.a.value), p);
  const numerator = samePoint ? mod(3 * P.x * P.x + a, p) : mod(Q.y - P.y, p);
  const denominator = samePoint ? mod(2 * P.y, p) : mod(Q.x - P.x, p);
  const inv = modInverse(denominator, p);
  const m = mod(numerator * inv, p);
  const slopeLine = samePoint
    ? `m = (3x_P² + a)/(2y_P) = ${numerator} * ${denominator}⁻¹ = ${numerator} * ${inv} ≡ ${m} (mod ${p})`
    : `m = (y_Q-y_P)/(x_Q-x_P) = ${numerator} * ${denominator}⁻¹ = ${numerator} * ${inv} ≡ ${m} (mod ${p})`;
  return [
    `有限体 F_${p} で計算:`,
    slopeLine,
    `x_{P+Q} = m² - x_P - x_Q ≡ ${sum.x} (mod ${p})`,
    `y_{P+Q} = m(x_P - x_{P+Q}) - y_P ≡ ${sum.y} (mod ${p})`,
    `P + Q = ${fmtPoint(sum)} = ${fmtProjectivePoint(sum)}`
  ].join("\n");
}

function projectiveCalculationText() {
  if (!state.P || !state.Q) {
    return "P と Q を選ぶと、射影平面上の和も表示します。";
  }
  const line = state.result?.line;
  const sum = state.result?.sum;
  if (els.finiteMode.checked && sum) {
    if (sum.infinity) return `有限体 F_${state.prime} 上の和は無限遠点 O = [0 : 1 : 0] です。`;
    return `有限体 F_${state.prime} 上で P + Q = ${fmtProjectivePoint(sum)}。`;
  }
  if (sum?.infinity) {
    if (line?.vertical) {
      return `P と Q は同じ垂直線上にあるため、第三交点は無限遠点 O = [0 : 1 : 0] です。したがって P + Q = O。`;
    }
    return `接線が垂直接線になるため、射影平面上の和は無限遠点 O = [0 : 1 : 0] です。`;
  }
  if (state.result?.third && sum) {
    return `直線と曲線の第三交点 R = ${fmtProjectivePoint(state.result.third)} を x軸反転して、P + Q = ${fmtProjectivePoint(sum)}。`;
  }
  if (state.result?.algebraThird && sum) {
    return `第三交点は描画範囲内では未検出です。標準形の計算では R = ${fmtProjectivePoint(state.result.algebraThird)}、したがって P + Q = ${fmtProjectivePoint(sum)}。`;
  }
  return "第三交点が現在の表示範囲内で見つかりません。表示範囲を広げると計算できる場合があります。";
}

function standardExpressionFromInputs() {
  const a = Number(els.a.value);
  const b = Number(els.b.value);
  const aAbs = fmt(Math.abs(a));
  const bAbs = fmt(Math.abs(b));
  return `x^3 ${a < 0 ? "-" : "+"} ${aAbs}x ${b < 0 ? "-" : "+"} ${bAbs}`;
}

function clearSelectedPoints() {
  state.P = null;
  state.Q = null;
  state.result = null;
  state.multiples = [];
  state.highlightedOrder = null;
}

function syncCoefficientControls(source) {
  if (source !== "aInput") els.a.value = els.aSlider.value;
  if (source !== "aSlider") els.aSlider.value = els.a.value;
  if (source !== "bInput") els.b.value = els.bSlider.value;
  if (source !== "bSlider") els.bSlider.value = els.b.value;
}

function applyStandardFromCoefficients({ clearPoints = true } = {}) {
  els.rhs.value = standardExpressionFromInputs();
  if (clearPoints) clearSelectedPoints();
  refresh();
}

function handleCoefficientInput(source) {
  syncCoefficientControls(source);
  const a = Number(els.a.value);
  const b = Number(els.b.value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    els.status.textContent = "a,bには数値を入れてください";
    return;
  }
  if (els.liveStandard.checked) {
    applyStandardFromCoefficients();
  }
}

function yValuesAt(x) {
  const rhs = state.fn(x);
  if (!Number.isFinite(rhs) || rhs < -1e-8) return [];
  const y = Math.sqrt(Math.max(0, rhs));
  return y < 1e-8 ? [0] : [y, -y];
}

function sampleCurve() {
  const points = [];
  const segments = [];
  const n = state.density;
  const min = -state.range;
  const max = state.range;
  let upper = [];
  let lower = [];

  for (let i = 0; i <= n; i += 1) {
    const x = min + ((max - min) * i) / n;
    const ys = yValuesAt(x);
    if (ys.length) {
      const up = { x, y: Math.max(...ys), branch: "upper" };
      const lo = { x, y: Math.min(...ys), branch: "lower" };
      points.push(up, lo);
      upper.push(up);
      if (ys.length > 1) lower.push(lo);
    } else {
      if (upper.length > 1) segments.push(upper);
      if (lower.length > 1) segments.push(lower);
      upper = [];
      lower = [];
    }
  }
  if (upper.length > 1) segments.push(upper);
  if (lower.length > 1) segments.push(lower);
  state.curvePoints = points;
  state.segments = segments;
}

function derivative(x) {
  const h = Math.max(1e-5, state.range * 1e-6);
  return (state.fn(x + h) - state.fn(x - h)) / (2 * h);
}

function lineForPoints(P, Q) {
  if (!P || !Q) return null;
  const sameX = Math.abs(P.x - Q.x) < 1e-7;
  const samePoint = Math.hypot(P.x - Q.x, P.y - Q.y) < 1e-6;
  if (sameX && Math.abs(P.y + Q.y) < 1e-5 && !samePoint) {
    return { vertical: true, x: P.x };
  }
  if (samePoint) {
    if (Math.abs(P.y) < 1e-7) return { infinity: true };
    const m = derivative(P.x) / (2 * P.y);
    return { m, c: P.y - m * P.x, tangent: true };
  }
  const m = (Q.y - P.y) / (Q.x - P.x);
  return { m, c: P.y - m * P.x, tangent: false };
}

function standardCubicValue(x) {
  return x ** 3 + Number(els.a.value) * x + Number(els.b.value);
}

function mod(value, p = state.prime) {
  return ((Math.round(value) % p) + p) % p;
}

function isPrime(n) {
  if (!Number.isInteger(n) || n < 3) return false;
  for (let d = 2; d * d <= n; d += 1) {
    if (n % d === 0) return false;
  }
  return true;
}

function modInverse(value, p = state.prime) {
  let a = mod(value, p);
  if (a === 0) return null;
  let t = 0;
  let nextT = 1;
  let r = p;
  let nextR = a;
  while (nextR !== 0) {
    const q = Math.floor(r / nextR);
    [t, nextT] = [nextT, t - q * nextT];
    [r, nextR] = [nextR, r - q * nextR];
  }
  return r > 1 ? null : mod(t, p);
}

function isUsingStandardCubic() {
  const a = Number(els.a.value);
  const b = Number(els.b.value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return [-2, -0.75, 0, 1.25, 2.5].every((x) => {
    const lhs = state.fn(x);
    const rhs = standardCubicValue(x);
    return Number.isFinite(lhs) && Math.abs(lhs - rhs) < 1e-6 * Math.max(1, Math.abs(rhs));
  });
}

function finiteCubicValue(x) {
  const a = mod(Number(els.a.value));
  const b = mod(Number(els.b.value));
  return mod(x ** 3 + a * x + b);
}

function updateSingularityInfo() {
  const a = Number(els.a.value);
  const b = Number(els.b.value);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    state.singular = { status: "unknown", value: null, points: [] };
    return;
  }

  if (els.finiteMode.checked) {
    const p = state.prime;
    const am = mod(a, p);
    const bm = mod(b, p);
    const value = mod(4 * am ** 3 + 27 * bm ** 2, p);
    const points = [];
    for (let x = 0; x < p; x += 1) {
      if (finiteCubicValue(x) === 0 && mod(3 * x * x + am, p) === 0) {
        points.push({ x, y: 0, finite: true });
      }
    }
    state.singular = { status: value === 0 ? "singular" : "smooth", value, points };
    return;
  }

  const value = 4 * a ** 3 + 27 * b ** 2;
  const scale = Math.max(1, Math.abs(4 * a ** 3), Math.abs(27 * b ** 2));
  const normalized = Math.abs(value) / scale;
  const points = [];
  if (Math.abs(value) < 1e-7 || normalized < 1e-5) {
    const candidates = [];
    if (Math.abs(a) < 1e-10) {
      candidates.push(0);
    } else if (a < 0) {
      const root = Math.sqrt(-a / 3);
      candidates.push(root, -root);
    }
    for (const x of candidates) {
      if (Math.abs(standardCubicValue(x)) < Math.max(1e-5, scale * 1e-6)) {
        points.push({ x, y: 0 });
      }
    }
  }
  state.singular = {
    status: Math.abs(value) < 1e-8 ? "singular" : (normalized < 5e-3 ? "near" : "smooth"),
    value,
    normalized,
    points,
  };
}

function sampleFinitePoints() {
  state.finitePoints = [];
  const p = state.prime;
  for (let x = 0; x < p; x += 1) {
    const rhs = finiteCubicValue(x);
    for (let y = 0; y < p; y += 1) {
      if (mod(y * y) === rhs) {
        state.finitePoints.push({ x, y, finite: true });
      }
    }
  }
}

function finiteAdd(P, Q) {
  if (!P || !Q) return null;
  if (P.infinity) return Q;
  if (Q.infinity) return P;
  const p = state.prime;
  const a = mod(Number(els.a.value));
  const samePoint = mod(P.x - Q.x, p) === 0 && mod(P.y - Q.y, p) === 0;
  if (mod(P.x - Q.x, p) === 0 && mod(P.y + Q.y, p) === 0 && !samePoint) {
    return { infinity: true };
  }

  let numerator;
  let denominator;
  if (samePoint) {
    if (mod(2 * P.y, p) === 0) return { infinity: true };
    numerator = mod(3 * P.x * P.x + a, p);
    denominator = mod(2 * P.y, p);
  } else {
    numerator = mod(Q.y - P.y, p);
    denominator = mod(Q.x - P.x, p);
  }
  const inv = modInverse(denominator, p);
  if (inv == null) return { infinity: true };
  const m = mod(numerator * inv, p);
  const x3 = mod(m * m - P.x - Q.x, p);
  const y3 = mod(m * (P.x - x3) - P.y, p);
  return { x: x3, y: y3, finite: true, slope: m, numerator, denominator };
}

function finitePointKey(point) {
  if (!point || point.infinity) return "O";
  return `${mod(point.x)},${mod(point.y)}`;
}

function finitePointOrder(point, maxSteps) {
  if (!point) return null;
  if (point.infinity) return 1;
  let current = { infinity: true };
  for (let n = 1; n <= maxSteps; n += 1) {
    current = finiteAdd(current, point);
    if (!current) return null;
    if (current.infinity) return n;
  }
  return null;
}

function updateFiniteGroupStats() {
  if (!els.finiteMode.checked) {
    state.groupStats = null;
    return;
  }

  const total = state.finitePoints.length + 1;
  const maxSteps = Math.max(total + 2, state.prime * state.prime + 2);
  const orderCounts = new Map([[1, 1]]);
  const pointOrders = new Map([["O", 1]]);
  let maxOrder = 1;
  let failed = 0;

  for (const point of state.finitePoints) {
    const order = finitePointOrder(point, maxSteps);
    if (!order) {
      failed += 1;
      continue;
    }
    pointOrders.set(finitePointKey(point), order);
    orderCounts.set(order, (orderCounts.get(order) || 0) + 1);
    maxOrder = Math.max(maxOrder, order);
  }

  state.groupStats = {
    total,
    finiteCount: state.finitePoints.length,
    distribution: [...orderCounts.entries()].sort((a, b) => a[0] - b[0]),
    pointOrders,
    maxOrder,
    generatorCount: orderCounts.get(total) || 0,
    cyclic: maxOrder === total,
    failed,
  };
}

function algebraicAddition(P, Q, line) {
  if (!line || line.infinity || line.vertical) {
    return { sum: { infinity: true }, third: null };
  }
  if (!isUsingStandardCubic()) return null;
  const x3 = line.m ** 2 - P.x - Q.x;
  const y3 = line.m * x3 + line.c;
  if (!Number.isFinite(x3) || !Number.isFinite(y3)) return null;
  return {
    third: { x: x3, y: y3 },
    sum: { x: x3, y: -y3 },
  };
}

function addGroupPoints(P, Q) {
  if (!P || !Q) return null;
  if (els.finiteMode.checked) return finiteAdd(P, Q);
  if (P.infinity) return Q;
  if (Q.infinity) return P;
  const line = lineForPoints(P, Q);
  if (!line || line.infinity || line.vertical) return { infinity: true };
  const algebra = algebraicAddition(P, Q, line);
  return algebra?.sum || null;
}

function computeMultiples() {
  state.multiples = [];
  if (!els.multiplesEnabled.checked || !state.P) return;
  if (!els.finiteMode.checked && !isUsingStandardCubic()) return;

  const maxN = Number(els.multiplesCount.value);
  let current = state.P;
  for (let n = 1; n <= maxN; n += 1) {
    state.multiples.push({ n, point: current });
    if (n < maxN) {
      current = addGroupPoints(current, state.P);
      if (!current) break;
    }
  }
}

function isPointVisible(point) {
  if (els.finiteMode.checked) return point && !point.infinity;
  return point && !point.infinity && Math.abs(point.x) <= state.range && Math.abs(point.y) <= state.range;
}

function bisectRoot(fn, a, b) {
  let fa = fn(a);
  let fb = fn(b);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return null;
  if (Math.abs(fa) < 1e-8) return a;
  if (Math.abs(fb) < 1e-8) return b;
  if (fa * fb > 0) return null;
  let lo = a;
  let hi = b;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    const fm = fn(mid);
    if (!Number.isFinite(fm)) return null;
    if (Math.abs(fm) < 1e-10) return mid;
    if (fa * fm <= 0) {
      hi = mid;
      fb = fm;
    } else {
      lo = mid;
      fa = fm;
    }
  }
  return (lo + hi) / 2;
}

function uniquePush(list, x) {
  if (!Number.isFinite(x)) return;
  if (!list.some((v) => Math.abs(v - x) < 1e-4)) list.push(x);
}

function findLineIntersections(line, P, Q) {
  if (line.vertical || line.infinity) return [];
  const h = (x) => state.fn(x) - (line.m * x + line.c) ** 2;
  const roots = [];
  const min = -state.range * 1.2;
  const max = state.range * 1.2;
  const steps = Math.max(600, state.density);
  let prevX = min;
  let prevY = h(prevX);

  uniquePush(roots, P.x);
  uniquePush(roots, Q.x);

  for (let i = 1; i <= steps; i += 1) {
    const x = min + ((max - min) * i) / steps;
    const y = h(x);
    if (Number.isFinite(prevY) && Number.isFinite(y)) {
      if (Math.abs(y) < 1e-5) uniquePush(roots, x);
      if (prevY * y < 0) {
        const root = bisectRoot(h, prevX, x);
        uniquePush(roots, root);
      }
    }
    prevX = x;
    prevY = y;
  }

  return roots
    .map((x) => ({ x, y: line.m * x + line.c }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function computeAddition() {
  state.result = null;
  if (!state.P || !state.Q) return;
  if (els.finiteMode.checked) {
    const sum = finiteAdd(state.P, state.Q);
    state.result = { line: null, sum, third: null, finite: true };
    return;
  }
  const line = lineForPoints(state.P, state.Q);
  if (!line || line.infinity || line.vertical) {
    state.result = { line, sum: { infinity: true }, third: null };
    return;
  }
  const algebra = algebraicAddition(state.P, state.Q, line);

  const intersections = findLineIntersections(line, state.P, state.Q);
  const samePoint = Math.hypot(state.P.x - state.Q.x, state.P.y - state.Q.y) < 1e-6;
  const candidates = intersections.filter((point) => {
    const nearP = Math.hypot(point.x - state.P.x, point.y - state.P.y) < (samePoint ? 1e-3 : 1e-2);
    const nearQ = Math.hypot(point.x - state.Q.x, point.y - state.Q.y) < 1e-2;
    return samePoint ? !nearP : !(nearP || nearQ);
  });

  let third = candidates[0];
  if (!third && intersections.length >= 3) {
    third = intersections.sort((a, b) => Math.abs(a.x - state.P.x) - Math.abs(b.x - state.P.x))[2];
  }
  if (!third) {
    state.result = algebra
      ? { line, sum: algebra.sum, third: null, algebraThird: algebra.third, visualMissing: true }
      : { line, sum: null, third: null, visualMissing: true };
    return;
  }
  state.result = {
    line,
    third,
    sum: { x: third.x, y: -third.y },
    algebraThird: algebra?.third || null,
    visualMissing: false,
  };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbfcfd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
  ctx.font = `${Math.max(11, canvas.width / 120)}px system-ui, sans-serif`;

  const step = state.grid;
  for (let x = Math.ceil(-state.range / step) * step; x <= state.range + 1e-6; x += step) {
    const a = worldToScreen({ x, y: -state.range });
    const b = worldToScreen({ x, y: state.range });
    ctx.strokeStyle = Math.abs(x) < 1e-8 ? "#87929b" : "#e1e6e9";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (Math.abs(x) > 1e-8) {
      ctx.fillStyle = "#7b8790";
      ctx.fillText(fmt(x), a.x + 4, worldToScreen({ x: 0, y: 0 }).y - 5);
    }
  }
  for (let y = Math.ceil(-state.range / step) * step; y <= state.range + 1e-6; y += step) {
    const a = worldToScreen({ x: -state.range, y });
    const b = worldToScreen({ x: state.range, y });
    ctx.strokeStyle = Math.abs(y) < 1e-8 ? "#87929b" : "#e1e6e9";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (Math.abs(y) > 1e-8) {
      ctx.fillStyle = "#7b8790";
      ctx.fillText(fmt(y), worldToScreen({ x: 0, y: y }).x + 5, a.y - 4);
    }
  }
}

function drawFiniteGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fbfcfd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const p = state.prime;
  ctx.save();
  ctx.strokeStyle = "#e1e6e9";
  ctx.fillStyle = "#7b8790";
  ctx.lineWidth = 1;
  ctx.font = `${Math.max(11, canvas.width / 125)}px system-ui, sans-serif`;

  for (let i = 0; i < p; i += 1) {
    const bottom = worldToScreen({ x: i, y: 0 });
    const top = worldToScreen({ x: i, y: p - 1 });
    const left = worldToScreen({ x: 0, y: i });
    const right = worldToScreen({ x: p - 1, y: i });
    ctx.beginPath();
    ctx.moveTo(bottom.x, bottom.y);
    ctx.lineTo(top.x, top.y);
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
    if (p <= 31 || i % Math.ceil(p / 16) === 0) {
      ctx.fillText(String(i), bottom.x - 4, bottom.y + 22);
      ctx.fillText(String(i), left.x - 28, left.y + 4);
    }
  }
  ctx.restore();
}

function drawCurve() {
  if (els.finiteMode.checked) {
    drawFiniteCurve();
    return;
  }
  ctx.strokeStyle = "#176b87";
  ctx.lineWidth = Math.max(2.5, canvas.width / 520);
  ctx.lineCap = "round";
  for (const segment of state.segments) {
    ctx.beginPath();
    segment.forEach((point, index) => {
      const s = worldToScreen(point);
      if (index === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });
    ctx.stroke();
  }
}

function drawFiniteCurve() {
  ctx.save();
  for (const point of state.finitePoints) {
    const s = worldToScreen(point);
    ctx.fillStyle = "#176b87";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawOrderHighlight() {
  if (!els.finiteMode.checked || !state.highlightedOrder || !state.groupStats) return;
  const highlighted = state.finitePoints.filter((point) => state.groupStats.pointOrders.get(finitePointKey(point)) === state.highlightedOrder);
  if (!highlighted.length) return;

  ctx.save();
  highlighted.forEach((point) => {
    const s = worldToScreen(point);
    ctx.fillStyle = "rgba(197, 140, 33, 0.20)";
    ctx.strokeStyle = "#c58c21";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawLineAndResult() {
  if (els.finiteMode.checked) return;
  if (!state.result || !state.result.line || state.result.line.infinity) return;
  const { line, third, sum } = state.result;
  ctx.save();
  ctx.lineWidth = Math.max(1.8, canvas.width / 760);
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = "#d95f30";
  ctx.beginPath();
  if (line.vertical) {
    const a = worldToScreen({ x: line.x, y: -state.range });
    const b = worldToScreen({ x: line.x, y: state.range });
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  } else {
    const x1 = -state.range;
    const x2 = state.range;
    const a = worldToScreen({ x: x1, y: line.m * x1 + line.c });
    const b = worldToScreen({ x: x2, y: line.m * x2 + line.c });
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
  ctx.restore();

  if (third && sum) {
    drawPoint(third, "#d95f30", "R");
    ctx.save();
    ctx.strokeStyle = "#2d8a55";
    ctx.lineWidth = Math.max(1.5, canvas.width / 900);
    ctx.setLineDash([4, 6]);
    const a = worldToScreen(third);
    const b = worldToScreen(sum);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
    drawPoint(sum, "#2d8a55", "P+Q");
  }
}

function drawFiniteResult() {
  if (!els.finiteMode.checked || !state.result?.sum || state.result.sum.infinity) return;
  drawPoint(state.result.sum, "#2d8a55", "P+Q");
}

function drawMultiples() {
  if (!state.multiples.length) return;
  const visible = state.multiples.filter((item) => isPointVisible(item.point));
  if (!visible.length) return;

  ctx.save();
  ctx.strokeStyle = "rgba(77, 94, 196, 0.46)";
  ctx.lineWidth = Math.max(1.5, canvas.width / 1100);
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  visible.forEach((item, index) => {
    const s = worldToScreen(item.point);
    if (index === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();
  ctx.restore();

  visible.forEach((item) => {
    drawPoint(item.point, "#4d5ec4", `${item.n}P`);
  });
}

function drawSingularPoints() {
  if (!state.singular.points.length) return;
  for (const point of state.singular.points) {
    drawPoint(point, "#9f3f3f", "singular");
  }
}

function boxesOverlap(a, b, padding = 3) {
  return !(
    a.x + a.w + padding < b.x ||
    b.x + b.w + padding < a.x ||
    a.y + a.h + padding < b.y ||
    b.y + b.h + padding < a.y
  );
}

function placeLabel(anchor, text, fontSize) {
  const width = ctx.measureText(text).width;
  const height = fontSize * 1.25;
  const margin = 8;
  const candidates = [
    { dx: 12, dy: -12 },
    { dx: 12, dy: 20 },
    { dx: -width - 12, dy: -12 },
    { dx: -width - 12, dy: 20 },
    { dx: 18, dy: -34 },
    { dx: 18, dy: 42 },
    { dx: -width - 18, dy: -34 },
    { dx: -width - 18, dy: 42 },
    { dx: -width / 2, dy: -42 },
    { dx: -width / 2, dy: 54 },
  ];

  let fallback = null;
  for (const candidate of candidates) {
    const x = Math.min(Math.max(anchor.x + candidate.dx, margin), canvas.width - width - margin);
    const baseline = Math.min(Math.max(anchor.y + candidate.dy, margin + height), canvas.height - margin);
    const box = { x, y: baseline - height, w: width, h: height };
    fallback = fallback || { x, baseline, box };
    if (!state.labelBoxes.some((existing) => boxesOverlap(existing, box))) {
      state.labelBoxes.push(box);
      return { x, baseline };
    }
  }

  state.labelBoxes.push(fallback.box);
  return { x: fallback.x, baseline: fallback.baseline };
}

function drawPoint(point, color, label) {
  if (!point || point.infinity) return;
  const s = worldToScreen(point);
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  const fontSize = Math.max(13, canvas.width / 90);
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
  const labelPosition = placeLabel(s, label, fontSize);
  const textWidth = ctx.measureText(label).width;
  const labelCenter = { x: labelPosition.x + textWidth / 2, y: labelPosition.baseline - fontSize * 0.45 };
  if (Math.hypot(labelCenter.x - s.x, labelCenter.y - s.y) > 34) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(labelCenter.x, labelCenter.y);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillText(label, labelPosition.x, labelPosition.baseline);
  ctx.restore();
}

function draw() {
  resizeCanvas();
  state.labelBoxes = [];
  if (els.finiteMode.checked) drawFiniteGrid();
  else drawGrid();
  drawCurve();
  drawOrderHighlight();
  drawMultiples();
  drawSingularPoints();
  drawFiniteResult();
  drawLineAndResult();
  drawPoint(state.P, "#283044", "P");
  drawPoint(state.Q, "#6d3f8f", "Q");
}

function nearestCurvePoint(world, maxPixels = 28) {
  if (els.finiteMode.checked) {
    const target = worldToScreen(world);
    let best = null;
    let bestDist = Infinity;
    for (const point of state.finitePoints) {
      const s = worldToScreen(point);
      const dist = Math.hypot(s.x - target.x, s.y - target.y);
      if (dist < bestDist) {
        best = point;
        bestDist = dist;
      }
    }
    return bestDist <= Math.max(18, canvas.width / 60) ? { x: best.x, y: best.y, finite: true } : null;
  }
  let best = null;
  let bestDist = Infinity;
  for (const point of state.curvePoints) {
    const s = worldToScreen(point);
    const target = worldToScreen(world);
    const dist = Math.hypot(s.x - target.x, s.y - target.y);
    if (dist < bestDist) {
      best = point;
      bestDist = dist;
    }
  }
  return bestDist <= maxPixels ? { x: best.x, y: best.y } : null;
}

function updateMultiplesReadout() {
  els.multiplesCountText.textContent = `n = ${els.multiplesCount.value}`;
  els.multiplesList.innerHTML = "";

  if (!els.multiplesEnabled.checked) {
    els.multiplesStatus.textContent = "非表示";
    return;
  }
  if (!state.P) {
    els.multiplesStatus.textContent = "P を選んでください";
    return;
  }
  if (!els.finiteMode.checked && !isUsingStandardCubic()) {
    els.multiplesStatus.textContent = "標準形 y² = x³ + ax + b のとき計算できます";
    return;
  }
  if (!state.multiples.length) {
    els.multiplesStatus.textContent = "倍点を計算できません";
    return;
  }

  const visibleCount = state.multiples.filter((item) => isPointVisible(item.point)).length;
  els.multiplesStatus.textContent = `${state.multiples.length}点を計算 / 画面内 ${visibleCount}点`;

  const frag = document.createDocumentFragment();
  state.multiples.forEach((item) => {
    const row = document.createElement("div");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    label.textContent = `${item.n}P`;
    const place = item.point?.infinity ? "無限遠点" : (isPointVisible(item.point) ? "画面内" : "範囲外");
    value.textContent = `${fmtPoint(item.point)} / ${fmtProjectivePoint(item.point)} / ${place}`;
    row.append(label, value);
    frag.append(row);
  });
  els.multiplesList.append(frag);
}

function updateGroupStatsReadout() {
  els.cycleList.innerHTML = "";
  if (!els.finiteMode.checked) {
    els.groupSummary.textContent = "有限体モードで表示します。";
    return;
  }
  const stats = state.groupStats;
  if (!stats) {
    els.groupSummary.textContent = "群情報を計算できません。";
    return;
  }

  const selectedOrder = state.P ? stats.pointOrders.get(finitePointKey(state.P)) : null;
  const selectedText = selectedOrder ? ` / ord(P) = ${selectedOrder}` : " / P未選択";
  const cyclicText = stats.cyclic ? `巡回群です。生成元 ${stats.generatorCount}点` : `最大位数 ${stats.maxOrder}`;
  const failedText = stats.failed ? ` / 未計算 ${stats.failed}点` : "";
  els.groupSummary.textContent = `#E(F_${state.prime}) = ${stats.finiteCount} + O = ${stats.total}${selectedText} / ${cyclicText}${failedText}`;

  const frag = document.createDocumentFragment();
  stats.distribution.forEach(([order, count]) => {
    const row = document.createElement("button");
    const label = document.createElement("span");
    const value = document.createElement("strong");
    row.type = "button";
    row.className = state.highlightedOrder === order ? "active" : "";
    row.dataset.order = String(order);
    row.title = `位数 ${order} の点を強調`;
    label.textContent = `ord ${order}`;
    value.textContent = `${count}点`;
    row.append(label, value);
    row.addEventListener("click", () => {
      state.highlightedOrder = state.highlightedOrder === order ? null : order;
      updateGroupStatsReadout();
      draw();
    });
    frag.append(row);
  });
  els.cycleList.append(frag);
}

function updateDiscriminantReadout() {
  const info = state.singular;
  els.discriminantCard.classList.remove("smooth", "near", "singular", "unknown");
  els.discriminantCard.classList.add(info.status || "unknown");

  if (els.finiteMode.checked) {
    els.discriminantTitle.textContent = info.status === "singular" ? "特異です" : "滑らかです";
    const pointText = info.points.length ? ` / 特異点候補 ${info.points.map(fmtPoint).join(", ")}` : "";
    els.discriminantText.textContent = `F_${state.prime}: 4a^3 + 27b^2 ≡ ${info.value} (mod ${state.prime})${pointText}`;
    return;
  }

  const delta = Number.isFinite(info.value) ? -16 * info.value : NaN;
  if (info.status === "singular") {
    els.discriminantTitle.textContent = "特異です";
  } else if (info.status === "near") {
    els.discriminantTitle.textContent = "特異に近いです";
  } else {
    els.discriminantTitle.textContent = "滑らかです";
  }
  const pointText = info.points.length ? ` / 特異点候補 ${info.points.map(fmtPoint).join(", ")}` : "";
  els.discriminantText.textContent = `D = 4a^3 + 27b^2 = ${fmt(info.value)} / Δ = -16D = ${fmt(delta)}${pointText}`;
}

function updateReadouts() {
  els.pText.textContent = fmtPoint(state.P);
  els.qText.textContent = fmtPoint(state.Q);
  const sum = state.result?.sum;
  const visualPrefix = state.result?.visualMissing && sum && !sum.infinity ? "範囲内未検出 / 計算: " : "";
  els.sumText.textContent = sum ? `${visualPrefix}${fmtPoint(sum)}` : (state.P && state.Q ? "範囲内未検出 / 計算不可" : "未計算");
  els.pProjectiveText.textContent = fmtProjectivePoint(state.P);
  els.qProjectiveText.textContent = fmtProjectivePoint(state.Q);
  els.sumProjectiveText.textContent = sum ? `${visualPrefix}${fmtProjectivePoint(sum)}` : (state.P && state.Q ? "範囲内未検出 / 計算不可" : "未計算");
  els.calculationText.textContent = projectiveCalculationText();
  els.formulaStepsText.textContent = formulaStepsText();
  els.label.textContent = els.finiteMode.checked ? `y² ≡ x³ + ${mod(Number(els.a.value))}x + ${mod(Number(els.b.value))} (mod ${state.prime})` : `y² = ${state.expr}`;
  const a = Number(els.a.value);
  const b = Number(els.b.value);
  const disc = -16 * (4 * a ** 3 + 27 * b ** 2);
  const finiteDisc = mod(4 * mod(a) ** 3 + 27 * mod(b) ** 2);
  const discText = els.finiteMode.checked
    ? `F_${state.prime}: ${state.finitePoints.length}点 + O / 特異判定値 ${finiteDisc}`
    : (Number.isFinite(disc) ? `判別式 Δ = ${fmt(disc)}` : "");
  const resultText = sum ? `P + Q = ${visualPrefix}${fmtPoint(sum)}` : "点を選択してください";
  els.status.textContent = resultText;
  els.note.textContent = `${discText}${discText ? " / " : ""}${state.warnings.join(" ") || (els.finiteMode.checked ? "格子上の青い点をクリックして選択できます。" : "曲線上の点をクリックして選択できます。")}`;
  updateDiscriminantReadout();
  updateMultiplesReadout();
  updateGroupStatsReadout();
}

function refresh() {
  try {
    state.expr = els.rhs.value.trim();
    state.fn = compileExpression(state.expr);
    state.range = Number(els.range.value);
    state.grid = Number(els.grid.value);
    state.density = Number(els.density.value);
    state.warnings = [];
    const prime = Number(els.prime.value);
    if (isPrime(prime)) {
      state.prime = prime;
    } else {
      state.prime = isPrime(state.prime) ? state.prime : 17;
      if (els.finiteMode.checked) {
        state.warnings.push("p は 3 以上の素数を指定してください。p=2 はこの標準形では未対応です。");
      }
    }
    updateSingularityInfo();
    if (els.finiteMode.checked) {
      sampleFinitePoints();
      updateFiniteGroupStats();
    } else {
      sampleCurve();
      state.groupStats = null;
    }
    computeAddition();
    computeMultiples();
    updateReadouts();
    draw();
  } catch (error) {
    els.status.textContent = "式を確認してください";
    els.note.textContent = error.message;
  }
}

function setMode(mode) {
  state.selectMode = mode;
  els.pMode.classList.toggle("active", mode === "P");
  els.qMode.classList.toggle("active", mode === "Q");
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: (event.clientX - rect.left) * dpr,
    y: (event.clientY - rect.top) * dpr,
  };
}

canvas.addEventListener("click", (event) => {
  const world = screenToWorld(canvasPoint(event));
  const point = nearestCurvePoint(world);
  if (!point) {
    els.status.textContent = "曲線の近くをクリックしてください";
    return;
  }
  if (state.selectMode === "P") {
    state.P = point;
    setMode("Q");
  } else {
    state.Q = point;
    setMode("P");
  }
  computeAddition();
  computeMultiples();
  updateReadouts();
  draw();
});

els.apply.addEventListener("click", refresh);
els.standard.addEventListener("click", () => applyStandardFromCoefficients());
els.finiteMode.addEventListener("change", () => {
  clearSelectedPoints();
  refresh();
});
els.prime.addEventListener("input", () => {
  clearSelectedPoints();
  refresh();
});
els.a.addEventListener("input", () => handleCoefficientInput("aInput"));
els.b.addEventListener("input", () => handleCoefficientInput("bInput"));
els.aSlider.addEventListener("input", () => handleCoefficientInput("aSlider"));
els.bSlider.addEventListener("input", () => handleCoefficientInput("bSlider"));
els.liveStandard.addEventListener("change", () => {
  if (els.liveStandard.checked) applyStandardFromCoefficients();
});
els.range.addEventListener("input", refresh);
els.grid.addEventListener("input", refresh);
els.density.addEventListener("input", refresh);
els.reset.addEventListener("click", () => {
  els.range.value = 4;
  els.grid.value = 1;
  els.density.value = 700;
  refresh();
});
els.clear.addEventListener("click", () => {
  clearSelectedPoints();
  updateReadouts();
  draw();
});
els.multiplesEnabled.addEventListener("change", () => {
  computeMultiples();
  updateReadouts();
  draw();
});
els.multiplesCount.addEventListener("input", () => {
  computeMultiples();
  updateReadouts();
  draw();
});
els.clearOrderHighlight.addEventListener("click", () => {
  state.highlightedOrder = null;
  updateGroupStatsReadout();
  draw();
});
els.pMode.addEventListener("click", () => setMode("P"));
els.qMode.addEventListener("click", () => setMode("Q"));
document.querySelectorAll("[data-rhs]").forEach((button) => {
  button.addEventListener("click", () => {
    els.rhs.value = button.dataset.rhs;
    els.a.value = button.dataset.a;
    els.b.value = button.dataset.b;
    els.aSlider.value = button.dataset.a;
    els.bSlider.value = button.dataset.b;
    clearSelectedPoints();
    refresh();
  });
});
document.querySelectorAll("[data-prime]").forEach((button) => {
  button.addEventListener("click", () => {
    els.prime.value = button.dataset.prime;
    clearSelectedPoints();
    refresh();
  });
});

window.addEventListener("resize", draw);

refresh();
