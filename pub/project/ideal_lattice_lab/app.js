"use strict";

const $ = (id) => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";
const VARS = ["x", "y", "z", "w", "v"];
const SQRT_SYMBOL = "s";

let state = {
  mode: "lattice",
  ring: null,
  ideals: [],
  selectedId: null,
  resultId: null,
  opEdge: null,
  showTransitive: false,
  showGrid: true,
  axes: { x: 0, y: 1, color: 2 },
  elementView: { zoom: 1, panX: 0, panY: 0 },
  opAnalysis: null
};
let elementDrag = null;

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function divisors(n) {
  const out = [];
  for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i);
  return out;
}
function primeFactors(n) {
  const out = [];
  let m = Math.abs(n);
  for (let p = 2; p * p <= m; p++) {
    if (m % p === 0) {
      out.push(p);
      while (m % p === 0) m /= p;
    }
  }
  if (m > 1) out.push(m);
  return out;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function makeIdeal(id, label, rank, data, extras = {}) {
  return { id, label, rank, data, isPrime: false, atoms: [], ...extras };
}

function buildRing() {
  const type = $("ring-type").value;
  const n = clampInt($("param-n").value, 2, 999, 12);
  const m = clampInt($("param-m").value, 2, 20, 4);
  const d = clampInt($("param-d")?.value ?? -5, -50, 50, -5) || -5;
  const vars = clampInt($("param-vars").value, 2, 5, 3);
  const bound = clampInt($("param-bound").value, 2, 9, 5);

  if (type === "z") {
    const samples = [0, 1, 2, 3, 4, 5, 6, 10, 12].map((d) => makeZIdeal(d));
    state.ring = { type, name: "Z", description: "整数環。格子はサンプル主イデアルで表示します。", params: { bound } };
    state.ideals = uniqueIdeals(samples);
  } else if (type === "zmod") {
    state.ring = { type, name: `Z/${n}Z`, description: `剰余環。すべてのイデアルは divisor d | ${n} に対する (d) です。`, params: { n } };
    state.ideals = divisors(n).map((d) => makeZnIdeal(d, n));
  } else if (type === "truncated") {
    state.ring = { type, name: `k[x]/(x^${m})`, description: "Artin 局所環。イデアルは (1), (x), ... , (x^m)=0 の鎖です。", params: { m } };
    state.ideals = Array.from({ length: m + 1 }, (_, i) => makeTruncIdeal(i, m));
  } else if (type === "quadratic") {
    state.ring = { type, name: `Z[√${d}]`, description: `元 a+b√${d} を複素平面の格子点として表示します。イデアル (α,β) は αR+βR の整数格子です。`, params: { d, bound: Math.max(5, bound) } };
    state.ideals = quadraticPresetIdeals(d);
  } else {
    state.ring = { type, name: `k[${VARS.slice(0, vars).join(",")}]`, description: "単項式イデアルを指数ベクトルの上集合として近似表示します。", params: { vars, bound } };
    state.ideals = [
      makeMonomialIdeal([], vars, bound),
      makeMonomialIdeal([[1,0,0,0,0].slice(0, vars)], vars, bound),
      makeMonomialIdeal([[2,0,0,0,0].slice(0, vars), [0,1,1,0,0].slice(0, vars)], vars, bound),
      makeMonomialIdeal([[1,1,0,0,0].slice(0, vars), [0,0,2,0,0].slice(0, vars)], vars, bound),
      makeMonomialIdeal([[1,0,0,0,0].slice(0, vars), [0,1,0,0,0].slice(0, vars), [0,0,1,0,0].slice(0, vars)], vars, bound)
    ];
  }

  markPrimes();
  state.selectedId = state.ring.type === "quadratic"
    ? state.ideals[1]?.id || state.ideals[0]?.id || null
    : state.ring.type === "monomial"
    ? state.ideals[2]?.id || state.ideals[0]?.id || null
    : state.ideals[0]?.id || null;
  state.resultId = null;
  state.opEdge = null;
  state.opAnalysis = null;
  state.elementView = { zoom: 1, panX: 0, panY: 0 };
  elementDrag = null;
  fillAxisControls();
  render();
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function makeZIdeal(d) {
  const label = d === 0 ? "(0)" : d === 1 ? "(1)=Z" : `(${d})`;
  return makeIdeal(`z:${d}`, label, d === 0 ? 0 : Math.max(1, 10 - d), { d }, { sortKey: d });
}

function makeZnIdeal(d, n) {
  const rank = primeFactors(n / d).reduce((a, p) => a + valuation(n / d, p), 0);
  return makeIdeal(`zn:${d}`, d === 1 ? "(1)=R" : `(${d})`, rank, { d }, { sortKey: d });
}

function makeTruncIdeal(i, m) {
  const label = i === 0 ? "(1)=R" : i === m ? "(0)" : `(x^${i})`;
  return makeIdeal(`tx:${i}`, label, m - i, { i }, { sortKey: i });
}

function makeMonomialIdeal(gens, vars, bound) {
  const normalized = minimizeGens(gens.map((g) => g.slice(0, vars)));
  const id = `mon:${normalized.map((g) => g.join(".")).join("|") || "0"}`;
  const label = normalized.length ? `(${normalized.map(monomialLabel).join(", ")})` : "(0)";
  const cells = monomialCells(normalized, vars, bound);
  const rank = Math.round((cells.length / Math.pow(bound + 1, vars)) * 8);
  return makeIdeal(id, label, rank, { gens: normalized, cells }, { sortKey: label });
}

function quadraticPresetIdeals(d) {
  if (d === -5) {
    return [
      makeQuadraticIdeal([[1, 0]], d),
      makeQuadraticIdeal([[2, 0], [1, 1]], d),
      makeQuadraticIdeal([[3, 0], [1, 1]], d),
      makeQuadraticIdeal([[3, 0], [1, -1]], d),
      makeQuadraticIdeal([[0, 1]], d),
      makeQuadraticIdeal([[2, 0]], d),
      makeQuadraticIdeal([[6, 0], [0, 1]], d)
    ];
  }
  return [
    makeQuadraticIdeal([[1, 0]], d),
    makeQuadraticIdeal([[2, 0]], d),
    makeQuadraticIdeal([[3, 0]], d),
    makeQuadraticIdeal([[0, 1]], d),
    makeQuadraticIdeal([[2, 0], [1, 1]], d)
  ];
}

function makeQuadraticIdeal(gens, d) {
  const normalized = gens.map(([a, b]) => [Number(a) || 0, Number(b) || 0]);
  const fullBasis = quadraticIdealBasis(normalized, d);
  const index = quadraticLatticeIndex(fullBasis);
  const basis = quadraticSmallBasis(fullBasis, index);
  const id = `quad:${d}:${normalized.map((g) => g.join(".")).join("|")}`;
  const label = `(${normalized.map(quadraticElementLabel).join(", ")})`;
  const rank = index === 0 ? 0 : Math.max(1, 11 - Math.min(10, Math.round(Math.log2(index + 1) * 2)));
  return makeIdeal(id, label, rank, { gens: normalized, basis, index }, { sortKey: `${index}:${label}` });
}

function quadraticIdealBasis(gens, d) {
  const vectors = [];
  gens.forEach((g) => {
    vectors.push(g);
    vectors.push(mulQuadratic(g, [0, 1], d));
  });
  return uniqueVectors(vectors.filter(([a, b]) => a !== 0 || b !== 0));
}

function mulQuadratic([a, b], [c, e], d) {
  return [a * c + b * e * d, a * e + b * c];
}

function uniqueVectors(vectors) {
  return [...new Map(vectors.map((v) => [v.join(","), v])).values()];
}

function quadraticLatticeIndex(vectors) {
  let g = 0;
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const det = Math.abs(vectors[i][0] * vectors[j][1] - vectors[i][1] * vectors[j][0]);
      if (det) g = g ? gcd(g, det) : det;
    }
  }
  return g;
}

