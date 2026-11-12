const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../ai_core.js'), 'utf8'), box);
const ai = box.window.MizuharaAI;
let serial = 0;
const tiles = text => text.split(' ').filter(Boolean).map(code => ({id: ++serial, suit:code[0], value:Number(code.slice(1))}));
const state = {
  wall: tiles('m1 m2 m3 p1 p2 p3 s1 s2 s3 z5 z5 z6 z6 z7 z7 m8 m9 p8 p9 s8 s9'),
  hands: [tiles('m1 m2 m3 m4 m5 m6 p2 p3 p4 s6 s7 z1 z1'), tiles('s3 s4 s5'), tiles('p9 z5 z5'), tiles('m9 s9')],
  players: [25000, 20000, 40000, 15000].map(score => ({score})),
  drawCounts:[6,6,6,6], turn:1, rivers:[[],[],[],[]], melds:[[],[],[],[]], dora:[]
};
const make = (playerIndex, timing = 'after_draw', extra = {}) => ai.getOracleHint({
  state, playerIndex, oracleEnabled:true, timing, rng:()=>0, ...extra
});
const ichino = make(1);
assert.equal(ichino.sources.find(s => s.source === 'wall').observations.length, state.wall.length);
assert.equal(ichino.sources.filter(s => s.source === 'hand').length, 3);
assert.equal(make(1, 'before_discard').active, false);
assert.equal(make(1, 'round_start').active, false);
const kazuya = make(0, 'round_start');
assert.equal(make(0).active, false);
assert.equal(kazuya.initialPlan.suit, 'm');
assert.equal(kazuya.sources.some(s => s.source === 'wall'), false);
const nanayo = make(2);
assert.equal(nanayo.targetSeat, 0, 'leader observer targets strongest opponent');
const swapped = make(1, 'after_draw', {assignments:{ichino:'nanayo_leader_hand'}});
assert.equal(swapped.targetSeat, 2);
assert.equal(swapped.sources.length, 1);
const context = {state, playerIndex:1, settings:{}, oracleEnabled:true, oracleHint:ichino, oracleHistory:[ichino]};
const inferred = ai.oracleHintForContext(context);
assert.equal(inferred.historyCount, 1, 'current observation is not double counted');
assert.ok(inferred.availabilityByKey.z6 > 0);
const hiddenChanged = {...state, hands:[tiles('z7 z7 z7'),state.hands[1],[],[]], wall:state.wall.map(() => tiles('z5')[0])};
const withoutPeeking = ai.oracleHintForContext({...context,state:hiddenChanged});
assert.equal(JSON.stringify(withoutPeeking.scoreByKey), JSON.stringify(inferred.scoreByKey));
const exhausted = {...state, rivers:[tiles('z6 z6'),[],[],[]], melds:[[],[],[{tiles:tiles('z6 z6')}],[]]};
const corrected = ai.oracleHintForContext({...context,state:exhausted});
assert.equal(corrected.evidence.z6.available,0);
assert.equal(corrected.availabilityByKey.z6,0);
assert.equal(corrected.scoreByKey.z6,0);
const falseObservation = {...ichino, sources:[{source:'wall',observations:Array.from({length:5},()=>({key:'z5'}))}]};
assert.equal(ai.countOracleHint(context,falseObservation).evidence.z5.factor,4/5);
assert.equal(ai.countOracleHint({...context,settings:{whiteCount:12}},falseObservation).evidence.z5.factor,1);
const target = ai.countOracleHint({...context,playerIndex:1},swapped);
assert.ok(target.spillByKey.p9 > 0);
assert.ok(target.dangerByKey.z5 > 0);
assert.equal(target.spillByKey.z5, 0);
const remembered = ai.oracleHintForContext({...context,playerIndex:0,oracleHint:{active:false,abilityId:kazuya.abilityId},oracleHistory:[kazuya]});
assert.equal(remembered.initialPlan.suit,'m');
assert.ok(Number.isFinite(remembered.scoreByKey.m1));
assert.equal(ai.oracleHintForContext({...context,oracleEnabled:false}).active,false);
const before = JSON.stringify(ichino);
ai.countOracleHint({...context,state:exhausted},ichino);
assert.equal(JSON.stringify(ichino),before,'observations remain unchanged');
const noisy = make(1,'after_draw',{rng:()=>0.7});
assert.ok(noisy.sources.every(source => source.observations.every(o => o.key === undefined && o.value !== undefined)));
assert.ok(noisy.sources.every(source => source.observations.every(o => !('symptom' in o) && !('id' in o))));
for (const characterId of ai.CHARACTER_IDS) {
  const result = ai.trainLearningData(ai.defaultLearningData(), {characterId,oracleEnabled:true,iterations:1});
  assert.ok(Number.isFinite(result.stats.averageReward));
}
console.log('Count oracles: timing, assignments, observations, inference isolation, evidence, memory, noise and training passed.');

const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const integration = {
  window:{MizuharaAI:ai}, cpuAiConfig:{oracleEnabled:true,oracleAssignments:ai.DEFAULT_ORACLE_ASSIGNMENTS},
  players:state.players, state:{...state, wall:tiles('m1 m2 m3 m4 m5 m6 m7 m8'),
    hands:[[],[],[],[]], flowers:[[],[],[],[]], drawCounts:[0,0,0,0],
    oracleHints:[null,null,null,null],oracleHistory:[[],[],[],[]]},
  clearTemporaryFuritenOnDraw(){}, addLog(){}, nextOpenUnitOrder:()=>1, label:()=>''
};
vm.createContext(integration);
for (const name of ['refreshOracleHints','recordOracleDraw','drawIntoHand']) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf('\nfunction ',start+1);
  vm.runInContext(app.slice(start,end),integration);
}
integration.drawIntoHand(1,false);
assert.equal(integration.state.oracleHistory[1].length,0,'dealing never triggers a draw ability');
integration.drawIntoHand(1,true);
assert.equal(integration.state.oracleHistory[1].length,1);
assert.equal(integration.state.drawCounts[1],1);
integration.refreshOracleHints('before_discard',1);
assert.equal(integration.state.oracleHistory[1].length,1,'discard evaluation must not reroll');
assert.equal(integration.state.oracleHints[1].active,true,'last observation stays inspectable');
integration.drawIntoHand(2,true);
assert.equal(integration.state.oracleHistory[2].length,1);
console.log('App draw integration: dealing excluded, one observation per draw, no discard reroll passed.');
