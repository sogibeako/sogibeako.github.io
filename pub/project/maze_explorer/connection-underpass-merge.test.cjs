const assert=require('node:assert/strict'),S=require('./connection-space.js');
const state=S.create('underpass'),initial=S.observeWalkingMap(state),records=[...initial.chart.cells];
const floor=records.find(([,p])=>!p.wall&&!p.underpassProjection),local=records.find(([,p])=>p.underpassProjection),outside=records.find(([,p])=>!p.underpassProjection);
function fragment(changed){return {charts:[{number:1,cells:new Map(records)},{number:2,cells:new Map([[floor[0],{...floor[1]}],changed,['100,100',{...floor[1],x:100,y:100,groundX:100,groundY:100}]])}],active:0};}
const changed=[local[0],{...local[1],wall:!local[1].wall,signature:local[1].wall?'floor:0':'wall'}];
const book=fragment(changed);S.observeWalkingMap(state,book);assert.equal(book.charts.length,1);assert(book.charts[0].cells.has('100,100'));
const otherTerrain=fragment([outside[0],{...outside[1],signature:'changed-terrain'}]);S.observeWalkingMap(state,otherTerrain);assert.equal(otherTerrain.charts.length,2);
const displaced=fragment([local[0],{...changed[1],groundX:999}]);S.observeWalkingMap(state,displaced);assert.equal(displaced.charts.length,2);
// Ordinary crossing sheets keep their existing separate-chart behavior.
const regular=S.create('crossing'),normal=S.observeWalkingMap(regular);assert.equal(normal.book.charts.length,1);assert([...normal.chart.cells.values()].every(p=>p.underpassProjection===undefined));
console.log('Underpass merge: compatible fragment union, common memory retained, unrelated terrain and displaced registration remain separate');
