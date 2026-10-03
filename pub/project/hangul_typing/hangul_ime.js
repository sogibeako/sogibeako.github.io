const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNGSEONG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONGSEONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const ENG_TO_H_MAP = {
  'q': 'ㅂ', 'Q': 'ㅃ', 'w': 'ㅈ', 'W': 'ㅉ', 'e': 'ㄷ', 'E': 'ㄸ', 'r': 'ㄱ', 'R': 'ㄲ', 't': 'ㅅ', 'T': 'ㅆ',
  'y': 'ㅛ', 'Y': 'ㅛ', 'u': 'ㅕ', 'U': 'ㅕ', 'i': 'ㅑ', 'I': 'ㅑ', 'o': 'ㅐ', 'O': 'ㅒ', 'p': 'ㅔ', 'P': 'ㅖ',
  'a': 'ㅁ', 'A': 'ㅁ', 's': 'ㄴ', 'S': 'ㄴ', 'd': 'ㅇ', 'D': 'ㅇ', 'f': 'ㄹ', 'F': 'ㄹ', 'g': 'ㅎ', 'G': 'ㅎ',
  'h': 'ㅗ', 'H': 'ㅗ', 'j': 'ㅓ', 'J': 'ㅓ', 'k': 'ㅏ', 'K': 'ㅏ', 'l': 'ㅣ', 'L': 'ㅣ',
  'z': 'ㅋ', 'Z': 'ㅋ', 'x': 'ㅌ', 'X': 'ㅌ', 'c': 'ㅊ', 'C': 'ㅊ', 'v': 'ㅍ', 'V': 'ㅍ', 'b': 'ㅠ', 'B': 'ㅠ',
  'n': 'ㅜ', 'N': 'ㅜ', 'm': 'ㅡ', 'M': 'ㅡ'
};

const H_TO_ENG_MAP = {
  'ㅂ': 'Q', 'ㅃ': 'Shift+Q', 'ㅈ': 'W', 'ㅉ': 'Shift+W', 'ㄷ': 'E', 'ㄸ': 'Shift+E', 'ㄱ': 'R', 'ㄲ': 'Shift+R', 'ㅅ': 'T', 'ㅆ': 'Shift+T',
  'ㅛ': 'Y', 'ㅕ': 'U', 'ㅑ': 'I', 'ㅐ': 'O', 'ㅒ': 'Shift+O', 'ㅔ': 'P', 'ㅖ': 'Shift+P',
  'ㅁ': 'A', 'ㄴ': 'S', 'ㅇ': 'D', 'ㄹ': 'F', 'ㅎ': 'G', 'ㅗ': 'H', 'ㅓ': 'J', 'ㅏ': 'K', 'ㅣ': 'L',
  'ㅋ': 'Z', 'ㅌ': 'X', 'ㅊ': 'C', 'ㅍ': 'V', 'ㅠ': 'B', 'ㅜ': 'N', 'ㅡ': 'M'
};

function isHangul(char) {
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

function isJamo(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x3131 && code <= 0x3163);
}

function decomposeHangul(char) {
  if (isHangul(char)) {
    const code = char.charCodeAt(0) - 0xAC00;
    const jong = code % 28;
    const jung = Math.floor((code % (21 * 28)) / 28);
    const cho = Math.floor(code / (21 * 28));
    return {
      cho: CHOSEONG[cho],
      jung: JUNGSEONG[jung],
      jong: JONGSEONG[jong]
    };
  } else if (isJamo(char)) {
    if (CHOSEONG.includes(char)) return { cho: char, jung: "", jong: "" };
    if (JUNGSEONG.includes(char)) return { cho: "", jung: char, jong: "" };
    if (JONGSEONG.includes(char)) return { cho: "", jung: "", jong: char };
  }
  return { cho: "", jung: "", jong: "" };
}

