const test=require('node:test'),assert=require('node:assert/strict');
const {Game}=require('./engine.js'),saves=require('./saves.js');
const seeded=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
test('saves roundtrip maps, infinity, items, player status, debug and music without regenerating',()=>{
 for(const floor of [1,15,25,30,35,40,49,50])for(const kind of ['lattice','irregular','puzzle']){
 const g=new Game(seeded(floor));g.startDebug(floor,16);g.generate(kind);g.hp-=7;g.confused=3;g.freezeGrace=true;g.waitCount=2;
 const m={order:['../material/music/a.mp3','../material/music/b.mp3'],index:1,floor};const text=saves.encode(g,m),restored=saves.decode(text);assert(restored.game instanceof Game);assert(restored.game.visited instanceof Set);assert(restored.game.items instanceof Map);assert.deepEqual(restored.music,m);assert.equal(restored.game.hp,g.hp);assert.equal(restored.game.waitCount,2);assert.equal(restored.game.sounds.length,0);assert.equal(restored.game.confused,3);assert.equal(restored.game.debug,true);assert.deepEqual(restored.game.enemies,g.enemies);assert.deepEqual(restored.game.nodes,g.nodes);assert.deepEqual(restored.game.items,g.items);assert.equal(restored.game.swordBase,g.swordBase);assert.equal(restored.game.distances(0).length,g.nodes.length);
 }
});
test('construction and quantum state are preserved and restored gameplay remains executable',()=>{
 const g=new Game(seeded(3));g.floor=35;g.generate('lattice');const e=g.enemies[0];e.builder=true;e.build={from:e.pos,to:0,remaining:2};e.quantum=true;e.damageScale=.5;e.quantumGroup=e.id;e.cooldown=3;
 const h=saves.decode(saves.encode(g)).game;assert.deepEqual(h.enemies[0],e);h.wait();assert.equal(h.turn,g.turn+1);
});
test('invalid, corrupt, ended, overlapping and malicious save files are rejected',()=>{
 const g=new Game(seeded(9)),base=JSON.parse(saves.encode(g));
 for(const mutate of [p=>p.version=9,p=>p.game.dead=true,p=>p.game.hp=-1,p=>p.game.player=999,p=>p.game.charges=[],p=>p.game.nodes[0].links=[999],p=>p.game.enemies[0].pos=p.game.player,p=>p.game.enemies[0].hp='Infinity',p=>p.game.edges=[],p=>p.game.items={$map:[[0,{kind:'bogus'}]]}]){const p=structuredClone(base);mutate(p);assert.throws(()=>saves.decode(JSON.stringify(p)));}
 assert.throws(()=>saves.decode('not JSON'));assert.throws(()=>saves.decode('{"__proto__":{}}'));g.dead=true;assert.throws(()=>saves.encode(g));g.dead=false;g.won=true;assert.throws(()=>saves.encode(g));
});
