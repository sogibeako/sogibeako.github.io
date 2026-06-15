import re
import os

folder = 'js'

# --- 1. Update engine-save.js ---
save_path = os.path.join(folder, 'engine-save.js')
with open(save_path, 'r', encoding='utf-8') as f:
    save_code = f.read()

# Make sure floorContext is inside dungeon
if 'floorContext: null' not in save_code:
    save_code = save_code.replace("currentFloor: 1,", "currentFloor: 1, floorContext: null,")
with open(save_path, 'w', encoding='utf-8') as f:
    f.write(save_code)


# --- 2. Update engine-dungeon.js ---
dungeon_path = os.path.join(folder, 'engine-dungeon.js')
with open(dungeon_path, 'r', encoding='utf-8') as f:
    dungeon_code = f.read()

# Change signature: generateMap(center = 100, spread = 70, nextMapPreview = null)
#   => generateMap(center = 100, spread = 70, context = null)
dungeon_code = dungeon_code.replace(
    'function generateMap(center = 100, spread = 70, nextMapPreview = null) {',
    'function generateMap(center = 100, spread = 70, context = null) {'
)

old_biome_logic = """      const isDouble = !isTriple && chaosRoll < t2;
      const isChaos = isTriple || isDouble;
      let biomeName, biomeIcon, isChaosMap = false, chaosLevel = 0, biomeIds = [];

      if (isTriple) {
        const bs = pickN(BIOMES, 3); biomeIds = bs.map(b => b.id);
        biomeName = `${pick(CP)}${bs[0].name}${bs[1].name}${pick(CTC)}${bs[2].name}`;
        biomeIcon = bs.map(b => b.icon).join(""); isChaosMap = true; chaosLevel = 3;
      } else if (isDouble) {
        const bs = pickN(BIOMES, 2); biomeIds = bs.map(b => b.id);
        biomeName = (chance(40) ? pick(CP) : "") + bs[0].name + bs[1].name;
        biomeIcon = bs[0].icon + bs[1].icon; isChaosMap = true; chaosLevel = 2;
      } else {
        const b = pick(BIOMES); biomeIds = [b.id]; biomeName = b.name; biomeIcon = b.icon;
      }"""

new_biome_logic = """      const isDouble = !isTriple && chaosRoll < t2;
      const isChaos = isTriple || isDouble;
      let biomeName, biomeIcon, isChaosMap = false, chaosLevel = 0, biomeIds = [];

      if (context) {
        biomeIds = context.biomeIds;
        biomeName = context.biomeName;
        biomeIcon = context.biomeIcon;
        isChaosMap = context.isChaosMap;
        chaosLevel = context.chaosLevel;
      } else {
        if (isTriple) {
          const bs = pickN(BIOMES, 3); biomeIds = bs.map(b => b.id);
          biomeName = `${pick(CP)}${bs[0].name}${bs[1].name}${pick(CTC)}${bs[2].name}`;
          biomeIcon = bs.map(b => b.icon).join(""); isChaosMap = true; chaosLevel = 3;
        } else if (isDouble) {
          const bs = pickN(BIOMES, 2); biomeIds = bs.map(b => b.id);
          biomeName = (chance(40) ? pick(CP) : "") + bs[0].name + bs[1].name;
          biomeIcon = bs[0].icon + bs[1].icon; isChaosMap = true; chaosLevel = 2;
        } else {
          const b = pick(BIOMES); biomeIds = [b.id]; biomeName = b.name; biomeIcon = b.icon;
        }
      }"""

dungeon_code = dungeon_code.replace(old_biome_logic, new_biome_logic)

# In generateFloorContent, pass context down
dungeon_code = dungeon_code.replace(
    'function generateFloorContent(difficulty, floorNum) {',
    'function generateFloorContent(difficulty, floorNum, context = null) {'
)
dungeon_code = dungeon_code.replace(
    'const mapData = generateMap(targetLevel, spread);',
    'const mapData = generateMap(targetLevel, spread, context);'
)

with open(dungeon_path, 'w', encoding='utf-8') as f:
    f.write(dungeon_code)


