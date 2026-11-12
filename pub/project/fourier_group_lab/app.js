/* UI and experiments; all transform conventions live in core.js. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), F=Fourier;
  const fmt=(x,n=4)=>Math.abs(x)<5*10**(-n-1)?(0).toFixed(n):x.toFixed(n);
  const errorFmt=x=>x<1e-10?'≈ 0':x.toExponential(2);
  const complex=z=>`${fmt(z.re,3)} ${z.im < -0.0005?'−':'+'} ${fmt(Math.abs(z.im),3)}i`;
  const colors={green:'#226858',light:'#b8c2b4',orange:'#c37b42',grid:'#e6eadf',text:'#75816f'};
  const recipes={mix:'sin(2*pi*ph) + 0.4*sin(6*pi*ph)',sine:'sin(2*pi*ph)',saw:'2*ph-1',square:'ph < 0.5 ? 1 : -1',triangle:'1-4*abs(ph-0.5)',original:'tanh(3*(2*ph-1))',alias:'sin(2*pi*11*ph)'};
  const scalePresets={equal:Array.from({length:12},(_,i)=>(i+1)*100).join('\n'),just:'9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1',pentatonic:'200\n400\n700\n900\n1200'};
  const state={tab:'dft',guided:true,steps:{dft:0,abelian:0,s3:0,sequence:0},base:220,n:16,fn:null,source:[],original:[],x:[],z:[],recon:[],cutoff:8,bin:1,swap:null,group:'z4',gx:[1,.3,-.7,.2],gz:[],grecon:[],sx:[1,.2,-.5,.7,-.3,.1],sz:null,srecon:[],mask:[true,true,true],triangle:0,scale:F.parseScale(scalePresets.equal)};
  const synth=new LabSynth();
  let abelianBin=0;
  const abelianLabels=()=>state.group==='z4'?['χ₀','χ₁','χ₂','χ₃']:['χ(0,0)','χ(0,1)','χ(1,0)','χ(1,1)'];
  const guides={
    dft:[
      ['ひとつの波に、いくつの振動？','「やってみる」でサイン波を2つ重ねます。k=1とk=3、そして対応する負の周波数の棒を探しましょう。',()=>{setRecipe('mix',16);setBin(1);}],
      ['ずらすと、何が変わる？','1つ右にずらしてみましょう。棒の高さは同じで、位相の針が回ります。「どれだけ」と「どこから」は別の情報です。',()=>{setRecipe('mix',16);shift();}],
      ['点を減らすと、見間違える。','1周期に11回振動する波を16点で標本化。標本だけでは5回の振動と区別できません。Nを32にして棒を比べましょう。',()=>{setRecipe('alias',16);setBin(5);}],
      ['成分を減らして、重ね直す。','のこぎり波から遅い振動だけを残します。オレンジの線がなめらかになったら、「聴くもの」を再構成にして音でも比べましょう。',()=>{setRecipe('saw',32);state.cutoff=3;$('cutoff').value=3;updateDFT();$('audioSource').value='reconstructed';}]
    ],
    abelian:[
      ['いつものDFTは、輪の上にある。','4つの位置を0→1→2→3→0と巡ります。「1歩進める」を4回押すと元の配置です。',()=>{state.group='z4';state.gx=[1,.3,-.7,.2];$('groupType').value='z4';updateAbelian();}],
      ['同じ4つの値に、違う足し算。','2×2の群に切り替えます。横も縦も2歩で元に戻ります。基本の模様とフーリエ係数が、4点の輪とどう違うでしょう？',()=>{state.group='v4';$('groupType').value='v4';updateAbelian();}],
      ['「波」の形は、場所のルールで決まる。','2×2の群では、基本の模様は+1と−1の組み合わせ。全部を重ねると、やはり入力の4つの値に戻ります。',()=>{state.group='v4';state.gx=[1,-1,-1,1];$('groupType').value='v4';updateAbelian();}]
    ],
    sequence:[
      ['8つの値を、2つの群で分ける。','巡回群 ℤ/8ℤ と正方形の対称群 D₄ を比べます。同じ8個の値が、8個の数と「4個の数＋2×2行列」に分かれます。',()=>SequenceLab.example('eight')],
      ['値を置く場所のルールを選ぶ。','4つの値を輪と2×2の群で比較します。対応表を見ながら、同じ入力順でも基本成分が変わることを確かめましょう。',()=>SequenceLab.example('four')],
      ['複素数も、そのまま入力できる。','1, i, −1, −i は複素平面を一周する4点です。巡回群では1つの成分に集まります。位相と逆変換の虚部にも注目しましょう。',()=>SequenceLab.example('complex')],
      ['自分の数列で試す。','6個の例を読み込みます。数列を書き換えて「この数列で比較する」を押してください。各成分のエネルギーの合計は、どちらの群でも入力の二乗絶対値の平均になります。',()=>SequenceLab.example('six')]
    ],
    s3:[
      ['順番を変えるだけで、違う操作。','「回す→裏返す」を実行します。次に「裏返す→回す」を押して色付き頂点を比べましょう。これが非可換です。',()=>{state.triangle=F.mul(3,1);drawTriangle();}],
      ['入力は、操作ごとの値。','e（何もしない）だけ1にします。6つの操作への値が、2つの数と1つの2×2行列へ変換されます。',()=>{state.sx=[1,0,0,0,0,0];state.mask=[true,true,true];updateS3();}],
      ['行列も、再構成のための情報。','2×2の成分を外してみます。元の6つの値には戻らなくなります。チェックを戻して、往復を確かめましょう。',()=>{state.mask=[true,true,false];updateS3();}],
      ['音にするときは、読み順を決める。','群には自然な時間順序がありません。ここでは e,r,r²,s,rs,r²s の順を選んで1周期として再生します。これは追加で選んだ音への写し方です。',()=>{state.mask=[true,true,true];updateS3();$('audioSource').value='current';$('soundMeaning').scrollIntoView({behavior:'smooth',block:'center'});}]
    ]
  };
  function renderGuide() {
    $('guide').hidden=!state.guided;
    const entries=guides[state.tab], i=state.steps[state.tab], [title,text]=entries[i];
    $('guideStep').textContent=`STEP ${String(i+1).padStart(2,'0')} / ${String(entries.length).padStart(2,'0')}`;
    $('guideTitle').textContent=title;$('guideText').textContent=text;$('guideDots').textContent=`${i+1} / ${entries.length}`;
    $('guidePrev').disabled=i===0;$('guideNext').disabled=i===entries.length-1;
  }
  function stopAll() {synth.stopAll();document.querySelectorAll('.playing').forEach(b=>b.classList.remove('playing'));}
  function setTab(tab) {
    stopAll();state.tab=tab;
    document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    for(const name of ['dft','abelian','s3','sequence'])$('panel-'+name).hidden=name!==tab;
    $('audioSource').options[0].disabled=tab!=='dft';if(tab!=='dft'&&$('audioSource').value==='original')$('audioSource').value='current';
    renderGuide();updateSoundMeaning();redraw();
  }
  function updateSoundMeaning() {
    if(state.tab==='sequence'){$('soundMeaning').textContent='04の適用済み数列を入力順で読み、選んだ実部または虚部を1周期として再生します。「成分からの再構成」は04で選んだ側の逆変換です。複素数全体を直接音にするものではありません。';return;}
    $('soundMeaning').textContent=state.tab==='dft'?'1周期の標本を実数の三角多項式で補間し、基準周波数で繰り返します。「数式からの波形」は512点で評価した近似です。':state.tab==='abelian'?'音への写し方：画面の添字の順（輪：0,1,2,3 ／ 格子：(0,0),(0,1),(1,0),(1,1)）を1周期として読みます。この読み順は群の構造とは別に選んだ規則です。':'音への写し方：e → r → r² → s → rs → r²s の順で6つの値を読み、1周期として繰り返します。行列そのものを直接鳴らすのではなく、逆変換後の値も聴き比べられます。';
  }
  function compileAndSample() {
    try {
      const n=Number($('sampleCount').value),fn=Formula.compile($('formula').value);
      let x=Array.from({length:n},(_,i)=>fn(i/n,state.base,n));
      let dense=Array.from({length:512},(_,i)=>fn(i/512,state.base,n));
      if($('removeMean').checked){const mean=x.reduce((a,b)=>a+b,0)/n;x=x.map(v=>v-mean);dense=dense.map(v=>v-mean);}
      Object.assign(state,{n,fn,source:dense,original:x.slice(),x,cutoff:Math.floor(n/2),swap:null});
      state.bin=Math.min(state.bin,n-1);$('formulaError').textContent='';$('nValue').textContent=n;
      $('sampleBadge').textContent=`${n} SAMPLES`;$('cutoff').max=Math.floor(n/2);$('cutoff').value=state.cutoff;$('inspectBin').max=n-1;$('inspectBin').value=state.bin;
      $('dftInsight').textContent='同じ標本を、別のものさしで見ています。全部の成分を重ねれば、元の標本に戻ります。';
      updateDFT(); return true;
    } catch(e){$('formulaError').textContent=e.message+' 表示は最後に成功した結果です。';$('sampleCount').value=state.n;return false;}
  }
  function setRecipe(name,n=state.n) {$('preset').value=name;$('formula').value=recipes[name];$('sampleCount').value=n;$('removeMean').checked=false;compileAndSample();}
  function updateDFT() {
    stopAll();state.z=F.dft(state.x);state.recon=F.idft(F.lowpass(state.z,state.cutoff));
    $('cutoffValue').textContent=state.cutoff===Math.floor(state.n/2)?'すべて':`|k| ≤ ${state.cutoff}`;
    $('dftRoundtrip').textContent=errorFmt(F.rmsError(state.x,F.idft(state.z)));
    $('dftFilterError').textContent=errorFmt(F.rmsError(state.x,state.recon));
    $('dftEnergy').textContent=fmt(F.meanSquare(state.x));$('dftSpectralEnergy').textContent=fmt(state.z.reduce((s,c)=>s+c.re*c.re+c.im*c.im,0));
    renderSamples();renderCoefficients();updateBin();if(state.tab==='dft'){drawWave();drawSpectrum();}
  }
  function shift(){state.x=[state.x.at(-1),...state.x.slice(0,-1)];state.swap=null;updateDFT();$('dftInsight').textContent='1つ右にずらしました。振幅（棒の高さ）は変わらず、位相が −2πk/N だけ変わります。音の開始位置が変わる操作です。';}
  function renderSamples() {
    const box=$('samples');box.replaceChildren();
    state.x.forEach((v,i)=>{
      const cell=document.createElement('div');cell.className='sample-cell'+(state.swap===i?' selected':'');
      const button=document.createElement('button');button.textContent=`n = ${i}`;button.setAttribute('aria-label',`標本${i}を交換用に選択`);button.setAttribute('aria-pressed',String(state.swap===i));
      button.onclick=()=>{if(state.swap===null){state.swap=i;$('swapStatus').textContent=`標本${i}を選択中。交換先の番号を選んでください。`;renderSamples();box.querySelectorAll('button')[i].focus();}else{const a=state.swap;[state.x[a],state.x[i]]=[state.x[i],state.x[a]];state.swap=null;$('swapStatus').textContent=`標本${a}と${i}の値を交換しました。`;updateDFT();box.querySelectorAll('button')[i].focus();}};
      const input=document.createElement('input');input.type='number';input.step='0.1';input.value=Number(v.toPrecision(8));input.setAttribute('aria-label',`標本${i}の値`);
      input.onchange=()=>{if(input.value.trim()===''||!Number.isFinite(input.valueAsNumber)||Math.abs(input.valueAsNumber)>1e6){input.value=Number(v.toPrecision(8));return;}state.x[i]=input.valueAsNumber;state.swap=null;updateDFT();box.querySelectorAll('input')[i].focus();};
      cell.append(button,input);box.append(cell);
    });
  }
  function renderCoefficients() {
    $('coefficientTable').innerHTML=state.z.map((c,k)=>`<tr><td>${k}</td><td>${k<=state.n/2?k:k-state.n}</td><td>${fmt(c.re)}</td><td>${fmt(c.im)}</td><td>${fmt(Math.hypot(c.re,c.im))}</td><td>${Math.hypot(c.re,c.im)<1e-10?'—':fmt(Math.atan2(c.im,c.re)*180/Math.PI,1)}</td></tr>`).join('');
  }
  function setBin(k){state.bin=k;$('inspectBin').value=k;updateBin();drawSpectrum();}
  function updateBin(){const c=state.z[state.bin];if(!c)return;const mag=Math.hypot(c.re,c.im),freq=state.bin<=state.n/2?state.bin:state.bin-state.n;$('binReadout').textContent=`${freq}回/周期 · F = ${complex(c)} · |F| = ${fmt(mag,3)} · 位相 ${mag<1e-10?'未定義':fmt(Math.atan2(c.im,c.re)*180/Math.PI,1)+'°'}`;}
  function canvasFrame(id,height) {
    const canvas=$(id),width=Math.round(canvas.getBoundingClientRect().width);
    if(!width)return null;
    const ratio=window.devicePixelRatio||1;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.height=height+'px';
    const c=canvas.getContext('2d');c.scale(ratio,ratio);c.font='10px ui-monospace, Consolas, monospace';c.lineWidth=1;c.clearRect(0,0,width,height);
    return {c,w:width,h:height,left:42,right:16,top:20,bottom:29};
  }
  function axes(fr,limit,labels) {
    const {c,w,h,left,right,top,bottom}=fr,pw=w-left-right,ph=h-top-bottom;
    const y=v=>top+ph/2-v/limit*ph/2;
    c.textAlign='right';c.textBaseline='middle';
    for(const v of [-limit,-limit/2,0,limit/2,limit]){c.strokeStyle=colors.grid;c.beginPath();c.moveTo(left,y(v));c.lineTo(w-right,y(v));c.stroke();c.fillStyle=colors.text;c.fillText(Math.abs(v)>=1000?v.toExponential(0):fmt(v,1),left-7,y(v));}
    c.textAlign='center';labels.forEach(([text,pos])=>{const x=left+pos*pw;c.fillStyle=colors.text;c.fillText(text,x,h-10);});
    return {y,x:p=>left+p*pw,pw,ph};
  }
  function drawWave(){
    const fr=canvasFrame('waveCanvas',230);if(!fr)return;const {c}=fr;
    const limit=Math.max(.2,...state.source.map(Math.abs),...state.x.map(Math.abs),...state.recon.map(Math.abs))*1.18;
    const {x,y}=axes(fr,limit,[['0',0],['¼',.25],['½',.5],['¾',.75],['1',1]]);
    const line=(a,color,width,close=true)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();a.forEach((v,i)=>{const px=x(i/a.length),py=y(v);i?c.lineTo(px,py):c.moveTo(px,py);});if(close)c.lineTo(x(1),y(a[0]));c.stroke();};
    c.setLineDash([4,4]);line(state.source,colors.light,1.4);c.setLineDash([]);
    // Continuous, real trigonometric interpolation of retained DFT coefficients.
    const z=F.lowpass(state.z,state.cutoff),dense=Array.from({length:400},(_,j)=>{
      const t=j/400;let value=z[0].re;
      for(let k=1;k<=Math.floor(state.n/2);k++){const factor=k*2===state.n?1:2;value+=factor*(z[k].re*Math.cos(F.TAU*k*t)-z[k].im*Math.sin(F.TAU*k*t));}
      return value;
    });
    line(dense,colors.orange,2);
    state.x.forEach((v,i)=>{c.strokeStyle='#22685845';c.lineWidth=1;c.beginPath();c.moveTo(x(i/state.n),y(0));c.lineTo(x(i/state.n),y(v));c.stroke();c.beginPath();c.fillStyle=colors.green;c.arc(x(i/state.n),y(v),state.n>40?2.5:3.5,0,F.TAU);c.fill();});
  }
  function drawSpectrum(){
    const fr=canvasFrame('spectrumCanvas',205);if(!fr)return;const {c,w,h,left,right}=fr,pw=w-left-right,base=137,top=20,step=pw/state.n;
    const mags=state.z.map(z=>Math.hypot(z.re,z.im)),max=Math.max(.01,...mags)*1.15;
    c.textAlign='right';c.textBaseline='middle';
    for(let i=0;i<=3;i++){const val=max*i/3,py=base-(base-top)*i/3;c.strokeStyle=colors.grid;c.beginPath();c.moveTo(left,py);c.lineTo(w-right,py);c.stroke();c.fillStyle=colors.text;c.fillText(val>=1000?val.toExponential(0):fmt(val,2),left-7,py);}
    state.z.forEach((z,k)=>{const cx=left+(k+.5)*step,bar=Math.max(2,step*.5),enabled=Math.min(k,state.n-k)<=state.cutoff;
      if(k===state.bin){c.fillStyle='#edf3e2';c.fillRect(cx-step/2,top-8,step,base-top+58);}
      c.fillStyle=enabled?colors.green:'#cdd3c7';c.fillRect(cx-bar/2,base-mags[k]/max*(base-top),bar,Math.max(1,mags[k]/max*(base-top)));
      c.fillStyle=colors.text;c.textAlign='center';if(state.n<=24||k%Math.ceil(state.n/16)===0)c.fillText(k,cx,base+13);
      if(step>=13){c.strokeStyle='#d8dfd0';c.beginPath();c.arc(cx,base+36,5,0,F.TAU);c.stroke();if(mags[k]>1e-10){const a=Math.atan2(z.im,z.re);c.strokeStyle=enabled?colors.orange:'#bdc3b9';c.beginPath();c.moveTo(cx,base+36);c.lineTo(cx+5*Math.cos(a),base+36-5*Math.sin(a));c.stroke();}}
    });
    c.textAlign='left';c.fillStyle=colors.text;c.fillText('|F[k]|',left,9);c.fillText('k',w-right+4,base+13);c.fillText('位相',3,base+36);
    c.fillText('0 から N−1 のすべての成分',left,h-4);
  }
  function buildValues(container,values,labels,onChange,descriptions=[]) {
    const node=$(container);node.replaceChildren();values.forEach((v,i)=>{const label=document.createElement('label');label.textContent=labels[i];if(descriptions[i]){const small=document.createElement('small');small.textContent=descriptions[i];label.append(small);}const input=document.createElement('input');input.type='number';input.step='.1';input.value=Number(v.toPrecision(8));input.setAttribute('aria-label',`${labels[i]} の値`);input.onchange=()=>{if(input.value.trim()===''||!Number.isFinite(input.valueAsNumber)||Math.abs(input.valueAsNumber)>1e6){input.value=v;return;}onChange(i,input.valueAsNumber);$(container).querySelectorAll('input')[i].focus();};label.append(input);node.append(label);});
  }
  function updateAbelian(){
    stopAll();state.gz=F.abelian(state.gx,state.group);state.grecon=F.inverseAbelian(state.gz,state.group);
    const v4=state.group==='v4',labels=v4?['(0,0)','(0,1)','(1,0)','(1,1)']:['0','1','2','3'];
    buildValues('abelianInputs',state.gx,labels,(i,v)=>{state.gx[i]=v;updateAbelian();});
    $('groupTranslateY').hidden=!v4;$('groupTranslate').textContent=v4?'横に1歩進める':'1歩進める';
    $('groupExplanation').textContent=v4?'添字は (縦, 横)。足し算はそれぞれ mod 2。横も縦も2歩で戻り、縦→横と横→縦は同じです。':'添字は 0,1,2,3。足し算は mod 4。3の次は0。1歩を4回重ねると元に戻ります。';
    const positions=v4?[[90,55],[250,55],[90,175],[250,175]]:[[170,30],[270,115],[170,200],[70,115]];
    const edges=v4?[[0,1],[0,2],[1,3],[2,3]]:[[0,1],[1,2],[2,3],[3,0]];
    $('groupDiagram').innerHTML=`<svg viewBox="0 0 340 235" role="img" aria-label="${v4?'縦横が周期2の格子':'4点の輪'}">${edges.map(([a,b])=>`<line x1="${positions[a][0]}" y1="${positions[a][1]}" x2="${positions[b][0]}" y2="${positions[b][1]}" stroke="#bacbac" stroke-width="2"/>`).join('')}${positions.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="27" fill="#eaf2de" stroke="#74966b"/><text x="${x}" y="${y+5}" text-anchor="middle" font-size="13" fill="#226858">${fmt(state.gx[i],1)}</text><text x="${x}" y="${y+44}" text-anchor="middle" font-size="11" fill="#67756e">${labels[i]}</text>`).join('')}</svg>`;
    $('characterCards').innerHTML=state.gz.map((z,k)=>`<div class="character-card"><h3>χ${v4?labels[k]:k}</h3><svg viewBox="0 0 180 38" role="img" aria-label="指標の各地点での位相">${state.gx.map((_,j)=>{const a=F.abelianPhase(state.group,k,j),x=22+j*44;return `<circle cx="${x}" cy="19" r="12" fill="none" stroke="#d5dfca"/><line x1="${x}" y1="19" x2="${x+11*Math.cos(a)}" y2="${19-11*Math.sin(a)}" stroke="#226858" stroke-width="2"/>`;}).join('')}</svg><p>F = ${complex(z)}</p><small>|F| = ${fmt(Math.hypot(z.re,z.im),3)} · 位相 ${Math.hypot(z.re,z.im)<1e-10?'—':fmt(Math.atan2(z.im,z.re)*180/Math.PI,0)+'°'}</small></div>`).join('');
    $('abelianReconstruction').textContent=state.grecon.map(v=>fmt(v,3)).join('  →  ');$('abelianError').textContent=errorFmt(F.rmsError(state.gx,state.grecon));
    updateAbelianSpectrum();
  }
  function updateAbelianSpectrum(){
    const v4=state.group==='v4',labels=abelianLabels(),power=$('abelianSpectrumMetric').value==='power';
    $('abelianSpectrumBadge').textContent=v4?'DUAL GROUP · 2 × 2':'DUAL GROUP · 4';
    $('abelianSpectrumExplanation').textContent=v4?'スペクトルの置き場所は「指標を集めた群（双対群）」。この例では縦・横の2つの添字を持つので、4本の棒としても、2×2の周波数マップとしても表せます。棒の左右の順序は、高い・低いを意味しません。':'4点の輪では、指標の添字 k=0,1,2,3 が通常の4点DFTの周波数に対応します。χ₀は一定、χ₁は1回、χ₂は2回の振動。χ₃は負の周波数 −1 と同じ標本になります。';
    $('abelianInspect').innerHTML=labels.map((label,k)=>`<option value="${k}">${label}</option>`).join('');$('abelianInspect').value=abelianBin;
    $('abelianFrequencyMap').hidden=!v4;$('abelianFrequencyMap').parentElement.classList.toggle('with-frequency-map',v4);
    const values=state.gz.map(z=>power?z.re*z.re+z.im*z.im:Math.hypot(z.re,z.im)),max=Math.max(...values),energy=state.gz.reduce((s,z)=>s+z.re*z.re+z.im*z.im,0);
    $('abelianFrequencyCells').replaceChildren();
    values.forEach((value,k)=>{const b=document.createElement('button'),fraction=max>1e-10?value/max:0;b.className='frequency-cell';b.setAttribute('aria-pressed',String(k===abelianBin));b.style.backgroundColor=`hsl(95 35% ${96-fraction*36}%)`;b.innerHTML=`<span>${labels[k]}</span><strong>${fmt(value,3)}</strong>`;b.setAttribute('aria-label',`${labels[k]}、${power?'エネルギー':'大きさ'} ${fmt(value,4)} を選択`);b.onclick=()=>{abelianBin=k;updateAbelianSpectrum();$('abelianFrequencyCells').children[k].focus();};$('abelianFrequencyCells').append(b);});
    $('abelianMapScale').textContent=`淡い色 0 → 濃い色 ${fmt(max,3)}（${power?'|F[χ]|²':'|F[χ]|'}、色の範囲は自動調整）`;
    const z=state.gz[abelianBin],magnitude=Math.hypot(z.re,z.im),phase=magnitude<1e-10?'未定義（係数が0）':fmt(Math.atan2(z.im,z.re)*180/Math.PI,1)+'°';
    const meanings=v4?['縦も横も一定。全体の平均です。','縦は一定、横方向に +1, −1 が交互に並ぶ模様です。','横は一定、縦方向に +1, −1 が交互に並ぶ模様です。','縦も横も交互。市松模様の成分です。']:['どの位置でも一定。全体の平均です。','輪を一周する間に複素数の向きが1回転する成分です。','隣に進むと +1 と −1 が交互に現れる成分です。','標本上では −1 回転の成分。実数入力ではχ₁の係数の複素共役になります。'];
    $('abelianComponentTitle').textContent=`${labels[abelianBin]} — ${meanings[abelianBin]}`;
    $('abelianComponentValue').textContent=`F = ${complex(z)}　|F| = ${fmt(magnitude,4)}　|F|² = ${fmt(magnitude*magnitude,4)}　位相 = ${phase}`;
    $('abelianComponentMeaning').textContent=`この成分のエネルギーの割合：${energy>1e-20?fmt(100*magnitude*magnitude/energy,1)+'%':'—（全入力が0）'}。全成分の |F|² の合計 ${fmt(energy,4)} は、入力の二乗の平均 ${fmt(F.meanSquare(state.gx),4)} と一致します。`;
    $('characterCards').querySelectorAll('.character-card').forEach((card,k)=>card.classList.toggle('spectrum-selected',k===abelianBin));
    if(state.tab==='abelian')drawAbelianSpectrum();
  }
  function drawAbelianSpectrum(){
    const fr=canvasFrame('abelianSpectrumCanvas',270);if(!fr)return;
    const {c,w,left,right}=fr,power=$('abelianSpectrumMetric').value==='power',labels=abelianLabels(),step=(w-left-right)/4,top=29,base=174;
    const values=state.gz.map(z=>power?z.re*z.re+z.im*z.im:Math.hypot(z.re,z.im)),max=Math.max(.001,...values)*1.18;
    const graphNumber=v=>v>=10000?v.toExponential(1):fmt(v,v<.01?4:3);
    c.fillStyle='#f0f5e9';c.fillRect(left+abelianBin*step,top-7,step,227);
    c.textAlign='right';c.textBaseline='middle';c.lineWidth=1;
    for(let i=0;i<=4;i++){const py=base-(base-top)*i/4;c.strokeStyle=colors.grid;c.beginPath();c.moveTo(left,py);c.lineTo(w-right,py);c.stroke();c.fillStyle=colors.text;c.fillText(graphNumber(max*i/4),left-6,py);}
    values.forEach((v,k)=>{const cx=left+(k+.5)*step,bw=Math.min(46,step*.45),z=state.gz[k],magnitude=Math.hypot(z.re,z.im),height=v/max*(base-top);c.fillStyle=colors.green;if(v>1e-12)c.fillRect(cx-bw/2,base-height,bw,height);c.textAlign='center';c.fillText(graphNumber(v),cx,base-height-10);c.fillStyle=colors.text;c.fillText(labels[k],cx,base+18);
      c.strokeStyle='#ccd8c1';c.beginPath();c.arc(cx,base+47,12,0,F.TAU);c.stroke();
      if(magnitude>=1e-10){const a=Math.atan2(z.im,z.re);c.strokeStyle=colors.orange;c.lineWidth=2;c.beginPath();c.moveTo(cx,base+47);c.lineTo(cx+11*Math.cos(a),base+47-11*Math.sin(a));c.stroke();c.lineWidth=1;c.fillText(fmt(a*180/Math.PI,0)+'°',cx,base+72);}else{c.fillText('—',cx,base+47);c.fillText('位相なし',cx,base+72);}
    });
    c.textAlign='left';c.fillStyle=colors.text;c.fillText(power?'|F[χ]|²':'|F[χ]|',left,10);c.fillText('位相',3,base+47);
  }
  function drawTriangle(){
    const m=F.rho(state.triangle),points=Array.from({length:3},(_,i)=>{const a=F.TAU*i/3,x=Math.cos(a),y=Math.sin(a);return[160+76*(m[2]*x+m[3]*y),112-76*(m[0]*x+m[1]*y)];});
    const original=Array.from({length:3},(_,i)=>[160+76*Math.sin(F.TAU*i/3),112-76*Math.cos(F.TAU*i/3)]);
    $('triangleStage').innerHTML=`<svg viewBox="0 0 320 220" role="img" aria-label="操作${F.names[state.triangle]}を施した三角形。色と番号で頂点を識別。"><circle cx="160" cy="112" r="77" fill="none" stroke="#e0e7d9" stroke-dasharray="4 5"/><path d="M160 15V205" stroke="#e0e7d9" stroke-dasharray="3 5"/><polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="#edf4e3" stroke="#40795e" stroke-width="2"/>${original.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="#d6decc"/>`).join('')}${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="14" fill="${['#226858','#c37b42','#7583ad'][i]}"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="white" font-size="12">${i+1}</text>`).join('')}</svg>`;
    $('triangleStatus').textContent=`現在の操作：${F.names[state.triangle]}`;
  }
  function updateS3(){
    stopAll();state.sz=F.s3Transform(state.sx);state.srecon=F.s3Inverse(state.sz,state.mask);
    buildValues('s3Inputs',state.sx,F.names,(i,v)=>{state.sx[i]=v;updateS3();},['何もしない','120°回転','240°回転','鏡映','鏡映→120°','鏡映→240°']);
    const titles=['自明表現 · 1×1','符号表現 · 1×1','標準表現 · 2×2'];
    const descriptions=['すべての操作で+1。全体の平均を受け取ります。','回転で+1、鏡映で−1。その違いを受け取ります。','平面上の回転・鏡映に対応する、4つの成分です。'];
    $('matrixBlocks').innerHTML=titles.map((t,i)=>`<div class="matrix-block ${state.mask[i]?'':'omitted'}"><label class="check"><input type="checkbox" data-block="${i}" ${state.mask[i]?'checked':''}>${t}</label>${i<2?`<span class="matrix-number">${fmt(i===0?state.sz.trivial:state.sz.sign,3)}</span>`:`<div class="matrix-grid">${state.sz.matrix.map(v=>`<span>${fmt(v,3)}</span>`).join('')}</div>`}<p>${descriptions[i]}</p></div>`).join('');
    $('matrixBlocks').querySelectorAll('input').forEach(input=>input.onchange=()=>{const i=Number(input.dataset.block);state.mask[i]=input.checked;updateS3();$('matrixBlocks').querySelectorAll('input')[i].focus();});
    $('s3Roundtrip').textContent=errorFmt(F.rmsError(state.sx,F.s3Inverse(state.sz)));$('s3FilterError').textContent=errorFmt(F.rmsError(state.sx,state.srecon));
    $('s3Energy').textContent=fmt(F.meanSquare(state.sx));$('s3SpectralEnergy').textContent=fmt(state.sz.trivial**2+state.sz.sign**2+2*state.sz.matrix.reduce((s,v)=>s+v*v,0));
    $('s3Reconstruction').textContent=state.srecon.map((v,i)=>`${F.names[i]}: ${fmt(v,3)}`).join('　');
    drawTriangle();if(state.tab==='s3')drawS3();
  }
  function drawS3(){
    const fr=canvasFrame('s3Canvas',200);if(!fr)return;const {c,w,left,right}=fr,limit=Math.max(.2,...state.sx.map(Math.abs),...state.srecon.map(Math.abs))*1.2;
    const {x,y}=axes(fr,limit,F.names.map((n,i)=>[n,(i+.5)/6]));const size=Math.min(17,(w-left-right)/25);
    state.sx.forEach((v,i)=>{const center=x((i+.5)/6);c.fillStyle=colors.green;c.fillRect(center-size-2,Math.min(y(v),y(0)),size,Math.max(1,Math.abs(y(v)-y(0))));const r=state.srecon[i];c.fillStyle=colors.orange;c.fillRect(center+2,Math.min(y(r),y(0)),size,Math.max(1,Math.abs(y(r)-y(0))));});
  }
  function getAudioSamples(){const type=$('audioSource').value;if(state.tab==='sequence')return SequenceLab.audioSamples(type==='reconstructed');if(state.tab==='dft')return type==='original'?state.source:type==='current'?state.x:state.recon;if(state.tab==='abelian')return type==='reconstructed'?state.grecon:state.gx;return type==='reconstructed'?state.srecon:state.sx;}
  async function startNote(id,step=0,duration=0){
    try{const hz=F.frequency(state.scale,state.base,step);await synth.start(id,getAudioSamples().slice(),hz,duration);$('audioStatus').textContent=`${fmt(hz,2)} Hz · ${$('audioSource').selectedOptions[0].textContent}（音声のみDC除去・帯域制限・音量調整）`;}
    catch(e){$('audioStatus').textContent=e.message;}
  }
  function applyScale(){try{const scale=F.parseScale($('scaleText').value);state.scale=scale;stopAll();$('scaleError').textContent='';renderKeyboard();return true;}catch(e){$('scaleError').textContent=e.message+' 直前の音律を継続します。';return false;}}
  const keyboardMap={a:0,s:1,d:2,f:3,g:4,h:5,j:6,k:7,l:8,';':9,':':9,q:5,w:6,e:7,r:8,t:9,y:10,u:11,i:12,o:13,p:14,'[':15,']':16,'1':10,'2':11,'3':12,'4':13,'5':14,'6':15,'7':16,'8':17,'9':18,'0':19,'-':20,'=':21,z:-5,x:-4,c:-3,v:-2,b:-1,n:0,m:1,',':2,'.':3,'/':4};
  function renderKeyboard(){
    $('keyboard').replaceChildren();const keys=['A','S','D','F','G','H','J','K','L',';'];
    keys.forEach((key,i)=>{const b=document.createElement('button');b.className='piano-key';b.type='button';b.dataset.step=i;b.setAttribute('aria-label',`第${i}音 ${fmt(F.frequency(state.scale,state.base,i),1)}Hz`);b.innerHTML=`<small>${i}</small><span>${key}</span>`;
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('playing');startNote('pointer'+e.pointerId,i);};
      b.onpointerup=e=>{synth.stop('pointer'+e.pointerId);b.classList.remove('playing');};b.onpointercancel=b.onpointerup;b.onlostpointercapture=b.onpointerup;
      b.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();b.classList.add('playing');startNote('screen'+i,i);}};b.onkeyup=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();synth.stop('screen'+i);b.classList.remove('playing');}};b.onblur=()=>{synth.stop('screen'+i);b.classList.remove('playing');};$('keyboard').append(b);
    });
    $('scaleReadout').textContent=state.scale.degrees.map((r,i)=>`${i}: ${fmt(r,4)} (${fmt(state.base*r,1)} Hz)`).join('　')+`　周期: ${fmt(state.scale.period,4)}`;
  }
  function redraw(){if(state.tab==='dft'){drawWave();drawSpectrum();}if(state.tab==='abelian')drawAbelianSpectrum();if(state.tab==='s3')drawS3();}
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
  function setGuided(on){state.guided=on;$('guidedMode').classList.toggle('active',on);$('freeMode').classList.toggle('active',!on);$('guidedMode').setAttribute('aria-pressed',String(on));$('freeMode').setAttribute('aria-pressed',String(!on));renderGuide();}
  $('guidedMode').onclick=()=>setGuided(true);$('freeMode').onclick=()=>setGuided(false);
  $('guidePrev').onclick=()=>{state.steps[state.tab]--;renderGuide();};$('guideNext').onclick=()=>{state.steps[state.tab]++;renderGuide();};$('guideTry').onclick=()=>guides[state.tab][state.steps[state.tab]][2]();
  $('preset').onchange=()=>{if(recipes[$('preset').value])setRecipe($('preset').value);};$('formula').oninput=()=>{$('preset').value='custom';};$('applyFormula').onclick=compileAndSample;
  $('sampleCount').oninput=compileAndSample;$('removeMean').onchange=compileAndSample;
  $('shift').onclick=shift;$('reverse').onclick=()=>{state.x=state.x.map((_,i)=>state.x[F.mod(-i,state.n)]);state.swap=null;updateDFT();$('dftInsight').textContent='x[n] → x[−n mod N] と反転しました。実数入力なので振幅は変わらず、係数は複素共役（位相の符号が反転）になります。';};
  $('shuffle').onclick=()=>{for(let i=state.x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.x[i],state.x[j]]=[state.x[j],state.x[i]];}state.swap=null;updateDFT();$('dftInsight').textContent='値の集まりは同じでも、並び方を変えると成分の分布が変わります。平均と全体のエネルギーは保たれます。';};
  $('restore').onclick=()=>{state.x=state.original.slice();state.swap=null;$('swapStatus').textContent='交換する最初の番号を選んでください。';updateDFT();$('dftInsight').textContent='最後に数式から作った標本に戻しました。';};
  $('cutoff').oninput=()=>{state.cutoff=Number($('cutoff').value);updateDFT();};
  $('inspectBin').onchange=()=>{const k=Number($('inspectBin').value);setBin(Number.isInteger(k)?Math.max(0,Math.min(state.n-1,k)):0);};
  $('spectrumCanvas').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect();const k=Math.floor((e.clientX-rect.left-42)/(rect.width-58)*state.n);if(k>=0&&k<state.n)setBin(k);};
  $('groupType').onchange=()=>{state.group=$('groupType').value;updateAbelian();};
  $('abelianSpectrumMetric').onchange=updateAbelianSpectrum;
  $('abelianInspect').onchange=()=>{abelianBin=Number($('abelianInspect').value);updateAbelianSpectrum();};
  $('abelianSpectrumCanvas').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect(),k=Math.floor((e.clientX-rect.left-42)/(rect.width-58)*4);if(k>=0&&k<4){abelianBin=k;updateAbelianSpectrum();}};
  $('groupTranslate').onclick=()=>{state.gx=state.group==='z4'?state.gx.map((_,i)=>state.gx[F.mod(i-1,4)]):state.gx.map((_,i)=>state.gx[i^1]);updateAbelian();};
  $('groupTranslateY').onclick=()=>{state.gx=state.gx.map((_,i)=>state.gx[i^2]);updateAbelian();};$('groupReset').onclick=()=>{state.gx=[1,.3,-.7,.2];updateAbelian();};
  $('rotateTriangle').onclick=()=>{state.triangle=F.mul(1,state.triangle);drawTriangle();};$('reflectTriangle').onclick=()=>{state.triangle=F.mul(3,state.triangle);drawTriangle();};$('resetTriangle').onclick=()=>{state.triangle=0;drawTriangle();};
  $('compareRS').onclick=()=>{state.triangle=F.mul(3,1);drawTriangle();};$('compareSR').onclick=()=>{state.triangle=F.mul(1,3);drawTriangle();};
  $('s3Delta').onclick=()=>{state.sx=[1,0,0,0,0,0];updateS3();};$('s3TranslateR').onclick=()=>{state.sx=F.translate(state.sx,1);updateS3();};$('s3TranslateS').onclick=()=>{state.sx=F.translate(state.sx,3);updateS3();};$('s3Reset').onclick=()=>{state.sx=[1,.2,-.5,.7,-.3,.1];state.mask=[true,true,true];updateS3();};
  $('multiplicationTable').innerHTML=`<table><caption>行 × 列（右の操作から先に実行）</caption><thead><tr><th>·</th>${F.names.map(n=>`<th>${n}</th>`).join('')}</tr></thead><tbody>${F.names.map((n,g)=>`<tr><th>${n}</th>${F.names.map((_,h)=>`<td>${F.names[F.mul(g,h)]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  $('audioSource').onchange=()=>{stopAll();$('audioStatus').textContent='聴く対象を変更しました。再生ボタンまたは鍵盤を押してください。';};
  $('playSound').onclick=()=>{stopAll();startNote('preview',0,2);};$('stopSound').onclick=()=>{stopAll();$('audioStatus').textContent='すべての音を停止しました。';};
  $('volume').oninput=()=>{synth.setVolume(Number($('volume').value)/100);$('volumeValue').textContent=$('volume').value+'%';};
  $('baseFrequency').onchange=()=>{const value=Number($('baseFrequency').value);if(!Number.isFinite(value)||value<20||value>2000){$('baseFrequency').value=state.base;return;}const old=state.base;state.base=value;const usesTime=/\b(t|sr)\b/.test($('formula').value.replace(/#[^\n]*|\/\/[^\n]*/g,''));if(usesTime&&!compileAndSample()){state.base=old;$('baseFrequency').value=old;}stopAll();renderKeyboard();};
  $('scaleText').value=scalePresets.equal;$('scalePreset').onchange=()=>{const text=scalePresets[$('scalePreset').value];if(text){$('scaleText').value=text;applyScale();}};$('scaleText').oninput=()=>{$('scalePreset').value='custom';};$('applyScale').onclick=applyScale;
  $('exportWav').onclick=()=>{try{stopAll();const buffer=F.wav(getAudioSamples(),state.base,2,synth.volume/4),blob=new Blob([buffer],{type:'audio/wav'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`fourier-${state.tab}-${$('audioSource').value}-${state.base}Hz.wav`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('audioStatus').textContent='基準音を2秒のWAVとして書き出しました。';}catch(e){$('audioStatus').textContent=e.message;}};
  $('keyboardEnabled').onchange=stopAll;
  const editing=()=>{const el=document.activeElement;return el&&(el.matches('input,textarea,select')||el.isContentEditable);};
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){stopAll();return;}if(!e.isComposing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&!editing()&&$('keyboardEnabled').checked&&Object.hasOwn(keyboardMap,e.key.toLowerCase())){e.preventDefault();const key=e.key.toLowerCase(),step=keyboardMap[key];startNote('key'+e.code,step);document.querySelector(`[data-step="${step}"]`)?.classList.add('playing');}});
  window.addEventListener('keyup',e=>{synth.stop('key'+e.code);const step=keyboardMap[e.key.toLowerCase()];document.querySelector(`[data-step="${step}"]`)?.classList.remove('playing');});
  document.addEventListener('focusin',()=>{if(editing())stopAll();});window.addEventListener('blur',stopAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();});window.addEventListener('pagehide',stopAll);
  let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(redraw);});
  compileAndSample();updateAbelian();updateS3();SequenceLab.init({onChange:stopAll,getSamples:()=>state.x.slice()});renderKeyboard();setTab('dft');
})();