function quadraticSmallBasis(vectors, index) {
  if (!index) return vectors.slice(0, 2);
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const det = Math.abs(vectors[i][0] * vectors[j][1] - vectors[i][1] * vectors[j][0]);
      if (det === index) return [vectors[i], vectors[j]];
    }
  }
  return vectors.slice(0, 2);
}

function quadraticElementLabel([a, b]) {
  if (b === 0) return String(a);
  if (a === 0) return b === 1 ? SQRT_SYMBOL : b === -1 ? `-${SQRT_SYMBOL}` : `${b}${SQRT_SYMBOL}`;
  const sign = b > 0 ? "+" : "-";
  const mag = Math.abs(b) === 1 ? SQRT_SYMBOL : `${Math.abs(b)}${SQRT_SYMBOL}`;
  return `${a}${sign}${mag}`;
}

function valuation(n, p) {
  let c = 0;
  while (n % p === 0) { c++; n /= p; }
  return c;
}

function monomialLabel(vec) {
  const parts = vec.map((e, i) => {
    if (!e) return "";
    return e === 1 ? VARS[i] : `${VARS[i]}^${e}`;
  }).filter(Boolean);
  return parts.join("") || "1";
}

function dividesVec(a, b) {
  return a.every((v, i) => v <= b[i]);
}

function minimizeGens(gens) {
  const clean = gens.filter((g) => g.some((x) => x > 0));
  return clean.filter((g, i) => !clean.some((h, j) => i !== j && dividesVec(h, g)));
}

function monomialCells(gens, vars, bound) {
  const cells = [];
  const current = Array(vars).fill(0);
  function walk(i) {
    if (i === vars) {
      if (gens.some((g) => dividesVec(g, current))) cells.push([...current]);
      return;
    }
    for (let e = 0; e <= bound; e++) {
      current[i] = e;
      walk(i + 1);
    }
  }
  walk(0);
  return cells;
}

function uniqueIdeals(ideals) {
  return [...new Map(ideals.map((i) => [i.id, i])).values()];
}

function markPrimes() {
  if (state.ring.type === "zmod") {
    const primes = new Set(primeFactors(state.ring.params.n).map((p) => `zn:${p}`));
    state.ideals.forEach((i) => { i.isPrime = primes.has(i.id); });
  } else if (state.ring.type === "z") {
    state.ideals.forEach((i) => { i.isPrime = i.data.d > 1 && primeFactors(i.data.d).length === 1 && i.data.d === primeFactors(i.data.d)[0]; });
  } else if (state.ring.type === "truncated") {
    state.ideals.forEach((i) => { i.isPrime = i.data.i === 1; });
  } else if (state.ring.type === "quadratic") {
    state.ideals.forEach((i) => { i.isPrime = i.data.index > 1 && primeFactors(i.data.index).length === 1; });
  } else if (state.ring.type === "monomial") {
    state.ideals.forEach((i) => { i.isPrime = isVariablePrime(i.data.gens); });
  }
}

function isVariablePrime(gens) {
  if (!gens.length) return false;
  return gens.every((g) => g.reduce((a, b) => a + b, 0) === 1);
}

function includesIdeal(a, b) {
  const type = state.ring.type;
  if (type === "zmod") return b.data.d % a.data.d === 0;
  if (type === "z") {
    if (a.data.d === 0) return b.data.d === 0;
    if (b.data.d === 0) return true;
    return b.data.d % a.data.d === 0;
  }
  if (type === "truncated") return a.data.i <= b.data.i;
  if (type === "quadratic") return b.data.basis.every((v) => quadraticContainsVector(a.data.basis, v, 18));
  return b.data.gens.every((g) => a.data.gens.some((h) => dividesVec(h, g))) || !b.data.gens.length;
}

function covers(a, b, ideals) {
  if (!includesIdeal(a, b) || a.id === b.id) return false;
  return !ideals.some((c) => c.id !== a.id && c.id !== b.id && includesIdeal(a, c) && includesIdeal(c, b));
}

