/**
 * Cell Complex Data Structures and Generators
 * Separates topology (connectivity) from geometry (rendering positions).
 */

export class Vertex {
  constructor(id, x = 0, y = 0, z = 0) {
    this.id = id;
    this.position2D = { x, y };
    this.position3D = { x, y, z };
    this.edges = []; // Edge IDs connected to this vertex
    this.faces = []; // Face IDs sharing this vertex
    this.tags = [];
  }
}

export class Edge {
  constructor(id, v1, v2) {
    this.id = id;
    this.vertices = [v1, v2]; // Vertex IDs [min, max]
    this.faces = []; // Face IDs sharing this edge
    this.tags = [];
  }
}

export class Face {
  constructor(id, vertices = [], renderPoints = []) {
    this.id = id;
    this.state = 0; // Current state
    this.nextState = 0; // Computed next state
    this.vertices = vertices; // Topological Vertex IDs in counter-clockwise order
    this.edges = []; // Topological Edge IDs
    this.renderPoints = renderPoints; // Local 2D coordinates for rendering (avoids edge stretching)
    this.tags = [];
    this.sheet = 0; // For multi-sheet topologies
  }

  // Helper to compute centroid of rendering points
  getCentroid() {
    let sx = 0, sy = 0;
    for (const p of this.renderPoints) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / this.renderPoints.length, y: sy / this.renderPoints.length };
  }
}

export class CellComplex {
  constructor() {
    this.vertices = [];
    this.edges = [];
    this.faces = [];
    
    this.vertexMap = new Map();
    this.edgeMap = new Map();
    this.faceMap = new Map();
  }

  clear() {
    this.vertices = [];
    this.edges = [];
    this.faces = [];
    this.vertexMap.clear();
    this.edgeMap.clear();
    this.faceMap.clear();
  }

  addVertex(x, y, z = 0) {
    const id = this.vertices.length;
    const v = new Vertex(id, x, y, z);
    this.vertices.push(v);
    this.vertexMap.set(id, v);
    return v;
  }

  addEdge(v1, v2) {
    // Ensure v1 < v2 for uniqueness
    const minV = Math.min(v1, v2);
    const maxV = Math.max(v1, v2);
    
    // Check if edge already exists
    for (const edge of this.edges) {
      if (edge.vertices[0] === minV && edge.vertices[1] === maxV) {
        return edge;
      }
    }
    
    const id = this.edges.length;
    const e = new Edge(id, minV, maxV);
    this.edges.push(e);
    this.edgeMap.set(id, e);
    return e;
  }

  addFace(vertexIds, renderPoints) {
    const id = this.faces.length;
    const face = new Face(id, vertexIds, renderPoints);
    
    // Add edges of the face
    const faceEdges = [];
    for (let i = 0; i < vertexIds.length; i++) {
      const v1 = vertexIds[i];
      const v2 = vertexIds[(i + 1) % vertexIds.length];
      const edge = this.addEdge(v1, v2);
      faceEdges.push(edge.id);
      
      // Associate face to edge
      if (!edge.faces.includes(id)) {
        edge.faces.push(id);
      }
    }
    face.edges = faceEdges;
    
    // Associate face to vertices
    for (const vId of vertexIds) {
      const v = this.vertexMap.get(vId);
      if (v && !v.faces.includes(id)) {
        v.faces.push(id);
      }
    }

    this.faces.push(face);
    this.faceMap.set(id, face);
    return face;
  }

  /**
   * Topologically merges vertex 2 into vertex 1.
   * vId2 will map to vId1 in all face/edge connections.
   */
  mergeVertices(vId1, vId2) {
    if (vId1 === vId2) return;
    const v1 = this.vertexMap.get(vId1);
    const v2 = this.vertexMap.get(vId2);
    if (!v1 || !v2) return;

    // Direct merge of edges and faces (uniquely)
    v2.edges.forEach(eId => {
      if (!v1.edges.includes(eId)) v1.edges.push(eId);
    });
    v2.faces.forEach(fId => {
      if (!v1.faces.includes(fId)) v1.faces.push(fId);
    });

    // Update edges referencing vId2 to point to vId1
    this.edges.forEach(edge => {
      if (edge.vertices[0] === vId2) edge.vertices[0] = vId1;
      if (edge.vertices[1] === vId2) edge.vertices[1] = vId1;
      // Re-sort vertices
      if (edge.vertices[0] > edge.vertices[1]) {
        edge.vertices.reverse();
      }
    });

    // Update faces referencing vId2 to point to vId1
    this.faces.forEach(face => {
      face.vertices = face.vertices.map(v => v === vId2 ? vId1 : v);
    });

    // Mark vertex 2 for deletion by removing from map
    this.vertexMap.delete(vId2);
  }

