/* ============================================================
   OpenSet Lab — app.js
   位相空間の視覚的学習ツール
   ============================================================ */

// ============================================================
// 1. Set Utilities
// ============================================================
function normalizeSet(s) {
  return [...new Set(s)].sort();
}
function sameSet(a, b) {
  const A = normalizeSet(a), B = normalizeSet(b);
  return A.length === B.length && A.every((x, i) => x === B[i]);
}
function containsSet(sets, target) {
  return sets.some(s => sameSet(s, target));
}
function unionSet(a, b) {
  return normalizeSet([...a, ...b]);
}
function intersectionSet(a, b) {
  return normalizeSet(a.filter(x => b.includes(x)));
}
function formatSet(s) {
  if (s.length === 0) return '∅';
  return '{' + s.join(', ') + '}';
}
function parseOpenSetInput(text) {
  let raw = text.trim();
  if (!raw || raw === '∅' || raw === '{}' || raw === '｛｝') return [];
  raw = raw
    .replace(/[｛]/g, '{')
    .replace(/[｝]/g, '}')
    .replace(/[，、]/g, ',');
  if (raw.startsWith('{') && raw.endsWith('}')) raw = raw.slice(1, -1).trim();
  if (!raw || raw === '∅') return [];
  return normalizeSet(raw.split(',').map(s => s.trim()).filter(Boolean));
}
function getCurrentPreset() {
  return PRESETS[state.currentPreset] || null;
}
function isRuleBasedPreset(preset = getCurrentPreset()) {
  return preset && preset.kind === 'real-line';
}
function summaryHolds(lines, key) {
  return lines.some(s => s.includes(key) && s.includes('成立') && !s.includes('不成立'));
}

// ============================================================
// 2. Topology Verification
// ============================================================
function checkTopology(points, opens) {
  const results = { empty: false, whole: false, union: true, inter: true, unionError: null, interError: null };
  results.empty = containsSet(opens, []);
  results.whole = containsSet(opens, points);
  for (let i = 0; i < opens.length; i++) {
    for (let j = i; j < opens.length; j++) {
      const u = unionSet(opens[i], opens[j]);
      if (!containsSet(opens, u)) {
        results.union = false;
        results.unionError = { a: opens[i], b: opens[j], result: u };
        break;
      }
      const it = intersectionSet(opens[i], opens[j]);
      if (!containsSet(opens, it)) {
        results.inter = false;
        results.interError = { a: opens[i], b: opens[j], result: it };
        break;
      }
    }
    if (!results.union || !results.inter) break;
  }
  results.valid = results.empty && results.whole && results.union && results.inter;
  return results;
}

// ============================================================
// 3. Separation Axioms
// ============================================================
function checkT0(points, opens) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const x = points[i], y = points[j];
      const sep = opens.some(U => (U.includes(x) && !U.includes(y)) || (U.includes(y) && !U.includes(x)));
      if (!sep) return { holds: false, counter: [x, y], reason: `${x} と ${y} を区別する開集合がありません。` };
    }
  }
  return { holds: true };
}

function checkT1(points, opens) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const x = points[i], y = points[j];
      const xNotY = opens.some(U => U.includes(x) && !U.includes(y));
      const yNotX = opens.some(U => U.includes(y) && !U.includes(x));
      if (!xNotY) return { holds: false, counter: [x, y], reason: `${x} を含み ${y} を含まない開集合がありません。` };
      if (!yNotX) return { holds: false, counter: [x, y], reason: `${y} を含み ${x} を含まない開集合がありません。` };
    }
  }
  return { holds: true };
}

function checkHausdorff(points, opens) {
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const x = points[i], y = points[j];
      let separated = false;
      for (const U of opens) {
        if (!U.includes(x)) continue;
        for (const V of opens) {
          if (!V.includes(y)) continue;
          if (intersectionSet(U, V).length === 0) { separated = true; break; }
        }
        if (separated) break;
      }
      if (!separated) return { holds: false, counter: [x, y], reason: `${x} と ${y} を互いに交わらない開集合で分離できません。` };
    }
  }
  return { holds: true };
}

// ============================================================
// 4. Neighborhoods
// ============================================================
function neighborhoodsOf(point, opens) {
  return opens.filter(U => U.includes(point));
}
function minimalNeighborhood(point, opens) {
  const nhs = neighborhoodsOf(point, opens);
  if (nhs.length === 0) return [];
  let result = [...nhs[0]];
  for (let i = 1; i < nhs.length; i++) {
    result = intersectionSet(result, nhs[i]);
  }
  return result;
}

// ============================================================
// 5. Continuity
// ============================================================
function preimage(values, openSetInCodomain) {
  return normalizeSet(
    Object.entries(values)
      .filter(([_, y]) => openSetInCodomain.includes(y))
      .map(([x]) => x)
  );
}

function checkContinuity(domainOpens, codomainOpens, values) {
  const failures = [];
  for (const V of codomainOpens) {
    const inv = preimage(values, V);
    if (!containsSet(domainOpens, inv)) {
      failures.push({ V, inv });
    }
  }
  return { continuous: failures.length === 0, failures };
}

