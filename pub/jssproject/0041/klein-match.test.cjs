const assert=require('node:assert/strict'),K=require('./klein-learning.js');
const cell=(x,y,mark,wall=false,frame=[0,1,2,3])=>({x,y,mark,wall,frame,id:0});
const chart=rows=>({cells:new Map(rows.map(p=>[p.x+','+p.y,p]))});
// Duplicate landmarks are disambiguated by a second numbered landmark.
const a=chart([cell(0,0,'1'),cell(1,0,'2'),cell(5,0,'1'),cell(6,0,'3')]);
const b=chart([cell(10,0,'1'),cell(11,0,'2'),cell(12,0,null,true)]);
let book={charts:[a,b],active:0};assert.equal(K.matchMaps(book).merged,1);assert(a.cells.get('2,0').wall);assert.equal(book.charts.length,1);
// Reflected frames map an old row below the marker to the row above it.
const c=chart([cell(0,0,'4',false,[2,1,0,3])]),d=chart([cell(8,8,'4'),cell(8,9,null,true)]);
book={charts:[c,d],active:0};assert.equal(K.matchMaps(book).merged,1);assert(c.cells.get('0,-1').wall);
// Equally supported possibilities and conflicting walls must remain separate.
book={charts:[chart([cell(0,0,'1'),cell(5,0,'1')]),chart([cell(20,0,'1')])],active:0};assert.equal(K.matchMaps(book).merged,0);
book={charts:[chart([cell(0,0,'1'),cell(1,0,null,true)]),chart([cell(20,0,'1'),cell(21,0,null,false)])],active:0};assert.equal(K.matchMaps(book).merged,0);
console.log('Recorded landmark matching: repeated markers, reflection, ambiguity and conflicts passed.');

// User report, klein-c4d1cozy: replay the first 500 supplied steps and all four landmark placements.
const S=require('./connection-space.js'),F=require('./sheet-features.js');
const moves=[1,1,2,2,2,2,3,1,1,1,2,2,2,2,2,2,2,2,3,3,0,0,0,1,1,1,3,3,3,2,2,2,2,2,2,2,0,0,3,3,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,3,3,2,2,3,3,3,3,0,0,1,1,0,0,3,3,3,3,3,3,3,3,3,3,3,1,0,0,3,3,2,2,3,3,3,3,3,3,3,1,0,0,3,3,2,2,3,3,2,2,1,1,2,2,1,1,0,0,1,1,1,1,0,0,3,3,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,3,3,0,0,3,3,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,3,3,2,2,3,3,3,3,0,0,1,1,2,2,1,1,2,2,1,3,1,1,3,3,0,0,0,0,3,3,2,2,3,3,0,0,3,3,0,0,2,2,2,2,3,3,3,3,3,3,3,3,2,2,3,3,0,0,1,1,0,0,3,3,3,3,3,3,3,3,2,0,0,0,3,3,1,1,0,0,0,0,0,0,1,1,3,3,2,2,0,0,0,0,0,0,0,1,1,3,3,2,2,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,2,2,1,1,3,3,3,3,3,3,3,3,3,3,3,3,1,1,2,2,1,1,0,0,1,1,2,2,1,1,2,2,1,1,1,1,0,0,2,2,3,3,3,3,0,0,3,3,0,0,3,3,2,2,3,3,0,0,3,3,2,2,3,3,3,3,3,3,3,1,2,2,0,0,3,3,2,2,3,3,3,3,0,0,1,1,0,0,3,3,3,3,3,3,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,3,3,0,0,1,1,0,0,3,3,3,3,3,3,3,1,1,2,2,1,1,0,0,1,1,2,2,1,1,0,0,1,1,2,2,1,1,2,2,1,1,1,1,0,0,1,1,1,3,3,3,2,2,2,2,2,2,0,0,0,0,0,0,3,3,1,1,2,2,2,2,2,2,2,2,2,2,3,3,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2,2,1];
function replay(improved){const s=S.create('kleinMaze',{guaranteeLoops:true,seed:'klein-c4d1cozy',width:24,height:20,growth:'dfs',floorUnderpasses:2,underpassShape:'mixed'});s.world.domain=new Set(s.world.cells.keys());F.install(s,{birds:true,keys:true,birdLeap:true,birdWander:true});const book={charts:[],active:-1},events=new Map([[0,25],[54,467],[252,363],[276,77]]);let merged=0;
 function observe(){if(events.has(s.steps)){assert.equal(s.id,events.get(s.steps));F.mark(s);}S.observeWalkingMap(s,book);if(improved)merged+=K.matchMaps(book).merged;}
 observe();for(const d of moves){assert(S.move(s,d,true),"step "+s.steps+" direction "+d);observe();}return {s,book,merged};}
const old=replay(false),fixed=replay(true);assert.equal(fixed.s.id,old.s.id);assert.deepEqual(fixed.s.features.marks,old.s.features.marks);assert(fixed.merged>0);assert(fixed.book.charts.length<old.book.charts.length);
console.log('User save:',moves.length,'steps; archived charts',old.book.charts.length,'->',fixed.book.charts.length,'additional merges',fixed.merged);


// A recovered reflected chart restores partial and complete loop evidence.
const learned=chart([cell(8,8,'4'),cell(8,9,null,true)]);
learned.loopCounts=new Map([['x:12',{axis:'x',offset:12,count:3}],['y',{axis:'y',offset:0,count:2}]]);
const landing=chart([cell(0,0,'4',false,[2,1,0,3])]);
book=K.attach({charts:[learned,landing],active:1});
const state={id:0,x:0,y:0,frame:[2,1,0,3],steps:10,loopThreshold:3};K.start(state);
K.sync(state,book);assert.equal(K.knowledge(state).length,0,'no restoration before alignment');
assert.equal(K.matchMaps(book).merged,1);K.sync(state,book);
assert.deepEqual(K.knowledge(state),[{axis:'x',offset:4,count:3,learned:true},{axis:'y',offset:0,count:2,learned:false}]);
K.sync(state,book);K.matchMaps(book);K.sync(state,book);assert.equal(K.knowledge(state)[0].count,3,'matching again never doubles laps');
// Shared automatic landmark merging uses the same transformed evidence callback.
const recovered=chart([]);book.onMerge(learned,recovered,{right:[1,0],down:[0,-1],ty:8});assert.equal(recovered.loopCounts.get('x:4').count,3);
state.steps++;state.features={last:{kind:'teleport'}};K.observe(state);assert.equal(K.knowledge(state).length,0);assert.equal(landing.loopCounts.get('x:4').count,3,'displacement preserves archived counts');
console.log('Loop recovery: no premature restoration, reflected axis, partial counts, idempotence and archived evidence passed.');
