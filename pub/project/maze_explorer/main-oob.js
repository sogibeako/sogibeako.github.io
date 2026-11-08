/* Main torus OOB rooms. The ordinary map and its learning state stay untouched. */
(function(root){'use strict';const E=typeof module==='object'?require('./wand-engine.js'):root.WandEngine;
const names=['上','右','下','左'];
function active(g){return !!g.wands?.oob;}
function log(g,text){g.wands.events.push({turn:g.turns,text});if(g.wands.events.length>100)g.wands.events.shift();g.wands.revision++;}
function enter(g,target,d){const rooms=g.wands.oobRooms??={};rooms[d]??={visits:0};const room=E.oobRoom(d),used=g.birds.filter(b=>b.oob?.direction===d).map(b=>b.oob.id),floors=room.cells.map((c,id)=>c!=='#'&&c!=='>'&&c!=='X'?id:-1).filter(id=>id>=0&&!used.includes(id));const start=6*room.width+10;
 if(target==='@'){rooms[d].visits++;g.wands.oob={direction:d,id:used.includes(start)?floors[0]:start,from:g.player.world_position};g.wands.frozen=0;log(g,'境界の'+names[d]+'側へはみ出しました。THIS IS NOWHERE。自動歩行を停止します。緊急脱出口 > で > キーを押すと帰還します。');}
 else{const b=g.birds[Number(target.slice(1))];b.oob={direction:d,id:floors.find(id=>id!==start)??start};log(g,b.symbol+' は境界の'+names[d]+'側へはみ出し、休眠しました。');}
}
function move(g,d){if(!active(g))return false;const o=g.wands.oob,w=E.oobRoom(o.direction),to=E.next(w,o.id,d);if(to===null||w.cells[to]==='#'||g.birds.some(b=>b.oob?.direction===o.direction&&b.oob.id===to))return false;o.id=to;g.steps++;g.turns++;if(w.cells[to]==='>')log(g,'緊急脱出口です。> キーで元の迷路の安全な床へ帰還します。');if(w.cells[to]==='X')log(g,'特別な迷路への入口は工事中です。');return true;}
function home(g,nav){if(!active(g))return false;const o=g.wands.oob,w=E.oobRoom(o.direction);if(w.cells[o.id]!=='>'){log(g,'緊急脱出口 > まで歩いてください。');return false;}
 const q=[o.from],seen=new Set(q);for(const id of q)for(let d=0;d<4;d++){const n=nav.step(id,d);if(n!==null&&!seen.has(n)){seen.add(n);q.push(n);}}
 const free=q.filter(id=>id!==g.world.exit&&!g.world.warps?.has(id)&&!g.birds.some(b=>!b.oob&&b.position===id)&&!g.wildlife?.pets.some(p=>p.id===id));if(!free.length){log(g,'帰還先の安全な床が空いていません。');return false;}
 const to=free[(g.turns*17+o.direction*31)%free.length];delete g.wands.oob;g.turns++;nav.relocate(to);log(g,'緊急脱出口から元の迷路へ帰還しました。地図と周回理解は保持しています。');return true;}
function draw(ctx,g,width,height){if(!active(g))return false;const o=g.wands.oob,w=E.oobRoom(o.direction),tile=Math.min(24,(width-16)/w.width,(height-42)/w.height),ox=(width-w.width*tile)/2,oy=(height-w.height*tile)/2;ctx.fillStyle='#0b161c';ctx.fillRect(0,0,width,height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='13px Consolas, monospace';ctx.fillStyle='#eed4ea';ctx.fillText('外側・'+names[o.direction]+' ／ THIS IS NOWHERE ／ 緊急脱出口 > で > キー',width/2,14);
 for(let id=0;id<w.cells.length;id++){const x=ox+id%w.width*tile,y=oy+Math.floor(id/w.width)*tile,c=w.cells[id],bird=g.birds.find(b=>b.oob?.direction===o.direction&&b.oob.id===id);ctx.fillStyle=id===o.id?'#fff5a9':c==='#'?'#738887':w.floorColor;ctx.fillRect(x,y,tile-1,tile-1);ctx.fillStyle=id===o.id?'#111':bird?'#ffb1c5':'#e3dab0';ctx.font=`${tile*.8}px Consolas, monospace`;ctx.fillText(id===o.id?'@':bird?bird.symbol:c,x+tile/2,y+tile/2);}return true;}
const api={active,enter,move,home,draw};if(typeof module==='object')module.exports=api;else root.MainOob=api;
})(globalThis);
