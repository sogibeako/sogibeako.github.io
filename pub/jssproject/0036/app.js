"use strict";

const MAX_CODE_POINTS = 16;
const SAMPLE = "猫𠮷é♥️が";
const CATEGORY_NAMES = {
  Lu: "Letter, Uppercase", Ll: "Letter, Lowercase", Lt: "Letter, Titlecase",
  Lm: "Letter, Modifier", Lo: "Letter, Other", Mn: "Mark, Nonspacing",
  Mc: "Mark, Spacing Combining", Me: "Mark, Enclosing", Nd: "Number, Decimal Digit",
  Nl: "Number, Letter", No: "Number, Other", Pc: "Punctuation, Connector",
  Pd: "Punctuation, Dash", Ps: "Punctuation, Open", Pe: "Punctuation, Close",
  Pi: "Punctuation, Initial Quote", Pf: "Punctuation, Final Quote", Po: "Punctuation, Other",
  Sm: "Symbol, Math", Sc: "Symbol, Currency", Sk: "Symbol, Modifier", So: "Symbol, Other",
  Zs: "Separator, Space", Zl: "Separator, Line", Zp: "Separator, Paragraph",
  Cc: "Other, Control", Cf: "Other, Format", Cs: "Other, Surrogate",
  Co: "Other, Private Use", Cn: "Unassigned"
};

const ui = {
  source: document.querySelector("#source"), count: document.querySelector("#count"),
  counter: document.querySelector(".counter"), inspect: document.querySelector("#inspect"),
  sample: document.querySelector("#sample"), message: document.querySelector("#message"),
  summary: document.querySelector("#summary"), empty: document.querySelector("#empty"),
  wrap: document.querySelector("#table-wrap"), rows: document.querySelector("#rows")
};

let database = null;
let inputTimer = 0;
let wikiTimer = 0;
let wikiRequest = 0;
const WIKTIONARIES = {
  ja: { host: "ja.wiktionary.org", label: "日本語版" },
  en: { host: "en.wiktionary.org", label: "英語版" }
};
const wikiCache = {
  ja: new Map(),
  en: new Map()
};

fetch("unicode-data.json")
  .then(response => {
    if (!response.ok) throw new Error("Unicode database unavailable");
    return response.json();
  })
  .then(data => Promise.all([data.nameFile, ...data.characterFiles].map(file =>
    fetch(file).then(response => {
      if (!response.ok) throw new Error("Unicode database unavailable");
      return response.json();
    })
  )).then(parts => [data, parts]))
  .then(([data, parts]) => {
    data.nameTokens = parts[0];
    data.characters = parts.slice(1).flat();
    let codePoint = 0;
    data.nameTokens = data.nameTokens.split("|");
    data.characters.forEach(row => {
      codePoint += row[0];
      row[0] = codePoint;
      row[1] = data.categories[row[1]];
      if (row.length > 3) row[3] += codePoint;
    });
    database = data;
    inspect();
  })
  .catch(() => {
    ui.message.textContent = "Unicodeデータを読み込めませんでした。ローカルサーバーから開いてください。";
  });

ui.source.addEventListener("input", () => {
  updateCount();
  clearTimeout(inputTimer);
  inputTimer = setTimeout(inspect, 120);
});
ui.inspect.addEventListener("click", inspect);
ui.sample.addEventListener("click", () => {
  ui.source.value = SAMPLE;
  updateCount();
  inspect();
  ui.source.focus();
});

function updateCount() {
  const count = Array.from(ui.source.value).length;
  ui.count.textContent = count;
  ui.counter.classList.toggle("over", count > MAX_CODE_POINTS);
}

function inspect() {
  updateCount();
  if (!database) return;
  const all = Array.from(ui.source.value);
  const chars = all.slice(0, MAX_CODE_POINTS);
  ui.message.textContent = all.length > MAX_CODE_POINTS
    ? `⚠ 16コードポイントを超えています。先頭16文字のみ解析します（入力は保持されています）。`
    : "";
  if (!chars.length) {
    ui.rows.replaceChildren();
    ui.empty.hidden = false;
    ui.wrap.hidden = true;
    ui.summary.textContent = "文字列を入力してください";
    clearTimeout(wikiTimer);
    return;
  }

  const fragment = document.createDocumentFragment();
  chars.forEach((char, index) => fragment.append(makeRow(char, index)));
  ui.rows.replaceChildren(fragment);
  ui.empty.hidden = true;
  ui.wrap.hidden = false;
  ui.summary.textContent = `${chars.length} コードポイントを表示`;
  queueWiktionary(chars);
}

function makeRow(char, index) {
  const cp = char.codePointAt(0);
  const hex = cp.toString(16).toUpperCase().padStart(4, "0");
  const record = lookupRecord(cp);
  const category = record?.[1] || "Cn";
  const script = lookupRange(database.scripts, cp) || "Unknown";
  const block = lookupRange(database.blocks, cp) || "No Block";
  const tr = document.createElement("tr");
  tr.dataset.index = index;
  tr.innerHTML = `
    <td data-label="文字"><span class="glyph">${escapeHtml(visibleChar(char, category))}</span></td>
    <td data-label="コードポイント"><span class="mono code">U+${hex}</span><span class="sub">10進 ${cp}</span></td>
    <td data-label="Unicode名"><span class="name">${escapeHtml(unicodeName(cp, record))}</span></td>
    <td data-label="General Category"><span class="label">${category}</span><span class="sub">${CATEGORY_NAMES[category] || "Unknown"}</span></td>
    <td data-label="Script / Block"><span class="label">${escapeHtml(script)}</span><span class="sub">${escapeHtml(block)}</span></td>
    <td data-label="UTF表現"><span class="mono">UTF-8&nbsp; ${utf8(char)}</span><span class="sub mono">UTF-16 ${utf16(char)}</span></td>
    <td data-label="正規化">${normalization(char)}</td>
    <td data-label="Wiktionary">
      <div class="wiki-stack">
        <div class="wiki-line"><b>JA</b><span class="wiki loading" data-wiki-ja="${index}">確認中…</span></div>
        <div class="wiki-line"><b>EN</b><span class="wiki loading" data-wiki-en="${index}">確認中…</span></div>
      </div>
    </td>`;
  return tr;
}

