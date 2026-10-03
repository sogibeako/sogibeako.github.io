// app.js

document.addEventListener('DOMContentLoaded', () => {
  const langSelector = document.getElementById('lang-selector');
  const editor = document.getElementById('editor');
  const keyboardEl = document.getElementById('keyboard');
  const copyBtn = document.getElementById('copy-btn');
  const copyToast = document.getElementById('copy-toast');

  let currentMode = langSelector.value;
  const ime = new IME(currentMode);
  let isShiftPressed = false;

  // Initialize
  renderKeyboard();
  editor.focus();

  // Mode switching
  langSelector.addEventListener('change', (e) => {
    currentMode = e.target.value;
    ime.setMode(currentMode);
    renderKeyboard();
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
        targetSpan.textContent = isShiftPressed ? keyData.shift : keyData.normal;
        
        keyEl.appendChild(engSpan);
        keyEl.appendChild(targetSpan);
        rowEl.appendChild(keyEl);
      });
      
      keyboardEl.appendChild(rowEl);
    });
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
    
    // Process printable characters that might be mapped
    // Include Space? Space is usually not mapped differently, but let's allow it to pass through
    if (e.key.length === 1) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      
      let lastChar = "";
      let replaceLength = 0;
      
      if (start === end && start > 0) {
        lastChar = editor.value.substring(start - 1, start);
      }

      const result = ime.processKey(lastChar, e.code, e.shiftKey, e.key);
      
      if (result) {
        e.preventDefault();
        
        let replaceStart = start;
        if (start === end) {
          replaceStart = start - result.replaceLength;
        }
        
        editor.setRangeText(result.insertText, replaceStart, end, "end");
        
        // Scroll to cursor
        editor.blur();
        editor.focus();
      }
    }
  });
});
