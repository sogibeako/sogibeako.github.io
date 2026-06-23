// app.js

document.addEventListener('DOMContentLoaded', () => {
  const langSelector = document.getElementById('lang-selector');
  const editor = document.getElementById('editor');
  const keyboardEl = document.getElementById('keyboard');
  const copyBtn = document.getElementById('copy-btn');
  const copyToast = document.getElementById('copy-toast');
  const inputGuide = document.getElementById('input-guide');

  let currentMode = langSelector.value;
  const ime = new IME(currentMode);
  let isShiftPressed = false;

  // Initialize
  renderKeyboard();
  updateInputGuide();
  editor.focus();

  // Mode switching
  langSelector.addEventListener('change', (e) => {
    currentMode = e.target.value;
    ime.setMode(currentMode);
    renderKeyboard();
    updateInputGuide();
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
          insertMappedKey(keyData.code, keyData.clickShift ? true : isShiftPressed, '');
          keyEl.classList.add('active');
          setTimeout(() => keyEl.classList.remove('active'), 120);
        });
        rowEl.appendChild(keyEl);
      });
      
      keyboardEl.appendChild(rowEl);
    });
  }

  function updateInputGuide() {
    const guides = {
      ko: '2ボル式。英字キーからハングルを音節単位で合成します。',
      ru: 'ロシア語標準配列です。Shiftで大文字になります。',
      el: '現代ギリシャ語配列です。; の後に母音でアクセントを入力できます。',
      grc: '簡単入力：y^→ῦ、a-→ᾱ、i-→ῑ、y-→ῡ、e-→η、o-→ω（ωはVキーでも入力）／ [ ᾿、Shift+[ ῾、; ´、\' ͅ',
      grcLatn: 'ラテン転写：u^→û、o-→ō（同様に â ê î ô ŷ ／ ā ē ī ū ȳ）。JIS配列の ^ キーにも対応します。',
      vi: 'Telex式：aa→â, aw→ă, dd→đ, ee→ê, oo→ô, ow→ơ, uw→ư／声調 s f r x j／zで解除'
    };
    inputGuide.textContent = guides[currentMode] || '';
  }

  function insertMappedKey(code, shiftKey, eventKey) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const leftText = editor.value.substring(0, start);
    const lastChar = start === end && start > 0 ? leftText.slice(-1) : '';
    const result = ime.processKey(lastChar, code, shiftKey, eventKey, leftText);

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
