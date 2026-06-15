// Global State object to hold document, shapes, regions, etc.
window.svgFinisherState = {
  document: {
    width: 800,
    height: 600,
    viewBox: [0, 0, 800, 600]
  },
  shapes: [],    // Parsed source lines
  regions: [],   // Extracted closed regions
  backgrounds: [],
  selectedId: null,
  
  // Basic Event Emitter for state changes
  listeners: [],
  subscribe(fn) {
    this.listeners.push(fn);
  },
  notify() {
    this.listeners.forEach(fn => fn(this));
  },
  
  updateDocument(docInfo) {
    this.document = { ...this.document, ...docInfo };
    this.notify();
  },
  
  setShapes(shapes) {
    this.shapes = shapes; // Remove old selection if missing
    if(this.selectedId && !this.shapes.find(s=>s.id===this.selectedId) && !this.regions.find(r=>r.id===this.selectedId)){
        this.selectedId = null;
    }
    this.notify();
  },
  
  setRegions(regions) {
    this.regions = regions;
    this.notify();
  },
  
  selectObject(id) {
    this.selectedId = id;
    this.notify();
  },
  
  updateShape(id, updates) {
    const shape = this.shapes.find(s => s.id === id);
    if (shape) {
      Object.assign(shape, updates);
      this.notify();
    }
  },
  
  updateRegion(id, updates) {
    const region = this.regions.find(r => r.id === id);
    if (region) {
      Object.assign(region, updates);
      this.notify();
    }
  }
};