  /**
   * Re-evaluates connectivity, merges duplicate edges,
   * removes deleted vertices/edges, and compacts IDs to be sequential (0, 1, 2...).
   */
  cleanAndReindex() {
    // 1. Merge duplicate edges
    const uniqueEdges = [];
    const edgeMapping = new Map(); // oldEdgeId -> newEdgeId / mergedEdgeId
    const seenEdges = new Map(); // "v1,v2" -> Edge

    this.edges.forEach(edge => {
      // Skip degenerate edges (vertices merged together)
      if (edge.vertices[0] === edge.vertices[1]) {
        return;
      }
      
      const key = `${edge.vertices[0]},${edge.vertices[1]}`;
      if (seenEdges.has(key)) {
        const primaryEdge = seenEdges.get(key);
        // Merge faces of this duplicate edge into primaryEdge
        edge.faces.forEach(fId => {
          if (!primaryEdge.faces.includes(fId)) {
            primaryEdge.faces.push(fId);
          }
        });
        edgeMapping.set(edge.id, primaryEdge.id);
      } else {
        seenEdges.set(key, edge);
        uniqueEdges.push(edge);
        edgeMapping.set(edge.id, edge.id);
      }
    });
    this.edges = uniqueEdges;

    // 2. Re-index vertices
    const newVertices = Array.from(this.vertexMap.values());
    const vertexIdMapping = new Map();
    newVertices.forEach((v, index) => {
      vertexIdMapping.set(v.id, index);
      v.id = index;
      v.edges = [];
      v.faces = [];
    });
    this.vertices = newVertices;
    this.vertexMap.clear();
    this.vertices.forEach(v => this.vertexMap.set(v.id, v));

    // 3. Re-index edges
    const edgeIdMapping = new Map();
    this.edges.forEach((edge, index) => {
      edgeIdMapping.set(edge.id, index);
      edge.id = index;
      // Update its vertex references
      edge.vertices[0] = vertexIdMapping.get(edge.vertices[0]);
      edge.vertices[1] = vertexIdMapping.get(edge.vertices[1]);
      // Reset faces references (will rebuild)
      edge.faces = [];
    });
    this.edgeMap.clear();
    this.edges.forEach(e => this.edgeMap.set(e.id, e));

    // 4. Update and rebuild face references
    this.faces.forEach((face, index) => {
      face.id = index;
      face.vertices = face.vertices.map(vId => vertexIdMapping.get(vId));
      
      // Re-map edges to new edge IDs
      const uniqueFaceEdges = new Set();
      for (let i = 0; i < face.vertices.length; i++) {
        const v1 = face.vertices[i];
        const v2 = face.vertices[(i + 1) % face.vertices.length];
        
        // Find corresponding edge
        const minV = Math.min(v1, v2);
        const maxV = Math.max(v1, v2);
        const edge = this.edges.find(e => e.vertices[0] === minV && e.vertices[1] === maxV);
        if (edge) {
          uniqueFaceEdges.add(edge.id);
          if (!edge.faces.includes(face.id)) {
            edge.faces.push(face.id);
          }
        }
      }
      face.edges = Array.from(uniqueFaceEdges);
      
      // Update vertex-to-face references
      face.vertices.forEach(vId => {
        const v = this.vertexMap.get(vId);
        if (v && !v.faces.includes(face.id)) {
          v.faces.push(face.id);
        }
      });
    });
    this.faceMap.clear();
    this.faces.forEach(f => this.faceMap.set(f.id, f));

    // 5. Rebuild vertex-to-edge references
    this.edges.forEach(edge => {
      const v1 = this.vertexMap.get(edge.vertices[0]);
      const v2 = this.vertexMap.get(edge.vertices[1]);
      if (v1 && !v1.edges.includes(edge.id)) v1.edges.push(edge.id);
      if (v2 && !v2.edges.includes(edge.id)) v2.edges.push(edge.id);
    });
  }
}

/* =========================================================================
   GRID GENERATORS
   ========================================================================= */

