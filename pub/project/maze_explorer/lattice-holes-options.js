/* Applied generation settings and random-course selection, without form controls. */
(function(root){
'use strict';
function applied(world,seed){
 return {maze:world.maze,seed,shiftX:world.lattice.shiftX,shiftY:world.lattice.shiftY,periodSize:world.lattice.width,periodWidth:world.lattice.width,periodHeight:world.lattice.height,growth:world.growth,wallStyle:world.wallStyle,underpasses:world.floorUnderpasses??0,underpassShape:world.underpassShape,holeRimWalls:world.holeRimWalls??false,returnPocket:world.returnPocket??false};
}
function randomize(base,settings,rng=Math.random){
 const options={...base};if(!settings.enabled)return options;
 const pick=values=>values[Math.floor(rng()*values.length)];
 if(settings.growth)options.growth=pick(['walls','dfs','prim','growing']);
 if(settings.wall)options.wallStyle=pick(['dense','grid']);
 if(settings.size){const min=settings.min,max=settings.max,sizes=[12,16,20,24];if(!sizes.includes(min)||!sizes.includes(max)||min>max)throw Error('ランダムの周期サイズは最小≦最大にしてください。');options.periodSize=pick(sizes.filter(n=>n>=min&&n<=max));options.periodWidth=options.periodSize;options.periodHeight=options.periodSize;}
 if(settings.shift){options.shiftX=pick([-4,-2,0,2,4]);options.shiftY=pick([-4,-2,0,2,4]);}
 if(settings.passages){options.underpasses=pick([0,1,2,3,4,5,6]);options.underpassShape=pick(['straight','mixed','corners']);}
 return options;
}
const api={applied,randomize};if(typeof module==='object')module.exports=api;else root.SkewOptions=api;
})(globalThis);
