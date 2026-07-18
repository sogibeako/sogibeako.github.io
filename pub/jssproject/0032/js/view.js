/**
 * Canvas Visualizer and Interaction Layer
 */

import { getFaceNeighbors } from './neighborhood.js';

export class Visualizer {
  constructor(canvasId, complex) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.complex = complex;

    // View State (2D pan/zoom)
    this.zoom = 15;
    this.offsetX = 0;
    this.offsetY = 0;

    // 3D View State (for polyhedra)
    this.is3D = false;
    this.yaw = 0.5; // Horizontal rotation
    this.pitch = 0.3; // Vertical rotation
    this.rotationCenter3D = { x: 0, y: 0, z: 0 };
    this.objectRadius3D = 1;
    this.cameraDistance3D = 8;

    // Visual options
    this.viewMode = 'complex'; // 'cell' | 'dual' | 'complex' | 'curvature'
    this.showFaces = true;
    this.showEdges = true;
    this.showVertices = true;
    this.showIDs = false;
    this.showNeighborLinks = true;

    // Selection State
    this.hoveredFaceId = null;
    this.lockedFaceId = null; // Locked via click

    // Interaction State
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.dragButton = 0; // 0 = Left, 1 = Middle, 2 = Right
    this.shiftKey = false;

    // Colors
    this.colors = {
      bg: '#050811',
      gridLine: 'rgba(51, 65, 85, 0.4)',
      vertex: '#475569',
      vertexActive: '#06b6d4',
      faceDead: '#0f172a',
      faceAlive: '#06b6d4',
      faceAliveGlow: 'rgba(6, 182, 212, 0.4)',
      neighborLink: 'rgba(16, 185, 129, 0.65)',
      highlightBorder: '#f59e0b', // Amber
      curvatureCool: '#1e3a8a',
      curvatureHot: '#ef4444'
    };

    // Initialize Canvas Resizing
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupEvents();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartPos = { x: e.clientX, y: e.clientY };
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.dragButton = e.button;
      this.shiftKey = e.shiftKey;
      this.ctrlKey = e.ctrlKey;
      this.hasDragged = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      this.shiftKey = e.shiftKey;
      this.ctrlKey = e.ctrlKey;

      if (this.isDragging) {
        const dx = mouseX - this.lastMousePos.x;
        const dy = mouseY - this.lastMousePos.y;

        // Set drag flag if moved beyond threshold
        const totalDx = mouseX - this.dragStartPos.x;
        const totalDy = mouseY - this.dragStartPos.y;
        if (Math.abs(totalDx) > 4 || Math.abs(totalDy) > 4) {
          this.hasDragged = true;
        }

        if (this.is3D && !this.shiftKey && !this.ctrlKey) {
          // Rotate 3D shape
          this.yaw += dx * 0.007;
          this.pitch += dy * 0.007;
          // Constrain pitch
          this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        } else {
          // Pan camera
          this.offsetX += dx;
          this.offsetY += dy;
        }

        this.lastMousePos = { x: mouseX, y: mouseY };
        this.draw();
      } else {
        // Hover inspection
        const gridPos = this.screenToGrid(mouseX, mouseY);
        const hoveredFace = this.findFaceAt(gridPos.x, gridPos.y);
        if (hoveredFace !== this.hoveredFaceId) {
          this.hoveredFaceId = hoveredFace;
          const hoverEvent = new CustomEvent('facehover', { detail: { id: hoveredFace } });
          this.canvas.dispatchEvent(hoverEvent);
          this.draw();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Zoom towards mouse pointer
      const gridBefore = this.screenToGrid(mouseX, mouseY);
      
      if (e.deltaY < 0) {
        this.zoom *= zoomFactor;
      } else {
        this.zoom /= zoomFactor;
      }
      
      this.zoom = Math.max(0.5, Math.min(200, this.zoom));

      const gridAfter = this.screenToGrid(mouseX, mouseY);
      
      if (!this.is3D) {
        this.offsetX += (gridAfter.x - gridBefore.x) * this.zoom;
        this.offsetY += (gridAfter.y - gridBefore.y) * this.zoom;
      }
      
      this.draw();
    }, { passive: false });

