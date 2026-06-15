// Scripts are loaded sequentially in index.html, so we can access easyQuestions, HangulComposer, etc. directly.
// DOM Elements
const screens = {
  title: document.getElementById('title-screen'),
  game: document.getElementById('game-screen'),
  results: document.getElementById('results-screen')
};

const UI = {
  currentQ: document.getElementById('current-q'),
  prompt: document.getElementById('q-prompt'),
  roman: document.getElementById('q-roman'),
  desc: document.getElementById('q-desc'),
  input: document.getElementById('user-input'),
  feedback: document.getElementById('feedback-area'),
  imeToggle: document.getElementById('ime-sim-toggle'),
  speakBtn: document.getElementById('speak-btn'),
  keys: document.querySelectorAll('.key'),
  
  resCorrect: document.getElementById('res-correct'),
  resAccuracy: document.getElementById('res-accuracy'),
  resMistakes: document.getElementById('res-mistakes'),
};

const composer = new HangulComposer();

const KEYBOARD_LABELS = {
  Q: { normal: 'ㅂ', shift: 'ㅃ' },
  W: { normal: 'ㅈ', shift: 'ㅉ' },
  E: { normal: 'ㄷ', shift: 'ㄸ' },
  R: { normal: 'ㄱ', shift: 'ㄲ' },
  T: { normal: 'ㅅ', shift: 'ㅆ' },
  Y: { normal: 'ㅛ', shift: 'ㅛ' },
  U: { normal: 'ㅕ', shift: 'ㅕ' },
  I: { normal: 'ㅑ', shift: 'ㅑ' },
  O: { normal: 'ㅐ', shift: 'ㅒ' },
  P: { normal: 'ㅔ', shift: 'ㅖ' },
  A: { normal: 'ㅁ', shift: 'ㅁ' },
  S: { normal: 'ㄴ', shift: 'ㄴ' },
  D: { normal: 'ㅇ', shift: 'ㅇ' },
  F: { normal: 'ㄹ', shift: 'ㄹ' },
  G: { normal: 'ㅎ', shift: 'ㅎ' },
  H: { normal: 'ㅗ', shift: 'ㅗ' },
  J: { normal: 'ㅓ', shift: 'ㅓ' },
  K: { normal: 'ㅏ', shift: 'ㅏ' },
  L: { normal: 'ㅣ', shift: 'ㅣ' },
  Z: { normal: 'ㅋ', shift: 'ㅋ' },
  X: { normal: 'ㅌ', shift: 'ㅌ' },
  C: { normal: 'ㅊ', shift: 'ㅊ' },
  V: { normal: 'ㅍ', shift: 'ㅍ' },
  B: { normal: 'ㅠ', shift: 'ㅠ' },
  N: { normal: 'ㅜ', shift: 'ㅜ' },
  M: { normal: 'ㅡ', shift: 'ㅡ' }
};

// Game State
let gameState = {
  questions: [],
  currentIndex: 0,
  correctCount: 0,
  totalQuestions: 10,
  mistakesMap: {},
  isImeMode: true,
  hasMistakeOnCurrent: false,
  isTransitioning: false,
  isPlaying: false
};

function updateKeyboardShiftState(isShiftPressed) {
  UI.keys.forEach(keyElement => {
    const baseKey = keyElement.getAttribute('data-key');
    const label = KEYBOARD_LABELS[baseKey];
    if (!label) return;

    const korSpan = keyElement.querySelector('.kor');
    korSpan.textContent = isShiftPressed ? label.shift : label.normal;
    keyElement.classList.toggle('shifted-output', isShiftPressed && label.shift !== label.normal);
  });
}

// Initialization
// Prevent focus loss when clicking buttons to preserve OS IME state
document.getElementById('start-btn').addEventListener('mousedown', e => e.preventDefault());
document.getElementById('retry-btn').addEventListener('mousedown', e => e.preventDefault());

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', () => {
  gameState.isPlaying = false;
  showScreen('title');
});

UI.speakBtn.addEventListener('mousedown', e => e.preventDefault());
UI.speakBtn.addEventListener('click', playAudio);

function playAudio() {
  const q = gameState.questions[gameState.currentIndex];
  if (!q) return;
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Cancel ongoing
    const utterance = new SpeechSynthesisUtterance(q.answer);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85; // Slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  }
}

function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

function startGame() {
  gameState.isImeMode = UI.imeToggle.checked;
  gameState.questions = shuffle([...easyQuestions]).slice(0, gameState.totalQuestions);
  gameState.currentIndex = 0;
  gameState.correctCount = 0;
  gameState.mistakesMap = {};
  gameState.isPlaying = true;
  gameState.isTransitioning = false;
  
  showScreen('game');
  loadQuestion();
}

