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

/* =========================================================================
   SUBSTITUTION TILING GENERATORS
   ========================================================================= */

const PHI = (1 + Math.sqrt(5)) / 2;

export const SUBSTITUTION_TILING_PRESETS = {
  chair: {
    name: 'Chair substitution',
    seed: 'chair',
    iterations: 4,
    prototiles: {
      chair: {
        polygon: [[0, 0], [1, 0], [1, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]]
      }
    },
    substitution: {
      chair: [
        { type: 'chair', transform: [0.5, 0, 0, 0, 0.5, 0] },
        { type: 'chair', transform: [-0.5, 0, 1, 0, 0.5, 0] },
        { type: 'chair', transform: [0.5, 0, 0, 0, -0.5, 1] },
        { type: 'chair', transform: [0.5, 0, 0.25, 0, 0.5, 0.25] }
      ]
    }
  },
  'fibonacci-strip': {
    name: 'Fibonacci strip substitution',
    seed: 'A',
    iterations: 6,
    prototiles: {
      A: { polygon: [[0, 0], [PHI, 0], [PHI, 1], [0, 1]] },
      B: { polygon: [[0, 0], [1, 0], [1, 1], [0, 1]] }
    },
    substitution: {
      A: [
        { type: 'A', transform: [1 / PHI, 0, 0, 0, 1, 0] },
        { type: 'B', transform: [1 / PHI, 0, 1, 0, 1, 0] }
      ],
      B: [
        { type: 'A', transform: [1 / PHI, 0, 0, 0, 1, 0] }
      ]
    }
  },
  'ammann-beenker': {
    name: 'Ammann-Beenker octagonal projection tiling',
    mode: 'projection-4d',
    iterations: 5,
    projection: {
      method: 'multigrid-dual',
      range: 5,
      connectedPatch: true,
      physicalAngles: [0, 45, 90, 135],
      gridAngles: [0, 45, 90, 135],
      offsets: [0.13, 0.31, 0.47, 0.61],
      scale: 1
    }
  }
};

function composeAffine(parent, child) {
  const [a, b, c, d, e, f] = parent;
  const [g, h, i, j, k, l] = child;
  return [
    a * g + b * j,
    a * h + b * k,
    a * i + b * l + c,
    d * g + e * j,
    d * h + e * k,
    d * i + e * l + f
  ];
}

function transformPoint(t, point) {
  const [a, b, c, d, e, f] = t;
  const x = Array.isArray(point) ? point[0] : point.x;
  const y = Array.isArray(point) ? point[1] : point.y;
  return { x: a * x + b * y + c, y: d * x + e * y + f };
}

function polygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

function normalizePolygon(points) {
  if (polygonArea(points) < 0) {
    return points.slice().reverse();
  }
  return points;
}

function roundCoord(value) {
  return Math.round(value * 1000000) / 1000000;
}

function pointKey(point) {
  return `${roundCoord(point.x)},${roundCoord(point.y)}`;
}

function validateSubstitutionDefinition(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('Substitution definition must be an object.');
  }
  if (definition.mode === 'projection-4d') {
    const projection = definition.projection || {};
    if (!Array.isArray(projection.physicalAngles)) {
      throw new Error('Projection-4d definition requires physicalAngles.');
    }
    if (projection.physicalAngles.length !== 4) {
      throw new Error('Projection-4d physicalAngles must contain exactly 4 directions.');
    }
    if (projection.gridAngles !== undefined && (!Array.isArray(projection.gridAngles) || projection.gridAngles.length !== 4)) {
      throw new Error('Projection-4d gridAngles must contain exactly 4 directions when provided.');
    }
    return;
  }
  if (!definition.seed || !definition.prototiles || !definition.substitution) {
    throw new Error('Substitution definition requires seed, prototiles, and substitution.');
  }
  for (const [name, proto] of Object.entries(definition.prototiles)) {
    if (!Array.isArray(proto.polygon) || proto.polygon.length < 3) {
      throw new Error(`Prototile "${name}" needs a polygon with at least 3 points.`);
    }
  }
  for (const [name, children] of Object.entries(definition.substitution)) {
    if (!definition.prototiles[name] || !Array.isArray(children)) {
      throw new Error(`Substitution rule "${name}" must target an existing prototile and contain child tiles.`);
    }
    children.forEach((child, index) => {
      if (!definition.prototiles[child.type]) {
        throw new Error(`Child ${index + 1} of "${name}" references unknown prototile "${child.type}".`);
      }
      if (!Array.isArray(child.transform) || child.transform.length !== 6) {
        throw new Error(`Child ${index + 1} of "${name}" needs a 6-number affine transform.`);
      }
    });
  }
}

export function cloneSubstitutionPreset(name) {
  const preset = SUBSTITUTION_TILING_PRESETS[name] || SUBSTITUTION_TILING_PRESETS.chair;
  return JSON.parse(JSON.stringify(preset));
}

