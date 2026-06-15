window.SVGExporter = {
  getFinalSVGString() {
    const svgEl = document.getElementById('main-svg');
    const clone = svgEl.cloneNode(true);
    
    // Cleanup UI specific artifacts
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(clone);
    
    if (!source.match(/^<\?xml/)) {
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }
    return source;
  },
  
  exportSVG() {
    const source = this.getFinalSVGString();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    this.download(url, "export.svg");
  },
  
  exportPNG() {
    const source = this.getFinalSVGString();
    const svgEl = document.getElementById('main-svg');
    const viewBox = svgEl.viewBox.baseVal;
    
    const canvas = document.createElement('canvas');
    canvas.width = viewBox.width || 800;
    canvas.height = viewBox.height || 600;
    
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      this.download(pngUrl, "export.png");
    };
    img.src = url;
  },
  
  download(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
