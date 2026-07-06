/**
 * Topology Boundary Gluing and Mapping Logic
 */

import { 
  generateSquareGrid, 
  generateTriangleGrid, 
  generateHexGrid 
} from './complex.js';

export function applyTopology(complex, type, gridType, w, h, params = {}) {
  complex.clear();

  if (type === 'double-torus') {
    applyDoubleTorus(complex, gridType, w, h, params.doubleTorusHoleRadius);
    return;
  }

  if (type === 'two-sheet') {
    applyTwoSheetBranch(complex, gridType, w, h);
    return;
  }

  // Standard regular grid generation (single sheet)
  if (gridType === 'square') {
    generateSquareGrid(complex, w, h, 0);
  } else if (gridType === 'triangle') {
    generateTriangleGrid(complex, w, h, 0);
  } else if (gridType === 'hex') {
    generateHexGrid(complex, w, h, 0);
  } else {
    // Non-regular grids (Voronoi/Polyhedra) don't use standard topology wrapping
    return;
  }

  if (type === 'plane') {
    complex.cleanAndReindex();
    return;
  }

  // Perform geometric boundary gluing
  glueRegularGridBoundaries(complex, type);
  complex.cleanAndReindex();
}

/**
 * Geometric Boundary Gluing for Torus, Klein Bottle, Projective Plane, and Möbius Strip.
 * Identifies boundaries based on geometric coordinates.
 */
function getBorders(vertices, EPSILON) {
  // Find minY and maxY of flat geometry
  let minY = Infinity, maxY = -Infinity;
  vertices.forEach(v => {
    if (v.position2D.y < minY) minY = v.position2D.y;
    if (v.position2D.y > maxY) maxY = v.position2D.y;
  });

  // Top/bottom borders use simple coordinate filter since rows are flat horizontal lines
  const topBorder = vertices.filter(v => Math.abs(v.position2D.y - minY) < EPSILON);
  const bottomBorder = vertices.filter(v => Math.abs(v.position2D.y - maxY) < EPSILON);

  // Row-grouping for left/right borders to handle staggered grids like triangle/hex
  const rowsMap = new Map();
  vertices.forEach(v => {
    const key = Math.round(v.position2D.y * 1000) / 1000;
    let foundKey = key;
    for (const existingKey of rowsMap.keys()) {
      if (Math.abs(existingKey - key) < EPSILON) {
        foundKey = existingKey;
        break;
      }
    }
    if (!rowsMap.has(foundKey)) {
      rowsMap.set(foundKey, []);
    }
    rowsMap.get(foundKey).push(v);
  });

  const leftBorder = [];
  const rightBorder = [];
  rowsMap.forEach((rowVertices) => {
    rowVertices.sort((a, b) => a.position2D.x - b.position2D.x);
    if (rowVertices.length > 0) {
      leftBorder.push(rowVertices[0]);
      if (rowVertices.length > 1) {
        rightBorder.push(rowVertices[rowVertices.length - 1]);
      }
    }
  });

  // Sort borders for aligned mapping
  leftBorder.sort((a, b) => a.position2D.y - b.position2D.y);
  rightBorder.sort((a, b) => a.position2D.y - b.position2D.y);
  topBorder.sort((a, b) => a.position2D.x - b.position2D.x);
  bottomBorder.sort((a, b) => a.position2D.x - b.position2D.x);

  return { leftBorder, rightBorder, topBorder, bottomBorder };
}

