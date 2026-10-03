/**
 * GlitchPoet — メインアプリケーション
 * UI制御・イベントハンドリング・履歴管理・エクスポート
 */

// ═══════════════════════════════════════════
//  State
// ═══════════════════════════════════════════

const state = {
    inputMode: 'simple',      // 'simple' | 'detail'
    destructionLevel: 0.10,
    seed: 42,
    history: [],               // { id, text, originalEntries, seed, destructionLevel, modes, annotations, bookmarked }
    selectedHistoryId: null,
    showDiff: false,
    showAnnotations: false,
    detailModes: null,         // 詳細モードの手動設定（null = 自動）
    historyIdCounter: 0,
};

// ═══════════════════════════════════════════
//  DOM References
// ═══════════════════════════════════════════

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    textInput: $('#textInput'),
    inputModeIndicator: $('#inputModeIndicator'),
    fileInput: $('#fileInput'),
    fileLoadBtn: $('#fileLoadBtn'),
    otherWorldInput: $('#otherWorldInput'),
    modeSimple: $('#modeSimple'),
    modeDetail: $('#modeDetail'),
    destructionSlider: $('#destructionSlider'),
    destructionValue: $('#destructionValue'),
    destructionName: $('#destructionName'),
    seedInput: $('#seedInput'),
    seedRandomBtn: $('#seedRandomBtn'),
    generateBtn: $('#generateBtn'),
    batchBtn: $('#batchBtn'),
    batchCount: $('#batchCount'),
    outputDisplay: $('#outputDisplay'),
    diffToggle: $('#diffToggle'),
    annoToggle: $('#annoToggle'),
    diffContainer: $('#diffContainer'),
    historyList: $('#historyList'),
    detailPanel: $('#detailPanel'),
    exportTextBtn: $('#exportTextBtn'),
    exportJsonBtn: $('#exportJsonBtn'),
    exportBookmarkBtn: $('#exportBookmarkBtn'),
    crtToggle: $('#crtToggle').querySelector('input'),
};

// ═══════════════════════════════════════════
//  Input Parsing
// ═══════════════════════════════════════════

function parseInput(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // JSON配列を試みる
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(item => {
                    if (typeof item === 'string') return item;
                    if (item && typeof item.text === 'string') return item.text;
                    return String(item);
                });
            }
        } catch (e) { /* not JSON */ }
    }

    // プレーンテキスト（1行1エントリ）
    return trimmed.split('\n').filter(line => line.trim());
}

function detectInputFormat(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return '📄 テキスト未入力';
    if (trimmed.startsWith('[')) {
        try {
            JSON.parse(trimmed);
            return '📋 JSON配列モード';
        } catch (e) { /* not JSON */ }
    }
    const lines = trimmed.split('\n').filter(l => l.trim());
    return `📄 プレーンテキスト（${lines.length}エントリ）`;
}

// ═══════════════════════════════════════════
//  Destruction Slider
// ═══════════════════════════════════════════

function updateDestructionDisplay() {
    const d = state.destructionLevel;
    const label = getDestructionLabel(d);
    dom.destructionValue.textContent = d.toFixed(2);
    dom.destructionValue.style.color = label.color;
    dom.destructionName.textContent = label.name;
    dom.destructionName.style.background = label.color + '22';
    dom.destructionName.style.color = label.color;

    // スライダーのグラデーション
    const pct = d * 100;
    dom.destructionSlider.style.background =
        `linear-gradient(90deg, ${label.color} 0%, ${label.color} ${pct}%, var(--border) ${pct}%)`;
}

// ═══════════════════════════════════════════
//  Detail Panel (個別モードUI)
// ═══════════════════════════════════════════

