// ime.js

const CHOSEONG = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNGSEONG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONGSEONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const COMPLEX_VOWELS = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ', 'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ', 'ㅡㅣ': 'ㅢ'
};

const COMPLEX_CONSONANTS = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ', 'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ'
};

const SPLIT_COMPLEX_CONSONANTS = {
  'ㄳ': ['ㄱ','ㅅ'], 'ㄵ': ['ㄴ','ㅈ'], 'ㄶ': ['ㄴ','ㅎ'], 'ㄺ': ['ㄹ','ㄱ'], 'ㄻ': ['ㄹ','ㅁ'], 'ㄼ': ['ㄹ','ㅂ'], 'ㄽ': ['ㄹ','ㅅ'], 'ㄾ': ['ㄹ','ㅌ'], 'ㄿ': ['ㄹ','ㅍ'], 'ㅀ': ['ㄹ','ㅎ'], 'ㅄ': ['ㅂ','ㅅ']
};

const EL_ACCENT_MAP = {
  'α': 'ά', 'ε': 'έ', 'η': 'ή', 'ι': 'ί', 'ο': 'ό', 'υ': 'ύ', 'ω': 'ώ',
  'Α': 'Ά', 'Ε': 'Έ', 'Η': 'Ή', 'Ι': 'Ί', 'Ο': 'Ό', 'Υ': 'Ύ', 'Ω': 'Ώ'
};

const EL_DIALYTIKA_MAP = {
  'ι': 'ϊ', 'υ': 'ϋ', 'Ι': 'Ϊ', 'Υ': 'Ϋ'
};

function isHangul(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

function isJamo(char) {
  if (!char) return false;
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

function composeSyllable(cho, jung, jong) {
  const choIdx = CHOSEONG.indexOf(cho);
  if (choIdx === -1) return cho || jung || jong || "";
  const jungIdx = jung ? JUNGSEONG.indexOf(jung) : -1;
  if (jungIdx === -1) return cho;
  const jongIdx = jong ? JONGSEONG.indexOf(jong) : 0;
  
  const code = 0xAC00 + (choIdx * 21 * 28) + (jungIdx * 28) + jongIdx;
  return String.fromCharCode(code);
}

class IME {
  constructor(mode) {
    this.mode = mode; // 'ko', 'ru', 'el'
    this.layouts = KEYBOARD_LAYOUTS;
  }

  setMode(mode) {
    this.mode = mode;
  }

  // Gets the mapping for an english key based on current mode and shift state
  getMapping(code, shiftKey) {
    const layout = this.layouts[this.mode];
    if (!layout) return null;

    for (const row of layout.rows) {
      for (const key of row) {
        if (key.code === code) {
          return shiftKey ? key.shift : key.normal;
        }
      }
    }
    return null;
  }

  // Returns array of characters to replace the `lastChar` with.
  // e.g. ["가"] means replace lastChar with "가"
  // ["가", "ㄱ"] means replace lastChar with "가" and insert "ㄱ" after it
  // [] means something went wrong, just insert the new key natively
  processKey(lastChar, code, shiftKey, eventKey) {
    // 1. If the user typed a native character for the target language (e.g. from an OS keyboard), 
    // let it pass through. We can detect this by checking if eventKey is already a target char.
    if (this.isTargetLanguageChar(eventKey)) {
      return null; // Signals the app to not preventDefault, letting the native input happen
    }

    // 2. Find the mapped character for the physical key
    const mappedChar = this.getMapping(code, shiftKey);
    if (!mappedChar) {
      // It's not a printable key we map (e.g., Enter, Space, Backspace), let it pass through
      return null; 
    }

    // 3. Mode specific processing
    if (this.mode === 'ru') {
      return { replaceLength: 0, insertText: mappedChar };
    }
    
    if (this.mode === 'el') {
      if (lastChar === '´' && EL_ACCENT_MAP[mappedChar]) {
        return { replaceLength: 1, insertText: EL_ACCENT_MAP[mappedChar] };
      }
      if (lastChar === '¨' && EL_DIALYTIKA_MAP[mappedChar]) {
        return { replaceLength: 1, insertText: EL_DIALYTIKA_MAP[mappedChar] };
      }
      return { replaceLength: 0, insertText: mappedChar };
    }

    if (this.mode === 'ko') {
      return this.processKorean(lastChar, mappedChar);
    }

    return { replaceLength: 0, insertText: mappedChar };
  }

  isTargetLanguageChar(char) {
    if (char.length !== 1) return false;
    if (this.mode === 'ko') return isHangul(char) || isJamo(char);
    if (this.mode === 'ru') return /[а-яА-ЯёЁ]/.test(char);
    if (this.mode === 'el') return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(char);
    return false;
  }

  processKorean(lastChar, keyJamo) {
    const isConsonant = CHOSEONG.includes(keyJamo) || JONGSEONG.includes(keyJamo);
    const isVowel = JUNGSEONG.includes(keyJamo);

    if (!lastChar || (!isHangul(lastChar) && !isJamo(lastChar))) {
      return { replaceLength: 0, insertText: keyJamo };
    }

    const { cho, jung, jong } = decomposeHangul(lastChar);

    // If last char is just a consonant
    if (cho && !jung) {
      if (isConsonant) {
        const combined = COMPLEX_CONSONANTS[cho + keyJamo];
        if (combined) {
          return { replaceLength: 1, insertText: combined };
        }
      } else if (isVowel) {
        return { replaceLength: 1, insertText: composeSyllable(cho, keyJamo, "") };
      }
    } 
    // If last char is just a vowel
    else if (!cho && jung) {
      if (isVowel) {
        const combined = COMPLEX_VOWELS[jung + keyJamo];
        if (combined) {
          return { replaceLength: 1, insertText: combined };
        }
      }
    } 
    // If last char is a full syllable
    else if (cho && jung) {
      if (isConsonant) {
        if (!jong) {
          if (JONGSEONG.includes(keyJamo) && keyJamo !== "ㅃ" && keyJamo !== "ㅉ" && keyJamo !== "ㄸ") {
            return { replaceLength: 1, insertText: composeSyllable(cho, jung, keyJamo) };
          }
        } else {
          const combinedJong = COMPLEX_CONSONANTS[jong + keyJamo];
          if (combinedJong) {
            return { replaceLength: 1, insertText: composeSyllable(cho, jung, combinedJong) };
          }
        }
      } else if (isVowel) {
        if (!jong) {
          const combinedJung = COMPLEX_VOWELS[jung + keyJamo];
          if (combinedJung) {
            return { replaceLength: 1, insertText: composeSyllable(cho, combinedJung, "") };
          }
        } else {
          // Jongseong moves to become choseong of next syllable
          if (SPLIT_COMPLEX_CONSONANTS[jong]) {
            const [j1, j2] = SPLIT_COMPLEX_CONSONANTS[jong];
            const char1 = composeSyllable(cho, jung, j1);
            const char2 = composeSyllable(j2, keyJamo, "");
            return { replaceLength: 1, insertText: char1 + char2 };
          } else {
            const char1 = composeSyllable(cho, jung, "");
            const char2 = composeSyllable(jong, keyJamo, "");
            return { replaceLength: 1, insertText: char1 + char2 };
          }
        }
      }
    }

    // Default: just append the new jamo
    return { replaceLength: 0, insertText: keyJamo };
  }
}