# --- 3. Update main.js ---
main_path = os.path.join(folder, 'main.js')
with open(main_path, 'r', encoding='utf-8') as f:
    main_code = f.read()

# Fix startDungeon to reset floor and context
main_code = main_code.replace('''    function startDungeon(difficultyObj) {
       currentDifficulty = difficultyObj;
       gameState.dungeon.active = true;
       gameState.dungeon.currentFloor = 1;''',
'''    function startDungeon(difficultyObj) {
       currentDifficulty = difficultyObj;
       gameState.dungeon.active = true;
       gameState.dungeon.currentFloor = 1;
       gameState.dungeon.floorContext = null; // generate new context on first floor''')

# Fix enterNextFloor to generate EVENT effects and use floorContext
old_floor = '''    function enterNextFloor() {
       updateGamePanel();
       const floorData = generateFloorContent(currentDifficulty, gameState.dungeon.currentFloor);'''
new_floor = '''    function enterNextFloor() {
       updateGamePanel();
       
       // Handle context
       let context = gameState.dungeon.floorContext;
       const floorData = generateFloorContent(currentDifficulty, gameState.dungeon.currentFloor, context);
       
       if (gameState.dungeon.currentFloor === 1 || !context) {
          gameState.dungeon.floorContext = {
             biomeIds: floorData.mapData.biomeIds || [floorData.mapData.blocks[0].name], // fallback
             biomeName: floorData.mapData.biomeName,
             biomeIcon: floorData.mapData.biomeIcon,
             isChaosMap: floorData.mapData.isChaosMap,
             chaosLevel: floorData.mapData.chaosLevel
          };
       }
       saveGame();'''

# To prevent matching issues, let's use regex
import re
main_code = re.sub(r'function enterNextFloor\(\)\s*\{\s*updateGamePanel\(\);\s*const floorData = generateFloorContent\(currentDifficulty, gameState\.dungeon\.currentFloor\);', new_floor, main_code)

# Add event application and display
old_event_html = '''       eventEl.innerHTML = floorData.events.length > 0 
          ? floorData.events.map(ev => `[${ev.typeLabel}] ${ev.icon} ${ev.title}<br/><span style="color:#aaa;">${ev.desc}</span>`).join("<br/><br/>")
          : "特に変わった出来事は起こらなかった。";'''

new_event_logic = '''
       // Apply Event Effects mathematically!
       let effectLogs = [];
       if (floorData.events.length > 0) {
           floorData.events.forEach(ev => {
               if (ev.type === "campsite") {
                   const healBr = Math.floor(gameState.brother.maxGenki * 0.3);
                   const healSi = Math.floor(gameState.sister.maxGenki * 0.3);
                   gameState.brother.genki = Math.min(gameState.brother.maxGenki, gameState.brother.genki + healBr);
                   gameState.sister.genki = Math.min(gameState.sister.maxGenki, gameState.sister.genki + healSi);
                   effectLogs.push(`[${ev.typeLabel}] ${ev.icon} ${ev.title} ... 二人のHPが回復した！`);
               } else if (ev.type === "trap") {
                   const dmgBr = Math.floor((Math.random() * 0.1 + 0.05) * gameState.brother.maxGenki);
                   const dmgSi = Math.floor((Math.random() * 0.1 + 0.05) * gameState.sister.maxGenki);
                   gameState.brother.genki -= dmgBr;
                   gameState.sister.genki -= dmgSi;
                   effectLogs.push(`[${ev.typeLabel}] ${ev.icon} ${ev.title} ... トラップで手痛いダメージを受けた！(一彌-${dmgBr} / 一埜-${dmgSi})`);
               } else if (ev.type === "treasure") {
                   const apGain = Math.floor(Math.random() * 10) + parseInt(floorData.mapData.level);
                   gameState.meta.adventurePoints += apGain;
                   effectLogs.push(`[${ev.typeLabel}] ${ev.icon} ${ev.title} ... 冒険ポイントを ${apGain} 獲得した！`);
               } else {
                   effectLogs.push(`[${ev.typeLabel}] ${ev.icon} ${ev.title} ... (特に影響はなかった)`);
               }
           });
       } else {
           effectLogs.push("特に変わった出来事は起こらなかった。");
       }
       
       eventEl.innerHTML = effectLogs.join("<br/><br/>");
'''

