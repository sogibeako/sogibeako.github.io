const $ = (id) => document.getElementById(id);

const ui = {
  formula: $("formulaInput"),
  apply: $("applyBtn"),
  preset: $("presetSelect"),
  gridStep: $("gridStepInput"),
  range: $("rangeInput"),
  density: $("densityInput"),
  reset: $("resetBtn"),
  status: $("statusText"),
  sourceCoord: $("sourceCoord"),
  targetCoord: $("targetCoord"),
  sourceCanvas: $("sourceCanvas"),
  targetCanvas: $("targetCanvas"),
};

const state = {
  fnText: "z^2",
  fn: null,
  zRange: 4,
  wRange: 4,
  gridStep: 0.5,
  density: 46,
  pointer: { re: 0.75, im: 0.5 },
  dragging: false,
};

function complex(re = 0, im = 0) {
  return { re, im };
}

const C = {
  add: (a, b) => complex(a.re + b.re, a.im + b.im),
  sub: (a, b) => complex(a.re - b.re, a.im - b.im),
  mul: (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re),
  div: (a, b) => {
    const d = b.re * b.re + b.im * b.im;
    if (d < 1e-14) return complex(Number.NaN, Number.NaN);
    return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  },
  neg: (a) => complex(-a.re, -a.im),
  abs: (a) => Math.hypot(a.re, a.im),
  exp: (a) => {
    const e = Math.exp(a.re);
    return complex(e * Math.cos(a.im), e * Math.sin(a.im));
  },
  log: (a) => complex(Math.log(C.abs(a)), Math.atan2(a.im, a.re)),
  pow: (a, b) => {
    if (Math.abs(b.im) < 1e-12 && Number.isInteger(b.re) && Math.abs(b.re) <= 12) {
      let n = Math.abs(b.re);
      let out = complex(1, 0);
      for (let i = 0; i < n; i += 1) out = C.mul(out, a);
      return b.re < 0 ? C.div(complex(1, 0), out) : out;
    }
    return C.exp(C.mul(b, C.log(a)));
  },
  sin: (a) => complex(Math.sin(a.re) * Math.cosh(a.im), Math.cos(a.re) * Math.sinh(a.im)),
  cos: (a) => complex(Math.cos(a.re) * Math.cosh(a.im), -Math.sin(a.re) * Math.sinh(a.im)),
  tan: (a) => C.div(C.sin(a), C.cos(a)),
  sqrt: (a) => C.pow(a, complex(0.5, 0)),
  sinh: (a) => C.div(C.sub(C.exp(a), C.exp(C.neg(a))), complex(2, 0)),
  cosh: (a) => C.div(C.add(C.exp(a), C.exp(C.neg(a))), complex(2, 0)),
  conj: (a) => complex(a.re, -a.im),
};

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if ("+-*/^(),".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let raw = "";
      while (i < input.length && /[0-9.eE]/.test(input[i])) {
        raw += input[i];
        i += 1;
        if ((input[i - 1] === "e" || input[i - 1] === "E") && /[+-]/.test(input[i])) {
          raw += input[i];
          i += 1;
        }
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`bad number: ${raw}`);
      tokens.push({ type: "number", value });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let name = "";
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
        name += input[i];
        i += 1;
      }
      tokens.push({ type: "name", value: name.toLowerCase() });
      continue;
    }
    throw new Error(`unexpected token: ${ch}`);
  }
  return tokens;
}