export function generateSubstitutionTiling(complex, definition, iterations = 4) {
  validateSubstitutionDefinition(definition);

  if (definition.mode === 'projection-4d') {
    generateProjection4DTiling(complex, definition, iterations);
    return;
  }

  const maxIterations = Math.max(0, Math.min(10, parseInt(iterations, 10) || 0));
  let tiles = [{ type: definition.seed, transform: [1, 0, 0, 0, 1, 0] }];

  for (let i = 0; i < maxIterations; i++) {
    const next = [];
    for (const tile of tiles) {
      const children = definition.substitution[tile.type];
      if (!children) {
        next.push(tile);
        continue;
      }
      children.forEach(child => {
        next.push({
          type: child.type,
          transform: composeAffine(tile.transform, child.transform)
        });
      });
    }
    tiles = next;
  }

  const vertexMap = new Map();
  const getVertexId = (point) => {
    const key = pointKey(point);
    if (vertexMap.has(key)) return vertexMap.get(key);
    const vertex = complex.addVertex(roundCoord(point.x), roundCoord(point.y), 0);
    vertex.tags.push('substitution-vertex');
    vertexMap.set(key, vertex.id);
    return vertex.id;
  };

  tiles.forEach(tile => {
    const proto = definition.prototiles[tile.type];
    const polygon = normalizePolygon(proto.polygon.map(point => transformPoint(tile.transform, point)));
    const vertexIds = polygon.map(getVertexId);
    const renderPoints = polygon.map(point => ({ x: roundCoord(point.x), y: roundCoord(point.y) }));
    const face = complex.addFace(vertexIds, renderPoints);
    face.tags.push('substitution-tile', `tile:${tile.type}`);
  });
}

export function generateChairSubstitutionTiling(complex, iterations = 4) {
  generateSubstitutionTiling(complex, cloneSubstitutionPreset('chair'), iterations);
}

export function generateFibonacciStripTiling(complex, iterations = 6) {
  generateSubstitutionTiling(complex, cloneSubstitutionPreset('fibonacci-strip'), iterations);
}

function angleVector(degrees) {
  const radians = degrees * Math.PI / 180;
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

function addBasis(coords, index) {
  const next = coords.slice();
  next[index]++;
  return next;
}

function projectLatticePoint(coords, basis, scale = 1) {
  return coords.reduce((sum, value, index) => ({
    x: sum.x + value * basis[index].x * scale,
    y: sum.y + value * basis[index].y * scale
  }), { x: 0, y: 0 });
}

function dotPoint(a, b) {
  return a.x * b.x + a.y * b.y;
}

function canonicalCycleKey(keys) {
  const variants = [];
  const forward = keys.slice();
  const backward = keys.slice().reverse();
  [forward, backward].forEach(order => {
    for (let i = 0; i < order.length; i++) {
      variants.push(order.slice(i).concat(order.slice(0, i)).join('|'));
    }
  });
  variants.sort();
  return variants[0];
}

function tileEdgeKey(a, b) {
  return [pointKey(a), pointKey(b)].sort().join('|');
}

function keepLargestConnectedTilePatch(tiles) {
  if (tiles.length === 0) return tiles;

  const adjacency = tiles.map(() => new Set());
  const edgeOwners = new Map();
  tiles.forEach((tile, tileIndex) => {
    for (let i = 0; i < tile.points.length; i++) {
      const key = tileEdgeKey(tile.points[i], tile.points[(i + 1) % tile.points.length]);
      if (!edgeOwners.has(key)) edgeOwners.set(key, []);
      edgeOwners.get(key).push(tileIndex);
    }
  });

  edgeOwners.forEach(indices => {
    if (indices.length < 2) return;
    indices.forEach(a => {
      indices.forEach(b => {
        if (a !== b) adjacency[a].add(b);
      });
    });
  });

  const seen = new Set();
  let best = [];
  tiles.forEach((_, index) => {
    if (seen.has(index)) return;
    const component = [];
    const stack = [index];
    seen.add(index);
    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      adjacency[current].forEach(next => {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      });
    }
    if (component.length > best.length) best = component;
  });

  const keep = new Set(best);
  return tiles.filter((_, index) => keep.has(index));
}

function generateProjection4DTiling(complex, definition, iterations = 5) {
  const projection = definition.projection || {};
  const fallbackRange = projection.range !== undefined ? projection.range : definition.iterations;
  const rawRange = iterations !== undefined ? iterations : fallbackRange;
  const range = Math.max(2, Math.min(8, parseInt(rawRange, 10) || 5));
  const scale = Number(projection.scale) || 1;
  const physicalBasis = projection.physicalAngles.map(angleVector);
  const gridAngles = projection.gridAngles || projection.physicalAngles;
  const gridNormals = gridAngles.map(angleVector);
  const offsets = projection.offsets || [0.13, 0.31, 0.47, 0.61];
  const seenTiles = new Set();
  const tiles = [];

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const ni = gridNormals[i];
      const nj = gridNormals[j];
      const det = ni.x * nj.y - ni.y * nj.x;
      if (Math.abs(det) < 1e-9) continue;

      for (let mi = -range; mi <= range; mi++) {
        for (let mj = -range; mj <= range; mj++) {
          const ci = mi + offsets[i];
          const cj = mj + offsets[j];
          const intersection = {
            x: (ci * nj.y - ni.y * cj) / det,
            y: (ni.x * cj - ci * nj.x) / det
          };
          const indices = gridNormals.map((normal, index) => (
            Math.ceil(dotPoint(normal, intersection) - offsets[index] - 1e-9)
          ));

          const b = indices;
          const bi = addBasis(b, i);
          const bij = addBasis(bi, j);
          const bj = addBasis(b, j);
          let points = [
            projectLatticePoint(b, physicalBasis, scale),
            projectLatticePoint(bi, physicalBasis, scale),
            projectLatticePoint(bij, physicalBasis, scale),
            projectLatticePoint(bj, physicalBasis, scale)
          ].map(point => ({ x: roundCoord(point.x), y: roundCoord(point.y) }));

          if (signedPolygonArea(points) < 0) points = points.reverse();
          const tileKey = canonicalCycleKey(points.map(pointKey));
          if (seenTiles.has(tileKey)) continue;
          seenTiles.add(tileKey);

          const area = Math.abs(signedPolygonArea(points));
          tiles.push({
            type: area > 0.85 * scale * scale ? 'square' : 'rhomb-45',
            points
          });
        }
      }
    }
  }

  const patchTiles = projection.connectedPatch === false ? tiles : keepLargestConnectedTilePatch(tiles);

  addPolygonTilingFaces(
    complex,
    patchTiles,
    ['ammann-beenker-vertex', 'projection-vertex', 'substitution-vertex'],
    ['ammann-beenker-tile', 'projection-tile', 'substitution-tile']
  );
}