// --- 1. SQUARE GRID GENERATOR ---
export function generateSquareGrid(complex, w, h, sheet = 0, xOffset = 0, yOffset = 0) {
  const vMap = new Map(); // (x,y) -> Vertex ID

  // Create vertices
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      const v = complex.addVertex(x + xOffset, y + yOffset, 0);
      vMap.set(`${x},${y}`, v.id);
    }
  }

  // Create faces
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v00 = vMap.get(`${x},${y}`);
      const v10 = vMap.get(`${x+1},${y}`);
      const v11 = vMap.get(`${x+1},${y+1}`);
      const v01 = vMap.get(`${x},${y+1}`);
      
      const rPoints = [
        { x: x + xOffset, y: y + yOffset },
        { x: x + 1 + xOffset, y: y + yOffset },
        { x: x + 1 + xOffset, y: y + 1 + yOffset },
        { x: x + xOffset, y: y + 1 + yOffset }
      ];

      const face = complex.addFace([v00, v10, v11, v01], rPoints);
      face.sheet = sheet;
    }
  }
}

// --- 2. TRIANGLE GRID GENERATOR ---
export function generateTriangleGrid(complex, w, h, sheet = 0, xOffset = 0, yOffset = 0) {
  const vMap = new Map(); // (x,y) -> Vertex ID
  const dy = Math.sqrt(3) / 2; // Height of equilateral triangle with side length 1

  // Create vertices
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x <= w; x++) {
      // Stagger odd rows slightly for equilateral geometry
      const shiftX = (y % 2) * 0.5;
      const vx = x + shiftX + xOffset;
      const vy = y * dy + yOffset;
      const v = complex.addVertex(vx, vy, 0);
      vMap.set(`${x},${y}`, v.id);
    }
  }

  // Create faces (triangles)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const stagger = y % 2;
      
      // We partition each quad grid cell into two triangles
      if (stagger === 0) {
        // Stagger = 0: split by diagonal from bottom-left to top-right
        // Triangle 1: (x,y), (x+1,y), (x,y+1)
        const v00 = vMap.get(`${x},${y}`);
        const v10 = vMap.get(`${x+1},${y}`);
        const v01 = vMap.get(`${x},${y+1}`);
        if (v00 !== undefined && v10 !== undefined && v01 !== undefined) {
          const rp = [
            { x: x, y: y*dy },
            { x: x+1, y: y*dy },
            { x: x+0.5, y: (y+1)*dy }
          ].map(p => ({ x: p.x + xOffset, y: p.y + yOffset }));
          const face = complex.addFace([v00, v10, v01], rp);
          face.sheet = sheet;
        }

        // Triangle 2: (x+1,y), (x+1,y+1), (x,y+1)
        const v11 = vMap.get(`${x+1},${y+1}`);
        if (v10 !== undefined && v11 !== undefined && v01 !== undefined) {
          const rp = [
            { x: x+1, y: y*dy },
            { x: x+1.5, y: (y+1)*dy },
            { x: x+0.5, y: (y+1)*dy }
          ].map(p => ({ x: p.x + xOffset, y: p.y + yOffset }));
          const face = complex.addFace([v10, v11, v01], rp);
          face.sheet = sheet;
        }
      } else {
        // Stagger = 1: split by diagonal from top-left to bottom-right
        // Triangle 1: (x,y), (x+1,y), (x+1,y+1)
        const v00 = vMap.get(`${x},${y}`);
        const v10 = vMap.get(`${x+1},${y}`);
        const v11 = vMap.get(`${x+1},${y+1}`);
        if (v00 !== undefined && v10 !== undefined && v11 !== undefined) {
          const rp = [
            { x: x+0.5, y: y*dy },
            { x: x+1.5, y: y*dy },
            { x: x+1, y: (y+1)*dy }
          ].map(p => ({ x: p.x + xOffset, y: p.y + yOffset }));
          const face = complex.addFace([v00, v10, v11], rp);
          face.sheet = sheet;
        }

        // Triangle 2: (x,y), (x+1,y+1), (x,y+1)
        const v01 = vMap.get(`${x},${y+1}`);
        if (v00 !== undefined && v11 !== undefined && v01 !== undefined) {
          const rp = [
            { x: x+0.5, y: y*dy },
            { x: x+1, y: (y+1)*dy },
            { x: x, y: (y+1)*dy }
          ].map(p => ({ x: p.x + xOffset, y: p.y + yOffset }));
          const face = complex.addFace([v00, v11, v01], rp);
          face.sheet = sheet;
        }
      }
    }
  }
}

