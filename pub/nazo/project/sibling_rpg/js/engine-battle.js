// ─── STATE ──────────────────────────────────────────────────────────
let currentDifficulty = DIFFICULTY_PRESETS[0];
let history = [];
let historyVisible = false;
let queuedNextMap = null;

const ADVENTURE_INTERVAL_MS = 300 * 1000;
// タイマーの数字！ ここで待機時間を操作
const SAVE_KEY = "strangeTerrainAdventureSave_v1";

const BALANCE = {
  envDamageBase: 9,
  envDamageFactor: 0.88,
  chaosDoubleBonus: 1.15,
  chaosTripleBonus: 1.30,
  guardScale: 0.68,

  exhaustBaseMask: 0.06,
  exhaustDangerScale: 0.16,
  exhaustLowGenkiScale: 0.60,
  exhaustChaosDoubleBonus: 0.04,
  exhaustChaosTripleBonus: 0.08,

  expBase: 10,
  expDangerFactor: 1.0,
  expSafeReturnBonus: 6,

  pointBase: 4,
  pointDangerFactor: 0.4
};

const gameState = {
  brother: {
    id: "brother",
    name: "一彌",
    level: 1,
    exp: 0,
    maxGenki: 0,
    genki: 0,
    power: 0,
    guard: 0,
    spd: 0,
    limit: 0,
    status: [],
    exhausted: false,
    skipNextAdventure: false,
    resting: false
  },
  sister: {
    id: "sister",
    name: "一埜",
    level: 1,
    exp: 0,
    maxGenki: 0,
    genki: 0,
    power: 0,
    guard: 0,
    spd: 0,
    limit: 0,
    status: [],
    exhausted: false,
    skipNextAdventure: false,
    resting: false
  },
  dungeon: {
    active: false,
    difficultyId: "picnic",
    currentFloor: 0,
    maxFloor: 1,
    choices: [],
    logs: [],
    floorContext: null,
    introMap: null,
    baseMapLevel: 1,
    baseDangerFloor: 1
  },
  timer: {
    nextAdventureAt: 0
  },
  meta: {
    adventureCount: 0,
    totalAdventurePoints: 0,
    lastResultHtml: "まだ冒険していません。",
    lastPointGain: 0,
    biomeDex: {},
    dangerPreviewText: "まだ観測されていません"
  }
};

function calcBrotherStats(level) {
  const maxGenki = Math.floor(0.9 * level * level + 8 * level + 30);
  const power = Math.floor(0.55 * level * level + 4 * level + 8);
  const guard = Math.floor(0.50 * level * level + 4.5 * level + 6);
  const spd = Math.floor(0.35 * level + 10);

  return { level, maxGenki, power, guard, spd };
}

function calcSisterStats(level) {
  const maxGenki = Math.floor(0.82 * level * level + 7.5 * level + 28);
  const power = Math.floor(0.60 * level * level + 4.2 * level + 9);
  const guard = Math.floor(0.42 * level * level + 4.0 * level + 5);
  const spd = Math.floor(0.45 * level + 12);

  return { level, maxGenki, power, guard, spd };
}

function expToNextLevel(level) {
  return Math.floor(20 + 8 * level + 4.5 * level * level);
}

function refreshUnitStats(unit) {
  const oldMax = unit.maxGenki || 0;
  const oldGenki = unit.genki || 0;

  const newStats = unit.id === "brother"
    ? calcBrotherStats(unit.level)
    : calcSisterStats(unit.level);

  unit.maxGenki = newStats.maxGenki;
  unit.power = newStats.power;
  unit.guard = newStats.guard;
  unit.spd = newStats.spd;

  if (oldMax === 0) {
    unit.genki = unit.maxGenki;
  } else {
    const diff = unit.maxGenki - oldMax;
    unit.genki = Math.min(unit.maxGenki, oldGenki + Math.max(0, diff));
  }
}