export function generateAmmannBeenkerTiling(complex, iterations = 5) {
  generateSubstitutionTiling(complex, cloneSubstitutionPreset('ammann-beenker'), iterations);
}

function interpPoint(a, b, ratio) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio
  };
}

function buildPenroseTriangles(iterations = 5) {
  const maxIterations = Math.max(0, Math.min(8, parseInt(iterations, 10) || 0));
  const seedRadius = 1;
  let triangles = [];

  for (let i = 0; i < 10; i++) {
    const a0 = (2 * Math.PI * i) / 10;
    const a1 = (2 * Math.PI * (i + 1)) / 10;
    const p0 = { x: seedRadius * Math.cos(a0), y: seedRadius * Math.sin(a0) };
    const p1 = { x: seedRadius * Math.cos(a1), y: seedRadius * Math.sin(a1) };
    if (i % 2 === 0) {
      triangles.push({ type: 'thin', points: [{ x: 0, y: 0 }, p0, p1] });
    } else {
      triangles.push({ type: 'thin', points: [{ x: 0, y: 0 }, p1, p0] });
    }
  }

  for (let i = 0; i < maxIterations; i++) {
    const next = [];
    triangles.forEach(tile => {
      const [a, b, c] = tile.points;
      if (tile.type === 'thin') {
        const p = interpPoint(a, b, 1 / PHI);
        next.push({ type: 'thin', points: [c, p, b] });
        next.push({ type: 'thick', points: [p, c, a] });
      } else {
        const q = interpPoint(b, a, 1 / PHI);
        const r = interpPoint(b, c, 1 / PHI);
        next.push({ type: 'thick', points: [r, c, a] });
        next.push({ type: 'thick', points: [q, r, b] });
        next.push({ type: 'thin', points: [r, q, a] });
      }
    });
    triangles = next;
  }

  return triangles;
}

function addPolygonTilingFaces(complex, tiles, vertexTags = [], faceTags = []) {
  const vertexMap = new Map();
  const getVertexId = (point) => {
    const key = pointKey(point);
    if (vertexMap.has(key)) return vertexMap.get(key);
    const vertex = complex.addVertex(roundCoord(point.x), roundCoord(point.y), 0);
    vertex.tags.push(...vertexTags);
    vertexMap.set(key, vertex.id);
    return vertex.id;
  };

  tiles.forEach(tile => {
    const polygon = normalizePolygon(tile.points.map(point => ({ x: point.x, y: point.y })));
    const vertexIds = polygon.map(getVertexId);
    const renderPoints = polygon.map(point => ({ x: roundCoord(point.x), y: roundCoord(point.y) }));
    const face = complex.addFace(vertexIds, renderPoints);
    face.tags.push(...faceTags, `tile:${tile.type}`);
  });
}

function signedPolygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

function orderPolygonAroundCenter(points) {
  const unique = [];
  const seen = new Set();
  points.forEach(point => {
    const key = pointKey(point);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ x: point.x, y: point.y });
    }
  });

  const center = unique.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y
  }), { x: 0, y: 0 });
  center.x /= unique.length || 1;
  center.y /= unique.length || 1;

  return normalizePolygon(unique.sort((a, b) => (
    Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x)
  )));
}

function matchPenroseTrianglePairs(triangles) {
  const edgeMap = new Map();
  const left = [];
  const adjacency = new Map();

  triangles.forEach((triangle, triangleIndex) => {
    triangle.orientation = signedPolygonArea(triangle.points) >= 0 ? 'left' : 'right';
    if (triangle.orientation === 'left') left.push(triangleIndex);

    for (let i = 0; i < 3; i++) {
      const a = triangle.points[i];
      const b = triangle.points[(i + 1) % 3];
      const key = [pointKey(a), pointKey(b)].sort().join('|');
      if (!edgeMap.has(key)) edgeMap.set(key, []);
      edgeMap.get(key).push({
        triangleIndex,
        edgeLength: Math.hypot(a.x - b.x, a.y - b.y)
      });
    }
  });

  edgeMap.forEach(shared => {
    if (shared.length !== 2) return;
    const first = triangles[shared[0].triangleIndex];
    const second = triangles[shared[1].triangleIndex];
    if (first.type !== second.type || first.orientation === second.orientation) return;

    const leftIndex = first.orientation === 'left' ? shared[0].triangleIndex : shared[1].triangleIndex;
    const rightIndex = first.orientation === 'right' ? shared[0].triangleIndex : shared[1].triangleIndex;
    const edgeLength = (shared[0].edgeLength + shared[1].edgeLength) / 2;
    if (!adjacency.has(leftIndex)) adjacency.set(leftIndex, []);
    adjacency.get(leftIndex).push({ rightIndex, edgeLength });
  });

  adjacency.forEach(matches => {
    matches.sort((a, b) => a.edgeLength - b.edgeLength);
  });

  const matchedRight = new Map();
  const visit = (leftIndex, seen) => {
    for (const candidate of adjacency.get(leftIndex) || []) {
      if (seen.has(candidate.rightIndex)) continue;
      seen.add(candidate.rightIndex);
      if (!matchedRight.has(candidate.rightIndex) || visit(matchedRight.get(candidate.rightIndex), seen)) {
        matchedRight.set(candidate.rightIndex, leftIndex);
        return true;
      }
    }
    return false;
  };

  left.forEach(leftIndex => {
    visit(leftIndex, new Set());
  });

  return Array.from(matchedRight.entries()).map(([rightIndex, leftIndex]) => [leftIndex, rightIndex]);
}

