/**
 * GlitchPoet — 破壊度→モード自動設定
 * 破壊度 0.0–1.0 に応じて各モードの有効/無効・確率・パラメータを自動設定
 */

const MODE_META = {
    A1: { name: 'ポインタオフセットずれ', icon: '🔀', nickname: 'ずれ読み', category: 'address' },
    A2: { name: '上位バイト破壊', icon: '💥', nickname: '大幅ジャンプ', category: 'address' },
    A3: { name: 'バンク切り替え異常', icon: '🌀', nickname: '異世界参照', category: 'address' },
    B1: { name: 'バッファ未クリア', icon: '👻', nickname: '残像', category: 'buffer' },
    B2: { name: 'DMA転送量異常', icon: '✂️', nickname: '長さ異常', category: 'buffer' },
    B3: { name: 'スタック汚染', icon: '🦘', nickname: '途中ワープ', category: 'buffer' },
    C1: { name: '制御コード誤認', icon: '🚫', nickname: '文字化け（制御）', category: 'charcode' },
    C2: { name: '制御コード消失', icon: '🔗', nickname: '止まらない', category: 'charcode' },
    C3: { name: '文字テーブルずれ', icon: '🔄', nickname: '文字シフト', category: 'charcode' },
    T1: { name: '割り込み競合', icon: '⚡', nickname: 'ノイズ混入', category: 'timing' },
    T2: { name: 'フレーム同期ずれ', icon: '🔁', nickname: 'タイミング異常', category: 'timing' },
};

/**
 * 破壊度からモード設定を自動生成
 * 各モードの probability (適用確率) と intensity (強度) を算出
 */
function getAutoConfig(d) {
    const modes = [];

    // ─── d = 0.0–0.2: A1(弱), C3(弱), T2(弱) ───
    modes.push({
        id: 'A1', enabled: d >= 0.0,
        probability: clamp(d * 2, 0.05, 0.6),
        params: { offset: Math.round(lerp(1, 8, d)), target: 'random' }
    });
    modes.push({
        id: 'C3', enabled: d >= 0.05,
        probability: clamp(d * 1.5, 0.05, 0.5),
        params: { shift: Math.round(lerp(1, 5, d)), scope: 'all' }
    });
    modes.push({
        id: 'T2', enabled: d >= 0.05,
        probability: clamp(d * 1.5, 0.05, 0.5),
        params: { mode: 'both', probability: clamp(d * 0.5, 0.05, 0.4), max_repeat: Math.round(lerp(2, 5, d)) }
    });

    // ─── d = 0.2–0.5: + B1, C1, B2(truncateのみ) ───
    modes.push({
        id: 'B1', enabled: d >= 0.2,
        probability: clamp((d - 0.2) * 2, 0.1, 0.7),
        params: { previous_entry: 'random', overwrite_length: 'auto' }
    });
    modes.push({
        id: 'C1', enabled: d >= 0.2,
        probability: clamp((d - 0.2) * 2, 0.1, 0.6),
        params: { trigger_chars: 'random', control_type: d < 0.5 ? 'terminate' : (d < 0.7 ? 'name_insert' : 'wait') }
    });
    modes.push({
        id: 'B2', enabled: d >= 0.2,
        probability: clamp((d - 0.2) * 1.5, 0.1, 0.6),
        params: { direction: d < 0.5 ? 'truncate' : (d < 0.7 ? 'overflow' : 'overflow'), size_delta: Math.round(lerp(2, 15, d)) }
    });

    // ─── d = 0.5–0.7: + B3, A2, C2 ───
    modes.push({
        id: 'B3', enabled: d >= 0.5,
        probability: clamp((d - 0.5) * 3, 0.1, 0.7),
        params: { jump_position: 'random', jump_destination: 'random_entry' }
    });
    modes.push({
        id: 'A2', enabled: d >= 0.5,
        probability: clamp((d - 0.5) * 2.5, 0.1, 0.6),
        params: { corruption_value: 'random' }
    });
    modes.push({
        id: 'C2', enabled: d >= 0.5,
        probability: clamp((d - 0.5) * 2, 0.1, 0.5),
        params: { replacement_char: 'random', max_concat: Math.round(lerp(1, 5, d)) }
    });

    // ─── d = 0.7–0.9: + A3, T1 ───
    modes.push({
        id: 'A3', enabled: d >= 0.7,
        probability: clamp((d - 0.7) * 4, 0.1, 0.8),
        params: { bank_offset: 0, read_length: Math.round(lerp(5, 30, d)), dummy_source: d > 0.85 ? 'graphic_sim' : 'music_sim' }
    });
    modes.push({
        id: 'T1', enabled: d >= 0.7,
        probability: clamp((d - 0.7) * 3, 0.1, 0.7),
        params: { interrupt_source: 'random', frequency: clamp(d * 0.4, 0.05, 0.4), burst_length: Math.round(lerp(1, 4, d)) }
    });

    return modes;
}

/**
 * 破壊度ラベルを取得
 */
function getDestructionLabel(d) {
    if (d < 0.2) return { name: '微損', color: '#7ec8e3' };
    if (d < 0.5) return { name: '詩的', color: '#a78bfa' };
    if (d < 0.7) return { name: '混沌', color: '#f59e0b' };
    if (d < 0.9) return { name: '崩壊', color: '#ef4444' };
    return { name: '完全破壊', color: '#dc2626' };
}

// ─── ユーティリティ ───

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}
