const assert=require('node:assert/strict'),R=require('./random-journey.js'),J=require('./main-journey.js'),S=require('./main-session.js');
let base=J.start({seed:'random-base',width:15,height:11,algorithm:'dfs'});base.journey.random=R.validate(R.defaults);
for(let i=0;i<180;i++){
 const g=J.begin(base,'random-'+i,'random'),o=g.generationOptions;
 assert(o.width>=15&&o.width<=31&&o.height>=11&&o.height<=23);
 assert(g.world.width>=15&&g.world.width<=31&&g.world.height>=11&&g.world.height<=23);
 if(i<15){S.attach(g);const restored=S.decode(S.encode(g,'random'));assert.equal(restored.course,'random');assert.deepEqual(restored.game.journey.random,base.journey.random);}
}
for(const [n,topology] of [[8,'torus'],[9,'plane']]){
 const c={...R.defaults,minWidth:n,maxWidth:n,minHeight:n,maxHeight:n,algorithms:['dfs'],topologies:[topology],rules:['plain']};base.journey.random=c;
 const g=J.begin(base,'fixed-'+n,'random');assert.equal(g.world.width,n);assert.equal(g.world.height,n);assert.equal(g.generationOptions.topology,topology);
 S.attach(g);S.markExport(g,'random');assert(S.info(g,'random').current);g.journey.random={...c,maxWidth:n+2};assert(!S.info(g,'random').current);
}
for(const patch of [{algorithms:[]},{rules:[]},{topologies:[]},{minWidth:50,maxWidth:10},{minHeight:8.5},{algorithms:['division'],topologies:['torus']},{rules:['keys'],topologies:['torus']},{minWidth:8,maxWidth:8,minHeight:9,maxHeight:9}])assert.throws(()=>R.validate({...R.defaults,...patch}));
base.player.world_position=base.world.exit;base.won=true;const next=J.next(base,'random-next','random');assert.deepEqual(next.journey.random,base.journey.random);assert.equal(next.journey.completed,1);assert.deepEqual(J.restart(next).journey.random,base.journey.random);
assert.equal(J.begin(base,'normal','plain').generationOptions.topology,'plane');
console.log('PASS: 180 random mazes, bounded actual dimensions, 15 session round trips, exact sizes, candidate exclusions, invalid combinations, dirty saves and independent existing course.');

assert.equal(R.inspect(R.defaults).count,66);
const onlyTorus={...R.defaults,topologies:['torus']};assert.equal(R.inspect(onlyTorus).count,21);
const impossible={...onlyTorus,algorithms:['division'],rules:['keys']};assert.equal(R.inspect(impossible).count,0);assert.equal(R.inspect(impossible).spaces[0].reasons.length,2);assert.throws(()=>R.validate(impossible));
const odd={...R.defaults,minWidth:9,maxWidth:9,minHeight:9,maxHeight:9};assert.equal(R.inspect(odd).count,45);assert.equal(R.inspect(odd).spaces[1].count,0);assert(R.inspect(odd).spaces[1].reasons.some(x=>x.includes('偶数')));
for(let i=0;i<100;i++){const choice=R.choose('preview-'+i,onlyTorus);assert.equal(choice.options.topology,'torus');assert(!['division','eller'].includes(choice.options.algorithm));assert(!choice.options.keyDoor);}
console.log('PASS: preview counts, parity and unsupported-combination reasons agree with generation; impossible drafts cannot be applied.');

