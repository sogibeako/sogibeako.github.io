// app.js

document.addEventListener('DOMContentLoaded', () => {
  const langSelector = document.getElementById('lang-selector');
  const editor = document.getElementById('editor');
  const keyboardEl = document.getElementById('keyboard');
  const copyBtn = document.getElementById('copy-btn');
  const copyToast = document.getElementById('copy-toast');
  const inputGuide = document.getElementById('input-guide');

  let currentMode = langSelector.value;
  let inputMode = currentMode;
  const ime = new IME(inputMode);
  let isShiftPressed = false;

  // Initialize
  renderKeyboard();
  updateInputGuide();
  editor.focus();

  // Mode switching
  langSelector.addEventListener('change', (e) => {
    setMode(e.target.value);
    editor.focus();
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', () => {
    const text = editor.value;
    navigator.clipboard.writeText(text).then(() => {
      copyToast.classList.add('show');
      setTimeout(() => {
        copyToast.classList.remove('show');
      }, 2000);
      editor.focus();
    });
  });

  // Render on-screen keyboard
  function renderKeyboard() {
    keyboardEl.innerHTML = '';
    const layout = KEYBOARD_LAYOUTS[currentMode];
    keyboardEl.classList.toggle('native-mode', inputMode === 'native');
    if (!layout) return;

    layout.rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'key-row';
      
      row.forEach(keyData => {
        const keyEl = document.createElement('div');
        keyEl.className = 'key';
        keyEl.dataset.code = keyData.code;
        
        const engSpan = document.createElement('span');
        engSpan.className = 'eng';
        engSpan.textContent = keyData.eng;
        
        const targetSpan = document.createElement('span');
        targetSpan.className = 'target-char';
        targetSpan.textContent = isShiftPressed
          ? (keyData.displayShift || keyData.shift)
          : (keyData.display || keyData.normal);
        
        keyEl.appendChild(engSpan);
        keyEl.appendChild(targetSpan);
        keyEl.setAttribute('role', 'button');
        keyEl.setAttribute('aria-label', `${keyData.eng}: ${targetSpan.textContent}`);
        keyEl.addEventListener('pointerdown', (event) => {
          event.preventDefault();
          insertMappedKey(keyData.code, keyData.clickShift ? true : isShiftPressed, '', currentMode);
          keyEl.classList.add('active');
          setTimeout(() => keyEl.classList.remove('active'), 120);
        });
        rowEl.appendChild(keyEl);
      });
      
      keyboardEl.appendChild(rowEl);
    });
  }

  function setMode(mode) {
    if (mode === 'native') {
      inputMode = 'native';
    } else {
      currentMode = mode;
      inputMode = mode;
    }
    langSelector.value = mode;
    ime.setMode(inputMode);
    renderKeyboard();
    updateInputGuide();
  }

  function toggleNativeMode() {
    setMode(inputMode === 'native' ? currentMode : 'native');
  }

  function updateInputGuide() {
    const guides = {
      ko: 'Escで通常入力へ一時退避します。2ボル式。英字キーからハングルを音節単位で合成します。',
      ru: 'Escで通常入力へ一時退避します。ロシア語標準配列です。Shiftで大文字になります。',
      el: 'Escで通常入力へ一時退避します。現代ギリシャ語配列です。; の後に母音でアクセントを入力できます。',
      grc: 'Escで通常入力へ一時退避します。簡単入力：y^→ῦ、a-→ᾱ、i_→ῐ、i-→ῑ、e-→η、o-→ω（ωはVキーでも入力）／ [ ᾿、Shift+[ ῾、; ´、\' ͅ',
      grcLatn: 'Escで通常入力へ一時退避します。ラテン転写：u^→û、o-→ō、i_→ĭ、i_;→ĭ́（同様に â ê î ô ŷ ／ ā ē ī ū ȳ）。JIS配列の ^ キーにも対応します。',
      saLatn: 'Escで通常入力へ一時退避します。IAST風：aa→ā, ii→ī, uu→ū／r.→ṛ, r..→ṝ, t.→ṭ, d.→ḍ, n.→ṇ, s.→ṣ, m.→ṃ, h.→ḥ／s\'→ś, n\'→ṅ, n~→ñ',
      vi: 'Escで通常入力へ一時退避します。Telex式：aa→â, aw→ă, dd→đ, ee→ê, oo→ô, ow→ơ, uw→ư／声調 s f r x j／zで解除'
    };
    if (inputMode === 'native') {
      inputGuide.textContent = `通常入力モードです。Escで「${KEYBOARD_LAYOUTS[currentMode]?.name || '選択中の言語'}」入力に戻ります。キーボード表示は参照用に残しています。`;
    } else {
      inputGuide.textContent = guides[currentMode] || '';
    }
  }

  function insertMappedKey(code, shiftKey, eventKey, temporaryMode = null) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const leftText = editor.value.substring(0, start);
    const lastChar = start === end && start > 0 ? leftText.slice(-1) : '';
    if (temporaryMode) ime.setMode(temporaryMode);
    const result = ime.processKey(lastChar, code, shiftKey, eventKey, leftText);
    if (temporaryMode) ime.setMode(inputMode);

    if (!result) return false;
    let replaceStart = start;
    if (start === end) replaceStart = Math.max(0, start - result.replaceLength);
    editor.setRangeText(result.insertText, replaceStart, end, 'end');
    editor.focus({ preventScroll: true });
    return true;
  }

  // Handle Key Events on Window (for Shift state and highlighting)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift' && !isShiftPressed) {
      isShiftPressed = true;
      renderKeyboard();
    }
    
    // Highlight pressed key
    const keyEl = keyboardEl.querySelector(`.key[data-code="${e.code}"]`);
    if (keyEl) {
      keyEl.classList.add('active');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' && isShiftPressed) {
      isShiftPressed = false;
      renderKeyboard();
    }
    
    // Remove highlight
    const keyEl = keyboardEl.querySelector(`.key[data-code="${e.code}"]`);
    if (keyEl) {
      keyEl.classList.remove('active');
    }
  });

  // Handle IME Composition in Textarea
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleNativeMode();
      e.preventDefault();
      return;
    }

    // Ignore control keys to allow normal shortcuts (Ctrl+C, Ctrl+V, etc.)
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Process printable characters that might be mapped.
    if (e.key.length === 1) {
      if (insertMappedKey(e.code, e.shiftKey, e.key)) {
        e.preventDefault();
      }
    }
  });
});