function idealOperation(op, a, b = a) {
  const type = state.ring.type;
  if (type === "zmod") {
    const n = state.ring.params.n;
    if (op === "sum") return makeZnIdeal(gcd(a.data.d, b.data.d), n);
    if (op === "intersection") return makeZnIdeal(lcm(a.data.d, b.data.d), n);
    if (op === "product") return makeZnIdeal(gcd(n, a.data.d * b.data.d), n);
    if (op === "radical") return makeZnIdeal(radicalDivisor(a.data.d), n);
  }
  if (type === "z") {
    if (op === "sum") return makeZIdeal(gcd(a.data.d, b.data.d));
    if (op === "intersection") return makeZIdeal(a.data.d === 0 || b.data.d === 0 ? 0 : lcm(a.data.d, b.data.d));
    if (op === "product") return makeZIdeal(a.data.d * b.data.d);
    if (op === "radical") return makeZIdeal(radicalDivisor(a.data.d));
  }
  if (type === "truncated") {
    const m = state.ring.params.m;
    if (op === "sum") return makeTruncIdeal(Math.min(a.data.i, b.data.i), m);
    if (op === "intersection") return makeTruncIdeal(Math.max(a.data.i, b.data.i), m);
    if (op === "product") return makeTruncIdeal(Math.min(m, a.data.i + b.data.i), m);
    if (op === "radical") return makeTruncIdeal(a.data.i === 0 ? 0 : 1, m);
  }
  if (type === "quadratic") {
    const d = state.ring.params.d;
    if (op === "sum") return makeQuadraticIdeal([...a.data.gens, ...b.data.gens], d);
    if (op === "product") {
      const gens = [];
      a.data.gens.forEach((g) => b.data.gens.forEach((h) => gens.push(mulQuadratic(g, h, d))));
      return makeQuadraticIdeal(gens, d);
    }
    if (op === "intersection") return makeQuadraticIdeal(quadraticIntersectionGenerators(a, b, d), d);
    if (op === "radical") return quadraticRadicalApprox(a, d);
  }
  const { vars, bound } = state.ring.params;
  if (op === "sum") return makeMonomialIdeal([...a.data.gens, ...b.data.gens], vars, bound);
  if (op === "intersection") {
    const gens = [];
    a.data.gens.forEach((g) => b.data.gens.forEach((h) => gens.push(g.map((e, i) => Math.max(e, h[i])))));
    return makeMonomialIdeal(gens, vars, bound);
  }
  if (op === "product") {
    const gens = [];
    a.data.gens.forEach((g) => b.data.gens.forEach((h) => gens.push(g.map((e, i) => e + h[i]))));
    return makeMonomialIdeal(gens, vars, bound);
  }
  if (op === "radical") return makeMonomialIdeal(a.data.gens.map((g) => g.map((e) => e > 0 ? 1 : 0)), vars, bound);
  return a;
}

function radicalDivisor(d) {
  if (d === 0) return 0;
  return primeFactors(d).reduce((a, p) => a * p, 1);
}

function enumerateQuadraticElements(basis, coeffBound) {
  const points = new Map();
  if (!basis.length) return [];
  const usable = basis.slice(0, 4);
  const coeffs = Array(usable.length).fill(0);
  function walk(i) {
    if (i === usable.length) {
      const v = usable.reduce((acc, vec, idx) => [acc[0] + vec[0] * coeffs[idx], acc[1] + vec[1] * coeffs[idx]], [0, 0]);
      points.set(v.join(","), v);
      return;
    }
    for (let c = -coeffBound; c <= coeffBound; c++) {
      coeffs[i] = c;
      walk(i + 1);
    }
  }
  walk(0);
  return [...points.values()];
}

function quadraticContainsVector(basis, vector) {
  if (vector[0] === 0 && vector[1] === 0) return true;
  const index = quadraticLatticeIndex(basis);
  if (!index) return false;
  return quadraticLatticeIndex([...basis, vector]) === index;
}

function quadraticIntersectionGenerators(a, b, d) {
  const aPoints = enumerateQuadraticElements(a.data.basis, 8);
  const shared = aPoints.filter((v) => quadraticContainsVector(b.data.basis, v) && (v[0] !== 0 || v[1] !== 0));
  const small = shared.sort((u, v) => Math.abs(u[0]) + Math.abs(u[1]) - Math.abs(v[0]) - Math.abs(v[1])).slice(0, 3);
  return small.length ? small : [[0, 0]];
}

function quadraticRadicalApprox(ideal, d) {
  if (ideal.data.index <= 1) return makeQuadraticIdeal([[1, 0]], d);
  const p = primeFactors(ideal.data.index)[0] || ideal.data.index;
  return makeQuadraticIdeal([[p, 0], [0, 1]], d);
}

function ensureIdeal(ideal) {
  const found = state.ideals.find((i) => i.id === ideal.id);
  if (found) return found;
  state.ideals.push(ideal);
  markPrimes();
  return ideal;
}

function render() {
  $("ring-kind").textContent = state.ring.type;
  $("ideal-count").textContent = state.ideals.length;
  $("ring-summary").innerHTML = `<strong>${escapeHtml(state.ring.name)}</strong><br>${escapeHtml(state.ring.description)}`;
  renderIdealList();
  renderOperationSelects();
  renderSelected();
  renderPrimePanel();
  renderOperationAnalysisPanel();
  renderCanvas();
}

function renderIdealList() {
  $("ideal-list").innerHTML = state.ideals.map((ideal) => `
    <div class="ideal-item ${ideal.id === state.selectedId ? "selected" : ""} ${ideal.isPrime ? "prime" : ""}" data-id="${escapeHtml(ideal.id)}">
      <span class="ideal-name">${escapeHtml(ideal.label)}</span>
      <span class="ideal-meta">${ideal.rank}</span>
    </div>
  `).join("");
  document.querySelectorAll(".ideal-item").forEach((el) => {
    el.addEventListener("click", () => { state.selectedId = el.dataset.id; state.resultId = null; render(); });
  });
}

function renderOperationSelects() {
  const options = state.ideals.map((i) => `<option value="${escapeHtml(i.id)}">${escapeHtml(i.label)}</option>`).join("");
  ["op-a", "op-b"].forEach((id) => {
    const el = $(id);
    const old = el.value;
    el.innerHTML = options;
    if (state.ideals.some((i) => i.id === old)) el.value = old;
  });
}