const configRecord=R.exportSettings({...R.defaults,algorithms:['prim'],rules:['warp'],minWidth:21});
assert.deepEqual(R.importSettings(configRecord),{...R.defaults,algorithms:['prim'],rules:['warp'],minWidth:21});
assert.deepEqual(R.importSettings('\uFEFF'+configRecord),R.importSettings(configRecord));
assert.deepEqual(Object.keys(JSON.parse(configRecord)),['format','version','settings']);
for(const invalid of ['', 'null', '[]', '{', ' '.repeat(10001),configRecord.replace('"version": 1','"version": 2'),configRecord.replace('maze-random-settings','maze-planar-session'),JSON.stringify({format:'maze-random-settings',version:1,settings:{...R.defaults,rules:[]}})])assert.throws(()=>R.importSettings(invalid));
const imported=R.importSettings(configRecord);imported.algorithms.push('dfs');assert.deepEqual(R.importSettings(configRecord).algorithms,['prim']);
console.log('PASS: standalone settings round trip, BOM, format/version/length/invalid candidates, independent copies.');
// Each subtype must be honored in actual generated worlds and replay records.
for(const topology of ['plane','torus'])for(const style of R.catalog.warpStyles)for(let i=0;i<3;i++){
 const config={...R.defaults,topologies:[topology],rules:['warp'],warpStyles:[style]};
 base.journey.random=config;const g=J.begin(base,'warp-choice-'+topology+'-'+style+'-'+i,'random');
 assert.equal(g.world.warpStyle,style);assert.equal(g.world.topology||'plane',topology);
 S.attach(g);assert.deepEqual(S.decode(S.encode(g,'random')).game.journey.random,config);
}
const legacy={...R.defaults};delete legacy.warpStyles;delete legacy.warpRotations;delete legacy.warpVisibility;
assert.deepEqual(R.validate(legacy),legacy);
assert.deepEqual(R.importSettings(R.exportSettings(legacy)),legacy);
base.journey.random=legacy;const old=S.attach(J.begin(base,'legacy-subtypes','random')),oldText=S.encode(old,'random');assert.equal(S.encode(S.decode(oldText).game,'random'),oldText);
for(let i=0;i<20;i++)assert.deepEqual(R.choose('legacy-'+i,legacy),R.choose('legacy-'+i,R.defaults));
assert.throws(()=>R.validate({...R.defaults,warpStyles:[]}));assert.throws(()=>R.validate({...R.defaults,warpStyles:['bad']}));assert.throws(()=>R.validate({...R.defaults,warpStyles:['pair','pair']}));
assert.doesNotThrow(()=>R.validate({...R.defaults,rules:['plain'],warpStyles:[]}));
console.log('PASS: 24 generated warp mazes honor selected subtype; legacy replay bytes and seeded choices preserved, invalid/empty subtype rules checked.');

for(const rotation of R.catalog.warpRotations){
 const config={...R.defaults,topologies:['plane'],rules:['warp'],warpRotations:[rotation]};
 base.journey.random=config;const g=J.begin(base,'rotation-choice-'+rotation,'random');
 assert.equal(g.world.rotatingWarp||'none',rotation);S.attach(g);assert.deepEqual(S.decode(S.encode(g,'random')).game.journey.random,config);
 assert.deepEqual(R.importSettings(R.exportSettings(config)),config);
}
assert.throws(()=>R.validate({...R.defaults,warpRotations:[]}));assert.throws(()=>R.validate({...R.defaults,warpRotations:['unknown']}));assert.throws(()=>R.validate({...R.defaults,warpRotations:['none','none']}));
assert.equal(R.choose('no-torus-rotation',{...R.defaults,topologies:['torus'],rules:['warp'],warpRotations:[]}).rotation,'none');
assert.doesNotThrow(()=>R.validate({...R.defaults,rules:['plain'],warpRotations:[]}));
const previous={...R.defaults};delete previous.warpRotations;delete previous.warpVisibility;assert.deepEqual(R.validate(previous),previous);
base.journey.random=previous;const previousGame=S.attach(J.begin(base,'previous-version','random')),previousText=S.encode(previousGame,'random');assert.equal(S.encode(S.decode(previousText).game,'random'),previousText);
console.log('PASS: all six plane warp orientations, settings/session round trips, torus restriction, invalid candidates, 7- and 8-field legacy settings.');

for(const topology of ['plane','torus'])for(const visibility of ['visible','invisible']){
 const config={...R.defaults,topologies:[topology],rules:['warp'],warpVisibility:[visibility]};base.journey.random=config;
 const g=S.attach(J.begin(base,'visibility-'+topology+visibility,'random'));assert.equal(g.world.warpInvisible,visibility==='invisible');assert.deepEqual(S.decode(S.encode(g,'random')).game.journey.random,config);
 assert.deepEqual(R.importSettings(R.exportSettings(config)),config);
}
const both={...R.defaults,rules:['warp'],warpVisibility:['visible','invisible']};const outcomes=new Set();for(let i=0;i<50;i++)outcomes.add(R.choose('visibility-'+i,both).options.warpInvisible);assert.equal(outcomes.size,2);
assert.throws(()=>R.validate({...R.defaults,warpVisibility:[]}));assert.throws(()=>R.validate({...R.defaults,warpVisibility:['bad']}));assert.doesNotThrow(()=>R.validate({...R.defaults,rules:['plain'],warpVisibility:[]}));
const v125={...R.defaults};delete v125.warpVisibility;assert.deepEqual(R.validate(v125),v125);for(let i=0;i<20;i++)assert.deepEqual(R.choose('v125-'+i,v125),R.choose('v125-'+i,R.defaults));
base.journey.random=v125;const v125Game=S.attach(J.begin(base,'legacy-visibility','random')),v125Text=S.encode(v125Game,'random');assert.equal(S.encode(S.decode(v125Text).game,'random'),v125Text);
console.log('PASS: visible/invisible plane and torus generation and saves, mixed choices, invalid candidates, prior-version default and replay compatibility.');
