const a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),L=require('./lattice-holes.js');
const html=fs.readFileSync(__dirname+'/lattice-holes.html','utf8'),ui=fs.readFileSync(__dirname+'/lattice-holes-ui.js','utf8'),host=fs.readFileSync(__dirname+'/main-skew-pilot.js','utf8');
a.match(html,/<form id="settings">[\s\S]*?<select id="growth">[\s\S]*?<option value="kruskal">/);
a.match(host,/lattice-holes\.html\?embedded=1&v=347/);a(!host.includes('embedded=1&v=321'));
const controls={growth:{value:'kruskal',addEventListener(type,fn){this.change=fn;}},wallStyle:{value:'dense'}};
const listener=ui.split('\n').find(line=>line.includes("$('growth').addEventListener('change'"));a(listener);vm.runInNewContext(listener,{$:id=>controls[id]});controls.growth.change();a.equal(controls.wallStyle.value,'grid');
const s=L.create({maze:true,growth:controls.growth.value,wallStyle:controls.wallStyle.value,seed:'embedded-kruskal',periodSize:16});a.equal(s.world.growth,'kruskal');a.equal(s.world.wallStyle,'grid');
controls.growth.value='wilson';controls.wallStyle.value='dense';controls.growth.change();a.equal(controls.wallStyle.value,'grid');
console.log('Embedded form includes Kruskal; current frame URL and generation through selected grid settings passed');