function renderSelected() {
  const ideal = state.ideals.find((i) => i.id === state.selectedId);
  $("selected-badge").textContent = ideal ? ideal.label : "none";
  if (!ideal) {
    $("selected-panel").innerHTML = "<p class='hint'>格子上の点を選択してください。</p>";
    return;
  }
  const containing = state.ideals.filter((j) => j.id !== ideal.id && includesIdeal(j, ideal)).map((j) => j.label);
  const contained = state.ideals.filter((j) => j.id !== ideal.id && includesIdeal(ideal, j)).map((j) => j.label);
  $("selected-panel").innerHTML = `
    <div class="selected-card">
      <div class="mono">${escapeHtml(ideal.label)}</div>
      <div>素イデアル: <strong>${ideal.isPrime ? "yes" : "no"}</strong></div>
      <div>上にある候補: ${escapeHtml(containing.slice(0, 5).join(", ") || "なし")}</div>
      <div>下にある候補: ${escapeHtml(contained.slice(0, 5).join(", ") || "なし")}</div>
    </div>
  `;
}

function renderPrimePanel() {
  const primes = state.ideals.filter((i) => i.isPrime);
  let body = `<div class="prime-list">${primes.map((p) => `<span class="prime-chip">${escapeHtml(p.label)}</span>`).join("") || "<span class='hint'>この有限表示内にはありません。</span>"}</div>`;
  const selected = state.ideals.find((i) => i.id === state.selectedId);
  if (selected) {
    body += `<div class="prime-card">${primeDecompositionText(selected)}</div>`;
  }
  $("prime-panel").innerHTML = body;
}

function renderOperationAnalysisPanel() {
  const panel = $("operation-analysis");
  if (!panel) return;
  const analysis = state.opAnalysis;
  if (!analysis) {
    panel.innerHTML = `<p class="hint">「演算関係を分析」で、現在の ${state.ideals.length} 個のイデアルを検査します。</p>`;
    return;
  }
  const closedPct = analysis.total ? Math.round(analysis.closed / analysis.total * 100) : 0;
  const missing = analysis.missing.slice(0, 8).map((item) => `
    <div class="missing-row">
      <span class="op-chip op-${item.op}">${escapeHtml(opSymbol(item.op))}</span>
      <span>${escapeHtml(item.source)}</span>
      <span class="mono">→ ${escapeHtml(item.result.label)}</span>
    </div>
  `).join("");
  const relationList = analysis.relations.slice(0, 8).map((item) => `
    <div class="relation-row">
      <span class="op-chip op-${item.op}">${escapeHtml(opSymbol(item.op))}</span>
      <span>${escapeHtml(item.source)}</span>
      <span class="mono">→ ${escapeHtml(item.result.label)}</span>
    </div>
  `).join("");
  panel.innerHTML = `
    <div class="analysis-score">
      <strong>${closedPct}%</strong>
      <span>${analysis.closed}/${analysis.total} operations closed in current set</span>
    </div>
    <div class="analysis-mini">
      <span>relations ${analysis.relations.length}</span>
      <span>missing ${analysis.missing.length}</span>
    </div>
    <div class="analysis-block">
      <h3>戻ってくる演算</h3>
      ${relationList || "<p class='hint'>まだ見つかっていません。</p>"}
    </div>
    <div class="analysis-block">
      <h3>不足している結果</h3>
      ${missing || "<p class='hint'>この範囲では演算結果がすべて定義済みです。</p>"}
    </div>
  `;
}

function computeOperationAnalysis() {
  const byId = new Map(state.ideals.map((ideal) => [ideal.id, ideal]));
  const binaryOps = ["sum", "intersection", "product"];
  const unaryOps = ["radical"];
  const relations = [];
  const missing = [];
  const seenRelations = new Set();
  let total = 0;
  let closed = 0;

  binaryOps.forEach((op) => {
    for (let i = 0; i < state.ideals.length; i++) {
      for (let j = i; j < state.ideals.length; j++) {
        const a = state.ideals[i];
        const b = state.ideals[j];
        const result = idealOperation(op, a, b);
        const existing = byId.get(result.id);
        total++;
        if (existing) {
          closed++;
          const key = `${op}:${a.id}:${b.id}:${existing.id}`;
          if (!seenRelations.has(key)) {
            seenRelations.add(key);
            relations.push({ op, inputs: [a, b], result: existing, source: `${a.label}, ${b.label}` });
          }
        } else {
          missing.push({ op, inputs: [a, b], result, source: `${a.label}, ${b.label}` });
        }
      }
    }
  });

  unaryOps.forEach((op) => {
    state.ideals.forEach((a) => {
      const result = idealOperation(op, a, a);
      const existing = byId.get(result.id);
      total++;
      if (existing) {
        closed++;
        const key = `${op}:${a.id}:${existing.id}`;
        if (!seenRelations.has(key)) {
          seenRelations.add(key);
          relations.push({ op, inputs: [a], result: existing, source: a.label });
        }
      } else {
        missing.push({ op, inputs: [a], result, source: a.label });
      }
    });
  });

  const byResult = new Map();
  relations.forEach((rel) => {
    if (!byResult.has(rel.result.id)) byResult.set(rel.result.id, []);
    byResult.get(rel.result.id).push(rel);
  });
  return { total, closed, relations, missing, byResult };
}

function opSymbol(op) {
  return ({ sum: "+", intersection: "∩", product: "·", radical: "rad" })[op] || op;
}

