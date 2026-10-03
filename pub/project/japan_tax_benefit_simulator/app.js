(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const yen = value => `${Math.round(value).toLocaleString('ja-JP')}円`;
  const signedYen = value => `${value >= 0 ? '+' : '−'}${Math.abs(Math.round(value)).toLocaleString('ja-JP')}円`;
  const els = Object.fromEntries(['income','incomeRange','age','prefecture','city','employment','insured','policyEnabled','preset','maxCredit','phaseStart','phaseRate','maxCreditOut','phaseStartOut','phaseRateOut','reformDisposable','monthlyDisposable','differenceBadge','currentBarValue','reformBarValue','currentBar','reformBar','rowIncome','rowIncomeTax','rowResidentTax','rowInsurance','rowCredit','rowDisposable','basisSalaryDeduction','basisSalaryIncome','basisTaxable','cliffAlert','cliffText','incomeChart','chartTooltip','toast','exportMenu'].map(id => [id,$(id)]));
  let chartMode = 'disposable';
  let chartRows = [];
  let lastResults = null;

  function state() {
    return {
      input: { income: Number(els.income.value) || 0, age: Number(els.age.value), insured: els.insured.checked, prefecture: els.prefecture.value, city: els.city.value, employment: els.employment.value },
      policy: { enabled: els.policyEnabled.checked, maxCredit: Number(els.maxCredit.value), phaseStart: Number(els.phaseStart.value), phaseRate: Number(els.phaseRate.value) }
    };
  }

  function setPreset(name) {
    const presets = { a: [600000,1000000,.2], b: [800000,1800000,.15] };
    if (!presets[name]) return;
    [els.maxCredit.value,els.phaseStart.value,els.phaseRate.value] = presets[name];
    $('presetBadge').textContent = name.toUpperCase();
    update();
  }

  function updateUrl() {
    const { input, policy } = state();
    const q = new URLSearchParams({ income: input.income, age: input.age, insured: input.insured ? 1 : 0, policy: policy.enabled ? 'credit-a' : 'off', max: policy.maxCredit, start: policy.phaseStart, rate: policy.phaseRate });
    history.replaceState(null, '', `${location.pathname}?${q}`);
  }

  function loadUrl() {
    const q = new URLSearchParams(location.search);
    if (q.has('income')) els.income.value = Math.max(0, Number(q.get('income')) || 0);
    if (q.has('age')) els.age.value = q.get('age');
    if (q.has('insured')) els.insured.checked = q.get('insured') !== '0';
    if (q.has('policy')) els.policyEnabled.checked = q.get('policy') !== 'off';
    if (q.has('max')) els.maxCredit.value = q.get('max');
    if (q.has('start')) els.phaseStart.value = q.get('start');
    if (q.has('rate')) els.phaseRate.value = q.get('rate');
  }

  function update() {
    const { input, policy } = state();
    els.incomeRange.value = Math.min(10000000, input.income);
    els.maxCreditOut.textContent = yen(policy.maxCredit);
    els.phaseStartOut.textContent = yen(policy.phaseStart);
    els.phaseRateOut.textContent = `${Math.round(policy.phaseRate * 100)}%`;
    const current = TaxSimulator.calculate(input, { ...policy, enabled: false });
    const reform = TaxSimulator.calculate(input, policy);
    lastResults = { input, policy, current, reform };
    const diff = reform.disposable - current.disposable;
    els.reformDisposable.textContent = yen(reform.disposable);
    els.monthlyDisposable.textContent = yen(reform.disposable / 12);
    els.differenceBadge.querySelector('strong').textContent = signedYen(diff);
    els.differenceBadge.classList.toggle('negative', diff < 0);
    els.currentBarValue.textContent = yen(current.disposable);
    els.reformBarValue.textContent = yen(reform.disposable);
    const scale = Math.max(current.disposable, reform.disposable, 1);
    els.currentBar.style.width = `${current.disposable / scale * 100}%`;
    els.reformBar.style.width = `${reform.disposable / scale * 100}%`;
    els.rowIncome.textContent = yen(input.income);
    els.rowIncomeTax.textContent = signedYen(-reform.incomeTax);
    els.rowResidentTax.textContent = signedYen(-reform.residentTax);
    els.rowInsurance.textContent = signedYen(-reform.insurance);
    els.rowCredit.textContent = signedYen(reform.credit);
    els.rowDisposable.textContent = yen(reform.disposable);
    els.basisSalaryDeduction.textContent = yen(reform.deduction);
    els.basisSalaryIncome.textContent = yen(reform.salaryIncome);
    $('basisBasicDeduction').textContent = yen(reform.basicDeduction);
    els.basisTaxable.textContent = yen(reform.incomeTaxable);
    const cliff = TaxSimulator.findCliff(input, policy);
    els.cliffAlert.hidden = !cliff;
    if (cliff) els.cliffText.textContent = `${yen(cliff.from)} → ${yen(cliff.to)}で可処分所得が${yen(Math.abs(cliff.delta))}減少します。`;
    chartRows = TaxSimulator.simulate(input, policy);
    drawChart();
    updateUrl();
  }

  function drawChart() {
    const canvas = els.incomeChart;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, rect.width * dpr); canvas.height = Math.max(260, rect.height * dpr);
    const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
    const W=rect.width,H=rect.height,p={l:58,r:18,t:16,b:42},w=W-p.l-p.r,h=H-p.t-p.b;
    const pick = (row, key) => chartMode==='disposable'?row[key].disposable:chartMode==='burden'?row[key].burden:chartMode==='credit'?row[key].credit:row[`metr${key[0].toUpperCase()+key.slice(1)}`]*100;
    const all = chartRows.flatMap(r => [pick(r,'current'),pick(r,'reform')]);
    let max=Math.max(...all,1),min=Math.min(0,...all); if(chartMode==='metr'){max=Math.max(100,max);min=Math.min(0,min)}
    ctx.clearRect(0,0,W,H);ctx.font='10px DM Sans, sans-serif';ctx.fillStyle='#71817c';ctx.strokeStyle='#e0e4e1';ctx.lineWidth=1;
    for(let i=0;i<=5;i++){const y=p.t+h*i/5;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();const value=max-(max-min)*i/5;ctx.textAlign='right';ctx.fillText(chartMode==='metr'?`${Math.round(value)}%`:`${(value/10000).toLocaleString('ja-JP',{maximumFractionDigits:0})}万`,p.l-10,y+3)}
    for(let i=0;i<=5;i++){const x=p.l+w*i/5;ctx.fillText(`${i*200}万`,x-10,H-14)}
    const xy=(i,v)=>[p.l+w*i/(chartRows.length-1),p.t+h*(max-v)/(max-min||1)];
    function line(key,color,width,dash=[]){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);chartRows.forEach((r,i)=>{const [x,y]=xy(i,pick(r,key));i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.setLineDash([])}
    line('current','#8ca09a',2,[5,4]);line('reform','#16745d',3);
    const income=Number(els.income.value);const idx=Math.min(chartRows.length-1,Math.max(0,Math.round(income/10000)));const x=xy(idx,0)[0];ctx.strokeStyle='#e7773c';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(x,p.t);ctx.lineTo(x,p.t+h);ctx.stroke();ctx.setLineDash([]);
  }

  function tooltip(event) {
    const rect=els.incomeChart.getBoundingClientRect(), left=58, right=18, x=Math.max(left,Math.min(rect.width-right,event.clientX-rect.left));
    const idx=Math.round((x-left)/(rect.width-left-right)*(chartRows.length-1)), row=chartRows[idx]; if(!row)return;
    const value = r => chartMode==='disposable'?r.disposable:chartMode==='burden'?r.burden:chartMode==='credit'?r.credit:null;
    const c=chartMode==='metr'?`${Math.round(row.metrCurrent*100)}%`:yen(value(row.current)); const r=chartMode==='metr'?`${Math.round(row.metrReform*100)}%`:yen(value(row.reform));
    els.chartTooltip.innerHTML=`<b>年収 ${yen(row.income)}</b><br>現行 ${c}<br>改革 ${r}`;els.chartTooltip.hidden=false;els.chartTooltip.style.left=`${x}px`;els.chartTooltip.style.top=`${event.clientY-rect.top}px`;
  }

  function toast(message){els.toast.textContent=message;els.toast.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>els.toast.classList.remove('show'),2200)}
  function exportData(type){
    const data={generatedAt:new Date().toISOString(),year:2026,scope:'single salaried adult / estimate',...lastResults};
    let content,mime,name;
    if(type==='json'){content=JSON.stringify(data,null,2);mime='application/json';name='tax-benefit-result.json'}else{content='項目,現行制度,改革案\n'+[['給与収入',data.current.income,data.reform.income],['所得税',data.current.incomeTax,data.reform.incomeTax],['住民税',data.current.residentTax,data.reform.residentTax],['社会保険料',data.current.insurance,data.reform.insurance],['給付',data.current.credit,data.reform.credit],['可処分所得',data.current.disposable,data.reform.disposable]].map(r=>r.join(',')).join('\n');mime='text/csv;charset=utf-8';name='tax-benefit-result.csv'}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+content],{type:mime}));a.download=name;a.click();URL.revokeObjectURL(a.href);els.exportMenu.hidden=true;toast(`${type.toUpperCase()}を保存しました`);
  }

  loadUrl();
  ['income','age','prefecture','city','employment','insured','policyEnabled','maxCredit','phaseStart','phaseRate'].forEach(id=>$(id).addEventListener(id==='city'?'change':'input',()=>{if(['maxCredit','phaseStart','phaseRate'].includes(id)){els.preset.value='custom';$('presetBadge').textContent='●'}update()}));
  els.incomeRange.addEventListener('input',()=>{els.income.value=els.incomeRange.value;update()});
  els.preset.addEventListener('change',()=>setPreset(els.preset.value));
  $('resetPolicy').addEventListener('click',()=>{els.preset.value='a';els.policyEnabled.checked=true;setPreset('a')});
  $('basisToggle').addEventListener('click',()=>{$('basisDetails').hidden=!$('basisDetails').hidden;$('basisToggle').textContent=$('basisDetails').hidden?'計算根拠を表示':'計算根拠を閉じる'});
  $('noticeClose').addEventListener('click',e=>e.currentTarget.parentElement.remove());
  document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');chartMode=b.dataset.chart;drawChart()}));
  els.incomeChart.addEventListener('mousemove',tooltip);els.incomeChart.addEventListener('mouseleave',()=>els.chartTooltip.hidden=true);window.addEventListener('resize',drawChart);
  $('shareButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('再現用リンクをコピーしました')}catch{toast('アドレスバーのURLをコピーしてください')}});
  $('exportButton').addEventListener('click',()=>els.exportMenu.hidden=!els.exportMenu.hidden);document.querySelectorAll('[data-export]').forEach(b=>b.addEventListener('click',()=>exportData(b.dataset.export)));
  update();
  const tests=TaxSimulator.selfTest();console.info(`[TaxSimulator] self-test ${tests.passed}/${tests.total}`,tests.ok?'PASS':'FAIL');
})();