// ============================================================
// 6. Presets
// ============================================================
const PRESETS = {
  'discrete-2': {
    name: '離散2点空間',
    points: ['a', 'b'],
    opens: [[], ['a'], ['b'], ['a', 'b']],
    description: 'すべての部分集合が開集合です。\nどの2点も完全に分離でき、T0・T1・T2 すべてが成立します。\n最も「細かい」位相です。'
  },
  'indiscrete-2': {
    name: '密着2点空間',
    points: ['a', 'b'],
    opens: [[], ['a', 'b']],
    description: '開集合は空集合と全体集合だけです。\n2点を区別する開集合がないため、T0 すら成立しません。\nどんな点列もすべての点に収束します。'
  },
  'sierpinski': {
    name: 'Sierpiński空間',
    points: ['0', '1'],
    opens: [[], ['1'], ['0', '1']],
    description: '1 は単独で観測できます。\n0 は単独では観測できません。\nT0 ですが T1 ではありません。\n計算機科学での重要な基本空間です。'
  },
  'chain-3': {
    name: '3点鎖空間',
    points: ['a', 'b', 'c'],
    opens: [[], ['a'], ['a', 'b'], ['a', 'b', 'c']],
    description: '開集合が鎖状に包含関係を持つ空間です。\na は最も「開いた」点で、c は最も「閉じた」点です。\nT0 ですが T1 ではありません。'
  },
  'particular-3': {
    name: '特殊点位相(3点)',
    points: ['p', 'a', 'b'],
    opens: [[], ['p'], ['p', 'a'], ['p', 'b'], ['p', 'a', 'b']],
    description: '特殊点 p がすべての空でない開集合に現れます。\np を含まない空でない開集合は存在しません。\nT0 ですが T1 ではありません。'
  },
  'excluded-3': {
    name: '排除点位相(3点)',
    points: ['p', 'a', 'b'],
    opens: [[], ['a'], ['b'], ['a', 'b'], ['p', 'a', 'b']],
    description: '排除点 p は、全体集合以外の開集合から排除されます。\na, b は自由に観測できますが、p は単独では観測できません。\nT0 ですが T1 ではありません。'
  },
  'real-standard': {
    kind: 'real-line',
    visual: 'standard',
    name: '通常の実数直線',
    points: ['-2', '-1', '0', '1', '2'],
    opens: [[], ['-2', '-1', '0', '1', '2']],
    description: '基底は開区間 (a,b) です。\n任意の2点は交わらない小さな開区間で分離できるので Hausdorff です。\nこのプリセットでは、全開集合を列挙せず、数直線の規則として観察します。',
    topologySummary: ['開集合: 開区間の任意和', '基底: (a,b)', '有限リストではなく規則で定義'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 成立'],
    sequences: [
      { label: 'a_n = 1/n', text: '1/n は 0 に収束します。0 のどんな小さな開区間にも、十分大きい n では 1/n が入ります。' },
      { label: 'a_n = (-1)^n', text: '(-1)^n は通常の実数直線では収束しません。-1 と 1 の間を行き来し、どの一点の近傍にも最終的に留まりません。' }
    ]
  },
  'complex-plane': {
    kind: 'real-line',
    visual: 'complex-plane',
    name: '複素平面 C',
    points: ['-1', '0', '1', 'i', '-i'],
    opens: [[], ['-1', '0', '1', 'i', '-i']],
    description: '複素数全体 C を平面として見た空間です。\n通常の距離から来る開円板を基本開集合として扱います。\n正則関数の層 O や、局所的な解析データを見るのに自然な舞台です。',
    topologySummary: ['開集合: 開円板の任意和', '基底: B(z,r)', '通常の複素位相'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 成立'],
    sequences: [
      { label: 'z_n = 1/n', text: '複素平面でも 1/n は 0 に収束します。任意の小さな開円板に十分大きい n で入ります。' },
      { label: 'z_n = exp(in)', text: '単位円上を回る列は一般には収束しません。点列が一点の任意の近傍に最終的に留まらないためです。' }
    ]
  },
  'sorgenfrey-line': {
    kind: 'real-line',
    visual: 'sorgenfrey',
    name: 'Sorgenfrey直線',
    points: ['-2', '-1', '0', '1', '2'],
    opens: [[], ['-2', '-1', '0', '1', '2']],
    description: '基底は半開区間 [a,b) です。\n左端を含むため、通常の実数直線より細かい位相になります。\n見た目は直線ですが、連続性や積空間で普通の直線と違う挙動をします。',
    topologySummary: ['開集合: [a,b) の任意和', '左端を含み、右端を含まない', '通常位相より細かい'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 成立'],
    sequences: [
      { label: 'a_n = 1/n', text: '1/n は 0 に収束します。0 の基本近傍 [0,ε) に、十分大きい n で入ります。' },
      { label: 'a_n = -1/n', text: '-1/n は 0 に収束しません。[0,ε) は 0 の近傍ですが、負の項は一度も入りません。通常の直線との違いがここに出ます。' }
    ]
  },
  'cofinite-real': {
    kind: 'real-line',
    visual: 'cofinite',
    name: '余有限位相 on R',
    points: ['-2', '-1', '0', '1', '2'],
    opens: [[], ['-2', '-1', '0', '1', '2']],
    description: '空でない開集合は「有限個の点を除いたほとんど全部」です。\n任意の2つの空でない開集合が必ず交わるため、Hausdorff ではありません。\n点列の極限が一意でないことを観察しやすい空間です。',
    topologySummary: ['開集合: ∅ または R \\ F', 'F は有限集合', '空でない開集合どうしは必ず交わる'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 不成立'],
    sequences: [
      { label: 'a_n = n', text: 'n は余有限位相ではすべての実数点に収束します。どの有限集合 F を除いても、十分大きい n は F の外に出るからです。' },
      { label: 'a_n = 0,1,0,2,...', text: '0 が何度も戻る列は、0 以外の点への収束で失敗する近傍を作れます。余有限でも「各値を有限回しか踏まない」ことが効きます。' }
    ]
  },
  'real-plus-isolated': {
    kind: 'real-line',
    visual: 'isolated-point',
    name: '実数直線 + 孤立点',
    points: ['-2', '-1', '0', '1', '2', 'p'],
    opens: [[], ['-2', '-1', '0', '1', '2', 'p']],
    description: '通常の実数直線に、直線から離れた孤立点 p を1つ足した空間です。\n{p} 自体が開集合なので、p は実数直線のどの点からも簡単に分離できます。\n一点を足しても、足し方が離散的なら Hausdorff 性は保たれます。',
    topologySummary: ['R 側: 通常の開区間', '追加点: {p} が開集合', '直和 R ⊔ {p} として見る'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 成立'],
    sequences: [
      { label: 'a_n = 1/n', text: '1/n は 0 に収束しますが、孤立点 p には収束しません。p の近傍 {p} に一度も入らないからです。' },
      { label: 'a_n = p,p,p,...', text: '定数列 p は p にだけ収束します。{p} が開いているため、p は完全に観測できます。' }
    ]
  },
  'real-particular-point': {
    kind: 'real-line',
    visual: 'particular-point',
    name: '実数直線 + 特殊点',
    points: ['-2', '-1', '0', '1', '2', 'p'],
    opens: [[], ['-2', '-1', '0', '1', '2', 'p']],
    description: '追加点 p を、すべての空でない開集合に必ず含まれる特殊点として足した空間です。\np を含まない空でない開集合がないので、p と実数点の分離が非対称になります。\nT0 は成立しますが、T1 や Hausdorff は成立しません。',
    topologySummary: ['開集合: ∅ または p を含む集合', 'R 側を観測するときも p が一緒に現れる', '特殊点位相の実数直線版'],
    separationSummary: ['T0 成立', 'T1 不成立: 実数点を p から切り離せない', 'T2 / Hausdorff 不成立'],
    sequences: [
      { label: 'a_n = 1/n', text: 'p の近傍はすべて p を含みますが、1/n は p に入らないため p には収束しません。一方、通常の近傍を持つ 0 への収束は直感どおりです。' },
      { label: 'a_n = p,p,p,...', text: '定数列 p は、多くの実数点にも収束してしまいます。実数点のどの近傍も p を含むためです。' }
    ]
  },
  'real-excluded-point': {
    kind: 'real-line',
    visual: 'excluded-point',
    name: '実数直線 + 排除点',
    points: ['-2', '-1', '0', '1', '2', 'p'],
    opens: [[], ['-2', '-1', '0', '1', '2', 'p']],
    description: '追加点 p を、全体集合以外の開集合から排除される点として足した空間です。\n実数点の周りには p を含まない開集合がありますが、p 自身の開近傍は全体集合しかありません。\nこちらも T0 ですが T1 ではなく、特殊点位相と対になる例です。',
    topologySummary: ['開集合: X または p を含まない通常の開集合', 'p の近傍は全体集合だけ', '排除点位相の実数直線版'],
    separationSummary: ['T0 成立', 'T1 不成立: p を実数点から切り離せない', 'T2 / Hausdorff 不成立'],
    sequences: [
      { label: '任意の点列', text: 'p の唯一の近傍が全体集合なので、どんな点列も p に収束します。開集合が p を細かく観測できないためです。' },
      { label: 'a_n = 1/n', text: '1/n は 0 にも p にも収束します。非Hausdorff空間では極限が一意とは限りません。' }
    ]
  },
  'one-point-compactification': {
    kind: 'real-line',
    visual: 'one-point-compact',
    name: '一点コンパクト化 R∪{∞}',
    points: ['-2', '-1', '0', '1', '2', '∞'],
    opens: [[], ['-2', '-1', '0', '1', '2', '∞']],
    description: '実数直線の両端を同じ無限遠点 ∞ に向かわせる空間です。\n∞ の近傍は、大きなコンパクト集合の外側と ∞ を含む形になります。\n通常の一点コンパクト化は Hausdorff で、直線を円のように閉じる直感を与えます。',
    topologySummary: ['点集合: R ∪ {∞}', '∞ の近傍: {∞} と十分遠方の両端', 'R を円の一点を除いたものとして見る'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 成立'],
    sequences: [
      { label: 'a_n = n', text: 'n は ∞ に収束します。∞ の近傍は十分遠方の両端を含むので、n は最終的にそこへ入ります。' },
      { label: 'a_n = (-1)^n n', text: '正負に振れながら絶対値が大きくなる列も ∞ に収束します。両端が同じ一点 ∞ にまとめられているからです。' }
    ]
  },
  'double-origin-line': {
    kind: 'real-line',
    visual: 'double-origin',
    name: '二重原点つき直線',
    points: ['-2', '-1', '0a', '0b', '1', '2'],
    opens: [[], ['-2', '-1', '0a', '0b', '1', '2']],
    description: '0 を 0a と 0b の2点に分裂させた直線です。\nどちらの原点も局所的には普通の原点のように見えます。\nしかし 0a と 0b は交わらない近傍で分離できないため、Hausdorff ではありません。',
    topologySummary: ['0 だけを 0a と 0b に分裂', '0 以外の近くの点を共有する近傍を持つ', '局所的には直線風'],
    separationSummary: ['T0 成立', 'T1 成立', 'T2 / Hausdorff 不成立: 0a と 0b'],
    sequences: [
      { label: 'a_n = 1/n', text: '1/n は 0a にも 0b にも収束します。2つの原点の近傍は、原点以外の十分近い正の点を共有するためです。' },
      { label: 'a_n = -1/n', text: '-1/n も 0a と 0b の両方に収束します。極限が一意でない、非Hausdorffらしい例です。' }
    ]
  }
};

// ============================================================
// 7. Application State
// ============================================================
const state = {
  mode: 'editor',       // 'editor' | 'map'
  points: [],
  opens: [],
  selectedPoint: null,
  currentPreset: 'sierpinski',

  // Map mode
  savedSpaces: {},       // key -> {name, points, opens}
  mapDomainKey: null,
  mapCodomainKey: null,
  mapValues: {},         // point -> point
  mapFormula: 'identity',

  // Sheaf mode
  sheafType: 'continuous',
  sheafOpenIndex: 0,
  sheafCandidate: 'selected',
};

// ============================================================
// 8. DOM References
// ============================================================
const $ = (id) => document.getElementById(id);

const dom = {
  tabEditor: $('tab-editor'),
  tabMap: $('tab-map'),
  tabSheaf: $('tab-sheaf'),
  presetSelect: $('preset-select'),
  btnHelp: $('btn-help'),
  helpModal: $('help-modal'),
  btnCloseHelp: $('btn-close-help'),

  // Space panel
  badgePoints: $('badge-points'),
  pointChips: $('point-chips'),
  inputAddPoint: $('input-add-point'),
  btnAddPoint: $('btn-add-point'),
  badgeOpens: $('badge-opens'),
  openSetList: $('open-set-list'),
  inputAddOpen: $('input-add-open'),
  btnAddOpen: $('btn-add-open'),
  badgeTopology: $('badge-topology'),
  checkEmpty: $('check-empty'),
  checkWhole: $('check-whole'),
  checkUnion: $('check-union'),
  checkInter: $('check-inter'),
  topologyError: $('topology-error'),
  mapSettingsPanel: $('map-settings-panel'),
  sheafSettingsPanel: $('sheaf-settings-panel'),
  sheafTypeSelect: $('sheaf-type-select'),
  sheafOpenSelect: $('sheaf-open-select'),
  sheafCandidateSelect: $('sheaf-candidate-select'),
  mapDomainSelect: $('map-domain-select'),
  mapCodomainSelect: $('map-codomain-select'),
  btnSwapMapSpaces: $('btn-swap-map-spaces'),
  btnUseAsDomain: $('btn-use-as-domain'),
  btnUseAsCodomain: $('btn-use-as-codomain'),

  // Canvas
  editorView: $('editor-view'),
  mapView: $('map-view'),
  sheafView: $('sheaf-view'),
  spaceNameDisplay: $('space-name-display'),
  spaceMeta: $('space-meta'),
  mainSvg: $('main-svg'),
  canvasWrap: $('canvas-wrap'),
  mapSvgDomain: $('map-svg-domain'),
  mapSvgCodomain: $('map-svg-codomain'),
  mapDomainName: $('map-domain-name'),
  mapCodomainName: $('map-codomain-name'),
  mapFormulaPanel: $('map-formula-panel'),
  mapFunctionSelect: $('map-function-select'),
  mapDefRows: $('map-def-rows'),
  btnCheckContinuity: $('btn-check-continuity'),
  sheafTitle: $('sheaf-title'),
  sheafMeta: $('sheaf-meta'),
  sheafBoard: $('sheaf-board'),

  // Property inspector
  checkT0: $('check-t0'),
  checkT1: $('check-t1'),
  checkT2: $('check-t2'),
  separationDetail: $('separation-detail'),
  neighborhoodPanel: $('neighborhood-panel'),
  badgeNhPoint: $('badge-nh-point'),
  neighborhoodContent: $('neighborhood-content'),
  spaceDescription: $('space-description'),
  sequenceSelect: $('sequence-select'),
  sequenceContent: $('sequence-content'),
  continuityPanel: $('continuity-panel'),
  continuityResult: $('continuity-result'),
  sheafPanel: $('sheaf-panel'),
  sheafResult: $('sheaf-result'),

  // Log
  logBody: $('log-body'),
  btnClearLog: $('btn-clear-log'),
};

// ============================================================
// 9. Logging
// ============================================================
function addLog(text, cls = 'log-info') {
  const line = document.createElement('div');
  line.className = 'log-line ' + cls;
  line.textContent = text;
  dom.logBody.appendChild(line);
  dom.logBody.scrollTop = dom.logBody.scrollHeight;
}

// ============================================================
// 10. Load Preset
// ============================================================
function loadPreset(key) {
  const p = PRESETS[key];
  if (!p) return;
  state.currentPreset = key;
  state.points = [...p.points];
  state.opens = p.opens.map(s => [...s]);
  state.selectedPoint = null;
  dom.presetSelect.value = key;
  dom.spaceDescription.textContent = p.description;
  addLog(`プリセット「${p.name}」を読み込みました。`, 'log-accent');
  if (state.mode === 'sheaf') refreshSheafMode();
  else refreshAll();
}

// ============================================================
// 11. Save current space to savedSpaces
// ============================================================
function saveCurrentSpace(keyOverride) {
  const key = keyOverride || state.currentPreset || 'custom-' + Date.now();
  const name = PRESETS[state.currentPreset]?.name || 'カスタム空間';
  state.savedSpaces[key] = {
    name,
    points: [...state.points],
    opens: state.opens.map(s => [...s]),
  };
  return key;
}

// ============================================================
// 12. Render All
// ============================================================
function refreshAll() {
  renderPointChips();
  renderOpenSetList();
  runTopologyCheck();
  runSeparationCheck();
  renderSvg();
  renderSequencePanel();
  updateMeta();
  if (state.selectedPoint) showNeighborhood(state.selectedPoint);
  else hideNeighborhood();
}

function updateMeta() {
  const p = PRESETS[state.currentPreset];
  dom.spaceNameDisplay.textContent = p ? p.name : 'カスタム空間';
  dom.spaceMeta.textContent = isRuleBasedPreset(p)
    ? `${state.points.length} sample points · rule-based topology`
    : `${state.points.length} points · ${state.opens.length} open sets`;
  dom.badgePoints.textContent = state.points.length;
  dom.badgeOpens.textContent = isRuleBasedPreset(p) ? '規則' : state.opens.length;
}

// ============================================================
// 13. Point Chips
// ============================================================
function renderPointChips() {
  dom.pointChips.innerHTML = '';
  for (const pt of state.points) {
    const chip = document.createElement('span');
    chip.className = 'chip' + (state.selectedPoint === pt ? ' selected' : '');
    chip.innerHTML = `<span>${pt}</span><span class="remove-chip" data-point="${pt}">&times;</span>`;
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-chip')) {
        removePoint(e.target.dataset.point);
      } else {
        selectPoint(pt);
      }
    });
    dom.pointChips.appendChild(chip);
  }
}

function addPoint(name) {
  name = name.trim();
  if (!name || state.points.includes(name)) return;
  state.points.push(name);
  state.points = normalizeSet(state.points);
  state.currentPreset = '';
  dom.presetSelect.value = '';
  addLog(`点 ${name} を追加しました。`);
  refreshAll();
}

function removePoint(name) {
  state.points = state.points.filter(p => p !== name);
  state.opens = state.opens
    .map(s => s.filter(p => p !== name))
    .filter((s, i, arr) => {
      // Remove duplicates after filtering
      for (let j = 0; j < i; j++) { if (sameSet(arr[j], s)) return false; }
      return true;
    });
  if (state.selectedPoint === name) state.selectedPoint = null;
  state.currentPreset = '';
  dom.presetSelect.value = '';
  addLog(`点 ${name} を削除しました。`);
  refreshAll();
}

// ============================================================
// 14. Open Set List
// ============================================================
function renderOpenSetList() {
  dom.openSetList.innerHTML = '';
  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    const lines = preset.topologySummary || [];
    for (const line of lines) {
      const item = document.createElement('div');
      item.className = 'open-set-item rule-open-item';
      item.innerHTML = `<span class="set-label">${line}</span>`;
      dom.openSetList.appendChild(item);
    }
    return;
  }
  for (let i = 0; i < state.opens.length; i++) {
    const s = state.opens[i];
    const item = document.createElement('div');
    item.className = 'open-set-item';
    item.dataset.index = i;
    item.innerHTML = `<span class="set-label">${formatSet(s)}</span><span class="remove-set" data-index="${i}">&times;</span>`;
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-set')) {
        removeOpenSet(parseInt(e.target.dataset.index));
      } else {
        highlightOpenSet(i);
      }
    });
    dom.openSetList.appendChild(item);
  }
}