function primeDecompositionText(ideal) {
  const type = state.ring.type;
  if (type === "zmod" || type === "z") {
    const d = ideal.data.d;
    if (d === 0) return "rad((0)) は零因子構造に依存します。この簡易ビューでは未展開です。";
    const ps = primeFactors(d);
    return `rad(${ideal.label}) = (${ps.join("·") || 1})。候補素因子: ${ps.map((p) => `(${p})`).join(", ") || "(1)"}`;
  }
  if (type === "truncated") {
    return ideal.data.i === 0 ? "rad(R)=R。" : `rad(${ideal.label}) = (x)。唯一の素イデアルは (x) です。`;
  }
  if (type === "quadratic") {
    const normText = ideal.data.index ? `格子指数は約 ${ideal.data.index}` : "指数未定";
    return `${normText}。指数の素因子から、素イデアル候補を黄色で示します。共通部分と根基は有限範囲の可算による近似です。`;
  }
  const supports = ideal.data.gens.map((g) => g.map((e, i) => e > 0 ? i : -1).filter((i) => i >= 0)).filter((s) => s.length);
  const hits = minimalHittingSets(supports, state.ring.params.vars);
  const pieces = hits.map((h) => `(${h.map((i) => VARS[i]).join(",")})`);
  return `rad は指数を 0/1 に潰した単項式イデアル。最小素候補: ${pieces.join(" ∩ ") || "なし"}`;
}

function minimalHittingSets(sets, vars) {
  if (!sets.length) return [];
  const out = [];
  for (let mask = 1; mask < (1 << vars); mask++) {
    const hit = sets.every((s) => s.some((i) => mask & (1 << i)));
    if (!hit) continue;
    const arr = Array.from({ length: vars }, (_, i) => i).filter((i) => mask & (1 << i));
    if (!out.some((h) => h.every((i) => arr.includes(i)))) out.push(arr);
  }
  return out;
}

function renderCanvas() {
  $("view-title").textContent = state.mode === "elements" ? "イデアルに含まれる元" : state.mode === "basis" ? "指数基底の2軸投影" : state.mode === "ops" ? "演算結果の追跡" : state.mode === "primes" ? "素イデアルを強調" : "イデアル包含格子";
  $("view-meta").textContent = state.mode === "elements" ? "Elements are enumerated in a bounded window" : state.mode === "basis" ? "Choose axes for high dimensional bases" : `${state.ring.name} · ${state.ideals.length} ideals`;
  $("basis-plane").classList.toggle("hidden", state.mode !== "basis" || state.ring.type !== "monomial");
  $("element-plane").classList.toggle("hidden", state.mode !== "elements");
  $("main-svg").style.display = (state.mode === "basis" && state.ring.type === "monomial") || state.mode === "elements" ? "none" : "block";
  if (state.mode === "basis" && state.ring.type === "monomial") renderBasisPlane();
  else if (state.mode === "elements") renderElementPlane();
  else if (state.mode === "ops" && state.opAnalysis) renderOperationGraphSvg();
  else renderLatticeSvg();
}

function renderElementPlane() {
  const plane = $("element-plane");
  if (state.ring.type === "quadratic") {
    renderQuadraticElementPlane(plane);
    return;
  }
  if (state.ring.type === "monomial") {
    renderBasisPlane();
    plane.innerHTML = "<p class='hint element-empty'>単項式環では「基底投影」モードで、含まれる単項式を指数格子として表示します。</p>";
    return;
  }
  const selected = state.ideals.find((i) => i.id === state.selectedId);
  plane.innerHTML = `<div class="element-empty">この環では元の個別表示は簡易リストです。<br><span class="mono">${escapeHtml(selected?.label || "")}</span></div>`;
}

function renderQuadraticElementPlane(plane) {
  const selected = state.ideals.find((i) => i.id === state.selectedId) || state.ideals[0];
  const d = state.ring.params.d;
  const coeffBound = Math.max(3, Math.min(7, state.ring.params.bound));
  const selectedPoints = enumerateQuadraticElements(selected.data.basis, coeffBound);
  const containingIdeals = state.ideals.filter((ideal) => ideal.id !== selected.id && includesIdeal(ideal, selected)).slice(0, 2);
  const layers = [
    ...containingIdeals.map((ideal, idx) => ({ ideal, points: enumerateQuadraticElements(ideal.data.basis, coeffBound), cls: `super-${idx}` })),
    { ideal: selected, points: selectedPoints, cls: "selected" }
  ];
  const all = layers.flatMap((layer) => layer.points);
  const sqrtAbs = Math.sqrt(Math.abs(d));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1] * sqrtAbs);
  const minX = Math.min(-8, ...xs), maxX = Math.max(8, ...xs);
  const minY = Math.min(-8, ...ys), maxY = Math.max(8, ...ys);
  const pad = 42;
  const width = 760;
  const height = 560;
  const centerX = width / 2;
  const centerY = height / 2;
  const zoom = state.elementView.zoom;
  const baseX = (x) => pad + (x - minX) * (width - pad * 2) / Math.max(1, maxX - minX);
  const baseY = (y) => height - pad - (y - minY) * (height - pad * 2) / Math.max(1, maxY - minY);
  const sx = (x) => centerX + (baseX(x) - centerX) * zoom + state.elementView.panX;
  const sy = (y) => centerY + (baseY(y) - centerY) * zoom + state.elementView.panY;
  const grid = [];
  for (let x = Math.ceil(minX); x <= Math.floor(maxX); x++) {
    grid.push(`<line x1="${sx(x)}" y1="${pad}" x2="${sx(x)}" y2="${height - pad}" class="element-grid-line" />`);
  }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    grid.push(`<line x1="${pad}" y1="${sy(y)}" x2="${width - pad}" y2="${sy(y)}" class="element-grid-line" />`);
  }
  const pointMarkup = layers.map((layer) => layer.points.slice(0, 600).map((p) => {
    const label = quadraticElementLabel(p).replaceAll('"', "");
    const radius = (layer.cls === "selected" ? 4.2 : 3) / Math.sqrt(zoom);
    return `<circle class="element-point ${layer.cls}" cx="${sx(p[0])}" cy="${sy(p[1] * sqrtAbs)}" r="${radius}"><title>${escapeHtml(layer.ideal.label)}: ${escapeHtml(label)}</title></circle>`;
  }).join("")).join("");
  const labelMarkup = zoom >= 1.65 ? makeElementLabels(selectedPoints, sqrtAbs, sx, sy, width, height) : "";
  plane.innerHTML = `
    <div class="element-board">
      <svg viewBox="0 0 ${width} ${height}" class="element-svg" aria-label="二次環の元の複素平面表示">
        <rect x="0" y="0" width="${width}" height="${height}" class="element-bg"></rect>
        ${state.showGrid ? grid.join("") : ""}
        <line x1="${pad}" y1="${sy(0)}" x2="${width - pad}" y2="${sy(0)}" class="element-axis"></line>
        <line x1="${sx(0)}" y1="${pad}" x2="${sx(0)}" y2="${height - pad}" class="element-axis"></line>
        ${pointMarkup}
        ${labelMarkup}
      </svg>
      <div class="element-legend">
        <div><span class="legend-dot selected"></span><strong>${escapeHtml(selected.label)}</strong> の元</div>
        ${containingIdeals.map((ideal, idx) => `<div><span class="legend-dot super-${idx}"></span>${escapeHtml(ideal.label)}: 選択中のイデアルを含む大きなイデアル</div>`).join("")}
        <div class="zoom-readout">zoom ${zoom.toFixed(2)}x</div>
        <div class="hint">ホイールで拡大、ドラッグで移動。拡大すると、重ならない点だけ元の名前を表示します。</div>
        <div class="hint">表示範囲は係数 ${-coeffBound}..${coeffBound} の有限可算です。点 a+b√${d} は (a, b√${Math.abs(d)}) に配置します。</div>
      </div>
    </div>
  `;
  attachElementPlaneControls(plane, width, height);
}

