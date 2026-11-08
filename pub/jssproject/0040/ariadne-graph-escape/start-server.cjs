// Local-only server: live music inventory, no dependencies. Ctrl+C stops it.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),port=Number(process.env.ARIADNE_PORT||8765);
const extensions=new Set(['.mp3','.wav','.ogg','.m4a','.aac','.flac']);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.aac':'audio/aac','.flac':'audio/flac'};
http.createServer((req,res)=>{
 let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(url==='/api/music'){try{const files=fs.readdirSync(path.join(root,'material/music'),{withFileTypes:true}).filter(f=>f.isFile()&&extensions.has(path.extname(f.name).toLowerCase())).map(f=>'../material/music/'+encodeURIComponent(f.name));res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(files));}catch{res.writeHead(500).end();}return;}
 if(url==='/'){res.writeHead(302,{Location:'/ariadne-graph-escape/index.html'}).end();return;}
 const file=path.resolve(root,'.'+url),relative=path.relative(root,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)||!['ariadne-graph-escape','material'].includes(relative.split(path.sep)[0])){res.writeHead(403).end();return;}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache'});fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);});
}).listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}/`;console.log(`Ariadne: ${url} (Ctrl+C to stop)`);if(process.argv.includes('--open')&&process.platform==='win32')require('node:child_process').execFile('cmd.exe',['/c','start','',url],{windowsHide:true});});