function glueRegularGridBoundaries(complex, topologyType) {
  const EPSILON = 0.05;

  // 1. Glue Left & Right Boundaries
  const borders = getBorders(complex.vertices, EPSILON);
  const leftBorder = borders.leftBorder;
  const rightBorder = borders.rightBorder;
  const L = leftBorder.length;
  const R = rightBorder.length;

  if (topologyType === 'torus' || topologyType === 'klein') {
    // Normal Gluing (Left matching Right at same Y)
    const count = Math.min(L, R);
    for (let i = 0; i < count; i++) {
      complex.mergeVertices(leftBorder[i].id, rightBorder[i].id);
    }
  } else if (topologyType === 'projective' || topologyType === 'mobius') {
    // Reversed Gluing (Left matching Right at reversed Y)
    const count = Math.min(L, R);
    for (let i = 0; i < count; i++) {
      complex.mergeVertices(leftBorder[i].id, rightBorder[count - 1 - i].id);
    }
  }

  // Refresh references after Left-Right merge before Top-Bottom merge
  complex.cleanAndReindex();

  // 2. Glue Top & Bottom Boundaries
  const newBorders = getBorders(complex.vertices, EPSILON);
  const newTopBorder = newBorders.topBorder;
  const newBottomBorder = newBorders.bottomBorder;
  const newT = newTopBorder.length;
  const newB = newBottomBorder.length;

  if (topologyType === 'torus') {
    // Normal Top-Bottom Gluing
    const count = Math.min(newT, newB);
    for (let i = 0; i < count; i++) {
      complex.mergeVertices(newTopBorder[i].id, newBottomBorder[i].id);
    }
  } else if (topologyType === 'klein' || topologyType === 'projective') {
    // Reversed Top-Bottom Gluing
    const count = Math.min(newT, newB);
    for (let i = 0; i < count; i++) {
      complex.mergeVertices(newTopBorder[i].id, newBottomBorder[count - 1 - i].id);
    }
  }
}

/**
 * Creates a Double Torus topologically.
 * Generates two independent torus grids (Sheet 0 and Sheet 1),
 * deletes a central cell group on each, and glues their boundary loops.
 */