function makeElementLabels(points, sqrtAbs, sx, sy, width, height) {
  const boxes = [];
  const labels = [];
  const sorted = [...points].sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
  sorted.forEach((p) => {
    const label = quadraticElementLabel(p);
    const x = sx(p[0]) + 7;
    const y = sy(p[1] * sqrtAbs) - 7;
    const w = Math.max(18, label.length * 7 + 8);
    const h = 16;
    const box = { x, y: y - h + 3, w, h };
    if (box.x < 4 || box.y < 4 || box.x + box.w > width - 4 || box.y + box.h > height - 4) return;
    if (boxes.some((b) => boxesOverlap(box, b))) return;
    boxes.push(box);
    labels.push(`
      <g class="element-label">
        <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="4"></rect>
        <text x="${box.x + 4}" y="${box.y + 11}">${escapeHtml(label)}</text>
      </g>
    `);
  });
  return labels.join("");
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w + 4 && a.x + a.w + 4 > b.x && a.y < b.y + b.h + 3 && a.y + a.h + 3 > b.y;
}

function attachElementPlaneControls(plane, width, height) {
  const svg = plane.querySelector(".element-svg");
  if (!svg || svg.dataset.controlsReady) return;
  svg.dataset.controlsReady = "1";
  svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const cursorX = (event.clientX - rect.left) * width / Math.max(1, rect.width);
    const cursorY = (event.clientY - rect.top) * height / Math.max(1, rect.height);
    const oldZoom = state.elementView.zoom;
    const factor = Math.exp(-event.deltaY * 0.0012);
    const nextZoom = Math.max(0.55, Math.min(8, oldZoom * factor));
    const cx = width / 2;
    const cy = height / 2;
    state.elementView.panX = cursorX - cx - (cursorX - cx - state.elementView.panX) * (nextZoom / oldZoom);
    state.elementView.panY = cursorY - cy - (cursorY - cy - state.elementView.panY) * (nextZoom / oldZoom);
    state.elementView.zoom = nextZoom;
    renderCanvas();
  }, { passive: false });

  svg.addEventListener("pointerdown", (event) => {
    const rect = svg.getBoundingClientRect();
    elementDrag = { x: event.clientX, y: event.clientY, width, height, rectWidth: rect.width, rectHeight: rect.height };
    svg.setPointerCapture?.(event.pointerId);
    svg.classList.add("dragging");
  });
}

function renderLatticeSvg() {
  const svg = $("main-svg");
  svg.innerHTML = "";
  const rect = svg.getBoundingClientRect();
  const width = Math.max(600, rect.width || 800);
  const height = Math.max(500, rect.height || 650);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const ideals = [...state.ideals].sort((a, b) => a.rank - b.rank || String(a.sortKey).localeCompare(String(b.sortKey)));
  const ranks = [...new Set(ideals.map((i) => i.rank))].sort((a, b) => a - b);
  const pos = new Map();
  ranks.forEach((rank, ri) => {
    const layer = ideals.filter((i) => i.rank === rank);
    layer.forEach((ideal, li) => {
      const x = width * (li + 1) / (layer.length + 1);
      const y = height - 70 - ri * ((height - 140) / Math.max(1, ranks.length - 1));
      pos.set(ideal.id, { x, y });
    });
  });

  const edgeGroup = makeSvg("g");
  ideals.forEach((a) => ideals.forEach((b) => {
    const isEdge = state.showTransitive ? includesIdeal(a, b) && a.id !== b.id : covers(a, b, ideals);
    if (!isEdge) return;
    const pa = pos.get(a.id), pb = pos.get(b.id);
    edgeGroup.appendChild(line(pa.x, pa.y, pb.x, pb.y, "edge cover"));
  }));
  svg.appendChild(edgeGroup);

  ideals.forEach((ideal) => {
    const p = pos.get(ideal.id);
    const g = makeSvg("g");
    g.dataset.id = ideal.id;
    const c = makeSvg("circle", { cx: p.x, cy: p.y, r: 28, class: `node-ring ${ideal.isPrime || state.mode === "primes" && ideal.isPrime ? "prime" : ""} ${ideal.id === state.selectedId ? "selected" : ""} ${ideal.id === state.resultId ? "result" : ""}` });
    const t = makeSvg("text", { x: p.x, y: p.y - 2, class: "node-label" });
    t.textContent = shortLabel(ideal.label);
    const sub = makeSvg("text", { x: p.x, y: p.y + 20, class: "node-sub" });
    sub.textContent = ideal.isPrime ? "prime" : `r${ideal.rank}`;
    g.append(c, t, sub);
    g.addEventListener("click", () => { state.selectedId = ideal.id; state.resultId = null; render(); });
    svg.appendChild(g);
  });
}