main_code = main_code.replace(old_event_html, new_event_logic)

# Monster injection
# old createEnemies: 
old_create_enemies = '''    function createEnemies(mapData) {
       const level = mapData.level;
       return mapData.monsters.map((mInfo, idx) => {
          const isBoss = mapData.level % 10 === 0 && idx === 0;
          const hpMulti = isBoss ? 3 : 1;
          const pwMulti = isBoss ? 1.5 : 1;
          const n = isBoss ? "BOSS: " + mInfo.name : mInfo.name;
          
          return {
             id: "enemy_" + idx + "_" + Date.now(),
             name: n,
             isBoss: isBoss,
             maxHp: Math.floor(100 * (level/10) * hpMulti) + 50,
             hp: Math.floor(100 * (level/10) * hpMulti) + 50,
             power: Math.floor(10 * (level/10) * pwMulti) + 5,
             defense: Math.floor(5 * (level/10)) + 2,
             speed: Math.floor(5 * (level/10)) + 5,
             image: isBoss ? "boss.png" : "enemy.png"
          };
       });
    }'''

new_create_enemies = '''    function parseMonsterStats(mInfo, baseLevel, isBoss) {
        // Simple matrix setup:
        let hpM = 1.0, pwM = 1.0, dfM = 1.0, spM = 1.0;
        
        // Match BM/BIM keywords to adjust specific roles
        const n = mInfo.name;
        if (n.includes("スライム") || n.includes("ワーム")) { hpM = 1.6; dfM = 0.5; }
        if (n.includes("ゴーレム") || n.includes("サイクロプス")) { dfM = 2.0; spM = 0.3; hpM = 1.3; }
        if (n.includes("ゴブリン") || n.includes("コボルド")) { pwM = 0.8; hpM = 0.8; spM = 1.2; }
        if (n.includes("ウルフ") || n.includes("ラビット")) { spM = 1.8; hpM = 0.6; }
        if (n.includes("ドラゴン") || n.includes("死神")) { hpM = 2.0; pwM = 1.5; dfM = 1.5; }
        
        // Match prefixes (MA)
        if (n.includes("若い") || n.includes("ちいさな")) { hpM *= 0.6; pwM *= 0.7; }
        if (n.includes("歴戦の") || n.includes("凶暴な")) { hpM *= 1.4; pwM *= 1.4; }
        if (n.includes("不死の") || n.includes("古代の")) { hpM *= 2.5; dfM *= 1.5; }
        if (n.includes("神殺しの") || n.includes("世界を喰らう")) { hpM *= 10; pwM *= 5; dfM *= 3; spM *= 2; }
        
        if (isBoss) { hpM *= 3; pwM *= 1.5; }
        
        // Base formulas scaling with Level
        const maxHp = Math.floor(60 * (baseLevel/5) * hpM) + 40;
        return {
           id: "enemy_" + Math.random().toString(36).substr(2, 9),
           name: isBoss ? "BOSS: " + n : n,
           isBoss: isBoss,
           maxHp: maxHp,
           hp: maxHp,
           power: Math.floor(10 * (baseLevel/10) * pwM) + 5,
           defense: Math.floor(6 * (baseLevel/10) * dfM) + 1,
           speed: Math.floor(10 * (baseLevel/10) * spM) + 5,
           image: "enemy.png"
        };
    }

    function createEnemies(mapData) {
       const level = mapData.level;
       return mapData.monsters.map((mInfo, idx) => {
          const isBoss = mapData.level % 10 === 0 && idx === 0;
          return parseMonsterStats(mInfo, level, isBoss);
       });
    }'''

main_code = main_code.replace(old_create_enemies, new_create_enemies)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(main_code)

print("Patch applied successfully.")
