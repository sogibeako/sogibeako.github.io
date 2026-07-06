/**
 * Neighborhood Detection and Weighting Logic
 */

/**
 * Returns the neighbors of a given face along with their weights.
 * Neighbors are represented as an array of objects: { id: FaceId, weight: number, type: 'edge'|'vertex' }
 * 
 * @param {CellComplex} complex - The cell complex
 * @param {number} faceId - The active face ID
 * @param {string} mode - 'edge-sharing' | 'vertex-sharing' | 'edge-or-vertex' | 'weighted-incidence' | 'custom'
 * @param {object} params - Weight parameters { weightEdge, weightVertex }
 */
export function getFaceNeighbors(complex, faceId, mode = 'vertex-sharing', params = {}) {
  const face = complex.faceMap.get(faceId);
  if (!face) return [];

  const weightEdge = params.weightEdge !== undefined ? params.weightEdge : 1.0;
  const weightVertex = params.weightVertex !== undefined ? params.weightVertex : 0.5;

  // 1. Find edge-sharing neighbors (Neumann-like)
  const edgeNeighbors = new Set();
  face.edges.forEach(eId => {
    const edge = complex.edgeMap.get(eId);
    if (edge) {
      edge.faces.forEach(fId => {
        if (fId !== faceId) {
          edgeNeighbors.add(fId);
        }
      });
    }
  });

  // 2. Find vertex-sharing neighbors (Moore-like)
  const vertexNeighbors = new Set();
  face.vertices.forEach(vId => {
    const vertex = complex.vertexMap.get(vId);
    if (vertex) {
      vertex.faces.forEach(fId => {
        if (fId !== faceId) {
          vertexNeighbors.add(fId);
        }
      });
    }
  });

  // Classify neighbors
  const neighborsList = [];
  
  if (mode === 'edge-sharing') {
    edgeNeighbors.forEach(fId => {
      neighborsList.push({ id: fId, weight: 1.0, type: 'edge' });
    });
  } else if (mode === 'vertex-sharing') {
    // All vertex-sharing neighbors have weight 1.0
    vertexNeighbors.forEach(fId => {
      neighborsList.push({ id: fId, weight: 1.0, type: edgeNeighbors.has(fId) ? 'edge' : 'vertex' });
    });
  } else if (mode === 'edge-or-vertex') {
    vertexNeighbors.forEach(fId => {
      const type = edgeNeighbors.has(fId) ? 'edge' : 'vertex';
      neighborsList.push({ 
        id: fId, 
        weight: type === 'edge' ? 1.0 : 1.0, // both 1.0 in this mode
        type 
      });
    });
  } else if (mode === 'weighted-incidence') {
    vertexNeighbors.forEach(fId => {
      const isEdge = edgeNeighbors.has(fId);
      neighborsList.push({
        id: fId,
        weight: isEdge ? weightEdge : weightVertex,
        type: isEdge ? 'edge' : 'vertex'
      });
    });
  } else if (mode === 'custom') {
    // Custom filter: e.g. only neighbors on the same sheet or with matching tags
    vertexNeighbors.forEach(fId => {
      const neighbor = complex.faceMap.get(fId);
      if (neighbor && neighbor.sheet === face.sheet) {
        const type = edgeNeighbors.has(fId) ? 'edge' : 'vertex';
        neighborsList.push({ id: fId, weight: 1.0, type });
      }
    });
  }

  return neighborsList;
}
