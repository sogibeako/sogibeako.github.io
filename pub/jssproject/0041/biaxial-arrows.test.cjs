const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),curves=[],starts=[],scope={warpSeen:new Set(),rules:{features:{warps:new Map([[10,20],[20,10]])}}};
vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('function drawWarpArrows'),source.indexOf('function display')),scope);
const ctx=new Proxy({},{get:(_,name)=>name==='quadraticCurveTo'?(...a)=>curves.push(a):name==='moveTo'?(...a)=>starts.push(a):()=>{}}),points=new Map([[10,[[20,20]]],[20,[[120,20]]]]);
scope.drawWarpArrows(ctx,points,24);assert.equal(curves.length,0);
scope.warpSeen.add(10);scope.drawWarpArrows(ctx,points,24);assert.equal(curves.length,1);assert(curves[0][2]>100);assert(curves[0][1]>20);
scope.warpSeen.add(20);curves.length=0;scope.drawWarpArrows(ctx,points,24);assert.equal(curves.length,2);assert(curves[1][2]<40);assert(curves[1][1]<20);assert(curves.flat().every(Number.isFinite));
curves.length=0;scope.drawWarpArrows(ctx,new Map([[10,[[20,20]]]]),24);assert.equal(curves.length,0);
console.log('Only traversed directions drawn; reciprocal arcs separate; missing endpoint suppressed; finite geometry.');
