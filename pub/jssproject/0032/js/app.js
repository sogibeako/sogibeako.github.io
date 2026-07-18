/**
 * Main Application Controller and Coordinator
 */

import { CellComplex } from './complex.js';
import { applyTopology } from './topology.js';
import { getFaceNeighbors } from './neighborhood.js';
import { RuleEvaluator, RULE_PRESETS } from './rules.js';
import { Visualizer } from './view.js';
import { CliConsole } from './console.js';

import { 
  generateVoronoiGrid, 
  generateHyperbolicSquarePatch,
  generateHyperbolicTrianglePatch,
  generateHyperbolicHeptagonPatch,
  generateHyperbolicRegularHeptagonTiling,
  cloneSubstitutionPreset,
  generateSubstitutionTiling,
  generateChairSubstitutionTiling,
  generateFibonacciStripTiling,
  generatePenroseTriangleTiling,
  generatePenroseRhombTiling,
  generateAmmannBeenkerTiling,
  generateTetrahedron, 
  generateCube, 
  generateOctahedron, 
  generateDodecahedron, 
  generateIcosahedron,
  generateTruncatedTetrahedron,
  generateCuboctahedron,
  generateTruncatedCube,
  generateRhombicuboctahedron,
  generateTruncatedCuboctahedron,
  generateSnubCube,
  generateIcosidodecahedron,
  generateTruncatedDodecahedron,
  generateTruncatedIcosahedron,
  generateRhombicosidodecahedron,
  generateTruncatedIcosidodecahedron,
  generateSnubDodecahedron,
  generateOctahedronChain,
  generatePrism,
  generateTruncatedOctahedron,
  generateCubeGrid,
  generateOctahedronGrid
} from './complex.js';

class App {
  constructor() {
    // 1. Core Data Models
    this.complex = new CellComplex();
    this.ruleEvaluator = new RuleEvaluator();
    
    // 2. Simulation State
    this.isPlaying = false;
    this.stepCount = 0;
    this.intervalId = null;
    this.intervalSpeed = 100; // ms
    this.historyLimit = 50;
    this.history = []; // Cache of previous face states: Array of arrays
    this.randomizeDensity = 0.25;
    this.screensaverMode = false;
    this.loopDetectionWindow = 20;
    this.loopWatchHashes = [];
    this.screensaverRandomizeCount = 0;

    // 3. Grid & Topology Parameters
    this.gridType = 'square';
    this.gridW = 30;
    this.gridH = 30;
    this.jitterCount = 150; // Jitter / seeds count for Voronoi
    this.substitutionDefinitionText = JSON.stringify(cloneSubstitutionPreset('chair'), null, 2);
    this.topologyType = 'torus';
    this.doubleTorusHoleRadius = 1.2; // Hole radius for double torus boundary cutout
    this.neighborhoodMode = 'vertex-sharing';
    this.weightEdge = 1.0;
    this.weightVertex = 0.5;

    // Draw active state tool: 1 = alive, 0 = erase
    this.drawStateTool = 1;

    // FPS counter
    this.fps = 0;
    this.lastFrameTime = performance.now();

    // 4. Initialize Subsystems
    this.visualizer = new Visualizer('main-canvas', this.complex);
    this.cliConsole = new CliConsole('console-log', 'console-input', this);

    // 5. Initialize Quick Load Availability
    if (localStorage.getItem('gcomplexlife_quicksave')) {
      const qlBtn = document.getElementById('btn-quickload');
      if (qlBtn) qlBtn.disabled = false;
    }

    // Bind app state globally for visualizer access
    window.appState = this;

    // 5. Build Initial Environment
    this.rebuildGrid();
    this.setupUIEvents();
    this.updateUIFromState();
    
    // Run animation frame loop for statistics (FPS)
    this.animationLoop();
  }