export function generatePenroseTriangleTiling(complex, iterations = 5) {
  addPolygonTilingFaces(
    complex,
    buildPenroseTriangles(iterations),
    ['penrose-vertex', 'substitution-vertex'],
    ['penrose-triangle', 'substitution-tile']
  );
}

export function generatePenroseRhombTiling(complex, iterations = 5) {
  const triangles = buildPenroseTriangles(iterations);
  const pairs = matchPenroseTrianglePairs(triangles);
  const used = new Set();
  const tiles = [];

  pairs.forEach(([aIndex, bIndex]) => {
    const first = triangles[aIndex];
    const second = triangles[bIndex];
    used.add(aIndex);
    used.add(bIndex);
    tiles.push({
      type: `${first.type}-rhomb`,
      points: orderPolygonAroundCenter([...first.points, ...second.points])
    });
  });

  triangles.forEach((triangle, index) => {
    if (!used.has(index)) {
      tiles.push({
        type: `${triangle.type}-boundary-triangle`,
        points: triangle.points
      });
    }
  });

  addPolygonTilingFaces(
    complex,
    tiles,
    ['penrose-vertex', 'substitution-vertex'],
    ['penrose-rhomb', 'substitution-tile']
  );
}

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

// --- 5. HYPERBOLIC-LIKE DISK PATCH GENERATORS ---
// Finite Poincare-disk-inspired patches. These are visual/combinatorial
// approximations: cells branch outward so local degree grows toward the rim.
export function generateHyperbolicDiskGrid(complex, layers = 5, baseSectors = 8, variant = 'quad') {
  const safeLayers = Math.max(2, Math.min(8, parseInt(layers, 10) || 5));
  const safeBase = Math.max(5, Math.min(12, parseInt(baseSectors, 10) || 8));
  const growth = 2;
  const curvature = 2.35;
  const vertexMap = new Map();

  const radiusAt = (ring) => {
    if (ring <= 0) return 0;
    return Math.tanh((ring / safeLayers) * curvature);
  };

  const getVertex = (radius, angle) => {
    if (radius < 1e-6) {
      if (vertexMap.has('center')) return vertexMap.get('center');
      const v = complex.addVertex(0, 0, 0);
      vertexMap.set('center', v.id);
      return v.id;
    }

    const x = radius * Math.cos(angle) * safeLayers;
    const y = radius * Math.sin(angle) * safeLayers;
    const key = `${x.toFixed(5)},${y.toFixed(5)}`;
    if (vertexMap.has(key)) return vertexMap.get(key);
    const v = complex.addVertex(x, y, 0);
    vertexMap.set(key, v.id);
    return v.id;
  };

  const point = (radius, angle) => ({
    x: radius * Math.cos(angle) * safeLayers,
    y: radius * Math.sin(angle) * safeLayers
  });

  const addFaceByPolar = (polarPoints) => {
    const vertexIds = polarPoints.map(p => getVertex(p.radius, p.angle));
    const uniqueIds = new Set(vertexIds);
    if (uniqueIds.size < 3) return;
    const renderPoints = polarPoints.map(p => point(p.radius, p.angle));
    complex.addFace(vertexIds, renderPoints);
  };

  for (let ring = 0; ring < safeLayers; ring++) {
    const innerRadius = radiusAt(ring);
    const outerRadius = radiusAt(ring + 1);
    const sectors = safeBase * Math.pow(growth, ring);

    for (let i = 0; i < sectors; i++) {
      const a0 = (2 * Math.PI * i) / sectors;
      const a1 = (2 * Math.PI * (i + 1)) / sectors;
      const am = (a0 + a1) / 2;

      if (ring === 0) {
        addFaceByPolar([
          { radius: innerRadius, angle: am },
          { radius: outerRadius, angle: a0 },
          { radius: outerRadius, angle: a1 }
        ]);
      } else if (variant === 'triangles') {
          addFaceByPolar([
            { radius: innerRadius, angle: a0 },
            { radius: outerRadius, angle: a0 },
            { radius: outerRadius, angle: a1 }
          ]);
          addFaceByPolar([
            { radius: innerRadius, angle: a0 },
            { radius: outerRadius, angle: a1 },
            { radius: innerRadius, angle: a1 }
          ]);
      } else if (variant === 'heptagons' && ring > 0) {
        const aThird = a0 + (a1 - a0) / 3;
        const aTwoThirds = a0 + (2 * (a1 - a0)) / 3;
        addFaceByPolar([
          { radius: innerRadius, angle: a0 },
          { radius: innerRadius, angle: aThird },
          { radius: innerRadius, angle: aTwoThirds },
          { radius: innerRadius, angle: a1 },
          { radius: outerRadius, angle: a1 },
          { radius: outerRadius, angle: am },
          { radius: outerRadius, angle: a0 }
        ]);
      } else {
        addFaceByPolar([
          { radius: innerRadius, angle: a0 },
          { radius: outerRadius, angle: a0 },
          { radius: outerRadius, angle: a1 },
          { radius: innerRadius, angle: a1 }
        ]);
      }
    }
  }

  complex.cleanAndReindex();
}

