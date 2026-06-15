/**
 * Speed Curve Table — レベル区間ごとの速度パラメータ
 *
 * シート形式で簡単に編集できます。
 * 各行は { level, gravity, are, lineClear, das, riseRate, maxPoly } の形式です。
 *
 * level:     この設定が適用される開始レベル
 * gravity:   1フレームあたりの落下行数 (例: 0.05 = 20フレームで1行, 1.0 = 毎フレーム1行, 20.0 = 即落下)
 * are:       固定後、次のミノが現れるまでのフレーム数 (1/60秒単位)
 * lineClear: ライン消去後、次のミノが現れるまでのフレーム数 (1/60秒単位)
 * das:       DASが効き始めるまでのフレーム数 (1/60秒単位)
 * riseRate:  せりあがり間隔 (何ツモごとに1行せりあがるか, 0 = せりあがりなし) ※ Mode B用
 * maxPoly:   最大ポリオミノサイズ (4=テトロミノのみ, 5=+ペントミノ, 6=+ヘキソミノ, 7=+ヘプトミノ) ※ Mode C用
 *
 * ※ levelの低い順に記述してください
 * ※ 現在のレベル以下で最も近い行が使われます
 */

//                      level  gravity   are  lineClear  das  riseRate  maxPoly
const SPEED_TABLE = [
    { level: 0, gravity: 0.015, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 30, gravity: 0.023, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 35, gravity: 0.031, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 40, gravity: 0.039, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 50, gravity: 0.047, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 60, gravity: 0.062, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 70, gravity: 0.125, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 80, gravity: 0.188, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 90, gravity: 0.250, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 100, gravity: 0.310, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 120, gravity: 0.375, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 140, gravity: 0.437, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 160, gravity: 0.500, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 170, gravity: 0.562, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 200, gravity: 0.015, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 220, gravity: 0.125, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 230, gravity: 0.250, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 233, gravity: 0.375, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 236, gravity: 0.500, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 239, gravity: 0.625, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 243, gravity: 0.750, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 247, gravity: 0.875, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 251, gravity: 1.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 300, gravity: 2.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 330, gravity: 3.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 360, gravity: 4.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 400, gravity: 5.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 420, gravity: 4.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 450, gravity: 3.00, are: 25, lineClear: 40, das: 16, riseRate: 0, maxPoly: 4 },
    { level: 500, gravity: 25.0, are: 25, lineClear: 25, das: 10, riseRate: 10, maxPoly: 4 },
    { level: 600, gravity: 25.0, are: 25, lineClear: 16, das: 10, riseRate: 8, maxPoly: 4 },
    { level: 700, gravity: 25.0, are: 16, lineClear: 12, das: 10, riseRate: 6, maxPoly: 4 },
    { level: 800, gravity: 25.0, are: 12, lineClear: 6, das: 10, riseRate: 5, maxPoly: 4 },
    { level: 900, gravity: 25.0, are: 12, lineClear: 6, das: 8, riseRate: 4, maxPoly: 4 },
    { level: 1000, gravity: 25.0, are: 6, lineClear: 6, das: 8, riseRate: 3, maxPoly: 5 },
    { level: 1300, gravity: 25.0, are: 4, lineClear: 4, das: 8, riseRate: 2, maxPoly: 6 },
    { level: 1500, gravity: 25.0, are: 4, lineClear: 4, das: 8, riseRate: 2, maxPoly: 7 },
];

/**
 * 現在のレベルに対応するスピードカーブ設定を取得
 * @param {number} level - 現在のレベル
 * @returns {{ gravity: number, are: number, lineClear: number, das: number, riseRate: number, maxPoly: number, enableBroken: level >= 0 }}
 */
export function getSpeedSettings(level) {
    let result = SPEED_TABLE[0];
    for (const row of SPEED_TABLE) {
        if (level >= row.level) {
            result = row;
        } else {
            break;
        }
    }
    return {
        ...result,
    enableBroken: true
    }
}

export { SPEED_TABLE };