function applyLevelUps(unit) {
  let leveledUp = false;

  while (unit.exp >= expToNextLevel(unit.level)) {
    unit.exp -= expToNextLevel(unit.level);
    unit.level += 1;
    leveledUp = true;
  }

  const beforeMax = unit.maxGenki;
  refreshUnitStats(unit);

  if (leveledUp) {
    unit.genki = Math.min(unit.maxGenki, unit.genki + Math.max(0, unit.maxGenki - beforeMax));
  }

  return leveledUp;
}

function calcPartyStats(brother, sister) {
  return {
    totalPower: brother.power + sister.power,
    totalGuard: brother.guard + sister.guard,
    avgLevel: (brother.level + sister.level) / 2,
    totalCurrentGenki: brother.genki + sister.genki,
    totalMaxGenki: brother.maxGenki + sister.maxGenki,
    maxSpd: Math.max(brother.spd, sister.spd)
  };
}



// ─── VISUAL AUTO BATTLE ENGINE ─────────────────────────────────────────────
function parseMonsterStats(mInfo, baseLevel, isBoss) {
  // 1. Generate enemy internal level with variance (-1 to +2)
  let eLevel = Math.max(1, baseLevel + Math.floor(Math.random() * 4) - 1);

  // 2. Base stat generation from Enemy Level
  let hp = Math.floor(60 * (eLevel / 5) * 1.0 + 40);
  let power = Math.floor(10 * (eLevel / 10) * 1.0 + 5);
  let guard = Math.floor(6 * (eLevel / 10) * 1.0 + 1);
  let spd = Math.floor(10 * (eLevel / 10) * 1.0 + 5);

  // Apply traits from keywords
  const name = mInfo.name || "謎の怪物";

  if (name.includes("スライム") || name.includes("肉塊")) { hp *= 1.5; guard *= 0.5; }
  if (name.includes("ゴーレム") || name.includes("巨像")) { hp *= 1.3; power *= 1.2; guard *= 1.8; spd *= 0.5; }
  if (name.includes("ウルフ") || name.includes("狼")) { hp *= 0.7; power *= 1.1; spd *= 1.4; }
  if (name.includes("ドラゴン") || name.includes("竜")) { hp *= 1.4; power *= 1.4; guard *= 1.3; }
  if (name.includes("ゴースト") || name.includes("亡霊")) { hp *= 0.6; guard *= 1.5; spd *= 1.2; }

  if (name.includes("若い") || name.includes("幼い")) { hp *= 0.6; power *= 0.7; }
  if (name.includes("歴戦の") || name.includes("熟練の")) { hp *= 1.3; power *= 1.3; guard *= 1.3; }
  if (name.includes("神殺しの")) { hp *= 8.0; power *= 3.0; guard *= 2.0; spd *= 2.0; }
  if (name.includes("温和な")) { power *= 0.3; guard *= 0.8; }

  if (isBoss || mInfo.chimera) { hp *= 2.5; power *= 1.3; guard *= 1.3; }

  // 全体倍率で敵を強化
  hp *= 3.5;
  power *= 1.8;
  guard *= 2.5;

  return {
    name,
    level: eLevel,
    hp: Math.floor(hp),
    maxHp: Math.floor(hp),
    power: Math.floor(power),
    guard: Math.floor(guard),
    spd: Math.floor(spd),
    isAlly: false,
    status: []
  };
}

const PEACEFUL_PREFIXES = [
  "ちいさな",
  "おとなしい",
  "迷子の",
  "眠そうな",
  "温和な",
  "平凡な",
  "怠惰な",
  "プチ"
];

function hasPeacefulPrefix(name) {
  if (!name) return false;
  return PEACEFUL_PREFIXES.some(prefix => name.startsWith(prefix));
}

function buildPeacefulEncounterText(mInfo) {
  const texts = [
    `${mInfo.name} がこちらを見ている。敵意はなさそうだ。`,
    `${mInfo.name} は眠たげに身じろぎした。二人はそっと通り過ぎた。`,
    `${mInfo.name} は道端でのんびりしている。今日は戦わなくてよさそうだ。`,
    `${mInfo.name} が現れたが、危険はなさそうだった。二人は刺激しないよう静かに離れた。`
  ];
  return pick(texts);
}