function buildDetailPanel() {
    const autoModes = getAutoConfig(state.destructionLevel);
    const panel = dom.detailPanel;
    panel.innerHTML = '';

    const allModeIds = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'T1', 'T2'];

    for (const modeId of allModeIds) {
        const meta = MODE_META[modeId];
        const autoMode = autoModes.find(m => m.id === modeId);
        // 詳細モードの手動設定があればそちらを使用
        const currentMode = state.detailModes
            ? state.detailModes.find(m => m.id === modeId) || { id: modeId, enabled: false, probability: 0, params: {} }
            : autoMode || { id: modeId, enabled: false, probability: 0, params: {} };

        const card = document.createElement('div');
        card.className = `mode-card ${currentMode.enabled ? 'enabled' : ''}`;
        card.dataset.modeId = modeId;

        // Header
        const header = document.createElement('div');
        header.className = 'mode-card-header';
        header.innerHTML = `
      <div class="mode-card-name">
        <span class="mode-card-icon">${meta.icon}</span>
        <span>${meta.nickname}</span>
        <span class="mode-card-id">${modeId}</span>
      </div>
    `;

        // Toggle
        const toggle = document.createElement('label');
        toggle.className = 'toggle-switch mode-card-toggle';
        toggle.innerHTML = `
      <input type="checkbox" data-mode-id="${modeId}" ${currentMode.enabled ? 'checked' : ''}>
      <span class="toggle-track"></span>
    `;
        header.appendChild(toggle);
        card.appendChild(header);

        // Probability slider
        const probRow = document.createElement('div');
        probRow.className = 'mode-param-row';
        probRow.innerHTML = `
      <span class="mode-param-label">適用確率</span>
      <input type="range" class="mode-prob-slider" min="0" max="100" value="${Math.round((currentMode.probability || 0) * 100)}" data-mode-id="${modeId}" data-param="probability">
      <span class="mode-prob-value">${Math.round((currentMode.probability || 0) * 100)}%</span>
    `;
        card.appendChild(probRow);

        // Mode-specific params
        const paramsContainer = document.createElement('div');
        paramsContainer.className = 'mode-params';
        buildModeParams(paramsContainer, modeId, currentMode.params || {});
        card.appendChild(paramsContainer);

        panel.appendChild(card);
    }

    // Event listeners for detail panel
    panel.querySelectorAll('input[type="checkbox"][data-mode-id]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            ensureDetailModes();
            const mId = e.target.dataset.modeId;
            const mode = state.detailModes.find(m => m.id === mId);
            if (mode) mode.enabled = e.target.checked;
            e.target.closest('.mode-card').classList.toggle('enabled', e.target.checked);
        });
    });

    panel.querySelectorAll('.mode-prob-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            ensureDetailModes();
            const mId = e.target.dataset.modeId;
            const value = parseInt(e.target.value) / 100;
            const mode = state.detailModes.find(m => m.id === mId);
            if (mode) mode.probability = value;
            e.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
        });
    });

    panel.querySelectorAll('.mode-param-input, .mode-param-select').forEach(input => {
        input.addEventListener('change', (e) => {
            ensureDetailModes();
            const mId = e.target.dataset.modeId;
            const key = e.target.dataset.paramKey;
            const mode = state.detailModes.find(m => m.id === mId);
            if (mode && mode.params) {
                let val = e.target.value;
                // 数値の場合はパース
                if (!isNaN(val) && val !== '' && val !== 'random' && val !== 'auto' &&
                    val !== 'truncate' && val !== 'overflow' && val !== 'both' &&
                    val !== 'repeat' && val !== 'skip' && val !== 'terminate' &&
                    val !== 'newline' && val !== 'name_insert' && val !== 'wait' &&
                    val !== 'music' && val !== 'sprite' && val !== 'all' &&
                    val !== 'hiragana' && val !== 'katakana' && val !== 'kanji' &&
                    val !== 'random_entry' && val !== 'random_position' &&
                    val !== 'graphic_sim' && val !== 'music_sim') {
                    val = parseFloat(val);
                }
                mode.params[key] = val;
            }
        });
    });
}

