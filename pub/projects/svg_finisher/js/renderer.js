// Renders the internal data model into the SVG output
window.SVGRenderer = {
  render(state) {
    const svgEl = document.getElementById('main-svg');
    const viewBox = state.document.viewBox;
    svgEl.setAttribute('viewBox', viewBox.join(' '));
    
    const defsEl = document.getElementById('svg-defs');
    const bgGroup = document.getElementById('svg-backgrounds');
    const regionsGroup = document.getElementById('svg-regions');
    const shapesGroup = document.getElementById('svg-shapes');
    
    defsEl.innerHTML = '';
    bgGroup.innerHTML = '';
    regionsGroup.innerHTML = '';
    shapesGroup.innerHTML = '';
    
    // Process regions to create masks mapping for 'hole' mode
    const holes = state.regions.filter(r => r.mode === 'hole');
    
    let maskId = null;
    if (holes.length > 0) {
      maskId = 'holes-mask';
      const mask = document.createElementNS("http://www.w3.org/2000/svg", 'mask');
      mask.setAttribute('id', maskId);
      
      const baseRect = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
      baseRect.setAttribute('x', viewBox[0] - 2000); 
      baseRect.setAttribute('y', viewBox[1] - 2000);
      baseRect.setAttribute('width', viewBox[2] + 4000);
      baseRect.setAttribute('height', viewBox[3] + 4000);
      baseRect.setAttribute('fill', 'white');
      mask.appendChild(baseRect);
      
      holes.forEach(hole => {
        const el = this.createElementFromRegion(hole);
        el.setAttribute('fill', 'black');
        el.removeAttribute('stroke');
        mask.appendChild(el);
      });
      
      defsEl.appendChild(mask);
    }
    
    // Render Regions
    const renderableRegions = state.regions.filter(r => r.mode !== 'hole');
    renderableRegions.forEach(region => {
      if (region.mode === 'transparent') return;
      
      const el = this.createElementFromRegion(region);
      el.setAttribute('fill', region.fill);
      el.setAttribute('opacity', region.opacity);
      el.removeAttribute('stroke');
      
      if (maskId) {
        el.setAttribute('mask', `url(#${maskId})`);
      }
      
      if (state.selectedId === region.id) {
          el.setAttribute('stroke', '#6366f1');
          el.setAttribute('stroke-width', '2');
          el.setAttribute('stroke-dasharray', '4');
      }
      
      regionsGroup.appendChild(el);
    });
    
    // Render Shapes (Strokes)
    state.shapes.forEach(shape => {
      const sortedStrokes = [...shape.style.strokes].sort((a,b) => b.width - a.width);
      
      sortedStrokes.forEach((stroke, i) => {
        const el = this.createElementFromShape(shape);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', stroke.color);
        el.setAttribute('stroke-width', stroke.width);
        el.setAttribute('stroke-linecap', shape.style.cap || 'round');
        el.setAttribute('stroke-linejoin', shape.style.join || 'round');
        el.setAttribute('opacity', shape.style.opacity);
        
        if (i === 0 && state.selectedId === shape.id) {
            const clone = el.cloneNode();
            clone.setAttribute('stroke', '#6366f1');
            clone.setAttribute('stroke-width', stroke.width + 4);
            clone.setAttribute('opacity', '0.5');
            shapesGroup.appendChild(clone);
        }
        
        shapesGroup.appendChild(el);
      });
    });
  },
  
  createElementFromShape(data) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", data.type);
    for (const [key, value] of Object.entries(data.attributes)) {
      el.setAttribute(key, value);
    }
    if (data.type === 'path') {
      el.setAttribute('d', data.d);
    }
    return el;
  },
  
  createElementFromRegion(data) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", data.type);
    for (const [key, value] of Object.entries(data.attributes || {})) {
      el.setAttribute(key, value);
    }
    if (data.type === 'path') {
      el.setAttribute('d', data.d);
    }
    return el;
  }
};
