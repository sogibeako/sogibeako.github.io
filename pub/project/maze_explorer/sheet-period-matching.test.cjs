const a=require('node:assert/strict'),L=require('./lattice-holes.js'),S=require('./connection-space.js'),R=require('./lattice-holes-loops.js'),F=require('./lattice-holes-fold.js');
for(const [shiftX,shiftY] of [[0,0],[2,4],[-2,2]]){
 const s=L.create({maze:true,seed:'period-proof',periodWidth:16,periodHeight:20,shiftX,shiftY,features:{warp:true}});const ids=[...s.world.domain].filter(id=>s.world.cells[id]&&S.groundSheet(s.world,id)===0).slice(0,2);s.features.marks=new Map([[ids[0],'1'],[ids[1],'2']]);s.x=0;s.y=0;s.frame=[0,1,2,3];
 const cell=(id,mark,x,y)=>({id,mark,x,y,frame:[0,1,2,3],wall:false,signature:'floor:0'}),one=cell(ids[0],'1',0,0),two=cell(ids[1],'2',2,0),repeated=cell(ids[1],'2',2+16,-shiftY);
 const book={charts:[{number:1,cells:new Map([['0,0',one],['2,0',two]])},{number:2,cells:new Map()}],active:1};
 S.observeWalkingMap(s,book,[one,repeated]);a.equal(book.charts.length,1);a.equal(book.markMatches,1);a(R.knowledge(s).some(p=>p.a===1&&p.b===0&&p.byMarks&&p.learned&&p.count===0));a(F.memory(s,book.charts[0],20).some(p=>p.id===ids[0]&&p.x===16&&p.y===-shiftY));s.loopThreshold=0;a(R.knowledge(s).every(p=>!p.learned));s.loopThreshold=3;
 const isolated=L.create({maze:true,seed:'period-proof',periodWidth:16,periodHeight:20,shiftX,shiftY,features:{warp:true}});isolated.features.marks=s.features.marks;const separate={charts:[{number:1,cells:new Map([['2,0',two]])},{number:2,cells:new Map([['0,0',one]])}],active:1};S.observeWalkingMap(isolated,separate,[one]);a.equal(isolated.markPeriods,undefined);
 console.log('shift',shiftX,shiftY,': registered repeated mark proves period; unregistered chart and OFF do not fold.');
}