function applyDoubleTorus(complex, gridType, w, h, holeRadius = 1.2) {
  // 1. Generate Torus 1 (Sheet 0)
  const complex0 = new (complex.constructor)();
  if (gridType === 'square') generateSquareGrid(complex0, w, h, 0, 0, 0);
  else if (gridType === 'triangle') generateTriangleGrid(complex0, w, h, 0, 0, 0);
  else if (gridType === 'hex') generateHexGrid(complex0, w, h, 0, 0, 0);
  glueRegularGridBoundaries(complex0, 'torus');
  complex0.cleanAndReindex();

  // 2. Generate Torus 2 (Sheet 1)
  const complex1 = new (complex.constructor)();
  // Offset Sheet 1 visually so it draws next to Sheet 0
  const offsetX = w + 3;
  if (gridType === 'square') generateSquareGrid(complex1, w, h, 1, offsetX, 0);
  else if (gridType === 'triangle') generateTriangleGrid(complex1, w, h, 1, offsetX, 0);
  else if (gridType === 'hex') generateHexGrid(complex1, w, h, 1, offsetX, 0);
  glueRegularGridBoundaries(complex1, 'torus');
  complex1.cleanAndReindex();

  // Add Sheet 0 vertices, edges, faces
  complex0.vertices.forEach(v => {
    const newV = complex.addVertex(v.position2D.x, v.position2D.y, 0);
    newV.tags.push('sheet0');
  });
  complex0.faces.forEach(f => {
    const fVIds = f.vertices.map(id => id);
    const newFace = complex.addFace(fVIds, f.renderPoints);
    newFace.sheet = 0;
  });

  // Calculate vOffset after Sheet 0 is added, so Sheet 1 vertex IDs do not overlap Sheet 0
  const vOffset = complex.vertices.length;

  // Add Sheet 1 vertices, edges, faces
  complex1.vertices.forEach(v => {
    const newV = complex.addVertex(v.position2D.x, v.position2D.y, 0);
    newV.tags.push('sheet1');
  });
  complex1.faces.forEach(f => {
    const fVIds = f.vertices.map(id => id + vOffset);
    const newFace = complex.addFace(fVIds, f.renderPoints);
    newFace.sheet = 1;
  });

  // Clean to rebuild IDs correctly before modifying
  complex.cleanAndReindex();

  // Center coordinate of both sheets
  const c0 = { x: w / 2, y: h / 2 };
  const c1 = { x: offsetX + w / 2, y: h / 2 };

  // Select all faces within the hole radius
  let delFaces0 = complex.faces.filter(f => f.sheet === 0 && Math.hypot(f.getCentroid().x - c0.x, f.getCentroid().y - c0.y) <= holeRadius);
  let delFaces1 = complex.faces.filter(f => f.sheet === 1 && Math.hypot(f.getCentroid().x - c1.x, f.getCentroid().y - c1.y) <= holeRadius);

  // Fallback to central face if no faces found
  if (delFaces0.length === 0) {
    const fallback = complex.faces.find(f => f.sheet === 0 && Math.abs(f.getCentroid().x - c0.x) < 1.5 && Math.abs(f.getCentroid().y - c0.y) < 1.5);
    if (fallback) delFaces0.push(fallback);
  }
  if (delFaces1.length === 0) {
    const fallback = complex.faces.find(f => f.sheet === 1 && Math.abs(f.getCentroid().x - c1.x) < 1.5 && Math.abs(f.getCentroid().y - c1.y) < 1.5);
    if (fallback) delFaces1.push(fallback);
  }

  const getBoundaryLoop = (delFaces) => {
    if (delFaces.length === 0) return [];
    const edgeCounts = new Map();

    delFaces.forEach(f => {
      f.edges.forEach(eId => {
        edgeCounts.set(eId, (edgeCounts.get(eId) || 0) + 1);
      });
    });

    const borderEdgeIds = [];
    edgeCounts.forEach((count, eId) => {
      if (count === 1) borderEdgeIds.push(eId);
    });

    if (borderEdgeIds.length === 0) return [];

    const adj = new Map();
    borderEdgeIds.forEach(eId => {
      const edge = complex.edgeMap.get(eId);
      if (edge) {
        const [v1, v2] = edge.vertices;
        if (!adj.has(v1)) adj.set(v1, []);
        if (!adj.has(v2)) adj.set(v2, []);
        adj.get(v1).push(v2);
        adj.get(v2).push(v1);
      }
    });

    const loop = [];
    const visited = new Set();
    const startV = Array.from(adj.keys())[0];
    if (startV === undefined) return [];

    let curr = startV;
    while (curr !== undefined) {
      loop.push(curr);
      visited.add(curr);
      
      const nexts = adj.get(curr) || [];
      let nextV = nexts.find(v => !visited.has(v));
      
      if (!nextV) {
        break;
      }
      curr = nextV;
    }
    return loop;
  };

  const loop0 = getBoundaryLoop(delFaces0);
  const loop1 = getBoundaryLoop(delFaces1);

  if (loop0.length > 0 && loop1.length > 0) {
    // Sort vertices by angle around centroid to prevent twisting
    const getAngle = (vId, center) => {
      const v = complex.vertexMap.get(vId);
      if (!v) return 0;
      return Math.atan2(v.position2D.y - center.y, v.position2D.x - center.x);
    };

    loop0.sort((a, b) => getAngle(a, c0) - getAngle(b, c0));
    loop1.sort((a, b) => getAngle(a, c1) - getAngle(b, c1));

    // Merge boundary loop vertices 1:1
    const count = Math.min(loop0.length, loop1.length);
    for (let i = 0; i < count; i++) {
      complex.mergeVertices(loop0[i], loop1[i]);
    }

    // Delete the cutout faces
    const delIds = new Set([...delFaces0.map(f => f.id), ...delFaces1.map(f => f.id)]);
    complex.faces = complex.faces.filter(f => !delIds.has(f.id));
    delIds.forEach(id => complex.faceMap.delete(id));
  }

  complex.cleanAndReindex();
}

/**
 * Creates a Two-Sheeted Riemann Surface with a Branch Cut.
 * Generates two independent flat grids (Sheet 0 and Sheet 1).
 * Duplicates the vertices along a central horizontal cut line,
 * and cross-connects Sheet 0's top edge to Sheet 1's bottom edge, and vice-versa.
 */