function addOpenSet(text) {
  if (isRuleBasedPreset()) {
    addLog('このプリセットは基底・規則で定義された空間なので、開集合リストは直接編集しません。', 'log-warn');
    return;
  }
  const pts = parseOpenSetInput(text);
  // validate that all points exist
  for (const p of pts) {
    if (!state.points.includes(p)) {
      addLog(`エラー: 点 ${p} は点集合に存在しません。`, 'log-error');
      return;
    }
  }
  if (containsSet(state.opens, pts)) {
    addLog(`${formatSet(pts)} は既に開集合リストに含まれています。`, 'log-warn');
    return;
  }
  state.opens.push(pts);
  state.currentPreset = '';
  dom.presetSelect.value = '';
  addLog(`開集合 ${formatSet(pts)} を追加しました。`);
  refreshAll();
}

function removeOpenSet(idx) {
  if (isRuleBasedPreset()) {
    addLog('基底・規則で定義された空間の開集合は、ここでは削除できません。', 'log-warn');
    return;
  }
  const removed = state.opens[idx];
  state.opens.splice(idx, 1);
  state.currentPreset = '';
  dom.presetSelect.value = '';
  addLog(`開集合 ${formatSet(removed)} を削除しました。`);
  refreshAll();
}

let highlightedOpenIdx = -1;
function highlightOpenSet(idx) {
  highlightedOpenIdx = highlightedOpenIdx === idx ? -1 : idx;
  // Update list UI
  const items = dom.openSetList.querySelectorAll('.open-set-item');
  items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedOpenIdx));
  renderSvg();
}

// ============================================================
// 15. Topology Check
// ============================================================
function runTopologyCheck() {
  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    dom.badgeTopology.className = 'badge badge-info';
    dom.badgeTopology.textContent = '基底';
    const lines = preset.topologySummary || [];
    dom.checkEmpty.textContent = '✓';
    dom.checkEmpty.className = 'prop-value pass';
    dom.checkWhole.textContent = '✓';
    dom.checkWhole.className = 'prop-value pass';
    dom.checkUnion.textContent = '規則';
    dom.checkUnion.className = 'prop-value warn';
    dom.checkInter.textContent = '規則';
    dom.checkInter.className = 'prop-value warn';
    dom.topologyError.textContent = lines.join('\n');
    dom.topologyError.className = 'neighborhood-card';
    dom.topologyError.style.display = 'block';
    return;
  }
  const r = checkTopology(state.points, state.opens);
  setCheckMark(dom.checkEmpty, r.empty);
  setCheckMark(dom.checkWhole, r.whole);
  setCheckMark(dom.checkUnion, r.union);
  setCheckMark(dom.checkInter, r.inter);

  if (r.valid) {
    dom.badgeTopology.className = 'badge badge-ok';
    dom.badgeTopology.textContent = '位相';
    dom.topologyError.style.display = 'none';
  } else {
    dom.badgeTopology.className = 'badge badge-fail';
    dom.badgeTopology.textContent = '非位相';
    let errText = 'これは位相ではありません。\n';
    if (!r.empty) errText += '∅ が開集合リストに含まれていません。\n';
    if (!r.whole) errText += formatSet(state.points) + ' が開集合リストに含まれていません。\n';
    if (r.unionError) errText += `${formatSet(r.unionError.a)} ∪ ${formatSet(r.unionError.b)} = ${formatSet(r.unionError.result)} が開集合リストに含まれていません。\n`;
    if (r.interError) errText += `${formatSet(r.interError.a)} ∩ ${formatSet(r.interError.b)} = ${formatSet(r.interError.result)} が開集合リストに含まれていません。\n`;
    dom.topologyError.textContent = errText.trim();
    dom.topologyError.style.display = 'block';
  }
}

function setCheckMark(el, ok) {
  el.textContent = ok ? '✓' : '✗';
  el.className = 'prop-value ' + (ok ? 'pass' : 'fail');
}

// ============================================================
// 16. Separation Axioms Check
// ============================================================
function runSeparationCheck() {
  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    const lines = preset.separationSummary || [];
    dom.checkT0.textContent = summaryHolds(lines, 'T0') ? '✓' : '✗';
    dom.checkT1.textContent = summaryHolds(lines, 'T1') ? '✓' : '✗';
    dom.checkT2.textContent = summaryHolds(lines, 'T2') ? '✓' : '✗';
    dom.checkT0.className = dom.checkT0.textContent === '✓' ? 'prop-value pass' : 'prop-value fail';
    dom.checkT1.className = dom.checkT1.textContent === '✓' ? 'prop-value pass' : 'prop-value fail';
    dom.checkT2.className = dom.checkT2.textContent === '✓' ? 'prop-value pass' : 'prop-value fail';
    dom.separationDetail.textContent = lines.join('\n');
    dom.separationDetail.style.display = 'block';
    dom.separationDetail.className = dom.checkT2.textContent === '✓' ? 'neighborhood-card' : 'counterexample';
    return;
  }
  if (state.points.length < 2) {
    dom.checkT0.textContent = '—'; dom.checkT0.className = 'prop-value';
    dom.checkT1.textContent = '—'; dom.checkT1.className = 'prop-value';
    dom.checkT2.textContent = '—'; dom.checkT2.className = 'prop-value';
    dom.separationDetail.style.display = 'none';
    return;
  }
  const t0 = checkT0(state.points, state.opens);
  const t1 = checkT1(state.points, state.opens);
  const t2 = checkHausdorff(state.points, state.opens);

  setCheckMark(dom.checkT0, t0.holds);
  setCheckMark(dom.checkT1, t1.holds);
  setCheckMark(dom.checkT2, t2.holds);

  // Show first failure detail
  const details = [];
  if (t0.holds) details.push('T₀ 成立: 任意の2点は少なくとも片方向から開集合で区別できます。');
  else details.push(`T₀ 不成立: ${t0.reason}`);
  if (t1.holds) details.push('T₁ 成立: 任意の2点は双方向から開集合で区別できます。');
  else if (t0.holds) details.push(`T₁ 不成立: ${t1.reason}`);
  if (t2.holds) details.push('T₂ (Hausdorff) 成立: 任意の2点は互いに交わらない開集合で分離できます。');
  else if (t1.holds) details.push(`T₂ 不成立: ${t2.reason}`);

  dom.separationDetail.textContent = details.join('\n');
  dom.separationDetail.style.display = 'block';
  dom.separationDetail.className = (t0.holds && t1.holds && t2.holds)
    ? 'neighborhood-card' : 'counterexample';
}

// ============================================================
// 17. Neighborhood
// ============================================================
function selectPoint(pt) {
  if (state.selectedPoint === pt) {
    state.selectedPoint = null;
    hideNeighborhood();
  } else {
    state.selectedPoint = pt;
    showNeighborhood(pt);
    addLog(`点 ${pt} を選択しました。近傍を表示します。`, 'log-info');
  }
  renderPointChips();
  renderSvg();
}

function showNeighborhood(pt) {
  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    showRuleBasedNeighborhood(pt, preset);
    return;
  }
  dom.neighborhoodPanel.style.display = 'block';
  dom.badgeNhPoint.textContent = pt;
  const nhs = neighborhoodsOf(pt, state.opens);
  const minNh = minimalNeighborhood(pt, state.opens);

  let html = '<div class="neighborhood-card">';
  html += `<div class="nh-title">点 ${pt} の近傍</div>`;
  if (nhs.length === 0) {
    html += '<div class="nh-item" style="color:var(--color-danger);">この点を含む開集合がありません。</div>';
  } else {
    for (const U of nhs) {
      const isMin = sameSet(U, minNh);
      html += `<div class="nh-item${isMin ? ' nh-minimal' : ''}">${isMin ? '★ ' : ''}${formatSet(U)}</div>`;
    }
    html += `<div class="nh-minimal" style="margin-top:6px;">最小開近傍: ${formatSet(minNh)}</div>`;
  }

  // Show which points can be separated from this point
  const separable = [], inseparable = [];
  for (const q of state.points) {
    if (q === pt) continue;
    const canSep = state.opens.some(U => U.includes(pt) && !U.includes(q));
    if (canSep) separable.push(q); else inseparable.push(q);
  }
  if (separable.length > 0)
    html += `<div style="margin-top:8px;color:var(--color-success);">分離可能: ${separable.join(', ')}</div>`;
  if (inseparable.length > 0)
    html += `<div style="color:var(--color-danger);">分離不可能: ${inseparable.join(', ')}</div>`;

  html += '</div>';
  dom.neighborhoodContent.innerHTML = html;
}

function hideNeighborhood() {
  dom.neighborhoodPanel.style.display = 'none';
}

