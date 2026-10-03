import re

with open('js/engine-battle.js', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = "    async function startVisualBattle(map, brother, sister, enemies, onWin, onLose) {"
end_str = "    function calcExhaustChance(partyBefore, danger, map, brother, sister) {"

idx1 = text.find(start_str)
idx2 = text.find(end_str)

new_logic = """
    function renderFFAHPBar(hp, maxHp) {
      const pct = Math.min(100, Math.max(0, Math.floor((hp / maxHp) * 100)));
      const w1 = pct;
      const w2 = 100 - pct;
      return `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAMAAACwQz+XAAAAA1BMVEUlJSWnej3aAAAAFElEQVQImWNgYGIAEwxYBBhgYAAAAwgAATV1m2AAAAAASUVORK5CYII=" width="${w1}" height="5" align="top" style="background:#5555ff;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAMAAAC6s1CPAAAAA1BMVEWAgICAX0AAAAAEQVR42mNgAAAAQwABR0f6cwAAAABJRU5ErkJggg==" width="${w2}" height="5" align="top" style="background:#aaaaaa;">`;
    }

    function renderFFATables(turn, allies, enemies) {
      const allyHtml = allies.map(a => `
        <TR>
            <TD>${esc(a.name)}</TD>
            <TD>${a.hp}/${a.maxGenki}<br>${renderFFAHPBar(a.hp, Math.max(1, a.maxGenki))}</TD>
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

    async function startVisualBattle(map, brother, sister, enemies, onWin, onLose) {
      const allies = [brother, sister];
      allies[0].isAlly = true;
      allies[1].isAlly = true;
      allies[0].hp = allies[0].genki;
      allies[1].hp = allies[1].genki;
      
      const logTerminal = document.getElementById("battleLogTerminal");
      const eNameEl = document.getElementById("enemyNameDisplay");
      if (eNameEl) eNameEl.textContent = enemies.map(e=>e.name).join(", ");
      
      // Clear logs and hide the previous old HP bar display
      logTerminal.innerHTML = "";
      const vsOldDisplay = logTerminal.previousElementSibling;
      if (vsOldDisplay) {
         vsOldDisplay.style.display = "none";
      }
      logTerminal.previousElementSibling.previousElementSibling.style.display = "none"; // the h4 and enemyHpText
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
       <h1 style="font-size:14pt;">二人は、${enemies.map(e=>e.name).join(", ")} に戦いを挑んだ！！</h1><hr size=0><p>`);
      
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
          
          if (actor.status.includes('毒')) {
            const pd = Math.floor(actor.maxHp * 0.05) + 1;
            actor.hp -= pd;
            if (actor.hp < 0) actor.hp = 0;
            turnLogs += `<p>${actor.name} は毒に侵されている！ <font class="ffa-dmg"><b>${pd}</b></font> のダメージ！</p>`;
            if (actor.hp <= 0) continue;
          }
          
          if (actor.isAlly) {
            if (actor.limit >= 100) {
              actor.limit = 0;
              if (actor.id === "brother") {
                const target = pick(enemies.filter(e => e.hp > 0));
                const dmg = Math.floor(actor.power * 5 * (100 / (100 + target.guard * BALANCE.guardScale)));
                target.hp -= dmg;
                turnLogs += `<p> ${actor.name} は限界を超え、渾身の一撃を放ったッ！！<br> ${target.name} に <font class="ffa-dmg"><b>${dmg}</b></font> の大ダメージを与えた！</p>`;
              } else {
                 allies.forEach(a => { 
                   a.hp = Math.min(a.maxGenki, Math.floor(a.hp + a.maxGenki * 0.4));
                   a.status = [];
                 });
                 turnLogs += `<p> ${actor.name} は祈りを捧げ、癒やしの風を呼び起こした！！<br> 味方全体の傷が大きく回復し、状態異常が治った！</p>`;
              }
              continue;
            }
            
            if (actor.id === "sister" && chance(30) && allies.some(a => a.hp < a.maxGenki * 0.5)) {
               const target = allies.sort((a,b)=> (a.hp/a.maxGenki) - (b.hp/b.maxGenki))[0];
               const heal = Math.floor(actor.power * 1.5 + 5);
               target.hp = Math.min(target.maxGenki, target.hp + heal);
               turnLogs += `<p> ${actor.name} は ${target.name} を回復した！ <font class="ffa-heal"><b>${heal}</b></font> の回復。</p>`;
               actor.limit += 15;
            } else {
               const target = pick(enemies.filter(e => e.hp > 0));
               if (!target) break;
               const res = doAttack(actor, target, 1.0);
               const hitLog = res.hits > 1 ? `怒涛の${res.hits}連続攻撃！！ ` : "";
               turnLogs += `<p> ${actor.name} は ${target.name} に向かって武器を振り下ろした！！<br>${hitLog}${target.name} に <font class="ffa-dmg"><b>${res.totalDmg}</b></font> のダメージを与えた。</p>`;
               actor.limit += 15;
            }
            
          } else {
            const target = pick(allies.filter(a => a.hp > 0));
            if (!target) break;
            const res = doAttack(actor, target, envDmgRatio);
            target.hp -= 0; 
            target.limit = Math.min(100, (target.limit || 0) + Math.floor(res.totalDmg / target.maxGenki * 50) + 5);
            let sTxt = "";
            if (map.chaosLevel > 0 && chance(20) && !target.status.includes('毒')) {
              target.status.push('毒');
              sTxt = "【毒を受けた】";
            }
            let critTx = chance(10) ? `<b class="ffa-crit">クリティカル！！</b> ` : "";
            turnLogs += `<p><BLOCKQUOTE> ${actor.name} が襲いかかった！！  ${critTx}${target.name} に <font class="ffa-dmg"><b>${res.totalDmg}</b></font> のダメージを与えた。${sTxt}</BLOCKQUOTE></p>`;
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
         addHTMLBlock(`<b><font size=5>二人は、戦闘に負けた・・・。</font></b><p><p>`);
         onLose();
      } else {
         const quotes = ["くそっ……こんなところで……", "おのれ……覚えてろ……！", "グァアアア！", "……消滅……", "ば、馬鹿な……！"];
         addHTMLBlock(`<p>「${pick(quotes)}」</p><b><font size=5>見事、敵を打ち倒した！</font></b><p><p>`);
         onWin();
      }
    }
"""

patched = text[:idx1] + new_logic + text[idx2:]

with open('js/engine-battle.js', 'w', encoding='utf-8') as f:
    f.write(patched)

print("FFA Battle Rendering Patched cleanly.")
