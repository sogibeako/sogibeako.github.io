/* Shared sequence, two explicit group assignments, independent Fourier decompositions. */
(function(root){
  'use strict';
  const G=GroupFourier,$=id=>document.getElementById(id);
  // Stabilize display rounding at decimal half-steps; calculations retain full precision.
  const number=v=>Math.abs(v)<1e-10?'0':Math.abs(v)>=1e5||Math.abs(v)<.0001?v.toExponential(3):String(Number((v+Math.sign(v)*1e-12*Math.max(1,Math.abs(v))).toFixed(5)));
  const format=z=>Math.abs(z.im)<1e-10?number(z.re):`${number(z.re)} ${z.im<0?'−':'+'} ${number(Math.abs(z.im))}i`;
  const raw=z=>z.im===0?String(z.re):`${z.re}${z.im<0?'':'+'}${z.im}i`;
  const phase=z=>Math.hypot(z.re,z.im)<1e-10?'未定義（0）':number(Math.atan2(z.im,z.re)*180/Math.PI)+'°';
  const clone=x=>x.map(z=>({...z}));
  const examples={eight:'1, 0.5, -1, 0, 2, -0.5, 0.3, -0.8',six:'1, 0.5, -1, 0, 2, -0.5',four:'1, -1, -1, 1',complex:'1, i, -1, -i'};
  let x=[],original=[],options=[],ids=[],groups=[],results=[],back=[],selected=[0,0],generators=[0,0],changed=()=>{},importValues=()=>[];
  function syncText(){ $('sequenceText').value=x.map(raw).join(', ');$('sequenceError').textContent=''; }
  function status(text){$('sequenceStatus').textContent=text;}
  function load(values){
    x=clone(values);original=clone(x);options=G.catalog(x.length);
    ids=[options[0].id,(options.find(g=>g.type==='dihedral')||options[1]||options[0]).id];
    selected=[0,0];generators=[0,0];$('sequencePadCount').value=x.length;syncText();render();
    status(`${x.length}個を適用しました。群を切り替えて比較できます。`);
  }
  function apply(){try{load(G.parseSequence($('sequenceText').value));}catch(e){$('sequenceError').textContent=e.message+' 直前の結果を表示しています。';}}
  function matrixHTML(matrix,d){return `<div class="sequence-matrix" style="--matrix-d:${d}">${matrix.map(z=>`<span>${format(z)}</span>`).join('')}</div>`;}
  function render(){
    changed();groups=ids.map(G.makeGroup);results=groups.map(g=>G.transform(x,g));back=groups.map((g,i)=>G.inverse(results[i],g));
    const blockEnergy=groups.map((g,i)=>G.energies(results[i],g)),inputEnergy=G.energy(x),max=Math.max(1e-24,...blockEnergy.flat())*1.1;
    $('sequenceCount').textContent=`${x.length} VALUES · ${options.length} GROUP OPTIONS`;
    $('sequenceInputEnergy').textContent=`入力のエネルギー ${number(inputEnergy)}`;
    $('sequenceComparison').innerHTML=groups.map((g,side)=>{
      selected[side]=Math.min(selected[side],g.irreps.length-1);generators[side]=Math.min(generators[side],g.generators.length-1);
      const k=selected[side],rep=g.irreps[k],block=results[side][k],total=blockEnergy[side].reduce((a,b)=>a+b,0),err=G.error(x,back[side]);
      return `<article class="card sequence-result"><div class="plot-heading"><div class="section-label">${side?'B':'A'} / ${g.type==='abelian'?'ABELIAN':'NON-ABELIAN'}</div><span class="badge">${g.n} ELEMENTS</span></div><label for="sequenceGroup${side}">比較する群 ${side?'B':'A'}</label><select id="sequenceGroup${side}">${options.map(o=>`<option value="${o.id}" ${o.id===ids[side]?'selected':''}>${o.label}</option>`).join('')}</select><p class="hint">${g.description}</p><p class="sequence-dimensions">出力：${g.irreps.map(r=>r.d).filter(d=>d===1).length}個の数${g.type==='dihedral'?' ＋ 1個の2×2行列':''} ／ Σ d² = ${g.irreps.reduce((s,r)=>s+r.d*r.d,0)}</p>
        <div class="sequence-axis-label">成分のエネルギー · 共通目盛り 0〜${number(max)}</div><div class="sequence-spectrum-scroll" tabindex="0" aria-label="群${side?'B':'A'}のスペクトル。多数の成分は横スクロールできます。"><div class="sequence-bars" style="--bar-count:${g.irreps.length}">${g.irreps.map((r,j)=>`<button id="sequenceBar${side}_${j}" class="sequence-bar" aria-pressed="${j===k}" aria-label="${r.label}：エネルギー ${number(blockEnergy[side][j])} を選択"><span class="sequence-bar-track"><span class="sequence-bar-value">${number(blockEnergy[side][j])}</span><span class="sequence-bar-fill" style="height:${100*blockEnergy[side][j]/max}%"></span></span><span class="sequence-bar-index">${j}</span><span class="sequence-bar-dimension">${r.d}×${r.d}</span></button>`).join('')}</div></div><p class="hint">横軸：成分番号（下の選択欄で指標・表現の名前を確認）。1×1は複素数、2×2は行列です。</p>
        <label for="sequenceBlock${side}">成分を詳しく見る</label><select id="sequenceBlock${side}">${g.irreps.map((r,j)=>`<option value="${j}" ${j===k?'selected':''}>${j}：${r.label}（${r.d}×${r.d}）</option>`).join('')}</select><div class="sequence-coefficient"><h3>${rep.label}</h3>${matrixHTML(block,rep.d)}<p>${rep.description}</p>${rep.d===1?`<p>|F| = ${number(Math.sqrt(G.abs2(block[0])))} ／ 位相 = ${phase(block[0])}</p>`:'<p>行列全体に1つの位相は付けません。各成分の大きさ・位相は下の係数表で確認できます。</p>'}<p>エネルギー ${number(blockEnergy[side][k])} ／ 全体の ${inputEnergy>1e-20?number(100*blockEnergy[side][k]/inputEnergy)+'%':'—（入力が0）'}</p></div>
        <div class="sequence-metrics"><div><span>往復誤差 RMS</span><strong>${err<1e-10?'≈ 0':err.toExponential(2)}</strong></div><div><span>全棒のエネルギー合計</span><strong>${number(total)}</strong></div></div>
        <label for="sequenceMove${side}">この群に沿って入力を移動</label><div class="sequence-move"><select id="sequenceMove${side}">${g.generators.map((h,j)=>`<option value="${j}" ${j===generators[side]?'selected':''}>${h.label}</option>`).join('')}</select><button id="sequenceTranslate${side}">移す</button></div><p class="hint">A・B共通の入力が変わります。対応表も更新されます。</p>
        <details><summary>全係数の数値を見る</summary><div class="table-scroll"><table><thead><tr><th>成分</th><th>行,列</th><th>係数</th><th>|係数|</th><th>位相</th></tr></thead><tbody>${g.irreps.flatMap((r,j)=>results[side][j].map((z,t)=>`<tr><td>${j}</td><td>${Math.floor(t/r.d)+1},${t%r.d+1}</td><td>${format(z)}</td><td>${number(Math.sqrt(G.abs2(z)))}</td><td>${phase(z)}</td></tr>`)).join('')}</tbody></table></div></details></article>`;
    }).join('');
    groups.forEach((g,side)=>{
      $(`sequenceGroup${side}`).onchange=e=>{ids[side]=e.target.value;selected[side]=0;generators[side]=0;render();$(`sequenceGroup${side}`).focus({preventScroll:true});};
      $(`sequenceBlock${side}`).onchange=e=>{selected[side]=Number(e.target.value);render();$(`sequenceBlock${side}`).focus({preventScroll:true});};
      g.irreps.forEach((_,k)=>{$(`sequenceBar${side}_${k}`).onclick=()=>{selected[side]=k;const scroll=document.querySelectorAll('.sequence-spectrum-scroll')[side].scrollLeft;render();document.querySelectorAll('.sequence-spectrum-scroll')[side].scrollLeft=scroll;$(`sequenceBar${side}_${k}`).focus({preventScroll:true});};});
      $(`sequenceMove${side}`).onchange=e=>{generators[side]=Number(e.target.value);};
      $(`sequenceTranslate${side}`).onclick=()=>{x=G.translate(x,g,g.generators[generators[side]].index);syncText();render();status(`${side?'B':'A'}の群の移動を、共通の数列に適用しました。`);$(`sequenceTranslate${side}`).focus({preventScroll:true});};
    });
    $('sequenceMapping').innerHTML=x.map((z,i)=>`<tr><td>${i}</td><td>${format(z)}</td><td>${groups[0].labels[i]}</td><td>${format(back[0][i])}</td><td>${groups[1].labels[i]}</td><td>${format(back[1][i])}</td></tr>`).join('');
    for(const [id,fallback] of [['sequenceSwapFrom',0],['sequenceSwapTo',1]]){const old=Number($(id).value||fallback);$(id).innerHTML=x.map((_,i)=>`<option value="${i}">${i}</option>`).join('');$(id).value=Math.min(old,x.length-1);}
  }
  function init(callbacks){
    changed=callbacks.onChange;importValues=callbacks.getSamples;
    $('sequenceApply').onclick=apply;
    $('sequenceText').oninput=()=>{status('入力欄は未反映です。「この数列で比較する」を押してください。');$('sequenceError').textContent='';};
    $('sequenceImport').onclick=()=>{load(importValues().map(v=>G.C(v)));status('01の現在の標本をコピーしました。以後の編集は独立しています。');};
    $('sequenceLoadExample').onclick=()=>load(G.parseSequence(examples[$('sequenceExample').value]));
    $('sequencePad').onclick=()=>{try{const parsed=G.parseSequence($('sequenceText').value),n=Number($('sequencePadCount').value);load(G.padSequence(parsed,n));status(`${parsed.length}個から${n}個へ、末尾に${n-parsed.length}個の0を追加して適用しました。`);}catch(e){$('sequenceError').textContent=e.message+' 直前の結果を表示しています。';}};
    $('sequenceSwap').onclick=()=>{const a=Number($('sequenceSwapFrom').value),b=Number($('sequenceSwapTo').value);[x[a],x[b]]=[x[b],x[a]];syncText();render();status(`位置${a}と${b}の値を交換しました。`);};
    $('sequenceShuffle').onclick=()=>{for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}syncText();render();status('値を並べ替えました。全体のエネルギーは保たれます。');};
    $('sequenceRestore').onclick=()=>{x=clone(original);syncText();render();status('最後に適用した数列の並びに戻しました。');};
    $('sequenceAudioGroup').onchange=changed;$('sequenceAudioPart').onchange=changed;
    apply();
  }
  function audioSamples(reconstructed){const source=reconstructed?back[Number($('sequenceAudioGroup').value)]:x,part=$('sequenceAudioPart').value;const samples=source.map(z=>z[part]);return samples.length===1?[samples[0],samples[0]]:samples;}
  root.SequenceLab={init,audioSamples,example:name=>load(G.parseSequence(examples[name]))};
})(globalThis);
