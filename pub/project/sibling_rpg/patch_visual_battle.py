import re

with open('js/engine-battle.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = "    // ─── AUTO BATTLE ENGINE ─────────────────────────────────────────────"
end_str = "    function recoverFromExhaustion(unit) {"

start_idx = text.find(start_str)
end_idx = text.find(end_str)

new_logic = """
    // ─── VISUAL AUTO BATTLE ENGINE ─────────────────────────────────────────────
    function createEnemies(map) {
      const danger = map.level;
      const mc = map.monsters && map.monsters.length > 0 ? pick(map.monsters.length > 3 ? [2,3] : [1,2]) : 1;
      const enemies = [];
      const baseSpd = Math.floor(0.4 * danger + 8);
      
      for (let i = 0; i < mc; i++) {
        const mo = map.monsters && map.monsters[i] ? map.monsters[i] : { name: "謎の気配" };
        let hp = Math.floor(10 + danger * 4 + danger * Math.max(1, danger * 0.05));
        let power = Math.floor(4 + danger * 0.6);
        let guard = Math.floor(3 + danger * 0.5);
        let spd = baseSpd + Math.floor(Math.random() * 5);
        
        if (mo.chimera) {
          hp = Math.floor(hp * 1.5);
          power = Math.floor(power * 1.2);
        }
        
        enemies.push({
          id: "enemy_" + i,
          name: mo.name,
          hp: hp,
          maxHp: hp,
          power: power,
          guard: guard,
          spd: spd,
          isAlly: false,
          status: []
        });
      }
      return enemies;
    }

    function doAttack(actor, target, envDmgRatio) {
      const spdFactor = Math.max(1, actor.spd / Math.max(1, target.spd));
      let hits = 1;
      if (spdFactor > 1.4) hits = 2;
      if (spdFactor > 2.0 && chance(50)) hits = 3;
      
      let totalDmg = 0;
      for (let i = 0; i < hits; i++) {
        const guardFactor = 100 / (100 + target.guard * BALANCE.guardScale);
        let dmg = Math.floor(actor.power * 2 * guardFactor * (0.9 + Math.random() * 0.2));
        if (envDmgRatio) dmg = Math.floor(dmg * envDmgRatio);
        dmg = Math.max(1, dmg);
        target.hp -= dmg;
        totalDmg += dmg;
      }
      return { totalDmg, hits };
    }

    function delay(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function startVisualBattle(map, brother, sister, enemies, onWin, onLose) {
      const allies = [brother, sister];
      allies[0].isAlly = true;
      allies[1].isAlly = true;
      allies[0].hp = allies[0].genki;
      allies[1].hp = allies[1].genki;
      
      const logTerminal = document.getElementById("battleLogTerminal");
      const addLog = (msg) => {
         const div = document.createElement("div");
         div.innerHTML = esc(msg);
         logTerminal.appendChild(div);
         logTerminal.scrollTop = logTerminal.scrollHeight;
      };
      
      logTerminal.innerHTML = "";
      
      const chaosBonus = map.chaosLevel === 3 ? 1.4 : map.chaosLevel === 2 ? 1.2 : 1.0;
      const envDmgRatio = (1 + (map.level / 100)) * chaosBonus;
      
      addLog(`遭遇: ${enemies.map(e=>e.name).join('と')}`);
      
      let turn = 0;
      
      const updateHpUI = () => {
         refreshUnitStats(brother); // Updates the main stat panel
         refreshUnitStats(sister);
         
         const enemyGroupMax = enemies.reduce((sum, e) => sum + e.maxHp, 0);
         const enemyGroupCur = enemies.reduce((sum, e) => sum + Math.max(0, e.hp), 0);
         const pct = Math.max(0, Math.min(100, (enemyGroupCur / enemyGroupMax) * 100));
         
         const eNameEl = document.getElementById("enemyNameDisplay");
         const eHpFill = document.getElementById("enemyHpFill");
         const eHpText = document.getElementById("enemyHpText");
         
         if (eNameEl) eNameEl.textContent = enemies.map(e=>e.name).join(", ");
         if (eHpFill) eHpFill.style.width = pct + "%";
         if (eHpText) eHpText.textContent = `${enemyGroupCur} / ${enemyGroupMax}`;
      };
      
      updateHpUI();
      document.getElementById("battleView").style.display = "block";
      
      await delay(1000);

      while (turn < 50) {
        turn++;
        const battlers = [...allies, ...enemies]
          .filter(b => b.hp > 0)
          .sort((a, b) => (b.spd + Math.random() * 4) - (a.spd + Math.random() * 4));
          
        if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) break;

        for (const actor of battlers) {
          if (actor.hp <= 0) continue;
          
          if (actor.status.includes('毒')) {
            const pd = Math.floor(actor.maxHp * 0.05) + 1;
            actor.hp -= pd;
            if (actor.isAlly) actor.genki = actor.hp;
            updateHpUI();
            if (actor.hp <= 0) continue;
          }
          
          if (actor.isAlly) {
            if (actor.limit >= 100) {
              actor.limit = 0;
              if (actor.id === "brother") {
                const target = pick(enemies.filter(e => e.hp > 0));
                const dmg = Math.floor(actor.power * 5 * (100 / (100 + target.guard * BALANCE.guardScale)));
                target.hp -= dmg;
                addLog(`【${actor.name} のリミットブレイク！】渾身の一撃が ${target.name} に ${dmg} の大ダメージ！`);
              } else {
                 allies.forEach(a => { 
                   a.hp = Math.min(a.maxGenki, Math.floor(a.hp + a.maxGenki * 0.4));
                   a.genki = a.hp;
                   a.status = [];
                 });
                 addLog(`【${actor.name} のリミットブレイク！】癒やしの風で味方を大きく回復し、状態異常を治した！`);
              }
              updateHpUI();
              await delay(800);
              continue;
            }
            
            if (actor.id === "sister" && chance(30) && allies.some(a => a.hp < a.maxGenki * 0.5)) {
               const target = allies.sort((a,b)=> (a.hp/a.maxGenki) - (b.hp/b.maxGenki))[0];
               const heal = Math.floor(actor.power * 1.5 + 5);
               target.hp = Math.min(target.maxGenki, target.hp + heal);
               target.genki = target.hp;
               addLog(`${actor.name} は ${target.name} を ${heal} 回復した！`);
               actor.limit += 15;
            } else {
               const target = pick(enemies.filter(e => e.hp > 0));
               if (!target) break;
               const res = doAttack(actor, target, 1.0);
               addLog(`${actor.name}の攻撃！ ${target.name}に${res.hits}Hit ${res.totalDmg}ダメージ。`);
               actor.limit += 15;
            }
            
          } else {
            const target = pick(allies.filter(a => a.hp > 0));
            if (!target) break;
            const res = doAttack(actor, target, envDmgRatio);
            target.hp -= 0; // Already subtracted in doAttack
            target.genki = target.hp; 
            target.limit = Math.min(100, (target.limit || 0) + Math.floor(res.totalDmg / target.maxGenki * 50) + 5);
            let sTxt = "";
            if (map.chaosLevel > 0 && chance(20) && !target.status.includes('毒')) {
              target.status.push('毒');
              sTxt = "【毒を受けた】";
            }
            addLog(`${actor.name}の攻撃！ ${target.name}に ${res.totalDmg}ダメージ。${sTxt}`);
          }
          
          updateHpUI();
          await delay(800);
          
          if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) break;
        }
      }
      
      brother.genki = Math.max(0, brother.hp);
      sister.genki = Math.max(0, sister.hp);
      updateHpUI();
      
      if (allies.every(a => a.genki <= 0)) {
         onLose();
      } else {
         const quotes = ["くそっ……こんなところで……", "おのれ……覚えてろ……！", "グァアアア！", "……消滅……", "ば、馬鹿な……！"];
         addLog(`「${pick(quotes)}」`);
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
"""

patched = text[:start_idx] + new_logic + text[end_idx:]

with open('js/engine-battle.js', 'w', encoding='utf-8') as f:
    f.write(patched)

print("Visual Auto Battle Patched cleanly.")