function showRuleBasedNeighborhood(pt, preset) {
  dom.neighborhoodPanel.style.display = 'block';
  dom.badgeNhPoint.textContent = pt;
  const notes = {
    standard: `${pt} の近傍は、この点を含む開区間の集まりです。十分小さい (a,b) を取るほど、観測は細かくなります。`,
    sorgenfrey: `${pt} の基本近傍は [${pt}, b) の形です。左端を含むので、右側から近づく列と左側から近づく列で挙動が変わります。`,
    cofinite: `${pt} の近傍は R から有限個の点を除いた大きな集合です。どの近傍も「ほとんど全部」を含みます。`,
    'isolated-point': pt === 'p' ? 'p の近傍には {p} そのものがあります。直線から独立した孤立点なので、Hausdorff 分離できます。' : `${pt} は通常の実数直線と同じ開区間近傍を持ち、孤立点 p とも分離できます。`,
    'particular-point': pt === 'p' ? 'p はすべての空でない開集合に入ります。p から他点を切り離す開近傍はありますが、他点側から p を避けることができません。' : `${pt} の近傍も必ず p を含みます。そのため p と ${pt} は T1 的には分離できません。`,
    'excluded-point': pt === 'p' ? 'p の開近傍は全体集合だけです。p を細かく観測できないため、多くの点列が p に収束します。' : `${pt} の通常の開区間近傍は p を含まずに取れます。ただし p 側の近傍が粗いため Hausdorff にはなりません。`,
    'one-point-compact': pt === '∞' ? '∞ の近傍は、十分大きい区間 [-R,R] の外側と ∞ を含みます。遠方へ逃げる列は ∞ に収束します。' : `${pt} は通常の実数直線と同じ局所近傍を持ちます。∞ とは十分大きなコンパクト区間を使って分離できます。`,
    'double-origin': `${pt} の近傍は普通の直線の近傍に似ています。ただし 0a と 0b は、0 以外の近い点を共有するため分離できません。`
  };
  dom.neighborhoodContent.innerHTML = `
    <div class="neighborhood-card">
      <div class="nh-title">点 ${pt} の近傍</div>
      <div class="nh-item">${notes[preset.visual] || preset.description}</div>
    </div>`;
}

// ============================================================
// 18. SVG Visualization
// ============================================================
function renderSvg() {
  const svg = dom.mainSvg;
  const wrap = dom.canvasWrap;
  const w = wrap.clientWidth || 600;
  const h = wrap.clientHeight || 400;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Clear SVG (keep <defs>)
  while (svg.children.length > 1) svg.removeChild(svg.lastChild);

  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    renderRuleBasedSpace(svg, preset, w, h);
    return;
  }

  if (state.points.length === 0) return;

  // Calculate point positions
  const positions = computeLayout(state.points, w, h);

  // Collect which open-set regions to draw
  const regionsToShow = [];
  if (highlightedOpenIdx >= 0 && highlightedOpenIdx < state.opens.length) {
    regionsToShow.push({ set: state.opens[highlightedOpenIdx], active: true });
  } else if (state.selectedPoint !== null) {
    const nhs = neighborhoodsOf(state.selectedPoint, state.opens);
    const minNh = minimalNeighborhood(state.selectedPoint, state.opens);
    for (const U of nhs) {
      regionsToShow.push({ set: U, active: sameSet(U, minNh) });
    }
  }

  // Draw regions (behind points)
  for (const reg of regionsToShow) {
    drawOpenRegion(svg, reg.set, positions, reg.active, state.points);
  }

  // Draw points
  for (const pt of state.points) {
    const pos = positions[pt];
    if (!pos) continue;
    const isSelected = pt === state.selectedPoint;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';

    // Outer glow for selected
    if (isSelected) {
      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', pos.x);
      glow.setAttribute('cy', pos.y);
      glow.setAttribute('r', 28);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', 'rgba(6,182,212,0.35)');
      glow.setAttribute('stroke-width', '3');
      glow.setAttribute('filter', 'url(#glow)');
      g.appendChild(glow);
    }

    // Main circle
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', isSelected ? 20 : 17);
    circle.setAttribute('fill', isSelected ? '#06b6d4' : '#e2e8f0');
    circle.setAttribute('stroke', isSelected ? 'rgba(6,182,212,0.7)' : 'rgba(148,163,184,0.5)');
    circle.setAttribute('stroke-width', isSelected ? '3' : '2');
    circle.classList.add('svg-point');
    g.appendChild(circle);

    // Label inside circle
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pos.x);
    label.setAttribute('y', pos.y);
    label.setAttribute('dy', '0.38em');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', isSelected ? '#fff' : '#0f172a');
    label.setAttribute('font-family', "'JetBrains Mono', 'Consolas', monospace");
    label.setAttribute('font-size', '15');
    label.setAttribute('font-weight', '700');
    label.setAttribute('pointer-events', 'none');
    label.textContent = pt;
    g.appendChild(label);

    g.addEventListener('click', () => selectPoint(pt));
    svg.appendChild(g);
  }
}

function computeLayout(points, w, h) {
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(Math.min(w, h) * 0.3, 180);
  const positions = {};

  if (points.length === 1) {
    positions[points[0]] = { x: cx, y: cy };
  } else if (points.length === 2) {
    // Horizontal layout
    const spread = Math.min(w * 0.2, 160);
    positions[points[0]] = { x: cx - spread, y: cy };
    positions[points[1]] = { x: cx + spread, y: cy };
  } else {
    const r = Math.min(maxR, 55 * points.length / Math.PI);
    points.forEach((pt, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / points.length;
      positions[pt] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
  }
  return positions;
}

function drawOpenRegion(svg, openSet, positions, active, allPoints) {
  if (openSet.length === 0) return;
  const pts = openSet.map(p => positions[p]).filter(Boolean);
  if (pts.length === 0) return;

  // Colors
  const fill = active ? 'rgba(6,182,212,0.18)' : 'rgba(6,182,212,0.08)';
  const stroke = active ? 'rgba(6,182,212,0.6)' : 'rgba(6,182,212,0.25)';
  const sw = active ? 2 : 1.5;
  const dash = active ? 'none' : '8 4';

  if (pts.length === 1) {
    // Single point: circle
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', pts[0].x);
    c.setAttribute('cy', pts[0].y);
    c.setAttribute('r', 36);
    c.setAttribute('fill', fill);
    c.setAttribute('stroke', stroke);
    c.setAttribute('stroke-width', sw);
    if (dash !== 'none') c.setAttribute('stroke-dasharray', dash);
    c.style.pointerEvents = 'none';
    svg.insertBefore(c, svg.children[1] || null);
    return;
  }

  if (pts.length === 2) {
    // Two points: capsule that visibly contains both endpoint points.
    const [p1, p2] = pts;
    const r = 40;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -dy / len, ny = dx / len;
    const e1 = { x: p1.x - ux * 14, y: p1.y - uy * 14 };
    const e2 = { x: p2.x + ux * 14, y: p2.y + uy * 14 };

    const d = `
      M ${e1.x + nx * r} ${e1.y + ny * r}
      A ${r} ${r} 0 0 0 ${e1.x - nx * r} ${e1.y - ny * r}
      L ${e2.x - nx * r} ${e2.y - ny * r}
      A ${r} ${r} 0 0 0 ${e2.x + nx * r} ${e2.y + ny * r}
      Z`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', fill);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', sw);
    if (dash !== 'none') path.setAttribute('stroke-dasharray', dash);
    path.style.pointerEvents = 'none';
    svg.insertBefore(path, svg.children[1] || null);

    for (const p of pts) {
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('cx', p.x);
      halo.setAttribute('cy', p.y);
      halo.setAttribute('r', 28);
      halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', active ? 'rgba(6,182,212,0.72)' : 'rgba(6,182,212,0.32)');
      halo.setAttribute('stroke-width', active ? '2.5' : '1.6');
      halo.style.pointerEvents = 'none';
      svg.insertBefore(halo, svg.children[2] || null);
    }
    return;
  }

  // 3+ points: smooth rounded blob
  const centX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const centY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const pad = 38;

  // Sort by angle
  const sorted = pts.slice().sort((a, b) =>
    Math.atan2(a.y - centY, a.x - centX) - Math.atan2(b.y - centY, b.x - centX)
  );

  // Offset points outward
  const expanded = sorted.map(p => {
    const dx = p.x - centX, dy = p.y - centY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: p.x + (dx / dist) * pad, y: p.y + (dy / dist) * pad };
  });

  // Catmull-Rom to smooth path
  const n = expanded.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = expanded[(i - 1 + n) % n];
    const p1 = expanded[i];
    const p2 = expanded[(i + 1) % n];
    const p3 = expanded[(i + 2) % n];
    if (i === 0) d += `M ${p1.x} ${p1.y} `;
    // Catmull-Rom control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
  }
  d += 'Z';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', fill);
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', sw);
  if (dash !== 'none') path.setAttribute('stroke-dasharray', dash);
  path.setAttribute('stroke-linejoin', 'round');
  path.style.pointerEvents = 'none';
  svg.insertBefore(path, svg.children[1] || null);
}

function renderRuleBasedSpace(svg, preset, w, h) {
  const midY = h * 0.52;
  const left = Math.max(54, w * 0.08);
  const right = Math.min(w - 54, w * 0.92);
  if (preset.visual !== 'complex-plane') {
    drawRealLineBase(svg, left, right, midY);
  }

  if (preset.visual === 'cofinite') {
    drawBand(svg, left, right, midY - 26, 'rgba(6,182,212,0.18)', 'rgba(6,182,212,0.45)');
    [-1.6, 0.2, 1.35].forEach(x => drawExcludedPoint(svg, xToScreen(x, left, right), midY - 26));
    drawCaption(svg, w / 2, midY - 62, 'R \\ F: 有限個の穴を除いたほとんど全部が開集合');
  } else if (preset.visual === 'sorgenfrey') {
    const a = xToScreen(-0.8, left, right), b = xToScreen(1.35, left, right);
    drawBand(svg, a, b, midY - 28, 'rgba(139,92,246,0.18)', 'rgba(139,92,246,0.58)');
    drawEndpoint(svg, a, midY - 28, true);
    drawEndpoint(svg, b, midY - 28, false);
    drawCaption(svg, (a + b) / 2, midY - 66, '[a,b) が基本開集合');
  } else if (preset.visual === 'standard') {
    const a = xToScreen(-1.15, left, right), b = xToScreen(1.2, left, right);
    drawBand(svg, a, b, midY - 28, 'rgba(6,182,212,0.16)', 'rgba(6,182,212,0.55)');
    drawEndpoint(svg, a, midY - 28, false);
    drawEndpoint(svg, b, midY - 28, false);
    drawCaption(svg, (a + b) / 2, midY - 66, '(a,b) が基本開集合');
  } else if (preset.visual === 'complex-plane') {
    drawComplexPlaneBase(svg, left, right, midY, w, h);
    drawCaption(svg, w / 2, midY - 98, 'B(z,r): 開円板が基本開集合');
  } else if (preset.visual === 'isolated-point') {
    drawAddedPointLink(svg, right, midY, w, h, '#10b981', '孤立点 p: {p} が開集合');
  } else if (preset.visual === 'particular-point') {
    drawAddedPointLink(svg, right, midY, w, h, '#8b5cf6', '特殊点 p: 空でない開集合は p を含む');
    drawBand(svg, left, right, midY - 28, 'rgba(139,92,246,0.12)', 'rgba(139,92,246,0.35)');
  } else if (preset.visual === 'excluded-point') {
    drawAddedPointLink(svg, right, midY, w, h, '#ef4444', '排除点 p: 全体集合以外から排除');
    drawBand(svg, left, right, midY - 28, 'rgba(6,182,212,0.12)', 'rgba(6,182,212,0.35)');
  } else if (preset.visual === 'one-point-compact') {
    drawCompactificationLoop(svg, left, right, midY);
    drawCaption(svg, w / 2, midY - 92, '両端が同じ無限遠点 ∞ へ向かう');
  } else if (preset.visual === 'double-origin') {
    const zeroX = xToScreen(0, left, right);
    drawFork(svg, zeroX, midY);
    drawCaption(svg, zeroX, midY - 88, '0a と 0b は分離できない2つの原点');
  }

  drawSamplePoints(svg, preset, left, right, midY, w);
}

