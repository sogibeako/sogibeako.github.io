/* Normalized Fourier transforms. No DOM or audio dependencies. */
(function (root) {
  'use strict';
  const TAU = 2 * Math.PI;
  const mod = (x, n) => ((x % n) + n) % n;
  const meanSquare = x => x.reduce((s, v) => s + v * v, 0) / x.length;
  const rmsError = (a, b) => Math.sqrt(meanSquare(a.map((v, i) => v - b[i])));
  function dft(x) {
    const n = x.length;
    return Array.from({ length: n }, (_, k) => {
      let re = 0, im = 0;
      for (let j = 0; j < n; j++) {
        const a = TAU * j * k / n;
        re += x[j] * Math.cos(a); im -= x[j] * Math.sin(a);
      }
      return { re: re / n, im: im / n };
    });
  }
  function idft(z) {
    return z.map((_, j) => z.reduce((sum, c, k) => {
      const a = TAU * j * k / z.length;
      return sum + c.re * Math.cos(a) - c.im * Math.sin(a);
    }, 0));
  }
  function lowpass(z, cutoff) {
    return z.map((c, k) => Math.min(k, z.length - k) <= cutoff ? c : { re: 0, im: 0 });
  }
  // Z4: characters exp(2πikj/4). V4: characters (-1)^(a*x+b*y).
  function abelianPhase(type, k, j) {
    return type === 'z4' ? TAU * k * j / 4 : Math.PI * (((k >> 1) * (j >> 1)) + ((k & 1) * (j & 1)));
  }
  function abelian(x, type) {
    return x.map((_, k) => x.reduce((z, v, j) => {
      const a = abelianPhase(type, k, j);
      return { re: z.re + v * Math.cos(a) / 4, im: z.im - v * Math.sin(a) / 4 };
    }, { re: 0, im: 0 }));
  }
  function inverseAbelian(z, type) {
    return z.map((_, j) => z.reduce((s, c, k) => {
      const a = abelianPhase(type, k, j);
      return s + c.re * Math.cos(a) - c.im * Math.sin(a);
    }, 0));
  }
  // S3 ≅ D3, ordered e,r,r²,s,rs,r²s; g = r^a s^b, s r = r^-1 s.
  const names = ['e', 'r', 'r²', 's', 'rs', 'r²s'];
  function mul(g, h) {
    const a = g % 3, b = Math.floor(g / 3), c = h % 3, d = Math.floor(h / 3);
    return mod(a + (b ? -c : c), 3) + 3 * (b ^ d);
  }
  function inv(g) { return g >= 3 ? g : mod(-g, 3); }
  function rho(g) {
    const a = TAU * (g % 3) / 3, c = Math.cos(a), s = Math.sin(a), sign = g >= 3 ? -1 : 1;
    return [c, -s * sign, s, c * sign];
  }
  function s3Transform(x) {
    const out = { trivial: 0, sign: 0, matrix: [0, 0, 0, 0] };
    x.forEach((v, g) => {
      out.trivial += v / 6; out.sign += v * (g < 3 ? 1 : -1) / 6;
      const m = rho(g), t = [m[0], m[2], m[1], m[3]];
      t.forEach((a, i) => { out.matrix[i] += v * a / 6; });
    });
    return out;
  }
  function s3Inverse(z, mask = [true, true, true]) {
    return names.map((_, g) => {
      const m = rho(g), f = z.matrix;
      return (mask[0] ? z.trivial : 0) + (mask[1] ? z.sign * (g < 3 ? 1 : -1) : 0)
        + (mask[2] ? 2 * (f[0] * m[0] + f[1] * m[2] + f[2] * m[1] + f[3] * m[3]) : 0);
    });
  }
  const translate = (x, h) => x.map((_, g) => x[mul(inv(h), g)]);
  function parseScale(text) {
    const lines = text.split(/\r?\n/).map(l => l.split('#')[0].trim()).filter(Boolean);
    if (!lines.length || lines.length > 64) throw new Error('音律は1〜64行で入力してください。');
    const values = lines.map(s => {
      let v;
      if (/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(s)) {
        const [a, b] = s.split('/').map(Number); v = a / b;
      } else if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s)) v = 2 ** (Number(s) / 1200);
      else throw new Error('音律は比（3/2）またはセント（700）の形式で入力してください。');
      if (!Number.isFinite(v) || v <= 0) throw new Error('音律の比は有限の正の数にしてください。');
      return v;
    });
    const period = values.pop();
    if (period <= 1 || period > 16) throw new Error('最終行の周期比は1より大きく16以下にしてください。');
    const degrees = [1, ...values.filter(v => Math.abs(v - 1) > 1e-10)];
    if (degrees.some((v, i) => v >= period || (i && v <= degrees[i - 1])))
      throw new Error('周期内の音は1/1以上、周期未満で、小さい順に並べてください。');
    return { degrees, period };
  }
  function frequency(scale, base, step) {
    const n = scale.degrees.length;
    return base * scale.period ** Math.floor(step / n) * scale.degrees[mod(step, n)];
  }
  // Real trigonometric interpolation. The even-N Nyquist bin occurs only once.
  // Audio omits DC and harmonics at/above the output Nyquist frequency.
  function harmonics(x, frequency, sampleRate) {
    const z = dft(x), max = Math.min(Math.floor(x.length / 2), Math.ceil(sampleRate / (2 * frequency)) - 1);
    const real = new Float32Array(max + 1), imag = new Float32Array(max + 1);
    for (let k = 1; k <= max; k++) {
      const factor = k * 2 === x.length ? 1 : 2;
      real[k] = factor * z[k].re; imag[k] = -factor * z[k].im;
    }
    const bound = real.reduce((s, v, i) => s + Math.hypot(v, imag[i]), 0);
    const gain = 1 / Math.max(1, bound);
    return { real, imag, gain, max };
  }
  function wav(x, frequency, seconds, volume, sampleRate = 44100) {
    const h = harmonics(x, frequency, sampleRate), count = Math.round(seconds * sampleRate);
    const buffer = new ArrayBuffer(44 + count * 2), dv = new DataView(buffer);
    const str = (offset, s) => [...s].forEach((c, i) => dv.setUint8(offset + i, c.charCodeAt(0)));
    str(0, 'RIFF'); dv.setUint32(4, 36 + count * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, count * 2, true);
    // Precompute one band-limited period, then interpolate it for the output clock.
    const tableSize = 8192, table = new Float64Array(tableSize);
    for (let j = 0; j < tableSize; j++) {
      for (let k = 1; k <= h.max; k++) table[j] += h.real[k] * Math.cos(TAU * j * k / tableSize) + h.imag[k] * Math.sin(TAU * j * k / tableSize);
    }
    for (let i = 0; i < count; i++) {
      const p = mod(i * frequency / sampleRate, 1) * tableSize, a = Math.floor(p), t = p - a;
      const env = Math.max(0, Math.min(1, i / (sampleRate * .015), (count - 1 - i) / (sampleRate * .04)));
      const value = (table[a] * (1 - t) + table[(a + 1) % tableSize] * t) * h.gain * volume * env;
      dv.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, value)) * 32767), true);
    }
    return buffer;
  }
  const api = { TAU, mod, meanSquare, rmsError, dft, idft, lowpass, abelianPhase, abelian, inverseAbelian, names, mul, inv, rho, s3Transform, s3Inverse, translate, parseScale, frequency, harmonics, wav };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Fourier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
