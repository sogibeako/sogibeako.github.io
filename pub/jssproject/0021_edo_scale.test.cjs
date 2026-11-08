const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '0021_edo_scale.htm'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function load(extra = {}) {
  const app = vm.createContext(extra);
  vm.runInContext(script, app);
  return app;
}
const plain = value => JSON.parse(JSON.stringify(value));
const major = (app, period = 1200) => app.analyzeScale('', 'LLsLLLs', 'L:s=2:1', 'word-priority', period);

test('requested (2,2) example: all seven chords and earliest representatives', () => {
  const app = load();
  const chords = plain(app.buildChords(major(app), app.parseChordForm('(2,2)')));
  assert.deepEqual(chords.map(c => c.cents), [
    [0, 400, 700], [200, 500, 900], [400, 700, 1100], [500, 900, 1200],
    [700, 1100, 1400], [900, 1200, 1600], [1100, 1400, 1700]
  ]);
  assert.deepEqual(chords.map(c => c.root), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(chords.map(c => c.representative), [0, 1, 1, 0, 0, 1, 6]);
});

test('form accepts optional parentheses, whitespace, full-width digits, and extended chords', () => {
  const app = load();
  for (const input of ['(2,2)', '2, 2', ' （２，２） ', '( 2 , 2 )']) {
    assert.deepEqual(plain(app.parseChordForm(input)), [2, 2]);
  }
  assert.deepEqual(plain(app.buildChords(major(app), app.parseChordForm('(2,2,2)')))[0].cents, [0, 400, 700, 1100]);
  for (const input of ['', '()', '(2,)', '(2,,2)', '(2,2', '2,2)', '0,2', '-1,2', '1.5,2', '2 2', '2e1', '<b>2</b>', '9007199254740992', Array(33).fill(2).join(',')]) {
    assert.throws(() => app.parseChordForm(input), undefined, input);
  }
});

test('moves accumulate across multiple periods, including non-octave periods', () => {
  const app = load();
  const chords = plain(app.buildChords(major(app, 1900), [7, 14]));
  assert.deepEqual(chords[0].cents, [0, 1900, 5700]);
  assert.deepEqual(chords.map(c => c.representative), [0, 0, 0, 0, 0, 0, 0]);
  assert.ok(Math.abs(chords[6].cents[2] - (5700 + 1900 * 11 / 12)) < 1e-9);
});

test('classification compares every interval without rounding cents or folding octaves', () => {
  const app = load();
  for (const period of [1200, 1901.955, 0.00001]) {
    const chords = plain(app.buildChords(major(app, period), [1, 1]));
    assert.deepEqual(chords.map(c => c.representative), [0, 1, 2, 0, 0, 1, 2]);
  }
  const unisonScale = app.analyzeScale('', 'L', 'L=1', 'word-priority');
  assert.deepEqual(plain(app.buildChords(unisonScale, [2, 2])), [{ root: 0, cents: [0, 2400, 4800], representative: 0 }]);
});

test('rotated scales and addition results both produce chords', () => {
  const app = load();
  const rotated = app.analyzeScale('', 'LsLLLsL', 'L:s=2:1', 'word-priority');
  assert.deepEqual(plain(app.buildChords(rotated, [2, 2])).map(c => c.representative), [0, 0, 2, 2, 0, 5, 2]);
  const scale = major(app);
  assert.deepEqual(plain(app.buildChords(app.addScales(scale, scale), [2, 2])), plain(app.buildChords(scale, [2, 2])));
  assert.throws(() => app.buildChords(scale, [Number.MAX_SAFE_INTEGER]));
  assert.throws(() => app.buildChords(major(app, -1200), [2, 2]));
});

function audioFixture() {
  const voices = [];
  const message = { innerHTML: '', textContent: '', className: '' };
  class AudioContext {
    state = 'running';
    sampleRate = 48000;
    currentTime = 10;
    destination = {};
    createOscillator() {
      const osc = {
        frequency: {}, connect() {}, disconnect() { this.disconnected = true; },
        start(time) { this.startTime = time; }, stop(time) { this.stopTime = time; }
      };
      voices.push(osc);
      return osc;
    }
    createGain() {
      return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} };
    }
  }
  return { app: load({ window: { AudioContext }, document: { getElementById: () => message } }), voices, message };
}

test('chord playback schedules all notes together with their original cent pitches and resets buttons', async () => {
  const { app, voices } = audioFixture();
  const button = {};
  await app.playChord([200, 500, 900], button, 'sing');
  assert.equal(button.disabled, true);
  assert.equal(voices.length, 3);
  assert.equal(new Set(voices.map(v => v.startTime)).size, 1);
  [200, 500, 900].forEach((cents, i) => assert.ok(Math.abs(voices[i].frequency.value - 440 * 2 ** (cents / 1200)) < 1e-9));
  voices[2].onended();
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, '▶ 再生');
  assert.ok(voices.every(v => v.disconnected));
});

test('selecting a new chord stops the previous one; out-of-range notes fail clearly', async () => {
  const { app, voices, message } = audioFixture();
  const first = {};
  const second = {};
  await app.playChord([0, 400, 700], first, 'sing');
  await app.playChord([0, 300, 700], second, 'add');
  assert.equal(first.disabled, false);
  assert.ok(voices.slice(0, 3).every(v => v.disconnected));
  assert.equal(second.disabled, true);
  await app.playChord([120000], {}, 'sing');
  assert.equal(second.disabled, false);
  assert.equal(voices.length, 6);
  assert.match(message.textContent, /音域/);
});
