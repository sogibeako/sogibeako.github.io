'use strict';
const labels=['図形で覆う','極小文字で覆う','矩形状に消す','穴と塗り戻し','上へ循環移動','左へ循環移動','半分を左右反転','左半分を複製','上半分を複製','４文字を重ねる'];
const $=id=>document.getElementById(id);
let seed=53721;
labels.forEach((label,i)=>{const n=i+1;const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=n;input.checked=true;row.append(input,document.createTextNode(n+' '+label));$('methods').append(row);
 const card=document.createElement('div');card.className='comparison-card';const heading=document.createElement('h3');heading.textContent=n+' / '+label;const output=document.createElement('div');output.className='comparison-output checker';const span=document.createElement('span');span.dataset.glitchMethod=n;span.dataset.glitchRate='85';span.textContent=$('source').value;output.append(span);card.append(heading,output);$('comparisons').append(card);
 const tr=document.createElement('tr'),number=document.createElement('td'),description=document.createElement('td');number.textContent=n;description.textContent=label;tr.append(number,description);$('methodTable').append(tr);
});
function update(){
 const value=$('source').value;
 const chars=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(value),s=>s.segment):Array.from(value);
 const text=chars.slice(0,120).join('');
 const selected=Array.from($('methods').querySelectorAll('input:checked'),x=>x.value);const methods=selected.length===10?'all':selected.join(',');
 const rate=selected.length?Number($('rate').value):0;
 $('rateOut').value=$('rate').value+'%';$('sizeOut').value=$('size').value+'px';$('normal').textContent=text;
 const preview=$('preview');preview.dataset.glitchMethod=methods||'all';preview.dataset.glitchRate=rate;preview.dataset.glitchSeed=seed;
 const box=$('previewBox');box.style.fontSize=$('size').value+'px';box.classList.toggle('checker',$('checker').checked);box.classList.toggle('dark',$('dark').checked);
 GlitchText.init(preview);GlitchText.setText(preview,text);
 for(const output of $('comparisons').querySelectorAll('.comparison-output')){output.classList.toggle('checker',$('checker').checked);output.classList.toggle('dark',$('dark').checked);output.style.fontSize=$('size').value+'px';const span=output.firstElementChild;span.dataset.glitchRate=$('rate').value;span.dataset.glitchSeed=seed;GlitchText.init(span);GlitchText.setText(span,text);}
 const escaped=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 $('generated').textContent='<span data-glitch-method="'+(methods||'all')+'" data-glitch-rate="'+rate+'">'+escaped+'</span>';
}
for(const id of ['source','rate','size','checker','dark','methods'])$(id).addEventListener('input',update);
$('reroll').addEventListener('click',()=>{seed=Math.floor(Math.random()*2147483647);update();});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('generated').textContent);$('copyStatus').textContent='spanの書式をコピーしました。';}catch{$('copyStatus').textContent='コードを選択してコピーしてください。';}});
update();
if(document.modelContext?.registerTool){try{void Promise.resolve(document.modelContext.registerTool({name:'configure_glitch_preview',title:'文字バグの見え方を設定',description:'表示文字・加工方法・加工割合を設定し、見え方テストと組み込みコードを更新する。',inputSchema:{type:'object',properties:{text:{type:'string',maxLength:240},methods:{type:'array',minItems:1,items:{type:'integer',minimum:1,maximum:10}},rate:{type:'number',minimum:0,maximum:100}},required:['text','methods','rate'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input.text!=='string'||input.text.length>240||!Array.isArray(input.methods)||!input.methods.length||input.methods.some(n=>!Number.isInteger(n)||n<1||n>10)||!Number.isFinite(input.rate)||input.rate<0||input.rate>100)throw new TypeError('Invalid preview settings');$('source').value=input.text;$('rate').value=input.rate;for(const checkbox of $('methods').querySelectorAll('input'))checkbox.checked=input.methods.includes(Number(checkbox.value));update();return {text:$('normal').textContent,code:$('generated').textContent};}})).catch(()=>{});}catch{}}