// --- 3. HEX GRID GENERATOR ---
export function generateHexGrid(complex, w, h, sheet = 0, xOffset = 0, yOffset = 0) {
  // Use axial coordinates to generate hexagons with shared vertices
  const vMap = new Map(); // "vx,vy" -> Vertex object (coordinate key rounded)
  const radius = 0.577; // Hex outer radius to make side length ~0.577, width ~1.0
  const hexWidth = Math.sqrt(3) * radius; // ~1.0
  const hexHeight = 2 * radius; // ~1.154
  const rowHeight = 1.5 * radius; // ~0.866

  const getOrCreateVertex = (x, y) => {
    const key = `${x.toFixed(4)},${y.toFixed(4)}`;
    if (vMap.has(key)) return vMap.get(key).id;
    const v = complex.addVertex(x, y, 0);
    vMap.set(key, v);
    return v.id;
  };

  for (let r = 0; r < h; r++) {
    const yCenter = r * rowHeight + yOffset;
    for (let q = 0; q < w; q++) {
      // Offset alternate rows horizontally
      const xCenter = q * hexWidth + (r % 2) * (hexWidth / 2) + xOffset;
      
      // Generate 6 vertices for this hexagon
      const vertexIds = [];
      const renderPoints = [];
      
      for (let i = 0; i < 6; i++) {
        // Pointy topped hex vertices: angles are 30 + 60*i degrees
        const angle = (Math.PI / 180) * (30 + 60 * i);
        const vx = xCenter + radius * Math.cos(angle);
        const vy = yCenter + radius * Math.sin(angle);
        
        vertexIds.push(getOrCreateVertex(vx, vy));
        renderPoints.push({ x: vx, y: vy });
      }

      const face = complex.addFace(vertexIds, renderPoints);
      face.sheet = sheet;
    }
  }
}