function lookupRecord(cp) {
  const rows = database.characters;
  let lo = 0, hi = rows.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const row = rows[mid];
    const end = row[3] ?? row[0];
    if (cp < row[0]) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return row;
  }
  return null;
}

function lookupRange(ranges, cp) {
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end, value] = ranges[mid];
    if (cp < start) hi = mid - 1;
    else if (cp > end) lo = mid + 1;
    else return value;
  }
  return null;
}

function unicodeName(cp, record) {
  if (!record) return "UNASSIGNED";
  const raw = record[2].split(".").map(id => database.nameTokens[parseInt(id, 36)]).join(" ");
  if (raw === "CJK Ideograph") return `CJK UNIFIED IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
  if (raw === "CJK Compatibility Ideograph") return `CJK COMPATIBILITY IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
  if (raw === "Tangut Ideograph") return `TANGUT IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
  if (raw === "Khitan Small Script Character") return `KHITAN SMALL SCRIPT CHARACTER-${cp.toString(16).toUpperCase()}`;
  if (raw === "Nushu Character") return `NUSHU CHARACTER-${cp.toString(16).toUpperCase()}`;
  if (raw === "Hangul Syllable") return hangulName(cp);
  return raw.replace(/^<|>$/g, "").toUpperCase();
}

function hangulName(cp) {
  const L = ["G","GG","N","D","DD","R","M","B","BB","S","SS","","J","JJ","C","K","T","P","H"];
  const V = ["A","AE","YA","YAE","EO","E","YEO","YE","O","WA","WAE","OE","YO","U","WEO","WE","WI","YU","EU","YI","I"];
  const T = ["","G","GG","GS","N","NJ","NH","D","L","LG","LM","LB","LS","LT","LP","LH","M","B","BS","S","SS","NG","J","C","K","T","P","H"];
  const s = cp - 0xAC00;
  if (s < 0 || s >= 11172) return "HANGUL SYLLABLE";
  return `HANGUL SYLLABLE ${L[Math.floor(s / 588)]}${V[Math.floor((s % 588) / 28)]}${T[s % 28]}`;
}

function visibleChar(char, category) {
  if (char === " ") return "␠";
  if (char === "\n") return "↵";
  if (char === "\t") return "⇥";
  if (category === "Mn" || category === "Mc" || category === "Me") return `◌${char}`;
  if (category === "Cf" || category === "Cc") return "□";
  return char;
}

function utf8(char) {
  return Array.from(new TextEncoder().encode(char), byte => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

function utf16(char) {
  const units = [];
  for (let i = 0; i < char.length; i++) units.push(char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0"));
  return units.join(" ");
}

function normalization(char) {
  return `<div class="normalization">${["NFC", "NFD", "NFKC", "NFKD"].map(form =>
    `<div><b>${form}</b><span class="mono">${codeSequence(char.normalize(form))}</span></div>`).join("")}</div>`;
}

function codeSequence(text) {
  return Array.from(text, c => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`).join(" + ");
}

function queueWiktionary(chars) {
  clearTimeout(wikiTimer);
  const requestId = ++wikiRequest;
  Object.keys(WIKTIONARIES).forEach(language => {
    chars.forEach((char, index) => {
      const cached = wikiCache[language].get(char);
      if (cached) setWiki(language, index, char, cached);
    });
  });
  wikiTimer = setTimeout(() => {
    Object.keys(WIKTIONARIES).forEach(language => {
      const pending = [...new Set(chars.filter(char => !wikiCache[language].has(char)))];
      if (pending.length) checkWiktionary(language, pending, chars, requestId);
    });
  }, 400);
}

async function checkWiktionary(language, pending, currentChars, requestId) {
  const params = new URLSearchParams({ action: "query", titles: pending.join("|"), format: "json", formatversion: "2", origin: "*" });
  try {
    const response = await fetch(`https://${WIKTIONARIES[language].host}/w/api.php?${params}`);
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const found = new Set((data.query?.pages || []).filter(page => !page.missing).map(page => page.title));
    const normalized = new Map((data.query?.normalized || []).map(item => [item.from, item.to]));
    pending.forEach(char => wikiCache[language].set(char, found.has(normalized.get(char) || char) ? "found" : "missing"));
  } catch (_) {
    pending.forEach(char => wikiCache[language].set(char, "error"));
  }
  if (requestId !== wikiRequest) return;
  currentChars.forEach((char, index) => setWiki(language, index, char, wikiCache[language].get(char)));
}

function setWiki(language, index, char, state) {
  const target = document.querySelector(`[data-wiki-${language}="${index}"]`);
  if (!target) return;
  target.className = `wiki ${state}`;
  if (state === "found") {
    const link = document.createElement("a");
    link.className = "wiki found";
    link.href = `https://${WIKTIONARIES[language].host}/wiki/${encodeURIComponent(char)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hreflang = language;
    link.textContent = WIKTIONARIES[language].label;
    target.replaceWith(link);
  } else {
    target.textContent = state === "error" ? "確認できませんでした" : "項目なし";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

updateCount();