function applyTwoSheetBranch(complex, gridType, w, h) {
  // 1. Generate Sheet 0 (Flat plane)
  const complex0 = new (complex.constructor)();
  if (gridType === 'square') generateSquareGrid(complex0, w, h, 0, 0, 0);
  else if (gridType === 'triangle') generateTriangleGrid(complex0, w, h, 0, 0, 0);
  else if (gridType === 'hex') generateHexGrid(complex0, w, h, 0, 0, 0);
  complex0.cleanAndReindex();

  // 2. Generate Sheet 1 (Flat plane, offset)
  const complex1 = new (complex.constructor)();
  const offsetX = w + 3;
  if (gridType === 'square') generateSquareGrid(complex1, w, h, 1, offsetX, 0);
  else if (gridType === 'triangle') generateTriangleGrid(complex1, w, h, 1, offsetX, 0);
  else if (gridType === 'hex') generateHexGrid(complex1, w, h, 1, offsetX, 0);
  complex1.cleanAndReindex();

  // Combine them into one complex
  const vOffset = complex0.vertices.length;

  complex0.vertices.forEach(v => {
    const newV = complex.addVertex(v.position2D.x, v.position2D.y, 0);
    newV.tags.push('sheet0');
  });
  complex0.faces.forEach(f => {
    const newFace = complex.addFace(f.vertices, f.renderPoints);
    newFace.sheet = 0;
  });

  complex1.vertices.forEach(v => {
    const newV = complex.addVertex(v.position2D.x, v.position2D.y, 0);
    newV.tags.push('sheet1');
  });
  complex1.faces.forEach(f => {
    const newFace = complex.addFace(f.vertices.map(id => id + vOffset), f.renderPoints);
    newFace.sheet = 1;
  });

  complex.cleanAndReindex();

  // Define cut line: horizontal line in the middle
  const yCut = Math.floor(h / 2);
  const xStart = Math.floor(w / 4);
  const xEnd = Math.floor(3 * w / 4);

  // We find vertices on Sheet 0 and Sheet 1 that are on the cut line
  // For each integer grid coordinate along the cut line (x, yCut),
  // we identify the vertex.
  const EPSILON = 0.05;
  for (let x = xStart; x <= xEnd; x++) {
    // Sheet 0 vertex on cut
    const v0 = complex.vertices.find(v => v.tags.includes('sheet0') && Math.abs(v.position2D.y - yCut) < EPSILON && Math.abs(v.position2D.x - x) < EPSILON);
    // Sheet 1 vertex on cut (shifted by offsetX)
    const v1 = complex.vertices.find(v => v.tags.includes('sheet1') && Math.abs(v.position2D.y - yCut) < EPSILON && Math.abs(v.position2D.x - (x + offsetX)) < EPSILON);

    if (v0 && v1) {
      // In a branch cut, crossing the cut on Sheet 0 moves you to Sheet 1.
      // Topologically:
      // Vertices above the cut on Sheet 0 are joined with vertices below the cut on Sheet 1,
      // and vertices above the cut on Sheet 1 are joined with vertices below the cut on Sheet 0.
      // To implement this, we duplicate the cut vertex on both sheets.
      // Let's call the original v0 and v1 the "top side" of the cut, and create new v0_bot and v1_bot for the "bottom side".
      
      const v0_bot = complex.addVertex(v0.position2D.x, v0.position2D.y, 0);
      v0_bot.tags.push('sheet0', 'cut-bot');
      
      const v1_bot = complex.addVertex(v1.position2D.x, v1.position2D.y, 0);
      v1_bot.tags.push('sheet1', 'cut-bot');

      // Find all faces on Sheet 0 below yCut that used v0, and change their reference to v0_bot.
      // (Wait, since we are moving downwards, faces below yCut are those whose centroids have y > yCut).
      complex.faces.forEach(f => {
        if (f.sheet === 0 && f.getCentroid().y > yCut) {
          f.vertices = f.vertices.map(vid => vid === v0.id ? v0_bot.id : vid);
        }
        if (f.sheet === 1 && f.getCentroid().y > yCut) {
          f.vertices = f.vertices.map(vid => vid === v1.id ? v1_bot.id : vid);
        }
      });

      // Now glue cross-wise:
      // Glue top of Sheet 0 (v0) with bottom of Sheet 1 (v1_bot)
      complex.mergeVertices(v0.id, v1_bot.id);
      // Glue top of Sheet 1 (v1) with bottom of Sheet 0 (v0_bot)
      complex.mergeVertices(v1.id, v0_bot.id);
    }
  }

  complex.cleanAndReindex();
}
