function updateGamePanel() {
  clearRestIfFinished();

  const brotherEl = document.getElementById("brotherStatus");
  const sisterEl = document.getElementById("sisterStatus");
  const timerEl = document.getElementById("timerStatus");
  const pointEl = document.getElementById("adventurePointStatus");
  const resultEl = document.getElementById("adventureResult");
  const restBtn = document.getElementById("restBtn");

  if (brotherEl) brotherEl.innerHTML = formatUnitStatus(gameState.brother);
  if (sisterEl) sisterEl.innerHTML = formatUnitStatus(gameState.sister);

  if (pointEl) {
    pointEl.textContent = `${gameState.meta.totalAdventurePoints}`;
  }

  if (resultEl) {
    resultEl.innerHTML = gameState.meta.lastResultHtml || "まだ冒険していません。";
  }

  renderBiomeDex();

  const now = Date.now();



  const remain = Math.max(0, gameState.timer.nextAdventureAt - now);
  const ready = remain <= 0;

  if (timerEl) {
    if (ready) {
      timerEl.innerHTML = `<span class="status-good">冒険できます</span>`;
    } else {
      const totalSec = Math.ceil(remain / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      timerEl.textContent = `${min}:${String(sec).padStart(2, "0")}`;
    }
  }

  const setupView = document.getElementById("dungeonSetupView");
  const activeView = document.getElementById("dungeonActiveView");

  if (setupView && activeView) {
    if (gameState.dungeon.active) {
      setupView.style.display = "none";
      activeView.style.display = "block";

      const progEl = document.getElementById("dungeonProgress");
      if (progEl) {
        progEl.textContent = `ダンジョン進行中: ${gameState.dungeon.currentFloor} / ${gameState.dungeon.maxFloor} 階層`;
      }


    } else {

      setupView.style.display = "block";
      activeView.style.display = "none";
    }
  }

  const btn = document.getElementById("genBtn");
  if (btn) {
    btn.style.display = gameState.dungeon.active ? "none" : "block";
    btn.disabled = !ready;
    btn.textContent = ready ? "ダンジョンに出発" : "次の冒険を待っています";
  }

  if (restBtn) {
    restBtn.style.display = gameState.dungeon.active ? "none" : "block";
    restBtn.disabled = !ready;
    restBtn.textContent = ready ? "休む" : "今は休憩待ち";
  }

  if (ready && !lastReadyState) {
    playAdventureReadySound();
  }
  lastReadyState = ready;
}

function getDangerLabel(level) {
  if (level <= 10) return "おだやか";
  if (level <= 25) return "やや危険";
  if (level <= 45) return "危険";
  if (level <= 70) return "かなり危険";
  if (level <= 100) return "禁忌級";
  if (level <= 150) return "超常級";
  return "理解不能級";
}

function makeDangerPreview(preview) {
  if (!preview) return "まだ観測されていません";

  const icon = preview.biomeIcon || "❔";
  const name = preview.biomeName || "未知の地形";

  if (preview.isChaosMap) {
    if (preview.chaosLevel === 3) {
      return `${icon} ${name} / 超混沌の気配がある。${preview.dangerHint}`;
    }
    return `${icon} ${name} / 混沌地形の予感がある。${preview.dangerHint}`;
  }

  return `${icon} ${name} / ${preview.dangerHint}`;
}

function refreshDangerPreview() {
  if (!queuedNextMap) {
    queuedNextMap = generateMap(currentDifficulty.center, currentDifficulty.spread, null);
  }
  gameState.meta.dangerPreviewText = makeDangerPreview(queuedNextMap);

  const el = document.getElementById("dangerPreview");
  if (el) el.innerHTML = esc(gameState.meta.dangerPreviewText);
}

// --- 図鑑 --------------------------------

function registerBiomeDex(map) {
  if (!map || !map.biomeName) return;

  if (!gameState.meta.biomeDex[map.biomeName]) {
    gameState.meta.biomeDex[map.biomeName] = {
      count: 0,
      icon: map.biomeIcon,
      highestLevel: 0
    };
  }

  const entry = gameState.meta.biomeDex[map.biomeName];
  entry.count += 1;
  entry.icon = map.biomeIcon;
  entry.highestLevel = Math.max(entry.highestLevel, map.level);
}

function renderBiomeDex() {
  const el = document.getElementById("biomeDex");
  if (!el) return;

  const entries = Object.entries(gameState.meta.biomeDex || {});
  if (entries.length === 0) {
    el.innerHTML = "まだ地形が記録されていません。";
    return;
  }

  entries.sort((a, b) => {
    const lvDiff = (b[1].highestLevel || 0) - (a[1].highestLevel || 0);
    if (lvDiff !== 0) return lvDiff;
    return b[1].count - a[1].count;
  });

  el.innerHTML = entries.map(([name, info]) => {
    return `
      <span class="dex-tag">
        ${esc(info.icon || "❔")} ${esc(name)}
        <span class="dex-count">×${info.count} / 最高危険度 ${info.highestLevel}</span>
      </span>
    `;
  }).join("");
}

// --- 妹コメント ----
function makeSisterExtraComment(map, result) {
  const danger = result.danger;
  const exhausted = result.exhausted;
  const defeated = result.defeated;

  const biomeId = map.biomeIds && map.biomeIds[0] ? map.biomeIds[0] : null;

  const REST_SISTER_LINES = [
    "「ねえお兄ちゃん、もし雲がぜんぶ綿あめだったら、空ってちょっとずつ低くなるのかな？」妹が真顔で言う。",
    "「魚って、寝てる時に『いま自分が泳いでる』って思ってるのかな？」妹は休みながら変なことを考えている。",
    "「お兄ちゃん。プリンって、やわらかいのに『立ってる』よね。えらいよね」妹が謎の尊敬をしている。",
    "「ねえ、影にも表と裏ってあるのかな？」妹が地面の影を指でなぞっている。",
    "「カニって横に歩くけど、本人の気持ちとしては前進なのかな……」妹はだいぶ自由だ。",
    "「もしも靴が寝言を言ったら、たぶん『今日は歩いたなあ』って言うよね」妹が靴を眺めている。",
    "「お兄ちゃん、ゼリーは飲み物と食べ物のあいだで悩んだことありそう」妹が急にゼリーの気持ちを代弁し始めた。",
    "「あのね、さっきからずっと考えてたんだけど、階段って畳んだら坂になるのかな？」妹の思考が斜めに滑っていく。",
    "「おにぎりって、山なのに食べられるんだね。すごいね」妹はたぶん少し疲れている。",
    "「もしも猫が算数できたら、絶対に都合のいい時だけ間違えると思う」妹が断言する。",
    "「お兄ちゃん、たまに『そこにあるだけでちょっと面白い石』あるよね」妹が石を一個だけ選んで見せてくる。",
    "「海ってしょっぱいけど、あれ全部おみそ汁だったらちょっと怖いね……」妹が自分で言って少し笑う。"
  ];

  const defeatLines = [
    "「ご、ごめん……もう動けない……」妹がその場にへたりこんだ。",
    "「だめだったぁ……でも、生きて帰れただけえらいよ……」妹はぐったりしている。"
  ];

  const lowDanger = [
    "「今日はちょっと探検って感じだったね」妹がほっとしている。",
    "「変だったけど、ちょっと楽しかった！」妹が元気そうだ。"
  ];

  const midDanger = [
    "「ちょっと怖かったけど、お兄ちゃんがいたから平気だった」妹が息を整える。",
    "「変な音いっぱいしたね……でも無事でよかったぁ」妹が肩の力を抜く。"
  ];

  const highDanger = [
    "「いまのは、かなり危なかった気がする……」妹が真顔で言う。",
    "「次はもうちょっとだけ優しい地形がいいな……」妹が遠い目をしている。"
  ];

  const exhaustedLines = [
    "「も、もうだめ……今日は帰ってふにゃふにゃする……」妹がへたりこんだ。",
    "「お兄ちゃん、私たちちゃんと帰れてえらいよ……」妹はかなりくたくだ。"
  ];

  const biomeFlavor = {
    undergroundLake: [
      "「暗い水って、見てるだけでちょっと疲れるね……」妹が兄の袖をつかんでいる。"
    ],
    cyber: [
      "「文字が多い地形って、なんか目がつかれる……」妹がぱちぱち瞬きをしている。"
    ],
    volcano: [
      "「熱いのって、それだけで元気減るんだね……」妹がぐったりしている。"
    ],
    ice: [
      "「寒いと動くだけで疲れるぅ……」妹が手をこすりあわせている。"
    ],
    sky: [
      "「高いところって、立ってるだけでどきどきする……」妹が慎重に深呼吸している。"
    ]
  };

  if (defeated) return pick(defeatLines);
  if (exhausted) return pick(exhaustedLines);

  if (biomeId && biomeFlavor[biomeId] && chance(45)) {
    return pick(biomeFlavor[biomeId]);
  }

  if (danger <= 20) return pick(lowDanger);
  if (danger <= 60) return pick(midDanger);
  return pick(highDanger);
}

// --- ポイント演出 ----
let lastReadyState = false;

function showPointGainFx(value) {
  const el = document.getElementById("pointGainFx");
  if (!el) return;

  if (!value || value <= 0) {
    el.textContent = "";
    return;
  }

  el.classList.remove("fx-pop");
  void el.offsetWidth;
  el.textContent = `+${value}`;
  el.classList.add("fx-pop");

  setTimeout(() => {
    if (el.textContent === `+${value}`) {
      el.textContent = "";
      el.classList.remove("fx-pop");
    }
  }, 1200);
}

// --- 休むボタン ---

// ─── DIFFICULTY SELECTOR ────────────────────────────────────────────
function renderDiffGrid() {
  const grid = document.getElementById('diffGrid');
  if (!grid) return;
  grid.innerHTML = DIFFICULTY_PRESETS.map(d => {
    const extra = d.id === "madness"
      ? `<div style="font-size:10px;color:#ff8888;margin-top:2px">非推奨</div>`
      : "";
    return `
      <button class="diff-btn ${currentDifficulty.id === d.id ? 'active' : ''}" onclick="setDiff('${d.id}')">
        <div class="icon">${d.icon}</div>
        <div class="label">${d.label}</div>
        ${extra}
      </button>
    `;
  }).join('');

  document.getElementById('diffDesc').innerHTML =
    `${currentDifficulty.desc}<span style="color:#333;margin-left:8px">(中心Lv.${currentDifficulty.center} ±${currentDifficulty.spread})</span>`;
}
function setDiff(id) {
  currentDifficulty = DIFFICULTY_PRESETS.find(d => d.id === id);

  renderDiffGrid();
  refreshDangerPreview();

  if (id === "madness") {
    gameState.meta.lastResultHtml = `
      <div class="result-log-line">難易度を「狂気」に変更した。</div>
      <div class="result-log-line">妹が「……それ、本当に行くの？」と不安そうにしている。</div>
    `;
    updateGamePanel();
  }

  saveGame();
}

// ─── DUNGEON FLOW: LINEAR ──────────────────────────────────────────────────────
function showDungeonIntro(map) {
  const activeView = document.getElementById("dungeonActiveView");
  const introPanel = document.getElementById("dungeonIntroPanel");
  const introBody = document.getElementById("dungeonIntroBody");
  const floorPanel = document.getElementById("dungeonFloorPanel");
  const battleView = document.getElementById("battleView");
  const nextFloorBtnWrap = document.getElementById("nextFloorBtnWrap");
  const proceedToBattleBtnWrap = document.getElementById("proceedToBattleBtnWrap");

  if (activeView) activeView.style.display = "block";
  if (introPanel) introPanel.style.display = "block";
  if (floorPanel) floorPanel.style.display = "none";
  if (battleView) battleView.style.display = "none";
  if (nextFloorBtnWrap) nextFloorBtnWrap.style.display = "none";
  if (proceedToBattleBtnWrap) proceedToBattleBtnWrap.style.display = "none";

  const progEl = document.getElementById("dungeonProgress");
  if (progEl) {
    progEl.textContent = `ダンジョン進行中: 0 / ${gameState.dungeon.maxFloor} 階層`;
  }

  if (!introBody) return;

  const monstersHtml = (map.monsters || [])
    .map(m => `・${esc(m.name)}`)
    .join("<br>");

  const itemsHtml = (map.items || [])
    .map(item => `・${esc(item)}`)
    .join("<br>");

  introBody.innerHTML = `
    <div style="text-align:center; margin-bottom:18px;">
      <div style="font-size:42px; margin-bottom:6px;">${esc(map.biomeIcon || "⬛")}</div>
      <div style="font-size:28px; font-weight:bold; color:#c8c0ff;">${esc(map.biomeName || "未知の地形")}</div>
      <div style="margin-top:8px; color:#e0dcd0;">LEVEL ${esc(String(map.level ?? "?"))}</div>
      <div style="margin-top:4px; color:#aaa;">${esc(map.tierInfo?.label || "")}</div>
    </div>

    <table class="info-table compact-table">
      <tr><th>🧭 世界情報</th><td>${esc(map.landscape || "不思議な景色が広がっている。").replace(/\n/g, "<br>")}</td></tr>
      <tr><th>植生・気候</th><td>${esc(map.vegetation || "").replace(/\n/g, "<br>")}<br>${esc(map.climate || "").replace(/\n/g, "<br>")}</td></tr>
      <tr><th>👧 妹</th><td>${esc(map.sisterComment || "").replace(/\n/g, "<br>")}</td></tr>
      <tr><th>💎 採取可能アイテム</th><td>${itemsHtml || "—"}</td></tr>
      <tr><th>👹 出現モンスター</th><td>${monstersHtml || "—"}</td></tr>
      <tr><th>💧 水場</th><td>${esc(map.water || "").replace(/\n/g, "<br>")}</td></tr>
      <tr><th>🏗️ 地盤・建築</th><td>${esc(map.underground || "").replace(/\n/g, "<br>")}</td></tr>
    </table>
  `;
}

function enterDungeonFromIntro() {
  const introMap = gameState.dungeon.introMap;
  if (!introMap) return;

  gameState.dungeon.floorContext = {
    biomeIds: introMap.biomeIds || [introMap.blocks?.[0]?.name],
    biomeName: introMap.biomeName,
    biomeIcon: introMap.biomeIcon,
    isChaosMap: introMap.isChaosMap,
    chaosLevel: introMap.chaosLevel
  };

  const activeView = document.getElementById("dungeonActiveView");
  const introPanel = document.getElementById("dungeonIntroPanel");
  const floorPanel = document.getElementById("dungeonFloorPanel");
  const battleView = document.getElementById("battleView");
  const nextFloorBtnWrap = document.getElementById("nextFloorBtnWrap");
  const proceedToBattleBtnWrap = document.getElementById("proceedToBattleBtnWrap");

  if (activeView) activeView.style.display = "block";
  if (introPanel) introPanel.style.display = "none";
  if (floorPanel) floorPanel.style.display = "block";
  if (battleView) battleView.style.display = "none";
  if (nextFloorBtnWrap) nextFloorBtnWrap.style.display = "none";
  if (proceedToBattleBtnWrap) proceedToBattleBtnWrap.style.display = "none";

  saveGame();
  enterNextFloor();
}

function getEquivalentFloor() {
  const base = gameState.dungeon.baseDangerFloor || 1;
  const floorOffset = Math.max(0, (gameState.dungeon.currentFloor || 1) - 1);
  return base + floorOffset;
}


function startDungeon() {
  clearRestIfFinished();
  const now = Date.now();

  if (now < gameState.timer.nextAdventureAt) {
    updateGamePanel();
    return;
  }

  if (
    gameState.brother.skipNextAdventure ||
    gameState.sister.skipNextAdventure ||
    gameState.brother.resting ||
    gameState.sister.resting
  ) {
    gameState.meta.lastResultHtml = `
      <div class="result-log-line">二人はまだ休養が必要だ。</div>
      <div class="result-log-line">「休む」を押して、次のタイミングを待とう。</div>
    `;
    saveGame();
    updateGamePanel();
    return;
  }

  playAdventureStartSound();

  const btn = document.getElementById("genBtn");
  if (btn) {
    btn.blur();
    btn.textContent = "準 備 中 ...";
    btn.disabled = true;
  }

  const emptyEl = document.getElementById("empty");
  if (emptyEl) emptyEl.style.display = "none";

  setTimeout(() => {
    const partyAvgLv = (gameState.brother.level + gameState.sister.level) / 2;

    gameState.dungeon.active = true;
    gameState.dungeon.difficultyId = currentDifficulty.id;
    gameState.dungeon.currentFloor = 1;
    gameState.dungeon.maxFloor = getDungeonMaxFloor(currentDifficulty.id);
    gameState.dungeon.restsUsed = 0;
    gameState.dungeon.floorContext = null;

    gameState.brother.limit = 0;
    gameState.sister.limit = 0;
    gameState.brother.status = [];
    gameState.sister.status = [];

    gameState.meta.lastResultHtml = `
      <div class="result-log-line">「${currentDifficulty.label}」に出発した！</div>
    `;

    const introMap = generateMap(currentDifficulty.center, currentDifficulty.spread, null);
    gameState.dungeon.introMap = introMap;

    // 0階でダンジョン基準を固定
    const levelBasedFloor = Math.floor(Math.max(0, partyAvgLv - 5) * 0.6);
    const mapBasedFloor = Math.floor((introMap.level || 1) / 12);

    gameState.dungeon.baseMapLevel = introMap.level || currentDifficulty.center;
    gameState.dungeon.baseDangerFloor = Math.max(1, levelBasedFloor + mapBasedFloor);

    saveGame();
    updateGamePanel();
    scrollToTopSmooth();

    showDungeonIntro(introMap);

    const enterBtn = document.getElementById("enterDungeonBtn");
    if (enterBtn) {
      enterBtn.onclick = enterDungeonFromIntro;
    }
  }, 300);
}

function enterNextFloor() {
  console.log("enterNextFloor start");
  document.getElementById("dungeonFloorPanel").style.display = "block";
  document.getElementById("battleView").style.display = "none";
  document.getElementById("nextFloorBtnWrap").style.display = "none";
  document.getElementById("proceedToBattleBtnWrap").style.display = "none";

  const progEl = document.getElementById("dungeonProgress");
  if (progEl) {
    progEl.textContent = `ダンジョン進行中: ${gameState.dungeon.currentFloor} / ${gameState.dungeon.maxFloor} 階層`;
  }

  // Sibling RPG: Reuse the same biome!
  let context = gameState.dungeon.floorContext;
  const floorData = generateFloorContent(currentDifficulty, gameState.dungeon.currentFloor, context);

  // If floor 1, we must save the context that was randomly generated!
  if (!context) {
    gameState.dungeon.floorContext = {
      biomeIds: floorData.mapData.biomeIds || [floorData.mapData.blocks[0]?.name],
      biomeName: floorData.mapData.biomeName,
      biomeIcon: floorData.mapData.biomeIcon,
      isChaosMap: floorData.mapData.isChaosMap,
      chaosLevel: floorData.mapData.chaosLevel
    };
    saveGame();
  }
  const eventEl = document.getElementById("floorEvent");
  const sceneryEl = document.getElementById("floorScenery");
  const equivalentFloor = getEquivalentFloor();
  const mapLevel = floorData.mapData?.level ?? "?";

  sceneryEl.innerHTML = `
  <div style="font-size:12px; color:#c7c7d4; letter-spacing:2px; margin-bottom:8px;">
    ＊冒険の進捗＊
  </div>
  <div>
    ${gameState.dungeon.currentFloor} / ${gameState.dungeon.maxFloor} 階層<br>
    現在の危険度目安: <b>${equivalentFloor}階相当</b><br>
    地形LEVEL: <b>${mapLevel}</b><br>
    ${floorData.mapData?.biomeName || "不明な地形"} を探索中
  </div>
`;

  eventEl.innerHTML = "";

  // Handle Event
  let partyDiedInEvent = false;
  let effectLogs = [];

  if (floorData.events && floorData.events.length > 0) {
    floorData.events.forEach(ev => {
      // Use ev.type directly since EV_LABELS may not be available from map events directly.
      const tLabel = ev.typeLabel || ev.type;

      if (ev.type === "campsite") {
        const healBr = Math.floor(gameState.brother.maxGenki * 0.3);
        const healSi = Math.floor(gameState.sister.maxGenki * 0.3);
        gameState.brother.genki = Math.min(gameState.brother.maxGenki, gameState.brother.genki + healBr);
        gameState.sister.genki = Math.min(gameState.sister.maxGenki, gameState.sister.genki + healSi);
        effectLogs.push(`[${tLabel}] <b>${ev.title}</b><br/><span style="color:#aaa;">${ev.desc}</span><br/><span style="color:#00ff00;">二人のHPが回復した！</span>`);
      } else if (ev.type === "trap") {
        const dmgBr = Math.floor((Math.random() * 0.1 + 0.05) * gameState.brother.maxGenki);
        const dmgSi = Math.floor((Math.random() * 0.1 + 0.05) * gameState.sister.maxGenki);
        gameState.brother.genki -= dmgBr;
        gameState.sister.genki -= dmgSi;
        effectLogs.push(`[${tLabel}] <b>${ev.title}</b><br/><span style="color:#aaa;">${ev.desc}</span><br/><span style="color:#ff0000;">トラップで手痛いダメージを受けた！(一彌-${dmgBr} / 一埜-${dmgSi})</span>`);
      } else if (ev.type === "treasure") {
        const apGain = Math.floor(Math.random() * 10) + parseInt(floorData.mapData.level);
        gameState.meta.totalAdventurePoints += apGain;
        effectLogs.push(`[${tLabel}] <b>${ev.title}</b><br/><span style="color:#aaa;">${ev.desc}</span><br/><span style="color:#ffff00;">冒険ポイントを ${apGain} 獲得した！</span>`);
      } else {
        effectLogs.push(`[${tLabel}] <b>${ev.title}</b><br/><span style="color:#aaa;">${ev.desc}</span>`);
      }
    });

    refreshUnitStats(gameState.brother);
    refreshUnitStats(gameState.sister);

    if (gameState.brother.genki <= 0 && gameState.sister.genki <= 0) {
      partyDiedInEvent = true;
    }
  } else {
    effectLogs.push("特に変わった出来事は起こらなかった。");
  }

  eventEl.innerHTML = effectLogs.join("<br/><br/>");

  if (partyDiedInEvent) {
    handleLose("二人は力尽きてしまった……倒れたまま回収された。");
    return;
  }

  // Auto transition to battle
  const { enemies, peacefulText } = createEnemies(floorData.mapData);

  const isFinalFloor = gameState.dungeon.currentFloor >= gameState.dungeon.maxFloor;
  const finalFloorWarning = isFinalFloor
    ? `<br><br><b>この階の魔物たちは、異様な力に満ちている……！</b>`
    : "";

  if (isFinalFloor) {
    enemies.forEach((enemy, index) => {
      enemy.maxHp = Math.floor(enemy.maxHp * 10);
      enemy.hp = enemy.maxHp;
      enemy.power = Math.floor(enemy.power * 1.5);

      if (index === 0) {
        enemy.maxHp = Math.floor(enemy.maxHp * 1.5);
        enemy.hp = enemy.maxHp;
        enemy.power = Math.floor(enemy.power * 1.2);
      }
    });
  }

  const PEACEFUL_FOLLOWUP_LINES = [
    `二人は戦わず、そのまま先へ進むことにした。`,
    `二人は相手を刺激しないよう、静かに通り過ぎた。`,
    `戦いにはならず、二人はそっと距離を取った。`,
    `今回は争わずに済んだようだ。二人はほっとして先へ向かった。`
  ];

  const KAZUYA_PEACEFUL_LINES = [
    `一彌「触らぬ神に祟りなしだな！」`,
    `一彌「よし、ここは平和的撤収だ！」`,
    `一彌「眠ってるなら起こさないのが礼儀だな……！」`,
    `一彌「うむ、今日はパン工場を休業するとしよう！」`
  ];

  const KAZUNO_PEACEFUL_LINES = [
    `一埜「えへへ、寝顔可愛い……おやすみなさい！」`,
    `一埜「わ、起こしちゃだめだよ……！」`,
    `一埜「なんだかちょっとかわいかったね！」`,
    `一埜「ふふ、今日は見逃してあげようね！」`
  ];

  const BATTLE_FOREBODING_LINES = [
    `魔物の気配が近い……！`,
    `空気が張りつめている。戦闘の予感だ！`,
    `不穏な足音が響く。どうやら戦いになりそうだ。`,
    `物陰に殺気が走った。敵が現れそうだ！`
  ];

  const KAZUYA_BATTLE_LINES = [
    `一彌「来るぞ……！」`,
    `一彌「よし、構えろ……！」`,
    `一彌「今度は見逃してくれなさそうだな！」`,
    `一彌「平和的解決は、なさそうだ！」`
  ];

  const KAZUNO_BATTLE_LINES = [
    `一埜「う、うん……！」`,
    `一埜「わわっ、今度は本当に戦うの！？」`,
    `一埜「お兄ちゃん、気をつけてね……！」`,
    `一埜「えいえい、おー……！」`
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const baseEventText = effectLogs.join("<br><br>");
  const floorEventEl = document.getElementById("floorEvent");

  if (enemies.length === 0) {
    if (floorEventEl) {
      floorEventEl.innerHTML =
        (baseEventText ? baseEventText + "<br><br>" : "") +
        (peacefulText || "この階では危険な魔物には遭遇しなかった。") +
        `<br><br>${pick(PEACEFUL_FOLLOWUP_LINES)}` +
        `<br><br>${pick(KAZUYA_PEACEFUL_LINES)}` +
        `<br>${pick(KAZUNO_PEACEFUL_LINES)}` +
        finalFloorWarning;
    }

    document.getElementById("proceedToBattleBtnWrap").style.display = "none";
    document.getElementById("nextFloorBtnWrap").style.display = "block";

    const proceedFloorBtn = document.getElementById("proceedFloorBtn");
    if (proceedFloorBtn) {
      proceedFloorBtn.textContent = "次の階層へ";
      proceedFloorBtn.onclick = proceedFloor;
    }

    return;
  }

  if (floorEventEl) {
    floorEventEl.innerHTML =
      (baseEventText ? baseEventText + "<br><br>" : "") +
      `${pick(BATTLE_FOREBODING_LINES)}` +
      `<br>${pick(KAZUYA_BATTLE_LINES)}` +
      `<br>${pick(KAZUNO_BATTLE_LINES)}`;
  }

  const procBtnWrap = document.getElementById("proceedToBattleBtnWrap");
  procBtnWrap.style.display = "flex";
  procBtnWrap.style.gap = "12px";
  procBtnWrap.style.justifyContent = "center";
  procBtnWrap.innerHTML = `
  <button class="gen-btn" id="proceedToBattleBtn">戦闘へ進む</button>
  <button class="hist-btn" id="dungeonRestBtn" onclick="dungeonRest()">休む (残: ${2 - (gameState.dungeon.restsUsed || 0)}回)</button>
  <button class="hist-btn" id="retreatBtn" onclick="dungeonRetreat()">撤退する</button>
`;

  document.getElementById("proceedToBattleBtn").onclick = () => {
    procBtnWrap.style.display = "none";
    document.getElementById("battleView").style.display = "block";
    document.getElementById("floorScenery").style.color = "#666";
    gameState.dungeon.lastBattleDanger = floorData.mapData.level || (10 + gameState.dungeon.currentFloor);
    gameState.dungeon.lastBattleEnemyTotalLevel = enemies.reduce((sum, e) => sum + (e.level || 0), 0);
    startVisualBattle(
      floorData.mapData,
      gameState.brother,
      gameState.sister,
      enemies,
      onBattleWin,
      onBattleLose
    );
  };
}

function onBattleWin() {
  // 報酬
  const rawDanger = gameState.dungeon.lastBattleDanger || (10 + gameState.dungeon.currentFloor);
  const enemyTotalLevel = gameState.dungeon.lastBattleEnemyTotalLevel || 0;
  const danger = Math.floor(rawDanger * 0.5 + gameState.dungeon.currentFloor * 2);
  const enemyLevelBonus = Math.floor(enemyTotalLevel * 0.8); const partyBefore = calcPartyStats(gameState.brother, gameState.sister);
  const expGain = calcExperienceGain(danger + enemyLevelBonus, partyBefore);

  gameState.brother.exp += expGain.brotherExp;
  gameState.sister.exp += expGain.sisterExp;

  let levelUpHtml = "";
  if (applyLevelUps(gameState.brother)) levelUpHtml += ` 兄レベルUP!`;
  if (applyLevelUps(gameState.sister)) levelUpHtml += ` 妹レベルUP!`;

  const pts = calcAdventurePoints(danger);
  gameState.meta.totalAdventurePoints += pts;

  const logTerminal = document.getElementById("battleLogTerminal");
  const div = document.createElement("div");
  div.style.color = "#000000";
  div.innerHTML = `勝利！ 冒険ポイント+${pts} EXP+${expGain.brotherExp} ${levelUpHtml}`;
  logTerminal.appendChild(div);
  logTerminal.scrollTop = logTerminal.scrollHeight;

  showPointGainFx(pts);
  saveGame();
  updateGamePanel();

  const procBtn = document.getElementById("proceedFloorBtn");
  if (procBtn) {
    procBtn.textContent = "次の階層へ";
    procBtn.onclick = proceedFloor;
  }

  document.getElementById("nextFloorBtnWrap").style.display = "block";
}

function dungeonRest() {
  if (gameState.dungeon.restsUsed >= 2) return;
  gameState.dungeon.restsUsed = (gameState.dungeon.restsUsed || 0) + 1;
  const healBr = Math.floor(gameState.brother.maxGenki * 0.5);
  const healSi = Math.floor(gameState.sister.maxGenki * 0.5);
  gameState.brother.genki = Math.min(gameState.brother.maxGenki, gameState.brother.genki + healBr);
  gameState.sister.genki = Math.min(gameState.sister.maxGenki, gameState.sister.genki + healSi);

  const eventEl = document.getElementById("floorEvent");
  eventEl.innerHTML += `<br/><br/><span style="color:#00ff00;">【休憩】二人は少し休んだ。HPが大きく回復した！</span>`;

  document.getElementById("dungeonRestBtn").textContent = `休む (残: ${2 - gameState.dungeon.restsUsed}回)`;
  if (gameState.dungeon.restsUsed >= 2) {
    document.getElementById("dungeonRestBtn").style.opacity = 0.5;
    document.getElementById("dungeonRestBtn").onclick = null;
  }
  refreshUnitStats(gameState.brother);
  refreshUnitStats(gameState.sister);
  updateGamePanel();
}

function dungeonRetreat() {
  handleLose("無念の撤退……怪我を負いながらも命からがら帰還した。");
}

function proceedFloor() {
  playAdventureStartSound();
  document.getElementById("nextFloorBtnWrap").style.display = "none";

  gameState.dungeon.currentFloor += 1;
  saveGame();
  updateGamePanel();

  if (gameState.dungeon.currentFloor > gameState.dungeon.maxFloor) {
    gameState.dungeon.active = false;
    gameState.meta.lastResultHtml = `<div class="log-victory">【ダンジョンクリア！】 最深部まで到着し、帰還した！</div>`;
    gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;
    saveGame();
    updateGamePanel();
    return;
  }

  enterNextFloor();
}

function handleLose(reason) {
  gameState.dungeon.active = false;
  gameState.meta.lastResultHtml = `<div class="log-defeat">${esc(reason)}</div>`;

  gameState.brother.resting = true;
  gameState.sister.resting = true;
  gameState.brother.exhausted = false;
  gameState.sister.exhausted = false;
  gameState.brother.skipNextAdventure = false;
  gameState.sister.skipNextAdventure = false;
  gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;

  saveGame();
  updateGamePanel();
}

function onBattleLose() {
  const procBtn = document.getElementById("proceedFloorBtn");
  procBtn.textContent = "進む";
  procBtn.onclick = () => {
    handleLose("戦闘不能……二人はツヤツヤのパンになった。");
  };
  document.getElementById("nextFloorBtnWrap").style.display = "block";
}

// ─── UTILS & SOUNDS ───────────────────────────────────────────
function playSaveSound() { }
function playRestSound() { }
function playAdventureStartSound() { }
function playAdventureReadySound() { }
function playExhaustedSound() { }

function scrollToTopSmooth() {
  const el = document.getElementById('scrollAnchorTop');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ─── HISTORY ──────────────────────────────────────────────────
function toggleHistory() {
  historyVisible = !historyVisible;
  const p = document.getElementById('histPanel');
  if (p) p.style.display = historyVisible ? 'block' : 'none';
  renderHistoryPanel();
}

function renderHistBtn() {
  const w = document.getElementById('histBtnWrap');
  if (w) w.style.display = history.length > 0 ? 'block' : 'none';
}

function renderHistoryPanel() {
  const list = document.getElementById('histList');
  if (!list) return;
  if (history.length === 0) {
    list.innerHTML = '<div style="color:#666;font-size:12px;text-align:center">履歴なし</div>';
    return;
  }
  list.innerHTML = history.map((m, i) => {
    return `
      <div style="font-size:12px;color:#d8d2c8;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:6px">
        <span style="color:#666;margin-right:8px">[${history.length - i}]</span>
        ${m.biomeIcon} ${m.tierInfo.label}${m.biomeName} (Lv.${m.level})
      </div>
    `;
  }).join('');
}

// ─── INIT ──────────────────────────────────────────────────────
window.addEventListener('load', () => {
  initGameState(); // defined in engine-save.js or engine-battle.js
  setInterval(updateGamePanel, 1000);
  gameState.dungeon.active = false; // FORCED RESET FOR TESTING
  saveGame();
  renderDiffGrid();
  updateGamePanel();
});

;

// --- Map Rendering Helpers ---

function renderMap(m) {
  const lc = levelColor(m.level);
  const chaosClass = m.chaosLevel === 3 ? 'triple-chaos-text' : m.isChaosMap ? 'chaos-text' : '';
  const titleSize = m.biomeName.length > 12 ? '16px' : '24px';
  const titleLS = m.biomeName.length > 12 ? '1px' : '6px';
  const titleColor = m.chaosLevel === 3 ? '#ff88ff' : m.isChaosMap ? '#ff66ff' : '#e0dcd0';
  const borderColor = m.chaosLevel === 3 ? '#ff44ff33' : '#2a2a3a';
  const bgTitle = m.chaosLevel === 3 ? 'linear-gradient(180deg,#1a0a1f,#120a18)' : 'linear-gradient(180deg,#12121f,#0e0e1a)';
  const chaosBadge = m.isChaosMap
    ? `<span class="chaos-badge ${m.chaosLevel === 3 ? 'triple-badge' : ''}">${m.chaosLevel === 3 ? '超混沌マップ' : '混沌マップ'}</span>`
    : '';
  const lvClass = m.level > 100 ? 'high-level' : '';

  let html = `
  <div id="mapTop" class="section" style="text-align:center;margin-bottom:32px;padding:24px;border:1px solid ${borderColor};background:${bgTitle}">
      <div style="font-size:48px;margin-bottom:8px" class="${chaosClass}">${m.biomeIcon}</div>
      <h2 style="font-size:${titleSize};font-weight:900;letter-spacing:${titleLS};color:${titleColor};margin-bottom:8px;line-height:1.5" class="${chaosClass}">
        ${esc(m.tierInfo.label + m.biomeName)}
      </h2>
      ${chaosBadge}
      <div style="margin-top:12px;display:inline-block;padding:4px 20px;border:1px solid ${lc}44;color:${lc};font-size:14px;letter-spacing:3px" class="${lvClass}">
        LEVEL ${m.level}
      </div>
      <p style="margin-top:8px;font-size:12px;color:#888;letter-spacing:2px">${esc(m.tierInfo.desc)}</p>
    </div>
  `;

  // ① 世界描写系
  html += tableSection("世界情報", "🧭", [
    tableRow("隣接地形・移動", m.adjacencyMove),
    tableRow("この地形への到達", m.adjacencyArrival),
    tableRow("天候", m.weather),
    tableRow("風景", m.landscape),
    tableRow("遠景", m.horizon),
    tableRow("植生・気候", `${m.vegetation}\n${m.climate}`),
    tableRow("匂い・音", m.senses),
    tableRow("この先の気配", m.adjacencyNext)
  ]);

  // ② 妹系
  html += tableSection("妹", "👧", [
    tableRow("妹の感想", m.sisterComment),
    tableRow("妹の行動", m.sisterAction)
  ], "compact-table");

  // ③ 地形ブロック
  html += `
    <div class="section">
      <h3>🧱 地形ブロック</h3>
      <div class="tags-wrap">
        ${m.blocks.map(b => {
    const color = b.required ? '#a0b8c8' : '#8a8a7a';
    const borderC = b.required ? '#4a6a7a' : '#3a3a3a';
    const tag = b.required
      ? `<span style="font-size:9px;padding:0 4px;border:1px solid ${borderC};color:${color};margin-left:6px;letter-spacing:1px;opacity:.7">必須</span>`
      : '';
    return `<div style="display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border:1px solid ${borderC};background:#0a0a16;font-size:13px">
            <span style="color:${color}">${esc(b.name)}</span>${tag}
          </div>`;
  }).join('')}
      </div>
    </div>
  `;

  // ④ アイテム
  html += `
    <div class="section">
      <h3>💎 採取可能アイテム</h3>
      <div class="tags-wrap">
        ${m.items.map(it => `<span class="item-tag">${esc(it)}</span>`).join('')}
      </div>
    </div>
  `;

  // ⑤ モンスター
  html += `
    <div class="section">
      <h3>👹 出現モンスター</h3>
      <div class="monster-list">
        ${m.monsters.map(mo => `
          <div class="monster-row">
            <span style="color:${mo.chimera ? '#ff8866' : '#ccc'};font-weight:${mo.chimera ? 'bold' : 'normal'}">
              ${esc(mo.name)}
            </span>
            ${mo.chimera ? '<span class="chimera-tag">CHIMERA</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // ⑥ 水場
  html += tableSection("水場", "💧", [
    tableRow("水場", m.water)
  ], "compact-table");

  // ⑦ 地下・建築
  html += tableSection("地盤・建築", "🏗️", [
    tableRow("地下の様子", m.underground),
    tableRow("建築適性", m.architecture)
  ]);

  // 特殊イベントはそのまま残すならここ
  if (m.events.length > 0) {
    html += sec('特殊イベント', '⚡', m.events.map((ev, i) => {
      const c = eventColor(ev.type);
      return `<div class="event-card" style="border-color:${c}33;background:linear-gradient(135deg,${c}08,${c}04);animation-delay:${i * 0.1}s">
        <div style="margin-bottom:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:20px">${ev.icon}</span>
          <span style="font-size:15px;font-weight:bold;color:${c}">${esc(ev.title)}</span>
          <span style="font-size:10px;padding:1px 8px;border:1px solid ${c}44;color:${c};letter-spacing:1px;opacity:.7">${esc(ev.typeLabel)}</span>
        </div>
        <p style="line-height:1.8;font-size:13px;color:#b0aca0">${esc(ev.desc)}</p>
      </div>`;
    }).join(''));
  }

  const contentEl = document.getElementById('content');
  if (!contentEl) {
    console.error("renderMap: #content が見つかりません");
    return;
  }
  contentEl.innerHTML = html;
}

function tableRow(label, value) {
  return `
    <tr>
      <th>${esc(label)}</th>
      <td>${nl2br(value || "—")}</td>
    </tr>
  `;
}

function tableSection(title, emoji, rows, extraClass = "") {
  return `
    <div class="section">
      <h3>${emoji} ${title}</h3>
      <table class="info-table ${extraClass}">
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    </div>
  `;
}

function sec(title, emoji, inner) {
  return `<div class="section"><h3>${emoji} ${title}</h3>${inner}</div>`;
}