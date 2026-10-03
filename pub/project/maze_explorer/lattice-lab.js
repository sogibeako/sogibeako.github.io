'use strict';
(() => {
  const el=id=>document.getElementById(id), canvas=el('latticeCanvas'), ctx=canvas.getContext('2d');
  let world=TorusLattice.create(), points=TorusLattice.cells(world), x=0,y=0,steps=0;
  const directions={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
  function render() {
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const {a,b}=world, center=[(a[0]+b[0])/2-.5,(a[1]+b[1])/2-.5];
    const scale=Math.min(width/(2.8*(Math.abs(a[0])+Math.abs(b[0]))+4),height/(2.8*(Math.abs(a[1])+Math.abs(b[1]))+4));
    const project=(px,py)=>[width/2+(px-center[0])*scale,height/2+(py-center[1])*scale];
    const p=TorusLattice.canonical(world,x,y);
    for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++) {
      const ox=i*a[0]+j*b[0],oy=i*a[1]+j*b[1],main=i===0&&j===0;
      const corners=[[ox-.5,oy-.5],[ox+a[0]-.5,oy+a[1]-.5],[ox+a[0]+b[0]-.5,oy+a[1]+b[1]-.5],[ox+b[0]-.5,oy+b[1]-.5]];
      ctx.beginPath();corners.forEach(([px,py],n)=>ctx[n?'lineTo':'moveTo'](...project(px,py)));ctx.closePath();ctx.fillStyle=main?'#25433f':'#101f25';ctx.fill();ctx.strokeStyle='#58716f';ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle=main?'#9ab5ac':'#405952';
      for(const cell of points){const [px,py]=project(cell.x+ox,cell.y+oy);ctx.fillRect(px-1,py-1,2,2);}
    }
    for(const [v,color,label] of [[a,'#e1b674','a'],[b,'#8acbdf','b']]) {
      const start=project(-.5,-.5),end=project(v[0]-.5,v[1]-.5);
      ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...start);ctx.lineTo(...end);ctx.stroke();
      const angle=Math.atan2(end[1]-start[1],end[0]-start[0]);ctx.beginPath();ctx.moveTo(end[0]-9*Math.cos(angle-.4),end[1]-9*Math.sin(angle-.4));ctx.lineTo(...end);ctx.lineTo(end[0]-9*Math.cos(angle+.4),end[1]-9*Math.sin(angle+.4));ctx.stroke();
      ctx.fillStyle=color;ctx.font='bold 15px monospace';ctx.fillText(label,(start[0]+end[0])/2+8,(start[1]+end[1])/2-8);
    }
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.max(12,Math.min(22,scale))}px monospace`;
    for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++) {
      const [px,py]=project(p.x+i*a[0]+j*b[0],p.y+i*a[1]+j*b[1]);ctx.fillStyle=i===0&&j===0?'#d3f1cb':'#658078';ctx.fillText('@',px,py);
    }
    ctx.textAlign='start';ctx.textBaseline='alphabetic';
    el('labSummary').textContent=`周期 a = (${a.join(', ')}) ／ b = (${b.join(', ')})。面積 ${world.determinant}、異なる整数セル ${points.length}個。`;
    el('labPosition').textContent=`${steps}歩 ／ 展開位置 (${x}, ${y}) → 真世界の代表位置 (${p.x}, ${p.y})`;
    canvas.setAttribute('aria-label',`二方向ずれの周期タイル。${points.length}セル。${steps}歩。代表位置${p.x},${p.y}。`);
  }
  function reset(){x=y=steps=0;el('labMove').textContent='矢印キーで一歩ずつ接続を確認できます。';render();}
  function apply(){
    try {
      const next=TorusLattice.create({width:Number(el('labWidth').value),height:Number(el('labHeight').value),shiftX:Number(el('labShiftX').value),shiftY:Number(el('labShiftY').value)});
      world=next;points=TorusLattice.cells(world);el('labError').textContent='';reset();canvas.focus();
    } catch(error){el('labError').textContent=error.message;}
  }
  function move(direction){const old=TorusLattice.canonical(world,x,y),[dx,dy]=directions[direction];x+=dx;y+=dy;steps++;const next=TorusLattice.canonical(world,x,y);el('labMove').textContent=old.a!==next.a||old.b!==next.b?'周期の境界を通過。同じ場所の代表位置へ移りました。':'同じタイル内を一歩移動しました。';render();}
  el('latticeSettings').addEventListener('submit',e=>{e.preventDefault();apply();});
  for(const [id,sx,sy] of [['oneShift',0,2],['bothShift',2,2],['oppositeShift',-2,2]]) el(id).addEventListener('click',()=>{el('labWidth').value=el('labHeight').value='8';el('labShiftX').value=sx;el('labShiftY').value=sy;apply();});
  el('labReset').addEventListener('click',()=>{reset();canvas.focus();});
  for(const button of document.querySelectorAll('[data-lab-dir]')) button.addEventListener('click',()=>move(button.dataset.labDir));
  canvas.addEventListener('pointerdown',()=>canvas.focus());
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const d={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',h:'left',j:'down',k:'up',l:'right'}[e.key];if(d){e.preventDefault();move(d);}});
  new ResizeObserver(render).observe(canvas);reset();
})();
