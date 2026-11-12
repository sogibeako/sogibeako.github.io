/* Browser-local teaching experiments. Row-major matrices; column vectors. */
(() => {
  'use strict';
  const PI = Math.PI, rad = d => d * PI / 180;
  const fmt = (v, n = 4) => (Math.abs(v) < .5 * 10 ** -n ? 0 : v).toFixed(n);
  const vec = v => '(' + v.map(x => fmt(x)).join(', ') + ')';
  const mul = (a,b) => [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3]];
  const mv = (a,v) => [a[0]*v[0]+a[1]*v[1], a[2]*v[0]+a[3]*v[1]];
  const det = a => a[0]*a[3]-a[1]*a[2];
  const matrixText = a => `[ ${fmt(a[0])}  ${fmt(a[1])} ]\n[ ${fmt(a[2])}  ${fmt(a[3])} ]`;
  const J=[0,-1,1,0], N=[0,1,0,0], K=[0,1,1,0], E=N, F=[0,0,1,0], H=[1,0,0,-1];
  const gen={J,N,K,E,F,H};
  const rot=t=>[Math.cos(t),-Math.sin(t),Math.sin(t),Math.cos(t)];
  function exp(type,t) {
    if(type==='J') return rot(t);
    if(type==='N') return [1,t,0,1];
    return [Math.cosh(t),Math.sinh(t),Math.sinh(t),Math.cosh(t)];
  }
  function qm(a,b) {
    const [w,x,y,z]=a,[W,X,Y,Z]=b;
    return [w*W-x*X-y*Y-z*Z,w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W];
  }
  const qc=q=>[q[0],-q[1],-q[2],-q[3]];
  const qv=(q,v)=>qm(qm(q,[0,...v]),qc(q)).slice(1);
  const dualMul=(a,b)=>[a[0]*b[0],a[0]*b[1]+a[1]*b[0]];
  const dualSin=a=>[Math.sin(a[0]),Math.cos(a[0])*a[1]];
  function taylor(a,n,x) {
    let sum=0,term=1;
    for(let k=0;k<=n;k++) { if(k) term *= (x-a)/k; sum += Math.sin(a+k*PI/2)*term; }
    return sum;
  }
  function mobius(type,x,y,t) {
    if(type==='translate') return [x+t,y];
    if(type==='scale') return [Math.exp(t)*x,Math.exp(t)*y];
    const d=x*x+y*y; return [-x/d,y/d];
  }
  const colors={blue:'#1a6595',orange:'#a84c16',green:'#287360',gray:'#6a7781',ink:'#263c48',grid:'#dce4e5'};
  function plot(canvas, bounds=[-2,2,-1.15,1.15]) {
    const ctx=canvas.getContext('2d');
    canvas._legend='';
    const w=640,h=360,dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=w*dpr; canvas.height=h*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#fffff8'; ctx.fillRect(0,0,w,h);
    let [xmin,xmax,ymin,ymax]=bounds;
    // Equal coordinate units: a circle must remain a circle on the canvas.
    const unit=Math.max((xmax-xmin)/580,(ymax-ymin)/300),cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;
    xmin=cx-290*unit;xmax=cx+290*unit;ymin=cy-150*unit;ymax=cy+150*unit;
    const pt=([x,y])=>[30+(x-xmin)/(xmax-xmin)*580,330-(y-ymin)/(ymax-ymin)*300];
    function line(points,color=colors.blue,width=2,dash=[]) {
      ctx.save(); ctx.beginPath(); ctx.rect(29,29,582,302); ctx.clip();
      ctx.beginPath(); let pen=false;
      for(const v of points) { const [x,y]=pt(v); if(!Number.isFinite(x+y)){pen=false;continue;} if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);pen=true; }
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.restore();
    }
    function label(text,x,y,color=colors.ink) {
      // Keep full legends as ordinary HTML so that they remain readable on phones.
      if(y<=30){canvas._legend=text;return;}
      ctx.fillStyle=color;ctx.font=((canvas.clientWidth||640)<420?'24':'20')+'px sans-serif';ctx.fillText(text,x,y);
    }
    function dot(v,color=colors.blue,r=5) {const [x,y]=pt(v);ctx.beginPath();ctx.arc(x,y,r,0,2*PI);ctx.fillStyle=color;ctx.fill();}
    function arrow(v,color=colors.blue,origin=[0,0]) {
      line([origin,v],color,3); const [x,y]=pt(v),[ox,oy]=pt(origin),angle=Math.atan2(y-oy,x-ox);
      if(Math.hypot(x-ox,y-oy)<2){dot(v,color,3);return;}
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-11*Math.cos(angle-.45),y-11*Math.sin(angle-.45));ctx.lineTo(x-11*Math.cos(angle+.45),y-11*Math.sin(angle+.45));ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
    function curve(fn,lo=xmin,hi=xmax,color=colors.blue) {const a=[];for(let i=0;i<=240;i++){const x=lo+(hi-lo)*i/240;a.push([x,fn(x)]);}line(a,color);}
    function circle(r=1,color=colors.gray,center=[0,0]) {line(Array.from({length:181},(_,i)=>[center[0]+r*Math.cos(i*PI/90),center[1]+r*Math.sin(i*PI/90)]),color,1);}
    function poly(points,color,dash=[]) {line([...points,points[0]],color,2,dash);}
    function axes() {
      const step=Math.max(1,Math.ceil((xmax-xmin)/12));
      for(let x=Math.ceil(xmin);x<=xmax;x+=step)line([[x,ymin],[x,ymax]],colors.grid,1);
      for(let y=Math.ceil(ymin);y<=ymax;y+=step)line([[xmin,y],[xmax,y]],colors.grid,1);
      line([[xmin,0],[xmax,0]],colors.gray,1);line([[0,ymin],[0,ymax]],colors.gray,1);
      label('0',pt([0,0])[0]+5,Math.min(345,pt([0,0])[1]+18));
    }
    return {ctx,w,h,pt,line,label,dot,arrow,curve,circle,poly,axes};
  }
  const range=(key,label,min,max,step,value)=>({key,label,min,max,step,value});
  const select=(key,label,options,value)=>({key,label,options,value});
  const angle=()=>range('theta','角度 θ（度）',0,360,1,45);
  const configs={
    derivative:[range('x','角度 x（rad）',-3.14,3.14,.01,.7),range('h','割線の幅 h',.001,.8,.001,.3)],
    complex:[range('a','a',-2,2,.1,1),range('b','b',-2,2,.1,.5),select('mode','操作',[['i','i 倍：反時計回り'],['D','微分：基底 (cos,sin)']],'i')],
    matrix:[range('a','a：左上',-2,2,.1,1),range('b','b：右上',-2,2,.1,.5),range('c','c：左下',-2,2,.1,0),range('d','d：右下',-2,2,.1,1)],
    rotation:[angle(),range('r','倍率 r',0,2,.05,1)],
    quaternion:[range('x','x 軸の角度（度）',-180,180,1,90),range('y','y 軸の角度（度）',-180,180,1,90),select('order','回す順序',[['xy','x 軸 → y 軸'],['yx','y 軸 → x 軸']],'xy')],
    spin:[range('theta','回転角 θ（度）',0,720,1,0)],
    hyperbolic:[select('type','二乗則',[['J','J²=−I：円'],['K','K²=I：双曲線']],'K'),range('t','パラメータ t',-1.5,1.5,.01,.7)],
    mobius:[select('type','メビウス変換',[['translate','z → z+t'],['scale','z → exp(t)z'],['invert','z → −1/z']],'invert'),range('x','実部 x',-1.5,1.5,.05,.5),range('y','虚部 y（正）',.3,2,.05,1),range('t','t（移動・拡大のみ）',-1,1,.05,.5)],
    lorentz:[range('eta','ラピディティ η',-1.5,1.5,.01,.5)],
    dual:[select('fn','関数 f',[['square','x²'],['cube','x³'],['sin','sin x']],'square'),range('x','x',-2,2,.05,1),range('v','入力方向 v',-2,2,.1,1)],
    taylor:[range('a','展開中心 a',-2,2,.1,0),range('n','次数 n',0,8,1,3),range('h','評価点のずれ h',-3,3,.1,1)],
    autodiff:[range('x','x',-2,2,.05,1),range('v','入力方向 v',-2,2,.1,1)],
    wedge:[angle(),select('order','積の順序',[['uv','uv'],['vu','vu']],'uv')],
    clifford:[select('left','左の因子',[['1','1'],['i','i'],['j','j'],['k','k']],'i'),select('right','右の因子',[['1','1'],['i','i'],['j','j'],['k','k']],'j')],
    reflection:[range('alpha','二枚目の法線角 α（度）',-90,90,1,30)],
    flow:[select('type','生成子',[['J','J：回転'],['N','N：せん断'],['K','K：双曲回転']],'J'),range('t','t',-1.5,1.5,.01,.7)],
    commutator:[select('a','生成子 A',[['E','E'],['F','F'],['H','H']],'E'),select('b','生成子 B',[['E','E'],['F','F'],['H','H']],'F'),range('s','微小量 s',0,1,.02,.5)],
    ladder:[select('j','スピン j',[['0','0'],['0.5','1/2'],['1','1'],['1.5','3/2'],['2','2']],'0.5')]
  };
  const funcs={square:x=>x*x,cube:x=>x*x*x,sin:Math.sin};
  const derivatives={square:x=>2*x,cube:x=>3*x*x,sin:Math.cos};
  const qnames=['1','i','j','k'];
  const qtable=[['1','i','j','k'],['i','−1','k','−j'],['j','−k','−1','i'],['k','j','−i','−1']];
  function render(kind,s,canvas) {
    let g;
    if(kind==='derivative') {
      g=plot(canvas,[-1.4,5,-1.6,1.6]);g.axes();g.circle();
      const a=[Math.cos(s.x),Math.sin(s.x)],v=[-Math.sin(s.x),Math.cos(s.x)];g.arrow(a);g.arrow(v,colors.orange);
      // Put a separate sine graph to the right, with its own horizontal origin.
      const offset=3;
      // The sample point uses the same actual x scale as the graph, clipped to its local range.
      const lo=s.x-1.2,hi=s.x+1.2;
      g.line(Array.from({length:121},(_,i)=>{const x=lo+(hi-lo)*i/120;return [offset+(x-s.x),Math.sin(x)];}),colors.green);
      g.dot([offset,Math.sin(s.x)],colors.green);g.dot([offset+s.h,Math.sin(s.x+s.h)],colors.orange);
      g.line([[offset,Math.sin(s.x)],[offset+s.h,Math.sin(s.x+s.h)]],colors.orange,3);
      g.line([[offset-.6,Math.sin(s.x)-.6*Math.cos(s.x)],[offset+.6,Math.sin(s.x)+.6*Math.cos(s.x)]],colors.gray,1,[4,3]);
      g.label('位置（青）・速度（橙）',35,22);g.label('sin の局所グラフ（緑）',340,22);
      return `x = ${fmt(s.x)} rad, h = ${fmt(s.h)}\n位置 = ${vec(a)}\n速度 = ${vec(v)}\n割線の傾き = ${fmt((Math.sin(s.x+s.h)-Math.sin(s.x))/s.h,6)}\n接線の傾き cos x = ${fmt(Math.cos(s.x),6)}\n右図の中央は現在の x。灰色の破線が接線です。`;
    }
    if(kind==='complex'||kind==='rotation') {
      const a=kind==='complex'?[s.a,s.b]:[1,0];
      const b=kind==='complex'?(s.mode==='i'?[-s.b,s.a]:[s.b,-s.a]):[s.r*Math.cos(rad(s.theta)),s.r*Math.sin(rad(s.theta))];
      g=plot(canvas,[-3.1,3.1,-3,3]);g.axes();g.circle(kind==='rotation'?s.r:Math.hypot(...a));g.arrow(a,colors.gray);g.arrow(b);
      g.label('元の矢印：灰 ／ 変換後：青',35,22);
      return `入力 = ${vec(a)}\n出力 = ${vec(b)}\n${kind==='rotation'?`θ = ${s.theta}°, r = ${fmt(s.r)}\n面積倍率 r² = ${fmt(s.r*s.r)}`:`操作：${s.mode==='i'?'i 倍（反時計回り90°）':'D（係数を時計回り90°）'}\n長さ = ${fmt(Math.hypot(...b))}`}`;
    }
    if(kind==='matrix'||kind==='flow') {
      const a=kind==='matrix'?[s.a,s.b,s.c,s.d]:exp(s.type,s.t),square=[[0,0],[1,0],[1,1],[0,1]];
      const transformed=square.map(v=>mv(a,v)),points=[...square,...transformed],xs=points.map(v=>v[0]),ys=points.map(v=>v[1]);
      const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),cx=(loX+hiX)/2,cy=(loY+hiY)/2;
      const span=Math.max(hiX-loX,hiY-loY,1)*1.45;
      g=plot(canvas,[cx-span,cx+span,cy-span/2,cy+span/2]);g.axes();g.poly(square,colors.gray,[5,4]);g.poly(transformed,colors.blue);g.arrow(mv(a,[1,0]),colors.orange);g.arrow(mv(a,[0,1]),colors.green);
      g.label('e₁ の像：橙 ／ e₂ の像：緑',35,22);
      const d=det(a);
      return `${kind==='matrix'?'A':'exp(tA)'} =\n${matrixText(a)}\n行列式 = ${fmt(d)}${Math.abs(d)<1e-9?'（面積が0：逆行列なし）':''}\ne₁ → ${vec(mv(a,[1,0]))}\ne₂ → ${vec(mv(a,[0,1]))}\n縮尺は自動調整。破線の単位正方形と比較してください。`;
    }
    if(kind==='quaternion') {
      const x=rad(s.x)/2,y=rad(s.y)/2,qx=[Math.cos(x),Math.sin(x),0,0],qy=[Math.cos(y),0,Math.sin(y),0];
      const q=s.order==='xy'?qm(qy,qx):qm(qx,qy),v=qv(q,[0,0,1]);
      const project=([x,y,z])=>[x-.55*y,z-.35*y];
      g=plot(canvas,[-2,2,-1.3,1.3]);
      [[1,0,0],[0,1,0],[0,0,1]].forEach((a,i)=>{g.arrow(project(a),colors.gray);const p=g.pt(project(a));g.label(['x','y','z'][i],p[0]+8,p[1]);});g.arrow(project([0,0,1]),colors.orange);g.arrow(project(v));g.label('3次元の斜投影（見かけの長さは変わります）',35,22);
      return `順序：${s.order==='xy'?'x 軸 → y 軸（qy qx）':'y 軸 → x 軸（qx qy）'}\nq = ${vec(q)}\nv′ = qvq⁻¹ = ${vec(v)}\n|v′| = ${fmt(Math.hypot(...v))}`;
    }
    if(kind==='spin') {
      const t=rad(s.theta),v=[Math.cos(t),Math.sin(t)],q=[Math.cos(t/2),Math.sin(t/2)];
      g=plot(canvas,[-1.4,4.3,-1.5,1.5]);g.circle(1,colors.gray);g.circle(1,colors.gray,[2.9,0]);g.arrow(v);g.arrow([2.9+q[0],q[1]],colors.orange,[2.9,0]);g.label('空間の矢印：θ',45,22);g.label('q の円：θ/2',355,22);
      return `θ = ${s.theta}°\nベクトル = ${vec(v)}\nq = ${fmt(q[0])} + (${fmt(q[1])})k\n${s.theta===360?'360°：矢印は戻り、q は −1。':s.theta===720?'720°：矢印も q も出発点に戻りました。':'q と −q は同じ空間回転を表します。'}`;
    }
    if(kind==='hyperbolic') {
      const a=exp(s.type,s.t),v=mv(a,[1,0]);g=plot(canvas,[-3.4,3.4,-2.4,2.4]);g.axes();
      if(s.type==='J')g.circle();else for(const sign of [-1,1])g.line(Array.from({length:121},(_,i)=>{const t=-1.55+i*3.1/120;return [sign*Math.cosh(t),Math.sinh(t)];}),colors.gray);
      g.arrow(v);g.label(s.type==='J'?'円：x²+y²=1':'双曲線：x²−y²=1',35,22);
      return `出力 = ${vec(v)}\nx²+y² = ${fmt(v[0]**2+v[1]**2)}\nx²−y² = ${fmt(v[0]**2-v[1]**2)}\n${s.type==='J'?'円の回転では和が不変。':'双曲回転では差が不変。'}`;
    }
    if(kind==='mobius') {
      const v=mobius(s.type,s.x,s.y,s.t);g=plot(canvas,[-6,6,-.4,6]);g.axes();
      [1,2,3].forEach(r=>g.line(Array.from({length:121},(_,i)=>[r*Math.cos(i*PI/120),r*Math.sin(i*PI/120)]),colors.grid));g.dot([s.x,s.y]);g.dot(v,colors.orange);g.label('上半平面：青 z ／ 橙 T(z)',35,22);
      const scale=s.type==='translate'?1:s.type==='scale'?Math.exp(s.t):1/(s.x*s.x+s.y*s.y);
      return `z = ${fmt(s.x)} + ${fmt(s.y)}i\nT(z) = ${fmt(v[0])} + ${fmt(v[1])}i\n虚部は正：${v[1]>0?'はい':'いいえ'}\n局所の長さ倍率 = ${fmt(scale)}\n高さの倍率 Im T(z)/Im z = ${fmt(v[1]/s.y)}\n二つの倍率が一致するため ds が不変。`;
    }
    if(kind==='lorentz') {
      const c=Math.cosh(s.eta),h=Math.sinh(s.eta),ct=2*c-h,x=c-2*h;
      g=plot(canvas,[-7,7,-.4,7]);g.axes();g.line([[-7,7],[0,0],[7,7]],colors.orange);g.curve(x=>Math.sqrt(3+x*x),-6,6,colors.gray);g.dot([1,2],colors.gray);g.dot([x,ct]);g.label('縦 ct ／ 横 x　光の境界：橙',35,22);
      return `η = ${fmt(s.eta)}, v/c = tanh η = ${fmt(Math.tanh(s.eta))}\n(ct′, x′) = ${vec([ct,x])}\n(ct′)²−(x′)² = ${fmt(ct*ct-x*x)}\nγ = ${fmt(c)}\n図の点は事象の座標で、物体の運動軌跡ではありません。`;
    }
    if(kind==='dual'||kind==='taylor') {
      const fn=kind==='dual'?funcs[s.fn]:Math.sin;
      g=plot(canvas,kind==='dual'?[-3,3,-9,9]:[-5.2,5.2,-2.8,2.8]);g.axes();g.curve(fn);
      if(kind==='dual') {const y=fn(s.x),d=derivatives[s.fn](s.x);g.curve(t=>y+d*(t-s.x),-3,3,colors.orange);g.dot([s.x,y]);g.label('関数：青 ／ 接線：橙',35,22);return `f(x+vε) = ${fmt(y)} + (${fmt(s.v*d)})ε\nf′(x) = ${fmt(d)}\n入力方向 v = ${fmt(s.v)}\nε係数 = v f′(x) = ${fmt(s.v*d)}`;}
      g.curve(x=>taylor(s.a,s.n,x),-5.2,5.2,colors.orange);g.dot([s.a,Math.sin(s.a)],colors.green);const x=s.a+s.h,actual=Math.sin(x),approx=taylor(s.a,s.n,x);g.label('sin：青 ／ テイラー多項式：橙 ／ 中心：緑',35,22);
      return `中心 a = ${fmt(s.a)}, 次数 n = ${s.n}\n評価点 a+h = ${fmt(x)}\nsin(a+h) = ${fmt(actual,6)}\nTn(a+h) = ${fmt(approx,6)}\n絶対誤差 = ${fmt(Math.abs(actual-approx),6)}\n橙の曲線は表示枠を越えると枠内で切り取られます。`;
    }
    if(kind==='autodiff') {
      const input=[s.x,s.v],u=dualMul(input,input),y=dualSin(u);g=plot(canvas);const values=[input,u,y];
      ['入力 x','二乗 u=x²','sin u'].forEach((name,i)=>{const x=35+i*205;g.ctx.fillStyle='#e3e8f1';g.ctx.fillRect(x,105,165,130);g.label(name,x+10,135);g.label(fmt(values[i][0]),x+10,174,colors.blue);g.label(fmt(values[i][1]),x+10,210,colors.orange);if(i<2)g.label('→',x+174,178);});g.label('上段：値（青）／ 下段：方向微分（橙）',35,30);
      return `入力 (x,v) = ${vec(input)}\n二乗 (x²,2xv) = ${vec(u)}\nsin (sin(x²),cos(x²)·2xv) = ${vec(y)}\n出力 = ${fmt(y[0])} + (${fmt(y[1])})ε`;
    }
    if(kind==='wedge') {
      const t=rad(s.theta),v=[Math.cos(t),Math.sin(t)],area=Math.sin(t)*(s.order==='uv'?1:-1);g=plot(canvas,[-2.3,2.3,-1.3,1.3]);g.axes();g.poly([[0,0],[1,0],[1+v[0],v[1]],v],colors.gray);g.arrow([1,0],colors.orange);g.arrow(v);g.label('u：橙 ／ v：青 ／ 張られる平行四辺形',35,22);
      return `${s.order} = ${fmt(Math.cos(t))} + (${fmt(area)}) e₁e₂\n内積（スカラー） = ${fmt(Math.cos(t))}\n向きつき面積 = ${fmt(area)}\n面積の絶対値 = ${fmt(Math.abs(area))}`;
    }
    if(kind==='clifford') {
      g=plot(canvas);const l=qnames.indexOf(s.left),r=qnames.indexOf(s.right);
      g.label('行：左の因子 ／ 列：右の因子',35,25);
      for(let i=0;i<5;i++)for(let j=0;j<5;j++) {const x=115+j*85,y=48+i*54;g.ctx.fillStyle=i===l+1&&j===r+1?'#afd3e6':i===0||j===0?'#e3e8f1':'#fffff8';g.ctx.fillRect(x,y,80,49);g.label(i===0?(j===0?'×':qnames[j-1]):j===0?qnames[i-1]:qtable[i-1][j-1],x+28,y+32);}
      return `${s.left} × ${s.right} = ${qtable[l][r]}\n逆順 ${s.right} × ${s.left} = ${qtable[r][l]}\ni = −e₂e₃, j = −e₃e₁, k = −e₁e₂\n異なる虚数単位では、順序を逆にすると符号が変わります。`;
    }
    if(kind==='reflection') {
      const a=rad(s.alpha),v=[Math.cos(2*a),Math.sin(2*a)],tangent=[-Math.sin(a),Math.cos(a)];g=plot(canvas,[-2,2,-1.2,1.2]);g.axes();g.line([[0,-1.2],[0,1.2]],colors.gray,2,[5,4]);g.line([tangent.map(x=>-1.2*x),tangent.map(x=>1.2*x)],colors.green,2,[5,4]);g.arrow([1,0],colors.gray);g.arrow([-1,0],colors.orange);g.arrow(v);g.label('初め：灰 ／ 一回目：橙 ／ 二回目：青',35,22);
      return `鏡の法線角 α = ${s.alpha}°\n回転角 2α = ${2*s.alpha}°\n一回目 = (−1, 0)\n二回目 = ${vec(v)}\n|v′| = ${fmt(Math.hypot(...v))}`;
    }
    if(kind==='commutator') {
      const a=gen[s.a],b=gen[s.b],ab=mul(a,b),ba=mul(b,a),br=ab.map((v,i)=>v-ba[i]);
      const near=a=>a.map((v,i)=>s.s*v+(i===0||i===3?1:0)),pq=mul(near(a),near(b)),qp=mul(near(b),near(a));
      const square=[[0,0],[1,0],[1,1],[0,1]];g=plot(canvas,[-2,5,-1.4,3]);g.axes();g.poly(square,colors.gray,[5,4]);g.poly(square.map(v=>mv(pq,v)),colors.blue);g.poly(square.map(v=>mv(qp,v)),colors.orange);g.label('(I+sA)(I+sB)：青 ／ 逆順：橙',35,22);
      return `[${s.a},${s.b}] =\n${matrixText(br)}\ns²[A,B] =\n${matrixText(br.map(x=>s.s*s.s*x))}\n${br.every(x=>x===0)?'交換子は0。二つの図は重なります。':'s を半分にすると差は1/4になります。'}`;
    }
    if(kind==='ladder') {
      const j=Number(s.j),m=s.m,up=Math.sqrt(Math.max(0,(j-m)*(j+m+1))),down=Math.sqrt(Math.max(0,(j+m)*(j-m+1)));g=plot(canvas);
      for(let k=-j;k<=j;k++){const y=280-(k+j)*220/Math.max(1,2*j);g.ctx.strokeStyle=k===m?colors.orange:colors.gray;g.ctx.lineWidth=k===m?5:2;g.ctx.beginPath();g.ctx.moveTo(210,y);g.ctx.lineTo(455,y);g.ctx.stroke();g.label(`m = ${k}`,85,y+6);if(k===m)g.label('← 今ここ',475,y+6,colors.orange);}
      g.label(`j = ${j} ／ ${2*j+1} 次元`,35,28);
      return `j = ${j}, m = ${m}\nLz の固有値 = ${m} ℏ\nL² の固有値 = ${fmt(j*(j+1))} ℏ²\n上昇の係数 = ${fmt(up)} ℏ\n下降の係数 = ${fmt(down)} ℏ\n${up===0?'上端：L+ を作用させると零ベクトル。':down===0?'下端：L− を作用させると零ベクトル。':'ボタンで隣の固有状態へ移れます（規格化後）。'}`;
    }
    throw new Error(`Unknown lab: ${kind}`);
  }
  document.querySelectorAll('[data-lab]').forEach((root,index)=>{
    const kind=root.dataset.lab,config=configs[kind],state={},controls=root.querySelector('.lab-controls'),fields=[];
    const canvas=root.querySelector('canvas'),output=root.querySelector('output');
    const legend=document.createElement('p');legend.className='lab-legend';root.insertBefore(legend,output);
    let up,down;
    function update() {
      fields.forEach(({input,label,c})=>{state[c.key]=c.options?input.value:Number(input.value);label.textContent=c.label+(c.options?'':`：${input.value}`);});
      if(kind==='ladder'){state.m=Math.max(-Number(state.j),Math.min(Number(state.j),state.m));up.disabled=state.m>=Number(state.j);down.disabled=state.m<=-Number(state.j);}
      output.textContent=render(kind,state,canvas);
      legend.textContent=canvas._legend;
    }
    config.forEach(c=>{
      const label=document.createElement('label');label.className='lab-control';const text=document.createElement('span');label.append(text);
      const input=document.createElement(c.options?'select':'input');input.id=`lab-${index}-${c.key}`;label.htmlFor=input.id;
      if(c.options)c.options.forEach(([value,title])=>{const o=document.createElement('option');o.value=value;o.textContent=title;input.append(o);});
      else{input.type='range';input.min=c.min;input.max=c.max;input.step=c.step;}
      input.value=c.value;label.append(input);controls.append(label);fields.push({input,label:text,c});
      input.addEventListener('input',()=>{if(kind==='ladder')state.m=-Number(input.value);update();});
    });
    if(kind==='ladder'){
      state.m=-Number(config[0].value);const actions=document.createElement('div');actions.className='lab-actions';
      down=document.createElement('button');down.type='button';down.textContent='L−：一段下げる';
      up=document.createElement('button');up.type='button';up.textContent='L+：一段上げる';
      down.addEventListener('click',()=>{state.m-=1;update();});up.addEventListener('click',()=>{state.m+=1;update();});actions.append(down,up);controls.append(actions);
    }
    root.querySelector('.reset').addEventListener('click',()=>{fields.forEach(({input,c})=>input.value=c.value);if(kind==='ladder')state.m=-Number(config[0].value);update();});
    window.addEventListener('resize',update);
    update();
  });
})();