// --- 4. VORONOI / IRREGULAR GRID GENERATOR ---
export function generateVoronoiGrid(complex, count, size = 30) {
  const points = [];
  
  // Seed random points inside bounding box
  // Place points with Poisson-like spacing or jittered grid
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const dx = size / cols;
  const dy = size / rows;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (points.length >= count) break;
      const px = (c + 0.3 + Math.random() * 0.4) * dx;
      const py = (r + 0.3 + Math.random() * 0.4) * dy;
      points.push({ x: px, y: py });
    }
  }

  // Sutherland-Hodgman Polygon Clipping against half-planes
  // A helper to clip a polygon by a bisector line between p1 and p2
  const clipPolygonByBisector = (poly, p1, p2) => {
    // Bisector line pass through midpoint, perpendicular to (p2 - p1)
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    // normal vector pointing towards p1 (the active seed)
    const nx = p1.x - p2.x;
    const ny = p1.y - p2.y;
    // normal length
    const len = Math.sqrt(nx*nx + ny*ny);
    const dx = nx / len;
    const dy = ny / len;

    // Dot product to check which side of line point is: (P - mid) . d >= 0 is inside
    const isInside = (p) => {
      return (p.x - mid.x) * dx + (p.y - mid.y) * dy >= 0;
    };

    // Find intersection of line segment (s, e) with bisector line
    const intersection = (s, e) => {
      // line eq: mid.x*dx + mid.y*dy = dot
      const dot = mid.x * dx + mid.y * dy;
      // segment eq: s + t*(e - s)
      // (s.x + t*(e.x - s.x))*dx + (s.y + t*(e.y - s.y))*dy = dot
      // t * ((e.x - s.x)*dx + (e.y - s.y)*dy) = dot - s.x*dx - s.y*dy
      const num = dot - (s.x * dx + s.y * dy);
      const den = (e.x - s.x) * dx + (e.y - s.y) * dy;
      if (Math.abs(den) < 1e-6) return s; // parallel
      const t = num / den;
      return { x: s.x + t * (e.x - s.x), y: s.y + t * (e.y - s.y) };
    };

    const out = [];
    if (poly.length === 0) return out;

    let s = poly[poly.length - 1];
    for (let i = 0; i < poly.length; i++) {
      const e = poly[i];
      if (isInside(e)) {
        if (!isInside(s)) {
          out.push(intersection(s, e));
        }
        out.push(e);
      } else if (isInside(s)) {
        out.push(intersection(s, e));
      }
      s = e;
    }
    return out;
  };

  // Generate Voronoi cells
  const cellPolygons = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    // Start with a large bounding box
    let cellPoly = [
      { x: 0, y: 0 },
      { x: size, y: 0 },
      { x: size, y: size },
      { x: 0, y: size }
    ];

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const p2 = points[j];
      cellPoly = clipPolygonByBisector(cellPoly, p1, p2);
    }
    cellPolygons.push(cellPoly);
  }

  // Construct Cell Complex from the clipped polygons
  const vertexMap = new Map(); // "x,y" -> Vertex ID
  const getOrCreateVertex = (p) => {
    // Round to merge nearby floating point coordinates
    const key = `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
    if (vertexMap.has(key)) return vertexMap.get(key);
    const v = complex.addVertex(p.x, p.y, 0);
    vertexMap.set(key, v.id);
    return v.id;
  };

  for (let i = 0; i < cellPolygons.length; i++) {
    const poly = cellPolygons[i];
    if (poly.length < 3) continue; // Skip collapsed cells

    const vIds = poly.map(p => getOrCreateVertex(p));
    complex.addFace(vIds, poly);
  }
}

// --- 5. PLATONIC SOLIDS GENERATORS ---
// Platonic solids vertices are placed on a 3D unit sphere.
// Since they represent 3D topologies natively, no boundary wrapping is needed.

// Tetrahedron (正四面体): 4 vertices, 6 edges, 4 triangular faces
export function generateTetrahedron(complex) {
  const scale = 2.0;
  const vertices = [
    { x: 1, y: 1, z: 1 },
    { x: -1, y: -1, z: 1 },
    { x: -1, y: 1, z: -1 },
    { x: 1, y: -1, z: -1 }
  ];

  const vIds = vertices.map(v => {
    const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    // Add vertex with 3D and 2D stereographic projection coordinate
    // 2D position is a stereographic projection of sphere onto plane: X = x / (1 - z), Y = y / (1 - z)
    const px = (v.x / len) * scale;
    const py = (v.y / len) * scale;
    return complex.addVertex(px, py, (v.z / len) * scale).id;
  });

  const faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 1],
    [1, 3, 2]
  ];

  faces.forEach((fVertices) => {
    const rp = fVertices.map(idx => ({ x: vertices[idx].x * scale, y: vertices[idx].y * scale }));
    complex.addFace(fVertices.map(idx => vIds[idx]), rp);
  });
}

// Cube (正六面体): 8 vertices, 12 edges, 6 square faces
export function generateCube(complex) {
  const scale = 2.0;
  const vertices = [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 }
  ];

  const vIds = vertices.map(v => {
    const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    return complex.addVertex((v.x/len)*scale, (v.y/len)*scale, (v.z/len)*scale).id;
  });

  const faces = [
    [0, 1, 2, 3], // Bottom
    [4, 5, 6, 7], // Top
    [0, 1, 5, 4], // Front
    [2, 3, 7, 6], // Back
    [0, 3, 7, 4], // Left
    [1, 2, 6, 5]  // Right
  ];

  faces.forEach((fVertices) => {
    const rp = fVertices.map(idx => ({ x: vertices[idx].x * scale, y: vertices[idx].y * scale }));
    complex.addFace(fVertices.map(idx => vIds[idx]), rp);
  });
}

// Octahedron (正八面体): 6 vertices, 12 edges, 8 triangular faces
export function generateOctahedron(complex) {
  const scale = 2.0;
  const vertices = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 }
  ];

  const vIds = vertices.map(v => {
    return complex.addVertex(v.x * scale, v.y * scale, v.z * scale).id;
  });

  const faces = [
    [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
    [0, 5, 2], [2, 5, 1], [1, 5, 3], [3, 5, 0]
  ];

  faces.forEach((fVertices) => {
    const rp = fVertices.map(idx => ({ x: vertices[idx].x * scale, y: vertices[idx].y * scale }));
    complex.addFace(fVertices.map(idx => vIds[idx]), rp);
  });
}

// Dodecahedron (正十二面体): 20 vertices, 30 edges, 12 pentagonal faces
export function generateDodecahedron(complex) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = 2.0;
  const a = 1, b = 1/phi, c = phi;

  const vertices = [
    { x: -1, y: -1, z: -1 }, { x: -1, y: -1, z: 1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: 1, z: 1 },
    { x: 1, y: -1, z: -1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: 1, z: -1 }, { x: 1, y: 1, z: 1 },
    { x: 0, y: -b, z: -c }, { x: 0, y: -b, z: c }, { x: 0, y: b, z: -c }, { x: 0, y: b, z: c },
    { x: -b, y: -c, z: 0 }, { x: -b, y: c, z: 0 }, { x: b, y: -c, z: 0 }, { x: b, y: c, z: 0 },
    { x: -c, y: 0, z: -b }, { x: -c, y: 0, z: b }, { x: c, y: 0, z: -b }, { x: c, y: 0, z: b }
  ];

  const vIds = vertices.map(v => {
    const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    return complex.addVertex((v.x/len)*scale, (v.y/len)*scale, (v.z/len)*scale).id;
  });

  const faces = [
    [8, 0, 16, 2, 10],
    [10, 6, 18, 4, 8],
    [12, 0, 8, 4, 14],
    [14, 5, 9, 1, 12],
    [9, 1, 17, 3, 11],
    [11, 7, 19, 5, 9],
    [15, 6, 10, 2, 13],
    [13, 3, 11, 7, 15],
    [18, 6, 15, 7, 19],
    [19, 5, 14, 4, 18],
    [17, 1, 12, 0, 16],
    [16, 2, 13, 3, 17]
  ];

  faces.forEach((fVertices) => {
    const rp = fVertices.map(idx => ({ x: vertices[idx].x * scale, y: vertices[idx].y * scale }));
    complex.addFace(fVertices.map(idx => vIds[idx]), rp);
  });
}

// Icosahedron (正二十面体): 12 vertices, 30 edges, 20 triangular faces
export function generateIcosahedron(complex) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = 2.0;

  const vertices = [
    { x: -1, y: phi, z: 0 }, { x: 1, y: phi, z: 0 }, { x: -1, y: -phi, z: 0 }, { x: 1, y: -phi, z: 0 },
    { x: 0, y: -1, z: phi }, { x: 0, y: 1, z: phi }, { x: 0, y: -1, z: -phi }, { x: 0, y: 1, z: -phi },
    { x: phi, y: 0, z: -1 }, { x: phi, y: 0, z: 1 }, { x: -phi, y: 0, z: -1 }, { x: -phi, y: 0, z: 1 }
  ];

  const vIds = vertices.map(v => {
    const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    return complex.addVertex((v.x/len)*scale, (v.y/len)*scale, (v.z/len)*scale).id;
  });

  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  faces.forEach((fVertices) => {
    const rp = fVertices.map(idx => ({ x: vertices[idx].x * scale, y: vertices[idx].y * scale }));
    complex.addFace(fVertices.map(idx => vIds[idx]), rp);
  });
}

// --- 6. OCTAHEDRON CHAIN GENERATOR ---
// Connects multiple octahedron units in a chain sharing edges/vertices.
export function generateOctahedronChain(complex, chainLength = 4) {
  const scale = 1.2;
  
  // Base octahedron vertices layout
  const baseVertices = [
    { x: 0, y: 0, z: 1 },  // Top
    { x: 1, y: 0, z: 0 },  // Right
    { x: 0, y: 1, z: 0 },  // Front
    { x: -1, y: 0, z: 0 }, // Left
    { x: 0, y: -1, z: 0 }, // Back
    { x: 0, y: 0, z: -1 }  // Bottom
  ];

  const baseFaces = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
    [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
  ];

  for (let k = 0; k < chainLength; k++) {
    // Offset along X-axis
    const dx = k * 2.0 * scale;
    
    // Add 6 vertices for each unit
    const unitVIds = [];
    for (let i = 0; i < 6; i++) {
      const bv = baseVertices[i];
      const vx = bv.x * scale + dx;
      const vy = bv.y * scale;
      const vz = bv.z * scale;
      
      const v = complex.addVertex(vx, vy, vz);
      unitVIds.push(v.id);
    }

    // Add 8 faces for this unit
    baseFaces.forEach((f) => {
      const vIds = f.map(idx => unitVIds[idx]);
      const rp = f.map(idx => ({ 
        x: baseVertices[idx].x * scale + dx, 
        y: baseVertices[idx].y * scale 
      }));
      complex.addFace(vIds, rp);
    });

    // Topologically connect to the previous unit (if any)
    if (k > 0) {
      // Connect Left vertex (unit k, index 3) with Right vertex (unit k-1, index 1)
      const leftVOfCurrent = unitVIds[3];
      const rightVOfPrev = (k - 1) * 6 + 1;
      
      // Merge Left vertex of current with Right vertex of previous
      complex.mergeVertices(rightVOfPrev, leftVOfCurrent);
    }
  }

  // Perform clean & rebuild to finalize topological merges
  complex.cleanAndReindex();
}

// --- 7. PRISM GENERATOR ---
export function generatePrism(complex, n = 5) {
  const scale = 1.6;
  const h = 0.8; // half height
  
  const vertices = [];
  // Bottom vertices
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    vertices.push({ x: Math.cos(angle), y: Math.sin(angle), z: -h });
  }
  // Top vertices
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n;
    vertices.push({ x: Math.cos(angle), y: Math.sin(angle), z: h });
  }

  const vIds = vertices.map(v => {
    return complex.addVertex(v.x * scale, v.y * scale, v.z * scale).id;
  });

  // Bottom face (vertices in CCW order from bottom viewpoint)
  const bottomFaceVIds = [];
  for (let i = n - 1; i >= 0; i--) {
    bottomFaceVIds.push(vIds[i]);
  }
  const rpBottom = bottomFaceVIds.map(vId => {
    const v = complex.vertexMap.get(vId);
    return { x: v.position3D.x, y: v.position3D.y };
  });
  complex.addFace(bottomFaceVIds, rpBottom);

  // Top face (vertices in CCW order from top viewpoint)
  const topFaceVIds = [];
  for (let i = 0; i < n; i++) {
    topFaceVIds.push(vIds[n + i]);
  }
  const rpTop = topFaceVIds.map(vId => {
    const v = complex.vertexMap.get(vId);
    return { x: v.position3D.x, y: v.position3D.y };
  });
  complex.addFace(topFaceVIds, rpTop);

  // Side faces (n rectangles)
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const sideVIds = [
      vIds[i],
      vIds[next],
      vIds[n + next],
      vIds[n + i]
    ];
    const rpSide = sideVIds.map(vId => {
      const v = complex.vertexMap.get(vId);
      return { x: v.position3D.x, y: v.position3D.y };
    });
    complex.addFace(sideVIds, rpSide);
  }

  complex.cleanAndReindex();
}

// --- 8. TRUNCATED OCTAHEDRON GENERATOR ---
export function generateTruncatedOctahedron(complex) {
  const scale = 1.2;
  
  const tempVertices = [];
  const coords = [0, 1, 2];
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]
  ];
  const signs = [
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  const seenKeys = new Set();
  
  perms.forEach(p => {
    signs.forEach(s => {
      const v = [0, 0, 0];
      v[p[0]] = 0;
      v[p[1]] = 1 * s[0];
      v[p[2]] = 2 * s[1];
      
      const key = `${v[0]},${v[1]},${v[2]}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        tempVertices.push({ x: v[0], y: v[1], z: v[2] });
      }
    });
  });

  const vIds = tempVertices.map(v => {
    return complex.addVertex(v.x * scale, v.y * scale, v.z * scale).id;
  });

  // Squares centered at (+-2, 0, 0) etc.
  const squareCenters = [
    { x: 2, y: 0, z: 0 }, { x: -2, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 }, { x: 0, y: -2, z: 0 },
    { x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: -2 }
  ];

  squareCenters.forEach(c => {
    const mapped = tempVertices.map((v, idx) => {
      const dx = v.x - c.x;
      const dy = v.y - c.y;
      const dz = v.z - c.z;
      return { idx, dist: dx*dx + dy*dy + dz*dz };
    });
    mapped.sort((a, b) => a.dist - b.dist);
    const sqVIdxs = mapped.slice(0, 4).map(item => item.idx);
    
    sqVIdxs.sort((idxA, idxB) => {
      const a = tempVertices[idxA];
      const b = tempVertices[idxB];
      let angleA, angleB;
      if (c.x !== 0) {
        angleA = Math.atan2(a.z, a.y);
        angleB = Math.atan2(b.z, b.y);
      } else if (c.y !== 0) {
        angleA = Math.atan2(a.z, a.x);
        angleB = Math.atan2(b.z, b.x);
      } else {
        angleA = Math.atan2(a.y, a.x);
        angleB = Math.atan2(b.y, b.x);
      }
      return angleA - angleB;
    });

    const rp = sqVIdxs.map(idx => ({ x: tempVertices[idx].x * scale, y: tempVertices[idx].y * scale }));
    complex.addFace(sqVIdxs.map(idx => vIds[idx]), rp);
  });

  // Hexagons centered at (+-1, +-1, +-1)
  const hexCenters = [
    { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: -1 },
    { x: 1, y: -1, z: 1 }, { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: 1 }, { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 }, { x: -1, y: -1, z: -1 }
  ];

  hexCenters.forEach(c => {
    const mapped = tempVertices.map((v, idx) => {
      const dx = v.x - c.x;
      const dy = v.y - c.y;
      const dz = v.z - c.z;
      return { idx, dist: dx*dx + dy*dy + dz*dz };
    });
    mapped.sort((a, b) => a.dist - b.dist);
    const hexVIdxs = mapped.slice(0, 6).map(item => item.idx);

    const nx = c.x, ny = c.y, nz = c.z;
    let ux = -ny, uy = nx, uz = 0;
    if (Math.abs(ux) < 1e-5) { ux = 0; uy = -nz; uz = ny; }
    const uLen = Math.sqrt(ux*ux + uy*uy + uz*uz);
    ux /= uLen; uy /= uLen; uz /= uLen;
    const vx = ny*uz - nz*uy;
    const vy = nz*ux - nx*uz;
    const vz = nx*uy - ny*ux;

    hexVIdxs.sort((idxA, idxB) => {
      const ptA = tempVertices[idxA];
      const ptB = tempVertices[idxB];
      
      const projAx = ptA.x*ux + ptA.y*uy + ptA.z*uz;
      const projAy = ptA.x*vx + ptA.y*vy + ptA.z*vz;
      const projBx = ptB.x*ux + ptB.y*uy + ptB.z*uz;
      const projBy = ptB.x*vx + ptB.y*vy + ptB.z*vz;

      return Math.atan2(projAy, projAx) - Math.atan2(projBy, projBx);
    });

    const rp = hexVIdxs.map(idx => ({ x: tempVertices[idx].x * scale, y: tempVertices[idx].y * scale }));
    complex.addFace(hexVIdxs.map(idx => vIds[idx]), rp);
  });

  complex.cleanAndReindex();
}

