import re

with open('js/engine-battle.js', 'r', encoding='utf-8') as f:
    text = f.read()

# I want to replace the sections: calcAdventureDamage down to resolveAdventure
# Specifically from "function calcAdventureDamage" to the end of resolveAdventure.

start_str = "    function calcAdventureDamage(party, danger, map) {"
end_str = "    function recoverFromExhaustion(unit) {"

start_idx = text.find(start_str)
end_idx = text.find(end_str)

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    exit(1)

new_logic = """
    // ─── AUTO BATTLE ENGINE ─────────────────────────────────────────────
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
        if (envDmgRatio) dmg = Math.floor(dmg * envDmgRatio); // for enemy attacks boosted by environment
        dmg = Math.max(1, dmg);
        target.hp -= dmg;
        totalDmg += dmg;
      }
      return { totalDmg, hits };
    }

    function runAutoBattle(map, brother, sister) {
      const enemies = createEnemies(map);
      const allies = [brother, sister];
      allies[0].isAlly = true;
      allies[1].isAlly = true;
      allies[0].hp = allies[0].genki;
      allies[1].hp = allies[1].genki;
      
      const battleLogs = [];
      let turn = 0;
      
      const chaosBonus = map.chaosLevel === 3 ? 1.4 : map.chaosLevel === 2 ? 1.2 : 1.0;
      const envDmgRatio = (1 + (map.level / 100)) * chaosBonus;
      
      battleLogs.push(`遭遇: ${enemies.map(e=>e.name).join('と')}`);

      while (turn < 30) {
        turn++;
        const battlers = [...allies, ...enemies]
          .filter(b => b.hp > 0)
          .sort((a, b) => (b.spd + Math.random() * 4) - (a.spd + Math.random() * 4));
          
        if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) break;

        for (const actor of battlers) {
          if (actor.hp <= 0) continue;
          
          // 毒ダメージ等
          if (actor.status.includes('毒')) {
            const pd = Math.floor(actor.maxHp * 0.05) + 1;
            actor.hp -= pd;
            // battleLogs.push(`${actor.name} は毒で ${pd} ダメージ！`);
            if (actor.hp <= 0) continue;
          }
          
          if (actor.isAlly) {
            // リミットブレイクチェック
            if (actor.limit >= 100) {
              actor.limit = 0;
              if (actor.id === "brother") {
                const target = pick(enemies.filter(e => e.hp > 0));
                const dmg = Math.floor(actor.power * 5 * (100 / (100 + target.guard * BALANCE.guardScale)));
                target.hp -= dmg;
                battleLogs.push(`【${actor.name} のリミットブレイク！】渾身の一撃が ${target.name} に ${dmg} の大ダメージ！`);
              } else {
                 allies.forEach(a => { 
                   a.hp = Math.min(a.maxGenki, Math.floor(a.hp + a.maxGenki * 0.4));
                   a.status = [];
                 });
                 battleLogs.push(`【${actor.name} のリミットブレイク！】癒やしの風で味方を大きく回復し、状態異常を治した！`);
              }
              continue; // ターン終了
            }
            
            // 通常行動
            if (actor.id === "sister" && chance(30) && allies.some(a => a.hp < a.maxGenki * 0.5)) {
               const target = allies.sort((a,b)=> (a.hp/a.maxGenki) - (b.hp/b.maxGenki))[0];
               const heal = Math.floor(actor.power * 1.5 + 5);
               target.hp = Math.min(target.maxGenki, target.hp + heal);
               battleLogs.push(`${actor.name} は ${target.name} を ${heal} 回復した！`);
               actor.limit += 15;
            } else {
               const target = pick(enemies.filter(e => e.hp > 0));
               if (!target) break;
               const res = doAttack(actor, target, 1.0);
               battleLogs.push(`${actor.name}の攻撃！ ${target.name}に${res.hits}Hit ${res.totalDmg}ダメージ。`);
               actor.limit += 15;
            }
            
          } else {
            // Enemy Turn
            const target = pick(allies.filter(a => a.hp > 0));
            if (!target) break;
            const res = doAttack(actor, target, envDmgRatio);
            target.limit = Math.min(100, (target.limit || 0) + Math.floor(res.totalDmg / target.maxGenki * 50) + 5);
            let sTxt = "";
            if (map.chaosLevel > 0 && chance(20) && !target.status.includes('毒')) {
              target.status.push('毒');
              sTxt = "【毒を受けた】";
            }
            battleLogs.push(`${actor.name}の攻撃！ ${target.name}に ${res.totalDmg}ダメージ。${sTxt}`);
          }
          
          if (enemies.every(e => e.hp <= 0) || allies.every(a => a.hp <= 0)) break;
        }
      }
      
      if (turn >= 30) {
        battleLogs.push("激戦の末、一旦撤退した。");
      }
      
      brother.genki = Math.max(0, brother.hp);
      sister.genki = Math.max(0, sister.hp);
      
      return battleLogs;
    }

    function makeAdventureLog(map, result, partyBefore, brother, sister) {
      const tone = calcAdventureTone(partyBefore, result.danger);
      const lines = [];
      lines.push(`探索先は「${map.tierInfo.label}${map.biomeName}」。危険度は ${result.danger}。`);

      // 最新のバトルログを3〜5行だけ表示する（長すぎるため）
      if (result.battleLogs.length > 0) {
        lines.push(`-- 戦闘のハイライト --`);
        const showLen = Math.min(result.battleLogs.length, 5);
        for (let i = result.battleLogs.length - showLen; i < result.battleLogs.length; i++) {
          lines.push(result.battleLogs[i]);
        }
        lines.push(`-----------------------`);
      }

      if (result.defeated) {
        lines.push(`パーティは全滅してしまった……`);
        lines.push(`今回の経験値と冒険ポイントは得られなかった。`);
        lines.push(makeSisterExtraComment(map, result));
        lines.push(`次の冒険には休養が必要だ。`);
        return lines;
      }

      lines.push(`兄は ${result.brotherExp} EXP、妹は ${result.sisterExp} EXP を得た。`);
      lines.push(`冒険ポイントは ${result.adventurePoints} 増えた。`);

      if (result.brotherLevelUp) lines.push(`兄のレベルが ${brother.level} になった。`);
      if (result.sisterLevelUp) lines.push(`妹のレベルが ${sister.level} になった。`);

      lines.push(makeSisterExtraComment(map, result));

      if (result.exhausted) {
        lines.push(`二人はへとへとになったので、次の冒険はおやすみ。`);
      } else {
        lines.push(`二人は無事に帰還した。`);
      }

      return lines;
    }

    function resolveAdventure(map, brother, sister) {
      const partyBefore = calcPartyStats(brother, sister);
      const danger = map.level;

      const brotherBeforeDmg = brother.genki;
      const sisterBeforeDmg = sister.genki;

      // オートバトル実行！
      const battleLogs = runAutoBattle(map, brother, sister);

      const brotherDamage = brotherBeforeDmg - brother.genki;
      const sisterDamage = sisterBeforeDmg - sister.genki;
      const totalDamage = brotherDamage + sisterDamage;

      const brotherCollapsed = brother.genki <= 0;
      const sisterCollapsed = sister.genki <= 0;
      const defeated = brotherCollapsed && sisterCollapsed; // 全滅かどうか

      let exhausted = defeated;

      if (!defeated) {
        const exhaustChance = calcExhaustChance(
          partyBefore,
          danger,
          map,
          brother,
          sister
        );
        exhausted = Math.random() < exhaustChance;
      }

      let brotherExp = 0;
      let sisterExp = 0;
      let brotherLevelUp = false;
      let sisterLevelUp = false;
      let adventurePoints = 0;

      // 敗北していない時だけ報酬あり
      if (!defeated) {
        const expGain = calcExperienceGain(danger, partyBefore, exhausted);
        brotherExp = expGain.brotherExp;
        sisterExp = expGain.sisterExp;

        brother.exp += brotherExp;
        sister.exp += sisterExp;

        brotherLevelUp = applyLevelUps(brother);
        sisterLevelUp = applyLevelUps(sister);

        adventurePoints = calcAdventurePoints(danger, exhausted);
        gameState.meta.totalAdventurePoints += adventurePoints;
      } else {
        // 全滅ボーナスダウンなど
      }

      if (exhausted) {
        brother.exhausted = true;
        sister.exhausted = true;
        brother.skipNextAdventure = true;
        sister.skipNextAdventure = true;
        brother.resting = false;
        sister.resting = false;
      }

      return {
        danger,
        totalDamage,
        brotherDamage,
        sisterDamage,
        exhausted,
        defeated,
        brotherCollapsed,
        sisterCollapsed,
        brotherExp,
        sisterExp,
        brotherLevelUp,
        sisterLevelUp,
        adventurePoints,
        battleLogs
      };
    }
"""

patched = text[:start_idx] + new_logic + text[end_idx:]

with open('js/engine-battle.js', 'w', encoding='utf-8') as f:
    f.write(patched)

print("Patched cleanly.")