export function generateHyperbolicSquarePatch(complex, layers = 5) {
  generateHyperbolicDiskGrid(complex, layers, 8, 'quad');
}

export function generateHyperbolicTrianglePatch(complex, layers = 5) {
  generateHyperbolicDiskGrid(complex, layers, 7, 'triangles');
}

export function generateHyperbolicHeptagonPatch(complex, layers = 5) {
  generateHyperbolicDiskGrid(complex, layers, 7, 'heptagons');
}

function solveGeodesicCircleThrough(a, b) {
  const rhsA = (a.x * a.x + a.y * a.y + 1) / 2;
  const rhsB = (b.x * b.x + b.y * b.y + 1) / 2;
  const det = a.x * b.y - a.y * b.x;
  if (Math.abs(det) < 1e-10) return null;

  const cx = (rhsA * b.y - a.y * rhsB) / det;
  const cy = (a.x * rhsB - rhsA * b.x) / det;
  const r2 = cx * cx + cy * cy - 1;
  if (r2 <= 0) return null;
  return { x: cx, y: cy, radiusSquared: r2 };
}

function reflectPointInCircle(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  const d2 = dx * dx + dy * dy;
  if (d2 < 1e-12) return { x: point.x, y: point.y };
  const scale = circle.radiusSquared / d2;
  return {
    x: circle.x + dx * scale,
    y: circle.y + dy * scale
  };
}

function polygonCentroid(points) {
  const sum = points.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y
  }), { x: 0, y: 0 });
  return {
    x: sum.x / (points.length || 1),
    y: sum.y / (points.length || 1)
  };
}

function hyperbolicPolygonKey(points) {
  return points.map(point => `${point.x.toFixed(5)},${point.y.toFixed(5)}`).sort().join('|');
}

function hyperbolicEdgeKey(a, b) {
  return [`${a.x.toFixed(5)},${a.y.toFixed(5)}`, `${b.x.toFixed(5)},${b.y.toFixed(5)}`].sort().join('|');
}

function polygonEdgeKeys(points) {
  const keys = [];
  for (let i = 0; i < points.length; i++) {
    keys.push(hyperbolicEdgeKey(points[i], points[(i + 1) % points.length]));
  }
  return keys;
}

function reflectPolygonAcrossEdge(points, edgeIndex) {
  const a = points[edgeIndex];
  const b = points[(edgeIndex + 1) % points.length];
  const circle = solveGeodesicCircleThrough(a, b);
  if (!circle) return null;
  return normalizePolygon(points.map(point => reflectPointInCircle(point, circle)));
}

export function generateHyperbolicRegularHeptagonTiling(complex, layers = 4) {
  const parsedLayers = parseInt(layers, 10);
  const safeLayers = Math.max(0, Math.min(4, Number.isNaN(parsedLayers) ? 3 : parsedLayers));
  const p = 7;
  const q = 3;
  const euclideanRadius = Math.sqrt(
    Math.cos(Math.PI / q + Math.PI / p) / Math.cos(Math.PI / q - Math.PI / p)
  );
  const seed = [];

  for (let i = 0; i < p; i++) {
    const angle = (2 * Math.PI * i) / p + Math.PI / 2;
    seed.push({
      x: euclideanRadius * Math.cos(angle),
      y: euclideanRadius * Math.sin(angle)
    });
  }

  const polygons = [{ points: normalizePolygon(seed), depth: 0 }];
  const queue = [polygons[0]];
  const seen = new Set([hyperbolicPolygonKey(seed)]);
  const edgeUse = new Map();
  polygonEdgeKeys(seed).forEach(key => edgeUse.set(key, 1));

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= safeLayers) continue;

    for (let edgeIndex = 0; edgeIndex < p; edgeIndex++) {
      const reflected = reflectPolygonAcrossEdge(current.points, edgeIndex);
      if (!reflected) continue;

      const center = polygonCentroid(reflected);
      const centerRadius = Math.hypot(center.x, center.y);
      if (centerRadius >= 0.995) continue;

      const key = hyperbolicPolygonKey(reflected);
      if (seen.has(key)) continue;

      const edgeKeys = polygonEdgeKeys(reflected);
      if (edgeKeys.some(edgeKey => (edgeUse.get(edgeKey) || 0) >= 2)) continue;
      seen.add(key);
      edgeKeys.forEach(edgeKey => edgeUse.set(edgeKey, (edgeUse.get(edgeKey) || 0) + 1));

      const tile = { points: reflected, depth: current.depth + 1 };
      polygons.push(tile);
      queue.push(tile);
    }
  }

  const displayScale = Math.max(3, safeLayers + 2);
  const vertexMap = new Map();
  const getVertexId = (point) => {
    const scaled = { x: point.x * displayScale, y: point.y * displayScale };
    const key = pointKey(scaled);
    if (vertexMap.has(key)) return vertexMap.get(key);
    const vertex = complex.addVertex(roundCoord(scaled.x), roundCoord(scaled.y), 0);
    vertex.tags.push('hyperbolic-vertex', 'regular-7-3');
    vertexMap.set(key, vertex.id);
    return vertex.id;
  };

  polygons.forEach(tile => {
    const vertexIds = tile.points.map(getVertexId);
    const renderPoints = tile.points.map(point => ({
      x: roundCoord(point.x * displayScale),
      y: roundCoord(point.y * displayScale)
    }));
    const face = complex.addFace(vertexIds, renderPoints);
    face.tags.push('hyperbolic-regular-heptagon', 'tiling:7-3', `depth:${tile.depth}`);
  });
}

