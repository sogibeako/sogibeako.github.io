const assert=require('node:assert/strict'),K=require('./klein-biaxial.js');
const algorithms=['growing',...['dfs','prim','growing','kruskal','hunt','wilson','rooms','division','eller'].map(x=>'atelier-'+x)];
let count=0;
for(const algorithm of algorithms)for(const mode of ['free','consistent'])for(const [width,height] of [[12,10],[24,20],[32,24]])for(const [sx,sy] of [[3,2],[-5,5],[0,0]]){
 const w=K.maze(K.create(mode,sx,sy,{width,height}),algorithm,'variety-'+count++);
 const reached=new Set([w.start]),queue=[w.start];
 for(const id of queue)for(let d=0;d<4;d++){const n=w.edges.get(id+':'+d).to;if(w.cells[n]&&!reached.has(n)){reached.add(n);queue.push(n);}}
 assert.equal(reached.size,w.cells.reduce((a,b)=>a+b,0));assert(reached.size>5);assert(reached.has(w.exit));
 assert(Array.from({length:height},(_,y)=>y*width+width-1).some(id=>w.cells[id]&&w.cells[w.edges.get(id+':1').to]));
 assert(Array.from({length:width},(_,x)=>(height-1)*width+x).some(id=>w.cells[id]&&w.cells[w.edges.get(id+':2').to]));
 for(const frame of [[0,1,2,3],[2,1,0,3]]){let p={id:w.start,frame};for(const d of K.solve(w,p)){p=K.step(w,p,d);assert(w.cells[p.id]);}assert.equal(p.id,w.exit);}
 if(algorithm.startsWith('atelier-')){
  const xs=Array.from({length:height},(_,y)=>y*width+width-1).filter(id=>w.cells[id]&&w.cells[w.edges.get(id+':1').to]);
  const ys=Array.from({length:width},(_,x)=>(height-1)*width+x).filter(id=>w.cells[id]&&w.cells[w.edges.get(id+':2').to]);
  assert(xs.length>=Math.max(2,Math.floor(height/4)));assert(ys.length>=Math.max(2,Math.floor(width/4)));
  const loops=require('./biaxial-exploration.js').cycles(w);assert(loops.x&&loops.y,'both seam axes have actual circuits');
 }
 assert.deepEqual(K.maze(K.create(mode,sx,sy,{width,height}),algorithm,w.seed).cells,w.cells);
}
console.log(count+' generator/size/shift conditions: all-floor connectivity, both seams, exit walking and reproducibility passed.');