function buildModeParams(container, modeId, params) {
    const paramDefs = getModeParamDefs(modeId);
    for (const def of paramDefs) {
        const row = document.createElement('div');
        row.className = 'mode-param-row';
        const currentVal = params[def.key] != null ? params[def.key] : def.default;

        if (def.type === 'select') {
            row.innerHTML = `
        <span class="mode-param-label">${def.label}</span>
        <select class="mode-param-select" data-mode-id="${modeId}" data-param-key="${def.key}">
          ${def.options.map(o => `<option value="${o}" ${currentVal == o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      `;
        } else if (def.type === 'number') {
            row.innerHTML = `
        <span class="mode-param-label">${def.label}</span>
        <input type="number" class="mode-param-input" data-mode-id="${modeId}" data-param-key="${def.key}" value="${currentVal}" min="${def.min || ''}" max="${def.max || ''}" step="${def.step || 1}">
      `;
        } else if (def.type === 'text') {
            row.innerHTML = `
        <span class="mode-param-label">${def.label}</span>
        <input type="text" class="mode-param-input" data-mode-id="${modeId}" data-param-key="${def.key}" value="${currentVal}">
      `;
        }
        container.appendChild(row);
    }
}

function getModeParamDefs(modeId) {
    const defs = {
        A1: [
            { key: 'offset', label: 'オフセット', type: 'number', default: 3, min: -20, max: 20 },
            { key: 'target', label: '対象', type: 'select', default: 'random', options: ['random', 'all'] },
        ],
        A2: [
            { key: 'corruption_value', label: '書換値', type: 'select', default: 'random', options: ['random', '0', '32', '64', '128', '255'] },
        ],
        A3: [
            { key: 'read_length', label: '読取長', type: 'number', default: 15, min: 1, max: 50 },
            { key: 'dummy_source', label: 'ダミー種別', type: 'select', default: 'random', options: ['random', 'graphic_sim', 'music_sim'] },
        ],
        B1: [
            { key: 'previous_entry', label: '残像元', type: 'select', default: 'random', options: ['random'] },
            { key: 'overwrite_length', label: '上書長', type: 'select', default: 'auto', options: ['auto', '3', '5', '8', '12'] },
        ],
        B2: [
            { key: 'direction', label: '方向', type: 'select', default: 'truncate', options: ['truncate', 'overflow'] },
            { key: 'size_delta', label: 'ずれ量', type: 'number', default: 5, min: 1, max: 30 },
        ],
        B3: [
            { key: 'jump_position', label: 'ジャンプ位置', type: 'select', default: 'random', options: ['random', '1', '3', '5', '8'] },
            { key: 'jump_destination', label: 'ジャンプ先', type: 'select', default: 'random_entry', options: ['random_entry', 'random_position'] },
        ],
        C1: [
            { key: 'trigger_chars', label: 'トリガー', type: 'select', default: 'random', options: ['random', 'の', '。', 'は', 'が', 'を'] },
            { key: 'control_type', label: '制御種別', type: 'select', default: 'terminate', options: ['terminate', 'newline', 'name_insert', 'wait'] },
            { key: 'player_name', label: 'プレイヤー名', type: 'text', default: 'プレイヤー' },
        ],
        C2: [
            { key: 'replacement_char', label: '置換文字', type: 'select', default: 'random', options: ['random', '？', '・', '＿'] },
            { key: 'max_concat', label: '最大連結数', type: 'number', default: 3, min: 1, max: 10 },
        ],
        C3: [
            { key: 'shift', label: 'シフト量', type: 'number', default: 2, min: -10, max: 10 },
            { key: 'scope', label: '対象', type: 'select', default: 'all', options: ['all', 'hiragana', 'katakana', 'kanji'] },
        ],
        T1: [
            { key: 'interrupt_source', label: 'ソース', type: 'select', default: 'random', options: ['random', 'music', 'sprite'] },
            { key: 'frequency', label: '頻度', type: 'number', default: 0.15, min: 0, max: 1, step: 0.05 },
            { key: 'burst_length', label: 'バースト長', type: 'number', default: 2, min: 1, max: 5 },
        ],
        T2: [
            { key: 'mode', label: 'モード', type: 'select', default: 'both', options: ['repeat', 'skip', 'both'] },
            { key: 'probability', label: '確率', type: 'number', default: 0.15, min: 0, max: 1, step: 0.05 },
            { key: 'max_repeat', label: '最大繰返', type: 'number', default: 3, min: 2, max: 8 },
        ],
    };
    return defs[modeId] || [];
}

function ensureDetailModes() {
    if (!state.detailModes) {
        state.detailModes = getAutoConfig(state.destructionLevel).map(m => ({ ...m, params: { ...m.params } }));
    }
}

// ═══════════════════════════════════════════
//  Generate
// ═══════════════════════════════════════════

function generateOnce() {
    const entries = parseInput(dom.textInput.value);
    if (entries.length === 0) return null;

    const seed = state.seed;
    const rng = new PRNG(seed);
    const dummySource = state.inputMode === 'detail' && state.detailModes
        ? (state.detailModes.find(m => m.id === 'A3')?.params?.dummy_source || 'random')
        : 'random';
    const customDummyData = dom.otherWorldInput.value;
    const memory = buildVirtualMemory(entries, rng, dummySource, customDummyData);

    // モード設定
    let modes;
    if (state.inputMode === 'detail' && state.detailModes) {
        modes = state.detailModes;
    } else {
        modes = getAutoConfig(state.destructionLevel);
    }

    const config = {
        destructionLevel: state.destructionLevel,
        seed: seed,
        modes: modes,
    };

    const glitchResult = applyGlitch(memory, config);

    // 結果テキストを結合
    const outputText = glitchResult.results.map(r => r.text).join('\n');
    const annotations = glitchResult.results.flatMap(r => r.annotations);

    return {
        id: state.historyIdCounter++,
        text: outputText,
        results: glitchResult.results,
        originalEntries: entries,
        seed: seed,
        destructionLevel: state.destructionLevel,
        modes: modes.filter(m => m.enabled).map(m => m.id),
        modeConfigs: modes,
        annotations: annotations,
        bookmarked: false,
        timestamp: Date.now(),
    };
}

function handleGenerate() {
    const result = generateOnce();
    if (!result) return;

    state.history.unshift(result);
    state.selectedHistoryId = result.id;

    // シードを自動インクリメント（次回生成用）
    state.seed++;
    dom.seedInput.value = state.seed;

    displayResult(result);
    renderHistory();
}

function handleBatchGenerate() {
    const count = parseInt(dom.batchCount.value);
    document.body.classList.add('generating');

    // 非同期でバッチ生成
    setTimeout(() => {
        for (let i = 0; i < count; i++) {
            const result = generateOnce();
            if (!result) break;
            state.history.unshift(result);
            state.seed++;
        }
        dom.seedInput.value = state.seed;

        if (state.history.length > 0) {
            state.selectedHistoryId = state.history[0].id;
            displayResult(state.history[0]);
        }
        renderHistory();
        document.body.classList.remove('generating');
    }, 50);
}

// ═══════════════════════════════════════════
//  Display
// ═══════════════════════════════════════════

function displayResult(result) {
    const display = dom.outputDisplay;

    if (state.showAnnotations) {
        displayWithAnnotations(result);
    } else {
        display.textContent = result.text;
        const cursor = document.createElement('span');
        cursor.className = 'cursor-blink';
        display.appendChild(cursor);
    }

    if (state.showDiff) {
        displayDiff(result);
        dom.diffContainer.classList.add('visible');
    } else {
        dom.diffContainer.classList.remove('visible');
    }
}

function displayWithAnnotations(result) {
    const display = dom.outputDisplay;
    display.innerHTML = '';

    for (const r of result.results) {
        // テキスト全体にモード注釈をつける
        const appliedModes = r.annotations
            .filter(a => a.mode && a.mode !== 'original')
            .map(a => a.mode || a.detail);

        if (appliedModes.length > 0) {
            const span = document.createElement('span');
            span.className = 'annotation-highlight';
            span.dataset.mode = appliedModes[appliedModes.length - 1]; // 最後に適用されたモードの色
            span.textContent = r.text;
            span.title = appliedModes.join(' → ');
            display.appendChild(span);
        } else {
            display.appendChild(document.createTextNode(r.text));
        }
        display.appendChild(document.createTextNode('\n'));
    }

    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    display.appendChild(cursor);
}

function displayDiff(result) {
    const container = dom.diffContainer;
    container.innerHTML = '';

    for (let i = 0; i < result.results.length; i++) {
        const original = result.originalEntries[i] || '';
        const modified = result.results[i].text;

        if (original === modified) {
            container.appendChild(document.createTextNode(original + '\n'));
            continue;
        }

        // 簡易 diff
        const origChars = [...original];
        const modChars = [...modified];
        const diffLine = document.createElement('div');
        diffLine.style.marginBottom = '0.3rem';

        // 元テキスト（削除）
        const delSpan = document.createElement('span');
        delSpan.className = 'diff-del';
        delSpan.textContent = original;
        diffLine.appendChild(delSpan);

        diffLine.appendChild(document.createTextNode(' → '));

        // 変換後テキスト（挿入）
        const insSpan = document.createElement('span');
        insSpan.className = 'diff-ins';
        insSpan.textContent = modified;
        diffLine.appendChild(insSpan);

        container.appendChild(diffLine);
    }
}

// ═══════════════════════════════════════════
//  History
// ═══════════════════════════════════════════

function renderHistory() {
    const list = dom.historyList;
    list.innerHTML = '';

    for (const item of state.history.slice(0, 200)) {
        const el = document.createElement('div');
        el.className = `history-item ${item.id === state.selectedHistoryId ? 'selected' : ''}`;

        const bookmark = document.createElement('span');
        bookmark.className = 'history-bookmark';
        bookmark.textContent = item.bookmarked ? '★' : '☆';
        bookmark.addEventListener('click', (e) => {
            e.stopPropagation();
            item.bookmarked = !item.bookmarked;
            bookmark.textContent = item.bookmarked ? '★' : '☆';
        });

        const text = document.createElement('span');
        text.className = 'history-text';
        text.textContent = item.text.replace(/\n/g, ' ');

        const meta = document.createElement('span');
        meta.className = 'history-meta';
        meta.textContent = `d:${item.destructionLevel.toFixed(2)} s:${item.seed}`;

        el.appendChild(bookmark);
        el.appendChild(text);
        el.appendChild(meta);

        el.addEventListener('click', () => {
            state.selectedHistoryId = item.id;
            displayResult(item);
            renderHistory();
        });

        list.appendChild(el);
    }
}

// ═══════════════════════════════════════════
//  Export
// ═══════════════════════════════════════════

function exportData(format, bookmarkOnly) {
    let items = bookmarkOnly
        ? state.history.filter(h => h.bookmarked)
        : state.history;

    if (items.length === 0) {
        alert('エクスポートするデータがありません。');
        return;
    }

    let content, filename, mime;

    if (format === 'text') {
        content = items.map(item => item.text).join('\n---\n');
        filename = 'glitchpoet_output.txt';
        mime = 'text/plain';
    } else {
        const exportData = items.map(item => ({
            input_mode: 'textdb',
            seed: item.seed,
            destruction_level: item.destructionLevel,
            active_modes: item.modes,
            mode_params: Object.fromEntries(
                (item.modeConfigs || []).filter(m => m.enabled).map(m => [m.id, m.params])
            ),
            output: item.text,
            annotations: item.annotations,
        }));
        content = JSON.stringify(exportData, null, 2);
        filename = 'glitchpoet_output.json';
        mime = 'application/json';
    }

    // ダウンロード
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════
//  Event Listeners
// ═══════════════════════════════════════════

function initEventListeners() {
    // テキスト入力 — フォーマット検出
    dom.textInput.addEventListener('input', () => {
        const fmt = detectInputFormat(dom.textInput.value);
        dom.inputModeIndicator.textContent = fmt;
        dom.inputModeIndicator.classList.toggle('detected', dom.textInput.value.trim().length > 0);
    });

    // ファイル読込
    dom.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            dom.textInput.value = reader.result;
            dom.textInput.dispatchEvent(new Event('input'));
        };
        reader.readAsText(file, 'UTF-8');
    });

    // モード切替
    dom.modeSimple.addEventListener('click', () => {
        state.inputMode = 'simple';
        state.detailModes = null;
        dom.modeSimple.classList.add('active');
        dom.modeDetail.classList.remove('active');
        dom.detailPanel.classList.remove('visible');
    });
    dom.modeDetail.addEventListener('click', () => {
        state.inputMode = 'detail';
        ensureDetailModes();
        dom.modeDetail.classList.add('active');
        dom.modeSimple.classList.remove('active');
        buildDetailPanel();
        dom.detailPanel.classList.add('visible');
    });

    // 破壊度スライダー
    dom.destructionSlider.addEventListener('input', () => {
        state.destructionLevel = parseInt(dom.destructionSlider.value) / 100;
        updateDestructionDisplay();
        // 簡易モードの場合、detailModesをリセット
        if (state.inputMode === 'simple') {
            state.detailModes = null;
        }
        // 詳細モードの場合、パネルを更新
        if (state.inputMode === 'detail') {
            state.detailModes = null;
            ensureDetailModes();
            buildDetailPanel();
        }
    });

    // シード
    dom.seedInput.addEventListener('change', () => {
        state.seed = parseInt(dom.seedInput.value) || 0;
    });
    dom.seedRandomBtn.addEventListener('click', () => {
        state.seed = Math.floor(Math.random() * 100000);
        dom.seedInput.value = state.seed;
    });

    // 生成
    dom.generateBtn.addEventListener('click', handleGenerate);
    dom.batchBtn.addEventListener('click', handleBatchGenerate);

    // Diff / 注釈トグル
    dom.diffToggle.addEventListener('click', () => {
        state.showDiff = !state.showDiff;
        dom.diffToggle.classList.toggle('active', state.showDiff);
        const sel = state.history.find(h => h.id === state.selectedHistoryId);
        if (sel) displayResult(sel);
    });
    dom.annoToggle.addEventListener('click', () => {
        state.showAnnotations = !state.showAnnotations;
        dom.annoToggle.classList.toggle('active', state.showAnnotations);
        const sel = state.history.find(h => h.id === state.selectedHistoryId);
        if (sel) displayResult(sel);
    });

    // CRT
    dom.crtToggle.addEventListener('change', () => {
        document.body.classList.toggle('crt-on', dom.crtToggle.checked);
    });

    // エクスポート
    dom.exportTextBtn.addEventListener('click', () => exportData('text', false));
    dom.exportJsonBtn.addEventListener('click', () => exportData('json', false));
    dom.exportBookmarkBtn.addEventListener('click', () => exportData('json', true));

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    });
}

// ═══════════════════════════════════════════
//  Init
// ═══════════════════════════════════════════

function init() {
    updateDestructionDisplay();
    initEventListeners();

    // 初期フォーマット検出
    dom.inputModeIndicator.textContent = detectInputFormat(dom.textInput.value);
    dom.inputModeIndicator.classList.add('detected');
}

document.addEventListener('DOMContentLoaded', init);