/* =========================================================================
   POLYHEDRON HELPERS
   ========================================================================= */

function addPolyhedronFromData(complex, vertices, faces, scale = 1.5) {
  const center = vertices.reduce((acc, v) => ({
    x: acc.x + v.x,
    y: acc.y + v.y,
    z: acc.z + v.z
  }), { x: 0, y: 0, z: 0 });
  center.x /= vertices.length;
  center.y /= vertices.length;
  center.z /= vertices.length;

  const vIds = vertices.map(v => complex.addVertex(
    (v.x - center.x) * scale,
    (v.y - center.y) * scale,
    (v.z - center.z) * scale
  ).id);

  faces.forEach(face => {
    const faceIds = face.map(idx => vIds[idx]);
    const rp = face.map(idx => ({
      x: (vertices[idx].x - center.x) * scale,
      y: (vertices[idx].y - center.y) * scale
    }));
    complex.addFace(faceIds, rp);
  });

  complex.cleanAndReindex();
}

function uniqueFace(indices) {
  const result = [];
  indices.forEach(id => {
    if (result.length === 0 || result[result.length - 1] !== id) {
      result.push(id);
    }
  });
  if (result.length > 1 && result[0] === result[result.length - 1]) {
    result.pop();
  }
  return result;
}

function getPlatonicData(type) {
  const phi = (1 + Math.sqrt(5)) / 2;

  if (type === 'tetrahedron') {
    return {
      vertices: [
        { x: 1, y: 1, z: 1 },
        { x: -1, y: -1, z: 1 },
        { x: -1, y: 1, z: -1 },
        { x: 1, y: -1, z: -1 }
      ],
      faces: [
        [0, 1, 2],
        [0, 2, 3],
        [0, 3, 1],
        [1, 3, 2]
      ]
    };
  }

  if (type === 'cube') {
    return {
      vertices: [
        { x: -1, y: -1, z: -1 },
        { x: 1, y: -1, z: -1 },
        { x: 1, y: 1, z: -1 },
        { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },
        { x: 1, y: -1, z: 1 },
        { x: 1, y: 1, z: 1 },
        { x: -1, y: 1, z: 1 }
      ],
      faces: [
        [0, 1, 2, 3],
        [4, 7, 6, 5],
        [0, 4, 5, 1],
        [2, 6, 7, 3],
        [0, 3, 7, 4],
        [1, 5, 6, 2]
      ]
    };
  }

  if (type === 'octahedron') {
    return {
      vertices: [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 }
      ],
      faces: [
        [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
        [0, 5, 2], [2, 5, 1], [1, 5, 3], [3, 5, 0]
      ]
    };
  }

  if (type === 'dodecahedron') {
    const b = 1 / phi;
    const c = phi;
    return {
      vertices: [
        { x: -1, y: -1, z: -1 }, { x: -1, y: -1, z: 1 }, { x: -1, y: 1, z: -1 }, { x: -1, y: 1, z: 1 },
        { x: 1, y: -1, z: -1 }, { x: 1, y: -1, z: 1 }, { x: 1, y: 1, z: -1 }, { x: 1, y: 1, z: 1 },
        { x: 0, y: -b, z: -c }, { x: 0, y: -b, z: c }, { x: 0, y: b, z: -c }, { x: 0, y: b, z: c },
        { x: -b, y: -c, z: 0 }, { x: -b, y: c, z: 0 }, { x: b, y: -c, z: 0 }, { x: b, y: c, z: 0 },
        { x: -c, y: 0, z: -b }, { x: -c, y: 0, z: b }, { x: c, y: 0, z: -b }, { x: c, y: 0, z: b }
      ],
      faces: [
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
      ]
    };
  }

  if (type === 'icosahedron') {
    return {
      vertices: [
        { x: -1, y: phi, z: 0 }, { x: 1, y: phi, z: 0 }, { x: -1, y: -phi, z: 0 }, { x: 1, y: -phi, z: 0 },
        { x: 0, y: -1, z: phi }, { x: 0, y: 1, z: phi }, { x: 0, y: -1, z: -phi }, { x: 0, y: 1, z: -phi },
        { x: phi, y: 0, z: -1 }, { x: phi, y: 0, z: 1 }, { x: -phi, y: 0, z: -1 }, { x: -phi, y: 0, z: 1 }
      ],
      faces: [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
      ]
    };
  }

  return { vertices: [], faces: [] };
}

