/**
 * GlitchPoet — 仮想メモリシステム
 * テキストエントリを仮想メモリ空間に配置し、故障モードの物理的操作基盤を提供
 */

/**
 * 文字列をサロゲートペア対応のコードポイント配列に変換
 */
function stringToCodePoints(str) {
    const points = [];
    for (const ch of str) {
        points.push(ch.codePointAt(0));
    }
    return points;
}

/**
 * コードポイント配列を文字列に変換
 */
function codePointsToString(points) {
    return points.map(cp => String.fromCodePoint(cp)).join('');
}

/**
 * ダミー領域を生成
 * @param {number} size - バイト数
 * @param {string} source - "random" | "graphic_sim" | "music_sim"
 * @param {PRNG} rng
 */
function generateDummyRegion(size, source, rng) {
    const data = new Array(size);

    if (source === 'graphic_sim') {
        // グラフィック模倣: CJK統合漢字を中心に
        const ranges = [
            [0x4E00, 0x9FFF],  // CJK統合漢字
            [0x2500, 0x257F],  // 罫線素片
            [0x2580, 0x259F],  // ブロック要素
            [0x25A0, 0x25FF],  // 幾何学模様
        ];
        for (let i = 0; i < size; i++) {
            const range = rng.pick(ranges);
            data[i] = rng.nextInt(range[0], range[1]);
        }
    } else if (source === 'music_sim') {
        // 音楽データ模倣: カタカナ・記号・数字
        const ranges = [
            [0x30A0, 0x30FF],  // カタカナ
            [0x0030, 0x0039],  // 数字
            [0x2190, 0x21FF],  // 矢印
            [0x266A, 0x266F],  // 音符記号
            [0x0021, 0x002F],  // 記号
        ];
        for (let i = 0; i < size; i++) {
            const range = rng.pick(ranges);
            data[i] = rng.nextInt(range[0], range[1]);
        }
    } else {
        // ランダム
        for (let i = 0; i < size; i++) {
            data[i] = rng.nextInt(0x0021, 0x9FFF);
        }
    }

    return data;
}

/**
 * 入力テキスト群から仮想メモリを構築
 * @param {string[]} entries - テキストエントリ配列
 * @param {PRNG} rng
 * @param {string} dummySource - ダミー領域の生成方式
 * @param {string} customData - カスタムダミーデータ（あればこれを優先）
 * @returns {VirtualMemory}
 */
function buildVirtualMemory(entries, rng, dummySource = 'random', customData = null) {
    const TERMINATOR = 0x0000;

    // テキストデータを連続配置
    const textDataArray = [];
    const textTable = [];
    const entryBoundaries = []; // 各エントリの [start, end] を記録

    for (const entry of entries) {
        const startAddr = textDataArray.length;
        textTable.push(startAddr);

        const codePoints = stringToCodePoints(entry);
        for (const cp of codePoints) {
            textDataArray.push(cp);
        }
        const endAddr = textDataArray.length;
        textDataArray.push(TERMINATOR); // 終端コード

        entryBoundaries.push({ start: startAddr, end: endAddr });
    }

    // ダミー領域生成（テキスト領域と同程度のサイズ）
    const dummySize = Math.max(256, textDataArray.length);
    let dummyRegion;

    if (customData && customData.trim().length > 0) {
        // カスタムデータを使用
        dummyRegion = stringToCodePoints(customData.trim());
        // サイズが足りない場合は繰り返す
        if (dummyRegion.length < dummySize) {
            const originalLen = dummyRegion.length;
            while (dummyRegion.length < dummySize) {
                for (let i = 0; i < originalLen; i++) {
                    dummyRegion.push(dummyRegion[i]);
                    if (dummyRegion.length >= dummySize) break;
                }
            }
        }
    } else {
        // 従来の生成ロジック
        dummyRegion = generateDummyRegion(dummySize, dummySource, rng);
    }

    return {
        textTable,        // 各エントリの開始アドレス
        textData: textDataArray,  // テキストデータ（コードポイント配列）
        dummyRegion,      // ダミーデータ
        entries,          // 元テキスト配列
        entryBoundaries,  // 各エントリの境界情報
        terminator: TERMINATOR,
    };
}

/**
 * 仮想メモリの特定アドレスからテキストを読み取る
 * 終端コードまたはデータ末尾まで
 * @param {object} memory
 * @param {number} address - 読み取り開始アドレス
 * @param {number} maxLength - 最大読み取り文字数
 * @returns {number[]} コードポイント配列
 */
function readFromAddress(memory, address, maxLength = 200) {
    const result = [];
    for (let i = 0; i < maxLength; i++) {
        const pos = address + i;
        if (pos < 0 || pos >= memory.textData.length) break;
        const cp = memory.textData[pos];
        if (cp === memory.terminator) break;
        result.push(cp);
    }
    return result;
}

/**
 * ダミー領域からテキストを読み取る
 */
function readFromDummyRegion(memory, offset, length) {
    const result = [];
    for (let i = 0; i < length; i++) {
        const pos = (offset + i) % memory.dummyRegion.length;
        result.push(memory.dummyRegion[pos]);
    }
    return result;
}
