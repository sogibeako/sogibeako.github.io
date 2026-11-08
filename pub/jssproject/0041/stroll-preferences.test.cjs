const assert=require('node:assert/strict'),T=require('./maze-stroll.js');
const graph=new Map([[0,[1,2,5]],[1,[0,3]],[2,[0,3]],[5,[0,3]],[3,[1,2,5,4]],[4,[3]]]);
const nav={player:0,warp:id=>id,edges:id=>graph.get(id).map((to,dir)=>({to,dir}))};
{const token={},r=T.record(token);const path=T.route(token,nav,null,null,()=>0);assert.equal(r.target,4,'prefer the distant dead end');assert.ok(path.length);}
{const token={},r=T.record(token);r.target=4;r.previous=1;r.recent=['0:1'];r.choices.set('0:0',4);const path=T.route(token,nav,null,null,()=>0);assert.notEqual(path[0],0,'choose another junction exit instead of repeating');const landing=nav.edges(0)[path[0]].to;T.advance(token,landing);assert.equal(r.previous,0);assert.equal(r.choices.get('0:'+path[0]),1);}
{const token={},r=T.record(token);r.target=0;r.previous=3;const path=T.route(token,{...nav,player:4},null,null,()=>0);assert.equal(path[0],0,'dead-end return stays legal');}
{const token={},r=T.record(token);r.target=4;T.route(token,nav);T.advance(token,99);assert.equal(r.previous,null);assert.equal(r.recent.length,0,'unexpected bird/warp transfer does not record an invented edge');}
console.log('PASS: dead-end destinations, less-used junction choices, recent-edge avoidance, necessary backtracking, relocation handling.');