function renderOperationGraphSvg() {
  const svg = $("main-svg");
  svg.innerHTML = "";
  const rect = svg.getBoundingClientRect();
  const width = Math.max(600, rect.width || 800);
  const height = Math.max(500, rect.height || 650);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const ideals = [...state.ideals].sort((a, b) => a.rank - b.rank || String(a.sortKey).localeCompare(String(b.sortKey)));
  const ranks = [...new Set(ideals.map((i) => i.rank))].sort((a, b) => a - b);
  const pos = new Map();
  ranks.forEach((rank, ri) => {
    const layer = ideals.filter((i) => i.rank === rank);
    layer.forEach((ideal, li) => {
      const x = width * (li + 1) / (layer.length + 1);
      const y = height - 76 - ri * ((height - 152) / Math.max(1, ranks.length - 1));
      pos.set(ideal.id, { x, y });
    });
  });

  const relationGroup = makeSvg("g");
  const selectedId = state.selectedId;
  const relations = state.opAnalysis.relations
    .filter((rel) => rel.inputs.some((i) => i.id === selectedId) || rel.result.id === selectedId)
    .concat(state.opAnalysis.relations.filter((rel) => !rel.inputs.some((i) => i.id === selectedId) && rel.result.id !== selectedId))
    .slice(0, 110);
  relations.forEach((rel, idx) => {
    const target = pos.get(rel.result.id);
    if (!target) return;
    const focused = rel.inputs.some((input) => input.id === selectedId) || rel.result.id === selectedId;
    rel.inputs.forEach((input, inputIdx) => {
      const from = pos.get(input.id);
      if (!from) return;
      const bend = 28 + (idx % 5) * 8 + inputIdx * 16;
      const mx = (from.x + target.x) / 2 + (inputIdx ? -bend : bend);
      const my = (from.y + target.y) / 2 - bend;
      const path = makeSvg("path", {
        d: `M ${from.x} ${from.y} Q ${mx} ${my} ${target.x} ${target.y}`,
        class: `operation-edge op-${rel.op} ${focused ? "focused" : ""}`
      });
      const title = makeSvg("title");
      title.textContent = `${rel.source} ${opSymbol(rel.op)} -> ${rel.result.label}`;
      path.appendChild(title);
      relationGroup.appendChild(path);
    });
    const first = pos.get(rel.inputs[0].id);
    if (first) {
      const label = makeSvg("text", {
        x: (first.x + target.x) / 2,
        y: (first.y + target.y) / 2 - 10 - (idx % 4) * 5,
        class: `operation-edge-label op-${rel.op} ${focused ? "focused" : ""}`
      });
      label.textContent = opSymbol(rel.op);
      relationGroup.appendChild(label);
    }
  });
  svg.appendChild(relationGroup);

  ideals.forEach((ideal) => {
    const p = pos.get(ideal.id);
    const rels = state.opAnalysis.byResult.get(ideal.id) || [];
    const g = makeSvg("g");
    g.dataset.id = ideal.id;
    const c = makeSvg("circle", { cx: p.x, cy: p.y, r: 29, class: `node-ring op-node ${ideal.isPrime ? "prime" : ""} ${ideal.id === state.selectedId ? "selected" : ""}` });
    const t = makeSvg("text", { x: p.x, y: p.y - 3, class: "node-label" });
    t.textContent = shortLabel(ideal.label);
    const sub = makeSvg("text", { x: p.x, y: p.y + 20, class: "node-sub" });
    sub.textContent = `${rels.length} ops`;
    g.append(c, t, sub);
    g.addEventListener("click", () => { state.selectedId = ideal.id; render(); });
    svg.appendChild(g);
  });

  const legend = makeSvg("g", { class: "operation-legend" });
  const legendItems = [["sum", "+"], ["intersection", "∩"], ["product", "·"], ["radical", "rad"]];
  legendItems.forEach(([op, label], idx) => {
    const y = 24 + idx * 22;
    legend.appendChild(line(18, y, 52, y, `operation-edge op-${op} focused`));
    const text = makeSvg("text", { x: 60, y: y + 4, class: "operation-legend-text" });
    text.textContent = label;
    legend.appendChild(text);
  });
  svg.appendChild(legend);
}

function shortLabel(label) {
  return label.length > 12 ? label.replace("=R", "").slice(0, 10) + "…" : label;
}

