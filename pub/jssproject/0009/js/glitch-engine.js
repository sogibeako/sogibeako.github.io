/**
 * GlitchPoet — グリッチエンジン
 * 全11故障モードの実装
 */

// ──── unicode ユーティリティ ────

const UNICODE_BLOCKS = {
    hiragana: [0x3040, 0x309F],
    katakana: [0x30A0, 0x30FF],
    kanji: [0x4E00, 0x9FFF],
    ascii: [0x0020, 0x007E],
    fullwidth: [0xFF01, 0xFF5E],
};

function isInBlock(cp, blockName) {
    const b = UNICODE_BLOCKS[blockName];
    return b && cp >= b[0] && cp <= b[1];
}

// ──── 割り込みソース文字生成 ────

function generateInterruptChar(source, rng) {
    if (source === 'music') {
        const chars = 'ドレミファソラシ♪♫♬♩0123456789アイウエオカキクケコ';
        return [...chars][rng.nextInt(0, [...chars].length - 1)].codePointAt(0);
    } else if (source === 'sprite') {
        const chars = '■□▲△▼▽◆◇○●★☆※†‡§¶♠♣♥♦';
        return [...chars][rng.nextInt(0, [...chars].length - 1)].codePointAt(0);
    }
    return rng.nextInt(0x0021, 0x9FFF);
}

// ──── MODE A1: ポインタオフセットずれ ────

function applyPointerOffset(memory, entryIndex, params, rng) {
    const offset = params.offset || rng.nextInt(-5, 5);
    const addr = memory.textTable[entryIndex] + offset;
    const clampedAddr = Math.max(0, Math.min(addr, memory.textData.length - 1));

    const codePoints = readFromAddress(memory, clampedAddr);
    return {
        text: codePointsToString(codePoints),
        annotation: { mode: 'A1', detail: 'pointer_offset', offset, originalEntry: entryIndex }
    };
}

// ──── MODE A2: 上位バイト破壊 ────

function applyHighByteCorruption(memory, entryIndex, params, rng) {
    const corruptionValue = params.corruption_value === 'random'
        ? rng.nextInt(0, 0xFF)
        : (params.corruption_value || rng.nextInt(0, 0xFF));

    // 仮想的に上位バイトを書き換えたアドレスに飛ぶ
    const originalAddr = memory.textTable[entryIndex];
    const lowByte = originalAddr & 0xFF;
    const newAddr = (corruptionValue << 8) | lowByte;
    const clampedAddr = newAddr % memory.textData.length;

    const codePoints = readFromAddress(memory, clampedAddr);
    return {
        text: codePointsToString(codePoints),
        annotation: { mode: 'A2', detail: 'high_byte_corruption', jumpTo: clampedAddr, originalEntry: entryIndex }
    };
}

// ──── MODE A3: バンク切り替え異常 ────

function applyBankSwitch(memory, entryIndex, params, rng) {
    const bankOffset = params.bank_offset || rng.nextInt(0, memory.dummyRegion.length - 1);
    const readLength = params.read_length || rng.nextInt(5, 30);

    const codePoints = readFromDummyRegion(memory, bankOffset, readLength);
    return {
        text: codePointsToString(codePoints),
        annotation: { mode: 'A3', detail: 'bank_switch', bankOffset, originalEntry: entryIndex }
    };
}

// ──── MODE B1: バッファ未クリア（残像） ────

function applyBufferRemnant(memory, entryIndex, params, rng) {
    const totalEntries = memory.entries.length;
    let prevIndex = params.previous_entry === 'random'
        ? rng.nextInt(0, totalEntries - 1)
        : (params.previous_entry != null ? params.previous_entry : rng.nextInt(0, totalEntries - 1));

    if (prevIndex === entryIndex && totalEntries > 1) {
        prevIndex = (prevIndex + 1) % totalEntries;
    }

    const currentText = stringToCodePoints(memory.entries[entryIndex]);
    const previousText = stringToCodePoints(memory.entries[prevIndex]);

    const overwriteLen = params.overwrite_length === 'auto'
        ? currentText.length
        : (params.overwrite_length || currentText.length);

    // バッファに前テキストがあり、その上に現テキストが部分上書き
    const buffer = [...previousText];
    for (let i = 0; i < Math.min(overwriteLen, currentText.length); i++) {
        if (i < buffer.length) {
            buffer[i] = currentText[i];
        } else {
            buffer.push(currentText[i]);
        }
    }

    return {
        text: codePointsToString(buffer),
        annotation: { mode: 'B1', detail: 'buffer_remnant', previousEntry: prevIndex, overwriteLen, originalEntry: entryIndex }
    };
}

// ──── MODE B2: DMA転送量異常 ────

