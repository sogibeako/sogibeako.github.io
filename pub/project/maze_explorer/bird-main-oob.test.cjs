const a=require('node:assert/strict'),M=require('./core.js'),W=require('./main-wands.js'),E=require('./wand-engine.js');
for(const reflector of ['wall','dog'])for(let d=0;d<4;d++){
 const width=8,height=8,cells=new Uint8Array(64).fill(1),bird=(d===0?3:d===1?31:d===2?59:24),back=(d+2)%4,near=E.next({width,height,wrap:true},bird,back),wall=E.next({width,height,wrap:true},near,back);cells[wall]=0;
 const g=M.createGame({width,height,cells,start:45,exit:18,seed:'bird-oob-'+d,topology:'torus',birdMode:true,validation:{floors:63}});M.enableWands(g);g.bird.position=bird;g.bird.cooldown=999;g.wildlife.pets=[];g.wands.held=['push'];g.wands.items=[];g.wands.reflectors=[{from:near,d:back,id:wall}];
 const nav={step:(id,d)=>{const e=M.transition(g.world,{world_position:id,orientation:1,sheet:0},Object.keys(M.DIRS)[d]);return e?.to??null;},escape:(id,d)=>{const e=M.transition(g.world,{world_position:id,orientation:1,sheet:0},Object.keys(M.DIRS)[d]);return e?.kind==='wrap'?d:null;},relocate:()=>{throw Error('Player should not move');}};
 if(reflector==='dog'){g.wildlife.pets=[{kind:'d',id:near,mode:'wander',left:0}];g.wands.reflectors=[];g.bird.cooldown=0;g.wands.birds[0].held=['push'];g.turns=2;g.birdRandom=()=>0;a(W.bird(g,nav,g.bird));}else W.fire(g,nav,'B0','push',back);a.equal(g.bird.oob.direction,d);a(!g.wands.oob);a.equal(g.player.world_position,45);a.equal(M.wildlifeAdapter(g).birds().length,0);
 const resting={...g.bird.oob};for(let t=0;t<12;t++)M.waitTurn(g);a.deepEqual(g.bird.oob,resting);a.equal(g.bird.position,bird);
}
// Direct, unreflected pushes do not escape, even when the first step wraps.
const w={width:5,height:5,cells:Array(25).fill('.'),wrap:true,escape:(id,d)=>id<5&&d===0?0:null};
const actors=[{key:'@',id:7},{key:'B0',id:2}];const r=E.cast(w,actors,'@',0,'push');a.equal(r.oob,undefined);
console.log('Reflected bird self-OOB on all four edges and dormancy passed; unreflected push retains original rules');
