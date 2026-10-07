/* Browser and Node share this dependency-free simulation core. */
(function (root) {
  'use strict';
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  function random(seed) {
    let s = 2166136261;
    for (const c of String(seed)) s = Math.imul(s ^ c.charCodeAt(0), 16777619);
    return () => { s += 0x6D2B79F5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const mod = (n, size) => ((n % size) + size) % size;
  // One sheared seam at a time preserves a rectangular fundamental domain.
  function periodicPosition(world, x, y, foldX = true, foldY = true) {
    if (world.lattice) {
      if (!foldX && !foldY) return { x, y };
      const l = world.lattice, gx = x + l.originX, gy = y + l.originY;
      const bx = Math.floor(gx / 2), by = Math.floor(gy / 2);
      const p = latticePoint(l.width / 2, l.height / 2, world.shiftX / 2, world.shiftY / 2, bx, by, foldX, foldY);
      return { x: 2*p.x + mod(gx,2) - l.originX, y: 2*p.y + mod(gy,2) - l.originY };
    }
    const sx = world.shiftX || 0, sy = world.shiftY || 0;
    if (sx) {
      if (foldY) { const n = Math.floor(y / world.height); y -= n * world.height; x += n * sx; }
      if (foldX) x = mod(x, world.width);
    } else {
      if (foldX) { const n = Math.floor(x / world.width); x -= n * world.width; y += n * sy; }
      if (foldY) y = mod(y, world.height);
    }
    return { x, y };
  }
  function periodicId(world, x, y) { const p = periodicPosition(world, x, y); return p.y * world.width + p.x; }
  function windingOf(world, dx, dy) {
    const width = world.lattice?.width || world.width, height = world.lattice?.height || world.height;
    const sx = world.shiftX || 0, sy = world.shiftY || 0, det = width*height-sx*sy;
    return [(height*dx+sx*dy)/det, (sy*dx+width*dy)/det];
  }
  function deckVector(world, x, y) { return [x * (world.lattice?.width || world.width) - y * (world.shiftX || 0), y * (world.lattice?.height || world.height) - x * (world.shiftY || 0)]; }
  function latticePoint(width,height,sx,sy,x,y,foldX=true,foldY=true) {
    const det=width*height-sx*sy, a=foldX?Math.floor((height*x+sx*y)/det):0, b=foldY?Math.floor((sy*x+width*y)/det):0;
    return {x:x-a*width+b*sx,y:y+a*sy-b*height};
  }
  function validateShift(width, height, shiftX, shiftY) {
    if (![shiftX, shiftY].every(n => Number.isInteger(n) && n % 2 === 0) || Math.abs(shiftX) >= width || Math.abs(shiftY) >= height) throw new Error('ずれは対応する辺の長さ未満の偶数セルで指定してください。');
  }
  function generateGeometry({ width = 31, height = 23, algorithm = 'dfs', seed = 'first-walk', loops = 0, roomCount = 8, roomPlacement = 'bsp', connectionStyle = 'tree', keyDoor = false, birdMode = false, birdCount = 1, teleportPolicy = 'far', separateMaps = false, keyCount = 1, topology = 'plane', loopLearning = false, learningLaps = 5, selfVision = false, shiftX = 0, shiftY = 0, newestBias = 70 } = {}) {
    if (!['plane', 'torus'].includes(topology)) throw new Error('未対応の空間です。');
    const torus = topology === 'torus';
    if (!['far','unseen','known'].includes(teleportPolicy)) throw new Error('転移先の選び方が不正です。');
    if (birdMode && ![1,2].includes(birdCount)) throw new Error('鳥人間は1体または2体を指定してください。');
    if (![width, height].every(n => Number.isInteger(n) && n >= (torus ? 8 : 9) && n <= (torus ? 100 : 101) && n % 2 === (torus ? 0 : 1))) throw new Error(torus ? 'トーラスのサイズは8〜100の偶数にしてください。' : 'サイズは9〜101の奇数にしてください。');
    if (!['dfs', 'prim', 'rooms', 'growing', 'kruskal', 'hunt', 'wilson', 'division', 'eller'].includes(algorithm)) throw new Error('未対応の生成方式です。');
    if (algorithm === 'growing' && (!Number.isFinite(newestBias) || newestBias < 0 || newestBias > 100)) throw new Error('長い道を伸ばす割合は0〜100%にしてください。');
    if (!Number.isFinite(loops) || loops < 0 || loops > 30) throw new Error('ループ率は0〜30%にしてください。');
    if (keyDoor && (!Number.isInteger(keyCount) || keyCount < 1 || keyCount > 3)) throw new Error('鍵の数は1〜3個にしてください。');
    if (torus) {
      if (algorithm === 'eller') throw new Error('Eller法は現在平面専用です。空間を平面に変更してください。');
      if (algorithm === 'division') throw new Error('壁で区切る方式は現在平面専用です。空間を平面に変更してください。');
      validateShift(width, height, shiftX, shiftY);
      if (keyDoor) throw new Error('トーラスの鍵と扉は未対応です。通常探索または鳥人間を選んでください。');
      if (algorithm !== 'rooms') return finishWorld({ ...generateTorus({ width, height, algorithm, seed, loops, shiftX, shiftY, newestBias }), loopLearning, learningLaps, selfVision, birdMode, birdCount, teleportPolicy, separateMaps });
    }
    if (algorithm === 'rooms') {
      if (!Number.isInteger(roomCount) || roomCount < 2 || roomCount > 24) throw new Error('部屋数は2〜24の整数にしてください。');
      if (!['bsp', 'scatter', 'grid'].includes(roomPlacement)) throw new Error('未対応の部屋の配置方式です。');
      if (!['tree', 'chain', 'ring', 'hub'].includes(connectionStyle)) throw new Error('未対応の部屋のつなぎ方です。');
      return finishWorld({ ...generateRooms({ width, height, seed, loops, roomCount, roomPlacement, connectionStyle, topology, shiftX: torus ? shiftX : 0, shiftY: torus ? shiftY : 0 }), loopLearning, learningLaps, selfVision, birdMode, birdCount, teleportPolicy, separateMaps }, keyDoor, keyCount);
    }
    const rng = random(seed), cells = new Uint8Array(width * height), id = (x, y) => y * width + x;
    const neighbors = (x, y) => Object.values(DIRS).map(([dx, dy]) => [x + 2 * dx, y + 2 * dy, x + dx, y + dy]).filter(([a, b]) => a > 0 && a < width - 1 && b > 0 && b < height - 1 && !cells[id(a, b)]);
    cells[id(1, 1)] = 1;
    if (algorithm === 'eller') {
      const cols=(width-1)/2,rows=(height-1)/2;
      let sets=new Array(cols).fill(0),nextSet=1;
      for(let row=0;row<rows;row++) {
        const y=2*row+1,last=row===rows-1;
        for(let x=0;x<cols;x++) { if(!sets[x])sets[x]=nextSet++; cells[id(2*x+1,y)]=1; }
        for(let x=0;x<cols-1;x++) {
          if(sets[x]===sets[x+1] || (!last && rng()>=.5))continue;
          const old=sets[x+1],merged=sets[x];
          cells[id(2*x+2,y)]=1;
          for(let i=0;i<cols;i++)if(sets[i]===old)sets[i]=merged;
        }
        if(last)break;
        const groups=new Map(),next=new Array(cols).fill(0);
        for(let x=0;x<cols;x++) {if(!groups.has(sets[x]))groups.set(sets[x],[]);groups.get(sets[x]).push(x);}
        // Every component must continue downward at least once. Carry its
        // identity to all selected children, avoiding cycles on the next row.
        for(const [group,members] of groups) {
          let exits=members.filter(()=>rng()<.5);
          if(!exits.length)exits=[members[Math.floor(rng()*members.length)]];
          for(const x of exits){cells[id(2*x+1,y+1)]=1;next[x]=group;}
        }
        sets=next;
      }
    } else if (algorithm === 'division') {
      for(let y=1;y<height-1;y++) for(let x=1;x<width-1;x++) cells[id(x,y)]=1;
      const regions=[{x:1,y:1,w:width-2,h:height-2}];
      while(regions.length) {
        const r=regions.pop();
        if(r.w<3 || r.h<3) continue;
        const vertical=r.w===r.h?rng()<.5:r.w>r.h;
        if(vertical) {
          const cut=r.x+1+2*Math.floor(rng()*((r.w-1)/2));
          const door=r.y+2*Math.floor(rng()*((r.h+1)/2));
          for(let y=r.y;y<r.y+r.h;y++) if(y!==door) cells[id(cut,y)]=0;
          regions.push({...r,w:cut-r.x},{...r,x:cut+1,w:r.x+r.w-cut-1});
        } else {
          const cut=r.y+1+2*Math.floor(rng()*((r.h-1)/2));
          const door=r.x+2*Math.floor(rng()*((r.w+1)/2));
          for(let x=r.x;x<r.x+r.w;x++) if(x!==door) cells[id(x,cut)]=0;
          regions.push({...r,h:cut-r.y},{...r,y:cut+1,h:r.y+r.h-cut-1});
        }
      }
    } else if (algorithm === 'dfs' || algorithm === 'growing') {
      const stack = [[1, 1]];
      while (stack.length) {
        const index = algorithm === 'dfs' ? stack.length - 1 : growingIndex(stack.length, newestBias, rng);
        const options = neighbors(...stack[index]);
        if (!options.length) { stack.splice(index, 1); continue; }
        const [x, y, mx, my] = options[Math.floor(rng() * options.length)];
        cells[id(x, y)] = cells[id(mx, my)] = 1; stack.push([x, y]);
      }
    } else if (algorithm === 'hunt' || algorithm === 'wilson') {
      const cols = (width - 1) / 2, rows = (height - 1) / 2;
      const adjacent = from => Object.values(DIRS).map(([dx, dy]) => ({ from, to: from + dx + dy * cols, dx, dy }))
        .filter(step => from % cols + step.dx >= 0 && from % cols + step.dx < cols && Math.floor(from / cols) + step.dy >= 0 && Math.floor(from / cols) + step.dy < rows);
      const buildTree = algorithm === 'wilson' ? wilsonTree : huntTree;
      buildTree(cols * rows, 0, new Uint8Array(cols * rows), adjacent, step => {
        const x = 2 * (step.from % cols) + 1, y = 2 * Math.floor(step.from / cols) + 1;
        cells[id(x + step.dx, y + step.dy)] = cells[id(x + 2 * step.dx, y + 2 * step.dy)] = 1;
      }, rng);
    } else if (algorithm === 'kruskal') {
      const cols = (width - 1) / 2, rows = (height - 1) / 2, edges = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        cells[id(2 * x + 1, 2 * y + 1)] = 1;
        for (const [dx, dy] of [[1, 0], [0, 1]]) if (x + dx < cols && y + dy < rows) {
          edges.push({ a: y * cols + x, b: (y + dy) * cols + x + dx, corridor: id(2 * x + 1 + dx, 2 * y + 1 + dy) });
        }
      }
      for (const edge of kruskalTree(cols * rows, edges, rng)) cells[edge.corridor] = 1;
    } else {
      const frontier = neighbors(1, 1);
      while (frontier.length) {
        const i = Math.floor(rng() * frontier.length), edge = frontier[i];
        frontier[i] = frontier[frontier.length - 1]; frontier.pop();
        const [x, y, mx, my] = edge;
        if (cells[id(x, y)]) continue;
        cells[id(x, y)] = cells[id(mx, my)] = 1; frontier.push(...neighbors(x, y));
      }
    }
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      if ((x + y) % 2 === 1 && !cells[id(x, y)] && rng() < loops / 100) cells[id(x, y)] = 1;
    }
    return finishWorld({ width, height, cells, start: id(1, 1), exit: 0, seed: String(seed), algorithm, birdMode, birdCount, teleportPolicy, separateMaps, ...(algorithm === 'growing' ? { newestBias } : {}) }, keyDoor, keyCount);
  }
  function inspectWarpConnectivity(world) {
    const seen=new Set([world.start]),touched=new Set([world.start]),queue=[world.start];
    for(const from of queue)for(const direction of Object.keys(DIRS)){
      const edge=transition(world,{world_position:from,orientation:1,sheet:0},direction);
      if(!edge)continue;
      touched.add(edge.to);
      const to=world.warps?.get(edge.to)??edge.to;touched.add(to);
      if(!seen.has(to)){seen.add(to);queue.push(to);}
    }
    const incoming=Array.from({length:world.cells.length},()=>[]);
    for(let from=0;from<world.cells.length;from++)if(world.cells[from])for(const direction of Object.keys(DIRS)){
      const edge=transition(world,{world_position:from,orientation:1,sheet:0},direction);
      if(edge)incoming[world.warps?.get(edge.to)??edge.to].push(from);
    }
    const escapes=new Set([world.exit]),back=[world.exit];
    for(const to of back)for(const from of incoming[to]||[])if(!escapes.has(from)){escapes.add(from);back.push(from);}
    return {reachable:touched.size,exitReachable:seen.has(world.exit),canExit:escapes.size};
  }
  function generate(options={}) {
    if(options.warpMode && (options.keyDoor||options.birdMode))
      throw new Error('ワープ床は現在、鳥人間なし・鍵と扉なしで使用できます。');
    const world=generateGeometry(options);
    if(!options.warpMode)return world;
    const style=options.warpStyle||'pair',requested=options.warpCount??1;
    if(!['pair','oneway','cycle3','cycle4'].includes(style)||!Number.isInteger(requested)||requested<1||requested>4)
      throw new Error('ワープの方式または組数が不正です。組数は1〜4です。');
    const candidates=[...world.cells.keys()].filter(id=>world.cells[id]&&id!==world.start&&id!==world.exit);
    const rng=random(world.seed+':warp');
    world.warpMode=true;world.separateMaps=true;world.warpStyle=style;world.requestedWarpCount=requested;world.warpInvisible=!!options.warpInvisible;
    const length=style==='cycle3'?3:style==='cycle4'?4:2;
    let accepted=false;
    for(let count=requested;count>=1&&!accepted;count--)for(let attempt=0;attempt<24&&!accepted;attempt++){
      const used=[],groups=[];world.warps=new Map();
      for(let group=0;group<count;group++){
        const pads=[];
        for(let k=0;k<length;k++){
          const excluded=new Set(used);
          for(const other of used)for(const direction of Object.keys(DIRS)){const edge=transition(world,{world_position:other},direction);if(edge)excluded.add(edge.to);}
          const available=candidates.filter(id=>!excluded.has(id));
          if(!available.length)break;
          let pool=available;
          if(pads.length){
            const distances=reachable(world,pads[pads.length-1]).distances;
            const max=available.reduce((n,id)=>Math.max(n,distances[id]),0);
            pool=available.filter(id=>distances[id]===max);
          }
          const pad=pool[Math.floor(rng()*pool.length)];pads.push(pad);used.push(pad);
        }
        if(pads.length!==length)break;
        groups.push(pads);
        if(style==='oneway')world.warps.set(pads[0],pads[1]);
        else pads.forEach((id,i)=>world.warps.set(id,pads[(i+1)%pads.length]));
      }
      if(groups.length!==count)continue;
      const validation=inspectWarpConnectivity(world);
      if(validation.reachable===world.validation.floors&&validation.canExit===world.validation.floors&&validation.exitReachable){
        world.warpGroups=groups;world.warpCount=count;world.validation.warp=validation;accepted=true;
      }
    }
    if(!accepted)throw new Error('脱出可能なワープ配置が見つかりませんでした。シードや迷路の条件を変えてください。');
    return world;
  }
  // Keep the active cells in insertion order: the last one is the newest.
  // At 100%, consume no extra randomness and reproduce the DFS generator.
  function growingIndex(length, newestBias, rng) {
    return newestBias === 100 || (newestBias > 0 && rng() < newestBias / 100) ? length - 1 : Math.floor(rng() * length);
  }
  // Loop-erased random walks. Attach backward from the existing tree so lifted
  // coordinates are assigned from an already connected parent.
  function wilsonTree(count, start, visited, adjacent, carve, rng) {
    visited[start] = 1;
    const neighbors = Array.from({length:count}, (_,i)=>adjacent(i));
    let walkSteps=0;
    for(let seed=0;seed<count;seed++) {
      if(visited[seed]) continue;
      const nodes=[seed], edges=[], index=new Map([[seed,0]]);
      let current=seed;
      while(!visited[current]) {
        if(++walkSteps>5000000) throw new Error('Wilson法の探索上限に達しました。別のシード、または小さいサイズで生成してください。');
        const options=neighbors[current], step=options[Math.floor(rng()*options.length)];
        const loop=index.get(step.to);
        if(loop!==undefined) {
          for(let i=loop+1;i<nodes.length;i++) index.delete(nodes[i]);
          nodes.length=loop+1;edges.length=loop;
        } else {
          edges.push(step);index.set(step.to,nodes.length);nodes.push(step.to);
        }
        current=step.to;
      }
      for(let i=edges.length-1;i>=0;i--) {
        const step=edges[i], reverse={...step,from:step.to,to:step.from,dx:-step.dx,dy:-step.dy};
        visited[reverse.to]=1;carve(reverse);
      }
    }
  }
  // Walk until blocked, then attach an unvisited cell to the existing tree.
  // Seeded hunt order avoids privileging the displayed top/left seams.
  function huntTree(count, start, visited, adjacent, carve, rng) {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]];
    }
    let current = start, remaining = count - 1; visited[start] = 1;
    while (remaining) {
      let options = adjacent(current).filter(step => !visited[step.to]), chosen;
      if (options.length) chosen = options[Math.floor(rng() * options.length)];
      else {
        for (const candidate of order) {
          if (visited[candidate]) continue;
          options = adjacent(candidate).filter(step => visited[step.to]);
          if (!options.length) continue;
          const back = options[Math.floor(rng() * options.length)];
          chosen = { ...back, from: back.to, to: back.from, dx: -back.dx, dy: -back.dy }; break;
        }
      }
      if (!chosen) throw new Error('生成用グラフが分断されています。');
      visited[chosen.to] = 1; carve(chosen); current = chosen.to; remaining--;
    }
  }
  // Random edge order, then join distinct components. Preserve caller edge order.
  function kruskalTree(count, edges, rng) {
    const order = [...edges], parent = Int32Array.from({ length: count }, (_, i) => i), sizes = new Int32Array(count).fill(1);
    const find = n => { while (parent[n] !== n) { parent[n] = parent[parent[n]]; n = parent[n]; } return n; };
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]];
    }
    const chosen = [];
    for (const edge of order) {
      let a = find(edge.a), b = find(edge.b);
      if (a === b) continue;
      if (sizes[a] < sizes[b]) [a, b] = [b, a];
      parent[b] = a; sizes[a] += sizes[b]; chosen.push(edge);
      if (chosen.length === count - 1) break;
    }
    if (chosen.length !== count - 1) throw new Error('生成用グラフが分断されています。');
    return chosen;
  }
  function finishWorld(world, keyDoor, keyCount) {
    if (world.learningLaps !== undefined && ![3, 5].includes(world.learningLaps)) throw new Error('理解までの周回数は3または5です。');
    const distances = reachable(world, world.start);
    world.exit = distances.farthest;
    world.validation = { reachable: distances.count, floors: world.cells.reduce((a, b) => a + b, 0), distance: distances.distances[world.exit] };
    if (world.validation.reachable !== world.validation.floors) throw new Error('迷路の接続検証に失敗しました。');
    if (world.topology === 'torus') {
      world.validation.topology = inspectTorus(world);
      if (world.validation.topology.index !== 1) throw new Error('トーラスの独立した周回路を検証できませんでした。');
    }
    if (world.demo) { world.exit = -1; world.validation.distance = -1; }
    if (keyDoor) addKeyDoor(world, distances.distances, keyCount);
    return world;
  }
  function latticeInfo(vectors) {
    const nonzero = vectors.filter(([x, y]) => x || y);
    const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
    let index = 0;
    for (let i = 0; i < nonzero.length; i++) for (let j = i + 1; j < nonzero.length; j++) {
      index = gcd(index, Math.abs(nonzero[i][0] * nonzero[j][1] - nonzero[i][1] * nonzero[j][0]));
    }
    return { rank: index ? 2 : nonzero.length ? 1 : 0, index };
  }
  // Periodic logical graph first, raster second: one shared corridor cell per edge.
  // There is no outer-wall special case, nor a second copy of a boundary edge.
  function torusLayout(width,height,shiftX,shiftY) {
    const cols=width/2, rows=height/2, dual=!!(shiftX&&shiftY);
    const logical = { width: cols, height: rows, shiftX: shiftX / 2, shiftY: shiftY / 2 };
    const positions = [];
    if (dual) {
      for(let y=Math.min(0,-logical.shiftY);y<=rows+Math.max(0,-logical.shiftY);y++)
        for(let x=Math.min(0,-logical.shiftX);x<=cols+Math.max(0,-logical.shiftX);x++) {
          const p=latticePoint(cols,rows,logical.shiftX,logical.shiftY,x,y);
          if(p.x===x && p.y===y) positions.push(p);
        }
    } else for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) positions.push({x,y});
    const minX=dual?Math.min(...positions.map(p=>p.x)):0, minY=dual?Math.min(...positions.map(p=>p.y)):0;
    const chart = { width, height, shiftX, shiftY };
    if(dual) {
      chart.lattice={width,height,originX:2*minX,originY:2*minY};
      chart.width=2*(Math.max(...positions.map(p=>p.x))-minX+1);
      chart.height=2*(Math.max(...positions.map(p=>p.y))-minY+1);
    }
    return {chart,positions,minX,minY,logical};
  }
  function generateTorus({ width, height, algorithm, seed, loops, shiftX = 0, shiftY = 0, newestBias = 70 }) {
    const rng = random(seed), dual = !!(shiftX && shiftY);
    const {chart,positions,minX,minY,logical}=torusLayout(width,height,shiftX,shiftY);
    const cols=width/2,rows=height/2,count=positions.length,lookup=new Map(positions.map((p,i)=>[`${p.x},${p.y}`,i]));
    const edges = [], adjacency = Array.from({ length: count }, () => []);
    for (let a=0;a<count;a++) for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const {x,y}=positions[a];
      const p=dual?latticePoint(cols,rows,logical.shiftX,logical.shiftY,x+dx,y+dy):periodicPosition(logical,x+dx,y+dy);
      const b=lookup.get(`${p.x},${p.y}`);
      const edge = { a, b, dx, dy, open: false }; edges.push(edge);
      adjacency[a].push({ edge, from: a, to: b, dx, dy });
      adjacency[b].push({ edge, from: b, to: a, dx: -dx, dy: -dy });
    }
    const start = Math.floor(rng() * count), visited = new Uint8Array(count);
    const liftX = new Int32Array(count), liftY = new Int32Array(count);
    visited[start] = 1; liftX[start] = positions[start].x; liftY[start] = positions[start].y;
    const carve = step => {
      step.edge.open = true; visited[step.to] = 1;
      liftX[step.to] = liftX[step.from] + step.dx; liftY[step.to] = liftY[step.from] + step.dy;
    };
    if (algorithm === 'dfs' || algorithm === 'growing') {
      const stack = [start];
      while (stack.length) {
        const index = algorithm === 'dfs' ? stack.length - 1 : growingIndex(stack.length, newestBias, rng);
        const options = adjacency[stack[index]].filter(step => !visited[step.to]);
        if (!options.length) { stack.splice(index, 1); continue; }
        const step = options[Math.floor(rng() * options.length)]; carve(step); stack.push(step.to);
      }
    } else if (algorithm === 'hunt' || algorithm === 'wilson') {
      const buildTree = algorithm === 'wilson' ? wilsonTree : huntTree;
      buildTree(count, start, visited, id => adjacency[id], carve, rng);
    } else if (algorithm === 'kruskal') {
      for (const edge of kruskalTree(count, edges, rng)) edge.open = true;
      // Components grow independently, so assign consistent lifted coordinates
      // only after the tree is connected, before measuring missing periods.
      const queue = [start];
      for (let i = 0; i < queue.length; i++) for (const step of adjacency[queue[i]]) {
        if (!step.edge.open || visited[step.to]) continue;
        carve(step); queue.push(step.to);
      }
    } else {
      const frontier = [...adjacency[start]];
      while (frontier.length) {
        const index = Math.floor(rng() * frontier.length), step = frontier[index];
        frontier[index] = frontier[frontier.length - 1]; frontier.pop();
        if (visited[step.to]) continue;
        carve(step); frontier.push(...adjacency[step.to].filter(next => !visited[next.to]));
      }
    }
    const remaining = edges.filter(edge => !edge.open);
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    const windings = [];
    for (const edge of remaining) {
      if (latticeInfo(windings).index === 1) break;
      const winding = windingOf(logical, liftX[edge.a] + edge.dx - liftX[edge.b], liftY[edge.a] + edge.dy - liftY[edge.b]);
      if (!winding[0] && !winding[1]) continue;
      edge.open = true; windings.push(winding);
    }
    for (const edge of remaining) if (!edge.open && rng() < loops / 100) edge.open = true;
    const cells = new Uint8Array(chart.width * chart.height), domain = dual ? new Uint8Array(cells.length) : null;
    const raster = node => ({ x:2*(positions[node].x-minX)+1, y:2*(positions[node].y-minY)+1 });
    for (let i=0;i<count;i++) {
      const p=raster(i);cells[p.y*chart.width+p.x]=1;
      if(domain) for(let dy=-1;dy<=0;dy++) for(let dx=-1;dx<=0;dx++) domain[(p.y+dy)*chart.width+p.x+dx]=1;
    }
    for (const edge of edges) if (edge.open) {
      const {x,y}=raster(edge.a); cells[periodicId(chart,x+edge.dx,y+edge.dy)]=1;
    }
    const p=raster(start);
    return { ...chart, ...(domain?{domain}:{}), cells, start: p.y*chart.width+p.x, seed: String(seed), algorithm, topology: 'torus', ...(algorithm === 'growing' ? { newestBias } : {}) };
  }

  // Independent validation on the final traversable raster, not the generator graph.
  function inspectTorus(world) {
    const seen = new Uint8Array(world.cells.length), xs = new Int32Array(world.cells.length), ys = new Int32Array(world.cells.length);
    const queue = [world.start], windings = new Map(); seen[world.start] = 1;
    for (let i = 0; i < queue.length; i++) for (const [direction, [dx, dy]] of Object.entries(DIRS)) {
      const from = queue[i], edge = transition(world, { world_position: from }, direction);
      if (!edge) continue;
      const x = xs[from] + dx, y = ys[from] + dy;
      if (!seen[edge.to]) { seen[edge.to] = 1; xs[edge.to] = x; ys[edge.to] = y; queue.push(edge.to); }
      else {
        const vector = windingOf(world, x - xs[edge.to], y - ys[edge.to]);
        if (vector[0] || vector[1]) windings.set(vector.join(','), vector);
      }
    }
    return { ...latticeInfo([...windings.values()]), vectors: [...windings.values()] };
  }
  function createTorusDemo({ loopLearning = false, learningLaps = 5, selfVision = false, openRoom = false, diagonalRoom = false, shiftX = 0, shiftY = 0 } = {}) {
    const width = 8, height = 8, cells = new Uint8Array(width * height);
    for (let i = 0; i < width; i++) cells[width + i] = 1;
    for (let i = 0; i < height; i++) cells[i * width + 1] = 1;
    validateShift(width, height, shiftX, shiftY);
    if (shiftX && shiftY && !diagonalRoom) {
      const world=generateTorus({width,height,algorithm:'dfs',seed:'dual-optics',loops:0,shiftX,shiftY});
      world.cells=world.domain.slice();
      return finishWorld({...world,algorithm:'demo',demo:true,openRoom:true,loopLearning,learningLaps,selfVision});
    }
    if (openRoom || shiftX || shiftY) cells.fill(1);
    if (diagonalRoom) {
      if (shiftX || shiftY) throw new Error('斜め視認デモはずれなしで開いてください。');
      cells.fill(0);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if ([0,1,7].includes(mod(x-y,8)) || (diagonalRoom === 'crossed' && [0,1,7].includes(mod(x+y-2,8))) || y === 4) cells[y*width+x] = 1;
    }
    return finishWorld({ width, height, cells, diagonalRoom, openRoom: openRoom || !!(shiftX || shiftY), shiftX, shiftY, start: 9, seed: diagonalRoom === 'crossed' ? 'crossed-room' : diagonalRoom ? 'diagonal-room' : openRoom ? 'optics-room' : 'torus-demo', algorithm: 'demo', topology: 'torus', demo: true, loopLearning, learningLaps, selfVision });
  }
  function createArchiveDemo() {
    return {...createTorusDemo({loopLearning:true,learningLaps:3}),archiveDemo:true,separateMaps:true};
  }
  // Iterative low-link DFS: find every cell whose removal separates start from exit.
  // This is linear in the cell graph and avoids a recursive stack on large mazes.
  function exitSeparators(world) {
    const size = world.cells.length, entered = new Int32Array(size).fill(-1), low = new Int32Array(size);
    const parent = new Int32Array(size).fill(-1), containsExit = new Uint8Array(size), dirs = Object.keys(DIRS);
    const stack = [{ id: world.start, next: 0 }], result = [];
    let time = 0; entered[world.start] = low[world.start] = time++;
    containsExit[world.exit] = 1;
    while (stack.length) {
      const frame = stack[stack.length - 1], id = frame.id;
      if (frame.next < dirs.length) {
        const edge = transition(world, { world_position: id }, dirs[frame.next++]);
        if (!edge || edge.to === parent[id]) continue;
        if (entered[edge.to] < 0) {
          parent[edge.to] = id; entered[edge.to] = low[edge.to] = time++;
          stack.push({ id: edge.to, next: 0 });
        } else low[id] = Math.min(low[id], entered[edge.to]);
      } else {
        stack.pop(); const p = parent[id];
        if (p < 0) continue;
        if (containsExit[id] && low[id] >= entered[p] && p !== world.start) result.push(p);
        containsExit[p] |= containsExit[id]; low[p] = Math.min(low[p], low[id]);
      }
    }
    return result;
  }
  function addKeyDoor(world, distances, requestedCount) {
    const endDistance = distances[world.exit];
    const candidates = exitSeparators(world).filter(id => distances[id] >= 2 && endDistance - distances[id] >= 2)
      .sort((a, b) => distances[a] - distances[b]);
    candidates.push(world.exit); // A locked exit always supplies a final fallback stage.
    // Keep at least one non-door cell between stages for the next key. Suffix
    // capacity lets us spread doors out without sacrificing requested stages.
    const next = new Int32Array(candidates.length), capacity = new Int32Array(candidates.length + 1);
    for (let i = 0, j = 0; i < candidates.length; i++) {
      j = Math.max(j, i + 1);
      while (j < candidates.length && distances[candidates[j]] - distances[candidates[i]] < 2) j++;
      next[i] = j;
    }
    for (let i = candidates.length - 1; i >= 0; i--) capacity[i] = Math.max(capacity[i + 1], 1 + capacity[next[i]]);
    const count = Math.min(requestedCount, capacity[0]), doors = [];
    let from = 0;
    for (let stage = 0; stage < count; stage++) {
      const target = endDistance * (stage + 1) / (count + 1);
      let chosen = -1;
      for (let i = from; i < candidates.length; i++) {
        if (capacity[next[i]] < count - stage - 1) continue;
        if (chosen < 0 || Math.abs(distances[candidates[i]] - target) < Math.abs(distances[candidates[chosen]] - target)) chosen = i;
      }
      doors.push(candidates[chosen]); from = next[chosen];
    }
    const locks = [], doorSet = new Set(doors);
    let previousRegion = null;
    for (const door of doors) {
      const region = reachable(world, world.start, door).distances;
      let key = -1;
      for (let id = 0; id < world.cells.length; id++) {
        if (id === world.start || id === world.exit || doorSet.has(id) || region[id] < 0 || (previousRegion && previousRegion[id] >= 0)) continue;
        if (key < 0 || region[id] > region[key]) key = id;
      }
      if (key < 0) throw new Error('順序を保証できる鍵の配置場所がありません。');
      locks.push({ key, door, keyId: String.fromCharCode(65 + locks.length), placement: door === world.exit ? 'exit-door' : 'passage-door' });
      previousRegion = region;
    }
    world.puzzle = { locks, requestedCount };
    const solved = solvePuzzle(world);
    const keyRequired = locks.every(lock => !solvePuzzle(world, true, lock.keyId).solvable);
    world.validation.puzzle = { solvable: solved.solvable, keyRequired, ordered: solved.ordered, distance: solved.distance };
    if (!solved.solvable || !keyRequired || !solved.ordered) throw new Error('鍵と扉の攻略順序の検証に失敗しました。');
  }
  // GameRules wraps geometric transitions; geometry validation remains independent of inventory.
  function ruleTransition(world, state, direction) {
    const edge = transition(world, state, direction);
    const lock = edge && world.puzzle?.locks.find(lock => lock.door === edge.to);
    if (lock && !(state.keys || []).includes(lock.keyId)) return null;
    return edge;
  }
  // BFS over (world cell, key possession). Door opening does not need a separate
  // state here: keys are retained, and an open door always implies possession.
  function solvePuzzle(world, collectKey = true, forbiddenKey = null) {
    const locks = world.puzzle?.locks || [], masks = 1 << locks.length;
    const size = world.cells.length, distances = new Int32Array(size * masks).fill(-1);
    const parents = new Int32Array(size * masks).fill(-1), directions = new Array(size * masks);
    const keySets = Array.from({ length: masks }, (_, mask) => locks.filter((_, i) => mask & (1 << i)).map(lock => lock.keyId));
    const start = world.start * masks, queue = [start]; distances[start] = 0;
    let finish = -1, ordered = true;
    for (let i = 0; i < queue.length; i++) {
      const encoded = queue[i], id = Math.floor(encoded / masks), mask = encoded % masks;
      if (id === world.exit && finish < 0) finish = encoded;
      for (const direction of Object.keys(DIRS)) {
        const edge = ruleTransition(world, { world_position: id, keys: keySets[mask], orientation: 1, sheet: 0 }, direction);
        if (!edge) continue;
        const index = locks.findIndex(lock => lock.key === edge.to);
        let nextMask = mask;
        if (collectKey && index >= 0 && locks[index].keyId !== forbiddenKey) {
          const preceding = (1 << index) - 1;
          if ((mask & preceding) !== preceding) ordered = false;
          nextMask |= 1 << index;
        }
        const next = edge.to * masks + nextMask;
        if (distances[next] >= 0) continue;
        distances[next] = distances[encoded] + 1; parents[next] = encoded; directions[next] = direction; queue.push(next);
      }
    }
    const path = []; let cursor = finish;
    while (cursor >= 0 && parents[cursor] >= 0) { path.push(directions[cursor]); cursor = parents[cursor]; }
    return { solvable: finish >= 0, distance: finish >= 0 ? distances[finish] : -1, path: path.reverse(), ordered };
  }
  // Geometry: BSP partitions leave a one-cell separator, then hold one rectangular room each.
  function generateRooms({ width, height, seed, loops, roomCount, roomPlacement, connectionStyle, topology = 'plane', shiftX = 0, shiftY = 0 }) {
    const rng = random(seed), int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
    const torus = topology === 'torus';
    // The chart seam is movable, not an outer wall. Reserve one separator per period.
    const offsetX = torus ? int(0, width - 1) : 0, offsetY = torus ? int(0, height - 1) : 0;
    const dual=torus && !!(shiftX && shiftY);
    const layout=dual?torusLayout(width,height,shiftX,shiftY):null;
    const chart = layout?layout.chart:{ width, height, shiftX, shiftY };
    if(dual) {
      chart.domain=new Uint8Array(chart.width*chart.height);
      for(const p of layout.positions) for(let dy=0;dy<2;dy++) for(let dx=0;dx<2;dx++)
        chart.domain[(2*(p.y-layout.minY)+dy)*chart.width+2*(p.x-layout.minX)+dx]=1;
    }
    const cellId = (x, y) => periodicId(chart, x + offsetX, y + offsetY);
    const leaves = [{ x: 1, y: 1, w: width - (torus ? 1 : 2), h: height - (torus ? 1 : 2) }];
    while (roomPlacement === 'bsp' && leaves.length < roomCount) {
      let index = -1;
      for (let i = 0; i < leaves.length; i++) {
        const r = leaves[i];
        if ((r.w >= 7 || r.h >= 7) && (index < 0 || r.w * r.h > leaves[index].w * leaves[index].h)) index = i;
      }
      if (index < 0) break;
      const r = leaves[index];
      const vertical = r.w >= 7 && (r.h < 7 || (r.w === r.h ? rng() < .5 : r.w > r.h));
      const span = vertical ? r.w : r.h, cut = int(3, span - 4);
      const children = vertical
        ? [{ ...r, w: cut }, { ...r, x: r.x + cut + 1, w: r.w - cut - 1 }]
        : [{ ...r, h: cut }, { ...r, y: r.y + cut + 1, h: r.h - cut - 1 }];
      leaves.splice(index, 1, ...children);
    }
    let roomGrid = null;
    if (roomPlacement === 'grid') {
      const region = leaves[0], maxCols = Math.floor((region.w+1)/4), maxRows = Math.floor((region.h+1)/4);
      // Leave some empty districts when space permits. Prefer compact districts,
      // while limiting surplus slots so narrow maps remain useful.
      const target = Math.min(maxCols*maxRows, Math.ceil(roomCount*1.25));
      let best = Infinity, cols = 1, rows = 1;
      for(let c=1;c<=maxCols;c++) for(let r=1;r<=maxRows;r++) {
        if(c*r<target) continue;
        const score = c*r-target + Math.abs(Math.log(((region.w+1)/c)/((region.h+1)/r)));
        if(score<best){best=score;cols=c;rows=r;}
      }
      const slots = [];
      for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
        const x=Math.floor((region.w+1)*col/cols), y=Math.floor((region.h+1)*row/rows);
        slots.push({x:region.x+x,y:region.y+y,w:Math.floor((region.w+1)*(col+1)/cols)-x-1,h:Math.floor((region.h+1)*(row+1)/rows)-y-1});
      }
      const order = slots.map((_,i)=>i);
      for(let i=order.length-1;i>0;i--){const j=int(0,i);[order[i],order[j]]=[order[j],order[i]];}
      const selected = new Set(order.slice(0,roomCount));
      leaves.splice(0,leaves.length,...slots.filter((_,i)=>selected.has(i)));
      roomGrid={columns:cols,rows,slots:slots.length,selected:leaves.length};
    }
    const cells = new Uint8Array(chart.width * chart.height), rooms=[], reserved=new Set();
    const placements = roomPlacement === 'scatter' ? Array(roomCount * 40).fill(leaves[0]) : leaves;
    const checkOverlap = dual || roomPlacement !== 'bsp';
    for (const r of placements) {
      if (rooms.length >= roomCount) break;
      const initialW=int(3,Math.min(9,r.w)),initialH=int(3,Math.min(9,r.h));
      const x=int(r.x,r.x+r.w-initialW),y=int(r.y,r.y+r.h-initialH);
      let w=initialW,h=initialH,footprint;
      while(true) {
        footprint=[];
        for(let dy=0;dy<h;dy++) for(let dx=0;dx<w;dx++) footprint.push(cellId(x+dx,y+dy));
        if(!checkOverlap || (new Set(footprint).size===footprint.length && footprint.every(id=>!reserved.has(id)))) break;
        // A short period may identify opposite corners of a 3x3 room.
        // Keep a genuine rectangle in the covering grid, down to 2x2.
        const minimum = dual ? 2 : 3;
        if(w===minimum && h===minimum){footprint=null;break;}
        if(w>=h && w>minimum) w--; else h--;
      }
      if(!footprint) continue;
      for(const id of footprint) cells[id]=1;
      if(checkOverlap) for(let dy=-1;dy<=h;dy++) for(let dx=-1;dx<=w;dx++) reserved.add(cellId(x+dx,y+dy));
      rooms.push({id:rooms.length,x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)});
    }
    // Room-connection planning is separate from corridor carving and from the actual cell graph.
    const candidates = [];
    for (let a = 0; a < rooms.length; a++) for (let b = a + 1; b < rooms.length; b++) {
      for (const tx of torus ? [-1, 0, 1] : [0]) for (const ty of torus ? [-1, 0, 1] : [0]) {
        const [vx, vy] = deckVector(chart, tx, ty);
        const dx = rooms[b].cx + vx - rooms[a].cx, dy = rooms[b].cy + vy - rooms[a].cy;
        candidates.push({ a, b, dx, dy, distance: Math.abs(dx) + Math.abs(dy) });
      }
    }
    // Self-image edges also handle a single-room partition at small sizes.
    if (torus) for (const room of rooms) for (const [dx, dy] of [deckVector(chart, 1, 0), deckVector(chart, 0, 1)]) candidates.push({ a: room.id, b: room.id, dx, dy, distance: Math.abs(dx) + Math.abs(dy) });
    candidates.sort((a, b) => a.distance - b.distance || a.a - b.a || a.b - b.b);
    const parent = rooms.map(r => r.id), find = i => { while (parent[i] !== i) i = parent[i]; return i; };
    const connections = [], chosen = new Set();
    const addTree = edge => { chosen.add(edge); connections.push({ ...edge, kind: 'tree' }); };
    const between = (a, b) => candidates.find(e => e.a === Math.min(a,b) && e.b === Math.max(a,b));
    if (connectionStyle === 'tree') {
      for (const edge of candidates) {
        const a = find(edge.a), b = find(edge.b);
        if (a === b) continue;
        parent[a] = b; addTree(edge);
      }
    } else {
      for (let b = 1; b < rooms.length; b++) addTree(between(connectionStyle === 'hub' ? 0 : b-1, b));
    }
    // Reserve the ring closure separately: the lift used below must remain a tree.
    const ring = connectionStyle === 'ring' && rooms.length >= 3 ? between(0, rooms.length-1) : null;
    if (ring) chosen.add(ring);
    if (torus) {
      // Lift the tree into the plane, then select short edges that complete its winding lattice.
      const lifts = new Map([[0, [0, 0]]]), queue = [0];
      for (let i = 0; i < queue.length; i++) for (const edge of connections) {
        const from = queue[i], sign = edge.a === from ? 1 : edge.b === from ? -1 : 0;
        if (!sign) continue;
        const to = sign === 1 ? edge.b : edge.a;
        if (lifts.has(to)) continue;
        const [x, y] = lifts.get(from); lifts.set(to, [x + sign * edge.dx, y + sign * edge.dy]); queue.push(to);
      }
      const windings = [];
      for (const edge of candidates) {
        if (latticeInfo(windings).index === 1) break;
        if (chosen.has(edge)) continue;
        const a = lifts.get(edge.a), b = lifts.get(edge.b);
        const winding = windingOf(chart, a[0] + edge.dx - b[0], a[1] + edge.dy - b[1]);
        if (!winding[0] && !winding[1]) continue;
        const current = latticeInfo(windings), next = latticeInfo([...windings, winding]);
        if (current.rank === 2 && next.index === current.index) continue;
        if (current.rank === 1 && next.rank === 1) {
          const first = windings[0], axis = first[0] ? 0 : 1;
          if (Number.isInteger(winding[axis] / first[axis])) continue;
        }
        windings.push(winding); chosen.add(edge); connections.push({ ...edge, kind: 'winding' });
      }
    }
    if (ring) connections.push({ ...ring, kind: 'ring' });
    // Consider at most each room's three closest neighbors, so extra corridors stay sparse.
    const nearby = new Set();
    for (const room of rooms) for (const edge of candidates.filter(e => e.a === room.id || e.b === room.id).slice(0, 3)) nearby.add(edge);
    const carve = edge => {
      let { cx: x, cy: y } = rooms[edge.a];
      const target = { cx: x + edge.dx, cy: y + edge.dy }, horizontalFirst = rng() < .5;
      const path = [cellId(x, y)];
      const walkX = () => { while (x !== target.cx) { x += Math.sign(target.cx - x); path.push(cellId(x, y)); } };
      const walkY = () => { while (y !== target.cy) { y += Math.sign(target.cy - y); path.push(cellId(x, y)); } };
      if (horizontalFirst) { walkX(); walkY(); } else { walkY(); walkX(); }
      for (const id of path) cells[id] = 1;
      edge.path = path;
    };
    for (const edge of connections) carve(edge);
    // Keep base rooms/tree corridors unchanged when only the extra-connection probability changes.
    const extraRng = random(String(seed) + ':extra-connections');
    for (const edge of candidates) if (nearby.has(edge) && !chosen.has(edge) && extraRng() < loops / 100) {
      const extra = { ...edge, kind: 'extra' }; carve(extra); connections.push(extra);
    }
    const start = cellId(rooms[0].cx, rooms[0].cy);
    for (const room of rooms) {
      const origin = periodicPosition(chart, room.x + offsetX, room.y + offsetY), center = periodicPosition(chart, room.cx + offsetX, room.cy + offsetY);
      Object.assign(room, origin, { cx: center.x, cy: center.y });
    }
    return { ...chart, cells, start, exit: 0, seed: String(seed), algorithm: 'rooms', topology, rooms, connections, roomPlacement, roomGrid, connectionStyle, requestedRoomCount: roomCount };
  }
  // Topology boundary: future connections return transformed direction, orientation and sheet here.
  function transition(world, state, direction) {
    const delta = DIRS[direction];
    if (!delta) return null;
    let x = state.world_position % world.width + delta[0], y = Math.floor(state.world_position / world.width) + delta[1];
    let wrapX = x < 0 ? -1 : x >= world.width ? 1 : 0, wrapY = y < 0 ? -1 : y >= world.height ? 1 : 0;
    if(world.lattice) { const p=periodicPosition(world,x,y); [wrapX,wrapY]=windingOf(world,x-p.x,y-p.y); }
    if (world.topology === 'torus') ({ x, y } = periodicPosition(world, x, y));
    if (x < 0 || y < 0 || x >= world.width || y >= world.height || !world.cells[y * world.width + x]) return null;
    return { from: state.world_position, to: y * world.width + x, direction, orientation: state.orientation, sheet: state.sheet, kind: wrapX || wrapY ? 'wrap' : 'ordinary', wrapX, wrapY };
  }
  function reachable(world, start, blocked = -1) {
    const distances = new Int32Array(world.cells.length).fill(-1), queue = [start]; distances[start] = 0;
    for (let i = 0; i < queue.length; i++) for (const direction of Object.keys(DIRS)) {
      const edge = transition(world, { world_position: queue[i], orientation: 1, sheet: 0 }, direction);
      if (edge && !(blocked instanceof Set ? blocked.has(edge.to) : edge.to === blocked) && distances[edge.to] < 0) { distances[edge.to] = distances[edge.from] + 1; queue.push(edge.to); }
    }
    return { count: queue.length, farthest: queue[queue.length - 1], distances };
  }
  // Supercover line traversal: walls are visible, cells behind them are not.
  function lineOfSight(world, from, to, opaque = new Set()) {
    return traceLine(from % world.width, Math.floor(from / world.width), to % world.width, Math.floor(to / world.width), (a, b) => !world.cells[b * world.width + a] || opaque.has(b * world.width + a));
  }
  function traceLine(x, y, tx, ty, wall) {
    const nx = Math.abs(tx - x), ny = Math.abs(ty - y), sx = Math.sign(tx - x), sy = Math.sign(ty - y);
    let ix = 0, iy = 0;
    while (ix < nx || iy < ny) {
      const decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx;
      if (decision === 0) {
        if (wall(x + sx, y) || wall(x, y + sy)) return false;
        x += sx; y += sy; ix++; iy++;
      } else if (decision < 0) { x += sx; ix++; } else { y += sy; iy++; }
      if (x === tx && y === ty) return true;
      if (wall(x, y)) return false;
    }
    return true;
  }
  function createGame(world) {
    const game = { world, archiveNotes: new Map(), markers: new Map(), markerNames: new Map(), player: { world_position: world.start, perceived_position: 'C' + world.start, direction: 'down', orientation: 1, sheet: 0, keys: [] }, cognition: { archives: [], matchedArchives: new Set(), memory_nodes: new Map(), visible_cells: new Set(), known_loops: new Set() }, steps: 0, turns: 0, won: false, lastTransition: null, openedDoors: new Set(), lastEvent: null, eventKeyId: null };
    game.player.perceived_x = world.start % world.width; game.player.perceived_y = Math.floor(world.start / world.width);
    game.player.perceived_position = cognitiveId(world, game.player.perceived_x, game.player.perceived_y);
    game.cognition.knowledgeSources = { x: null, y: null };
    game.inferredRecognized = [];
    game.cognition.compositeLoops = new Map();
    game.cognition.knowledgeBasis = null;
    game.cognition.loopProgress = { x: 0, y: 0 };
    game.cognition.lastAward = { x: 0, y: 0 };
    game.cognition.loopVisits = new Map([[world.start, { x: game.player.perceived_x, y: game.player.perceived_y, step: 0 }]]);
    game.lastLoopEvent = null;
    if (world.birdMode) {
      const distances = reachable(world,world.start).distances;
      const features = new Set((world.puzzle?.locks || []).flatMap(lock=>[lock.key,lock.door]));
      const candidates = [...world.cells.keys()].filter(id=>world.cells[id] && id!==world.start && id!==world.exit && !features.has(id));
      if (!candidates.length) throw new Error('鳥人間を置ける通常の床がありません。');
      const far = candidates.filter(id=>distances[id]>=8);
      game.birdRandom = random(world.seed+':bird');
      const pool = far.length ? far : candidates.sort((a,b)=>distances[b]-distances[a]).slice(0,1);
      game.bird = {position:pool[Math.floor(game.birdRandom()*pool.length)],state:'WANDER',lastSeen:null,searchLeft:0,previous:null,cooldown:0};
      game.bird.symbol='V';game.birds=[game.bird];
      // Keep small mazes focused on exploration. Only add a second bird when
      // at least 150 floor cells and a distinct spawn location are available.
      if(world.birdCount===2 && world.cells.reduce((a,b)=>a+b,0)>=150) {
        const distanceFromFirst=reachable(world,game.bird.position).distances;
        const remaining=candidates.filter(id=>id!==game.bird.position);
        const separated=remaining.filter(id=>distances[id]>=8&&distanceFromFirst[id]>=8);
        const secondPool=separated.length?separated:remaining;
        if(secondPool.length)game.birds.push({position:secondPool[Math.floor(game.birdRandom()*secondPool.length)],symbol:'W',state:'WANDER',lastSeen:null,searchLeft:0,previous:null,cooldown:0});
      }
      game.teleports = 0;
    }
    if(world.archiveDemo){
      // Build the teaching archive through the same observation and walking rules.
      const past=createGame({...world,archiveDemo:false,loopLearning:false});
      for(let i=0;i<8;i++)move(past,'right');
      game.cognition.archives.push({nodes:past.cognition.memory_nodes,step:8,turn:8});
    }
    observe(game); return game;
  }
  function cognitiveId(world, x, y) { return world.topology === 'torus' || world.rotatingWarp ? `C${x},${y}` : 'C' + (y * world.width + x); }
  function cognitivePosition(game, x = game.player.perceived_x, y = game.player.perceived_y) {
    if (game.cognition.knowledgeBasis) return reduceKnowledge(game.cognition.knowledgeBasis, x, y);
    return periodicPosition(game.world, x, y, game.cognition.known_loops.has('x'), game.cognition.known_loops.has('y'));
  }
  // Render lifted copies of known memories, without revealing unobserved terrain.
  function subjectiveCells(game, bounds) {
    const result = [], { cognition, world } = game;
    for (let y = bounds.minY; y <= bounds.maxY; y++) for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const p = cognitivePosition(game, x, y), id = cognitiveId(world, p.x, p.y);
      const node = cognition.memory_nodes.get(id);
      if (!node) continue;
      result.push({ ...node, x, y, visible: cognition.visible_positions.has(`C${x},${y}`), familiar: (cognition.known_loops.size > 0 || cognition.knowledgeBasis) && node.firstSeen < game.steps });
    }
    return result;
  }
  const gcdInt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  function bezout(a, b) {
    let r = Math.abs(a), t = Math.abs(b), x = 1, xx = 0, y = 0, yy = 1;
    while (t) { const q = Math.floor(r / t); [r,t] = [t,r-q*t]; [x,xx] = [xx,x-q*xx]; [y,yy] = [yy,y-q*yy]; }
    return [r, a < 0 ? -x : x, b < 0 ? -y : y];
  }
  // Integer lattice generated only by actually learned translations. In particular,
  // learning (4,1) never grants (1,0) or (0,1), nor do we divide out repetitions.
  function rebuildKnowledge(game) {
    const c = game.cognition;
    const composite = [...c.compositeLoops.values()].filter(v => v.recognized);
    if (!composite.length && (!game.world.lattice || !c.known_loops.size)) { c.knowledgeBasis = null; return; }
    const vectors = composite.map(v => deckVector(game.world, ...v.winding));
    if (c.known_loops.has('x')) vectors.push(deckVector(game.world, 1, 0));
    if (c.known_loops.has('y')) vectors.push(deckVector(game.world, 0, 1));
    let determinant = 0;
    for (const a of vectors) for (const b of vectors) determinant = gcdInt(determinant, a[0]*b[1]-a[1]*b[0]);
    if (!determinant) {
      const first = vectors[0], d = gcdInt(...first), p = first.map(n => n/d);
      if ((p[0] || p[1]) < 0) { p[0] *= -1; p[1] *= -1; }
      const axis = p[0] ? 0 : 1;
      const multiple = vectors.reduce((g, v) => gcdInt(g, v[axis]/p[axis]), 0);
      c.knowledgeBasis = { rank: 1, x: p[0]*multiple, y: p[1]*multiple };
    } else {
      let cy = 0, bx = 0;
      for (const [x,y] of vectors) { const [g,a,b] = bezout(cy,y); bx = a*bx+b*x; cy = g; }
      const ax = determinant/cy;
      c.knowledgeBasis = { rank: 2, x: ax, y: cy, offset: mod(bx,ax) };
    }
    // A basic period is justified only if it belongs to the learned integer
    // lattice. Two independent vectors alone need not generate every period.
    for (const axis of ['x', 'y']) {
      if (c.known_loops.has(axis)) continue;
      const vector = deckVector(game.world, axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0);
      const remainder = reduceKnowledge(c.knowledgeBasis, ...vector);
      if (remainder.x === 0 && remainder.y === 0) {
        c.known_loops.add(axis); c.knowledgeSources[axis] = 'inference';
        game.inferredRecognized.push(axis);
      }
    }
  }
  function knowledgeSummary(game) {
    const c = game.cognition, vectors = [...c.compositeLoops.values()].filter(v => v.recognized).map(v => [...v.winding]);
    if (c.known_loops.has('x')) vectors.push([1,0]);
    if (c.known_loops.has('y')) vectors.push([0,1]);
    const { rank, index } = latticeInfo(vectors);
    return { rank, index: rank === 2 ? index : null, complete: index === 1, vectors };
  }
  function reduceKnowledge(basis, x, y) {
    if (basis.rank === 1) { const n = Math.floor(basis.x ? x/basis.x : y/basis.y); return { x:x-n*basis.x, y:y-n*basis.y }; }
    const n = Math.floor(y/basis.y); return { x:mod(x-n*basis.offset,basis.x), y:y-n*basis.y };
  }
  function learnLoop(game) {
    const { world, player, cognition } = game;
    if (world.topology !== 'torus' || !world.loopLearning) return;
    const previous = cognition.loopVisits.get(player.world_position);
    if (previous) {
      const [wx, wy] = windingOf(world, player.perceived_x - previous.x, player.perceived_y - previous.y);
      // Zero winding is a local detour. Nonzero mixed/multiple windings are
      // learned as their own translation, independently of the basic axes.
      const axis = Math.abs(wx) === 1 && wy === 0 ? 'x' : Math.abs(wy) === 1 && wx === 0 ? 'y' : null;
      if (axis && !cognition.known_loops.has(axis) && previous.step >= cognition.lastAward[axis]) {
        cognition.lastAward[axis] = game.steps;
        const count = ++cognition.loopProgress[axis], recognized = count === (world.learningLaps ?? 5);
        game.lastLoopEvent = { axis, count, recognized };
        if (recognized) {
          cognition.known_loops.add(axis); cognition.knowledgeSources[axis] = 'walk';
          mergeMemories(game);
        }
      } else if (!axis && (wx || wy)) {
        const sign = (wx || wy) < 0 ? -1 : 1, winding = [wx*sign, wy*sign], key = winding.join(',');
        let entry = cognition.compositeLoops.get(key);
        if (!entry) { entry = { winding, count: 0, lastAward: 0, recognized: false }; cognition.compositeLoops.set(key, entry); }
        if (!entry.recognized && previous.step >= entry.lastAward) {
          entry.lastAward = game.steps; entry.count++;
          entry.recognized = entry.count >= (world.learningLaps ?? 5);
          game.lastLoopEvent = { axis: 'composite', winding, count: entry.count, recognized: entry.recognized };
          if (entry.recognized) mergeMemories(game);
        }
      }
    }
    cognition.loopVisits.set(player.world_position, { x: player.perceived_x, y: player.perceived_y, step: game.steps });
  }
  function mergeMemories(game) {
    rebuildKnowledge(game);
    const { world, cognition } = game;
    const merged = new Map();
    for (const node of cognition.memory_nodes.values()) {
      const { x, y } = cognitivePosition(game, node.x, node.y), id = cognitiveId(world, x, y);
      const old = merged.get(id);
      const latest = !old || old.seenAt <= node.seenAt ? node : old;
      merged.set(id, { ...latest, x, y, firstSeen: Math.min(old?.firstSeen ?? Infinity, node.firstSeen) });
    }
    cognition.memory_nodes = merged;
  }
  // Periodic self-images share the terrain supercover sight test, capped at 12 cells.
  // The observer is transparent; a wall stops the ray before a self-image.
  function observeSelf(game, radius) {
    const { world, player, cognition } = game;
    cognition.self_images = [];
    game.selfRecognized = [];
    if (world.topology !== 'torus' || !world.selfVision) return;
    const cx = player.perceived_x, cy = player.perceived_y;
    const wall = (x, y) => !world.cells[periodicId(world, x, y)];
    // Enumerate deck translations inside the same circular horizon as terrain FOV.
    const width=world.lattice?.width || world.width, height=world.lattice?.height || world.height;
    const det=width*height-(world.shiftX||0)*(world.shiftY||0);
    const nx=Math.ceil(radius*(height+Math.abs(world.shiftX||0))/det);
    const ny=Math.ceil(radius*(width+Math.abs(world.shiftY||0))/det);
    for (let wy = -ny; wy <= ny; wy++) {
      for (let wx = -nx; wx <= nx; wx++) {
        if (!wx && !wy) continue;
        const [dx, dy] = deckVector(world, wx, wy), distance = Math.hypot(dx, dy);
        if (distance > radius || !traceLine(cx, cy, cx + dx, cy + dy, wall)) continue;
        const axis = wy === 0 ? 'x' : wx === 0 ? 'y' : null;
        cognition.self_images.push({ x: cx + dx, y: cy + dy, distance, axis, winding: [wx, wy] });
        // A mixed winding proves only that composite route, not either basic axis.
        if (axis && world.loopLearning && !cognition.known_loops.has(axis)) {
          cognition.known_loops.add(axis); cognition.knowledgeSources[axis] = 'vision'; game.selfRecognized.push(axis);
        } else if (!axis && world.loopLearning) {
          const sign = (wx || wy) < 0 ? -1 : 1, winding = [wx*sign, wy*sign], key = winding.join(',');
          const old = cognition.compositeLoops.get(key);
          if (!old?.recognized) {
            cognition.compositeLoops.set(key, { winding, count: old?.count || 0, lastAward: game.steps, recognized: true, source: 'vision' });
            game.selfRecognized.push(`複合（横${winding[0]}・縦${winding[1]}）`);
          }
        }
      }
    }
    if (game.selfRecognized.length) {
      mergeMemories(game);
      const p = cognitivePosition(game);
      player.perceived_position = cognitiveId(world, p.x, p.y);
    }
  }
  // Split an observed ray at cell boundaries before projection. This prevents
  // false diagonals across the map when a seam translates to the opposite edge.
  function selfRaySegments(game, image, space = 'continuous') {
    if (!game.cognition.self_images.includes(image)) return [];
    const x = game.player.perceived_x, y = game.player.perceived_y;
    const dx = image.x - x, dy = image.y - y;
    if (space === 'continuous') return [{ from: { x, y }, to: { x: image.x, y: image.y } }];
    const cuts = new Set([0, 1]);
    for (const delta of [dx, dy]) for (let i = 0; i < Math.abs(delta); i++) cuts.add((i + .5) / Math.abs(delta));
    const times = [...cuts].sort((a, b) => a - b), segments = [];
    for (let i = 1; i < times.length; i++) {
      const a = times[i - 1], b = times[i], t = (a + b) / 2;
      const cx = Math.floor(x + dx * t + .5), cy = Math.floor(y + dy * t + .5);
      const p = space === 'truth' ? periodicPosition(game.world, cx, cy) : cognitivePosition(game, cx, cy);
      const point = u => ({ x: p.x + x + dx * u - cx, y: p.y + y + dy * u - cy });
      segments.push({ from: point(a), to: point(b) });
    }
    return segments;
  }
  function observe(game, radius = game.world.selfVision && game.world.topology === 'torus' ? 12 : 7) {
    observeSelf(game, Math.min(radius, 12));
    const { world, player, cognition } = game, px = player.world_position % world.width, py = Math.floor(player.world_position / world.width);
    cognition.visible_cells.clear();
    cognition.visible_positions = new Set();
    const opaque = closedDoors(game);
    if (world.topology === 'torus') {
      const cx = player.perceived_x, cy = player.perceived_y;
      const worldId = (x, y) => periodicId(world, x, y);
      const wall = (x, y) => !world.cells[worldId(x, y)] || opaque.has(worldId(x, y));
      for (let y = cy - radius; y <= cy + radius; y++) for (let x = cx - radius; x <= cx + radius; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2 || !traceLine(cx, cy, x, y, wall)) continue;
        const position = cognitivePosition(game, x, y);
        const world_id = worldId(x, y), id = cognitiveId(world, position.x, position.y);
        cognition.visible_cells.add(id);
        cognition.visible_positions.add(`C${x},${y}`);
        cognition.memory_nodes.set(id, { world_id, ...position, terrain: world.cells[world_id], feature: featureAt(game, world_id), firstSeen: cognition.memory_nodes.get(id)?.firstSeen ?? game.steps, seenAt: game.steps });
      }
      return;
    }
    for (let y = Math.max(0, py - radius); y <= Math.min(world.height - 1, py + radius); y++) for (let x = Math.max(0, px - radius); x <= Math.min(world.width - 1, px + radius); x++) {
      const world_id = y * world.width + x;
      if ((x - px) ** 2 + (y - py) ** 2 > radius ** 2 || !lineOfSight(world, player.world_position, world_id, opaque)) continue;
      const cognitive_id = cognitiveId(world,x,y);
      cognition.visible_cells.add(cognitive_id);
      cognition.memory_nodes.set(cognitive_id, { world_id, x, y, terrain: world.cells[world_id], feature: featureAt(game, world_id) });
    }
  }
  function createWarpDemo() {
    const width=17,height=9,cells=new Uint8Array(width*height);
    for(let y=1;y<8;y++)for(let x=1;x<16;x++)if(x<=5||x>=11||y===4)cells[y*width+x]=1;
    const world=finishWorld({width,height,cells,start:18,seed:'warp-room',algorithm:'warp',topology:'plane',warpDemo:true,separateMaps:true});
    world.warps=new Map([[54,64],[64,54]]);
    return world;
  }
  function exportTrueMap(game) {
    const {world,player}=game, birds=new Map();
    for(const bird of game.birds||[])if(!birds.has(bird.position))birds.set(bird.position,bird.symbol);
    const rows=[];
    for(let y=0;y<world.height;y++){
      let row='';
      for(let x=0;x<world.width;x++){
        const id=y*world.width+x;
        row+=world.domain&&!world.domain[id] ? ' ' : id===player.world_position ? '@'
          : birds.get(id)||featureAt(game,id)||(world.cells[id]?'.':'#');
      }
      rows.push(row);
    }
    return rows.join('\n');
  }
  function archiveTransfers(game) {
    return game.cognition.archives.flatMap((archive,index)=>archive.transferKind ? [{
      from:index,to:index+1,turn:archive.turn,kind:archive.transferKind,
      label:archive.transferKind==='warp'?'ワープ床':archive.transferKind==='bird'?'鳥人間との接触':'突然の転移'
    }] : []);
  }
  function warpArrowRecords(game){
    const labels=new Map();
    const label=id=>{if(!labels.has(id))labels.set(id,`地点${labels.size+1}`);return labels.get(id);};
    return (game.warpArrows||[]).map((a,i)=>({number:i+1,from:label(a.from),to:label(a.to),status:{hypothesis:'予想（未確認）',confirmed:'実際のワープと一致',contradicted:'ワープ先が不一致'}[a.status],curve:Object.hasOwn(a,'curve')?(a.curve===0?'直線':`調整済み ${a.curve}`):'標準（自動）'}));
  }
  function exportWarpArrowNotes(game){
    const records=warpArrowRecords(game);
    return ['--- 手動で記入したワープの矢印 ---',...(records.length?records.map(a=>`矢印 ${a.number}: ${a.from} → ${a.to} / ${a.status} / 曲がり: ${a.curve}`):['（矢印なし）']),
      '地点番号は現在の矢印一覧内の端点ラベルです。床の0・番号付き目印とは別で、矢印の削除後は番号が変わることがあります。',
      '予想は実際の接続を保証しません。逆方向は別の矢印です。真世界の座標や未記入のワープ先は含めません。'].join('\n');
  }
  function exportArchiveNotes(game) {
    const w=game.world;
    const lines=['迷路のアトリエ — 地図帳のメモ',
      `シード: ${w.seed}`, `生成方式: ${w.algorithm}`,
      `空間: ${w.topology==='torus'?'トーラス':'平面'} / ${w.width} × ${w.height}`,
      `境界のずれ: 横 ${w.shiftX||0} / 縦 ${w.shiftY||0}`,
      `現在の行動数: ${game.turns}`, `保存地図帳: ${game.cognition.archives.length}冊`,
      'これはメモの書き出しです。地形やゲームの進行を復元するセーブデータではありません。',''];
    game.cognition.archives.forEach((archive,index)=>{
      const nodes=[...archive.nodes.values()];
      const labels=[...new Set(nodes.filter(n=>/^[1-9]$/.test(n.feature)).map(n=>n.feature))].sort();
      lines.push(`--- 地図帳 ${index+1} ---`, `${archive.turn}行動目まで / ${game.cognition.matchedArchives.has(index)?'照合済み':'位置関係は未同定'}`,
        `記録した床: ${nodes.filter(n=>n.terrain).length}セル（当時の重複を含む）`,
        `記録した目印: ${labels.length?labels.map(label=>markerTitle(game,label)).join(' / '):'なし'}`,
        'メモ:',game.archiveNotes.get(index)||'（メモなし）','');
    });
    if(game.warpArrows?.length)lines.push(exportWarpArrowNotes(game),'');
    const transfers=archiveTransfers(game);
    if(transfers.length)lines.push('--- 経験した転移 ---',...transfers.map(t=>`${t.turn}行動目：記録 ${t.from+1} → 記録 ${t.to+1}${t.to===game.cognition.archives.length?'（現在の探索）':''} / ${t.label}`),'転移の履歴は、場所の同一性や逆方向の接続を証明するものではありません。');
    return lines.join('\n');
  }
  function setArchiveNote(game,index,text) {
    if(!Number.isInteger(index) || !game.cognition.archives[index] || typeof text!=='string' || text.length>200)return false;
    if(text)game.archiveNotes.set(index,text);else game.archiveNotes.delete(index);
    return true;
  }
  function markerTitle(game,label) {
    const name=game.markerNames.get(label);
    return `目印 ${label}${name ? `「${name}」` : ''}`;
  }
  function nameMarker(game,label,name) {
    if(![...game.markers.values()].includes(label) || typeof name!=='string')return false;
    const clean=name.trim();
    if([...clean].length>24 || /[\r\n\u0000-\u001f]/.test(clean))return false;
    if(clean)game.markerNames.set(label,clean);else game.markerNames.delete(label);
    return true;
  }
  function placeMarker(game) {
    const id=game.player.world_position;
    if(game.won)return {status:'won'};
    if(game.markers.has(id))return {status:'existing',label:game.markers.get(id)};
    const feature= game.world.warps?.has(id) || id===game.world.start || id===game.world.exit ||
      (game.world.puzzle?.locks||[]).some(lock=>lock.key===id || lock.door===id);
    if(feature || !game.world.cells[id])return {status:'blocked'};
    if(game.markers.size>=9)return {status:'full'};
    const label=String(game.markers.size+1);game.markers.set(id,label);
    // Only presently observed images receive the mark; never rewrite old notebooks.
    for(const key of game.cognition.visible_cells){
      const node=game.cognition.memory_nodes.get(key);
      if(node?.world_id===id)game.cognition.memory_nodes.set(key,{...node,feature:label});
    }
    return {status:'placed',label};
  }
  function rememberWarpArrow(game,from,to) {
    if(game.won||!game.world.warps?.size||from===to)return false;
    const known=new Set([...game.cognition.memory_nodes.values(),...game.cognition.archives.flatMap(a=>[...a.nodes.values()])].filter(n=>n.terrain).map(n=>n.world_id));
    if(!Number.isInteger(from)||!Number.isInteger(to)||!known.has(from)||!known.has(to))return false;
    if(!game.warpArrows)game.warpArrows=[];
    const old=game.warpArrows.find(a=>a.from===from&&a.to===to);
    if(old)return true;
    if(game.warpArrows.length>=100)return false;
    game.warpArrows.push({from,to,status:'hypothesis'});return true;
  }
  function resetWarpArrowCurve(game,from,to){
    const arrow=game.warpArrows?.find(a=>a.from===from&&a.to===to);if(!arrow)return false;
    delete arrow.curve;return true;
  }
  function curveWarpArrow(game,from,to,curve){
    if(!Number.isFinite(curve)||Math.abs(curve)>3)return false;
    const arrow=game.warpArrows?.find(a=>a.from===from&&a.to===to);if(!arrow)return false;
    arrow.curve=Math.round(curve*1000)/1000;return true;
  }
  function eraseWarpArrow(game,from,to){
    if(game.won||!game.warpArrows)return false;
    const index=game.warpArrows.findIndex(a=>a.from===from&&a.to===to);
    if(index<0)return false;
    game.warpArrows.splice(index,1);return true;
  }
  function knownWarpAnchor(game,node){
    return game.warpArrows?.some(a=>a.status==='confirmed'&&(a.from===node.world_id||a.to===node.world_id))?'warp:'+node.world_id:null;
  }
  function verifyWarpArrows(game,from,to){
    if(!game.warpArrows)return;
    for(const arrow of game.warpArrows)if(arrow.from===from)arrow.status=arrow.to===to?'confirmed':'contradicted';
  }
  function placeZeroMark(game) {
    const id=game.player.world_position,w=game.world;
    if(game.won)return {status:'won'};
    if(!w.warpInvisible)return {status:'unavailable'};
    if(!w.cells[id]||id===w.start||id===w.exit||game.markers.has(id)||(w.puzzle?.locks||[]).some(lock=>lock.key===id||lock.door===id))return {status:'blocked'};
    if(game.zeroMarks?.has(id))return {status:'existing'};
    if(!game.zeroMarks)game.zeroMarks=new Set();
    game.zeroMarks.add(id);
    for(const key of game.cognition.visible_cells){const node=game.cognition.memory_nodes.get(key);if(node?.world_id===id)game.cognition.memory_nodes.set(key,{...node,feature:'0'});}
    return {status:'placed'};
  }
  function placeRemoteZeroMark(game,id){
    const w=game.world;
    if(game.won)return {status:'won'};
    if(!w.warpInvisible)return {status:'unavailable'};
    const maps=[game.cognition.memory_nodes,...game.cognition.archives.map(a=>a.nodes)];
    if(!Number.isInteger(id)||!maps.some(nodes=>[...nodes.values()].some(n=>n.world_id===id&&n.terrain)))return {status:'unknown'};
    if(id===w.start||id===w.exit||game.markers.has(id)||(w.puzzle?.locks||[]).some(lock=>lock.key===id||lock.door===id))return {status:'blocked'};
    if(!game.zeroMarks)game.zeroMarks=new Set();game.zeroMarks.add(id);
    // Explicit map annotation: update already recorded images, never discover new cells.
    for(const nodes of maps)for(const [key,node] of nodes)if(node.world_id===id&&node.terrain)nodes.set(key,{...node,feature:'0'});
    return {status:'placed'};
  }
  function eraseZeroMark(game,id){
    if(game.won)return {status:'won'};
    if(!game.world.warpInvisible)return {status:'unavailable'};
    const maps=[game.cognition.memory_nodes,...game.cognition.archives.map(a=>a.nodes)];
    if(!Number.isInteger(id)||!maps.some(nodes=>[...nodes.values()].some(n=>n.world_id===id&&n.terrain)))return {status:'unknown'};
    if(!game.zeroMarks?.has(id))return {status:'absent'};
    game.zeroMarks.delete(id);
    for(const nodes of maps)for(const [key,node] of nodes)if(node.world_id===id&&node.feature==='0')nodes.set(key,{...node,feature:null});
    return {status:'erased'};
  }
  function featureAt(game, id) {
    const puzzle = game.world.puzzle;
    const door = puzzle?.locks.find(lock => lock.door === id);
    const key = puzzle?.locks.find(lock => lock.key === id);
    if (door && !game.openedDoors.has(door.keyId)) return puzzle.locks.length === 1 ? '+' : door.keyId;
    if (key && !game.player.keys.includes(key.keyId)) return key.keyId.toLowerCase();
    if (id === game.world.exit) return '>';
    if (door && game.openedDoors.has(door.keyId)) return '/';
    if (id === game.world.start) return '<';
    if(game.world.warps?.has(id)&&!game.world.warpInvisible)return 'O';
    return game.markers.get(id) || (game.zeroMarks?.has(id)?'0':null);
  }
  // A bird receives the player's location only when the shared sight test succeeds.
  // SEARCH follows the last observation; its destination is never refreshed unseen.
  function closedDoors(game) {
    return new Set((game.world.puzzle?.locks || []).filter(lock=>!game.openedDoors.has(lock.keyId)).map(lock=>lock.door));
  }
  // Trace in a local, unwrapped chart, then project to real cells. Multiple
  // images of the same cell may be visible through different periodic routes.
  function birdSight(game,bird) {
    const w=game.world,opaque=closedDoors(game),visible=new Set();
    const x=bird.position%w.width,y=Math.floor(bird.position/w.width),torus=w.topology==='torus';
    const idAt=(cx,cy)=>torus?periodicId(w,cx,cy):cy*w.width+cx;
    const wall=(cx,cy)=>!w.cells[idAt(cx,cy)]||opaque.has(idAt(cx,cy));
    for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++) {
      const cx=x+dx,cy=y+dy;
      if(dx*dx+dy*dy>49||(!torus&&(cx<0||cy<0||cx>=w.width||cy>=w.height)))continue;
      if(traceLine(x,y,cx,cy,wall))visible.add(idAt(cx,cy));
    }
    return [...visible];
  }
  function birdSeesPlayer(game,bird) { return birdSight(game,bird).includes(game.player.world_position); }
  // Read-only diagnostics: never observe, advance random state or refresh lastSeen.
  function inspectBird(game, index = 0) {
    const bird=game.birds?.[index];
    if(!bird) return null;
    const w=game.world,opaque=closedDoors(game),visibleCells=birdSight(game,bird);
    const target=bird.state==='WANDER'?null:bird.lastSeen,path=[];
    if(target!==null) {
      const blocked=birdObstacles(game,bird),distances=reachable(w,target,blocked).distances;
      let cursor=bird.position;
      if(!blocked.has(target) && distances[cursor]>=0) {
        path.push(cursor);
        while(cursor!==target) {
          const next=Object.keys(DIRS).map(d=>transition(w,{world_position:cursor},d)).find(e=>e&&!opaque.has(e.to)&&distances[e.to]===distances[cursor]-1);
          if(!next)break;
          cursor=next.to;path.push(cursor);
        }
      }
    }
    return {visibleCells,canSeePlayer:visibleCells.includes(game.player.world_position),target,path,state:bird.state,searchLeft:bird.searchLeft,cooldown:bird.cooldown,nextActionIn:2-game.turns%2};
  }
  function birdObstacles(game,bird) {
    return new Set([...closedDoors(game),...game.birds.filter(other=>other!==bird).map(other=>other.position)]);
  }
  function restBirds(game) {
    for(const bird of game.birds)Object.assign(bird,{state:'WANDER',lastSeen:null,searchLeft:0,previous:null,cooldown:4});
  }
  // A detached preview: neither the archive nor the live cognitive map is edited.
  function archiveCells(game,index,useKnowledge=false) {
    const archive=game.cognition.archives[index];
    if(!archive)return [];
    if(!useKnowledge)return [...archive.nodes.values()].map(node=>({...node}));
    const merged=new Map();
    for(const node of archive.nodes.values()){
      const p=cognitivePosition(game,node.x,node.y),id=cognitiveId(game.world,p.x,p.y);
      const old=merged.get(id),latest=!old || (node.seenAt??0)>=(old.seenAt??0)?node:old;
      merged.set(id,{...latest,...p,firstSeen:Math.min(old?.firstSeen??Infinity,node.firstSeen??Infinity)});
    }
    return [...merged.values()];
  }
  // Display representatives only: recognition keeps its exact canonical coordinates.
  // Reduce along the vector itself, not its smallest x component (which can
  // turn a sheared period into a very tall, two-cell-wide strip).
  function archiveDisplayCells(game,nodes,useKnowledge=true) {
    const basis=useKnowledge&&game.cognition.knowledgeBasis;
    if(!basis)return nodes.map(n=>({...n}));
    let a=[basis.x,basis.rank===1?basis.y:0];
    let b=basis.rank===2?[basis.offset,basis.y]:null;
    const dot=(u,v)=>u[0]*v[0]+u[1]*v[1];
    if(b){
      while(true){
        if(dot(b,b)<dot(a,a))[a,b]=[b,a];
        const multiple=Math.round(dot(a,b)/dot(a,a));
        if(!multiple)break;
        b=[b[0]-multiple*a[0],b[1]-multiple*a[1]];
      }
    }
    return nodes.map(node=>{
      let {x,y}=node;
      if(!b){
        const k=Math.floor((x*a[0]+y*a[1])/dot(a,a)+.5);
        x-=k*a[0];y-=k*a[1];
      }else{
        const determinant=a[0]*b[1]-a[1]*b[0];
        const u=Math.floor((x*b[1]-y*b[0])/determinant+.5);
        const v=Math.floor((a[0]*y-a[1]*x)/determinant+.5);
        x-=u*a[0]+v*b[0];y-=u*a[1]+v*b[1];
      }
      return {...node,x,y};
    });
  }
  function currentLandmark(game) {
    const id=game.player.world_position;
    if(id===game.world.start)return {id,label:'入口',feature:'<'};
    const mark=game.markers.get(id);
    return mark ? {id,label:markerTitle(game,mark),feature:mark} : null;
  }
  function landmarkNodes(game,archive,landmark) {
    if(!archive || !landmark)return [];
    return [...archive.nodes.values()].filter(n=>n.world_id===landmark.id &&
      (landmark.id===game.world.start || n.feature===landmark.feature));
  }
  function inspectEntranceMemory(game,index) {
    return inspectLandmarkMemory(game,index,{id:game.world.start,feature:'<'});
  }
  function inspectLandmarkMemory(game,index,landmark=currentLandmark(game)) {
    const archive=game.cognition.archives[index];
    if(!archive)return {images:0,classes:0};
    const entrances=landmarkNodes(game,archive,landmark);
    const classes=new Set(entrances.map(n=>{
      const p=cognitivePosition(game,n.x,n.y);
      return `${p.x},${p.y}`;
    }));
    return {images:entrances.length,classes:classes.size};
  }
  // Align a unique remembered entrance to the occupied image, using only learned periods.
  // This is a notebook operation: it consumes no turn and never changes the world.
  // Group only explicit matching evidence, never shared real-world IDs.
  function archiveGroups(game) {
    const archives=game.cognition.archives,assigned=new Set(),groups=[];
    const covered=indices=>{
      const found=new Set(),stack=[...indices];
      while(stack.length){
        const i=stack.pop();if(!Number.isInteger(i)||i<0||i>=archives.length||found.has(i))continue;
        found.add(i);for(const source of archives[i].sources||[])if(source<i)stack.push(source);
      }
      return [...found].sort((a,b)=>a-b);
    };
    const add=(indices,representative,live)=>{
      const members=covered(indices).filter(i=>!assigned.has(i));
      if(!members.length)return;
      members.forEach(i=>assigned.add(i));groups.push({members,representative,live});
    };
    const matched=[...game.cognition.matchedArchives];
    if(matched.length)add(matched,Math.max(...matched),true);
    // A snapshot contains its sources, but a source never implies knowledge of a later snapshot.
    for(let i=archives.length-1;i>=0;i--)if(!assigned.has(i))add([i],i,false);
    return groups.sort((a,b)=>a.members[0]-b.members[0]);
  }
  function matchEntranceMaps(game, apply = false) {
    return game.player.world_position===game.world.start ? matchLandmarkMaps(game,apply) : [];
  }
  function matchLandmarkMaps(game, apply = false) {
    if(game.rotationMatcher)return currentLandmark(game)?game.rotationMatcher(game,apply):[];
    const {world,player,cognition:c}=game,landmark=currentLandmark(game);
    if(!world.separateMaps || !landmark) return [];
    const matches=[];
    c.archives.forEach((a,i)=>{
      if(!c.matchedArchives.has(i) && inspectLandmarkMemory(game,i,landmark).classes===1)matches.push(i);
    });
    if(apply && matches.length){
      const merged=new Map();
      for(const i of matches){
        const nodes=[...c.archives[i].nodes.values()];
        const anchor=landmarkNodes(game,c.archives[i],landmark)[0];
        const dx=player.perceived_x-anchor.x,dy=player.perceived_y-anchor.y;
        const chart=new Map();
        for(const node of nodes){
          const p=cognitivePosition(game,node.x+dx,node.y+dy),id=cognitiveId(world,p.x,p.y);
          const old=chart.get(id),latest=!old || (node.seenAt??0)>=(old.seenAt??0)?node:old;
          chart.set(id,{...latest,...p,firstSeen:Math.min(old?.firstSeen??Infinity,node.firstSeen??Infinity)});
        }
        for(const [id,node] of chart)merged.set(id,node);
      }
      // Current observations are newer than every archived page.
      for(const [id,node] of c.memory_nodes)merged.set(id,node);
      c.memory_nodes=merged;
      for(const i of matches)c.matchedArchives.add(i);
    }
    return matches;
  }
  // Register observed landmarks modulo learned periods only, to a fixed point.
  // Preview uses detached maps; neither preview nor apply observes new terrain.
  function matchRecordedMaps(game,apply=false,reasons=null) {
    if(game.rotationMatcher){
      const result=game.rotationMatcher(game,apply,reasons);
      if(reasons)game.cognition.archives.forEach((_,i)=>reasons[i]??=result.includes(i)?'ready':game.cognition.matchedArchives.has(i)?'matched':'orientation');
      return result;
    }
    const {world,cognition:c}=game;
    if(!world.separateMaps){if(reasons)c.archives.forEach((_,i)=>reasons[i]='disabled');return [];}
    if(reasons)c.archives.forEach((_,i)=>reasons[i]=c.matchedArchives.has(i)?'matched':'no-common');
    let memory=new Map(c.memory_nodes);
    const matched=new Set(c.matchedArchives),result=[];
    const anchors=nodes=>{
      const found=new Map();
      for(const n of nodes.values()){
        const warpAnchor=knownWarpAnchor(game,n);
        if(!warpAnchor&&!(/^[1-9]$/.test(n.feature)||(n.feature==='<'&&n.world_id===world.start)))continue;
        const key=warpAnchor||n.feature;
        const position=cognitivePosition(game,n.x,n.y),anchor={...n,...position};
        if(!found.has(key))found.set(key,anchor);
        else {
          const old=found.get(key);
          if(!old||old.x!==anchor.x||old.y!==anchor.y||old.world_id!==anchor.world_id)found.set(key,null);
        }
      }
      return found;
    };
    // Only this call owns these indexes: fresh observations/knowledge rebuild them next time.
    const savedAnchors=new Map();
    let live=null,changed=true;
    while(changed){
      changed=false;
      for(let i=0;i<c.archives.length;i++){
        if(matched.has(i))continue;
        const archive=c.archives[i];
        if(!savedAnchors.has(i))savedAnchors.set(i,anchors(archive.nodes));
        const saved=savedAnchors.get(i);
        if(!live)live=anchors(memory);
        let offset=null,conflict=false,reason='no-common';
        for(const [key,a] of saved){
          if(!live.has(key))continue;
          const b=live.get(key);
          if(!a||!b||a.world_id!==b.world_id){conflict=true;reason='ambiguous';break;}
          const candidate=cognitivePosition(game,b.x-a.x,b.y-a.y);
          if(offset&&(offset.x!==candidate.x||offset.y!==candidate.y)){conflict=true;reason='offset';break;}
          offset=candidate;
        }
        if(!offset||conflict){if(reasons)reasons[i]=reason;continue;}
        const combined=new Map(memory);
        for(const node of archive.nodes.values()){
          const {x,y}=cognitivePosition(game,node.x+offset.x,node.y+offset.y),id=cognitiveId(world,x,y),old=combined.get(id);
          if(old&&(old.world_id!==node.world_id||old.terrain!==node.terrain)){conflict=true;break;}
          const latest=!old||(node.seenAt??0)>(old.seenAt??0)?node:old;
          combined.set(id,{...latest,x,y,firstSeen:Math.min(old?.firstSeen??Infinity,node.firstSeen??Infinity)});
        }
        if(conflict){if(reasons)reasons[i]='terrain';continue;}
        if(reasons)reasons[i]='ready';
        memory=combined;live=null;matched.add(i);result.push(i);changed=true;
      }
    }
    if(apply&&result.length){c.memory_nodes=memory;c.matchedArchives=matched;}
    return result;
  }
  function inspectRecordedMatching(game){
    const reasons=[];
    const matches=matchRecordedMaps(game,false,reasons);
    // A saved integrated chart also carries its explicitly recorded originals.
    // Use the same source closure as the atlas, without changing matching state.
    const connected=g=>archiveGroups(g).filter(group=>group.live).flatMap(group=>group.members);
    const preview={...game,cognition:{...game.cognition,matchedArchives:new Set([...game.cognition.matchedArchives,...matches])}};
    for(const index of connected(preview))reasons[index]='ready';
    for(const index of connected(game))reasons[index]='matched';
    return {matches,reasons};
  }
  function relocatePlayer(game,to,kind) {
    const world=game.world,from=game.player.world_position;
    if(world.separateMaps) {
      game.cognition.archives.push({nodes:game.cognition.memory_nodes,step:game.steps,turn:game.turns,sources:[...game.cognition.matchedArchives],transferKind:kind==='warp' ? (world.warpInvisible ? 'unknown' : 'warp') : 'bird'});
      if(game.viewFrame)game.cognition.archives[game.cognition.archives.length-1].viewFrame=[...game.viewFrame];
      game.cognition.memory_nodes=new Map();
      game.cognition.matchedArchives=new Set();
    }
    Object.assign(game.player,{world_position:to,perceived_x:to%world.width,perceived_y:Math.floor(to/world.width),perceived_position:'C'+to});
    const cognitive=cognitivePosition(game);
    game.player.perceived_position=cognitiveId(world,cognitive.x,cognitive.y);
    // A teleport is not a traversed path. Keep learned knowledge, but start a
    // fresh traversal segment so no pre-transfer visit can award a fake loop.
    game.cognition.loopVisits=new Map([[to,{x:game.player.perceived_x,y:game.player.perceived_y,step:game.steps}]]);
    game.cognition.lastAward={x:game.steps,y:game.steps};
    for(const loop of game.cognition.compositeLoops.values())loop.lastAward=game.steps;
    game.lastLoopEvent=null;
    if(kind==='warp'&&game.afterWarp)game.afterWarp(from);
    if(kind==='warp')verifyWarpArrows(game,from,to);
    game.lastTransition={from,to,kind,direction:game.player.direction,orientation:1,sheet:0};
    game.lastEvent=kind;
  }
  function birdContact(game,bird) {
    const world=game.world,from=game.player.world_position;
    if(bird.position!==from) return false;
    // Never transfer across an unopened door, even if its key is held.
    const distances=reachable(world,from,closedDoors(game)).distances;
    const features=new Set((world.puzzle?.locks || []).flatMap(lock=>[lock.key,lock.door]));
    const floors=[...world.cells.keys()].filter(id=>world.cells[id]&&id!==from&&id!==world.exit&&!features.has(id)&&!game.birds.some(b=>b.position===id)&&distances[id]>0);
    // Classify by real cells, so another periodic image is not a new place.
    const known=new Set([game.cognition.memory_nodes,...game.cognition.archives.map(a=>a.nodes)].flatMap(nodes=>[...nodes.values()].map(node=>node.world_id)));
    const policy=world.teleportPolicy || 'far';
    const preferred=policy==='far'?floors:floors.filter(id=>policy==='known'?known.has(id):!known.has(id));
    const candidates=preferred.length?preferred:floors;
    const far=candidates.filter(id=>distances[id]>=8),pool=far.length?far:candidates;
    if(!pool.length) {
      restBirds(game);
      game.lastEvent='bird-stay';return true;
    }
    const to=pool[Math.floor(game.birdRandom()*pool.length)];
    game.lastTeleport={policy,fallback:policy!=='far'&&!preferred.length,wasKnown:known.has(to),distance:distances[to]};
    relocatePlayer(game,to,'teleport');game.teleports++;
    restBirds(game);
    return true;
  }
  function advanceBird(game) {
    if(!game.bird || game.won) return;
    for(const bird of game.birds)if(birdContact(game,bird))return;
    for(const bird of game.birds)if(advanceOneBird(game,bird))return;
  }
  function advanceOneBird(game,bird) {
    if(bird.cooldown>0){bird.cooldown--;return;}
    // Half the player's speed leaves room to disengage and explore.
    if(game.turns%2) return;
    if(birdSeesPlayer(game,bird)) {
      bird.state='CHASE';bird.lastSeen=game.player.world_position;bird.searchLeft=6;
    } else if(bird.state==='CHASE') bird.state='SEARCH';
    const blocked=birdObstacles(game,bird);
    const edges=Object.keys(DIRS).map(d=>transition(game.world,{world_position:bird.position},d)).filter(e=>e&&!blocked.has(e.to));
    let next=null;
    if(bird.state!=='WANDER') {
      if(bird.position===bird.lastSeen || bird.searchLeft<=0){bird.state='WANDER';bird.lastSeen=null;}
      else {
        const distances=reachable(game.world,bird.lastSeen,blocked).distances;
        next=edges.find(e=>distances[e.to]===distances[bird.position]-1);
        if(bird.state==='SEARCH')bird.searchLeft--;
      }
    }
    if(!next) {
      const forward=edges.filter(e=>e.to!==bird.previous),pool=forward.length?forward:edges;
      next=pool[Math.floor(game.birdRandom()*pool.length)];
    }
    if(next){bird.previous=bird.position;bird.position=next.to;}
    return birdContact(game,bird);
  }
  function waitTurn(game) {
    if(game.won) return false;
    game.lastEvent='wait';game.eventKeyId=null;game.lastLoopEvent=null;
    game.selfRecognized=[];game.inferredRecognized=[];
    const from=game.player.world_position;
    game.lastTransition={from,to:from,kind:'wait',direction:game.player.direction,orientation:game.player.orientation,sheet:game.player.sheet};
    game.turns++;
    advanceBird(game);
    observe(game);
    return true;
  }
  function continueExploring(game) {
    if(!game.won)return false;
    game.firstClearSteps=game.steps;game.exploringAfterExit=true;game.won=false;
    return true;
  }
  function move(game, direction) {
    if (game.won) return false;
    const edge = ruleTransition(game.world, game.player, direction);
    game.lastEvent = null;
    game.eventKeyId = null;
    game.lastLoopEvent = null;
    game.selfRecognized = [];
    game.inferredRecognized = [];
    if (!edge) {
      const geometric = transition(game.world, game.player, direction);
      game.lastEvent = geometric ? 'locked' : 'wall';
      if (geometric) game.eventKeyId = game.world.puzzle?.locks.find(lock => lock.door === geometric.to)?.keyId || null;
      return false;
    }
    game.player.perceived_x += DIRS[direction][0]; game.player.perceived_y += DIRS[direction][1];
    Object.assign(game.player, { world_position: edge.to, perceived_position: cognitiveId(game.world, game.player.perceived_x, game.player.perceived_y), direction: edge.direction, orientation: edge.orientation, sheet: edge.sheet });
    const locks = game.world.puzzle?.locks || [];
    const key = locks.find(lock => lock.key === edge.to), door = locks.find(lock => lock.door === edge.to);
    if (key && !game.player.keys.includes(key.keyId)) { game.player.keys.push(key.keyId); game.lastEvent = 'key'; game.eventKeyId = key.keyId; }
    if (door && !game.openedDoors.has(door.keyId)) { game.openedDoors.add(door.keyId); game.lastEvent = 'door'; game.eventKeyId = door.keyId; }
    game.lastTransition = edge; game.steps++; game.turns++; learnLoop(game);
    const position = cognitivePosition(game);
    game.player.perceived_position = cognitiveId(game.world, position.x, position.y);
    observe(game); game.won = edge.to === game.world.exit && !game.exploringAfterExit;
    if(game.world.warps?.has(edge.to)){
      relocatePlayer(game,game.world.warps.get(edge.to),'warp');observe(game);
    }
    advanceBird(game);
    if(game.lastEvent==='teleport') {
      const recognized=[...game.selfRecognized];observe(game);
      game.selfRecognized=[...new Set([...recognized,...game.selfRecognized])];
    }
    return true;
  }
  // Search only observed marker records; names and world positions alone are not evidence.
  function markerArchives(game, label) {
    const entry = [...game.markers].find(([, value]) => value === label);
    if (!entry) return [];
    return game.cognition.archives.flatMap((archive, index) =>
      [...archive.nodes.values()].some(node => node.world_id === entry[0] && node.feature === label) ? [index] : []);
  }
  const api = { warpArrowRecords, exportWarpArrowNotes, resetWarpArrowCurve, curveWarpArrow, eraseWarpArrow, rememberWarpArrow, knownWarpAnchor, eraseZeroMark, placeRemoteZeroMark, placeZeroMark, continueExploring, archiveDisplayCells, inspectRecordedMatching, matchRecordedMaps, archiveTransfers, archiveGroups, inspectWarpConnectivity, createWarpDemo, exportTrueMap, exportArchiveNotes, setArchiveNote, markerArchives, markerTitle, nameMarker, currentLandmark, inspectLandmarkMemory, matchLandmarkMaps, placeMarker, createArchiveDemo, archiveCells, inspectEntranceMemory, matchEntranceMaps, knowledgeSummary, selfRaySegments, periodicPosition, periodicId, windingOf, deckVector, DIRS, random, generate, createTorusDemo, inspectTorus, cognitivePosition, subjectiveCells, transition, ruleTransition, solvePuzzle, featureAt, reachable, lineOfSight, createGame, observe, move, waitTurn, inspectBird };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MazeCore = api;
})(globalThis);
