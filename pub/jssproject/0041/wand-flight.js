/* Transient visual queue; model state/save formats contain no timers. */
(function(root){'use strict';
function create({current,visible,changed,after}){let queue=[],active=null,point=null,timer=null;
function step(){timer=null;if(!active){active=queue.shift();if(!active){point=null;changed();return;}}
 if(current()!==active.token){active=null;queue=[];point=null;changed();return;}
 if(!active.commit.done&&active.index<active.path.length){const seen=visible(),p=active.path[active.index++];if(seen.has(p.id)){point=p;}else{const trail=[p];while(active.index<active.path.length&&!seen.has(active.path[active.index].id))trail.push(active.path[active.index++]);point={...p,trail,seam:trail.some(p=>p.seam),flash:true};}changed();timer=setTimeout(step,point.flash?90:point.seam?90:30);return;}
 const job=active;point=null;active=null;job.commit();after?.();changed();if(queue.length&&timer===null)timer=setTimeout(step,0);
}
return {point:()=>point,busy:()=>!!active||queue.length>0,enqueue(path,commit){queue.push({token:current(),path,index:0,commit});if(!active&&timer===null)timer=setTimeout(step,0);},reset(){clearTimeout(timer);timer=null;queue=[];active=null;point=null;}};
}
const hints=new WeakMap(),nearCache=new WeakMap();
function near(s,id){const w=s.world;if(w.topology==='torus'){const x=id%w.width,y=Math.floor(id/w.width);return Math.min(x,y,w.width-1-x,w.height-1-y)<=1;}if(!w.edges)return false;let ids=nearCache.get(w);if(!ids){ids=new Set();for(const [key,e]of w.edges)if(/boundary|wrap|throat|seam/.test(e.kind||'')){ids.add(Number(key.split(':')[0]));ids.add(e.to);}for(const n of [...ids])for(let d=0;d<4;d++){const e=w.edges.get(n+':'+d);if(e)ids.add(e.to);}nearCache.set(w,ids);}return ids.has(id);}
function hint(s,visible,emit,armed=false){if(!s?.wands||s.wands.oob)return;let h=hints.get(s);if(!h){h={turn:-1,pet:-20,wand:-20};hints.set(s,h);}const turn=s.turns??s.steps;if(armed&&turn-h.wand>=5&&near(s,s.player?.world_position??s.id)){h.wand=turn;emit('杖先がかすかに震えた。どちらからとも分からない気配がします。');}if(h.turn===turn)return;h.turn=turn;if(turn-h.pet<8)return;for(const pet of s.wildlife?.pets||[]){if(!visible.has(pet.id)||!near(s,pet.id)||(turn+pet.id)%7!==0)continue;const lines=root.WandDialogue?.[pet.kind]?.boundary;if(lines?.length){h.pet=turn;emit(lines[(turn+pet.id)%lines.length]);break;}}}
const api={hint,near,create,matches:(point,id)=>point?.id===id||!!point?.trail?.some(p=>p.id===id),color:point=>point?.seam?'#ffe2ff':'#b66fd1'};if(typeof module==='object')module.exports=api;else root.WandFlight=api;
})(globalThis);