// --- 9. CUBE 3D GRID GENERATOR ---
export function generateCubeGrid(complex, nx = 3, ny = 3, nz = 3) {
  const scale = 1.0;
  const vMap = new Map();

  const cx = nx / 2;
  const cy = ny / 2;
  const cz = nz / 2;

  for (let z = 0; z <= nz; z++) {
    for (let y = 0; y <= ny; y++) {
      for (let x = 0; x <= nx; x++) {
        const vx = (x - cx) * scale;
        const vy = (y - cy) * scale;
        const vz = (z - cz) * scale;
        const v = complex.addVertex(vx, vy, vz);
        vMap.set(`${x},${y},${z}`, v.id);
      }
    }
  }

  for (let z = 0; z < nz; z++) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const getV = (dx, dy, dz) => vMap.get(`${x+dx},${y+dy},${z+dz}`);

        const v000 = getV(0, 0, 0);
        const v100 = getV(1, 0, 0);
        const v110 = getV(1, 1, 0);
        const v010 = getV(0, 1, 0);
        const v001 = getV(0, 0, 1);
        const v101 = getV(1, 0, 1);
        const v111 = getV(1, 1, 1);
        const v011 = getV(0, 1, 1);

        const addQuad = (vList) => {
          const rp = vList.map(vId => {
            const v = complex.vertexMap.get(vId);
            return { x: v.position3D.x, y: v.position3D.y };
          });
          complex.addFace(vList, rp);
        };

        addQuad([v000, v100, v110, v010]); // Bottom
        addQuad([v001, v011, v111, v101]); // Top
        addQuad([v000, v001, v101, v100]); // Front
        addQuad([v010, v110, v111, v011]); // Back
        addQuad([v000, v010, v011, v001]); // Left
        addQuad([v100, v101, v111, v110]); // Right
      }
    }
  }

  complex.cleanAndReindex();
}

