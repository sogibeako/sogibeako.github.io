import re

with open('js/main.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace updateGamePanel
s_ugp = "      const offerEl = document.getElementById(\"offerGrid\");"
e_ugp = "        } else {"
idx1 = text.find(s_ugp)
idx2 = text.find(e_ugp, idx1)

new_ugp = """
        } else {
"""
text = text[:idx1] + "\n" + new_ugp[1:] + text[idx2 + len(e_ugp):]


# Replace DUNGEON FLOW
start_flow = "    // ─── DUNGEON FLOW ───────────────────────────────────────────────────────"
end_flow = "    function restNow() {" # Wait, restNow is line 440 approximately

idx3 = text.find(start_flow)
idx4 = text.find(end_flow, idx3)

new_flow = """    // ─── DUNGEON FLOW: LINEAR ──────────────────────────────────────────────────────
    function startDungeon() {
      clearRestIfFinished();
      const now = Date.now();
      if (now < gameState.timer.nextAdventureAt) {
        updateGamePanel();
        return;
      }
      if (gameState.brother.skipNextAdventure || gameState.sister.skipNextAdventure || gameState.brother.resting || gameState.sister.resting) {
        gameState.meta.lastResultHtml = `
          <div class="result-log-line">二人はまだ休養が必要だ。</div>
          <div class="result-log-line">「休む」を押して、次のタイミングを待とう。</div>
        `;
        saveGame();
        updateGamePanel();
        return;
      }

      playAdventureStartSound();

      const btn = document.getElementById('genBtn');
      if (btn) {
        btn.blur();
        btn.textContent = '準 備 中 ...';
        btn.disabled = true;
      }
      
      const emptyEl = document.getElementById('empty');
      if (emptyEl) emptyEl.style.display = 'none';

      setTimeout(() => {
        const partyAvgLv = (gameState.brother.level + gameState.sister.level) / 2;
        gameState.dungeon.active = true;
        gameState.dungeon.difficultyId = currentDifficulty.id;
        gameState.dungeon.currentFloor = 1;
        gameState.dungeon.maxFloor = getDungeonMaxFloor(currentDifficulty.id, partyAvgLv);
        
        gameState.brother.limit = 0;
        gameState.sister.limit = 0;
        gameState.brother.status = [];
        gameState.sister.status = [];

        gameState.meta.lastResultHtml = `
          <div class="result-log-line">「${currentDifficulty.label}」に出発した！</div>
        `;
        
        saveGame();
        updateGamePanel();
        scrollToTopSmooth();
        
        enterNextFloor();
      }, 300);
    }

    function enterNextFloor() {
       document.getElementById("dungeonFloorPanel").style.display = "block";
       document.getElementById("battleView").style.display = "none";
       document.getElementById("nextFloorBtnWrap").style.display = "none";
       
       const progEl = document.getElementById("dungeonProgress");
       if (progEl) {
         progEl.textContent = `ダンジョン進行中: ${gameState.dungeon.currentFloor} / ${gameState.dungeon.maxFloor} 階層`;
       }
       
       const floorData = generateFloorContent(currentDifficulty, gameState.dungeon.currentFloor);
       const sceneryEl = document.getElementById("floorScenery");
       const eventEl = document.getElementById("floorEvent");
       
       sceneryEl.innerHTML = esc(floorData.sceneryText);
       eventEl.innerHTML = "";
       
       // Handle Event
       let partyDiedInEvent = false;
       if (floorData.eventData.type !== 'none') {
           const ev = floorData.eventData;
           let resText = ev.resolve(gameState.brother, gameState.sister);
           eventEl.innerHTML = `${esc(ev.flavor)}<br/><span style="color:#fff;">${esc(resText)}</span>`;
           refreshUnitStats(gameState.brother);
           refreshUnitStats(gameState.sister);
           
           if (gameState.brother.genki <= 0 && gameState.sister.genki <= 0) {
              partyDiedInEvent = true;
           }
       }
       
       if (partyDiedInEvent) {
          handleLose("二人は力尽きてしまった……倒れたまま回収された。");
          return;
       }
       
       // Auto transition to battle
       const enemies = createEnemies(floorData.mapData);
       setTimeout(() => {
          document.getElementById("battleView").style.display = "block";
          document.getElementById("floorScenery").style.color = "#666"; // dim
          startVisualBattle(floorData.mapData, gameState.brother, gameState.sister, enemies, onBattleWin, onBattleLose);
       }, 2000);
    }
    
    function onBattleWin() {
       gameState.dungeon.currentFloor += 1;
       
       // 報酬
       const danger = 10 + gameState.dungeon.currentFloor; // rough scale
       const partyBefore = calcPartyStats(gameState.brother, gameState.sister);
       const expGain = calcExperienceGain(danger, partyBefore);
       
       gameState.brother.exp += expGain.brotherExp;
       gameState.sister.exp += expGain.sisterExp;
       
       let levelUpHtml = "";
       if (applyLevelUps(gameState.brother)) levelUpHtml += ` 兄レベルUP!`;
       if (applyLevelUps(gameState.sister)) levelUpHtml += ` 妹レベルUP!`;
       
       const pts = calcAdventurePoints(danger);
       gameState.meta.totalAdventurePoints += pts;
       
       const logTerminal = document.getElementById("battleLogTerminal");
       const div = document.createElement("div");
       div.style.color = "#ffff88";
       div.innerHTML = `勝利！ 冒険ポイント+${pts} EXP+${expGain.brotherExp} ${levelUpHtml}`;
       logTerminal.appendChild(div);
       logTerminal.scrollTop = logTerminal.scrollHeight;
       showPointGainFx(pts);
       
       saveGame();
       
       if (gameState.dungeon.currentFloor > gameState.dungeon.maxFloor) {
          setTimeout(() => {
             gameState.dungeon.active = false;
             gameState.meta.lastResultHtml = `<div class="log-victory">【ダンジョンクリア！】 最深部まで到着し、帰還した！</div>`;
             gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;
             saveGame();
             updateGamePanel();
          }, 3000);
       } else {
          document.getElementById("nextFloorBtnWrap").style.display = "block";
       }
    }
    
    function proceedFloor() {
       playAdventureStartSound();
       document.getElementById("nextFloorBtnWrap").style.display = "none";
       enterNextFloor();
    }
    
    function handleLose(reason) {
       gameState.dungeon.active = false;
       gameState.meta.lastResultHtml = `<div class="log-defeat">${esc(reason)}</div>`;
       
       gameState.brother.exhausted = true;
       gameState.sister.exhausted = true;
       gameState.brother.skipNextAdventure = true;
       gameState.sister.skipNextAdventure = true;
       gameState.timer.nextAdventureAt = Date.now() + ADVENTURE_INTERVAL_MS;
       
       saveGame();
       updateGamePanel();
       scrollToTopSmooth();
    }
    
    function onBattleLose() {
       setTimeout(() => {
          handleLose("戦闘不能……二人はツヤツヤのパンになった。");
       }, 2000);
    }

"""

text = text[:idx3] + new_flow + text[idx4:]

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(text)

print("main.js Patched cleanly.")
