const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('./core.js'),S=require('./main-session.js');
const source=fs.readFileSync(__dirname+'/app.js','utf8'),status={textContent:''};let renders=0;
const c={MazeCore:M,MazeSession:S,$:()=>status,render(){renders++;}};
vm.runInNewContext(source.slice(source.indexOf('function matchingResultMessage('),source.indexOf("$('matchAll').addEventListener")),c);
const node=(id,feature='')=>({world_id:id,x:id%17,y:Math.floor(id/17),terrain:1,feature});
const chart=nodes=>new Map(nodes.map(n=>['C'+n.world_id,n]));
const g=M.createGame(M.createWarpDemo());c.game=g;
const before=[g.steps,g.turns,g.player.world_position];
c.matchAvailableMaps();assert.match(status.textContent,/まだありません/);
g.cognition.memory_nodes=chart([node(20,'1')]);g.cognition.archives=[{nodes:chart([node(20,'1')])},{nodes:chart([node(22,'2')])}];
c.matchAvailableMaps();assert.match(status.textContent,/地図帳 1 を/);assert.match(status.textContent,/1冊が現在の地図につながり、1冊は保留/);
c.matchAvailableMaps();assert.match(status.textContent,/今回、新しくつながる記録はありません/);assert.match(status.textContent,/1冊は保留/);
g.cognition.memory_nodes.set('C22',node(22,'2'));c.matchAvailableMaps();assert.match(status.textContent,/地図帳 2 を/);assert.match(status.textContent,/2冊すべて/);
c.matchAvailableMaps();assert.match(status.textContent,/すでに/);assert(!status.textContent.includes('保留'));
assert.deepEqual([g.steps,g.turns,g.player.world_position],before);
// A matched saved chart includes its explicitly recorded earlier sources.
g.cognition.archives=[{nodes:chart([])},{nodes:chart([]),sources:[0]},{nodes:chart([])}];g.cognition.matchedArchives=new Set([1]);
assert.match(c.matchingResultMessage([]),/2冊が現在の地図につながり、1冊は保留/);
g.cognition.matchedArchives.add(2);assert.match(c.matchingResultMessage([]),/3冊すべて/);
assert.equal(renders,5);
// Both dedicated buttons use the same result formatter and retain their operation.
const handlers={},b={...c,$:id=>id==='status'?status:{addEventListener(event,fn){handlers[id]=fn;}}};
vm.runInNewContext(source.slice(source.indexOf("$('matchRecorded').addEventListener"),source.indexOf('function render()')),b);
handlers.matchRecorded();assert.match(status.textContent,/3冊すべて/);handlers.matchEntrance();assert.match(status.textContent,/3冊すべて/);
console.log('PASS: C and both buttons report absent, partially matched, pending, newly completed and already completed archives; inherited sources counted and turns unchanged.');