function analyzeDifference(target, input) {
  const len = Math.max(target.length, input.length);
  let feedback = [];

  for (let i = 0; i < len; i++) {
    const tChar = target[i];
    const iChar = input[i];

    if (!tChar) {
      feedback.push(`文字が多すぎます: 「${iChar}」は不要です`);
      continue;
    }
    if (!iChar) {
      feedback.push(`文字が足りません: 「${tChar}」が必要です`);
      continue;
    }

    if (tChar === iChar) continue;

    if (tChar === ' ' || iChar === ' ') {
      if (tChar === ' ') {
        feedback.push(`「スペース(空白)」が必要です (入力は「${iChar}」)`);
      } else {
        feedback.push(`「スペース(空白)」は不要です (正解は「${tChar}」)`);
      }
      continue;
    }

    const tDecomp = decomposeHangul(tChar);
    const iDecomp = decomposeHangul(iChar);

    if (tDecomp.cho && !iDecomp.cho && tDecomp.jung && !iDecomp.jung) {
      feedback.push(`「${tChar}」が必要です (入力: ${iChar})`);
      continue;
    }

    if (tDecomp.cho !== iDecomp.cho) {
      const engTarget = H_TO_ENG_MAP[tDecomp.cho] || "?";
      const engInput = H_TO_ENG_MAP[iDecomp.cho] || "?";
      if (!iDecomp.cho) {
        feedback.push(`子音(初声)がありません。${engTarget} (${tDecomp.cho}) を押してください。`);
      } else {
        feedback.push(`子音が違います。${iDecomp.cho} ではなく ${tDecomp.cho} です。${engInput} ではなく ${engTarget} を押します。`);
      }
    }

    if (tDecomp.jung !== iDecomp.jung) {
      const engTarget = H_TO_ENG_MAP[tDecomp.jung] || "?";
      const engInput = H_TO_ENG_MAP[iDecomp.jung] || "?";
      if (!iDecomp.jung) {
        feedback.push(`母音がありません。${engTarget} (${tDecomp.jung}) を押してください。`);
      } else {
        feedback.push(`母音が違います。${iDecomp.jung} ではなく ${tDecomp.jung} です。${engInput} ではなく ${engTarget} を押します。`);
      }
    }

    if (tDecomp.jong !== iDecomp.jong) {
      const engTarget = H_TO_ENG_MAP[tDecomp.jong] || "?";
      const engInput = H_TO_ENG_MAP[iDecomp.jong] || "?";
      if (!tDecomp.jong) {
        feedback.push(`パッチムは不要です。(${iDecomp.jong} を入力しました)`);
      } else if (!iDecomp.jong) {
        feedback.push(`パッチム(終声)がありません。${engTarget} (${tDecomp.jong}) を押してください。`);
      } else {
        feedback.push(`パッチムが違います。${iDecomp.jong} ではなく ${tDecomp.jong} です。${engInput} ではなく ${engTarget} を押します。`);
      }
    }
  }

  return feedback;
}

const COMPLEX_VOWELS = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ'
};

const COMPLEX_CONSONANTS = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

// Very basic English to Hangul composer
// Since implementing a perfect Hangul Automata is complex, we will use a basic state machine
class HangulComposer {
  constructor() {
    this.buffer = []; // stores raw jamo
  }

  processKey(key) {
    if (key === 'Backspace') {
      this.buffer.pop();
      return this.render();
    }
    
    if (key === ' ' || key === 'Spacebar') {
      this.buffer.push(' ');
      return this.render();
    }

    if (ENG_TO_H_MAP[key]) {
      this.buffer.push(ENG_TO_H_MAP[key]);
      return this.render();
    }

    return null; // Not an English key
  }

  clear() {
    this.buffer = [];
  }

  render() {
    // A simplified assembler for the buffer.
    // Group into chunks of [Cho, Jung, Jong]
    let result = "";
    let i = 0;
    while (i < this.buffer.length) {
      const ch1 = this.buffer[i];
      let cho = null, jung = null, jong = null;

      // Look for Choseong
      if (CHOSEONG.includes(ch1)) {
        cho = ch1;
        i++;
        // Look for Jungseong
        if (i < this.buffer.length && JUNGSEONG.includes(this.buffer[i])) {
          jung = this.buffer[i];
          i++;
          
          // Lookahead for complex vowel
          if (i < this.buffer.length && JUNGSEONG.includes(this.buffer[i])) {
            const combinedVowel = COMPLEX_VOWELS[jung + this.buffer[i]];
            if (combinedVowel) {
              jung = combinedVowel;
              i++;
            }
          }

          // Look for Jongseong
          if (i < this.buffer.length && JONGSEONG.includes(this.buffer[i])) {
            let possibleJong1 = this.buffer[i];
            
            // Check if next is Jungseong (which would mean possibleJong1 is actually the next Cho)
            if (i + 1 < this.buffer.length && JUNGSEONG.includes(this.buffer[i + 1])) {
              // It's the next syllable's Cho
            } else {
              jong = possibleJong1;
              i++;
              
              // Lookahead for complex Jongseong
              if (i < this.buffer.length && JONGSEONG.includes(this.buffer[i])) {
                let possibleJong2 = this.buffer[i];
                // Check if possibleJong2 is followed by a Jungseong
                if (i + 1 < this.buffer.length && JUNGSEONG.includes(this.buffer[i + 1])) {
                  // possibleJong2 is next Cho
                } else {
                  const combinedJong = COMPLEX_CONSONANTS[jong + possibleJong2];
                  if (combinedJong) {
                    jong = combinedJong;
                    i++;
                  }
                }
              }
            }
          }
        }
      } else if (JUNGSEONG.includes(ch1)) {
        jung = ch1;
        i++;
        
        // Lookahead for complex vowel
        if (i < this.buffer.length && JUNGSEONG.includes(this.buffer[i])) {
          const combinedVowel = COMPLEX_VOWELS[jung + this.buffer[i]];
          if (combinedVowel) {
            jung = combinedVowel;
            i++;
          }
        }
      } else {
        // standalone jongseong or unmatched
        i++;
        result += ch1;
        continue;
      }

      if (cho && jung) {
        const choIdx = CHOSEONG.indexOf(cho);
        const jungIdx = JUNGSEONG.indexOf(jung);
        const jongIdx = jong ? JONGSEONG.indexOf(jong) : 0;
        const code = 0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28) + jongIdx;
        result += String.fromCharCode(code);
      } else {
        result += (cho || jung);
      }
    }
    return result;
  }
}
