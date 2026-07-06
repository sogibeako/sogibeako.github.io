/**
 * Interactive Command Line Interface (CLI) Console Panel
 */

export class CliConsole {
  constructor(consoleLogId, consoleInputId, app) {
    this.logEl = document.getElementById(consoleLogId);
    this.inputEl = document.getElementById(consoleInputId);
    this.app = app;

    this.history = [];
    this.historyIndex = -1;

    this.setupEvents();
  }

  setupEvents() {
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const command = this.inputEl.value.trim();
        if (command) {
          this.execute(command);
          this.history.push(command);
          // Limit history length
          if (this.history.length > 50) this.history.shift();
          this.historyIndex = this.history.length;
          this.inputEl.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.inputEl.value = this.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.inputEl.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          this.inputEl.value = '';
        }
      }
    });
  }

  /**
   * Appends a log line with styling.
   */
  log(text, styleClass = 'output-line') {
    const line = document.createElement('div');
    line.className = `log-line ${styleClass}`;
    line.textContent = text;
    this.logEl.appendChild(line);
    
    // Auto scroll to bottom
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  clear() {
    this.logEl.innerHTML = '';
  }

  execute(cmdText) {
    // Log user input
    this.log(`> ${cmdText}`, 'command-line');

    const parts = cmdText.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        this.cmdHelp();
        break;
      case 'clear':
        this.clear();
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'run':
        this.cmdRun(args);
        break;
      case 'pause':
      case 'stop':
        this.app.pause();
        this.log('Simulation paused.', 'system-line');
        break;
      case 'step':
        this.app.step();
        this.log(`Simulation stepped to step ${this.app.stepCount}.`, 'system-line');
        break;
      case 'reset':
        this.app.reset();
        this.log('Simulation reset to initial state.', 'system-line');
        break;
      case 'randomize':
        this.cmdRandomize(args);
        break;
      case 'set':
        this.cmdSet(args);
        break;
      case 'generate':
        this.cmdGenerate(args);
        break;
      case 'inspect':
        this.cmdInspect(args);
        break;
      case 'show':
        this.cmdShow(args);
        break;
      case 'merge':
        this.cmdMerge(args);
        break;
      case 'explain':
        this.cmdExplain(args);
        break;
      default:
        this.log(`Unknown command: "${command}". Type "help" for a list of commands.`, 'error-line');
    }
  }

  cmdHelp() {
    this.log('Available Commands:', 'system-line');
    this.log('  help                         - Show list of commands');
    this.log('  clear                        - Clear console log screen');
    this.log('  status                       - Show current configuration');
    this.log('  run [steps]                  - Run simulation (optional number of generations)');
    this.log('  pause                        - Pause active simulation');
    this.log('  step                         - Advance simulation 1 generation');
    this.log('  reset                        - Reset cells to initial state');
    this.log('  randomize [percent]          - Randomize cell states at current or specified alive rate');
    this.log('  set rule <notation>          - Set rule (e.g. B3/S23, B2/S/C3)');
    this.log('  set topology <type>          - Set topology (plane, torus, klein, projective, mobius, double-torus, two-sheet)');
    this.log('  set neighborhood <type>      - Set neighborhood mode (edge-sharing, vertex-sharing, weighted-incidence)');
    this.log('  generate <type> [args]       - Rebuild grid (square [W] [H], triangle [W] [H], hex [W] [H], voronoi [seeds], cube, octahedron, octa-chain [len])');
    this.log('  inspect face <id>            - Details of specific cell face');
    this.log('  show neighbors <id>          - Highlight neighbors of face');
    this.log('  merge vertex <id1> <id2>     - Topologically merge two vertices');
    this.log('  explain next <id>            - Step-by-step transition evaluation for face');
  }

  cmdStatus() {
    this.log('Current System Status:', 'system-line');
    this.log(`  Rule: ${this.app.ruleEvaluator.ruleString} (${this.app.ruleEvaluator.type}, ${this.app.ruleEvaluator.stateCount} states)`);
    this.log(`  Topology: ${this.app.topologyType}`);
    this.log(`  Grid Type: ${this.app.gridType} (Width: ${this.app.gridW}, Height: ${this.app.gridH})`);
    this.log(`  Neighborhood: ${this.app.neighborhoodMode}`);
    this.log(`  Total Faces: ${this.app.complex.faces.length}, Edges: ${this.app.complex.edges.length}, Vertices: ${this.app.complex.vertices.length}`);
    this.log(`  Correction: ${this.app.ruleEvaluator.correctionMode}`);
    this.log(`  Simulation Speed: ${this.app.intervalSpeed}ms`);
    this.log(`  Randomize Alive Rate: ${Math.round(this.app.randomizeDensity * 100)}%`);
  }

  cmdRandomize(args) {
    if (args.length > 0) {
      const percent = parseFloat(args[0]);
      if (Number.isNaN(percent) || percent < 0 || percent > 100) {
        this.log('Invalid alive rate. Usage: randomize [0-100]', 'error-line');
        return;
      }
      this.app.randomize(percent / 100);
      this.app.updateUIFromState();
    } else {
      this.app.randomize();
    }
  }

  cmdRun(args) {
    if (args.length > 0) {
      const steps = parseInt(args[0], 10);
      if (!isNaN(steps) && steps > 0) {
        this.log(`Running simulation for ${steps} steps...`, 'system-line');
        this.app.runSteps(steps);
      } else {
        this.log('Invalid step count. Usage: run [steps]', 'error-line');
      }
    } else {
      this.app.play();
      this.log('Simulation playing...', 'system-line');
    }
  }

  cmdSet(args) {
    if (args.length < 2) {
      this.log('Usage: set [rule | topology | neighborhood] <value>', 'error-line');
      return;
    }

    const sub = args[0].toLowerCase();
    const val = args.slice(1).join(' ');

    if (sub === 'rule') {
      this.app.ruleEvaluator.parseRuleString(val);
      this.app.updateUIFromState();
      this.log(`Rule changed to: ${this.app.ruleEvaluator.ruleString}`, 'success-line');
    } else if (sub === 'topology') {
      const allowed = ['plane', 'torus', 'klein', 'projective', 'mobius', 'double-torus', 'two-sheet'];
      if (allowed.includes(val.toLowerCase())) {
        this.app.topologyType = val.toLowerCase();
        this.app.rebuildGrid();
        this.log(`Topology changed to: ${val}`, 'success-line');
      } else {
        this.log(`Invalid topology. Supported: ${allowed.join(', ')}`, 'error-line');
      }
    } else if (sub === 'neighborhood') {
      const allowed = ['edge-sharing', 'vertex-sharing', 'edge-or-vertex', 'weighted-incidence'];
      if (allowed.includes(val.toLowerCase())) {
        this.app.neighborhoodMode = val.toLowerCase();
        this.app.updateUIFromState();
        this.app.visualizer.draw();
        this.log(`Neighborhood mode changed to: ${val}`, 'success-line');
      } else {
        this.log(`Invalid neighborhood mode. Supported: ${allowed.join(', ')}`, 'error-line');
      }
    } else {
      this.log(`Invalid setting: "${sub}"`, 'error-line');
    }
  }

  cmdGenerate(args) {
    if (args.length < 1) {
      this.log('Usage: generate [square | triangle | hex | voronoi | tetrahedron | cube | octahedron | dodecahedron | icosahedron | octa-chain] [args]', 'error-line');
      return;
    }

    const type = args[0].toLowerCase();
    
    if (type === 'square' || type === 'triangle' || type === 'hex') {
      const w = parseInt(args[1], 10) || 30;
      const h = parseInt(args[2], 10) || 30;
      this.app.gridType = type;
      this.app.gridW = w;
      this.app.gridH = h;
      this.app.rebuildGrid();
      this.log(`Generated ${type} grid of size ${w}x${h}.`, 'success-line');
    } else if (type === 'voronoi') {
      const count = parseInt(args[1], 10) || 150;
      this.app.gridType = 'voronoi';
      this.app.jitterCount = count;
      this.app.rebuildGrid();
      this.log(`Generated Voronoi irregular grid with ${count} seeds.`, 'success-line');
    } else if (['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'].includes(type)) {
      this.app.gridType = type;
      this.app.rebuildGrid();
      this.log(`Generated Platonic Solid: ${type}.`, 'success-line');
    } else if (type === 'octa-chain') {
      const len = parseInt(args[1], 10) || 4;
      this.app.gridType = 'octa-chain';
      this.app.jitterCount = len; // overload parameter
      this.app.rebuildGrid();
      this.log(`Generated Octahedron Chain of length ${len}.`, 'success-line');
    } else {
      this.log(`Unknown grid type: "${type}"`, 'error-line');
    }
  }

  cmdInspect(args) {
    if (args.length < 2 || args[0].toLowerCase() !== 'face') {
      this.log('Usage: inspect face <id>', 'error-line');
      return;
    }

    const id = parseInt(args[1], 10);
    const face = this.app.complex.faceMap.get(id);

    if (face) {
      const nMode = this.app.neighborhoodMode;
      const weightEdge = this.app.weightEdge;
      const weightVertex = this.app.weightVertex;
      const neighbors = this.app.getNeighborsForFace(face.id);

      this.log(`Face ${face.id} Details:`, 'highlight-line');
      this.log(`  State: ${face.state} (Next: ${face.nextState})`);
      this.log(`  Sheet: ${face.sheet}`);
      this.log(`  Vertices (${face.vertices.length}): ${face.vertices.join(', ')}`);
      this.log(`  Edges (${face.edges.length}): ${face.edges.join(', ')}`);
      this.log(`  Neighbors (${neighbors.length}): ${neighbors.map(n => `${n.id}(w=${n.weight},${n.type})`).join(', ')}`);
    } else {
      this.log(`Face ID ${id} not found.`, 'error-line');
    }
  }

  cmdShow(args) {
    if (args.length < 2 || args[0].toLowerCase() !== 'neighbors') {
      this.log('Usage: show neighbors <face_id>', 'error-line');
      return;
    }

    const id = parseInt(args[1], 10);
    const face = this.app.complex.faceMap.get(id);

    if (face) {
      this.app.visualizer.lockedFaceId = id;
      this.app.visualizer.draw();
      this.app.inspectFace(id);
      this.log(`Showing neighbors of face ${id} on canvas.`, 'success-line');
    } else {
      this.log(`Face ID ${id} not found.`, 'error-line');
    }
  }

  cmdMerge(args) {
    if (args.length < 3 || args[0].toLowerCase() !== 'vertex') {
      this.log('Usage: merge vertex <id1> <id2>', 'error-line');
      return;
    }

    const v1 = parseInt(args[1], 10);
    const v2 = parseInt(args[2], 10);

    if (this.app.complex.vertexMap.has(v1) && this.app.complex.vertexMap.has(v2)) {
      this.app.complex.mergeVertices(v1, v2);
      this.app.complex.cleanAndReindex();
      this.app.visualizer.draw();
      this.log(`Merged vertex ${v2} into vertex ${v1} and reindexed.`, 'success-line');
    } else {
      this.log('One or both vertex IDs do not exist.', 'error-line');
    }
  }

  cmdExplain(args) {
    if (args.length < 2 || args[0].toLowerCase() !== 'next') {
      this.log('Usage: explain next <face_id>', 'error-line');
      return;
    }

    const id = parseInt(args[1], 10);
    const face = this.app.complex.faceMap.get(id);

    if (face) {
      const neighbors = this.app.getNeighborsForFace(face.id);
      let aliveSum = 0;
      let totalWeight = 0;

      neighbors.forEach(n => {
        const nf = this.app.complex.faceMap.get(n.id);
        if (nf) {
          totalWeight += n.weight;
          if (nf.state === 1) aliveSum += n.weight;
        }
      });

      this.log(`Transition Explanation for Face ${face.id}:`, 'highlight-line');
      this.log(`  - Current State: ${face.state}`);
      this.log(`  - Neighbors count: ${neighbors.length} (Total weight sum: ${totalWeight.toFixed(1)})`);
      this.log(`  - Living (state 1) neighbors weight sum: ${aliveSum.toFixed(1)}`);
      
      const correction = this.app.ruleEvaluator.correctionMode;
      let evaluated = aliveSum;
      
      if (correction === 'ratio' && totalWeight > 0) {
        const ratio = aliveSum / totalWeight;
        evaluated = Math.round(ratio * 8);
        this.log(`  - Correction Mode [Ratio]: (${aliveSum.toFixed(1)} / ${totalWeight.toFixed(1)}) * 8 = ${evaluated}`);
      } else {
        this.log(`  - Correction Mode [Absolute]: Floor(${aliveSum.toFixed(1)}) = ${evaluated}`);
      }

      const isBirth = this.app.ruleEvaluator.birthSet.has(evaluated);
      const isSurv = this.app.ruleEvaluator.survivalSet.has(evaluated);

      this.log(`  - Active birth counts: ${Array.from(this.app.ruleEvaluator.birthSet).join(',')}`);
      this.log(`  - Active survival counts: ${Array.from(this.app.ruleEvaluator.survivalSet).join(',')}`);

      if (face.state === 0) {
        this.log(`  - Result (Dead->Next): ${isBirth ? '1 (Birth matched)' : '0 (No birth)'}`);
      } else if (face.state === 1) {
        if (this.app.ruleEvaluator.type === 'generations') {
          this.log(`  - Result (Alive->Next): ${isSurv ? '1 (Survival matched)' : '2 (Fading starts)'}`);
        } else {
          this.log(`  - Result (Alive->Next): ${isSurv ? '1 (Survival matched)' : '0 (Death)'}`);
        }
      } else {
        const next = face.state + 1;
        const finalNext = next >= this.app.ruleEvaluator.stateCount ? 0 : next;
        this.log(`  - Result (Fading->Next): ${finalNext} (State ${face.state} increments to ${finalNext} / max states: ${this.app.ruleEvaluator.stateCount})`);
      }
    } else {
      this.log(`Face ID ${id} not found.`, 'error-line');
    }
  }
}