    // Handle clicks to lock/inspect/toggle
    this.canvas.addEventListener('click', (e) => {
      if (e.shiftKey) return;
      if (this.hasDragged) return; // Prevent cell toggle/lock during drag rotations

      const gridPos = this.screenToGrid(e.clientX, e.clientY);
      const clickedFace = this.findFaceAt(gridPos.x, gridPos.y);
      
      if (clickedFace !== null) {
        if (e.altKey) {
          // Alt-click to highlight / trace neighbors
          this.lockedFaceId = (this.lockedFaceId === clickedFace) ? null : clickedFace;
          const lockEvent = new CustomEvent('facelock', { detail: { id: this.lockedFaceId } });
          this.canvas.dispatchEvent(lockEvent);
          this.draw();
        } else {
          // Toggle state of clicked cell (works for both 2D and 3D)
          const toggleEvent = new CustomEvent('facetoggle', { detail: { id: clickedFace } });
          this.canvas.dispatchEvent(toggleEvent);

          // Auto-inspect/lock the cell on click
          if (this.lockedFaceId !== clickedFace) {
            this.lockedFaceId = clickedFace;
            const lockEvent = new CustomEvent('facelock', { detail: { id: this.lockedFaceId } });
            this.canvas.dispatchEvent(lockEvent);
            this.draw();
          }
        }
      }
    });
  }

  update3DViewMetrics() {
    if (this.complex.vertices.length === 0) {
      this.rotationCenter3D = { x: 0, y: 0, z: 0 };
      this.objectRadius3D = 1;
      this.cameraDistance3D = 8;
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    this.complex.vertices.forEach(v => {
      const { x, y, z } = v.position3D;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    this.rotationCenter3D = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };

    let radius = 0;
    this.complex.vertices.forEach(v => {
      const dx = v.position3D.x - this.rotationCenter3D.x;
      const dy = v.position3D.y - this.rotationCenter3D.y;
      const dz = v.position3D.z - this.rotationCenter3D.z;
      radius = Math.max(radius, Math.hypot(dx, dy, dz));
    });

    this.objectRadius3D = Math.max(radius, 1);
    this.cameraDistance3D = Math.max(this.objectRadius3D * 4, 8);
  }

  // Projects a 3D point to a 2D viewport coordinate
  project3D(x, y, z) {
    x -= this.rotationCenter3D.x;
    y -= this.rotationCenter3D.y;
    z -= this.rotationCenter3D.z;

    // 1. Rotation yaw (Y-axis)
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    let x1 = x * cosY - z * sinY;
    let z1 = x * sinY + z * cosY;

    // 2. Rotation pitch (X-axis)
    const cosX = Math.cos(this.pitch);
    const sinX = Math.sin(this.pitch);
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    // 3. Perspective Projection
    const distance = this.cameraDistance3D;
    const factor = distance / Math.max(distance + z2, distance * 0.25);

    return {
      x: x1 * factor,
      y: y2 * factor,
      z: z2 // Keep depth for sorting
    };
  }

  screenToGrid(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = sx - rect.left;
    const y = sy - rect.top;
    
    // Reverse the translation/scaling
    const cx = this.canvas.width / 2 + this.offsetX;
    const cy = this.canvas.height / 2 + this.offsetY;

    return {
      x: (x - cx) / this.zoom,
      y: (y - cy) / this.zoom
    };
  }

  screenPixelsToWorld(px) {
    const z = Number.isFinite(this.zoom) && this.zoom > 0 ? this.zoom : 1;
    return px / z;
  }

  centerView() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.yaw = 0.5;
    this.pitch = 0.3;
    this.update3DViewMetrics();
    
    // Fit bounds automatically
    if (this.complex.vertices.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      this.complex.vertices.forEach(v => {
        const x = this.is3D ? v.position3D.x : v.position2D.x;
        const y = this.is3D ? v.position3D.y : v.position2D.y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });

      if (this.is3D) {
        const projectedRadius = Math.max(this.objectRadius3D, 1);
        const margin = 2.8;
        this.zoom = Math.min(this.canvas.width, this.canvas.height) / (projectedRadius * margin);
      } else {
        const width = maxX - minX || 1;
        const height = maxY - minY || 1;
        const margin = 1.2;
        this.zoom = Math.min(this.canvas.width / width, this.canvas.height / height) / margin;
        this.offsetX = -((minX + maxX) / 2) * this.zoom;
        this.offsetY = -((minY + maxY) / 2) * this.zoom;
      }
    }
    this.draw();
  }

  /**
   * Simple point-in-polygon test for click detection.
   */
  findFaceAt(x, y) {
    if (this.complex.faces.length === 0) return null;

    if (this.is3D) {
      // For 3D structures, click detection is done on the projected face geometry.
      // We search through depth-sorted faces from front to back.
      const facesProjected = this.getDepthSortedFaces();
      
      for (const item of facesProjected) {
        const poly = item.projectedPoints;
        // Ray casting algorithm
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i].x, yi = poly[i].y;
          const xj = poly[j].x, yj = poly[j].y;
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        if (inside) return item.face.id;
      }
      return null;
    }

    // Standard 2D cell checking
    for (const face of this.complex.faces) {
      const poly = face.renderPoints;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return face.id;
    }
    
    return null;
  }

  /**
   * Computes projected coords and sorts faces by depth (Painter's Algorithm).
   */
  getDepthSortedFaces() {
    const list = [];
    
    this.complex.faces.forEach(face => {
      // Get face vertices
      const pVertices = face.vertices.map(vId => {
        const v = this.complex.vertexMap.get(vId);
        return v ? this.project3D(v.position3D.x, v.position3D.y, v.position3D.z) : { x: 0, y: 0, z: 0 };
      });

      // Calculate centroid depth
      let sumZ = 0;
      pVertices.forEach(p => sumZ += p.z);
      const avgZ = sumZ / pVertices.length;

      list.push({
        face,
        projectedPoints: pVertices,
        depth: avgZ
      });
    });

    // Sort by depth descending (Painter's algorithm: draw back-to-front)
    list.sort((a, b) => b.depth - a.depth);
    return list;
  }

  /**
   * Evaluates color based on state (support Generations rule states).
   */
  getFaceColor(state, maxStates = 2) {
    if (state === 0) return this.colors.faceDead;
    if (state === 1) return this.colors.faceAlive; // State 1: Alive

    // Generations dying states (violet to red/pink gradient)
    const ratio = (state - 1) / (maxStates - 1);
    const alpha = 1.0 - ratio * 0.7; // fade opacity
    
    // Cycle hue through purple/blue spectrum for decaying states
    const hue = 260 + ratio * 60; // 260 to 320 degrees
    return `hsla(${hue}, 80%, 65%, ${alpha})`;
  }

  /**
   * Evaluates curvature color based on degree (number of neighbors).
   */
  getCurvatureColor(degree) {
    // Curvature range usually between 3 (triangle) and 8 (square vertex neighbors)
    const minD = 3;
    const maxD = 8;
    const ratio = Math.max(0, Math.min(1, (degree - minD) / (maxD - minD)));
    
    // Interpolate Cool Blue to Hot Red
    const h = 240 - ratio * 240; // 240 (blue) down to 0 (red)
    return `hsla(${h}, 85%, 55%, 0.75)`;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.complex.faces.length === 0) {
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '14px Outfit';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('No cell complex generated. Click Generate & Rebuild.', this.canvas.width / 2, this.canvas.height / 2);
      return;
    }

    this.ctx.save();
    
    // Center camera
    const cx = this.canvas.width / 2 + this.offsetX;
    const cy = this.canvas.height / 2 + this.offsetY;
    this.ctx.translate(cx, cy);
    this.ctx.scale(this.zoom, this.zoom);
    const edgeLineWidth = this.screenPixelsToWorld(this.is3D ? 1.1 : 0.85);
    const aliveOutlineWidth = this.screenPixelsToWorld(1.1);
    const vertexRadius = this.screenPixelsToWorld(this.is3D ? 2.3 : 1.9);
    const dualLineWidth = this.screenPixelsToWorld(0.8);
    const dualNodeRadius = this.screenPixelsToWorld(1.9);
    const dualAliveNodeRadius = this.screenPixelsToWorld(2.4);
    const inspectLineWidth = this.screenPixelsToWorld(1.5);
    const neighborLineWidth = this.screenPixelsToWorld(1.0);

    // Setup cell renderer loop (handles 3D depth-sorting automatically)
    const renderList = this.is3D ? this.getDepthSortedFaces() : this.complex.faces.map(face => ({
      face,
      projectedPoints: face.renderPoints,
      depth: 0
    }));

    // --- STEP 1: Render Faces ---
    if (this.showFaces) {
      renderList.forEach(item => {
        const face = item.face;
        const poly = item.projectedPoints;
        if (poly.length < 3) return;

        this.ctx.beginPath();
        this.ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          this.ctx.lineTo(poly[i].x, poly[i].y);
        }
        this.ctx.closePath();

        // Color cell
        if (this.viewMode === 'curvature') {
          // Degree-based coloring
          const neighbors = getFaceNeighbors(this.complex, face.id, 'vertex-sharing');
          this.ctx.fillStyle = this.getCurvatureColor(neighbors.length);
        } else {
          // Normal state-based coloring
          // Max states count
          const maxStates = window.appState ? window.appState.ruleEvaluator.stateCount : 2;
          this.ctx.fillStyle = this.getFaceColor(face.state, maxStates);
        }

        this.ctx.fill();

        // If face is active (state 1), add glowing border overlay
        if (face.state === 1 && this.viewMode !== 'curvature') {
          this.ctx.strokeStyle = this.colors.faceAliveGlow;
          this.ctx.lineWidth = aliveOutlineWidth;
          this.ctx.stroke();
        }
      });
    }

    // --- STEP 2: Render Edges ---
    if (this.showEdges) {
      this.ctx.strokeStyle = this.colors.gridLine;
      this.ctx.lineWidth = edgeLineWidth;
      
      if (this.is3D) {
        // Draw edges of projected 3D shape
        this.complex.edges.forEach(edge => {
          const v1 = this.complex.vertexMap.get(edge.vertices[0]);
          const v2 = this.complex.vertexMap.get(edge.vertices[1]);
          if (v1 && v2) {
            const p1 = this.project3D(v1.position3D.x, v1.position3D.y, v1.position3D.z);
            const p2 = this.project3D(v2.position3D.x, v2.position3D.y, v2.position3D.z);
            
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
          }
        });
      } else {
        // Draw 2D edges
        this.complex.edges.forEach(edge => {
          const v1 = this.complex.vertexMap.get(edge.vertices[0]);
          const v2 = this.complex.vertexMap.get(edge.vertices[1]);
          if (v1 && v2) {
            this.ctx.beginPath();
            this.ctx.moveTo(v1.position2D.x, v1.position2D.y);
            this.ctx.lineTo(v2.position2D.x, v2.position2D.y);
            this.ctx.stroke();
          }
        });
      }
    }

    // --- STEP 3: Render Vertices ---
    if (this.showVertices) {
      const radius = vertexRadius;
      this.ctx.fillStyle = this.colors.vertex;
      
      if (this.is3D) {
        this.complex.vertices.forEach(v => {
          const p = this.project3D(v.position3D.x, v.position3D.y, v.position3D.z);
          // Highlight active topological vertices
          const isSharedByAlive = v.faces.some(fId => {
            const f = this.complex.faceMap.get(fId);
            return f && f.state === 1;
          });
          
          this.ctx.fillStyle = isSharedByAlive ? this.colors.vertexActive : this.colors.vertex;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, radius * (isSharedByAlive ? 1.15 : 1.0), 0, 2 * Math.PI);
          this.ctx.fill();
        });
      } else {
        this.complex.vertices.forEach(v => {
          const isSharedByAlive = v.faces.some(fId => {
            const f = this.complex.faceMap.get(fId);
            return f && f.state === 1;
          });
          
          this.ctx.fillStyle = isSharedByAlive ? this.colors.vertexActive : this.colors.vertex;
          this.ctx.beginPath();
          this.ctx.arc(v.position2D.x, v.position2D.y, radius * (isSharedByAlive ? 1.15 : 1.0), 0, 2 * Math.PI);
          this.ctx.fill();
        });
      }
    }

    // --- STEP 4: Render Dual Graph (Connections) ---
    if (this.viewMode === 'dual') {
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      this.ctx.lineWidth = dualLineWidth;
      
      // Get centroid positions for neighbors drawing
      const centroids = new Map();
      renderList.forEach(item => {
        const face = item.face;
        const poly = item.projectedPoints;
        
        let cx = 0, cy = 0;
        poly.forEach(p => { cx += p.x; cy += p.y; });
        centroids.set(face.id, { x: cx / poly.length, y: cy / poly.length });
      });

      // Draw neighborhood links
      this.complex.faces.forEach(face => {
        const c1 = centroids.get(face.id);
        if (!c1) return;

        const neighbors = getFaceNeighbors(this.complex, face.id, 'vertex-sharing');
        neighbors.forEach(n => {
          const c2 = centroids.get(n.id);
          if (c2 && face.id < n.id) { // Avoid duplicate double drawing
            this.ctx.beginPath();
            this.ctx.moveTo(c1.x, c1.y);
            this.ctx.lineTo(c2.x, c2.y);
            this.ctx.stroke();
          }
        });
      });

      // Draw center nodes
      centroids.forEach((pos, faceId) => {
        const face = this.complex.faceMap.get(faceId);
        if (face) {
          this.ctx.fillStyle = face.state === 1 ? this.colors.faceAlive : '#334155';
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, face.state === 1 ? dualAliveNodeRadius : dualNodeRadius, 0, 2 * Math.PI);
          this.ctx.fill();
        }
      });
    }

    // --- STEP 5: Render Face IDs (Debugging) ---
    if (this.showIDs) {
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.font = `${0.35}px 'JetBrains Mono'`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      renderList.forEach(item => {
        const face = item.face;
        const poly = item.projectedPoints;
        
        let cx = 0, cy = 0;
        poly.forEach(p => { cx += p.x; cy += p.y; });
        this.ctx.fillText(face.id.toString(), cx / poly.length, cy / poly.length);
      });
    }

    // --- STEP 6: Interactive Highlights (Neighbor Links & Hover/Lock) ---
    const activeInspectId = this.lockedFaceId !== null ? this.lockedFaceId : this.hoveredFaceId;
    if (activeInspectId !== null) {
      const targetItem = renderList.find(item => item.face.id === activeInspectId);
      
      if (targetItem) {
        const face = targetItem.face;
        const poly = targetItem.projectedPoints;

        // A. Draw Highlight Outline around inspected cell
        this.ctx.strokeStyle = this.colors.highlightBorder;
        this.ctx.lineWidth = inspectLineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          this.ctx.lineTo(poly[i].x, poly[i].y);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // B. Draw lines to neighbor cell centroids
        if (this.showNeighborLinks) {
          // Compute all centroids
          const centroids = new Map();
          renderList.forEach(item => {
            let cx = 0, cy = 0;
            item.projectedPoints.forEach(p => { cx += p.x; cy += p.y; });
            centroids.set(item.face.id, { x: cx / item.projectedPoints.length, y: cy / item.projectedPoints.length });
          });

          const c1 = centroids.get(face.id);
          if (c1) {
            // Fetch neighbor configurations
            const nMode = window.appState ? window.appState.neighborhoodMode : 'vertex-sharing';
            const weightEdge = window.appState ? window.appState.weightEdge : 1.0;
            const weightVertex = window.appState ? window.appState.weightVertex : 0.5;

            const neighbors = getFaceNeighbors(this.complex, face.id, nMode, { weightEdge, weightVertex });
            
            neighbors.forEach(n => {
              const c2 = centroids.get(n.id);
              const nFace = this.complex.faceMap.get(n.id);
              if (c2 && nFace) {
                // Glow lines matching neighbor type
                this.ctx.strokeStyle = n.type === 'edge' ? this.colors.neighborLink : 'rgba(139, 92, 246, 0.7)'; // violet for vertex-only
                this.ctx.lineWidth = neighborLineWidth;
                
                // Draw connecting link (handle wrapping over boundaries in 2D to avoid long screen-crossing lines)
                let isWrapped = false;
                if (!this.is3D) {
                  let gridW = window.appState ? window.appState.gridW : 30;
                  let gridH = window.appState ? window.appState.gridH : 30;
                  
                  // Adjust for grid type geometry mapping
                  if (window.appState && window.appState.gridType === 'triangle') {
                    gridH = gridH * (Math.sqrt(3) / 2);
                  } else if (window.appState && window.appState.gridType === 'hex') {
                    const radius = 0.577;
                    gridW = gridW * (Math.sqrt(3) * radius);
                    gridH = gridH * (1.5 * radius);
                  }

                  const dx = c2.x - c1.x;
                  const dy = c2.y - c1.y;

                  // If centroids are significantly far (more than half the grid size), consider it a wrapped boundary
                  if (Math.abs(dx) > gridW * 0.5 || Math.abs(dy) > gridH * 0.5) {
                    isWrapped = true;
                    
                    let offsetX = 0;
                    let offsetY = 0;
                    if (Math.abs(dx) > gridW * 0.5) {
                      offsetX = Math.sign(dx) * gridW;
                    }
                    if (Math.abs(dy) > gridH * 0.5) {
                      offsetY = Math.sign(dy) * gridH;
                    }

                    // Create virtual target coordinates outside the grid boundary
                    const virtualC2 = { x: c2.x - offsetX, y: c2.y - offsetY };
                    const virtualC1 = { x: c1.x + offsetX, y: c1.y + offsetY };

                    // Draw half-line going out from c1
                    this.ctx.beginPath();
                    this.ctx.moveTo(c1.x, c1.y);
                    this.ctx.lineTo(c1.x + (virtualC2.x - c1.x) * 0.4, c1.y + (virtualC2.y - c1.y) * 0.4);
                    this.ctx.stroke();

                    // Draw half-line coming in to c2
                    this.ctx.beginPath();
                    this.ctx.moveTo(c2.x, c2.y);
                    this.ctx.lineTo(c2.x + (virtualC1.x - c2.x) * 0.4, c2.y + (virtualC1.y - c2.y) * 0.4);
                    this.ctx.stroke();
                  }
                }

                if (!isWrapped) {
                  this.ctx.beginPath();
                  this.ctx.moveTo(c1.x, c1.y);
                  this.ctx.lineTo(c2.x, c2.y);
                  this.ctx.stroke();
                }

                // Highlight neighbor polygon with faint overlay
                const nItem = renderList.find(item => item.face.id === n.id);
                if (nItem) {
                  this.ctx.fillStyle = n.type === 'edge' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(139, 92, 246, 0.12)';
                  this.ctx.beginPath();
                  this.ctx.moveTo(nItem.projectedPoints[0].x, nItem.projectedPoints[0].y);
                  for (let i = 1; i < nItem.projectedPoints.length; i++) {
                    this.ctx.lineTo(nItem.projectedPoints[i].x, nItem.projectedPoints[i].y);
                  }
                  this.ctx.closePath();
                  this.ctx.fill();
                }
              }
            });
          }
        }
      }
    }

    this.ctx.restore();
  }
}