function parseExpression(input) {
  const tokens = tokenize(input);
  let pos = 0;

  function peek(type) {
    return tokens[pos]?.type === type;
  }

  function take(type) {
    if (!peek(type)) throw new Error(`expected ${type}`);
    return tokens[pos++];
  }

  function parsePrimary() {
    if (peek("number")) return { type: "num", value: take("number").value };
    if (peek("name")) {
      const name = take("name").value;
      if (peek("(")) {
        take("(");
        const arg = parseAdd();
        take(")");
        return { type: "call", name, arg };
      }
      return { type: "name", name };
    }
    if (peek("(")) {
      take("(");
      const expr = parseAdd();
      take(")");
      return expr;
    }
    throw new Error("expected expression");
  }

  function parseUnary() {
    if (peek("+")) {
      take("+");
      return parseUnary();
    }
    if (peek("-")) {
      take("-");
      return { type: "neg", expr: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePow() {
    let left = parseUnary();
    if (peek("^")) {
      take("^");
      left = { type: "pow", left, right: parsePow() };
    }
    return left;
  }

  function parseMul() {
    let left = parsePow();
    while (peek("*") || peek("/")) {
      const op = tokens[pos++].type;
      left = { type: op, left, right: parsePow() };
    }
    return left;
  }

  function parseAdd() {
    let left = parseMul();
    while (peek("+") || peek("-")) {
      const op = tokens[pos++].type;
      left = { type: op, left, right: parseMul() };
    }
    return left;
  }

  const ast = parseAdd();
  if (pos < tokens.length) throw new Error(`unexpected ${tokens[pos].value}`);
  return ast;
}

function evaluate(ast, z) {
  switch (ast.type) {
    case "num": return complex(ast.value, 0);
    case "name":
      if (ast.name === "z") return z;
      if (ast.name === "i") return complex(0, 1);
      if (ast.name === "pi") return complex(Math.PI, 0);
      if (ast.name === "e") return complex(Math.E, 0);
      throw new Error(`unknown name: ${ast.name}`);
    case "neg": return C.neg(evaluate(ast.expr, z));
    case "+": return C.add(evaluate(ast.left, z), evaluate(ast.right, z));
    case "-": return C.sub(evaluate(ast.left, z), evaluate(ast.right, z));
    case "*": return C.mul(evaluate(ast.left, z), evaluate(ast.right, z));
    case "/": return C.div(evaluate(ast.left, z), evaluate(ast.right, z));
    case "pow": return C.pow(evaluate(ast.left, z), evaluate(ast.right, z));
    case "call": {
      const fn = C[ast.name];
      if (!fn) throw new Error(`unknown function: ${ast.name}`);
      return fn(evaluate(ast.arg, z));
    }
    default:
      throw new Error("bad expression");
  }
}

function compile(input) {
  const ast = parseExpression(input);
  evaluate(ast, complex(0.31, -0.17));
  return (z) => evaluate(ast, z);
}

function formatComplex(v) {
  if (!Number.isFinite(v.re) || !Number.isFinite(v.im)) return "undefined";
  const re = Math.abs(v.re) < 1e-9 ? 0 : v.re;
  const im = Math.abs(v.im) < 1e-9 ? 0 : v.im;
  const sign = im < 0 ? "-" : "+";
  return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`;
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(320, Math.floor(rect.width * dpr));
  const h = Math.max(260, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

function toScreen(z, canvas, range) {
  const s = Math.min(canvas.width, canvas.height) / (2 * range);
  return {
    x: canvas.width / 2 + z.re * s,
    y: canvas.height / 2 - z.im * s,
  };
}

function fromScreen(point, canvas, range) {
  const s = Math.min(canvas.width, canvas.height) / (2 * range);
  return complex((point.x - canvas.width / 2) / s, -(point.y - canvas.height / 2) / s);
}

function line(ctx, a, b, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function valid(z) {
  return Number.isFinite(z.re) && Number.isFinite(z.im) && Math.abs(z.re) < 1e6 && Math.abs(z.im) < 1e6;
}

function drawAxes(ctx, canvas, range) {
  ctx.fillStyle = "#10110f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const origin = toScreen(complex(0, 0), canvas, range);
  line(ctx, { x: 0, y: origin.y }, { x: canvas.width, y: origin.y }, "rgba(242,241,232,.38)", 1.5);
  line(ctx, { x: origin.x, y: 0 }, { x: origin.x, y: canvas.height }, "rgba(242,241,232,.38)", 1.5);
}

function drawSource() {
  const canvas = ui.sourceCanvas;
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  drawAxes(ctx, canvas, state.zRange);
  drawSourceGrid(ctx, canvas);
  drawPoint(ctx, canvas, state.pointer, state.zRange, getComputedStyle(document.documentElement).getPropertyValue("--amber"));
}

function drawSourceGrid(ctx, canvas) {
  const range = state.zRange;
  const step = state.gridStep;
  for (let x = -range; x <= range + 1e-9; x += step) {
    const color = Math.abs(x) < 1e-9 ? "rgba(242,241,232,.45)" : "rgba(119,183,223,.36)";
    line(ctx, toScreen(complex(x, -range), canvas, range), toScreen(complex(x, range), canvas, range), color, 1);
  }
  for (let y = -range; y <= range + 1e-9; y += step) {
    const color = Math.abs(y) < 1e-9 ? "rgba(242,241,232,.45)" : "rgba(143,214,148,.36)";
    line(ctx, toScreen(complex(-range, y), canvas, range), toScreen(complex(range, y), canvas, range), color, 1);
  }
}

function transform(z) {
  try {
    return state.fn(z);
  } catch {
    return complex(Number.NaN, Number.NaN);
  }
}

function drawTarget() {
  const canvas = ui.targetCanvas;
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  drawAxes(ctx, canvas, state.wRange);
  drawImageGrid(ctx, canvas);
  drawMappedPoint(ctx, canvas);
}

function drawImageGrid(ctx, canvas) {
  const range = state.zRange;
  const step = state.gridStep;
  const samples = state.density;
  for (let x = -range; x <= range + 1e-9; x += step) {
    drawMappedCurve(ctx, canvas, (t) => complex(x, -range + 2 * range * t), samples, "rgba(119,183,223,.72)");
  }
  for (let y = -range; y <= range + 1e-9; y += step) {
    drawMappedCurve(ctx, canvas, (t) => complex(-range + 2 * range * t, y), samples, "rgba(143,214,148,.72)");
  }
}

function drawMappedCurve(ctx, canvas, sourceAt, samples, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  let drawing = false;
  let last = null;
  for (let i = 0; i <= samples; i += 1) {
    const z = sourceAt(i / samples);
    const w = transform(z);
    if (!valid(w) || C.abs(w) > state.wRange * 8) {
      drawing = false;
      last = null;
      continue;
    }
    const p = toScreen(w, canvas, state.wRange);
    if (last && Math.hypot(p.x - last.x, p.y - last.y) > Math.min(canvas.width, canvas.height) * 0.42) {
      drawing = false;
    }
    if (!drawing) {
      ctx.moveTo(p.x, p.y);
      drawing = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
    last = p;
  }
  ctx.stroke();
}

function drawPoint(ctx, canvas, z, range, color) {
  const p = toScreen(z, canvas, range);
  ctx.fillStyle = color;
  ctx.strokeStyle = "#10110f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawMappedPoint(ctx, canvas) {
  const w = transform(state.pointer);
  if (valid(w)) drawPoint(ctx, canvas, w, state.wRange, getComputedStyle(document.documentElement).getPropertyValue("--amber"));
}

function render() {
  state.zRange = Number(ui.range.value);
  state.gridStep = Number(ui.gridStep.value);
  state.density = Number(ui.density.value);
  drawSource();
  drawTarget();
  const w = transform(state.pointer);
  ui.sourceCoord.textContent = `z = ${formatComplex(state.pointer)}`;
  ui.targetCoord.textContent = `w = ${formatComplex(w)}`;
}

function applyFormula() {
  try {
    state.fn = compile(ui.formula.value);
    state.fnText = ui.formula.value;
    ui.status.textContent = "ready";
    ui.status.style.color = "";
    render();
  } catch (error) {
    ui.status.textContent = error.message;
    ui.status.style.color = "var(--red)";
  }
}

function pointerPosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return {
    x: (event.clientX - rect.left) * dpr,
    y: (event.clientY - rect.top) * dpr,
  };
}

function updatePointer(event) {
  const p = pointerPosition(event, ui.sourceCanvas);
  state.pointer = fromScreen(p, ui.sourceCanvas, state.zRange);
  render();
}

ui.apply.addEventListener("click", applyFormula);
ui.formula.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyFormula();
});
ui.preset.addEventListener("change", () => {
  ui.formula.value = ui.preset.value;
  applyFormula();
});
ui.reset.addEventListener("click", () => {
  ui.range.value = 4;
  ui.gridStep.value = 0.5;
  ui.density.value = 46;
  state.pointer = complex(0.75, 0.5);
  state.wRange = 4;
  render();
});

[ui.gridStep, ui.range, ui.density].forEach((input) => input.addEventListener("input", render));

document.querySelectorAll("[data-formula]").forEach((button) => {
  button.addEventListener("click", () => {
    ui.formula.value = button.dataset.formula;
    applyFormula();
  });
});

ui.sourceCanvas.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  ui.sourceCanvas.setPointerCapture(event.pointerId);
  updatePointer(event);
});
ui.sourceCanvas.addEventListener("pointermove", (event) => {
  if (state.dragging) updatePointer(event);
});
ui.sourceCanvas.addEventListener("pointerup", () => {
  state.dragging = false;
});
ui.sourceCanvas.addEventListener("pointerleave", () => {
  state.dragging = false;
});

ui.targetCanvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  const factor = event.deltaY > 0 ? 1.15 : 0.87;
  state.wRange = Math.min(40, Math.max(0.5, state.wRange * factor));
  render();
}, { passive: false });

window.addEventListener("resize", render);

state.fn = compile(state.fnText);
render();
