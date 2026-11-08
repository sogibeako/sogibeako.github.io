const assert=require('node:assert/strict'),F=require('./sheet-features.js');
function corridor(n,shortcut=false){const cells=new Uint8Array(n).fill(1),edges=new Map();for(let i=0;i<n-1;i++){edges.set(i+':1',{to:i+1});edges.set((i+1)+':3',{to:i});}if(shortcut){edges.set('1:0',{to:n-1,kind:'throat'});edges.set((n-1)+':2',{to:1,kind:'throat'});}return {world:{seed:'key-test',cells,edges,domain:new Set(cells.keys()),start:0,exit:n-1},id:0};}
const old=corridor(12);F.install(old,{keys:true});assert.equal(old.features.key,10,'legacy placement retained');
const far=corridor(12);F.install(far,{keys:true,distantKey:true});assert.equal(far.features.key,3,'eight steps back along corridor, not the entrance');
const tiny=corridor(3);F.install(tiny,{keys:true,distantKey:true});assert.equal(tiny.features.key,1,'tiny world uses the only accessible candidate');
const portal=corridor(12,true);F.install(portal,{keys:true,distantKey:true});assert.equal(portal.features.key,6,'hole shortcut is counted in real distance');
const repeat=corridor(12,true);F.install(repeat,{keys:true,distantKey:true});assert.equal(repeat.features.key,portal.features.key);
console.log('Distant keys: eight-step separation, entrance depth preference, tiny-world fallback, portal shortcuts and legacy compatibility passed.');