  rebuildGrid() {
    this.pause();
    this.complex.clear();

    const is3D = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron', 'truncated-tetrahedron', 'cuboctahedron', 'truncated-cube', 'truncated-octahedron', 'rhombicuboctahedron', 'truncated-cuboctahedron', 'snub-cube', 'icosidodecahedron', 'truncated-dodecahedron', 'truncated-icosahedron', 'rhombicosidodecahedron', 'truncated-icosidodecahedron', 'snub-dodecahedron', 'prism', 'octa-chain', 'octa-grid', 'cube-grid'].includes(this.gridType);
    this.visualizer.is3D = is3D;

    if (is3D) {
      if (this.gridType === 'tetrahedron') generateTetrahedron(this.complex);
      else if (this.gridType === 'cube') generateCube(this.complex);
      else if (this.gridType === 'octahedron') generateOctahedron(this.complex);
      else if (this.gridType === 'dodecahedron') generateDodecahedron(this.complex);
      else if (this.gridType === 'icosahedron') generateIcosahedron(this.complex);
      else if (this.gridType === 'truncated-tetrahedron') generateTruncatedTetrahedron(this.complex);
      else if (this.gridType === 'cuboctahedron') generateCuboctahedron(this.complex);
      else if (this.gridType === 'truncated-cube') generateTruncatedCube(this.complex);
      else if (this.gridType === 'truncated-octahedron') generateTruncatedOctahedron(this.complex);
      else if (this.gridType === 'rhombicuboctahedron') generateRhombicuboctahedron(this.complex);
      else if (this.gridType === 'truncated-cuboctahedron') generateTruncatedCuboctahedron(this.complex);
      else if (this.gridType === 'snub-cube') generateSnubCube(this.complex);
      else if (this.gridType === 'icosidodecahedron') generateIcosidodecahedron(this.complex);
      else if (this.gridType === 'truncated-dodecahedron') generateTruncatedDodecahedron(this.complex);
      else if (this.gridType === 'truncated-icosahedron') generateTruncatedIcosahedron(this.complex);
      else if (this.gridType === 'rhombicosidodecahedron') generateRhombicosidodecahedron(this.complex);
      else if (this.gridType === 'truncated-icosidodecahedron') generateTruncatedIcosidodecahedron(this.complex);
      else if (this.gridType === 'snub-dodecahedron') generateSnubDodecahedron(this.complex);
      else if (this.gridType === 'prism') {
        const sideCount = parseInt(this.jitterCount, 10) || 5;
        generatePrism(this.complex, sideCount);
      }
      else if (this.gridType === 'octa-chain') {
        const chainLen = parseInt(this.jitterCount, 10) || 4;
        generateOctahedronChain(this.complex, chainLen);
      }
      else if (this.gridType === 'octa-grid') {
        const side = parseInt(this.jitterCount, 10) || 3;
        generateOctahedronGrid(this.complex, side, side);
      }
      else if (this.gridType === 'cube-grid') {
        const side = parseInt(this.jitterCount, 10) || 3;
        generateCubeGrid(this.complex, side, side, side);
      }
    } else if (this.gridType === 'voronoi') {
      generateVoronoiGrid(this.complex, this.jitterCount, 30);
    } else if (this.gridType === 'hyperbolic-square') {
      generateHyperbolicSquarePatch(this.complex, this.jitterCount);
    } else if (this.gridType === 'hyperbolic-triangle') {
      generateHyperbolicTrianglePatch(this.complex, this.jitterCount);
    } else if (this.gridType === 'hyperbolic-heptagon') {
      generateHyperbolicHeptagonPatch(this.complex, this.jitterCount);
    } else if (this.gridType === 'hyperbolic-regular-heptagon') {
      generateHyperbolicRegularHeptagonTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-chair') {
      generateChairSubstitutionTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-fibonacci') {
      generateFibonacciStripTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-penrose') {
      generatePenroseTriangleTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-penrose-rhomb') {
      generatePenroseRhombTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-ammann-beenker') {
      generateAmmannBeenkerTiling(this.complex, this.jitterCount);
    } else if (this.gridType === 'substitution-custom') {
      try {
        generateSubstitutionTiling(this.complex, JSON.parse(this.substitutionDefinitionText), this.jitterCount);
      } catch (err) {
        this.cliConsole.log(`Substitution JSON error: ${err.message}`, 'error-line');
        generateChairSubstitutionTiling(this.complex, 3);
      }
    } else {
      // Square, Triangle, Hex: apply topology wrapping
      applyTopology(this.complex, this.topologyType, this.gridType, this.gridW, this.gridH, {
        doubleTorusHoleRadius: this.doubleTorusHoleRadius
      });
    }

    // Double check clean complex state
    this.complex.cleanAndReindex();

    // Reset Simulation
    this.stepCount = 0;
    this.history = [];
    this.saveStateToHistory();
    this.resetLoopWatch();
    this.updateTimelineUI();

    // Redraw and Recenter
    this.visualizer.lockedFaceId = null;
    this.visualizer.hoveredFaceId = null;
    this.visualizer.centerView();
    
    const topologyNote = this.isRegularGridType() ? ` with topology: ${this.topologyType}` : '';
    this.cliConsole.log(`Generated complex: ${this.gridType}${topologyNote}. Cells count: ${this.complex.faces.length}`, 'system-line');
    this.updateRatioRuleMap();
  }

  // --- Simulation Logic ---

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    
    const runStep = () => {
      this.step();
      if (this.isPlaying) {
        this.intervalId = setTimeout(runStep, this.intervalSpeed);
      }
    };
    this.intervalId = setTimeout(runStep, this.intervalSpeed);

