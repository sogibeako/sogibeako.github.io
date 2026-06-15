/**
 * GlitchPoet — シード付き疑似乱数生成器 (xoshiro128**)
 */
class PRNG {
    constructor(seed = 42) {
        this.state = new Uint32Array(4);
        this.seed(seed);
    }

    seed(s) {
        // SplitMix32 で state を初期化
        let z = (s | 0) >>> 0;
        for (let i = 0; i < 4; i++) {
            z = (z + 0x9e3779b9) >>> 0;
            let t = z ^ (z >>> 16);
            t = Math.imul(t, 0x21f0aaad);
            t = (t ^ (t >>> 15)) >>> 0;
            t = Math.imul(t, 0x735a2d97);
            t = (t ^ (t >>> 15)) >>> 0;
            this.state[i] = t;
        }
        // state が全0にならないよう保証
        if (this.state.every(v => v === 0)) this.state[0] = 1;
    }

    _rotl(x, k) {
        return ((x << k) | (x >>> (32 - k))) >>> 0;
    }

    /** 0 ~ 0xFFFFFFFF の Uint32 を返す */
    nextUint32() {
        const s = this.state;
        const result = Math.imul(this._rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
        const t = (s[1] << 9) >>> 0;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = this._rotl(s[3], 11);
        return result;
    }

    /** 0.0 ≤ x < 1.0 の浮動小数を返す */
    next() {
        return this.nextUint32() / 0x100000000;
    }

    /** min ≤ x ≤ max の整数を返す */
    nextInt(min, max) {
        return min + (this.nextUint32() % (max - min + 1));
    }

    /** 配列をシャッフル（Fisher-Yates） */
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /** 配列からランダムに1つ選ぶ */
    pick(arr) {
        return arr[this.nextInt(0, arr.length - 1)];
    }

    /** 確率 p で true を返す */
    chance(p) {
        return this.next() < p;
    }
}