function derivePolyhedronData(source, cut = 1 / 3) {
  const vertices = [];
  const faces = [];
  const pointMap = new Map();

  const getPointId = (a, b) => {
    const va = source.vertices[a];
    const vb = source.vertices[b];
    const p = {
      x: va.x * (1 - cut) + vb.x * cut,
      y: va.y * (1 - cut) + vb.y * cut,
      z: va.z * (1 - cut) + vb.z * cut
    };
    const key = `${p.x.toFixed(6)},${p.y.toFixed(6)},${p.z.toFixed(6)}`;
    if (pointMap.has(key)) return pointMap.get(key);
    const id = vertices.length;
    vertices.push(p);
    pointMap.set(key, id);
    return id;
  };

  source.faces.forEach(face => {
    const expanded = [];
    for (let i = 0; i < face.length; i++) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      expanded.push(getPointId(a, b));
      expanded.push(getPointId(b, a));
    }
    const cleanFace = uniqueFace(expanded);
    if (cleanFace.length >= 3) faces.push(cleanFace);
  });

  source.vertices.forEach((vertex, vertexIndex) => {
    const neighbors = new Set();
    source.faces.forEach(face => {
      const idx = face.indexOf(vertexIndex);
      if (idx !== -1) {
        neighbors.add(face[(idx + 1) % face.length]);
        neighbors.add(face[(idx - 1 + face.length) % face.length]);
      }
    });

    const normal = { ...vertex };
    const nLen = Math.hypot(normal.x, normal.y, normal.z) || 1;
    normal.x /= nLen;
    normal.y /= nLen;
    normal.z /= nLen;

    const base = Math.abs(normal.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
    let ux = base.y * normal.z - base.z * normal.y;
    let uy = base.z * normal.x - base.x * normal.z;
    let uz = base.x * normal.y - base.y * normal.x;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen;
    uy /= uLen;
    uz /= uLen;
    const vx = normal.y * uz - normal.z * uy;
    const vy = normal.z * ux - normal.x * uz;
    const vz = normal.x * uy - normal.y * ux;

    const cap = Array.from(neighbors).map(neighbor => {
      const pId = getPointId(vertexIndex, neighbor);
      const p = vertices[pId];
      const dx = p.x - vertex.x;
      const dy = p.y - vertex.y;
      const dz = p.z - vertex.z;
      return {
        id: pId,
        angle: Math.atan2(dx * vx + dy * vy + dz * vz, dx * ux + dy * uy + dz * uz)
      };
    }).sort((a, b) => a.angle - b.angle).map(item => item.id);

    const cleanCap = uniqueFace(cap);
    if (cleanCap.length >= 3) faces.push(cleanCap);
  });

  return { vertices, faces };
}

function generateDerivedPolyhedron(complex, sourceType, cut = 1 / 3, scale = 1.35) {
  const data = derivePolyhedronData(getPlatonicData(sourceType), cut);
  addPolyhedronFromData(complex, data.vertices, data.faces, scale);
}

function allSignedTuples(values) {
  const tuples = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        tuples.push([sx * values[0], sy * values[1], sz * values[2]]);
      }
    }
  }
  return tuples;
}

function permutationParity(perm) {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions % 2;
}

function permuteTuple(tuple, perm) {
  return [tuple[perm[0]], tuple[perm[1]], tuple[perm[2]]];
}

function addUniquePoint(points, seen, tuple) {
  const key = tuple.map(v => v.toFixed(8)).join(',');
  if (seen.has(key)) return;
  seen.add(key);
  points.push({ x: tuple[0], y: tuple[1], z: tuple[2] });
}

function signedPermutations(values, options = {}) {
  const points = [];
  const seen = new Set();
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2],
    [1, 2, 0], [2, 0, 1], [2, 1, 0]
  ];
  const allowedParity = options.parity;
  const minusParity = options.minusParity;

  allSignedTuples(values).forEach(tuple => {
    const minusCount = tuple.filter(v => v < 0).length;
    if (minusParity !== undefined && minusCount % 2 !== minusParity) return;

    perms.forEach(perm => {
      if (allowedParity !== undefined && permutationParity(perm) !== allowedParity) return;
      addUniquePoint(points, seen, permuteTuple(tuple, perm));
    });
  });

  return points;
}

function tribonacciConstant() {
  let t = 1.84;
  for (let i = 0; i < 12; i++) {
    const f = t * t * t - t * t - t - 1;
    const df = 3 * t * t - 2 * t - 1;
    t -= f / df;
  }
  return t;
}