    document.getElementById('btn-play').textContent = 'Pause';
    document.getElementById('btn-play').classList.add('btn-accent');
    this.updateStatusInfo(this.screensaverMode ? 'Screensaver' : 'Running');
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    document.getElementById('btn-play').textContent = 'Play';
    document.getElementById('btn-play').classList.remove('btn-accent');
    this.updateStatusInfo('Paused');
  }

  step() {
    // 1. Compute next state for all cells
    this.complex.faces.forEach(face => {
      const neighbors = this.getNeighborsForFace(face.id);
      face.nextState = this.ruleEvaluator.evaluateNextState(face, neighbors, this.complex.faceMap);
    });

    // 2. Commit states
    this.complex.faces.forEach(face => {
      face.state = face.nextState;
    });

    // 3. Step timeline management
    this.stepCount++;
    this.saveStateToHistory();
    this.updateTimelineUI();

    // 4. Redraw
    this.visualizer.draw();
    
    // 5. Update UI stats
    this.updateStatistics();
    this.inspectLockedFace();
    this.checkScreensaverLoop();
  }

  runSteps(steps) {
    this.pause();
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(interval);
        this.cliConsole.log(`Completed running ${steps} steps.`, 'success-line');
        return;
      }
      this.step();
      currentStep++;
    }, this.intervalSpeed);
  }

  reset() {
    this.pause();
    this.stepCount = 0;
    
    if (this.history.length > 0) {
      // Restore step 0 states
      const initialStates = this.history[0];
      this.complex.faces.forEach((face, idx) => {
        face.state = initialStates[idx] || 0;
      });
      // Clear cache forward
      this.history = [initialStates];
    } else {
      this.complex.faces.forEach(face => face.state = 0);
      this.saveStateToHistory();
    }
    
    this.updateTimelineUI();
    this.resetLoopWatch();
    this.visualizer.draw();
    this.updateStatistics();
    this.inspectLockedFace();
  }

  clear() {
    this.pause();
    this.complex.faces.forEach(face => {
      face.state = 0;
      face.nextState = 0;
    });
    this.stepCount = 0;
    this.history = [];
    this.saveStateToHistory();
    this.resetLoopWatch();
    this.updateTimelineUI();
    this.visualizer.draw();
    this.updateStatistics();
    this.inspectLockedFace();
  }

  randomize(density = this.randomizeDensity, options = {}) {
    const aliveRate = Math.max(0, Math.min(1, Number(density)));
    this.randomizeDensity = Number.isFinite(aliveRate) ? aliveRate : 0.25;

    this.complex.faces.forEach(face => {
      // Conway: 2 states. Generations: multiple states.
      // Randomize cells using the configured alive/active rate.
      face.state = Math.random() < this.randomizeDensity ? 1 : 0;
    });
    
    // Reset step counter on randomize
    this.stepCount = 0;
    this.history = [];
    this.saveStateToHistory();
    this.resetLoopWatch();
    this.updateTimelineUI();
    this.visualizer.draw();
    this.updateStatistics();
    this.inspectLockedFace();
    if (this.screensaverMode) {
      this.updateStatusInfo('Screensaver');
    }
    const prefix = options.source === 'screensaver' ? 'Screensaver randomized' : 'Randomized';
    this.cliConsole.log(`${prefix} cell states at ${Math.round(this.randomizeDensity * 100)}% alive rate.`, 'system-line');
  }

  getStateHash() {
    return this.complex.faces.map(face => face.state).join(',');
  }

  resetLoopWatch() {
    this.loopWatchHashes = [];
    if (this.complex.faces.length > 0) {
      this.loopWatchHashes.push(this.getStateHash());
    }
  }

  checkScreensaverLoop() {
    if (!this.screensaverMode || this.complex.faces.length === 0) return false;

    const hash = this.getStateHash();
    if (this.loopWatchHashes.includes(hash)) {
      this.screensaverRandomizeCount++;
      this.cliConsole.log(
        `Screensaver loop detected within ${this.loopDetectionWindow} steps. Randomizing again (#${this.screensaverRandomizeCount}).`,
        'system-line'
      );
      this.randomize(this.randomizeDensity, { source: 'screensaver' });
      return true;
    }

    this.loopWatchHashes.push(hash);
    while (this.loopWatchHashes.length > this.loopDetectionWindow) {
      this.loopWatchHashes.shift();
    }
    return false;
  }

  // --- Neighborhood retrieval wrapper ---
  getNeighborsForFace(faceId) {
    return getFaceNeighbors(this.complex, faceId, this.neighborhoodMode, {
      weightEdge: this.weightEdge,
      weightVertex: this.weightVertex
    });
  }

  isRegularGridType(type = this.gridType) {
    return ['square', 'triangle', 'hex'].includes(type);
  }

  hasParameterSlider(type = this.gridType) {
    return [
      'voronoi',
      'hyperbolic-square',
      'hyperbolic-triangle',
      'hyperbolic-heptagon',
      'hyperbolic-regular-heptagon',
      'substitution-chair',
      'substitution-fibonacci',
      'substitution-penrose',
      'substitution-penrose-rhomb',
      'substitution-ammann-beenker',
      'substitution-custom',
      'octa-chain',
      'prism',
      'octa-grid',
      'cube-grid'
    ].includes(type);
  }

  isSubstitutionType(type = this.gridType) {
    return ['substitution-chair', 'substitution-fibonacci', 'substitution-penrose', 'substitution-penrose-rhomb', 'substitution-ammann-beenker', 'substitution-custom'].includes(type);
  }

  getNeighborTotalWeight(neighbors) {
    return neighbors.reduce((sum, neighbor) => sum + (Number(neighbor.weight) || 0), 0);
  }

  getAliveNeighborWeight(neighbors) {
    return neighbors.reduce((sum, neighbor) => {
      const neighborFace = this.complex.faceMap.get(neighbor.id);
      return sum + (neighborFace && neighborFace.state === 1 ? (Number(neighbor.weight) || 0) : 0);
    }, 0);
  }

  getEvaluatedNeighborCount(aliveWeight, totalWeight) {
    if (this.ruleEvaluator.correctionMode === 'ratio' && totalWeight > 0) {
      return Math.round((aliveWeight / totalWeight) * 8);
    }
    return Math.floor(aliveWeight);
  }

  formatActualCounts(counts, totalWeight) {
    if (counts.length === 0) return '-';
    const isIntegerWeight = Math.abs(totalWeight - Math.round(totalWeight)) < 1e-6;
    return counts.map(value => isIntegerWeight ? String(Math.round(value)) : value.toFixed(1)).join(', ');
  }

  getRatioRuleRows() {
    const totals = new Set();
    this.complex.faces.forEach(face => {
      const totalWeight = this.getNeighborTotalWeight(this.getNeighborsForFace(face.id));
      if (totalWeight > 0) totals.add(Math.round(totalWeight * 1000) / 1000);
    });

    return Array.from(totals).sort((a, b) => a - b).map(totalWeight => {
      const maxAlive = Math.max(0, Math.round(totalWeight));
      const birthCounts = [];
      const survivalCounts = [];
      for (let alive = 0; alive <= maxAlive; alive++) {
        const effective = Math.round((alive / totalWeight) * 8);
        if (this.ruleEvaluator.birthSet.has(effective)) birthCounts.push(alive);
        if (this.ruleEvaluator.survivalSet.has(effective)) survivalCounts.push(alive);
      }
      return { totalWeight, birthCounts, survivalCounts };
    });
  }

  updateRatioRuleMap() {
    const group = document.getElementById('ratio-rule-map-group');
    const note = document.getElementById('ratio-rule-note');
    const table = document.getElementById('ratio-rule-table');
    if (!group || !note || !table) return;

    const isRatio = this.ruleEvaluator.correctionMode === 'ratio';
    group.style.display = isRatio ? 'flex' : 'none';
    if (!isRatio) return;

    if (this.ruleEvaluator.type === 'custom-js') {
      note.textContent = 'Custom JS rules receive raw neighbors; Ratio-Based B/S mapping is not used.';
      table.innerHTML = '';
      return;
    }

    const birth = Array.from(this.ruleEvaluator.birthSet).sort((a, b) => a - b).join(',') || '-';
    const survive = Array.from(this.ruleEvaluator.survivalSet).sort((a, b) => a - b).join(',') || '-';
    note.textContent = `Effective count = round(alive / neighbors * 8). Rule ${this.ruleEvaluator.ruleString}: B${birth} / S${survive}.`;

    const rows = this.getRatioRuleRows();
    if (rows.length === 0) {
      table.innerHTML = '<div class="ratio-rule-empty">No neighbor counts available.</div>';
      return;
    }

    table.innerHTML = rows.map(row => `
      <div class="ratio-rule-row">
        <span class="ratio-rule-degree">N=${row.totalWeight}</span>
        <span class="ratio-rule-birth">B: ${this.formatActualCounts(row.birthCounts, row.totalWeight)}</span>
        <span class="ratio-rule-survive">S: ${this.formatActualCounts(row.survivalCounts, row.totalWeight)}</span>
      </div>
    `).join('');
  }

  configureParameterSlider(type, resetValue = false) {
    const label = document.querySelector('#grid-jitter-group label');
    const slider = document.getElementById('slider-jitter');
    const value = document.getElementById('val-jitter');
    if (!label || !slider || !value) return;

    let nextValue = this.jitterCount;
    if (type === 'voronoi') {
      label.textContent = "Voronoi Seed Count";
      slider.min = 20; slider.max = 400; slider.step = 10;
      nextValue = 150;
    } else if (['hyperbolic-square', 'hyperbolic-triangle', 'hyperbolic-heptagon'].includes(type)) {
      label.textContent = "Hyperbolic Patch Layers";
      slider.min = 2; slider.max = 7; slider.step = 1;
      nextValue = 5;
    } else if (type === 'hyperbolic-regular-heptagon') {
      label.textContent = "Hyperbolic {7,3} Layers";
      slider.min = 0; slider.max = 4; slider.step = 1;
      nextValue = 3;
    } else if (type === 'substitution-ammann-beenker') {
      label.textContent = "Projection Range";
      slider.min = 2; slider.max = 7; slider.step = 1;
      nextValue = 5;
    } else if (this.isSubstitutionType(type)) {
      label.textContent = "Substitution Iterations";
      slider.min = 0; slider.max = (type === 'substitution-penrose' || type === 'substitution-penrose-rhomb') ? 7 : (type === 'substitution-chair' ? 6 : 10); slider.step = 1;
      nextValue = type === 'substitution-fibonacci' ? 6 : ((type === 'substitution-penrose' || type === 'substitution-penrose-rhomb') ? 5 : 4);
    } else if (type === 'octa-chain') {
      label.textContent = "Chain Length";
      slider.min = 2; slider.max = 20; slider.step = 1;
      nextValue = 5;
    } else if (type === 'prism') {
      label.textContent = "Prism Polygon Sides";
      slider.min = 3; slider.max = 20; slider.step = 1;
      nextValue = 5;
    } else if (type === 'octa-grid') {
      label.textContent = "Grid Side (N x N)";
      slider.min = 2; slider.max = 10; slider.step = 1;
      nextValue = 3;
    } else if (type === 'cube-grid') {
      label.textContent = "Grid Side (N x N x N)";
      slider.min = 2; slider.max = 6; slider.step = 1;
      nextValue = 3;
    }

    if (resetValue) this.jitterCount = nextValue;
    slider.value = this.jitterCount;
    value.textContent = this.jitterCount;
  }

  syncSubstitutionEditor() {
    const group = document.getElementById('substitution-editor-group');
    const textarea = document.getElementById('textarea-substitution-json');
    if (!group || !textarea) return;
    group.style.display = this.gridType === 'substitution-custom' ? 'flex' : 'none';
    if (!textarea.value) {
      textarea.value = this.substitutionDefinitionText;
    }
  }

  // --- History/Timeline Cache ---
  saveStateToHistory() {
    const states = this.complex.faces.map(f => f.state);
    
    // If scrubbing in past, truncate history ahead
    if (this.stepCount < this.history.length) {
      this.history = this.history.slice(0, this.stepCount);
    }
    
    this.history.push(states);
    
    // Limit cache length
    if (this.history.length > this.historyLimit) {
      this.history.shift();
      // Adjust step count offset if we deleted old steps
      // Note: For a simpler slide UI, we can just cap it
    }
  }

  loadStateFromHistory(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.history.length) {
      this.stepCount = stepIndex;
      const states = this.history[stepIndex];
      this.complex.faces.forEach((face, idx) => {
        face.state = states[idx] || 0;
      });
      this.visualizer.draw();
      this.updateStatistics();
      this.inspectLockedFace();
    }
  }

  // --- Event Handling and UI Connection ---

  setupUIEvents() {
    // Canvas interaction events mapped from Visualizer
    this.visualizer.canvas.addEventListener('facetoggle', (e) => {
      const faceId = e.detail.id;
      const face = this.complex.faceMap.get(faceId);
      if (face) {
        // Conway or Generations toggle state
        if (face.state === this.drawStateTool) {
          face.state = 0;
        } else {
          face.state = this.drawStateTool;
        }
        this.visualizer.draw();
        this.updateStatistics();
        this.inspectFace(faceId);
      }
    });

    this.visualizer.canvas.addEventListener('facehover', (e) => {
      const faceId = e.detail.id;
      if (this.visualizer.lockedFaceId === null) {
        this.inspectFace(faceId);
      }
    });

    this.visualizer.canvas.addEventListener('facelock', (e) => {
      const faceId = e.detail.id;
      if (faceId !== null) {
        this.inspectFace(faceId);
      } else {
        document.getElementById('inspector-hud').style.display = 'none';
      }
    });

    // Control bar triggers
    document.getElementById('btn-play').addEventListener('click', () => {
      if (this.isPlaying) this.pause();
      else this.play();
    });

    document.getElementById('btn-step').addEventListener('click', () => {
      this.pause();
      this.step();
    });

    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
    document.getElementById('btn-clear').addEventListener('click', () => this.clear());
    document.getElementById('btn-randomize').addEventListener('click', () => this.randomize());

    // Sliders
    const sliderSpeed = document.getElementById('slider-speed');
    sliderSpeed.addEventListener('input', () => {
      this.intervalSpeed = parseInt(sliderSpeed.value, 10);
      document.getElementById('val-speed').textContent = `${this.intervalSpeed}ms`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });

    const sliderHist = document.getElementById('slider-history-len');
    sliderHist.addEventListener('input', () => {
      this.historyLimit = parseInt(sliderHist.value, 10);
      document.getElementById('val-history-len').textContent = this.historyLimit;
    });

    const sliderRandomDensity = document.getElementById('slider-random-density');
    sliderRandomDensity.addEventListener('input', () => {
      this.randomizeDensity = parseInt(sliderRandomDensity.value, 10) / 100;
      document.getElementById('val-random-density').textContent = `${Math.round(this.randomizeDensity * 100)}%`;
    });

    document.querySelectorAll('[data-substitution-preset]').forEach(button => {
      button.addEventListener('click', () => {
        const presetName = button.getAttribute('data-substitution-preset');
        this.substitutionDefinitionText = JSON.stringify(cloneSubstitutionPreset(presetName), null, 2);
        const editor = document.getElementById('textarea-substitution-json');
        if (editor) editor.value = this.substitutionDefinitionText;
        this.cliConsole.log(`Loaded ${presetName} JSON example into the custom pattern editor.`, 'system-line');
      });
    });

    document.getElementById('chk-screensaver-mode').addEventListener('change', (e) => {
      this.screensaverMode = e.target.checked;
      this.resetLoopWatch();
      this.updateStatusInfo(this.screensaverMode ? 'Screensaver' : (this.isPlaying ? 'Running' : 'Paused'));
      this.cliConsole.log(`Screensaver auto-randomize ${this.screensaverMode ? 'enabled' : 'disabled'}.`, 'system-line');
      if (this.screensaverMode && !this.isPlaying) {
        this.play();
      }
    });

    // Grid Parameters Rebuild
    document.getElementById('btn-rebuild-grid').addEventListener('click', () => {
      this.gridType = document.getElementById('select-complex').value;
      this.gridW = parseInt(document.getElementById('input-grid-w').value, 10) || 30;
      this.gridH = parseInt(document.getElementById('input-grid-h').value, 10) || 30;
      const parsedJitter = parseInt(document.getElementById('slider-jitter').value, 10);
      this.jitterCount = Number.isNaN(parsedJitter) ? 150 : parsedJitter;
      this.topologyType = document.getElementById('select-topology').value;
      this.doubleTorusHoleRadius = parseFloat(document.getElementById('slider-torus-hole').value) || 1.2;
      const substitutionEditor = document.getElementById('textarea-substitution-json');
      if (substitutionEditor) {
        this.substitutionDefinitionText = substitutionEditor.value;
      }
      
      this.rebuildGrid();
      this.updateUIFromState();
    });

    // Adjust grid inputs availability depending on grid types
    document.getElementById('select-complex').addEventListener('change', (e) => {
      const type = e.target.value;
      const isRegular = this.isRegularGridType(type);
      const hasSlider = this.hasParameterSlider(type);
      this.gridType = type;

      document.getElementById('grid-dimensions-group').style.display = isRegular ? 'flex' : 'none';
      document.getElementById('grid-jitter-group').style.display = hasSlider ? 'flex' : 'none';
      document.getElementById('select-topology').disabled = !isRegular;
      this.syncSubstitutionEditor();

      // Force topology display update on grid change
      if (!isRegular) {
        document.getElementById('topology-hole-group').style.display = 'none';
      } else {
        const topo = document.getElementById('select-topology').value;
        document.getElementById('topology-hole-group').style.display = topo === 'double-torus' ? 'flex' : 'none';
      }

      this.configureParameterSlider(type, true);
    });

    document.getElementById('slider-jitter').addEventListener('input', (e) => {
      document.getElementById('val-jitter').textContent = e.target.value;
    });

    // Topology Selector Directly updates header label
    document.getElementById('select-topology').addEventListener('change', (e) => {
      this.topologyType = e.target.value;
      const isDoubleTorus = this.topologyType === 'double-torus';
      document.getElementById('topology-hole-group').style.display = isDoubleTorus ? 'flex' : 'none';
    });

    document.getElementById('slider-torus-hole').addEventListener('input', (e) => {
      this.doubleTorusHoleRadius = parseFloat(e.target.value);
      document.getElementById('val-torus-hole').textContent = this.doubleTorusHoleRadius.toFixed(1);
    });

    // Neighborhood mode
    document.getElementById('select-neighborhood').addEventListener('change', (e) => {
      this.neighborhoodMode = e.target.value;
      
      const isWeighted = this.neighborhoodMode === 'weighted-incidence';
      document.getElementById('weighted-neighborhood-controls').style.display = isWeighted ? 'block' : 'none';
      
      this.visualizer.draw();
      this.updateRatioRuleMap();
      this.cliConsole.log(`Neighborhood mode set to: ${this.neighborhoodMode}`, 'system-line');
    });

    document.getElementById('slider-weight-edge').addEventListener('input', (e) => {
      this.weightEdge = parseFloat(e.target.value);
      document.getElementById('val-weight-edge').textContent = this.weightEdge.toFixed(1);
      this.visualizer.draw();
      this.updateRatioRuleMap();
    });

    document.getElementById('slider-weight-vertex').addEventListener('input', (e) => {
      this.weightVertex = parseFloat(e.target.value);
      document.getElementById('val-weight-vertex').textContent = this.weightVertex.toFixed(1);
      this.visualizer.draw();
      this.updateRatioRuleMap();
    });

    // Rule Setup and Parsing
    document.getElementById('select-rule-preset').addEventListener('change', (e) => {
      const presetName = e.target.value;
      
      if (presetName === 'custom-text') {
        document.getElementById('rule-text-input-group').style.display = 'block';
        document.getElementById('rule-js-editor-group').style.display = 'none';
      } else if (presetName === 'custom-js') {
        document.getElementById('rule-text-input-group').style.display = 'none';
        document.getElementById('rule-js-editor-group').style.display = 'block';
      } else {
        document.getElementById('rule-text-input-group').style.display = 'block';
        document.getElementById('rule-js-editor-group').style.display = 'none';
        
        const preset = RULE_PRESETS[presetName];
        if (preset) {
          document.getElementById('input-rule-string').value = preset.rule;
          this.ruleEvaluator.parseRuleString(preset.rule);
          this.updateUIFromState();
          this.cliConsole.log(`Applied preset rule: ${preset.name} (${preset.rule})`, 'success-line');
        }
      }
    });

    document.getElementById('input-rule-string').addEventListener('change', (e) => {
      this.ruleEvaluator.parseRuleString(e.target.value);
      this.updateUIFromState();
      this.cliConsole.log(`Applied rule string: ${this.ruleEvaluator.ruleString}`, 'success-line');
    });

    document.getElementById('btn-apply-js-rule').addEventListener('click', () => {
      const script = document.getElementById('textarea-rule-js').value;
      const res = this.ruleEvaluator.compileCustomJsRule(script);
      
      if (res.success) {
        this.updateUIFromState();
        this.cliConsole.log('Compiled and applied Custom JS Transition Rule successfully.', 'success-line');
      } else {
        this.cliConsole.log(`JS Compile Error: ${res.error}`, 'error-line');
      }
    });

    document.getElementById('select-correction').addEventListener('change', (e) => {
      this.ruleEvaluator.correctionMode = e.target.value;
      this.updateRatioRuleMap();
      this.inspectLockedFace();
      this.cliConsole.log(`Correction mode set to: ${this.ruleEvaluator.correctionMode}`, 'system-line');
    });

    // Visual options
    document.getElementById('select-view-mode').addEventListener('change', (e) => {
      this.visualizer.viewMode = e.target.value;
      this.visualizer.draw();
    });

    document.getElementById('chk-show-faces').addEventListener('change', (e) => {
      this.visualizer.showFaces = e.target.checked;
      this.visualizer.draw();
    });

    document.getElementById('chk-show-edges').addEventListener('change', (e) => {
      this.visualizer.showEdges = e.target.checked;
      this.visualizer.draw();
    });

    document.getElementById('chk-show-vertices').addEventListener('change', (e) => {
      this.visualizer.showVertices = e.target.checked;
      this.visualizer.draw();
    });

    document.getElementById('chk-show-ids').addEventListener('change', (e) => {
      this.visualizer.showIDs = e.target.checked;
      this.visualizer.draw();
    });

    // Toolbar draw tools
    document.querySelectorAll('.btn-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.drawStateTool = parseInt(btn.getAttribute('data-state'), 10);
      });
    });

    document.getElementById('btn-center-view').addEventListener('click', () => {
      this.visualizer.centerView();
    });

    // HUD Close button
    document.getElementById('btn-hud-close').addEventListener('click', () => {
      this.visualizer.lockedFaceId = null;
      document.getElementById('inspector-hud').style.display = 'none';
      this.visualizer.draw();
    });

    // CLI console Clear logs
    document.getElementById('btn-clear-console').addEventListener('click', () => {
      this.cliConsole.clear();
    });

    // Timeline actions
    const sliderTime = document.getElementById('slider-timeline');
    sliderTime.addEventListener('input', () => {
      const idx = parseInt(sliderTime.value, 10);
      this.loadStateFromHistory(idx);
    });

    document.getElementById('btn-history-prev').addEventListener('click', () => {
      if (this.stepCount > 0) {
        this.loadStateFromHistory(this.stepCount - 1);
        this.updateTimelineUI();
      }
    });

    document.getElementById('btn-history-next').addEventListener('click', () => {
      if (this.stepCount < this.history.length - 1) {
        this.loadStateFromHistory(this.stepCount + 1);
        this.updateTimelineUI();
      }
    });

    // Save project button
    document.getElementById('btn-save-project').addEventListener('click', () => {
      this.saveProjectFile();
    });

    // Trigger Load JSON button
    document.getElementById('btn-trigger-load').addEventListener('click', () => {
      document.getElementById('input-file-load').click();
    });

    // Quick Save & Load buttons
    document.getElementById('btn-quicksave').addEventListener('click', () => {
      this.quickSave();
    });
    document.getElementById('btn-quickload').addEventListener('click', () => {
      this.quickLoad();
    });

    // Drag & Drop project files load
    const dropZone = document.getElementById('file-drop-zone');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.loadProjectFile(files[0]);
      }
    });
    dropZone.addEventListener('click', () => {
      document.getElementById('input-file-load').click();
    });
    document.getElementById('input-file-load').addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        this.loadProjectFile(files[0]);
      }
    });

    // Interactive glue button
    document.getElementById('btn-interactive-glue').addEventListener('click', () => {
      const input = prompt("結合（同一視）する2つの頂点IDを入力してください (例: '10 25'):");
      if (input) {
        const parts = input.trim().split(/\s+/);
        if (parts.length >= 2) {
          const id1 = parseInt(parts[0], 10);
          const id2 = parseInt(parts[1], 10);
          if (!isNaN(id1) && !isNaN(id2)) {
            if (this.complex.vertexMap.has(id1) && this.complex.vertexMap.has(id2)) {
              this.complex.mergeVertices(id1, id2);
              this.complex.cleanAndReindex();
              this.visualizer.draw();
              this.cliConsole.log(`Merged vertex ${id2} into vertex ${id1} topologically.`, 'success-line');
            } else {
              alert("指定された頂点IDのどちらかが存在しません。");
            }
          } else {
            alert("IDは数値で指定してください。");
          }
        }
      }
    });
  }

  updateUIFromState() {
    document.getElementById('header-topology').textContent = this.topologyType.toUpperCase();
    document.getElementById('header-rule').textContent = this.ruleEvaluator.ruleString;
    
    document.getElementById('select-complex').value = this.gridType;
    document.getElementById('input-grid-w').value = this.gridW;
    document.getElementById('input-grid-h').value = this.gridH;
    document.getElementById('select-topology').value = this.topologyType;
    document.getElementById('select-neighborhood').value = this.neighborhoodMode;

    const isWeighted = this.neighborhoodMode === 'weighted-incidence';
    document.getElementById('weighted-neighborhood-controls').style.display = isWeighted ? 'block' : 'none';

    // Show/hide correct sliders depending on grid selection
    const isRegular = this.isRegularGridType();
    const hasSlider = this.hasParameterSlider();
    document.getElementById('grid-dimensions-group').style.display = isRegular ? 'flex' : 'none';
    document.getElementById('grid-jitter-group').style.display = hasSlider ? 'flex' : 'none';
    document.getElementById('select-topology').disabled = !isRegular;
    const substitutionEditor = document.getElementById('textarea-substitution-json');
    if (substitutionEditor) substitutionEditor.value = this.substitutionDefinitionText;
    this.syncSubstitutionEditor();

    // Show/hide topology hole size control
    const isDoubleTorus = isRegular && this.topologyType === 'double-torus';
    document.getElementById('topology-hole-group').style.display = isDoubleTorus ? 'flex' : 'none';
    document.getElementById('slider-torus-hole').value = this.doubleTorusHoleRadius;
    document.getElementById('val-torus-hole').textContent = this.doubleTorusHoleRadius.toFixed(1);

    if (hasSlider) {
      this.configureParameterSlider(this.gridType, false);
    }

    // Rule selectors
    if (this.ruleEvaluator.type === 'custom-js') {
      document.getElementById('select-rule-preset').value = 'custom-js';
      document.getElementById('rule-text-input-group').style.display = 'none';
      document.getElementById('rule-js-editor-group').style.display = 'block';
    } else {
      document.getElementById('rule-js-editor-group').style.display = 'none';
      document.getElementById('rule-text-input-group').style.display = 'block';
      document.getElementById('input-rule-string').value = this.ruleEvaluator.ruleString;
      
      // Attempt to match preset
      let matched = 'custom-text';
      for (const [key, preset] of Object.entries(RULE_PRESETS)) {
        if (preset.rule === this.ruleEvaluator.ruleString) {
          matched = key;
          break;
        }
      }
      document.getElementById('select-rule-preset').value = matched;
    }

    document.getElementById('select-correction').value = this.ruleEvaluator.correctionMode;
    document.getElementById('slider-random-density').value = Math.round(this.randomizeDensity * 100);
    document.getElementById('val-random-density').textContent = `${Math.round(this.randomizeDensity * 100)}%`;
    document.getElementById('chk-screensaver-mode').checked = this.screensaverMode;
    this.updateRatioRuleMap();

    // Draw Tool availability
    const draw2Btn = document.getElementById('tool-draw-2');
    if (this.ruleEvaluator.stateCount > 2) {
      draw2Btn.style.display = 'inline-block';
    } else {
      draw2Btn.style.display = 'none';
      if (this.drawStateTool === 2) {
        this.drawStateTool = 1;
        document.querySelectorAll('.btn-tool').forEach(b => b.classList.remove('active'));
        document.getElementById('tool-draw-1').classList.add('active');
      }
    }

    this.updateStatistics();
  }

  updateTimelineUI() {
    const sliderTime = document.getElementById('slider-timeline');
    const prevBtn = document.getElementById('btn-history-prev');
    const nextBtn = document.getElementById('btn-history-next');

    sliderTime.max = this.history.length - 1;
    sliderTime.value = this.stepCount;
    sliderTime.disabled = this.history.length <= 1;

    prevBtn.disabled = this.stepCount <= 0;
    nextBtn.disabled = this.stepCount >= this.history.length - 1;

    document.getElementById('status-step').textContent = this.stepCount;
  }

  updateStatistics() {
    let aliveCount = 0;
    let dyingCount = 0;

    this.complex.faces.forEach(face => {
      if (face.state === 1) aliveCount++;
      else if (face.state > 1) dyingCount++;
    });

    document.getElementById('status-cells').textContent = this.complex.faces.length;
    document.getElementById('status-alive').textContent = aliveCount;
    document.getElementById('status-dying').textContent = dyingCount;
  }

  updateStatusInfo(text) {
    document.getElementById('status-info').textContent = text;
  }

  inspectLockedFace() {
    if (this.visualizer.lockedFaceId !== null) {
      this.inspectFace(this.visualizer.lockedFaceId);
    }
  }

  inspectFace(faceId) {
    if (faceId === null) {
      if (this.visualizer.lockedFaceId === null) {
        document.getElementById('inspector-hud').style.display = 'none';
      }
      return;
    }

    const face = this.complex.faceMap.get(faceId);
    if (!face) return;

    // Calculate next state explanation preview
    const neighbors = this.getNeighborsForFace(face.id);
    const next = this.ruleEvaluator.evaluateNextState(face, neighbors, this.complex.faceMap);
    const totalWeight = this.getNeighborTotalWeight(neighbors);
    const aliveWeight = this.getAliveNeighborWeight(neighbors);
    const evaluatedCount = this.getEvaluatedNeighborCount(aliveWeight, totalWeight);

    document.getElementById('inspect-face-id').textContent = face.id;
    document.getElementById('inspect-face-state').textContent = `${face.state} (Sheet: ${face.sheet})`;
    document.getElementById('inspect-face-vertices').textContent = `${face.vertices.length} vertices`;
    document.getElementById('inspect-face-edges').textContent = `${face.edges.length} edges`;
    
    // Sort neighbor IDs for clean read
    const nIds = neighbors.map(n => n.id).sort((a,b) => a - b);
    document.getElementById('inspect-face-neighbors').textContent = `${neighbors.length} cells (${nIds.join(',')})`;
    document.getElementById('inspect-face-next').textContent = next;

    if (this.ruleEvaluator.correctionMode === 'ratio' && totalWeight > 0 && this.ruleEvaluator.type !== 'custom-js') {
      const birthMatch = this.ruleEvaluator.birthSet.has(evaluatedCount);
      const survivalMatch = this.ruleEvaluator.survivalSet.has(evaluatedCount);
      const totalLabel = Math.abs(totalWeight - Math.round(totalWeight)) < 1e-6 ? Math.round(totalWeight) : totalWeight.toFixed(1);
      const aliveLabel = Math.abs(aliveWeight - Math.round(aliveWeight)) < 1e-6 ? Math.round(aliveWeight) : aliveWeight.toFixed(1);
      document.getElementById('inspect-explanation').textContent =
        `Ratio: ${aliveLabel}/${totalLabel} -> round(*8) = ${evaluatedCount}. ` +
        `Birth ${birthMatch ? 'yes' : 'no'}, Survival ${survivalMatch ? 'yes' : 'no'}.`;
    } else {
      document.getElementById('inspect-explanation').textContent =
        `Click cell to toggle state. Alt+Click on cell to lock/unlock inspection.`;
    }

    document.getElementById('inspector-hud').style.display = 'block';
  }

  // --- Animation loop for UI HUD and FPS count ---
  animationLoop() {
    const loop = (time) => {
      const delta = time - this.lastFrameTime;
      this.lastFrameTime = time;
      this.fps = Math.round(1000 / delta) || 0;

      // Update FPS label every few frames
      if (Math.random() < 0.15) {
        document.getElementById('status-fps-display').innerHTML = `FPS: <strong>${this.fps}</strong>`;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // --- Project Save & Load (JSON format) ---

  // --- Project Save & Load (JSON format) ---

  serializeProjectData() {
    return {
      metadata: {
        appName: "Generalized Game of Life Laboratory",
        saveTime: new Date().toISOString()
      },
      config: {
        gridType: this.gridType,
        gridW: this.gridW,
        gridH: this.gridH,
        jitterCount: this.jitterCount,
        substitutionDefinitionText: this.substitutionDefinitionText,
        topologyType: this.topologyType,
        doubleTorusHoleRadius: this.doubleTorusHoleRadius,
        neighborhoodMode: this.neighborhoodMode,
        weightEdge: this.weightEdge,
        weightVertex: this.weightVertex,
        randomizeDensity: this.randomizeDensity,
        screensaverMode: this.screensaverMode,
        loopDetectionWindow: this.loopDetectionWindow,
        ruleString: this.ruleEvaluator.ruleString,
        ruleType: this.ruleEvaluator.type,
        stateCount: this.ruleEvaluator.stateCount,
        correctionMode: this.ruleEvaluator.correctionMode,
        stepCount: this.stepCount
      },
      complex: {
        vertices: this.complex.vertices.map(v => ({
          id: v.id,
          x2d: v.position2D.x,
          y2d: v.position2D.y,
          x3d: v.position3D.x,
          y3d: v.position3D.y,
          z3d: v.position3D.z,
          tags: v.tags
        })),
        edges: this.complex.edges.map(e => ({
          id: e.id,
          vertices: e.vertices,
          tags: e.tags
        })),
        faces: this.complex.faces.map(f => ({
          id: f.id,
          vertices: f.vertices,
          renderPoints: f.renderPoints,
          state: f.state,
          sheet: f.sheet,
          tags: f.tags
        }))
      }
    };
  }

  deserializeProjectData(data) {
    // 1. Restore Config Parameters
    const conf = data.config;
    this.gridType = conf.gridType;
    this.gridW = conf.gridW;
    this.gridH = conf.gridH;
    this.jitterCount = conf.jitterCount || 150;
    this.substitutionDefinitionText = conf.substitutionDefinitionText || JSON.stringify(cloneSubstitutionPreset('chair'), null, 2);
    this.topologyType = conf.topologyType;
    this.doubleTorusHoleRadius = conf.doubleTorusHoleRadius !== undefined ? conf.doubleTorusHoleRadius : 1.2;
    this.neighborhoodMode = conf.neighborhoodMode;
    this.weightEdge = conf.weightEdge !== undefined ? conf.weightEdge : 1.0;
    this.weightVertex = conf.weightVertex !== undefined ? conf.weightVertex : 0.5;
    this.randomizeDensity = conf.randomizeDensity !== undefined ? conf.randomizeDensity : 0.25;
    this.screensaverMode = Boolean(conf.screensaverMode);
    this.loopDetectionWindow = conf.loopDetectionWindow || 20;
    this.stepCount = conf.stepCount || 0;

    // Restore rules
    this.ruleEvaluator.ruleString = conf.ruleString;
    this.ruleEvaluator.type = conf.ruleType;
    this.ruleEvaluator.stateCount = conf.stateCount;
    this.ruleEvaluator.correctionMode = conf.correctionMode || 'absolute';
    this.ruleEvaluator.parseRuleString(conf.ruleString);

    // 2. Reconstruct Cell Complex
    this.complex.clear();
    this.visualizer.is3D = ['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron', 'truncated-tetrahedron', 'cuboctahedron', 'truncated-cube', 'truncated-octahedron', 'rhombicuboctahedron', 'truncated-cuboctahedron', 'snub-cube', 'icosidodecahedron', 'truncated-dodecahedron', 'truncated-icosahedron', 'rhombicosidodecahedron', 'truncated-icosidodecahedron', 'snub-dodecahedron', 'prism', 'octa-chain', 'octa-grid', 'cube-grid'].includes(this.gridType);

    // Load vertices
    data.complex.vertices.forEach(vData => {
      const v = this.complex.addVertex(vData.x2d, vData.y2d, vData.z3d || 0);
      v.id = vData.id;
      v.position3D = { x: vData.x3d, y: vData.y3d, z: vData.z3d || 0 };
      v.tags = vData.tags || [];
    });
    // rebuild vertexMap index
    this.complex.vertexMap.clear();
    this.complex.vertices.forEach(v => this.complex.vertexMap.set(v.id, v));

    // Load edges
    data.complex.edges.forEach(eData => {
      const e = this.complex.addEdge(eData.vertices[0], eData.vertices[1]);
      e.id = eData.id;
      e.tags = eData.tags || [];
    });
    // rebuild edgeMap index
    this.complex.edgeMap.clear();
    this.complex.edges.forEach(e => this.complex.edgeMap.set(e.id, e));

    // Load faces
    data.complex.faces.forEach(fData => {
      const face = this.complex.addFace(fData.vertices, fData.renderPoints);
      face.id = fData.id;
      face.state = fData.state;
      face.sheet = fData.sheet || 0;
      face.tags = fData.tags || [];
    });

    // Run re-indexing to ensure structural safety
    this.complex.cleanAndReindex();

    // 3. Reset history cache to load point
    this.history = [];
    this.saveStateToHistory();
    this.resetLoopWatch();
    this.updateTimelineUI();

    // 4. Update visuals and console logs
    this.visualizer.lockedFaceId = null;
    this.visualizer.hoveredFaceId = null;
    this.updateUIFromState();
    this.visualizer.centerView();
  }

  saveProjectFile() {
    const data = this.serializeProjectData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${this.gridType}-${this.topologyType}-${this.stepCount}.gcomplexlife.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.cliConsole.log('Project JSON saved successfully.', 'success-line');
  }

  loadProjectFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        this.deserializeProjectData(data);
        this.cliConsole.log(`Successfully loaded project file. Grid: ${this.gridType}, Cells: ${this.complex.faces.length}`, 'success-line');
      } catch (err) {
        this.cliConsole.log(`Error parsing project JSON file: ${err.message}`, 'error-line');
        alert("プロジェクトファイルの読み込みに失敗しました。無効な形式です。");
      }
    };
    reader.readAsText(file);
  }

  quickSave() {
    try {
      const data = this.serializeProjectData();
      localStorage.setItem('gcomplexlife_quicksave', JSON.stringify(data));
      const qlBtn = document.getElementById('btn-quickload');
      if (qlBtn) qlBtn.disabled = false;
      this.cliConsole.log('Quick Save successful.', 'success-line');
    } catch (err) {
      this.cliConsole.log(`Quick Save failed: ${err.message}`, 'error-line');
    }
  }

  quickLoad() {
    try {
      const raw = localStorage.getItem('gcomplexlife_quicksave');
      if (!raw) {
        alert("簡易セーブデータが存在しません。");
        return;
      }
      const data = JSON.parse(raw);
      this.deserializeProjectData(data);
      this.cliConsole.log('Quick Load successful.', 'success-line');
    } catch (err) {
      this.cliConsole.log(`Quick Load failed: ${err.message}`, 'error-line');
      alert("簡易ロードに失敗しました。");
    }
  }
}

// Start application on page load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
