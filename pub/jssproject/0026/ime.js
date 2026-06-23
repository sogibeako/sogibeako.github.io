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

const GRC_DIACRITICS = new Set(["\u0313", "\u0314", "\u0300", "\u0301", "\u0342", "\u0308", "\u0345", "\u0304"]);
const GRC_SPACING_MARKS = {
  "\u0313": "᾿", "\u0314": "῾", "\u0300": "`", "\u0301": "´", "\u0342": "^", "\u0308": "¨", "\u0345": "ͅ", "\u0304": "-"
};
const VI_TONES = { s: "\u0301", f: "\u0300", r: "\u0309", x: "\u0303", j: "\u0323" };
const VI_TONE_MARKS = new Set(Object.values(VI_TONES));
const VI_SHAPE_MARKS = new Set(["\u0302", "\u0306", "\u031B"]);

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
    this.mode = mode; // 'ko', 'ru', 'el', 'grc', 'vi'
    this.layouts = KEYBOARD_LAYOUTS;
  }

  setMode(mode) {
    this.mode = mode;
  }

  // Gets the mapping for an english key based on current mode and shift state
  getMapping(code, shiftKey) {
    // JIS keyboards emit Equal for the unshifted ^ key.
    if ((this.mode === 'grc' || this.mode === 'grcLatn') && code === 'Equal' && !shiftKey) {
      return this.mode === 'grc' ? "\u0342" : '^';
    }
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
  processKey(lastChar, code, shiftKey, eventKey, leftText = lastChar) {
    if (this.mode === 'grcLatn') {
      return this.processGreekTransliteration(leftText, this.getMapping(code, shiftKey));
    }

    // Telex must inspect the current word before the native Latin-character check.
    if (this.mode === 'vi') {
      return this.processVietnamese(leftText, this.getMapping(code, shiftKey));
    }

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


    if (this.mode === 'grc') {
      return this.processAncientGreek(leftText, mappedChar);
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
    if (this.mode === 'grc') return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(char);
    if (this.mode === 'vi') return /[A-Za-zÀ-ỹĐđ]/.test(char);
    return false;
  }

  processAncientGreek(leftText, mappedChar) {
    if (!GRC_DIACRITICS.has(mappedChar)) {
      return { replaceLength: 0, insertText: mappedChar };
    }

    const match = leftText.match(/([\u0370-\u03FF\u1F00-\u1FFF][\u0300-\u036F]*)$/u);
    if (!match) {
      return { replaceLength: 0, insertText: GRC_SPACING_MARKS[mappedChar] };
    }

    const original = match[1];
    const decomposed = Array.from(original.normalize('NFD'));
    let base = decomposed.shift();
    if (!/[αεηιουωΑΕΗΙΟΥΩρΡ]/.test(base)) {
      return { replaceLength: 0, insertText: GRC_SPACING_MARKS[mappedChar] };
    }

    let marks = decomposed.filter(mark => GRC_DIACRITICS.has(mark));
    // A transliteration-friendly shortcut: e- → η and o- → ω.
    if (mappedChar === "\u0304" && /[εΕοΟ]/.test(base)) {
      base = ({ 'ε': 'η', 'Ε': 'Η', 'ο': 'ω', 'Ο': 'Ω' })[base];
      mappedChar = '';
    }
    if (mappedChar === "\u0313" || mappedChar === "\u0314") marks = marks.filter(mark => mark !== "\u0313" && mark !== "\u0314");
    if (mappedChar === "\u0300" || mappedChar === "\u0301" || mappedChar === "\u0342") marks = marks.filter(mark => mark !== "\u0300" && mark !== "\u0301" && mark !== "\u0342");
    if (mappedChar === "\u0308") marks = marks.filter(mark => mark !== "\u0313" && mark !== "\u0314" && mark !== "\u0308");
    if (mappedChar === "\u0345") marks = marks.filter(mark => mark !== "\u0345");
    if (mappedChar === "\u0304") marks = marks.filter(mark => mark !== "\u0304" && mark !== "\u0342");
    if (mappedChar) marks.push(mappedChar);

    const ordered = ["\u0304", "\u0308", "\u0313", "\u0314", "\u0300", "\u0301", "\u0342", "\u0345"]
      .filter(mark => marks.includes(mark));
    return { replaceLength: original.length, insertText: (base + ordered.join('')).normalize('NFC') };
  }

  processVietnamese(leftText, mappedChar) {
    if (!mappedChar) return null;
    const key = mappedChar.toLowerCase();
    const wordMatch = leftText.match(/[A-Za-zÀ-ỹĐđ]+$/u);
    const word = wordMatch ? wordMatch[0] : "";

    if (key === 'd' && /d$/i.test(word)) {
      const previous = word.slice(-1);
      return { replaceLength: 1, insertText: previous === previous.toUpperCase() ? 'Đ' : 'đ' };
    }

    if ((key === 'a' || key === 'e' || key === 'o') && word) {
      const last = word.slice(-1);
      if (this.vietnameseBase(last) === key) {
        return { replaceLength: 1, insertText: this.applyVietnameseShape(last, "\u0302") };
      }
    }

    if (key === 'w' && word) {
      const last = word.slice(-1);
      const base = this.vietnameseBase(last);
      const shape = base === 'a' ? "\u0306" : (base === 'o' || base === 'u' ? "\u031B" : null);
      if (shape) return { replaceLength: 1, insertText: this.applyVietnameseShape(last, shape) };
    }

    if (VI_TONES[key] && word) {
      const index = this.findVietnameseToneIndex(word);
      if (index >= 0) {
        const chars = Array.from(word);
        chars[index] = this.applyVietnameseTone(chars[index], VI_TONES[key]);
        return { replaceLength: word.length, insertText: chars.join('') };
      }
    }

    if (key === 'z' && word) {
      const chars = Array.from(word);
      for (let index = chars.length - 1; index >= 0; index--) {
        const stripped = this.stripVietnameseMarks(chars[index]);
        if (stripped !== chars[index]) {
          chars[index] = stripped;
          return { replaceLength: word.length, insertText: chars.join('') };
        }
      }
    }

    return { replaceLength: 0, insertText: mappedChar };
  }

  processGreekTransliteration(leftText, mappedChar) {
    if (!mappedChar) return null;
    if (mappedChar !== '^' && mappedChar !== '-') {
      return { replaceLength: 0, insertText: mappedChar };
    }

    const match = leftText.match(/([A-Za-zÀ-ž][\u0300-\u036f]*)$/u);
    if (!match) return { replaceLength: 0, insertText: mappedChar };
    const original = match[1];
    const parts = Array.from(original.normalize('NFD'));
    const base = parts.shift();
    if (!/[aeiouyAEIOUY]/.test(base)) return { replaceLength: 0, insertText: mappedChar };

    const replacementMark = mappedChar === '^' ? "\u0302" : "\u0304";
    const marks = parts.filter(mark => mark !== "\u0302" && mark !== "\u0304");
    return { replaceLength: original.length, insertText: (base + replacementMark + marks.join('')).normalize('NFC') };
  }

  vietnameseBase(char) {
    if (!char) return '';
    if (char === 'đ' || char === 'Đ') return 'd';
    return char.normalize('NFD').charAt(0).toLowerCase();
  }

  applyVietnameseShape(char, shapeMark) {
    const parts = Array.from(char.normalize('NFD'));
    const base = parts.shift();
    const marks = parts.filter(mark => !VI_SHAPE_MARKS.has(mark));
    return (base + shapeMark + marks.join('')).normalize('NFC');
  }

  applyVietnameseTone(char, toneMark) {
    const parts = Array.from(char.normalize('NFD'));
    const base = parts.shift();
    const marks = parts.filter(mark => !VI_TONE_MARKS.has(mark));
    return (base + marks.join('') + toneMark).normalize('NFC');
  }

  stripVietnameseMarks(char) {
    if (char === 'đ') return 'd';
    if (char === 'Đ') return 'D';
    return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  findVietnameseToneIndex(word) {
    const chars = Array.from(word);
    let vowels = chars.map((char, index) => ({ index, base: this.vietnameseBase(char), char }))
      .filter(item => /[aeiouy]/.test(item.base));

    if (vowels.length > 1 && /^qu/i.test(word)) vowels = vowels.filter(item => item.index !== 1);
    if (vowels.length > 1 && /^gi/i.test(word)) vowels = vowels.filter(item => item.index !== 1);
    if (!vowels.length) return -1;

    const shaped = vowels.find(item => Array.from(item.char.normalize('NFD')).some(mark => VI_SHAPE_MARKS.has(mark)));
    if (shaped) return shaped.index;
    if (vowels.length >= 3) return vowels[Math.floor(vowels.length / 2)].index;
    if (vowels.length === 2) {
      const endsInVowel = vowels[1].index === chars.length - 1;
      return (endsInVowel ? vowels[0] : vowels[1]).index;
    }
    return vowels[0].index;
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