function drawRealLineBase(svg, left, right, y) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', left);
  line.setAttribute('x2', right);
  line.setAttribute('y1', y);
  line.setAttribute('y2', y);
  line.setAttribute('stroke', 'rgba(148,163,184,0.45)');
  line.setAttribute('stroke-width', '3');
  svg.appendChild(line);
  [-2, -1, 0, 1, 2].forEach(n => {
    const x = xToScreen(n, left, right);
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x); tick.setAttribute('x2', x);
    tick.setAttribute('y1', y - 7); tick.setAttribute('y2', y + 7);
    tick.setAttribute('stroke', 'rgba(148,163,184,0.6)');
    svg.appendChild(tick);
    drawCaption(svg, x, y + 30, String(n), '0.72rem', 'rgba(226,232,240,0.78)');
  });
}

function xToScreen(value, left, right) {
  return left + ((value + 2) / 4) * (right - left);
}

function drawBand(svg, x1, x2, y, fill, stroke) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', Math.min(x1, x2));
  rect.setAttribute('y', y - 12);
  rect.setAttribute('width', Math.abs(x2 - x1));
  rect.setAttribute('height', 24);
  rect.setAttribute('rx', 12);
  rect.setAttribute('fill', fill);
  rect.setAttribute('stroke', stroke);
  rect.setAttribute('stroke-width', '2');
  svg.appendChild(rect);
}

function drawEndpoint(svg, x, y, filled) {
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x);
  c.setAttribute('cy', y);
  c.setAttribute('r', 8);
  c.setAttribute('fill', filled ? '#e2e8f0' : '#050811');
  c.setAttribute('stroke', '#e2e8f0');
  c.setAttribute('stroke-width', '2');
  svg.appendChild(c);
}

function drawExcludedPoint(svg, x, y) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', x);
  text.setAttribute('y', y + 6);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '22');
  text.setAttribute('font-weight', '700');
  text.setAttribute('fill', '#ef4444');
  text.textContent = '×';
  svg.appendChild(text);
}

function drawFork(svg, zeroX, y) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${zeroX - 70} ${y} C ${zeroX - 36} ${y}, ${zeroX - 18} ${y - 34}, ${zeroX + 34} ${y - 34}
    M ${zeroX - 70} ${y} C ${zeroX - 36} ${y}, ${zeroX - 18} ${y + 34}, ${zeroX + 34} ${y + 34}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'rgba(139,92,246,0.65)');
  path.setAttribute('stroke-width', '4');
  path.setAttribute('stroke-linecap', 'round');
  svg.appendChild(path);
}

function drawAddedPointLink(svg, right, y, w, h, color, caption) {
  const px = Math.min(w - 70, right + 48);
  const py = Math.max(76, y - 92);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', right - 12);
  line.setAttribute('x2', px - 16);
  line.setAttribute('y1', y);
  line.setAttribute('y2', py + 10);
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '2');
  line.setAttribute('stroke-dasharray', '6 5');
  line.setAttribute('opacity', '0.65');
  svg.appendChild(line);
  drawCaption(svg, Math.min(w - 150, px - 80), py - 20, caption, '0.76rem', 'rgba(248,250,252,0.9)');
}

function drawCompactificationLoop(svg, left, right, y) {
  const topY = y - 78;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${left} ${y} C ${left + 60} ${topY}, ${right - 60} ${topY}, ${right} ${y}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'rgba(16,185,129,0.55)');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-dasharray', '8 5');
  svg.appendChild(path);
}

function drawComplexPlaneBase(svg, left, right, y, w, h) {
  const cx = (left + right) / 2;
  const top = Math.max(58, y - 78);
  const bottom = Math.min(h - 42, y + 78);
  const real = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  real.setAttribute('x1', left);
  real.setAttribute('x2', right);
  real.setAttribute('y1', y);
  real.setAttribute('y2', y);
  real.setAttribute('stroke', 'rgba(148,163,184,0.45)');
  real.setAttribute('stroke-width', '3');
  svg.appendChild(real);

  const imag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  imag.setAttribute('x1', cx);
  imag.setAttribute('x2', cx);
  imag.setAttribute('y1', top);
  imag.setAttribute('y2', bottom);
  imag.setAttribute('stroke', 'rgba(148,163,184,0.45)');
  imag.setAttribute('stroke-width', '3');
  svg.appendChild(imag);

  const disk = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  disk.setAttribute('cx', cx);
  disk.setAttribute('cy', y);
  disk.setAttribute('r', Math.min(72, (right - left) * 0.18));
  disk.setAttribute('fill', 'rgba(6,182,212,0.12)');
  disk.setAttribute('stroke', 'rgba(6,182,212,0.45)');
  disk.setAttribute('stroke-width', '2');
  disk.setAttribute('stroke-dasharray', '8 5');
  svg.appendChild(disk);

  drawCaption(svg, right - 18, y - 10, 'Re', '0.72rem', 'rgba(226,232,240,0.78)');
  drawCaption(svg, cx + 22, top + 10, 'Im', '0.72rem', 'rgba(226,232,240,0.78)');
}

function drawSamplePoints(svg, preset, left, right, y, w) {
  const cx = (left + right) / 2;
  const coords = {
    '-2': [xToScreen(-2, left, right), y],
    '-1': [xToScreen(-1, left, right), y],
    '0': [xToScreen(0, left, right), y],
    '0a': [xToScreen(0, left, right), y - 34],
    '0b': [xToScreen(0, left, right), y + 34],
    '1': [xToScreen(1, left, right), y],
    '2': [xToScreen(2, left, right), y],
    'i': [cx, y - 62],
    '-i': [cx, y + 62],
    'p': [Math.min(w - 70, right + 48), y - 82],
    '∞': [(left + right) / 2, y - 78]
  };
  for (const pt of preset.points) {
    const pair = coords[pt];
    if (!pair) continue;
    const [x, py] = pair;
    const isSelected = pt === state.selectedPoint;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', py);
    c.setAttribute('r', isSelected ? 15 : 12);
    c.setAttribute('fill', isSelected ? '#06b6d4' : '#e2e8f0');
    c.setAttribute('stroke', isSelected ? 'rgba(6,182,212,0.7)' : 'rgba(15,23,42,0.8)');
    c.setAttribute('stroke-width', '2');
    g.appendChild(c);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', py - 22);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', "'JetBrains Mono', 'Consolas', monospace");
    label.setAttribute('font-size', '13');
    label.setAttribute('fill', '#f8fafc');
    label.textContent = pt;
    g.appendChild(label);
    g.addEventListener('click', () => selectPoint(pt));
    svg.appendChild(g);
  }
}

function drawCaption(svg, x, y, text, size = '0.78rem', fill = 'rgba(248,250,252,0.9)') {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-family', "'Outfit', 'Segoe UI', sans-serif");
  t.setAttribute('font-size', size);
  t.setAttribute('fill', fill);
  t.textContent = text;
  svg.appendChild(t);
}

// ============================================================
// 19. Sequence Convergence
// ============================================================
function renderSequencePanel() {
  const preset = getCurrentPreset();
  if (!dom.sequenceSelect || !dom.sequenceContent) return;

  const examples = preset?.sequences || defaultSequenceExamples();
  dom.sequenceSelect.innerHTML = '';
  examples.forEach((ex, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = ex.label;
    dom.sequenceSelect.appendChild(opt);
  });

  const index = Math.min(Number(dom.sequenceSelect.dataset.selected || 0), examples.length - 1);
  dom.sequenceSelect.value = String(index);
  dom.sequenceContent.textContent = examples[index]?.text || 'この空間の点列例はまだありません。';
}

function defaultSequenceExamples() {
  const t0 = checkT0(state.points, state.opens).holds;
  const t1 = checkT1(state.points, state.opens).holds;
  if (!t0) {
    return [{
      label: '任意の点列',
      text: 'T0 でない有限空間では、開集合が点を十分に見分けられません。密着空間では、どの点列もすべての点に収束します。'
    }];
  }
  if (!t1) {
    return [{
      label: 'eventually a',
      text: '十分後にずっと a になる列は a に収束します。ただし T1 でない空間では、specialization の向きによって他の点にも収束することがあります。'
    }];
  }
  return [{
    label: 'eventually x',
    text: '有限の T1 空間では、点列が x に収束するには十分後に x に留まる必要があります。離散空間では特にこの直感がそのまま成り立ちます。'
  }];
}

// ============================================================
// 20. Sheaf Mode
// ============================================================
function refreshSheafMode() {
  populateSheafOpenSelect();
  renderSheafMode();
}

function getSheafOpenOptions() {
  const preset = getCurrentPreset();
  if (isRuleBasedPreset(preset)) {
    if (preset.visual === 'complex-plane') {
      return [
        { label: 'U = B(0,1)', set: ['0'], note: '0 を中心とする開円板' },
        { label: 'V = B(0,1) \\ {0}', set: ['1', 'i', '-i'], note: '穴あき円板。1/z のような例が見える' },
        { label: 'U₁∪U₂ = 左右の円板の和', set: ['-1', '0', '1'], note: '正則関数を貼り合わせる局所領域' },
      ];
    }
    if (preset.visual === 'standard') {
      return [
        { label: 'U = (-1, 1)', set: ['-1', '0', '1'], note: '通常の開区間' },
        { label: 'V = (0, 1)', set: ['0', '1'], note: 'より小さい開区間 V⊂U' },
        { label: 'U₁∪U₂ = (-2,0)∪(0,2)', set: ['-2', '-1', '1', '2'], note: '2つの局所領域の和' },
      ];
    }
    if (preset.visual === 'sorgenfrey') {
      return [
        { label: 'U = [0, 2)', set: ['0', '1', '2'], note: 'Sorgenfrey 基本開集合' },
        { label: 'V = [1, 2)', set: ['1', '2'], note: '半開区間の制限先' },
        { label: 'U = [-1,1)∪[1,2)', set: ['-1', '0', '1', '2'], note: '半開区間で貼り合わせる' },
      ];
    }
    if (preset.visual === 'cofinite') {
      return [
        { label: 'U = R \\ {1,2}', set: ['-2', '-1', '0'], note: '有限個の穴を除いた開集合' },
        { label: 'V = R \\ {-1,1,2}', set: ['-2', '0'], note: 'さらに穴を増やした制限先' },
      ];
    }
    return [
      { label: 'U = X', set: preset.points, note: '空間全体' },
      { label: 'V = 観察用の小さい開集合', set: preset.points.slice(0, Math.max(1, preset.points.length - 1)), note: '局所データを見る領域' },
    ];
  }

  const nonempty = state.opens.filter(U => U.length > 0);
  const options = nonempty.length > 0 ? nonempty : [state.points];
  return options.map((U, i) => ({
    label: `U${i + 1} = ${formatSet(U)}`,
    set: U,
    note: sameSet(U, state.points) ? '全体開集合' : '有限空間の開集合'
  }));
}

