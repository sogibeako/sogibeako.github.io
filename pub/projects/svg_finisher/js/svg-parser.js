// Parses imported SVG strings into the internal data model
window.SVGParser = {
  parse(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgEl = doc.querySelector('svg');
    
    if (!svgEl) {
      throw new Error("Invalid SVG format");
    }
    
    // Get document properties
    const viewBoxAttr = svgEl.getAttribute('viewBox');
    const widthAttr = svgEl.getAttribute('width');
    const heightAttr = svgEl.getAttribute('height');
    
    let viewBox = [0, 0, 800, 600];
    if (viewBoxAttr) {
      viewBox = viewBoxAttr.split(/[\s,]+/).map(Number);
    } else if (widthAttr && heightAttr) {
      viewBox = [0, 0, parseInt(widthAttr), parseInt(heightAttr)];
    }
    
    const shapes = [];
    const regions = [];
    
    // Extract basic shapes (paths, circles, rects, polygons, lines)
    // For MVP phase 1, we treat closed paths/shapes as both shapes (for outlines) and regions (for coloring).
    const elements = svgEl.querySelectorAll('path, circle, rect, polygon, ellipse, line, polyline');
    
    let index = 0;
    elements.forEach(el => {
      index++;
      const tagName = el.tagName.toLowerCase();
      
      let d = "";
      let isClosed = false;
      
      if (tagName === 'path') {
        d = el.getAttribute('d') || "";
        isClosed = /Z$/i.test(d.trim());
      } else {
        isClosed = ['circle', 'rect', 'polygon', 'ellipse'].includes(tagName);
      }
      
      const id = el.getAttribute('id') || `${tagName}-${index}`;
      
      const rgbToHex = (htmlCol) => {
        // Very basic placeholder, we could compute exactly, but keeping simple
        if (!htmlCol || htmlCol === 'none') return "#333333";
        return htmlCol; // assume standard valid web color or hex
      };

      const strokeCol = el.getAttribute('stroke') || "#333333";
      const strokeWidth = parseFloat(el.getAttribute('stroke-width') || "2");
      
      const shapeObj = {
        id: `S-${id}`,
        type: tagName,
        attributes: this.extractAttributes(el),
        d: d,
        closed: isClosed,
        style: {
          strokes: [
            { color: strokeCol, width: strokeWidth }
          ],
          opacity: 1,
          cap: 'round',
          join: 'round'
        }
      };
      shapes.push(shapeObj);
      
      if (isClosed) {
        let fillCol = el.getAttribute('fill') || '#cccccc';
        let mode = "fill";
        if (fillCol === 'none' || !el.hasAttribute('fill')) {
            mode = "transparent";
            fillCol = "#cfd8e8"; // Default placeholder if re-activated
        }

        regions.push({
          id: `R-${id}`,
          sourceShapeId: shapeObj.id,
          type: tagName,
          d: d,
          attributes: this.extractAttributes(el),
          mode: mode, // fill, transparent, hole
          fill: fillCol,
          opacity: parseFloat(el.getAttribute('fill-opacity') || "1"),
          showBackground: false
        });
      }
    });
    
    return {
      document: {
        width: viewBox[2],
        height: viewBox[3],
        viewBox: viewBox
      },
      shapes,
      regions
    };
  },
  
  extractAttributes(el) {
    const attrs = {};
    for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (!['id', 'stroke', 'stroke-width', 'fill', 'fill-opacity'].includes(attr.name)) {
            attrs[attr.name] = attr.value;
        }
    }
    return attrs;
  }
};