function applyDMAError(memory, entryIndex, params, rng) {
    const direction = params.direction || rng.pick(['truncate', 'overflow']);
    const sizeDelta = params.size_delta || rng.nextInt(1, 10);

    const currentText = stringToCodePoints(memory.entries[entryIndex]);
    let result;

    if (direction === 'truncate') {
        const cutLen = Math.max(1, currentText.length - sizeDelta);
        result = currentText.slice(0, cutLen);
        return {
            text: codePointsToString(result),
            annotation: { mode: 'B2', detail: 'dma_truncate', cutLen, originalEntry: entryIndex }
        };
    } else {
        // overflow: テキスト末尾を超えて次のデータを読む
        const boundary = memory.entryBoundaries[entryIndex];
        const overflowStart = boundary.end + 1; // 終端コードの次
        const overflowData = [];
        for (let i = 0; i < sizeDelta; i++) {
            const pos = overflowStart + i;
            if (pos < memory.textData.length) {
                if (memory.textData[pos] === 0) {
                    overflowData.push(0x25A0); // ■ で終端をビジュアル化
                } else {
                    overflowData.push(memory.textData[pos]);
                }
            } else {
                // テキスト領域を超えたらダミー領域から
                const dummyPos = (pos - memory.textData.length) % memory.dummyRegion.length;
                overflowData.push(memory.dummyRegion[dummyPos]);
            }
        }
        result = [...currentText, ...overflowData];
        return {
            text: codePointsToString(result),
            annotation: { mode: 'B2', detail: 'dma_overflow', extraChars: sizeDelta, originalEntry: entryIndex }
        };
    }
}

// ──── MODE B3: スタック汚染 ────

function applyStackCorruption(memory, entryIndex, params, rng) {
    const currentText = stringToCodePoints(memory.entries[entryIndex]);
    const jumpPos = params.jump_position === 'random'
        ? rng.nextInt(1, Math.max(1, currentText.length - 1))
        : (params.jump_position || rng.nextInt(1, Math.max(1, currentText.length - 1)));

    let jumpedText;
    if (params.jump_destination === 'random_entry') {
        const destEntry = rng.nextInt(0, memory.entries.length - 1);
        const destText = stringToCodePoints(memory.entries[destEntry]);
        const destOffset = rng.nextInt(0, Math.max(0, destText.length - 1));
        jumpedText = destText.slice(destOffset);
    } else if (params.jump_destination === 'random_position') {
        const randomAddr = rng.nextInt(0, memory.textData.length - 1);
        jumpedText = readFromAddress(memory, randomAddr);
    } else {
        const destEntry = rng.nextInt(0, memory.entries.length - 1);
        const destText = stringToCodePoints(memory.entries[destEntry]);
        const destOffset = rng.nextInt(0, Math.max(0, destText.length - 1));
        jumpedText = destText.slice(destOffset);
    }

    const firstHalf = currentText.slice(0, jumpPos);
    const combined = [...firstHalf, ...jumpedText];

    return {
        text: codePointsToString(combined),
        annotation: { mode: 'B3', detail: 'stack_corruption', jumpPos, originalEntry: entryIndex }
    };
}

// ──── MODE C1: 制御コード誤認 ────

function applyControlCodeMisread(memory, entryIndex, params, rng) {
    const text = memory.entries[entryIndex];
    const triggerChars = params.trigger_chars === 'random'
        ? [rng.pick([...'のはがをでにもとたりれいうえおかきくけこ。、！？'])]
        : (params.trigger_chars || ['の', '。']);

    const controlType = params.control_type || 'terminate';
    const playerName = params.player_name || 'プレイヤー';

    let result = '';
    const chars = [...text];

    for (let i = 0; i < chars.length; i++) {
        if (triggerChars.includes(chars[i])) {
            if (controlType === 'terminate') {
                break;
            } else if (controlType === 'newline') {
                result += '\n';
            } else if (controlType === 'name_insert') {
                result += playerName;
            } else if (controlType === 'wait') {
                result += '▼';
            }
        } else {
            result += chars[i];
        }
    }

    return {
        text: result,
        annotation: { mode: 'C1', detail: 'control_code_misread', triggerChars, controlType, originalEntry: entryIndex }
    };
}

// ──── MODE C2: 制御コード消失 ────

function applyControlCodeLoss(memory, entryIndex, params, rng) {
    const replacementChar = params.replacement_char === 'random'
        ? String.fromCodePoint(rng.nextInt(0x3040, 0x309F))
        : (params.replacement_char || '？');

    // 終端コードが消失 → 次のエントリと連結
    let result = memory.entries[entryIndex];
    const maxConcat = params.max_concat || 3;

    for (let i = 1; i <= maxConcat; i++) {
        const nextIdx = entryIndex + i;
        if (nextIdx >= memory.entries.length) break;
        result += replacementChar + memory.entries[nextIdx];
    }

    return {
        text: result,
        annotation: { mode: 'C2', detail: 'control_code_loss', concatenated: Math.min(maxConcat, memory.entries.length - entryIndex - 1), originalEntry: entryIndex }
    };
}

// ──── MODE C3: 文字テーブルずれ ────