function populateSheafOpenSelect() {
  const options = getSheafOpenOptions();
  dom.sheafOpenSelect.innerHTML = '';
  options.forEach((opt, i) => {
    const el = document.createElement('option');
    el.value = String(i);
    el.textContent = opt.label;
    dom.sheafOpenSelect.appendChild(el);
  });
  state.sheafOpenIndex = Math.min(state.sheafOpenIndex, Math.max(0, options.length - 1));
  dom.sheafOpenSelect.value = String(state.sheafOpenIndex);
}

function sheafTypeInfo(type, openOpt) {
  const label = openOpt.label;
  const size = openOpt.set.length;
  const infos = {
    continuous: {
      name: '連続実数値関数の層 C⁰',
      section: `F(${label}) = ${label} 上の連続な実数値関数全体`,
      example: size <= 2 ? '例: 各点の値が近傍の観測と矛盾しない関数' : '例: f(x)=x, f(x)=sin(x), 局所的に定義された連続関数',
      restriction: 'V⊂U では、関数 f を V だけに制限して f|V を作ります。',
      gluing: '開被覆 {Uᵢ} 上の連続関数 fᵢ が重なり Uᵢ∩Uⱼ で一致すれば、一意な連続関数 f に貼り合わさります。',
      warning: '層の代表例です。局所的に連続なら、貼り合わせ後も連続です。'
    },
    holomorphic: {
      name: '正則関数の層 O',
      section: `O(${label}) = ${label} 上の複素正則関数全体`,
      example: '例: z, z², exp(z), 1/z（0 を含まない開集合上）',
      restriction: '正則関数を小さい開集合へ制限しても正則です。',
      gluing: '重なりで一致する正則関数は、一意に正則関数として貼り合わさります。',
      warning: '複素関数論の主役です。特異点を含むかどうかで F(U) が大きく変わります。'
    },
    'locally-constant-group': {
      name: '局所定数な群の層',
      section: `F(${label}) = ${label} 上で局所的に一定な群値データ`,
      example: '例: 各連結成分ごとに同じ整数や群元を割り当てるデータ',
      restriction: '小さい開集合へ行くと、見えている成分上の群元だけが残ります。',
      gluing: '重なりで群元が一致すれば、成分ごとの値を貼り合わせられます。',
      warning: '基本群やモノドロミーの直感につながります。局所では単純でも大域ではねじれることがあります。'
    },
    'constant-group': {
      name: '定数群 Z の層',
      section: `F(${label}) = ${label} 上で同じ整数を持つ大域的に一定なデータ`,
      example: '例: すべての点に同じ整数 n を置く',
      restriction: '制限しても同じ整数 n が残ります。',
      gluing: '局所的な整数が重なりで一致すれば、全体の整数として貼り合わさります。',
      warning: '「どこでも同じ値」を要求するので、局所定数な層より硬い例です。'
    },
    skyscraper: {
      name: '一点に集中する層',
      section: `F(${label}) = 特別な点 p を含む時だけ現れるデータ`,
      example: '例: p を含む開集合なら群 A、含まなければ 0',
      restriction: 'p を含まない開集合へ制限するとデータは消えます。',
      gluing: 'p の近くのデータだけが本質的で、他の場所ではゼロとして貼り合わさります。',
      warning: '局所的な欠陥、特異点、点支持のデータを見るための典型例です。'
    }
  };
  return infos[type] || infos.continuous;
}

function sheafDiagramData(type, openOpt, info) {
  const labels = {
    continuous: {
      global: '連続関数 f',
      localA: 'f|U₁',
      localB: 'f|U₂',
      stalk: '点 x の芽 germₓ(f)',
      fiber: '実数値'
    },
    holomorphic: {
      global: '正則関数 f(z)',
      localA: 'f|U₁',
      localB: 'f|U₂',
      stalk: '点 z₀ の芽 germ₍z₀₎(f)',
      fiber: '級数展開'
    },
    'locally-constant-group': {
      global: '群値データ g',
      localA: '成分ごとの g₁',
      localB: '成分ごとの g₂',
      stalk: '点 x の局所群元',
      fiber: '群 G'
    },
    'constant-group': {
      global: '整数 n',
      localA: '同じ整数 n',
      localB: '同じ整数 n',
      stalk: '点 x の整数',
      fiber: 'Z'
    },
    skyscraper: {
      global: '支持点 p のデータ a',
      localA: 'p を含むなら a',
      localB: 'p を含まなければ 0',
      stalk: 'p の茎だけ非自明',
      fiber: 'A または 0'
    }
  };
  return labels[type] || labels.continuous;
}

function renderSheafDiagram(openOpt, info, type) {
  const d = sheafDiagramData(type, openOpt, info);
  const diagram = document.createElement('div');
  diagram.className = 'sheaf-diagram';
  diagram.innerHTML = `
    <div class="sheaf-space-layer">
      <div class="sheaf-open sheaf-open-large">
        <span class="sheaf-open-label">U</span>
        <span class="sheaf-open-caption">${openOpt.label}</span>
        <span class="sheaf-local-section section-a">${d.localA}</span>
        <span class="sheaf-local-section section-b">${d.localB}</span>
      </div>
      <div class="sheaf-open sheaf-open-small">
        <span class="sheaf-open-label">V</span>
        <span class="sheaf-open-caption">V ⊂ U</span>
      </div>
    </div>
    <div class="sheaf-arrow-stack">
      <span>F</span>
      <span class="sheaf-arrow-down">↓</span>
      <span class="sheaf-arrow-note">開集合にデータを対応</span>
    </div>
    <div class="sheaf-data-layer">
      <div class="sheaf-data-box">
        <strong>F(U)</strong>
        <span>${d.global}</span>
      </div>
      <div class="sheaf-restrict-arrow">
        <span>resᵁᵥ</span>
        <span>→</span>
      </div>
      <div class="sheaf-data-box">
        <strong>F(V)</strong>
        <span>${d.stalk}</span>
      </div>
    </div>
    <div class="sheaf-glue-strip">
      <span class="glue-piece">局所切断</span>
      <span class="glue-piece">重なりで一致</span>
      <span class="glue-arrow">⇒</span>
      <span class="glue-piece glue-result">一意に貼り合わせ</span>
      <span class="glue-fiber">${d.fiber}</span>
    </div>`;
  dom.sheafBoard.appendChild(diagram);
}

function selectedSheafExamples(type, openOpt) {
  const examples = {
    continuous: [
      'U ↦ U 上の連続実数値関数 C⁰(U)',
      'U ↦ U 上の連続な円周値関数 C⁰(U,S¹)',
      'U ↦ U 上の連続なベクトル場'
    ],
    holomorphic: [
      'U ↦ U 上の正則関数 O(U)',
      'U ↦ U 上の消えない正則関数 O*(U)',
      'U ↦ U 上の有理型関数 M(U)'
    ],
    'locally-constant-group': [
      'U ↦ U 上の局所定数な整数値関数',
      'U ↦ U 上の局所定数な群 G 値関数',
      '被覆空間の局所切断'
    ],
    'constant-group': [
      'U ↦ 各連結成分ごとの整数値',
      'U ↦ 局所定数な Z 値関数としての定数層',
      'U ↦ locally constant maps U → A'
    ],
    skyscraper: [
      'p∈U なら A、p∉U なら 0',
      '特異点 p に支持されたベクトル空間',
      '一点の茎だけを持つ局所データ'
    ]
  };
  return examples[type] || examples.continuous;
}

function sheafCandidateCheck(candidate, type, openOpt) {
  if (candidate === 'selected') {
    return {
      name: `${sheafTypeInfo(type, openOpt).name}`,
      verdict: '層です',
      ok: true,
      checks: [
        ['制限', true, '小さい開集合へ自然に制限できます。'],
        ['局所性', true, '局所切断が被覆上で同じなら、元の切断も同じです。'],
        ['貼り合わせ', true, '重なりで一致する局所切断は一意に貼り合わさります。']
      ],
      examples: selectedSheafExamples(type, openOpt)
    };
  }
  const table = {
    'bounded-functions': {
      name: '有界関数 U ↦ B(U)',
      verdict: '一般には層ではありません',
      ok: false,
      checks: [
        ['制限', true, '有界関数を小さい開集合へ制限しても有界です。'],
        ['局所性', true, '関数として局所的に一致すれば大域的にも一致します。'],
        ['貼り合わせ', false, '各局所片では有界でも、貼り合わせると全体で非有界になることがあります。例: R を (-n,n) で覆い、f(x)=x。']
      ],
      examples: ['局所有界関数の層なら層になる', '大域有界性を F(U) に要求すると貼り合わせで壊れる']
    },
    'constant-presheaf': {
      name: '定数前層 U ↦ Z',
      verdict: '前層ですが、一般には層ではありません',
      ok: false,
      checks: [
        ['制限', true, 'どの制限写像も恒等写像として定義できます。'],
        ['局所性', true, '同じ整数なら局所的にも同じです。'],
        ['貼り合わせ', false, '非連結な U では、成分ごとに違う整数を置く局所データを1つの整数に貼れません。層化すると局所定数な Z 値関数になります。']
      ],
      examples: ['定数前層 Z', 'その層化: 局所定数な Z 値関数']
    },
    'discontinuous-functions': {
      name: '任意関数 U ↦ Map(U,R)',
      verdict: '層です',
      ok: true,
      checks: [
        ['制限', true, '任意関数は部分集合へ制限できます。'],
        ['局所性', true, '点ごとの値が局所的に一致すれば関数は一致します。'],
        ['貼り合わせ', true, '重なりで値が一致する任意関数は、点ごとに貼り合わせられます。連続性などの条件を課していないためです。']
      ],
      examples: ['集合値関数の層', 'R 値関数の層', 'G 値関数の層']
    },
    'germs-at-point': {
      name: '点 x の近くだけを見るデータ',
      verdict: '点支持の層として作れば層です',
      ok: true,
      checks: [
        ['制限', true, 'x を含む開集合ではデータを保ち、含まない開集合では 0 にします。'],
        ['局所性', true, 'x の近くで同じなら、点支持データとして同じです。'],
        ['貼り合わせ', true, 'x を含む局所片だけが本質的で、他は 0 として矛盾なく貼れます。']
      ],
      examples: ['skyscraper sheaf', '点 p に支持されたベクトル空間', '特異点の局所寄与']
    }
  };
  return table[candidate] || table['discontinuous-functions'];
}

function renderSheafCheckCard(type, openOpt) {
  const check = sheafCandidateCheck(state.sheafCandidate, type, openOpt);
  const card = document.createElement('div');
  card.className = 'sheaf-check-card ' + (check.ok ? 'is-sheaf' : 'not-sheaf');

  const title = document.createElement('div');
  title.className = 'sheaf-check-title';
  title.textContent = `${check.name} : ${check.verdict}`;
  card.appendChild(title);

  const list = document.createElement('div');
  list.className = 'sheaf-check-list';
  check.checks.forEach(([label, ok, text]) => {
    const row = document.createElement('div');
    row.className = 'sheaf-check-row';
    row.innerHTML = `<span class="${ok ? 'check-pass' : 'check-fail'}">${ok ? '✓' : '✗'}</span><strong>${label}</strong><span>${text}</span>`;
    list.appendChild(row);
  });
  card.appendChild(list);

  const examples = document.createElement('div');
  examples.className = 'sheaf-example-list';
  examples.textContent = '具体例: ' + check.examples.join(' / ');
  card.appendChild(examples);

  dom.sheafBoard.appendChild(card);
  return check;
}