// --- 10. OCTAHEDRON 2D GRID GENERATOR ---
export function generateOctahedronGrid(complex, cols = 3, rows = 3) {
  const scale = 0.8;
  const spacing = 2.0 * scale;

  const baseVertices = [
    { x: 0, y: 0, z: 1 },  // Top
    { x: 1, y: 0, z: 0 },  // Right
    { x: 0, y: 1, z: 0 },  // Front
    { x: -1, y: 0, z: 0 }, // Left
    { x: 0, y: -1, z: 0 }, // Back
    { x: 0, y: 0, z: -1 }  // Bottom
  ];

  const baseFaces = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
    [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
  ];

  const vIdsGrid = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = c * spacing - (cols - 1) * spacing * 0.5;
      const dy = r * spacing - (rows - 1) * spacing * 0.5;

      const unitVIds = [];
      for (let i = 0; i < 6; i++) {
        const bv = baseVertices[i];
        const vx = bv.x * scale + dx;
        const vy = bv.y * scale + dy;
        const vz = bv.z * scale;
        const v = complex.addVertex(vx, vy, vz);
        unitVIds.push(v.id);
      }

      baseFaces.forEach((f) => {
        const vIds = f.map(idx => unitVIds[idx]);
        const rp = f.map(idx => ({ 
          x: baseVertices[idx].x * scale + dx, 
          y: baseVertices[idx].y * scale + dy 
        }));
        complex.addFace(vIds, rp);
      });

      vIdsGrid.push({ c, r, vIds: unitVIds });
    }
  }

  // Glue adjacent units
  for (let i = 0; i < vIdsGrid.length; i++) {
    const u = vIdsGrid[i];
    
    // Connect to right neighbor
    const right = vIdsGrid.find(n => n.r === u.r && n.c === u.c + 1);
    if (right) {
      complex.mergeVertices(u.vIds[1], right.vIds[3]);
    }

    // Connect to front neighbor
    const front = vIdsGrid.find(n => n.r === u.r + 1 && n.c === u.c);
    if (front) {
      complex.mergeVertices(u.vIds[2], front.vIds[4]);
    }
  }

  complex.cleanAndReindex();
}
