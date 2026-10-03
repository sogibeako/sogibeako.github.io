const fs = require('fs');

const dataBiomes = fs.readFileSync('js/data-biomes.js', 'utf8');
const engineUtils = fs.readFileSync('js/engine-utils.js', 'utf8');
const engineBattle = fs.readFileSync('js/engine-battle.js', 'utf8');
const dataWorld = fs.readFileSync('js/data-world.js', 'utf8');

const testCode = `
  ${dataBiomes}
  ${engineUtils}
  ${dataWorld}
  ${engineBattle}
  
  const b = gameState.brother;
  const s = gameState.sister;
  refreshUnitStats(b);
  refreshUnitStats(s);
  b.genki = b.maxGenki;
  s.genki = s.maxGenki;
  
  const map = {
    level: 10,
    chaosLevel: 0,
    monsters: [{name: "スライム", chimera: false}],
    tierInfo: {label: "テスト"},
    biomeName: "平原"
  };
  
  const partyBefore = calcPartyStats(b, s);
  
  try {
     const result = resolveAdventure(map, b, s);
     console.log("Result:", result.battleLogs);
     
     const tone = makeAdventureLog(map, result, partyBefore, b, s);
     console.log("Logs:", tone);
  } catch(e) {
     console.error("ERROR CAUGHT:");
     console.error(e.stack);
  }
`;

fs.writeFileSync('test_battle.js', testCode);