function renderSheafMode() {
  const preset = getCurrentPreset();
  const options = getSheafOpenOptions();
  const openOpt = options[state.sheafOpenIndex] || options[0] || { label: 'U = ∅', set: [], note: '空集合' };
  const type = state.sheafType;
  const info = sheafTypeInfo(type, openOpt);
  const spaceName = preset ? preset.name : 'カスタム空間';

  dom.sheafTypeSelect.value = type;
  dom.sheafOpenSelect.value = String(state.sheafOpenIndex);
  dom.sheafCandidateSelect.value = state.sheafCandidate;
  dom.sheafTitle.textContent = `${info.name}`;
  dom.sheafMeta.textContent = `${spaceName} の上の層`;
  dom.sheafBoard.innerHTML = '';

  renderSheafDiagram(openOpt, info, type);
  const sheafCheck = renderSheafCheckCard(type, openOpt);

  const cards = [
    { title: '開集合 U', body: `${openOpt.label}\n${openOpt.note}` },
    { title: '切断 F(U)', body: `${info.section}\n${info.example}` },
    { title: '制限写像', body: `res: F(U) → F(V)\n${info.restriction}` },
    { title: '貼り合わせ', body: info.gluing },
  ];

  for (const card of cards) {
    const el = document.createElement('div');
    el.className = 'sheaf-card';
    const title = document.createElement('div');
    title.className = 'sheaf-card-title';
    title.textContent = card.title;
    const body = document.createElement('div');
    body.className = 'sheaf-card-body';
    body.textContent = card.body;
    el.appendChild(title);
    el.appendChild(body);
    dom.sheafBoard.appendChild(el);
  }

  dom.sheafResult.textContent = [
    `${sheafCheck.name}: ${sheafCheck.verdict}`,
    '',
    info.warning,
    '',
    '層の公理:',
    '1. データは小さい開集合へ制限できる。',
    '2. 重なりで一致する局所データは貼り合う。',
    '3. 貼り合わせは一意である。',
  ].join('\n');
}


// ============================================================
// 21. Mode Switching
// ============================================================
function switchMode(mode) {
  state.mode = mode;
  dom.tabEditor.classList.toggle('active', mode === 'editor');
  dom.tabMap.classList.toggle('active', mode === 'map');
  dom.tabSheaf.classList.toggle('active', mode === 'sheaf');

  // Toggle views
  dom.editorView.style.display = mode === 'editor' ? '' : 'none';
  dom.mapView.classList.toggle('active', mode === 'map');
  dom.sheafView.classList.toggle('active', mode === 'sheaf');

  // Toggle panels
  dom.mapSettingsPanel.style.display = mode === 'map' ? '' : 'none';
  dom.sheafSettingsPanel.style.display = mode === 'sheaf' ? '' : 'none';
  dom.continuityPanel.style.display = mode === 'map' ? '' : 'none';
  dom.sheafPanel.style.display = mode === 'sheaf' ? '' : 'none';

  if (mode === 'map') {
    // Save current space before switching
    if (!isRuleBasedPreset()) saveCurrentSpace();
    refreshMapMode();
  } else if (mode === 'sheaf') {
    refreshSheafMode();
  } else {
    refreshAll();
  }

  const modeName = mode === 'editor' ? '空間エディタ' : mode === 'map' ? '写像' : '層ビュー';
  addLog(`モードを「${modeName}」に切り替えました。`, 'log-system');
}

// ============================================================
// 21. Map Mode
// ============================================================
function refreshMapMode() {
  populateSpaceSelects();
  renderMapSpaces();
  renderMapDefRows();
}

function swapMapSpaces() {
  const domainKey = dom.mapDomainSelect.value || state.mapDomainKey;
  const codomainKey = dom.mapCodomainSelect.value || state.mapCodomainKey;
  if (!domainKey || !codomainKey) {
    addLog('反転するには定義域と値域を選択してください。', 'log-warn');
    return;
  }

  state.mapDomainKey = codomainKey;
  state.mapCodomainKey = domainKey;
  state.mapValues = {};
  dom.mapDomainSelect.value = state.mapDomainKey;
  dom.mapCodomainSelect.value = state.mapCodomainKey;

  renderMapSpaces();
  renderMapDefRows();
  dom.continuityResult.className = 'continuity-result continuous';
  dom.continuityResult.textContent = '定義域 X と値域 Y を反転しました。写像定義を確認して、もう一度検証してください。';
  addLog('定義域 X と値域 Y を反転しました。', 'log-accent');
}

function populateSpaceSelects() {
  const options = Object.entries(state.savedSpaces).map(([k, v]) =>
    `<option value="${k}">${v.name} [保存]</option>`
  ).join('');

  // Add presets. Finite spaces use pointwise maps; rule-based spaces use formula maps.
  const presetOptions = Object.entries(PRESETS)
    .filter(([k]) => !state.savedSpaces[k])
    .map(([k, v]) => `<option value="${k}">${v.name}${isRuleBasedPreset(v) ? ' [連続]' : ' [有限]'}</option>`)
    .join('');

  const allOptions = options + presetOptions;

  dom.mapDomainSelect.innerHTML = allOptions;
  dom.mapCodomainSelect.innerHTML = allOptions;

  if (state.mapDomainKey) dom.mapDomainSelect.value = state.mapDomainKey;
  if (state.mapCodomainKey) dom.mapCodomainSelect.value = state.mapCodomainKey;
}

function getSpaceData(key) {
  if (state.savedSpaces[key]) return state.savedSpaces[key];
  if (PRESETS[key]) {
    const p = PRESETS[key];
    return {
      key,
      kind: p.kind || 'finite',
      visual: p.visual,
      name: p.name,
      points: [...p.points],
      opens: p.opens.map(s => [...s]),
      topologySummary: p.topologySummary || [],
      separationSummary: p.separationSummary || [],
    };
  }
  return null;
}

function isFiniteSpaceData(spaceData) {
  return spaceData && spaceData.kind !== 'real-line';
}

function renderMapSpaces() {
  const domainKey = dom.mapDomainSelect.value;
  const codomainKey = dom.mapCodomainSelect.value;
  state.mapDomainKey = domainKey;
  state.mapCodomainKey = codomainKey;

  const domainData = getSpaceData(domainKey);
  const codomainData = getSpaceData(codomainKey);

  dom.mapDomainName.textContent = domainData ? domainData.name : '—';
  dom.mapCodomainName.textContent = codomainData ? codomainData.name : '—';

  renderMapSvg(dom.mapSvgDomain, domainData, 'domain');
  renderMapSvg(dom.mapSvgCodomain, codomainData, 'codomain');
}

function renderMapSvg(svg, spaceData, role) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  if (!spaceData) return;

  const parent = svg.parentElement;
  const w = parent.clientWidth || 300;
  const h = Math.max((parent.clientHeight - 40), 200);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  if (isRuleBasedPreset(spaceData)) {
    renderRuleBasedSpace(svg, spaceData, w, h);
    return;
  }

  const positions = computeLayout(spaceData.points, w, h);
  const color = role === 'domain' ? '#06b6d4' : '#8b5cf6';

  for (const pt of spaceData.points) {
    const pos = positions[pt];
    if (!pos) continue;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', 17);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', 'rgba(255,255,255,0.3)');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pos.x);
    label.setAttribute('y', pos.y);
    label.setAttribute('dy', '0.38em');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.setAttribute('fill', '#fff');
    label.setAttribute('font-family', "'JetBrains Mono', 'Consolas', monospace");
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', '700');
    label.setAttribute('pointer-events', 'none');
    label.textContent = pt;
    g.appendChild(label);

    svg.appendChild(g);
  }
}

function renderMapDefRows() {
  dom.mapDefRows.innerHTML = '';
  const domainData = getSpaceData(state.mapDomainKey);
  const codomainData = getSpaceData(state.mapCodomainKey);
  if (!domainData || !codomainData) return;

  const finiteMode = isFiniteSpaceData(domainData) && isFiniteSpaceData(codomainData);
  dom.mapFormulaPanel.style.display = finiteMode ? 'none' : 'block';
  if (!finiteMode) {
    renderFormulaMapSummary(domainData, codomainData);
    return;
  }

  for (const pt of domainData.points) {
    const row = document.createElement('div');
    row.className = 'map-row';

    const from = document.createElement('span');
    from.className = 'map-from';
    from.textContent = pt;

    const arrow = document.createElement('span');
    arrow.className = 'map-arrow';
    arrow.textContent = '↦';

    const sel = document.createElement('select');
    sel.dataset.point = pt;
    for (const q of codomainData.points) {
      const opt = document.createElement('option');
      opt.value = q;
      opt.textContent = q;
      if (state.mapValues[pt] === q) opt.selected = true;
      sel.appendChild(opt);
    }
    // Default to first point
    if (!state.mapValues[pt] && codomainData.points.length > 0) {
      state.mapValues[pt] = codomainData.points[0];
    }
    sel.value = state.mapValues[pt] || '';
    sel.addEventListener('change', () => {
      state.mapValues[pt] = sel.value;
    });

    row.appendChild(from);
    row.appendChild(arrow);
    row.appendChild(sel);
    dom.mapDefRows.appendChild(row);
  }
}

function renderFormulaMapSummary(domainData, codomainData) {
  const formula = state.mapFormula;
  dom.mapFunctionSelect.value = formula;
  const row = document.createElement('div');
  row.className = 'formula-map-summary';
  row.textContent = formulaLabel(formula) + '\n連続的な空間では開集合を列挙せず、値域の基本開集合の逆像が定義域で開くかをプリセット規則で判定します。';
  dom.mapDefRows.appendChild(row);
}

function formulaLabel(formula) {
  const labels = {
    identity: 'f(x)=x',
    'constant-0': 'f(x)=0',
    square: 'f(x)=x²',
    'collapse-added': '追加点 p または ∞ を 0 に送り、実数点はそのまま送る'
  };
  return labels[formula] || formula;
}