function createEnemies(map) {
  const mc = map.monsters && map.monsters.length > 0
    ? pick(map.monsters.length > 3 ? [2, 3] : [1, 2])
    : 1;

  const enemies = [];
  const peacefulMessages = [];
  const baseLevel = map.level;

  for (let i = 0; i < mc; i++) {
    const mInfo = map.monsters && map.monsters[i]
      ? map.monsters[i]
      : { name: "謎の気配" };

    if (hasPeacefulPrefix(mInfo.name)) {
      peacefulMessages.push(buildPeacefulEncounterText(mInfo));
      continue;
    }

    const isBoss = (baseLevel % 10 === 0 && i === 0);

    let mo = parseMonsterStats(mInfo, baseLevel, isBoss);
    mo.id = "enemy_" + i;
    enemies.push(mo);
  }

  return {
    enemies,
    peacefulText: peacefulMessages.join("<br>")
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function doAttack(actor, target, envDmgRatio = 1.0) {
  const spdDiff = actor.spd - target.spd;

  const hitChance = clamp(75 + spdDiff * 2, 50, 95);
  const critChance = clamp(5 + spdDiff, 3, 35);

  let hits = 1;

  // 速さ優位なら追加ヒットしやすい
  if (chance(clamp(15 + spdDiff * 8, 0, 70))) hits++;
  if (chance(clamp(spdDiff * 5, 0, 40))) hits++;

  let totalDmg = 0;
  let landedHits = 0;
  let critHits = 0;
  let missHits = 0;

  for (let i = 0; i < hits; i++) {
    const guaranteedHit = (i === 0);

    if (!guaranteedHit && !chance(hitChance)) {
      missHits++;
      continue;
    }

    const guardFactor = 100 / (100 + target.guard * BALANCE.guardScale);
    let dmg = Math.floor(actor.power * 2 * guardFactor * (0.9 + Math.random() * 0.2) * envDmgRatio);

    const isCrit = chance(critChance);
    if (isCrit) {
      dmg = Math.floor(dmg * 1.8);
      critHits++;
    }

    dmg = Math.max(1, dmg);
    target.hp -= dmg;
    totalDmg += dmg;
    landedHits++;
  }

  return {
    attemptedHits: hits,
    landedHits,
    missHits,
    critHits,
    totalDmg,
    allMissed: landedHits === 0
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function renderFFAHPBar(hp, maxHp) {
  const pct = Math.min(100, Math.max(0, Math.floor((hp / maxHp) * 100)));
  const w1 = pct;
  const w2 = 100 - pct;
  return `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAMAAACwQz+XAAAAA1BMVEUlJSWnej3aAAAAFElEQVQImWNgYGIAEwxYBBhgYAAAAwgAATV1m2AAAAAASUVORK5CYII=" width="${w1}" height="5" align="top" style="background:#5555ff;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAMAAAC6s1CPAAAAA1BMVEWAgICAX0AAAAAEQVR42mNgAAAAQwABR0f6cwAAAABJRU5ErkJggg==" width="${w2}" height="5" align="top" style="background:#aaaaaa;">`;
}

function renderFFALimitBar(limit) {
  const pct = Math.min(100, Math.max(0, Math.floor(limit || 0)));
  const w1 = pct;
  const w2 = 100 - pct;

  return `
    <div style="margin-top:4px;">
      <div style="font-size:10px; color:#cc99ff; line-height:1; margin-bottom:2px;">
        LIMIT ${pct}%
      </div>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAMAAACwQz+XAAAAA1BMVEUlJSWnej3aAAAAFElEQVQImWNgYGIAEwxYBBhgYAAAAwgAATV1m2AAAAAASUVORK5CYII=" width="${w1}" height="5" align="top" style="background:#cc66ff;">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAMAAAC6s1CPAAAAA1BMVEWAgICAX0AAAAAEQVR42mNgAAAAQwABR0f6cwAAAABJRU5ErkJggg==" width="${w2}" height="5" align="top" style="background:#444;">
    </div>
  `;
}

function renderFFATables(turn, allies, enemies) {
  const allyHtml = allies.map(a => `
  <TR>
    <TD>${esc(a.name)}</TD>
    <TD>
      ${a.hp}/${a.maxGenki}<br>
      ${renderFFAHPBar(a.hp, Math.max(1, a.maxGenki))}
      ${renderFFALimitBar(a.limit)}
    </TD>
    <TD>${a.status && a.status.length > 0 ? a.status.join(',') : '健康'}</TD>
    <TD align="center">${a.level || '?'}</TD>
  </TR>
`).join('');

  const enemyHtml = enemies.map(e => `
        <TR>
            <TD>${esc(e.name)}</TD>
            <TD align="center">${e.level || '?'}</TD>
            <TD>${Math.max(0, e.hp)}/${e.maxHp}<br>${renderFFAHPBar(Math.max(0, e.hp), Math.max(1, e.maxHp))}</TD>
            <TD>${e.status && Array.isArray(e.status) && e.status.length > 0 ? e.status.join(',') : '通常'}</TD>
            <TD align="center">無</TD>
        </TR>
      `).join('');

  return `
      <TABLE BORDER="0" width="100%">
      <TR>
          <TD CLASS="ffa-b2" COLSPAN="3" ALIGN="center">${turn}ターン</TD>
      </TR>
      <TR>
      <TD valign="top" width="45%">
      <TABLE BORDER="1" class="ffa-table">
      <TR>
          <TD CLASS="ffa-b1">なまえ</TD><TD CLASS="ffa-b1">HP</TD><TD CLASS="ffa-b1">状態</TD><TD CLASS="ffa-b1">LV</TD>
      </TR>
      ${allyHtml}
      </TABLE>
      </TD>
      <TD valign="top" align="center" width="10%">
      <FONT SIZE="5" COLOR="#9999DD"><br><br>VS</FONT>
      </TD>
      <TD valign="top" width="45%">
      <TABLE BORDER="1" class="ffa-table">
      <TR>
          <TD CLASS="ffa-b1">なまえ</TD><TD CLASS="ffa-b1">LV</TD><TD CLASS="ffa-b1">HP</TD><TD CLASS="ffa-b1">備考</TD><TD CLASS="ffa-b1">属性</TD>
      </TR>
      ${enemyHtml}
      </TABLE>
      </TD>
      </TR>
      </TABLE>
      `;
}

function doCounterAttack(actor, target, powerScale = 1.25) {
  const guardFactor = 100 / (100 + target.guard * BALANCE.guardScale);
  let dmg = Math.floor(actor.power * 2 * powerScale * guardFactor * (0.9 + Math.random() * 0.2));
  dmg = Math.max(1, dmg);
  target.hp -= dmg;
  return dmg;
}

function doLittleSisterPunch(actor, target) {
  const hits = 85;
  const guardFactor = 100 / (100 + target.guard * BALANCE.guardScale);

  // 1ヒットはかなり軽く、合計で気持ちよく出るように調整
  const perHit = Math.max(1, Math.floor(actor.power * 0.22 * guardFactor));
  const totalDmg = hits * perHit;

  target.hp -= totalDmg;

  return { hits, perHit, totalDmg };
}

async function startVisualBattle(map, brother, sister, enemies, onWin, onLose) {
  const allies = [brother, sister];
  const brotherUnit = brother;
  const sisterUnit = sister;
  allies[0].isAlly = true;
  allies[1].isAlly = true;
  allies[0].hp = allies[0].genki;
  allies[1].hp = allies[1].genki;
  allies[0].maxHp = allies[0].maxGenki;
  allies[1].maxHp = allies[1].maxGenki;

  const logTerminal = document.getElementById("battleLogTerminal");
  const eNameEl = document.getElementById("enemyNameDisplay");
  if (eNameEl) eNameEl.textContent = enemies.map(e => e.name).join(", ");

  // Clear logs and hide the previous old HP bar display
  logTerminal.innerHTML = "";
  document.getElementById("battleView").style.display = "block";

  const chaosBonus = map.chaosLevel === 3 ? 1.4 : map.chaosLevel === 2 ? 1.2 : 1.0;
  const envDmgRatio = (1 + (map.level / 100)) * chaosBonus;

  const addHTMLBlock = (htmlString) => {
    const div = document.createElement("div");
    div.innerHTML = htmlString;
    logTerminal.appendChild(div);
    // ページ全体をスクロール
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  };

  addHTMLBlock(`<FONT SIZE=5 COLOR=7777DD><B>${map.tierInfo.label}${map.biomeName}</B></FONT><BR>
       <h1 style="font-size:14pt;">二人は、${enemies.map(e => e.name).join(", ")} に戦いを挑んだ！！</h1><br /><hr /><p>`);

  let turn = 0;
  await delay(1000);

  while (turn < 50) {
    turn++;
    const battlers = [...allies, ...enemies]
      .filter(b => b.hp > 0)
      .sort((a, b) => (b.spd + Math.random() * 4) - (a.spd + Math.random() * 4));

    if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) break;

    // Render Tables for this turn
    addHTMLBlock(renderFFATables(turn, allies, enemies));
    await delay(500);

    let turnLogs = "";

    for (const actor of battlers) {
      if (actor.hp <= 0) continue;

      if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) {
        break;
      }

      // 以降、行動処理

      if (actor.status.includes('毒')) {
        const pd = Math.floor(actor.maxHp * 0.05) + 1;
        actor.hp -= pd;
        if (actor.hp < 0) actor.hp = 0;
        turnLogs += `<p class="battle-log-entry">${actor.name} は毒に侵されている！ <font class="ffa-dmg"><b>${pd}</b></font> のダメージ！<br /></p>`;
        if (actor.hp <= 0) continue;
      }

      if (actor.isAlly) {
        if (actor.limit >= 100) {
          actor.limit = 0;

          if (actor.id === "brother") {
            const liveEnemies = enemies.filter(e => e.hp > 0);
            if (liveEnemies.length === 0) break;

            turnLogs += `<p class="battle-log-entry">${actor.name} は限界を超えた！！<br><font size="5" color="#0000FF">一彌「お兄ちゃんタクティクス！！」</font></p>`;

            for (const target of liveEnemies) {
              const dmg = Math.floor(
                actor.power * 3.2 * (100 / (100 + target.guard * BALANCE.guardScale))
              );

              target.hp -= dmg;

              turnLogs += `<p class="battle-log-entry">${target.name} に <font class="ffa-dmg"><b>${dmg}</b></font> のダメージを与えた！</p>`;

              if (target.hp <= 0) {
                target.hp = 0;
                turnLogs += `<p class="battle-log-entry"><font size="5">${target.name} を倒した！</font> ${target.name} はツヤツヤのパンになった！<br/>【${target.name}】「おのれ～！」</p>`;
              }
            }
          } else {
            const alliesInDanger = allies.some(a => a.hp > 0 && a.hp < a.maxGenki * 0.4);
            const alliesBadStatus = allies.some(a => a.status && a.status.length > 0);

            if (alliesInDanger || alliesBadStatus) {
              const healLogs = [];

              allies.forEach(a => {
                const beforeHp = a.hp;
                const healAmount = Math.floor(a.maxGenki * 0.4);
                a.hp = Math.min(a.maxGenki, a.hp + healAmount);
                const actualHeal = a.hp - beforeHp;

                a.status = [];

                healLogs.push(`${a.name} は ${actualHeal}回復！`);
              });

              turnLogs += `<p class="battle-log-entry"><font size="5" color="#00cc00">${actor.name} は祈りを捧げ、癒やしの風を呼び起こした！！</font><br><font size="5">一埜「風よ、命よ……！」</font>
              <br />味方全体の傷が大きく回復し、状態異常が治った！<br><span class="ffa-heal">${healLogs.join(" / ")}</span></p>`;
            } else {
              const target = pick(enemies.filter(e => e.hp > 0));
              if (!target) break;

              const punch = doLittleSisterPunch(actor, target);

              turnLogs += `<p class="battle-log-entry">${actor.name} のリミット技！！<br><font size="5" color="#ff0000">一埜「妹パンチ！！」</font><br>${target.name} に怒涛の <font class="ffa-dmg"><b>${punch.hits}</b></font> ヒット！！<br>合計 <font class="ffa-dmg"><b>${punch.totalDmg}</b></font> のダメージを与えた！</p>`;

              if (target.hp <= 0) {
                target.hp = 0;
                turnLogs += `<p class="battle-log-entry"><font size="5">${target.name} を倒した！</font> ${target.name} はツヤツヤのパンになった！<br/>【${target.name}】「おのれ～！」</p>`;
              }
            }
          }

          continue;
        }

        if (actor.id === "sister" && chance(70) && allies.some(a => a.hp < a.maxGenki * 0.5)) {
          const target = [...allies].sort((a, b) => (a.hp / a.maxGenki) - (b.hp / b.maxGenki))[0];
          const heal = Math.floor(actor.power * 1.5 + 5);
          target.hp = Math.min(target.maxGenki, target.hp + heal);
          turnLogs += `<p class="battle-log-entry"> ${actor.name} は ${target.name} を回復した！ <font class="ffa-heal"><b>${heal}</b></font> の回復。<br /></p>`;
          actor.limit += 15;
        } else {
          const target = pick(enemies.filter(e => e.hp > 0));
          if (!target) break;

          const res = doAttack(actor, target, 1.0);

          let hitLog = "";
          if (res.attemptedHits >= 2) {
            hitLog += `怒涛の${res.attemptedHits}連撃！ `;
          }
          if (res.critHits > 0) {
            hitLog += `クリティカル${res.critHits}回！ `;
          }

          if (res.allMissed) {
            turnLogs += `<p class="battle-log-entry">${actor.name} は ${target.name} に向かって武器を振り下ろした！<br>${target.name} はすべてかわした！</p>`;
          } else {
            const missText = res.missHits > 0 ? `（${res.missHits}発は外れた）` : "";
            turnLogs += `<p class="battle-log-entry">${actor.name} は ${target.name} に向かって武器を振り下ろした！<br>${hitLog}${target.name} に <font class="ffa-dmg"><b>${res.totalDmg}</b></font> のダメージを与えた。${missText}</p>`;
          }

          actor.limit += 15;

          if (target.hp <= 0) {
            target.hp = 0;
            turnLogs += `<p class="battle-log-entry"><font size="5">${target.name} を倒した！</font> ${target.name} はツヤツヤのパンになった！<br/>【${target.name}】「おのれ～！」</p>`;
          }
        }

      } else {
        let target = pick(allies.filter(a => a.hp > 0));
        if (!target) break;

        let guardedByBrother = false;
        let originalTarget = target;

        // 一埜がピンチなら、一彌がかばう
        let guardChance = 0;

        if (
          target.id === "sister" &&
          target.hp > 0 &&
          brotherUnit.hp > 0
        ) {
          const sisterHpRate = target.hp / target.maxGenki;

          if (sisterHpRate < 0.35) {
            guardChance = 100;
          } else if (sisterHpRate < 0.50) {
            guardChance = 85;
          } else if (sisterHpRate < 0.65) {
            guardChance = 60;
          } else if (sisterHpRate < 0.75) {
            guardChance = 30;
          }

          if (guardChance > 0 && chance(guardChance)) {
            target = brotherUnit;
            guardedByBrother = true;
          }
        }

        const enemyName = actor.name;
        const targetName = target.name;
        const originalTargetName = originalTarget.name;

        // まず「誰に向かったか」を出す
        if (guardedByBrother) {
          turnLogs += `<p class="battle-log-entry">${enemyName} が ${originalTargetName} に襲いかかった！！<br /><font size="5">${brotherUnit.name} は ${sisterUnit.name} をかばった！</font></p>`;
        } else {
          turnLogs += `<p class="battle-log-entry">${enemyName} が襲いかかった！！</p>`;
        }

        const res = doAttack(actor, target, envDmgRatio);

        const beforeLimit = target.limit || 0;
        target.limit = Math.min(
          100,
          beforeLimit + Math.floor(res.totalDmg / target.maxGenki * 50) + 5
        );

        const justLimitBroke = beforeLimit < 100 && target.limit >= 100;

        let sTxt = "";
        if (map.chaosLevel > 0 && chance(20) && !target.status.includes("毒") && !res.allMissed) {
          target.status.push("毒");
          sTxt = "【毒を受けた】";
        }

        let extraText = "";
        if (res.attemptedHits >= 2) extraText += ` ${res.attemptedHits}連撃！！<br />`;
        if (res.critHits > 0) extraText += ` クリティカル${res.critHits}回！！<br />`;

        if (res.allMissed) {
          turnLogs += `<p class="battle-log-entry">${target.name} は攻撃をかわした！</p>`;
        } else {
          const missText = res.missHits > 0 ? `（${res.missHits}発は外れた）` : "";
          turnLogs += `<p class="battle-log-entry">${extraText}${target.name} に <font class="ffa-dmg"><b>${res.totalDmg}</b></font> のダメージを与えた。${missText}${sTxt}<br /><br /></p>`;
        }

        if (justLimitBroke) {
          turnLogs += `<p class="battle-log-entry"><b class="ffa-crit"><font size="5", color="#ff5100">${target.name} のリミットゲージが限界突破！！</font></b><br>${target.name} は反撃の機をうかがっている……！</p>`;
        }

        // かばった後の会話
        if (guardedByBrother && brotherUnit.hp > 0 && sisterUnit.hp > 0) {
          turnLogs += `<p class="battle-log-entry">${brotherUnit.name}「ふっ……大丈夫か、一埜！」<br>${sisterUnit.name}「お兄ちゃん！」</p>`;
        }

        // かばった直後にカウンター
        if (guardedByBrother && actor.hp > 0 && brotherUnit.hp > 0) {
          const counterDmg = doCounterAttack(brotherUnit, actor, 1.35);
          turnLogs += `<p class="battle-log-entry">${brotherUnit.name} はすかさず反撃した！！<br>${actor.name} に <font class="ffa-dmg"><b>${counterDmg}</b></font> のダメージを与えた！</p>`;

          if (actor.hp <= 0) {
            actor.hp = 0;
            turnLogs += `<p class="battle-log-entry"><font size="5">${actor.name} を倒した！</font> ${actor.name} はツヤツヤのパンになった！<br/>【${actor.name}】「おのれ～！」</p>`;
          }
        }

        if (target.hp <= 0) {
          target.hp = 0;

          if (guardedByBrother) {
            turnLogs += `<p class="battle-log-entry">${brotherUnit.name}「グワーッ！🥐」<br>${sisterUnit.name}「うわっ死んでる！💦」<br>${brotherUnit.name}🥐「し、死んではいない！💦」</p>`;
          }

          const quote = target.name === "一彌" ? "一埜、逃げろ～！🥐" : "お兄ちゃん、ごめん～！🥐";
          turnLogs += `<p class="battle-log-entry"><font size="5">${target.name} は倒された！</font> ${target.name} はツヤツヤのパンになった！<br/>【${target.name}】「${quote}」</p>`;
        }
      }
    }

    addHTMLBlock(turnLogs);

    // Refresh upper status UI so it matches
    brother.genki = Math.max(0, brother.hp);
    sister.genki = Math.max(0, sister.hp);
    refreshUnitStats(brother);
    refreshUnitStats(sister);

    await delay(1200);
  }

  brother.genki = Math.max(0, brother.hp);
  sister.genki = Math.max(0, sister.hp);
  refreshUnitStats(brother);
  refreshUnitStats(sister);

  if (allies.every(a => a.genki <= 0)) {
    const loseTalk = ["こにゃん「ハァーン（まだまだね）」<br />一埜「悔しい～っ！🥐（じたばた）」", "三毛乃「アッ……ウーン（さっさと起きて腰トントンしなさいよ）」<br />一彌「死んでるんだが……🥐」", "一彌「せめて美味しく食べてくれぇ～！🥐」<br />一埜「そんなのいやだぁ～！🥐💦」"];
    addHTMLBlock(`<p class="battle-log-entry"><b><font size="5">二人は、戦闘に負けた……。<br /><br />${pick(loseTalk)}<br /><br />小人さんが二人のパンをダンジョン外へ運び出していく……。</font></b></p>`);
    onLose();
  } else {
    const quotes = ["敵たち「悔しいィィ！🥐」", "敵たち「おのれェェ、覚えてろ！🥐」", "敵たち「グァアアア！🥐」", "敵たち「ひでぶ！🥐」", "敵たち「パンになるゥゥ！🥐」"];
    const winTalk = ["こにゃん「んわ～？（やるわね）」<br />一埜「へへーん！」", "三毛乃「ぺろぺろぺろ……クァッ（あくび）」<br />一彌「マイペースなやつ……（腰トントン）」<br />", "一彌「余裕のよっちゃんイカだぜ！」<br />一埜「古っ！💦」"];
    addHTMLBlock(`
  <p class="battle-log-entry"><font color="5">${pick(quotes)}</font></p>
  <p class="battle-log-entry"><br /><b><font size="5">見事、敵を打ち倒した！<br /><br />${pick(winTalk)}</font><br /></b></p>
`);
    onWin();
  }
}
function calcExhaustChance(partyBefore, danger, map, brother, sister) {
  const hpRatio = (brother.genki + sister.genki) / Math.max(1, brother.maxGenki + sister.maxGenki);
  let chance = 0.15;
  chance += (1.0 - hpRatio) * 0.4;
  if (danger > partyBefore.avgLevel * 10) chance += 0.3;
  return Math.min(0.85, chance);
}

function calcExperienceGain(danger, partyBefore) {
  const baseExp = Math.floor(BALANCE.expBase + danger * BALANCE.expDangerFactor);
  const challengeBonus = Math.max(0, danger - partyBefore.avgLevel * 6) * 0.35;
  const exp = Math.max(1, Math.floor(baseExp + challengeBonus));
  return { brotherExp: exp, sisterExp: exp };
}

function calcAdventurePoints(danger) {
  const base = Math.floor(BALANCE.pointBase + danger * BALANCE.pointDangerFactor);
  return base;
}
function recoverFromExhaustion(unit) {
  unit.genki = unit.maxGenki;
  unit.exhausted = false;
  unit.skipNextAdventure = false;
  unit.resting = false;
}

function processRestTurn() {
  const brotherWasResting = gameState.brother.skipNextAdventure;
  const sisterWasResting = gameState.sister.skipNextAdventure;

  if (brotherWasResting || sisterWasResting) {
    recoverFromExhaustion(gameState.brother);
    recoverFromExhaustion(gameState.sister);

    gameState.meta.lastResultHtml = `
      <div class="result-log-line">二人は前回の疲れをしっかり癒やした。</div>
      <div class="result-log-line">兄も妹も元気いっぱいで、次の冒険に行ける。</div>
    `;
    return true;
  }

  return false;
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);

    Object.assign(gameState.brother, parsed.brother || {});
    Object.assign(gameState.sister, parsed.sister || {});
    Object.assign(gameState.timer, parsed.timer || {});
    Object.assign(gameState.meta, parsed.meta || {});
    if (parsed.dungeon) Object.assign(gameState.dungeon, parsed.dungeon);

    // Name override
    gameState.brother.name = "一彌";
    gameState.sister.name = "一埜";

    refreshUnitStats(gameState.brother);
    refreshUnitStats(gameState.sister);

    gameState.brother.genki = Math.min(gameState.brother.genki, gameState.brother.maxGenki);
    gameState.sister.genki = Math.min(gameState.sister.genki, gameState.sister.maxGenki);

    return true;
  } catch (e) {
    console.error("save load error:", e);
    return false;
  }
}

function initGameState() {
  const loaded = loadGame();

  if (!loaded) {
    refreshUnitStats(gameState.brother);
    refreshUnitStats(gameState.sister);
    gameState.brother.genki = gameState.brother.maxGenki;
    gameState.sister.genki = gameState.sister.maxGenki;
    gameState.timer.nextAdventureAt = Date.now();
    // Initialize limit to 0 just in case
    gameState.brother.limit = 0;
    gameState.sister.limit = 0;
    gameState.brother.status = [];
    gameState.sister.status = [];
    saveGame();
  }

  if (!queuedNextMap) {
    queuedNextMap = generateMap(currentDifficulty.center, currentDifficulty.spread, null);
  }
}