function applyCharTableShift(memory, entryIndex, params, rng) {
    const shift = params.shift || rng.nextInt(-3, 3);
    const scope = params.scope || 'all';

    const codePoints = stringToCodePoints(memory.entries[entryIndex]);
    const shifted = codePoints.map(cp => {
        if (scope === 'all') {
            return cp + shift;
        }
        if (scope === 'hiragana' && isInBlock(cp, 'hiragana')) return cp + shift;
        if (scope === 'katakana' && isInBlock(cp, 'katakana')) return cp + shift;
        if (scope === 'kanji' && isInBlock(cp, 'kanji')) return cp + shift;
        return cp;
    }).map(cp => Math.max(0x0020, cp)); // 制御文字を回避

    return {
        text: codePointsToString(shifted),
        annotation: { mode: 'C3', detail: 'char_table_shift', shift, scope, originalEntry: entryIndex }
    };
}

// ──── MODE T1: 割り込み競合 ────

function applyInterruptConflict(memory, entryIndex, params, rng) {
    const interruptSource = params.interrupt_source || 'random';
    const frequency = params.frequency != null ? params.frequency : 0.15;
    const burstLength = params.burst_length || rng.nextInt(1, 3);

    const chars = [...memory.entries[entryIndex]];
    const result = [];

    for (let i = 0; i < chars.length; i++) {
        if (rng.chance(frequency)) {
            // 割り込み発生 — バースト分の外来文字を挿入
            for (let b = 0; b < burstLength; b++) {
                result.push(String.fromCodePoint(generateInterruptChar(interruptSource, rng)));
            }
        } else {
            result.push(chars[i]);
        }
    }

    return {
        text: result.join(''),
        annotation: { mode: 'T1', detail: 'interrupt_conflict', source: interruptSource, originalEntry: entryIndex }
    };
}

// ──── MODE T2: フレーム同期ずれ ────

function applyFrameSyncError(memory, entryIndex, params, rng) {
    const mode = params.mode || 'both';
    const probability = params.probability != null ? params.probability : 0.15;
    const maxRepeat = params.max_repeat || 3;

    const chars = [...memory.entries[entryIndex]];
    const result = [];

    for (let i = 0; i < chars.length; i++) {
        if (rng.chance(probability)) {
            if (mode === 'repeat' || (mode === 'both' && rng.chance(0.5))) {
                const repeatCount = rng.nextInt(2, maxRepeat);
                for (let r = 0; r < repeatCount; r++) {
                    result.push(chars[i]);
                }
            } else {
                // skip — 文字を飛ばす
                continue;
            }
        } else {
            result.push(chars[i]);
        }
    }

    return {
        text: result.join(''),
        annotation: { mode: 'T2', detail: 'frame_sync_error', syncMode: mode, originalEntry: entryIndex }
    };
}

// ──── モード関数マップ ────

const MODE_FUNCTIONS = {
    A1: applyPointerOffset,
    A2: applyHighByteCorruption,
    A3: applyBankSwitch,
    B1: applyBufferRemnant,
    B2: applyDMAError,
    B3: applyStackCorruption,
    C1: applyControlCodeMisread,
    C2: applyControlCodeLoss,
    C3: applyCharTableShift,
    T1: applyInterruptConflict,
    T2: applyFrameSyncError,
};

// ──── メインエンジン ────

/**
 * グリッチを適用
 * @param {object} memory - buildVirtualMemory の結果
 * @param {object} config - { destructionLevel, seed, modes: [{id, enabled, probability, params}] }
 * @returns {{ results: GlitchResult[] }}
 */
function applyGlitch(memory, config) {
    const rng = new PRNG(config.seed);
    const results = [];

    for (let i = 0; i < memory.entries.length; i++) {
        let currentResult = {
            text: memory.entries[i],
            annotations: [{ start: 0, end: memory.entries[i].length, mode: 'original', source_entry: i }]
        };

        // 有効なモードをチェイン適用
        const activeModes = config.modes.filter(m => m.enabled);

        for (const modeConfig of activeModes) {
            // 適用確率チェック
            const prob = modeConfig.probability != null ? modeConfig.probability : 1.0;
            if (!rng.chance(prob)) continue;

            const fn = MODE_FUNCTIONS[modeConfig.id];
            if (!fn) continue;

            // モードにコンテキストとして一時的に現テキストを設定
            const tempMemory = {
                ...memory,
                entries: [...memory.entries],
            };
            tempMemory.entries[i] = currentResult.text;

            // エントリの境界情報も更新
            const tempBoundaries = [...memory.entryBoundaries];
            if (tempBoundaries[i]) {
                tempBoundaries[i] = {
                    start: tempBoundaries[i].start,
                    end: tempBoundaries[i].start + stringToCodePoints(currentResult.text).length
                };
            }
            tempMemory.entryBoundaries = tempBoundaries;

            const result = fn(tempMemory, i, modeConfig.params || {}, rng);
            currentResult.text = result.text;
            currentResult.annotations.push(result.annotation);
        }

        results.push(currentResult);
    }

    return { results };
}