function runContinuityCheck() {
  const domainData = getSpaceData(state.mapDomainKey);
  const codomainData = getSpaceData(state.mapCodomainKey);
  if (!domainData || !codomainData) {
    addLog('定義域と値域を選択してください。', 'log-error');
    return;
  }

  if (!isFiniteSpaceData(domainData) || !isFiniteSpaceData(codomainData)) {
    runRuleBasedContinuityCheck(domainData, codomainData);
    return;
  }

  // Validate that map is fully defined
  for (const pt of domainData.points) {
    if (!state.mapValues[pt]) {
      addLog(`点 ${pt} の写像先が未定義です。`, 'log-error');
      return;
    }
  }

  const result = checkContinuity(domainData.opens, codomainData.opens, state.mapValues);

  if (result.continuous) {
    dom.continuityResult.className = 'continuity-result continuous';
    dom.continuityResult.textContent = 'この写像は連続です。\nY のすべての開集合について、逆像が X の開集合になっています。';
    addLog('写像は連続です ✓', 'log-success');
  } else {
    let text = 'この写像は連続ではありません。\n\n';
    for (const f of result.failures) {
      text += `反例となる開集合: ${formatSet(f.V)}\n`;
      text += `逆像 f⁻¹(${formatSet(f.V)}) = ${formatSet(f.inv)}\n`;
      text += `これは X の開集合ではありません。\n\n`;
    }
    dom.continuityResult.className = 'continuity-result not-continuous';
    dom.continuityResult.textContent = text.trim();
    addLog(`写像は連続ではありません。反例: ${result.failures.length} 件`, 'log-error');
  }

  // Log detailed trace
  addLog('--- 連続性検証トレース ---', 'log-system');
  for (const V of codomainData.opens) {
    const inv = preimage(state.mapValues, V);
    const isOpen = containsSet(domainData.opens, inv);
    addLog(`  V = ${formatSet(V)} → f⁻¹(V) = ${formatSet(inv)} → ${isOpen ? '開集合 ✓' : '開集合でない ✗'}`, isOpen ? 'log-success' : 'log-error');
  }
}

function runRuleBasedContinuityCheck(domainData, codomainData) {
  const formula = state.mapFormula;
  const result = checkRuleBasedContinuity(domainData, codomainData, formula);
  dom.continuityResult.className = 'continuity-result ' + (result.continuous ? 'continuous' : 'not-continuous');
  dom.continuityResult.textContent = [
    `${formulaLabel(formula)} : ${domainData.name} → ${codomainData.name}`,
    '',
    result.continuous ? 'この写像は連続です。' : 'この写像は連続ではありません。',
    result.reason,
    '',
    '逆像の見方:',
    result.trace
  ].join('\n').trim();
  addLog(`連続空間の写像 ${formulaLabel(formula)} は ${result.continuous ? '連続' : '非連続'} です。`, result.continuous ? 'log-success' : 'log-error');
}

function checkRuleBasedContinuity(domain, codomain, formula) {
  if (formula === 'constant-0') {
    return {
      continuous: true,
      reason: '定数写像では、値域の開集合 V の逆像は X 全体または空集合になります。どちらも任意の位相空間で開集合です。',
      trace: '0 ∈ V なら f⁻¹(V)=X、0 ∉ V なら f⁻¹(V)=∅。'
    };
  }

  if (formula === 'collapse-added') {
    if (domain.key === 'one-point-compactification' && codomain.key === 'real-standard') {
      return {
        continuous: false,
        reason: '∞ を 0 に潰すと、通常の小さな開区間 (-ε,ε) の逆像が ∞ と 0 近くを同時に含む集合になります。∞ の近傍は遠方を含む必要があるため、この逆像は開きません。',
        trace: 'V=(-1,1) とすると、∞ を含む f⁻¹(V) は ∞ の近傍条件を満たしません。'
      };
    }
    return {
      continuous: domain.key?.includes('real-plus') || domain.key === codomain.key,
      reason: domain.key?.includes('real-plus')
        ? '孤立点 p を 0 へ送る場合、p の寄与は孤立した一点なので逆像の開性を壊しません。'
        : 'このプリセット写像は追加点を潰す直感を観察するための簡易判定です。一般には追加点の近傍定義に依存します。',
      trace: '追加点を含む逆像が、定義域側で開集合として許されるかを見ます。'
    };
  }

  if (formula === 'square') {
    if (codomain.key === 'sorgenfrey-line') {
      return {
        continuous: false,
        reason: 'Sorgenfrey 直線の基本開集合 [a,b) の逆像は、通常の端点を含む形になりやすく、通常位相やSorgenfrey位相で開集合にならない反例があります。',
        trace: 'たとえば [1,2) の逆像は端点 ±1 を含むため、通常の開区間型では開きません。'
      };
    }
    if (domain.key === 'real-standard' && codomain.key === 'real-standard') {
      return {
        continuous: true,
        reason: '通常の実数位相では x² は連続関数です。',
        trace: '任意の開区間の逆像は開集合になります。'
      };
    }
    return {
      continuous: false,
      reason: 'この組み合わせでは x² の逆像が、値域側の特殊な基本開集合に対して開集合とは限りません。',
      trace: '特殊位相の基本開集合を通常の式で引き戻したとき、端点や追加点の扱いが開性を壊します。'
    };
  }

  // identity / forget-or-refine topology
  if (domain.key === codomain.key) {
    return {
      continuous: true,
      reason: '同じ位相空間上の恒等写像なので、任意の開集合の逆像はその開集合自身です。',
      trace: 'f⁻¹(U)=U。'
    };
  }
  const idKey = `${domain.key}->${codomain.key}`;
  const identityCases = {
    'sorgenfrey-line->real-standard': [true, 'Sorgenfrey 位相は通常位相より細かいので、通常開集合の逆像は Sorgenfrey 側で開集合です。', '通常開区間 (a,b) は Sorgenfrey 直線でも開集合です。'],
    'real-standard->sorgenfrey-line': [false, '値域を Sorgenfrey 直線にすると [a,b) が開集合ですが、その逆像 [a,b) は通常の実数直線では開集合ではありません。', 'V=[0,1) の逆像は [0,1)。通常位相では開きません。'],
    'real-standard->cofinite-real': [true, '余有限位相の開集合 R\\F は、通常の実数直線では有限集合 F の補集合なので開集合です。', '有限集合は通常位相で閉集合なので、その補集合は開集合です。'],
    'cofinite-real->real-standard': [false, '通常の開区間 (a,b) の逆像は同じ (a,b) ですが、余有限位相では補集合が無限なので開集合ではありません。', 'V=(-1,1) の補集合は無限、したがって余有限開ではありません。'],
    'real-standard->real-particular-point': [false, '特殊点 p を含む小さな開集合の逆像が、通常の実数直線側で対応しない場合があります。追加点を持たない通常直線からの恒等的な扱いは位相を保ちません。', '追加点を含む開集合を引き戻す規則が自然に合いません。'],
    'real-standard->real-excluded-point': [true, '排除点位相の実数側の開集合は、通常の開集合として引き戻せます。', 'p を含まない開集合は通常の実数開集合、全体集合の逆像は全体集合です。'],
    'one-point-compactification->real-standard': [false, '∞ を忘れて実数直線へ送る恒等的な写像は連続にできません。∞ の近傍条件が通常直線の開区間と合いません。', '∞ をどう扱うかで、通常開集合の逆像が∞近傍にならない反例が出ます。'],
    'real-standard->one-point-compactification': [true, 'R を R∪{∞} に埋め込む包含写像は連続です。通常開集合部分の逆像は通常開集合になります。', '∞ の近傍の逆像は十分遠方の開集合で、通常位相で開集合です。']
  };
  if (identityCases[idKey]) {
    const [continuous, reason, trace] = identityCases[idKey];
    return { continuous, reason, trace };
  }
  return {
    continuous: false,
    reason: 'この組み合わせは、現時点では安全側に「未確認/一般には連続とは限らない」として扱います。定数写像を選ぶと、任意の空間の間で連続になることを確認できます。',
    trace: '値域の基本開集合の逆像が、定義域の基底や近傍規則に合うかを個別に調べる必要があります。'
  };
}

// ============================================================
// 22. Event Handlers
// ============================================================
function initEvents() {
  // Mode tabs
  dom.tabEditor.addEventListener('click', () => switchMode('editor'));
  dom.tabMap.addEventListener('click', () => switchMode('map'));
  dom.tabSheaf.addEventListener('click', () => switchMode('sheaf'));

  // Preset
  dom.presetSelect.addEventListener('change', () => {
    const val = dom.presetSelect.value;
    if (val) loadPreset(val);
  });

  // Add point
  dom.btnAddPoint.addEventListener('click', () => {
    addPoint(dom.inputAddPoint.value);
    dom.inputAddPoint.value = '';
  });
  dom.inputAddPoint.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addPoint(dom.inputAddPoint.value); dom.inputAddPoint.value = ''; }
  });

  // Add open set
  dom.btnAddOpen.addEventListener('click', () => {
    addOpenSet(dom.inputAddOpen.value);
    dom.inputAddOpen.value = '';
  });
  dom.inputAddOpen.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addOpenSet(dom.inputAddOpen.value); dom.inputAddOpen.value = ''; }
  });

  // Help modal
  dom.btnHelp.addEventListener('click', () => dom.helpModal.classList.add('active'));
  dom.btnCloseHelp.addEventListener('click', () => dom.helpModal.classList.remove('active'));
  dom.helpModal.addEventListener('click', (e) => { if (e.target === dom.helpModal) dom.helpModal.classList.remove('active'); });

  // Log clear
  dom.btnClearLog.addEventListener('click', () => {
    dom.logBody.innerHTML = '<div class="log-line log-system">ログをクリアしました。</div>';
  });

  dom.sequenceSelect.addEventListener('change', () => {
    dom.sequenceSelect.dataset.selected = dom.sequenceSelect.value;
    renderSequencePanel();
  });

  dom.sheafTypeSelect.addEventListener('change', () => {
    state.sheafType = dom.sheafTypeSelect.value;
    renderSheafMode();
  });
  dom.sheafOpenSelect.addEventListener('change', () => {
    state.sheafOpenIndex = Number(dom.sheafOpenSelect.value) || 0;
    renderSheafMode();
  });
  dom.sheafCandidateSelect.addEventListener('change', () => {
    state.sheafCandidate = dom.sheafCandidateSelect.value;
    renderSheafMode();
  });

  // Map mode events
  dom.mapDomainSelect.addEventListener('change', () => {
    state.mapValues = {};
    renderMapSpaces();
    renderMapDefRows();
  });
  dom.mapCodomainSelect.addEventListener('change', () => {
    state.mapValues = {};
    renderMapSpaces();
    renderMapDefRows();
  });
  dom.mapFunctionSelect.addEventListener('change', () => {
    state.mapFormula = dom.mapFunctionSelect.value;
    renderMapDefRows();
  });
  dom.btnSwapMapSpaces.addEventListener('click', swapMapSpaces);
  dom.btnCheckContinuity.addEventListener('click', runContinuityCheck);

  // Use current space as domain/codomain
  dom.btnUseAsDomain.addEventListener('click', () => {
    const key = saveCurrentSpace();
    state.mapDomainKey = key;
    populateSpaceSelects();
    dom.mapDomainSelect.value = key;
    state.mapValues = {};
    renderMapSpaces();
    renderMapDefRows();
    addLog('現在の空間を定義域に設定しました。', 'log-accent');
  });
  dom.btnUseAsCodomain.addEventListener('click', () => {
    const key = saveCurrentSpace();
    state.mapCodomainKey = key;
    populateSpaceSelects();
    dom.mapCodomainSelect.value = key;
    state.mapValues = {};
    renderMapSpaces();
    renderMapDefRows();
    addLog('現在の空間を値域に設定しました。', 'log-accent');
  });

  // Window resize
  window.addEventListener('resize', () => {
    if (state.mode === 'editor') renderSvg();
    else if (state.mode === 'map') renderMapSpaces();
    else if (state.mode === 'sheaf') renderSheafMode();
  });
}

// ============================================================
// 23. Initialization
// ============================================================
function init() {
  initEvents();
  loadPreset('sierpinski');
}

document.addEventListener('DOMContentLoaded', init);
