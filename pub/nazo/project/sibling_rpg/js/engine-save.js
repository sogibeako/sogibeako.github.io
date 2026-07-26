function formatUnitStatus(unit) {
  if (unit.genki <= 0) {
    return `
    <div class="status-danger" style="line-height:1.8; text-align:center; padding:12px 0;">
      <div style="font-weight:bold; font-size:14px; color:#fff; margin-bottom:6px;">
        ${esc(unit.name)} <span style="font-size:11px; color:#888;">Lv.${unit.level}</span>
      </div>
      <div style="font-size:24px; margin-bottom:4px;">🥐</div>
      <div style="font-weight:bold; font-size:13px; color:#ffcc88;">
        焼きたてツヤツヤのパン
      </div>
      <div style="font-size:11px; color:#ffaaaa; margin-top:4px;">
        戦闘不能${unit.resting ? " / 休養中" : ""}
      </div>
    </div>
  `;
  }

  const ratio = unit.genki / Math.max(1, unit.maxGenki);
  const cls =
    unit.resting ? "status-rest" :
      unit.skipNextAdventure ? "status-rest" :
        ratio > 0.6 ? "status-good" :
          ratio > 0.3 ? "status-warn" :
            "status-danger";

  const nextExp = expToNextLevel(unit.level);
  const limitPct = Math.min(100, Math.floor((unit.limit || 0) / 100 * 100));

  return `
    <div class="${cls}" style="line-height:1.8">
      <div style="font-weight:bold; font-size:14px; color:#fff;">${esc(unit.name)} <span style="font-size:11px; color:#888;">Lv.${unit.level}</span></div>
      <div>げんき ${unit.genki} / ${unit.maxGenki}</div>
      <div>パワー ${unit.power} / まもり ${unit.guard} / 速さ ${unit.spd}</div>
      <div>EXP ${unit.exp} / ${nextExp}</div>
      ${unit.resting ? `<div>休憩中</div>` : unit.skipNextAdventure ? `<div>へとへと</div>` : ""}
      <div class="limit-gauge-wrap" style="height:4px; margin-top:4px;">
        <div class="limit-gauge ${limitPct >= 100 ? 'full' : ''}" style="width:${limitPct}%"></div>
      </div>
      ${unit.status && unit.status.length > 0 ? `<div style="color:#bb88ff; font-size:11px; margin-top:2px;">[${unit.status.join(", ")}]</div>` : ""}
    </div>
  `;
}

function restNow() {
  const now = Date.now();

  // まず、休憩完了の自動解除チェック
  clearRestIfFinished();

  if (now < gameState.timer.nextAdventureAt) {
    updateGamePanel();
    return;
  }

  playRestSound();

  const isExhausted =
    gameState.brother.skipNextAdventure || gameState.sister.skipNextAdventure;

  // へとへと時は「休憩モードに入る」
  if (isExhausted) {
    gameState.brother.resting = true;
    gameState.sister.resting = true;

    gameState.meta.lastPointGain = 0;
    const sisterRestLine = pick(REST_SISTER_LINES);

    gameState.meta.lastResultHtml = `
      <div class="result-log-line">二人はへとへとだったので、今日は冒険せず休むことにした。</div>
      <div class="result-log-line">${esc(sisterRestLine)}</div>
      <div class="result-log-line">しっかり休めば、次のタイミングでまた動けるようになる。</div>
    `;

    gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;

    const contentEl = document.getElementById("content");
    if (contentEl) {
      contentEl.innerHTML = "";
    }

    saveGame();
    updateGamePanel();
    showPointGainFx(0);
    scrollToTopSmooth();
    return;
  }

  // 通常の休憩
  const brotherBefore = gameState.brother.genki;
  const sisterBefore = gameState.sister.genki;

  const brotherHalf = Math.floor(gameState.brother.maxGenki * 0.5);
  const sisterHalf = Math.floor(gameState.sister.maxGenki * 0.5);

  const brotherTarget = Math.max(
    brotherHalf,
    Math.min(
      gameState.brother.maxGenki,
      gameState.brother.genki + Math.floor(gameState.brother.maxGenki * 0.25)
    )
  );

  const sisterTarget = Math.max(
    sisterHalf,
    Math.min(
      gameState.sister.maxGenki,
      gameState.sister.genki + Math.floor(gameState.sister.maxGenki * 0.25)
    )
  );

  gameState.brother.genki = brotherTarget;
  gameState.sister.genki = sisterTarget;

  const brotherHeal = gameState.brother.genki - brotherBefore;
  const sisterHeal = gameState.sister.genki - sisterBefore;

  gameState.meta.lastPointGain = Math.max(
    1,
    Math.floor(2 + (gameState.brother.level + gameState.sister.level) * 0.15)
  );
  gameState.meta.totalAdventurePoints += gameState.meta.lastPointGain;

  const sisterRestLine = pick(REST_SISTER_LINES);

  gameState.meta.lastResultHtml = `
    <div class="result-log-line">二人は今日は冒険せず、静かに休んだ。</div>
    <div class="result-log-line">兄は ${brotherHeal}、妹は ${sisterHeal} げんきを回復した。</div>
    <div class="result-log-line">${esc(sisterRestLine)}</div>
    <div class="result-log-line">冒険ポイントは ${gameState.meta.lastPointGain} 増えた。</div>
  `;

  gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;

  const contentEl = document.getElementById("content");
  if (contentEl) {
    contentEl.innerHTML = "";
  }

  saveGame();
  updateGamePanel();
  showPointGainFx(gameState.meta.lastPointGain);
  scrollToTopSmooth();
}

function clearRestIfFinished() {
  const now = Date.now();
  const finished = now >= gameState.timer.nextAdventureAt;

  const someoneResting = gameState.brother.resting || gameState.sister.resting;
  if (!someoneResting || !finished) return false;

  recoverFromExhaustion(gameState.brother);
  recoverFromExhaustion(gameState.sister);

  gameState.brother.resting = false;
  gameState.sister.resting = false;

  const wakeLine = pick([
    "「いっぱい休んだら、なんか頭の中までふわっとした！」妹が伸びをしている。",
    "「もうだいじょうぶ！ たぶん前よりちょっとつよい！」妹は元気を取り戻したようだ。",
    "「お兄ちゃん、休んだら世界がちょっとだけやさしく見えるね」妹がにこっとしている。"
  ]);

  gameState.meta.lastResultHtml = `
  <div class="result-log-line">二人はしっかり休んで、元気を取り戻した。</div>
  <div class="result-log-line">「へとへと」状態は解除された。</div>
  <div class="result-log-line">${esc(wakeLine)}</div>
  <div class="result-log-line">また冒険に出られる。</div>
`;

  saveGame();
  scrollToTopSmooth();
  return true;
}