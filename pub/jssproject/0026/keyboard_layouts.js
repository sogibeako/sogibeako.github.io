// keyboard_layouts.js

const KEYBOARD_LAYOUTS = {
  ko: {
    name: "韓国語 (Korean)",
    rows: [
      [
        { code: "KeyQ", eng: "Q", normal: "ㅂ", shift: "ㅃ" },
        { code: "KeyW", eng: "W", normal: "ㅈ", shift: "ㅉ" },
        { code: "KeyE", eng: "E", normal: "ㄷ", shift: "ㄸ" },
        { code: "KeyR", eng: "R", normal: "ㄱ", shift: "ㄲ" },
        { code: "KeyT", eng: "T", normal: "ㅅ", shift: "ㅆ" },
        { code: "KeyY", eng: "Y", normal: "ㅛ", shift: "ㅛ" },
        { code: "KeyU", eng: "U", normal: "ㅕ", shift: "ㅕ" },
        { code: "KeyI", eng: "I", normal: "ㅑ", shift: "ㅑ" },
        { code: "KeyO", eng: "O", normal: "ㅐ", shift: "ㅒ" },
        { code: "KeyP", eng: "P", normal: "ㅔ", shift: "ㅖ" },
        { code: "BracketLeft", eng: "[", normal: "[", shift: "{" },
        { code: "BracketRight", eng: "]", normal: "]", shift: "}" }
      ],
      [
        { code: "KeyA", eng: "A", normal: "ㅁ", shift: "ㅁ" },
        { code: "KeyS", eng: "S", normal: "ㄴ", shift: "ㄴ" },
        { code: "KeyD", eng: "D", normal: "ㅇ", shift: "ㅇ" },
        { code: "KeyF", eng: "F", normal: "ㄹ", shift: "ㄹ" },
        { code: "KeyG", eng: "G", normal: "ㅎ", shift: "ㅎ" },
        { code: "KeyH", eng: "H", normal: "ㅗ", shift: "ㅗ" },
        { code: "KeyJ", eng: "J", normal: "ㅓ", shift: "ㅓ" },
        { code: "KeyK", eng: "K", normal: "ㅏ", shift: "ㅏ" },
        { code: "KeyL", eng: "L", normal: "ㅣ", shift: "ㅣ" },
        { code: "Semicolon", eng: ";", normal: ";", shift: ":" },
        { code: "Quote", eng: "'", normal: "'", shift: "\"" }
      ],
      [
        { code: "KeyZ", eng: "Z", normal: "ㅋ", shift: "ㅋ" },
        { code: "KeyX", eng: "X", normal: "ㅌ", shift: "ㅌ" },
        { code: "KeyC", eng: "C", normal: "ㅊ", shift: "ㅊ" },
        { code: "KeyV", eng: "V", normal: "ㅍ", shift: "ㅍ" },
        { code: "KeyB", eng: "B", normal: "ㅠ", shift: "ㅠ" },
        { code: "KeyN", eng: "N", normal: "ㅜ", shift: "ㅜ" },
        { code: "KeyM", eng: "M", normal: "ㅡ", shift: "ㅡ" },
        { code: "Comma", eng: ",", normal: ",", shift: "<" },
        { code: "Period", eng: ".", normal: ".", shift: ">" },
        { code: "Slash", eng: "/", normal: "/", shift: "?" }
      ]
    ]
  },
  ru: {
    name: "ロシア語 (Russian)",
    rows: [
      [
        { code: "KeyQ", eng: "Q", normal: "й", shift: "Й" },
        { code: "KeyW", eng: "W", normal: "ц", shift: "Ц" },
        { code: "KeyE", eng: "E", normal: "у", shift: "У" },
        { code: "KeyR", eng: "R", normal: "к", shift: "К" },
        { code: "KeyT", eng: "T", normal: "е", shift: "Е" },
        { code: "KeyY", eng: "Y", normal: "н", shift: "Н" },
        { code: "KeyU", eng: "U", normal: "г", shift: "Г" },
        { code: "KeyI", eng: "I", normal: "ш", shift: "Ш" },
        { code: "KeyO", eng: "O", normal: "щ", shift: "Щ" },
        { code: "KeyP", eng: "P", normal: "з", shift: "З" },
        { code: "BracketLeft", eng: "[", normal: "х", shift: "Х" },
        { code: "BracketRight", eng: "]", normal: "ъ", shift: "Ъ" }
      ],
      [
        { code: "KeyA", eng: "A", normal: "ф", shift: "Ф" },
        { code: "KeyS", eng: "S", normal: "ы", shift: "Ы" },
        { code: "KeyD", eng: "D", normal: "в", shift: "В" },
        { code: "KeyF", eng: "F", normal: "а", shift: "А" },
        { code: "KeyG", eng: "G", normal: "п", shift: "П" },
        { code: "KeyH", eng: "H", normal: "р", shift: "Р" },
        { code: "KeyJ", eng: "J", normal: "о", shift: "О" },
        { code: "KeyK", eng: "K", normal: "л", shift: "Л" },
        { code: "KeyL", eng: "L", normal: "д", shift: "Д" },
        { code: "Semicolon", eng: ";", normal: "ж", shift: "Ж" },
        { code: "Quote", eng: "'", normal: "э", shift: "Э" }
      ],
      [
        { code: "KeyZ", eng: "Z", normal: "я", shift: "Я" },
        { code: "KeyX", eng: "X", normal: "ч", shift: "Ч" },
        { code: "KeyC", eng: "C", normal: "с", shift: "С" },
        { code: "KeyV", eng: "V", normal: "м", shift: "М" },
        { code: "KeyB", eng: "B", normal: "и", shift: "И" },
        { code: "KeyN", eng: "N", normal: "т", shift: "Т" },
        { code: "KeyM", eng: "M", normal: "ь", shift: "Ь" },
        { code: "Comma", eng: ",", normal: "б", shift: "Б" },
        { code: "Period", eng: ".", normal: "ю", shift: "Ю" },
        { code: "Slash", eng: "/", normal: ".", shift: "," }
      ]
    ]
  },
  el: {
    name: "ギリシャ語 (Greek)",
    rows: [
      [
        { code: "KeyQ", eng: "Q", normal: ";", shift: ":" },
        { code: "KeyW", eng: "W", normal: "ς", shift: "Σ" },
        { code: "KeyE", eng: "E", normal: "ε", shift: "Ε" },
        { code: "KeyR", eng: "R", normal: "ρ", shift: "Ρ" },
        { code: "KeyT", eng: "T", normal: "τ", shift: "Τ" },
        { code: "KeyY", eng: "Y", normal: "υ", shift: "Υ" },
        { code: "KeyU", eng: "U", normal: "θ", shift: "Θ" },
        { code: "KeyI", eng: "I", normal: "ι", shift: "Ι" },
        { code: "KeyO", eng: "O", normal: "ο", shift: "Ο" },
        { code: "KeyP", eng: "P", normal: "π", shift: "Π" },
        { code: "BracketLeft", eng: "[", normal: "[", shift: "{" },
        { code: "BracketRight", eng: "]", normal: "]", shift: "}" }
      ],
      [
        { code: "KeyA", eng: "A", normal: "α", shift: "Α" },
        { code: "KeyS", eng: "S", normal: "σ", shift: "Σ" },
        { code: "KeyD", eng: "D", normal: "δ", shift: "Δ" },
        { code: "KeyF", eng: "F", normal: "φ", shift: "Φ" },
        { code: "KeyG", eng: "G", normal: "γ", shift: "Γ" },
        { code: "KeyH", eng: "H", normal: "η", shift: "Η" },
        { code: "KeyJ", eng: "J", normal: "ξ", shift: "Ξ" },
        { code: "KeyK", eng: "K", normal: "κ", shift: "Κ" },
        { code: "KeyL", eng: "L", normal: "λ", shift: "Λ" },
        { code: "Semicolon", eng: ";", normal: "´", shift: "¨" },
        { code: "Quote", eng: "'", normal: "'", shift: "\"" }
      ],
      [
        { code: "KeyZ", eng: "Z", normal: "ζ", shift: "Ζ" },
        { code: "KeyX", eng: "X", normal: "χ", shift: "Χ" },
        { code: "KeyC", eng: "C", normal: "ψ", shift: "Ψ" },
        { code: "KeyV", eng: "V", normal: "ω", shift: "Ω" },
        { code: "KeyB", eng: "B", normal: "β", shift: "Β" },
        { code: "KeyN", eng: "N", normal: "ν", shift: "Ν" },
        { code: "KeyM", eng: "M", normal: "μ", shift: "Μ" },
        { code: "Comma", eng: ",", normal: ",", shift: "<" },
        { code: "Period", eng: ".", normal: ".", shift: ">" },
        { code: "Slash", eng: "/", normal: "/", shift: "?" }
      ]
    ]
  }
};
