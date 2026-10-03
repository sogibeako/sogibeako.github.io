document.addEventListener("DOMContentLoaded", () => {
  const state = window.svgFinisherState;
  const renderer = window.SVGRenderer;
  const exporter = window.SVGExporter;
  
  // -- Setup State Subscription --
  state.subscribe((newState) => {
    renderer.render(newState);
    updateLayerPanel(newState);
    updatePropertyPanel(newState);
  });
  
  // -- File Loading --
  document.getElementById('btn-load-svg').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = window.SVGParser.parse(event.target.result);
        state.updateDocument(parsed.document);
        state.setShapes(parsed.shapes);
        state.setRegions(parsed.regions);
        document.getElementById('status-message').textContent = `${file.name} を読み込みました`;
      } catch (err) {
        alert("SVGの読み込みに失敗しました: " + err.message);
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  });
  
  // -- Exporting --
  document.getElementById('btn-save-svg').addEventListener('click', () => {
    exporter.exportSVG();
  });
  document.getElementById('btn-save-png').addEventListener('click', () => {
    exporter.exportPNG();
  });
  
  // -- UI Updates --
  function updateLayerPanel(st) {
    const list = document.getElementById('layer-list');
    list.innerHTML = '';
    
    const items = [
      ...st.regions.map(r => ({ ...r, label: `領域: ${r.id}`, category: 'region'})),
      ...st.shapes.map(s => ({ ...s, label: `線: ${s.id}`, category: 'shape'}))
    ];
    
    items.forEach(item => {
      const div = document.createElement('div');
      div.className = `layer-item ${st.selectedId === item.id ? 'active' : ''}`;
      div.textContent = item.label;
      div.onclick = () => {
        state.selectObject(item.id);
      };
      
      const badge = document.createElement('span');
      badge.style.fontSize = '10px';
      badge.style.padding = '2px 6px';
      badge.style.borderRadius = '10px';
      badge.style.backgroundColor = 'var(--bg-color)';
      
      if (item.category === 'region') {
          badge.textContent = item.mode;
          if (item.mode === 'fill') badge.style.color = item.fill;
          if (item.mode === 'hole') badge.style.color = '#ef4444';
      } else {
          badge.textContent = `${item.style.strokes.length} lines`;
      }
      div.appendChild(badge);
      list.appendChild(div);
    });
  }
  
  function updatePropertyPanel(st) {
    const panel = document.getElementById('property-panel');
    panel.innerHTML = '';
    
    if (!st.selectedId) {
      panel.innerHTML = '<p class="empty-message">オブジェクトを選択してください</p>';
      return;
    }
    
    let obj = st.shapes.find(s => s.id === st.selectedId);
    let isShape = !!obj;
    if (!obj) {
      obj = st.regions.find(r => r.id === st.selectedId);
      isShape = false;
    }
    
    if (!obj) return;
    
    if (isShape) {
      panel.innerHTML = `
        <div class="section-title">線プロパティ (${obj.id})</div>
        <div class="prop-group">
          <label>線の種類 (端 / 結合)</label>
          <div class="prop-row">
             <select id="prop-cap"><option value="round">Round</option><option value="butt">Butt</option><option value="square">Square</option></select>
             <select id="prop-join"><option value="round">Round</option><option value="miter">Miter</option><option value="bevel">Bevel</option></select>
          </div>
        </div>
        <div class="section-title">多重縁取り設定</div>
        <div id="strokes-container"></div>
        <button id="btn-add-stroke" class="btn" style="width:100%; margin-top:10px">+ 縁取り追加</button>
      `;
      
      document.getElementById('prop-cap').value = obj.style.cap || 'round';
      document.getElementById('prop-join').value = obj.style.join || 'round';
      
      document.getElementById('prop-cap').onchange = (e) => state.updateShape(obj.id, { style: { ...obj.style, cap: e.target.value } });
      document.getElementById('prop-join').onchange = (e) => state.updateShape(obj.id, { style: { ...obj.style, join: e.target.value } });
      
      const container = document.getElementById('strokes-container');
      obj.style.strokes.forEach((stroke, i) => {
        const row = document.createElement('div');
        row.className = 'prop-group';
        row.style.marginBottom = '10px';
        row.style.padding = '8px';
        row.style.backgroundColor = 'rgba(0,0,0,0.2)';
        row.style.borderRadius = '4px';
        
        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
            <label>レイヤー ${i+1} ${i===0?'(一番下)':'(上)'}</label>
            ${obj.style.strokes.length > 1 ? `<button class="btn btn-del-stroke" data-index="${i}" style="padding: 2px 5px; font-size:10px">削除</button>` : ''}
          </div>
          <div class="prop-row">
             <div style="flex: 2;"><input type="color" class="stroke-color" data-index="${i}" value="${stroke.color}"></div>
             <div style="flex: 1;"><input type="number" class="stroke-width" data-index="${i}" value="${stroke.width}" min="0" step="1" title="太さ"></div>
          </div>
        `;
        container.appendChild(row);
      });
      
      container.querySelectorAll('.stroke-color').forEach(input => {
        input.onchange = (e) => {
          const idx = parseInt(e.target.dataset.index);
          const newStrokes = [...obj.style.strokes];
          newStrokes[idx].color = e.target.value;
          state.updateShape(obj.id, { style: { ...obj.style, strokes: newStrokes } });
        };
      });
      container.querySelectorAll('.stroke-width').forEach(input => {
        input.onchange = (e) => {
          const idx = parseInt(e.target.dataset.index);
          const newStrokes = [...obj.style.strokes];
          newStrokes[idx].width = parseFloat(e.target.value);
          if(isNaN(newStrokes[idx].width)) newStrokes[idx].width = 0;
          state.updateShape(obj.id, { style: { ...obj.style, strokes: newStrokes } });
        };
      });
      container.querySelectorAll('.btn-del-stroke').forEach(btn => {
        btn.onclick = (e) => {
          const idx = parseInt(e.target.dataset.index);
          const newStrokes = [...obj.style.strokes];
          newStrokes.splice(idx, 1);
          state.updateShape(obj.id, { style: { ...obj.style, strokes: newStrokes } });
        };
      });
      
      document.getElementById('btn-add-stroke').onclick = () => {
         const newStrokes = [...obj.style.strokes, { color: '#ffffff', width: obj.style.strokes[0].width ? Math.max(1, obj.style.strokes[0].width / 2) : 2 }];
         state.updateShape(obj.id, { style: { ...obj.style, strokes: newStrokes } });
      };
      
    } else {
      panel.innerHTML = `
        <div class="section-title">領域プロパティ (${obj.id})</div>
        <div class="prop-group" style="margin-bottom: 15px;">
          <label>表示モード</label>
          <select id="prop-mode" style="width:100%">
            <option value="fill">Fill (塗りつぶし)</option>
            <option value="transparent">Transparent (見えない領域)</option>
            <option value="hole">Hole (構造的な穴)</option>
          </select>
        </div>
        
        <div id="fill-settings" class="prop-group" style="margin-bottom: 15px;">
          <label>塗り色</label>
          <input type="color" id="prop-fill-color" value="${obj.fill}">
          
          <label style="margin-top: 10px;">不透明度 (0 - 1)</label>
          <input type="number" id="prop-opacity" value="${obj.opacity}" step="0.1" min="0" max="1">
        </div>
        
        <div style="font-size: 0.8rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">
           <p><strong>Tips:</strong></p>
           <p>Holeに設定すると、下層レイヤーを透かして見せるマスクとして働きます。</p>
        </div>
      `;
      
      document.getElementById('prop-mode').value = obj.mode;
      document.getElementById('prop-mode').onchange = (e) => {
         const mode = e.target.value;
         state.updateRegion(obj.id, { mode });
      };
      
      const fillSettings = document.getElementById('fill-settings');
      if (obj.mode !== 'fill') {
          fillSettings.style.opacity = '0.3';
          fillSettings.style.pointerEvents = 'none';
      }
      
      document.getElementById('prop-fill-color').onchange = (e) => {
         state.updateRegion(obj.id, { fill: e.target.value });
      };
      document.getElementById('prop-opacity').onchange = (e) => {
         state.updateRegion(obj.id, { opacity: parseFloat(e.target.value) });
      };
    }
  }
  
  // Create a default shape representing an example geometric pattern
  const initialSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <path id="star" d="M 400 100 L 450 250 L 600 250 L 480 340 L 520 490 L 400 400 L 280 490 L 320 340 L 200 250 L 350 250 Z" 
              fill="#cfd8e8" fill-opacity="1" stroke="#335f88" stroke-width="4"/>
        <circle id="center" cx="400" cy="350" r="50" fill="#ffffff" stroke="#0a0a0a" stroke-width="2"/>
    </svg>
  `;
  const parsed = window.SVGParser.parse(initialSvg);
  state.updateDocument(parsed.document);
  state.setShapes(parsed.shapes);
  state.setRegions(parsed.regions);
  
});