function makeSvg(tag, attrs = {}) {
  const el = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function line(x1, y1, x2, y2, cls) {
  return makeSvg("line", { x1, y1, x2, y2, class: cls });
}

function renderBasisPlane() {
  const plane = $("basis-plane");
  const selected = state.ideals.find((i) => i.id === state.selectedId) || state.ideals[0];
  const { vars, bound } = state.ring.params;
  const ax = Number($("axis-x").value || 0);
  const ay = Number($("axis-y").value || 1);
  const colorAxis = Number($("axis-color").value || 2);
  const cells = new Set((selected?.data.cells || []).map((v) => `${v[ax]},${v[ay]}`));
  const boundary = new Set((selected?.data.gens || []).map((v) => `${v[ax]},${v[ay]}`));
  const rows = [];
  for (let y = bound; y >= 0; y--) {
    for (let x = 0; x <= bound; x++) {
      const key = `${x},${y}`;
      const cls = boundary.has(key) ? "basis-cell boundary" : cells.has(key) ? "basis-cell hit" : "basis-cell";
      rows.push(`<div class="${cls}" title="${VARS[ax]}^${x}, ${VARS[ay]}^${y}">${x},${y}</div>`);
    }
  }
  plane.innerHTML = `
    <div>
      <div class="basis-grid" style="grid-template-columns: repeat(${bound + 1}, 28px);">
        ${rows.join("")}
      </div>
      <p class="hint" style="margin-top:10px;text-align:center;">${escapeHtml(selected?.label || "")} を ${VARS[ax]}-${VARS[ay]} 平面へ投影。色軸: ${VARS[colorAxis] || "-"}</p>
    </div>
  `;
}

function fillAxisControls() {
  const vars = state.ring.type === "monomial" ? state.ring.params.vars : 3;
  const options = Array.from({ length: vars }, (_, i) => `<option value="${i}">${VARS[i]}</option>`).join("");
  ["axis-x", "axis-y", "axis-color"].forEach((id, idx) => {
    $(id).innerHTML = options;
    $(id).value = Math.min(idx, vars - 1);
  });
}

function parseIdealInput(raw) {
  const type = state.ring.type;
  const s = raw.trim();
  if (!s) return null;
  if (type === "zmod") return makeZnIdeal(gcd(Math.abs(Number.parseInt(s, 10)), state.ring.params.n), state.ring.params.n);
  if (type === "z") return makeZIdeal(Math.abs(Number.parseInt(s, 10)) || 0);
  if (type === "truncated") {
    const match = s.match(/x\^?(\d+)?/);
    const i = match ? Number.parseInt(match[1] || "1", 10) : s === "1" ? 0 : state.ring.params.m;
    return makeTruncIdeal(Math.min(state.ring.params.m, Math.max(0, i)), state.ring.params.m);
  }
  if (type === "quadratic") return makeQuadraticIdeal(s.split(",").map(parseQuadraticElement), state.ring.params.d);
  return makeMonomialIdeal(s.split(",").map(parseMonomial), state.ring.params.vars, state.ring.params.bound);
}

function parseQuadraticElement(input) {
  let s = input.trim().toLowerCase();
  if (!s) return [0, 0];
  s = s.replace(/sqrt\(-?\d+\)|√-?\d+|√d|omega|α|β/g, SQRT_SYMBOL);
  s = s.replace(/\s+/g, "").replace(/-/g, "+-");
  const parts = s.split("+").filter(Boolean);
  let a = 0;
  let b = 0;
  parts.forEach((part) => {
    if (part.includes(SQRT_SYMBOL)) {
      const coef = part.replace(SQRT_SYMBOL, "");
      b += coef === "" ? 1 : coef === "-" ? -1 : Number.parseInt(coef, 10) || 0;
    } else {
      a += Number.parseInt(part, 10) || 0;
    }
  });
  return [a, b];
}

function parseMonomial(s) {
  const vars = state.ring.params.vars;
  const vec = Array(vars).fill(0);
  const cleaned = s.trim().replace(/\s+/g, "");
  VARS.slice(0, vars).forEach((name, i) => {
    const re = new RegExp(`${name}(?:\\^(\\d+))?`, "g");
    let match;
    while ((match = re.exec(cleaned))) vec[i] += Number.parseInt(match[1] || "1", 10);
  });
  return vec;
}

function setPreset(value) {
  const preset = {
    zn12: ["zmod", 12, 4, 3, 5],
    zn60: ["zmod", 60, 4, 3, 5],
    z: ["z", 12, 4, 3, 5],
    dual: ["truncated", 12, 4, 3, 5],
    qsqrt5: ["quadratic", 12, 4, 3, 7, -5],
    mono3: ["monomial", 12, 4, 3, 5],
    mono4: ["monomial", 12, 4, 4, 4]
  }[value];
  if (!preset) return;
  $("ring-type").value = preset[0];
  $("param-n").value = preset[1];
  $("param-m").value = preset[2];
  $("param-vars").value = preset[3];
  $("param-bound").value = preset[4];
  $("param-d").value = preset[5] ?? -5;
  buildRing();
}

function bindEvents() {
  $("preset-select").addEventListener("change", (e) => setPreset(e.target.value));
  $("btn-apply-ring").addEventListener("click", buildRing);
  $("btn-add-ideal").addEventListener("click", () => {
    const ideal = parseIdealInput($("ideal-input").value);
    if (!ideal) return;
    const added = ensureIdeal(ideal);
    state.selectedId = added.id;
    state.opAnalysis = null;
    $("ideal-input").value = "";
    render();
  });
  document.querySelectorAll(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".mode-tab").forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      state.mode = button.dataset.mode;
      if (state.mode === "ops" && !state.opAnalysis) state.opAnalysis = computeOperationAnalysis();
      renderCanvas();
      renderOperationAnalysisPanel();
      renderPrimePanel();
    });
  });
  document.querySelectorAll("[data-op]").forEach((button) => {
    button.addEventListener("click", () => {
      const a = state.ideals.find((i) => i.id === $("op-a").value);
      const b = state.ideals.find((i) => i.id === $("op-b").value);
      const op = button.dataset.op;
      const result = ensureIdeal(idealOperation(op, a, b));
      state.resultId = result.id;
      state.selectedId = result.id;
      state.opAnalysis = null;
      $("operation-result").innerHTML = `<strong>${escapeHtml(op)}</strong>: ${escapeHtml(result.label)}`;
      render();
    });
  });
  $("btn-analyze-ops").addEventListener("click", () => {
    state.opAnalysis = computeOperationAnalysis();
    state.mode = "ops";
    document.querySelectorAll(".mode-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === "ops"));
    render();
  });
  $("toggle-transitive").addEventListener("change", (e) => { state.showTransitive = e.target.checked; renderCanvas(); });
  $("toggle-grid").addEventListener("change", (e) => { state.showGrid = e.target.checked; renderCanvas(); });
  ["axis-x", "axis-y", "axis-color"].forEach((id) => $(id).addEventListener("change", renderCanvas));
  document.addEventListener("pointermove", (event) => {
    if (!elementDrag || state.mode !== "elements") return;
    state.elementView.panX += (event.clientX - elementDrag.x) * elementDrag.width / Math.max(1, elementDrag.rectWidth);
    state.elementView.panY += (event.clientY - elementDrag.y) * elementDrag.height / Math.max(1, elementDrag.rectHeight);
    elementDrag.x = event.clientX;
    elementDrag.y = event.clientY;
    renderCanvas();
  });
  document.addEventListener("pointerup", () => { elementDrag = null; });
  document.addEventListener("pointercancel", () => { elementDrag = null; });
  window.addEventListener("resize", () => renderCanvas());
}

bindEvents();
setPreset("zn12");