function addConvexHullPolyhedron(complex, vertices, scale = 1) {
  const EPS = 1e-5;
  const faces = [];
  const planeMap = new Map();

  for (let i = 0; i < vertices.length - 2; i++) {
    for (let j = i + 1; j < vertices.length - 1; j++) {
      for (let k = j + 1; k < vertices.length; k++) {
        const a = vertices[i];
        const b = vertices[j];
        const c = vertices[k];
        const ux = b.x - a.x;
        const uy = b.y - a.y;
        const uz = b.z - a.z;
        const vx = c.x - a.x;
        const vy = c.y - a.y;
        const vz = c.z - a.z;
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz);
        if (len < EPS) continue;
        nx /= len;
        ny /= len;
        nz /= len;

        let d = -(nx * a.x + ny * a.y + nz * a.z);
        let minDist = Infinity;
        let maxDist = -Infinity;
        vertices.forEach(p => {
          const dist = nx * p.x + ny * p.y + nz * p.z + d;
          if (dist < minDist) minDist = dist;
          if (dist > maxDist) maxDist = dist;
        });

        if (minDist < -EPS && maxDist > EPS) continue;
        if (maxDist > EPS) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
          d = -d;
        }

        const coplanar = [];
        vertices.forEach((p, idx) => {
          const dist = nx * p.x + ny * p.y + nz * p.z + d;
          if (Math.abs(dist) < EPS * 8) coplanar.push(idx);
        });
        if (coplanar.length < 3) continue;

        const key = [
          Math.round(nx * 100000),
          Math.round(ny * 100000),
          Math.round(nz * 100000),
          Math.round(d * 100000)
        ].join(',');
        if (!planeMap.has(key)) {
          planeMap.set(key, { normal: { x: nx, y: ny, z: nz }, vertices: coplanar });
        }
      }
    }
  }

  planeMap.forEach(face => {
    const center = face.vertices.reduce((acc, idx) => ({
      x: acc.x + vertices[idx].x,
      y: acc.y + vertices[idx].y,
      z: acc.z + vertices[idx].z
    }), { x: 0, y: 0, z: 0 });
    center.x /= face.vertices.length;
    center.y /= face.vertices.length;
    center.z /= face.vertices.length;

    const n = face.normal;
    const base = Math.abs(n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
    let ux = base.y * n.z - base.z * n.y;
    let uy = base.z * n.x - base.x * n.z;
    let uz = base.x * n.y - base.y * n.x;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    ux /= uLen;
    uy /= uLen;
    uz /= uLen;
    const vx = n.y * uz - n.z * uy;
    const vy = n.z * ux - n.x * uz;
    const vz = n.x * uy - n.y * ux;

    const ordered = face.vertices.map(idx => {
      const p = vertices[idx];
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      const dz = p.z - center.z;
      return {
        idx,
        angle: Math.atan2(dx * vx + dy * vy + dz * vz, dx * ux + dy * uy + dz * uz)
      };
    }).sort((a, b) => a.angle - b.angle).map(item => item.idx);

    faces.push(ordered);
  });

  addPolyhedronFromData(complex, vertices, faces, scale);
}

export function generateRhombicuboctahedron(complex) {
  const a = 1 + Math.SQRT2;
  addConvexHullPolyhedron(complex, signedPermutations([1, 1, a]), 0.9);
}

export function generateTruncatedCuboctahedron(complex) {
  const a = 1 + Math.SQRT2;
  const b = 1 + 2 * Math.SQRT2;
  addConvexHullPolyhedron(complex, signedPermutations([1, a, b]), 0.65);
}

export function generateSnubCube(complex) {
  const t = tribonacciConstant();
  const points = [];
  const seen = new Set();
  const perms = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2],
    [1, 2, 0], [2, 0, 1], [2, 1, 0]
  ];

  allSignedTuples([1, 1 / t, t]).forEach(tuple => {
    const plusParity = tuple.filter(v => v > 0).length % 2;
    perms.forEach(perm => {
      const parity = permutationParity(perm);
      if ((parity === 0 && plusParity === 0) || (parity === 1 && plusParity === 1)) {
        addUniquePoint(points, seen, permuteTuple(tuple, perm));
      }
    });
  });

  addConvexHullPolyhedron(complex, points, 1.25);
}

export function generateRhombicosidodecahedron(complex) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const points = [
    ...signedPermutations([1, 1, phi ** 3], { parity: 0 }),
    ...signedPermutations([phi ** 2, phi, 2 * phi], { parity: 0 }),
    ...signedPermutations([2 + phi, 0, phi ** 2], { parity: 0 })
  ];
  addConvexHullPolyhedron(complex, points, 0.55);
}

export function generateTruncatedIcosidodecahedron(complex) {
  const icosidodecahedron = derivePolyhedronData(getPlatonicData('icosahedron'), 0.5);
  const truncated = derivePolyhedronData(icosidodecahedron, 1 / 3);
  addPolyhedronFromData(complex, truncated.vertices, truncated.faces, 1.2);
}

export function generateSnubDodecahedron(complex) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const points = [
    ...signedPermutations([1 / phi, 1 / phi, 3 + phi], { parity: 0, minusParity: 1 }),
    ...signedPermutations([1 / phi, phi ** 2, 3 * phi - 1], { parity: 0, minusParity: 1 }),
    ...signedPermutations([2 * phi - 1, 2, 2 + phi], { parity: 0, minusParity: 1 }),
    ...signedPermutations([2 / phi, phi, 1 + 2 * phi], { parity: 0, minusParity: 0 }),
    ...signedPermutations([phi, 3, 2 * phi], { parity: 0, minusParity: 0 })
  ];
  addConvexHullPolyhedron(complex, points, 0.48);
}

export function generateTruncatedTetrahedron(complex) {
  generateDerivedPolyhedron(complex, 'tetrahedron', 1 / 3, 1.65);
}

export function generateCuboctahedron(complex) {
  generateDerivedPolyhedron(complex, 'cube', 0.5, 1.65);
}

export function generateTruncatedCube(complex) {
  generateDerivedPolyhedron(complex, 'cube', 1 / 3, 1.35);
}

export function generateIcosidodecahedron(complex) {
  generateDerivedPolyhedron(complex, 'icosahedron', 0.5, 1.35);
}

export function generateTruncatedDodecahedron(complex) {
  generateDerivedPolyhedron(complex, 'dodecahedron', 1 / 3, 1.1);
}

export function generateTruncatedIcosahedron(complex) {
  generateDerivedPolyhedron(complex, 'icosahedron', 1 / 3, 1.15);
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
