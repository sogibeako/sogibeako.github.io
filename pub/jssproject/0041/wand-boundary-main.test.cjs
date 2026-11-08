const a=require('node:assert/strict'),F=require('./wand-flight.js');globalThis.WandDialogue=require('./wand-dialogue.js');
const s={turns:7,world:{topology:'torus',width:8,height:8},player:{world_position:0},wands:{},wildlife:{pets:[{id:0,kind:'c'}]}};const logs=[];
F.hint(s,new Set(),x=>logs.push(x));a.equal(logs.length,0);
s.turns=14;F.hint(s,new Set([0]),x=>logs.push(x));a.equal(logs.length,1);a.match(logs[0],/f/);
F.hint(s,new Set([0]),x=>logs.push(x));a.equal(logs.length,1);
F.hint(s,new Set([0]),x=>logs.push(x),true);a.match(logs[1],/震え/);
F.hint(s,new Set([0]),x=>logs.push(x),true);a.equal(logs.length,2);
s.turns=21;s.wildlife.pets[0].id=27;F.hint(s,new Set([27]),x=>logs.push(x));a.equal(logs.length,2);
console.log('Visible-only boundary pet hints, cooldown, wand tremor and interior silence passed');
