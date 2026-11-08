const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),J=require('./main-journey.js'),S=require('./main-session.js');
const src=fs.readFileSync(__dirname+'/app.js','utf8'),ctx={};
vm.runInNewContext(src.slice(src.indexOf('function currentGenerationDetails('),src.indexOf('function renderJourneyOverview(')),ctx);
const describe=ctx.currentGenerationDetails;
function check(options){
 const g=S.attach(J.start({seed:'details-check',width:21,height:17,...options}));
 const before=S.encode(g,'same'),text=describe(g);
 assert.equal(S.encode(g,'same'),before);assert(!/undefined|NaN/.test(text));assert(text.includes(g.world.seed));
 assert.equal(describe(S.decode(before).game),text);
 return {g,text};
}
for(const roomPlacement of ['bsp','scatter','grid'])for(const connectionStyle of ['tree','chain','ring','hub']){
 const {g,text}=check({algorithm:'rooms',roomPlacement,connectionStyle,roomCount:24});
 assert(text.includes(`目標 24室 / 生成 ${g.world.rooms.length}室`));
}
for(const topology of ['plane','torus']){
 const {text}=check({algorithm:'growing',topology,width:20+(topology==='plane'?1:0),height:16+(topology==='plane'?1:0),newestBias:0});assert(text.includes('0%'));
}
for(const teleportPolicy of ['far','known','unseen']){
 const {g,text}=check({birdMode:true,birdCount:2,teleportPolicy,keyDoor:true,keyCount:3});
 assert(text.includes(`配置 ${g.birds.length}体`));assert(text.includes(`配置 ${g.world.puzzle.locks.length}組`));assert(text.includes('鳥人間の転移先'));
}
for(const warpStyle of ['pair','oneway','cycle3','cycle4']){
 const {g,text}=check({warpMode:true,warpCount:4,warpStyle,warpInvisible:true});assert(text.includes(`目標 4組 / 配置 ${g.world.warpCount}組`));
 assert(!text.includes('出発')&&!text.includes('到着')); // No endpoint listing.
}
const {text}=check({algorithm:'dfs',warpMode:false,warpCount:4,birdMode:false,birdCount:2,keyDoor:false,keyCount:3});
assert(!text.includes('ワープの組数')&&!text.includes('鳥人間：')&&!text.includes('鍵と扉：'));
console.log('PASS: live generation details for 12 room layouts, 2 topologies, 3 bird policies and 4 warp styles; disabled settings omitted, counts factual, no state changes, exact save restoration.');
