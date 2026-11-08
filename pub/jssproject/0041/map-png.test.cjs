const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8'),nodes=new Map([['mapPngStatus',{}],['mapArchive',{hidden:false}],['archiveMap',{width:300,height:200,toDataURL:type=>{assert.equal(type,'image/png');return 'data:image/png;base64,archive';}}]]),downloads=[];
for(const id of ['mapPngImage','mapPngDownload','mapPngCaption','mapPngPreview'])nodes.set(id,{});nodes.set('autoDownloadMapPng',{checked:true});nodes.set('annotateMapPng',{checked:false});
let rendered=0,removed=0;const context={game:{world:{seed:'walk/test'},turns:42},view:0,canvas:{width:800,height:500,toDataURL:()=> 'data:image/png;base64,main'},$:id=>nodes.get(id),render(){rendered++;},document:{body:{append(){}},createElement(){return {click(){downloads.push({href:this.href,name:this.download});},remove(){removed++;}}}}};
vm.runInNewContext(source.slice(source.indexOf('function annotatedMapPng('),source.indexOf("$('exportMapPng').addEventListener")),context);
const before=JSON.stringify(context.game);context.exportMapPng(false);assert.equal(downloads[0].name,'maze-walk_test-subjective-42.png');assert(downloads[0].href.endsWith('main'));
context.view=1;context.exportMapPng(false);assert(downloads[1].name.includes('-truth-'));context.exportMapPng(true);assert(downloads[2].href.endsWith('archive'));assert(downloads[2].name.includes('-archive-'));assert.equal(rendered,3);assert.equal(removed,3);assert.equal(JSON.stringify(context.game),before);
nodes.get('mapArchive').hidden=true;context.exportMapPng(true);assert.equal(downloads.length,3);assert(nodes.get('mapPngStatus').textContent.includes('ありません'));
context.canvas.toDataURL=()=> 'data:,';context.exportMapPng(false);assert.equal(downloads.length,3);assert(nodes.get('mapPngStatus').textContent.includes('保存できませんでした'));
context.canvas.toDataURL=()=>{throw Error('blocked');};context.exportMapPng(false);assert.equal(downloads.length,3);assert(nodes.get('mapPngStatus').textContent.includes('blocked'));
console.log('PASS: actual PNG handler captures selected canvas, labels view/seed/turn, cleans link, retains game and handles missing archive/encoding failures.');

const previousPreview=nodes.get('mapPngImage').src;assert(previousPreview.endsWith('archive'));assert.equal(nodes.get('mapPngDownload').href,previousPreview);assert(nodes.get('mapPngCaption').textContent.includes('300 × 200px'));assert.equal(nodes.get('mapPngPreview').hidden,false);
nodes.get('autoDownloadMapPng').checked=false;context.canvas.toDataURL=()=> 'data:image/png;base64,preview';context.exportMapPng(false);assert.equal(downloads.length,3);assert.equal(nodes.get('mapPngImage').src,'data:image/png;base64,preview');assert.equal(nodes.get('mapPngDownload').href,nodes.get('mapPngImage').src);assert.equal(nodes.get('mapPngDownload').download,'maze-walk_test-truth-42.png');assert(nodes.get('mapPngStatus').textContent.includes('プレビューを確認'));
console.log('PASS: preview matches download bytes/name, includes captured dimensions and turn, encoding failure keeps prior preview, preview-only does not download.');

const textDraws=[],imageDraws=[];const drawContext={measureText:t=>({width:t.length*7}),fillRect(){},drawImage:(...args)=>imageDraws.push(args),fillText:(...args)=>textDraws.push(args)};
const createOriginal=context.document.createElement;let outputCanvas;
context.document.createElement=tag=>tag==='canvas'?(outputCanvas={width:0,height:0,getContext:()=>drawContext,toDataURL:()=> 'data:image/png;base64,annotated'}):createOriginal();
Object.assign(context.game.world,{width:31,height:23,algorithm:'dfs',topology:'torus'});nodes.get('annotateMapPng').checked=true;
context.exportMapPng(false);assert.equal(outputCanvas.width,800);assert(outputCanvas.height>500);assert.equal(imageDraws[0][0],context.canvas);assert.equal(context.canvas.height,500);assert(textDraws.some(a=>a[0].includes('walk/test')));assert(textDraws.some(a=>a[0].includes('42行動目')));assert(textDraws.some(a=>a[0].includes('トーラス')));assert(nodes.get('mapPngImage').src.endsWith('annotated'));
context.game.world.seed='long-'.repeat(100);context.exportMapPng(false);assert(textDraws.every(a=>drawContext.measureText(a[0]).width<=776));
console.log('PASS: optional metadata footer preserves source canvas, captures seed/world/turn, expands output and wraps long text.');
