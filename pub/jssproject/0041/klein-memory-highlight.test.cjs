const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('./klein-biaxial.js');
const els={},keys={},defaults={mode:'free',sx:'3',sy:'2',terrain:'prim',size:'24,20',seed:'free-7vzobe5',viewMode:'wide',memoryRadius:'24'};let outlines=0,dim=0;
const ctx=new Proxy({globalAlpha:1,strokeRect(x,y,width,height){const size=460/49,dx=(x+width/2+.5-250)/size,dy=(y+height/2+.5-240)/size;assert(Math.abs(dx)+Math.abs(dy)<=6.001,'pink outline escaped current six-step view');outlines++;},fillRect(){if(this.globalAlpha<1)dim++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
const el=id=>els[id]??={value:defaults[id]??'',checked:false,clientWidth:500,getContext:()=>ctx,focus(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/klein-biaxial-ui.js','utf8'),{KleinBiaxial:K,BiaxialRules:require('./biaxial-rules.js'),BiaxialUnderpasses:require('./biaxial-underpasses.js'),BiaxialExploration:require('./biaxial-exploration.js'),document:{getElementById:el,querySelectorAll:()=>[],addEventListener:(n,f)=>keys[n]=f},window:{addEventListener(){}},devicePixelRatio:1});
const w=K.maze(K.create('free',3,2,{width:24,height:20}),'prim','free-7vzobe5');let p={id:w.start,frame:[0,1,2,3]};
let steps=0;for(let id=0;id<w.cells.length;id++){if(!w.cells[id])continue;for(const d of K.solve({...w,exit:id},p)){p=K.step(w,p,d);steps++;keys.keydown({key:['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][d],target:{closest:()=>false},preventDefault(){}});}}

assert(dim>0,'past memory still drawn');assert(outlines>0,'seed exercised conflicting appearances');assert.match(el('status').textContent,/視界内の記憶の変化/);console.log('User seed free-7vzobe5 / Prim: '+steps+' actual steps, pink outlines remain within current view; dim remembered terrain persists.');
