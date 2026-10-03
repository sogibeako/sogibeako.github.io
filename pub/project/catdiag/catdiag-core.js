/**
 * catdiag-core.js
 * データ構造の定義と検証を行います。
 */

export function validateDiagram(diagram) {
  const errors = [];
  
  if (!diagram) {
    return { ok: false, errors: [{ code: "INVALID_FORMAT", message: "diagram is null or undefined" }] };
  }

  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];
  const nodeIds = new Set();

  // Validate Nodes
  for (const node of nodes) {
    if (!node.id) {
      errors.push({ code: "MISSING_NODE_ID", message: "A node is missing an id" });
    } else if (nodeIds.has(node.id)) {
      errors.push({ code: "DUPLICATE_NODE_ID", message: `Duplicate node id: ${node.id}`, nodeId: node.id });
    } else {
      nodeIds.add(node.id);
    }

    if (diagram.layout?.mode === "manual") {
      if (typeof node.x !== "number" || typeof node.y !== "number") {
        errors.push({ code: "MISSING_NODE_COORDINATES", message: `Node ${node.id} is missing x or y coordinates in manual layout`, nodeId: node.id });
      }
    }
  }

  // Validate Edges
  const edgeIds = new Set();
  for (const edge of edges) {
    if (!edge.id) {
      errors.push({ code: "MISSING_EDGE_ID", message: "An edge is missing an id" });
    } else if (edgeIds.has(edge.id)) {
      errors.push({ code: "DUPLICATE_EDGE_ID", message: `Duplicate edge id: ${edge.id}`, edgeId: edge.id });
    } else {
      edgeIds.add(edge.id);
    }

    if (!nodeIds.has(edge.from)) {
      errors.push({ code: "EDGE_TARGET_NOT_FOUND", message: `edge ${edge.id} refers to missing node ${edge.from}`, edgeId: edge.id });
    }
    if (!nodeIds.has(edge.to)) {
      errors.push({ code: "EDGE_TARGET_NOT_FOUND", message: `edge ${edge.id} refers to missing node ${edge.to}`, edgeId: edge.id });
    }
  }

  // Validate commutativity (optional)
  if (diagram.commutativity) {
    for (const comm of diagram.commutativity) {
      for (const path of comm.paths) {
        for (const eId of path) {
          if (!edgeIds.has(eId)) {
            errors.push({ code: "COMMUTATIVITY_EDGE_NOT_FOUND", message: `commutativity refers to missing edge ${eId}`, edgeId: eId });
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
