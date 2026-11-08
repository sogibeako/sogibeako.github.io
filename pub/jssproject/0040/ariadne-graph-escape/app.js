'use strict';
const $ = id => document.getElementById(id), NS = 'http://www.w3.org/2000/svg'; let game = new AriadneGame(), best = 0, playStarted = false;
let rankings = [], scoreRegistered = false, rankingReadFailed = false; let inspectedGame = null, creditsGame = null;
try { best = Number(localStorage.getItem('ariadne-best')) || 0; } catch { }
try { rankings = AriadneScores.normalize(JSON.parse(localStorage.getItem(AriadneScores.KEY) || '[]')); } catch { rankingReadFailed = true; }
function showScores() {
    $('ranking-body').replaceChildren(); rankings.forEach((entry, i) => { const row = document.createElement('tr'); for (const value of [i + 1, entry.name, (entry.won ? '☆ ' : '') + entry.score.toLocaleString(), entry.floor + 'F', entry.turn + (entry.difficulty === 'normal' ? '（ノーマル）' : '（ハード）')]) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); } $('ranking-body').append(row); });
    $('ranking-empty').hidden = rankings.length > 0;
    const eligible = game.ended && !game.debug && !scoreRegistered && AriadneScores.qualifies(rankings, game.score);
    $('score-form').hidden = !eligible || rankingReadFailed;
    $('score-status').textContent = game.debug ? 'デバッグ探索はランキング対象外です。' : rankingReadFailed ? '保存済み記録を読み込めませんでした。既存の記録を保護するため登録を停止しています。' : scoreRegistered ? 'この探索のスコアは登録済みです。' : eligible ? `${game.score.toLocaleString()} pt — ベスト10に登録できます！` : game.ended ? '今回はベスト10に届きませんでした。次の探索で挑戦しましょう。' : '探索が終わると、スコアを登録できます。';
    if (!$('score-dialog').open) $('score-dialog').showModal();
    if (eligible && !rankingReadFailed) $('player-name').focus();
}
$('show-scores').onclick = showScores; $('register-score').onclick = showScores; $('close-scores').onclick = () => $('score-dialog').close();
$('score-form').onsubmit = e => {
    e.preventDefault(); if (scoreRegistered || game.debug) return; try {
        const saved = AriadneScores.normalize(JSON.parse(localStorage.getItem(AriadneScores.KEY) || '[]'));
        const next = AriadneScores.register(saved, $('player-name').value, game);
        localStorage.setItem(AriadneScores.KEY, JSON.stringify(next)); rankings = next; scoreRegistered = true; showScores(); render();
    } catch (error) { $('score-status').textContent = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? '保存できませんでした。ブラウザーの保存設定・空き容量を確認して再試行してください。' : error.message; }
};
function element(name, attrs, parent, text) { const el = document.createElementNS(NS, name); for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value); if (text !== undefined) el.textContent = text; parent.append(el); return el; }
const soundBank = new Map(['ax_attack', 'bell', 'gameover', 'magic_cast', 'money', 'step', 'sword_attack'].map(name => { const clip = new Audio(`../material/se/${name}.wav`); clip.preload = 'auto'; return [name, clip]; }));
let seVolume = .45; let soundEnabled = true; const playingSounds = new Set();
$('sound-toggle').onclick = () => { soundEnabled = !soundEnabled; $('sound-toggle').textContent = soundEnabled ? '効果音 ON' : '効果音 OFF'; $('sound-toggle').setAttribute('aria-pressed', String(soundEnabled)); if (!soundEnabled) for (const clip of playingSounds) { clip.pause(); playingSounds.delete(clip); } };
function playSounds() { for (const name of game.takeSounds()) { if (!soundEnabled) continue; const source = soundBank.get(name); if (!source) continue; const clip = source.cloneNode(); clip.volume = seVolume; playingSounds.add(clip); const done = () => playingSounds.delete(clip); clip.onended = clip.onerror = done; clip.play().catch(done); } }
const music = new AriadneMusic(ARIADNE_MUSIC, new Audio());
for (const [id, initial] of [['bgm', 25], ['se', 45]]) {
    let value = initial; try { const saved = localStorage.getItem('ariadne-' + id + '-volume'); if (saved !== null && Number.isFinite(Number(saved))) value = Math.max(0, Math.min(100, Number(saved))); } catch { }
    const control = $(id + '-volume'); control.value = value;
    const apply = () => { const v = Number(control.value); $(id + '-value').textContent = v + '%'; if (id === 'bgm') music.audio.volume = v / 100; else { seVolume = v / 100; for (const clip of playingSounds) clip.volume = seVolume; } try { localStorage.setItem('ariadne-' + id + '-volume', String(v)); } catch { } };
    control.oninput = apply; apply();
}
for (const event of ['pointerdown', 'keydown']) document.addEventListener(event, () => { if (playStarted) music.unlock(); }, { capture: true });
async function refreshMusic() { try { const response = await fetch('/api/music', { cache: 'no-store' }); if (!response.ok) return; const tracks = await response.json(); if (Array.isArray(tracks) && tracks.every(t => typeof t === 'string' && t.startsWith('../material/music/'))) music.addTracks(tracks); } catch { } }
if (location.protocol !== 'file:') { refreshMusic(); setInterval(refreshMusic, 30000); }
function render() {
    if (!playStarted) return;
    if (music.run !== game) for (const clip of playingSounds) { clip.pause(); playingSounds.delete(clip); }
    music.sync(game);
    playSounds();
    $('player-status').textContent = [`${game.difficulty === 'normal' ? 'ノーマル' : 'ハード'} · 回復 ${game.recoveryRate.toFixed(1)}/ターン`, game.debug ? 'DEBUG' : null, game.emblem ? '" 謎の紋章（敵の直接攻撃×1.2）' : null, game.playerFrozen ? '金縛り（被攻撃で解除）' : null, game.confused ? `混乱：残り${game.confused}ターン` : null].filter(Boolean).join(' / '); $('floor').innerHTML = String(game.floor).padStart(2, '0') + '<span>F</span>'; $('turn').textContent = String(game.turn).padStart(3, '0'); $('hp').textContent = `${game.hp} / ${game.maxHp}`; $('health').style.width = (game.hp / game.maxHp * 100) + '%'; $('health').style.background = game.hp / game.maxHp < .3 ? 'var(--red)' : 'var(--teal)'; $('level').textContent = 'LV. ' + String(game.level).padStart(2, '0'); $('level-progress').textContent = `次のLVまで：${game.level >= 10 ? 'メガタウロス' : '敵'} ${game.levelKills} / ${game.killsToLevel} 体`; $('level').title = `剣 ${game.swordBase} ±${game.swordRange} / +3以上で追加攻撃`; $('score').textContent = (game.won ? '☆ ' : '') + game.score.toLocaleString(); if (!game.debug && game.score > best) { best = game.score; try { localStorage.setItem('ariadne-best', best); } catch { } } $('best').textContent = 'PERSONAL BEST  ' + best.toLocaleString(); $('map-info').textContent = `${{ fork: '糸の分かれ道', lattice: '格子の迷宮', irregular: '歪んだ回廊', puzzle: game.nodes.length + 'つの結び目' + (game.debug && game.puzzleLayout ? ` · 配置 ${game.puzzleLayout.layout + 1}${game.puzzleLayout.mirror ? '（反転）' : ''}` : '') }[game.mapKind]} · ${game.visited.size} / ${game.nodes.length} NODES`;
    $('wands').replaceChildren(); ARIADNE_WANDS.forEach((name, i) => { const button = document.createElement('button'); button.className = 'wand' + (game.aim === i ? ' active' : ''); button.disabled = !game.charges[i] || game.ended; button.innerHTML = `<span><kbd>${i + 1}</kbd>${name}</span><em>${game.charges[i]}</em>`; button.onclick = () => { game.equip(i); render(); }; $('wands').append(button); }); $('cancel').hidden = game.aim === null; $('mode').innerHTML = game.aim === null
  ? '<span class="map-controls-heading">移動</span>：矢印 / WASDで選択 → <kbd>Enter</kbd> で移動　　　'
  : `<span class="map-controls-heading">${ARIADNE_WANDS[game.aim]}</span> · <span class="map-controls-heading">方向選択</span>：矢印 / WASD　→　<span class="map-controls-heading">発射</span>：<kbd>Enter</kbd>`;
    const paths = game.aim !== null ? game.shotPaths() : []; game.shotIndex = Math.min(game.shotIndex ?? 0, Math.max(0, paths.length - 1));
    const chosen = paths[game.shotIndex], preview = chosen ? game.shotPreview(chosen) : null;
    function clearAngles() { $('angle-info').hidden = true; $('angle-info').replaceChildren(); $('angle-overlay')?.remove(); }
    function showAngles(path, index) {
        clearAngles(); const rejected = game.shotCandidates(path).filter(c => c.reasons.length), end = game.nodes[path.at(-1)];
        const heading = document.createElement('strong'); heading.textContent = `射線 ${index + 1} · 終点 ${end.id + 1} の先`; $('angle-info').append(heading);
        const overlay = element('g', { id: 'angle-overlay', 'aria-hidden': 'true' }, $('map'));
        element('polyline', { points: path.map(n => `${game.nodes[n].x},${game.nodes[n].y}`).join(' '), class: 'angle-path' }, overlay);
        if (!rejected.length) { const row = document.createElement('div'); row.textContent = 'この先の未通過ノードはありません。'; $('angle-info').append(row); }
        for (const candidate of rejected) {
            const node = game.nodes[candidate.node], turn = candidate.turnDegrees.toFixed(1), launch = candidate.launchDegrees.toFixed(1);
            const row = document.createElement('div'); row.textContent = `→ ノード ${node.id + 1}：曲がり角 ${turn}° / 射出方向から ${launch}° — ${candidate.reasons.join('・')}`; $('angle-info').append(row);
            element('line', { x1: end.x, y1: end.y, x2: node.x, y2: node.y, class: 'angle-rejected' }, overlay);
            element('circle', { cx: node.x, cy: node.y, r: 24, class: 'angle-target' }, overlay);
            element('text', { x: (end.x + node.x) / 2, y: (end.y + node.y) / 2 - 7, class: 'angle-label' }, overlay, `${turn}° / ${launch}°`);
            element('text', { x: node.x, y: node.y - 29, class: 'angle-label' }, overlay, `#${node.id + 1}`);
        }
        $('angle-info').hidden = false;
    }
    clearAngles(); $('enemy-info').hidden = true;
    $('aim-panel').hidden = game.aim === null; $('shot-options').replaceChildren();
    paths.forEach((path, i) => { const button = document.createElement('button'); button.textContent = `${i + 1}: 終点 ${path.at(-1) + 1} (${path.length - 1}辺)`; button.className = i === game.shotIndex ? 'active' : ''; button.setAttribute('aria-pressed', i === game.shotIndex); button.onclick = () => { game.shotIndex = i; render(); }; button.onmouseenter = button.onfocus = () => showAngles(path, i); button.onmouseleave = button.onblur = clearAngles; $('shot-options').append(button); });
    if (preview) {
        let text = `射線 ${game.shotIndex + 1} / ${paths.length} · 終点 ${chosen.at(-1) + 1} · `;
        if (!preview.enemy) text += '命中する敵なし';
        else if (game.aim === 1) text += `${preview.collision ? `対象 ${preview.damage}／衝突相手 ${preview.otherDamage}ダメージ` : `壁に衝突：${preview.damage}ダメージ`} · ${preview.landing === null ? '対象はパンに' : `着地 ${preview.landing + 1}`}${preview.collision?.hp <= 10 ? ' · 衝突相手もパンに' : ''}`;
        else text += `ノード ${preview.hit + 1} の敵に${ARIADNE_WANDS[game.aim]}`;
        $('shot-preview').textContent = text + '（発射直後の予測）';
    }
    const map = $('map'); map.replaceChildren(); let ray = chosen || game.ray;

    for (const [a, b] of game.edges) { let selected = (a === game.player && b === game.selected) || (b === game.player && a === game.selected); let onRay = ray.some((n, i) => i > 0 && ((ray[i - 1] === a && n === b) || (ray[i - 1] === b && n === a))); element('line', { x1: game.nodes[a].x, y1: game.nodes[a].y, x2: game.nodes[b].x, y2: game.nodes[b].y, class: 'edge' + (selected ? ' selected' : '') + (onRay ? ' ray' : '') }, map); }
    for (const enemy of game.enemies) if (enemy.build) { const a = game.nodes[enemy.build.from], b = game.nodes[enemy.build.to]; element('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'construction-edge' }, map); }
    for (const n of game.nodes) {
        const enemy = game.enemyAt(n.id), item = game.items.get(n.id), isPlayer = n.id === game.player, adj = game.nodes[game.player].links.includes(n.id); let char = '', color = '#a0b197', title = `ノード ${n.id + 1}${game.visited.has(n.id) ? ' · 探索済み' : ''}`;
        if (item) { char = item.kind === 'emblem' ? '"' : item.kind === 'wand' ? '/' : '$'; color = item.kind === 'wand' ? '#b9b2da' : '#dfc789'; title = item.kind === 'emblem' ? '謎の紋章 · 分かれ道の扉の鍵／所持中は敵の直接攻撃×1.2' : item.kind === 'wand' ? `${ARIADNE_WANDS[item.type]}の杖 · ${item.charges}回` : `ゴールド · ${item.value} pt`; }
        if (n.id === game.exit) { char = '>'; color = '#8ac6ac'; title = game.mapKind === 'fork' ? 'アリアドネの糸を結んだ出口 · 乗って > で帰還（+300,000 pt）' : '階段 · > キーで次の階へ'; } if (game.mapKind === 'fork' && n.id === game.door) { char = '⊠'; color = '#dfc789'; title = game.emblem ? `鍵付きの扉 · 乗って > で紋章を消費して${game.floor + 1}Fへ` : '鍵付きの扉 · 謎の紋章が必要'; } if (enemy) { char = enemy.decoy ? '@' : 'M'; color = enemy.frozen ? '#9cc6dc' : enemy.decoy ? '#b9b2da' : enemy.builder ? '#bd8960' : enemy.quantum ? '#f29fc7' : enemy.mage ? '#78db86' : enemy.underworld ? '#101010' : enemy.immortal ? '#45d6c5' : enemy.hero ? '#619eea' : enemy.mega ? '#ee83fa' : '#e58e7e'; title = game.enemyInfo(enemy); } if (isPlayer) { char = '@'; color = game.playerFrozen ? '#9cc6dc' : '#f1d99a'; title = `あなた · HP ${game.hp} · クリックで待機`; } const endpoint = paths.some(p => p.at(-1) === n.id); if (endpoint) title += ` · 射線の終点 ${n.id + 1}（クリックで選択）`;
        const g = element('g', { class: 'node' + (game.visited.has(n.id) ? ' visited' : '') + (adj ? ' adjacent' : '') + ((chosen ? chosen.at(-1) === n.id : n.id === game.selected) ? ' selected' : '') + (endpoint ? ' endpoint' : '') + (enemy?.mega && !enemy.decoy ? ' mega' : '') + (enemy?.builder && !enemy.decoy ? ' builder' : '') + (enemy?.quantum && !enemy.decoy ? ' quantum' : '') + (enemy?.phantom ? ' phantom' : '') + (enemy?.hero && !enemy.decoy ? ' hero' : '') + (enemy?.immortal && !enemy.decoy ? ' immortal' : '') + (enemy?.underworld && !enemy.decoy ? ' underworld' : '') + (enemy?.mage && !enemy.decoy ? ' mage' : '') + (enemy?.frozen || (isPlayer && game.playerFrozen) ? ' frozen' : ''), transform: `translate(${n.x},${n.y})`, role: 'button', tabindex: enemy ? '0' : (isPlayer || (game.aim === null ? adj : endpoint)) && !game.ended ? '0' : '-1', 'aria-label': title }, map); if (!enemy) element('title', {}, g, title); if (isPlayer) element('circle', { r: 22, class: 'halo' }, g); element('circle', { r: char ? 19 : 7, class: 'base' }, g); if (char) element('text', { fill: color, y: 0 }, g, char); if (enemy && !enemy.decoy && (enemy.builder || enemy.quantum || enemy.mega || enemy.mage || enemy.hero || enemy.immortal || enemy.underworld)) { const badgeColor = enemy.underworld && !enemy.frozen ? '#ffffff' : color; const badge = element('g', { class: 'enemy-badge', 'aria-hidden': 'true' }, g); element('circle', { cx: 17, cy: -17, r: 11, fill: '#18271f', stroke: badgeColor, 'stroke-width': 1.5 }, badge); element('text', { x: 17, y: -17, fill: badgeColor, style: 'font-size:15px;stroke:none' }, badge, enemy.builder ? 'B' : enemy.quantum ? 'Q' : enemy.mage ? 'M' : enemy.underworld ? 'D' : enemy.immortal ? 'U' : enemy.hero ? '3' : '2'); } if (enemy) { element('rect', { x: -15, y: 26, width: 30, height: 3, fill: '#3b3f34' }, g); element('rect', { x: -15, y: 26, width: enemy.immortal ? 30 : 30 * enemy.hp / (enemy.maxHp ?? (enemy.mega ? 90 : 45)), height: 3, class: 'enemy-hp' }, g); } if (game.mapKind === 'fork' && (n.id === game.exit || n.id === game.door)) element('text', { x: 0, y: 38, fill: '#dfc789', style: 'font-size:13px' }, g, n.id === game.exit ? '糸の出口 → 帰還' : '鍵付きの扉'); if (endpoint) element('text', { x: 0, y: -29, fill: '#a7d9ca', style: 'font-size:12px' }, g, String(n.id + 1));
        if (preview?.hit === n.id) element('circle', { r: 24, class: 'hit-marker' }, g);
        if (preview?.landing === n.id) element('circle', { r: 28, class: 'landing-marker' }, g);
        if (endpoint) { g.onmouseenter = g.onfocus = () => { const index = chosen?.at(-1) === n.id ? game.shotIndex : paths.findIndex(p => p.at(-1) === n.id); showAngles(paths[index], index); }; g.onmouseleave = g.onblur = clearAngles; }
        if (enemy) { const show = () => { $('enemy-info').textContent = game.enemyInfo(enemy); $('enemy-info').hidden = false; }; const hide = () => { $('enemy-info').hidden = true; }; g.addEventListener('mouseenter', show); g.addEventListener('focus', show); g.addEventListener('mouseleave', hide); g.addEventListener('blur', hide); }
        g.onclick = () => { if (game.ended) return; if (game.aim !== null && !isPlayer) { const candidates = paths.map((p, i) => p.at(-1) === n.id ? i : -1).filter(i => i >= 0); if (!candidates.length) return; game.shotIndex = candidates[(candidates.indexOf(game.shotIndex) + 1) % candidates.length]; render(); return; } if (game.move(n.id)) render(); }; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (game.aim !== null && e.key === 'Enter') $('fire-shot').onclick(); else g.onclick(); } };
    }
    $('logs').replaceChildren(); for (const entry of game.logs) { const row = document.createElement('div'); row.className = 'entry ' + entry.type; const time = document.createElement('time'); time.textContent = 'T ' + String(entry.turn).padStart(3, '0'); const message = document.createElement('span'); message.textContent = entry.text; row.append(time, message); $('logs').append(row); } fitLogRows(); $('end').hidden = !game.ended || inspectedGame === game; $('return-result').hidden = !game.ended || inspectedGame !== game; $('defeat-quote').hidden = !game.dead;
    document.body.classList.toggle('escaped', !!game.won); $('end').classList.toggle('ending', !!game.won); $('end-label').textContent = game.won ? 'THE THREAD LEADS HOME' : 'A LITTLE OVEN BREAK'; $('end-title').textContent = game.won ? 'おかえりなさい、テセウス。' : 'ただいま、焼き直し中。'; $('ending-credits').hidden = !game.won || creditsGame !== game; $('ending-message').hidden = !game.won || creditsGame === game; $('ending-next').hidden = !game.won || creditsGame === game; $('end-actions').hidden = game.won && creditsGame !== game; const staff = game.won && creditsGame === game; $('end').classList.toggle('staff-roll', staff); for (const id of ['end-label', 'end-title', 'end-score']) $(id).hidden = staff;
    if (game.dead) { if (!Object.hasOwn(game, 'defeatQuote')) game.defeatQuote = pickDefeatQuote(game.defeatCategory || 'default', game.flavorRandom); const quote = game.defeatQuote; $('defeat-quote').hidden = !quote; if (quote) { $('defeat-label').textContent = quote.label; $('defeat-ja').textContent = '「' + quote.ja + '」'; $('defeat-en').textContent = quote.en; $('defeat-source').textContent = quote.credit; $('defeat-source').href = /^https?:\/\//.test(quote.url || '') ? quote.url : '#'; } }
    $('register-score').disabled = scoreRegistered || game.debug; $('register-score').textContent = game.debug ? 'DEBUG：登録対象外' : scoreRegistered ? '登録済み' : 'スコアを登録'; $('end-score').textContent = `地下 ${game.floor} 階 / ${game.turn} ターン / ${game.won ? '☆ ' : ''}${game.score.toLocaleString()} pt`; $('descend').disabled = (game.player !== game.exit && !(game.mapKind === 'fork' && game.player === game.door)) || game.ended; $('descend').textContent = game.mapKind === 'fork' ? 'この先へ進む · M / >' : '階段を降りる · M / >';
    if (globalThis.AriadneTitle) AriadneTitle.save();
}
$('ending-next').onclick = () => { if (!game.won) return; creditsGame = game; render(); $('end').scrollTop = 0; $('register-score').focus(); };
$('view-final-board').onclick = () => { if (!game.ended) return; inspectedGame = game; render(); $('return-result').focus(); };
$('return-result').onclick = () => { inspectedGame = null; render(); $('view-final-board').focus(); };
function restart() { if (!game.ended && game.turn > 0 && !confirm('探索を最初からやり直しますか？')) return; game = new AriadneGame(undefined, undefined, game.difficulty); scoreRegistered = false; render(); }
$('fire-shot').onclick = () => { const path = game.shotPaths()[game.shotIndex]; if (path && game.fire(path.at(-1))) render(); };
$('restart').onclick = restart; $('retry').onclick = restart; $('cancel').onclick = () => { game.aim = null; game.ray = []; render(); }; $('help').onclick = $('title-help').onclick = () => $('instructions').showModal(); $('other-keys').onclick = () => $('key-instructions').showModal(); $('close-keys').onclick = () => $('key-instructions').close(); $('close-help').onclick = () => $('instructions').close(); $('descend').onclick = () => { game.descend(); render(); };
const heldKeys = new Set();
window.addEventListener('blur', () => heldKeys.clear());
document.addEventListener('keyup', e => heldKeys.delete(e.code));
document.addEventListener('keydown', e => {
    if (!playStarted || e.target.closest('input,textarea,select')) return; heldKeys.add(e.code);
    if (e.key === 'Enter' && heldKeys.has('KeyA') && heldKeys.has('KeyB') && !document.querySelector('dialog[open]')) { e.preventDefault(); e.stopImmediatePropagation(); heldKeys.clear(); $('debug-floor').value = game.floor; $('debug-level').value = game.level; $('debug-error').textContent = ''; $('debug-dialog').showModal(); }
}, true);
$('debug-layout').onchange = () => { $('debug-mirror').disabled = $('debug-layout').value === 'random'; }; $('debug-layout').onchange();
$('close-debug').onclick = () => $('debug-dialog').close();
$('debug-form').onsubmit = e => { e.preventDefault(); try { const next = new AriadneGame(undefined, undefined, game.difficulty); const choice = $('debug-layout').value; const [size, layout] = choice.split('-').map(Number); next.startDebug(Number($('debug-floor').value), Number($('debug-level').value), choice === 'random' ? null : { size, layout, mirror: $('debug-mirror').value === 'mirror' }); game = next; scoreRegistered = false; heldKeys.clear(); $('debug-dialog').close(); render(); } catch (error) { $('debug-error').textContent = error.message; } };
document.addEventListener('keydown', e => { if (!playStarted || e.target.closest('input,textarea,select')) return; if ($('instructions').open || $('key-instructions').open || $('score-dialog').open || $('debug-dialog').open) return; if (game.aim !== null && e.key === 'Enter') { e.preventDefault(); $('fire-shot').onclick(); return; } if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return; if (e.key === '?') { $('instructions').showModal(); return; } if (game.ended) return; if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return; const key = e.key.length === 1 ? e.key.toLowerCase() : e.key; const dirs = { ArrowUp: -Math.PI / 2, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowRight: 0, w: -Math.PI / 2, s: Math.PI / 2, a: Math.PI, d: 0 }; if (key in dirs) { e.preventDefault(); game.selectDirection(dirs[key]); render(); } else if (e.key === 'Enter') { e.preventDefault(); if (game.selected !== null) { game.move(game.selected); render(); } } else if (/^[1-4]$/.test(e.key)) { game.equip(Number(e.key) - 1); render(); } else if (e.key === 'Escape') { game.aim = null; game.selected = null; game.ray = []; render(); } else if (key === '>' || key === 'm') { e.preventDefault(); game.descend(); render(); } else if (e.key === '.') { game.wait(); render(); } });
render();

// Reserve space for the newest five entries, including wrapped lines.
function fitLogRows() { const logs = $('logs'); const rows = Array.from(logs.children).slice(0, 5); const height = Math.max(208, 28 + rows.reduce((sum, row) => sum + (row.offsetHeight || 36), 0) + (5 - rows.length) * 36); const size = height + 'px'; if (logs.style.minHeight !== size) logs.style.minHeight = size; }
if (typeof ResizeObserver !== 'undefined') { const logObserver = new ResizeObserver(fitLogRows); logObserver.observe($('logs')); }
window.addEventListener('resize', fitLogRows);