function loadQuestion() {
  gameState.isTransitioning = false;
  const q = gameState.questions[gameState.currentIndex];
  UI.currentQ.textContent = gameState.currentIndex + 1;
  UI.prompt.textContent = q.prompt;
  UI.roman.textContent = q.roman;
  UI.desc.textContent = q.meaning || q.description;
  
  UI.input.value = "";
  UI.input.className = "";
  UI.feedback.textContent = "";
  UI.feedback.style.color = "var(--text-secondary)";
  
  gameState.hasMistakeOnCurrent = false;
  composer.clear();
  updateKeyboardShiftState(false);
  UI.input.focus();
}

// Keyboard interactions
document.addEventListener('keydown', (e) => {
  updateKeyboardShiftState(e.getModifierState('Shift'));

  if (!gameState.isPlaying) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (screens.title.classList.contains('active')) {
        document.getElementById('start-btn').click();
      } else if (screens.results.classList.contains('active')) {
        document.getElementById('retry-btn').click();
      }
    }
    return;
  }
  if (document.activeElement !== UI.input) {
      UI.input.focus();
  }
  
  // Update keyboard UI
  UI.keys.forEach(k => {
    const baseKey = k.getAttribute('data-key');
    
    // Light up pressed key
    if (e.code === `Key${baseKey}`) {
      k.classList.add('active');
    }
  });
  
  // IME Intercept
  if (gameState.isImeMode) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      UI.input.value = composer.processKey('Backspace') || "";
    } else if (e.key === ' ') {
      e.preventDefault();
      UI.input.value = composer.processKey(' ') || "";
    } else if (ENG_TO_H_MAP[e.key]) {
      e.preventDefault();
      UI.input.value = composer.processKey(e.key) || "";
    }
  }

  if (e.key === 'Enter') {
    checkAnswer();
  }
});

document.addEventListener('keyup', (e) => {
  updateKeyboardShiftState(e.getModifierState('Shift'));

  if (!gameState.isPlaying) return;
  const baseKey = e.code.replace('Key', '');
  UI.keys.forEach(k => {
    if (k.getAttribute('data-key') === baseKey) {
      k.classList.remove('active');
    }
  });
});

window.addEventListener('blur', () => {
  updateKeyboardShiftState(false);
  UI.keys.forEach(k => k.classList.remove('active'));
});

function checkAnswer() {
  if (!gameState.isPlaying || gameState.isTransitioning) return;
  
  const q = gameState.questions[gameState.currentIndex];
  const inputVal = UI.input.value.trim();
  
  if (inputVal === "") return;

  if (inputVal === q.answer) {
    gameState.isTransitioning = true;
    // Correct
    UI.input.classList.remove('error');
    UI.input.classList.add('success');
    UI.feedback.style.color = "var(--success-color)";
    UI.feedback.textContent = "정답! (正解！)";
    
    if (!gameState.hasMistakeOnCurrent) {
      gameState.correctCount++; 
    }
    
    setTimeout(() => {
      gameState.currentIndex++;
      if (gameState.currentIndex >= gameState.totalQuestions) {
        endGame();
      } else {
        loadQuestion();
      }
    }, 800);
  } else {
    // Incorrect
    UI.input.classList.remove('success');
    UI.input.classList.add('error');
    
    const feedbackMsg = analyzeDifference(q.answer, inputVal);
    
    UI.feedback.style.color = "var(--error-color)";
    UI.feedback.textContent = "惜しい！\n" + feedbackMsg.join('\n');
    
    gameState.hasMistakeOnCurrent = true;
    
    // Record mistakes
    const diff = analyzeDifference(q.answer, inputVal);
    // Simple way to log mistakes: just log the expected target keys for this question
    q.keys.forEach(k => {
       const mappedKey = k.replace('Shift+', '');
       gameState.mistakesMap[mappedKey] = (gameState.mistakesMap[mappedKey] || 0) + 1;
    });
    
    // Flash error animation reset
    setTimeout(() => {
      UI.input.classList.remove('error');
    }, 400);
  }
}

function endGame() {
  gameState.isPlaying = false;
  showScreen('results');
  UI.resCorrect.textContent = gameState.correctCount;
  UI.resAccuracy.textContent = Math.round((gameState.correctCount / gameState.totalQuestions) * 100);
  
  const sortedMistakes = Object.entries(gameState.mistakesMap).sort((a, b) => b[1] - a[1]);
  if (sortedMistakes.length > 0) {
    UI.resMistakes.textContent = sortedMistakes.slice(0, 3).map(m => m[0]).join(', ');
  } else {
    UI.resMistakes.textContent = "なし！完璧です！";
  }
}
