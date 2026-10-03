export function explainNormalization(ideal, ringType) {
  if (ringType === 'Z') {
    return `Z は単項イデアル整域 (PID) なので、複数の生成元が与えられた場合 $(a, b, ...) = (\\text{gcd}(a, b, ...))$ として1つの生成元にまとめられます。`;
  } else if (ringType === 'Fp[x]') {
    return `F_p[x] は単項イデアル整域 (PID) なので、$(f, g) = (\\text{gcd}(f, g))$ となり1つの生成元にまとまります。また標準形として最高次係数が1（モニック）になるよう調整されます。`;
  }
  return '';
}

export function explainAdd(i, j, result, ringType) {
  let text = `PID ではイデアルの和は $(a) + (b) = (\\text{gcd}(a, b))$ となります。<br>`;
  if (result.isUnit()) {
    text += `計算結果が $(1)$ になったということは、2つのイデアルの生成元が<b>互いに素</b>（共通の因子を持たない）であることを意味します。`;
  } else if (result.toString() === i.toString()) {
    text += `結果が $I$ と一致しました。これは $J \\subset I$ であること、つまり $I$ の生成元が $J$ の生成元を割り切ることを意味します。`;
  }
  return text;
}

export function explainMultiply(i, j, result, ringType) {
  return `PID ではイデアルの積は $(a)(b) = (ab)$ となります。生成元同士を掛け合わせたものが新しいイデアルの生成元です。`;
}

export function explainIntersect(i, j, result, ringType) {
  let text = `PID ではイデアルの共通部分は $(a) \\cap (b) = (\\text{lcm}(a, b))$ となります。<br>`;
  if (result.toString() === i.toString()) {
      text += `結果が $I$ と一致しました。これは $I \\subset J$ であること、つまり $J$ の生成元が $I$ の生成元を割り切ることを意味します。`;
  }
  return text;
}

export function explainFactor(ideal, factors, ringType) {
  if (ideal.isZero()) return `零イデアル $(0)$ は整域において素イデアルですが、通常の意味での素イデアルへの「積への分解」は考えません。`;
  if (ideal.isUnit()) return `単位イデアル $(1)$ は環全体であり、素イデアルではありません。素イデアル分解の対象外です。`;
  
  if (ringType === 'Z') {
    return `整数を素因数分解し、それぞれの素数を生成元とする素イデアルの積として表現しました。`;
  } else if (ringType === 'Fp[x]') {
    let text = `多項式を既約多項式に因数分解し、それぞれの既約多項式を生成元とする素イデアルの積として表現しました。`;
    if (factors.some(f => f.isPartial)) {
      text += `<br><span style="color:var(--accent2)">※ 一部の高次多項式はv0.1の仕様により、完全に既約因子に分解されず残っている可能性があります。</span>`;
    }
    return text;
  }
  return '';
}
