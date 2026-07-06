/**
 * Cellular Automata Transition Rules Engine
 */

export class RuleEvaluator {
  constructor() {
    this.type = 'conway'; // 'conway' | 'generations' | 'custom-js'
    this.ruleString = 'B3/S23';
    this.stateCount = 2;
    this.birthSet = new Set([3]);
    this.survivalSet = new Set([2, 3]);
    
    this.correctionMode = 'absolute'; // 'absolute' | 'ratio'
    this.customJsFunction = null;
  }

  /**
   * Parses a rule string in B/S or B/S/C format.
   * e.g., "B3/S23", "B36/S23", "B2/S/C3"
   */
  parseRuleString(str) {
    this.ruleString = str.trim();
    this.birthSet.clear();
    this.survivalSet.clear();
    this.stateCount = 2; // Default to 2 states (alive, dead)

    const parts = this.ruleString.split('/');
    let bPart = '', sPart = '', cPart = '';

    parts.forEach(part => {
      const p = part.toUpperCase().trim();
      if (p.startsWith('B')) {
        bPart = p.substring(1);
      } else if (p.startsWith('S')) {
        sPart = p.substring(1);
      } else if (p.startsWith('C')) {
        cPart = p.substring(1);
      } else {
        // Guess based on index if B/S/C prefixes are missing
        // e.g. "3/23" -> B3/S23
        // or "2/empty/3" -> B2/S/C3
      }
    });

    // Fallback parsing if prefixes were omitted (e.g. "3/23")
    if (!bPart && !sPart && parts.length >= 2) {
      bPart = parts[0].replace(/[^0-9]/g, '');
      sPart = parts[1].replace(/[^0-9]/g, '');
      if (parts.length >= 3) {
        cPart = parts[2].replace(/[^0-9]/g, '');
      }
    }

    // Parse Birth digits
    for (const char of bPart) {
      const num = parseInt(char, 10);
      if (!isNaN(num)) this.birthSet.add(num);
    }

    // Parse Survival digits
    for (const char of sPart) {
      const num = parseInt(char, 10);
      if (!isNaN(num)) this.survivalSet.add(num);
    }

    // Parse State Count (Generations)
    if (cPart) {
      const num = parseInt(cPart, 10);
      if (!isNaN(num) && num >= 2) {
        this.stateCount = num;
        this.type = 'generations';
      }
    } else {
      this.type = 'conway';
    }
  }

  /**
   * Sets up and compiles a custom JavaScript transition rule.
   * @param {string} body - The body of the transition function: (face, neighbors, context) => state
   */
  compileCustomJsRule(body) {
    try {
      // Compiled dynamically
      this.customJsFunction = new Function('face', 'neighbors', 'context', body);
      this.type = 'custom-js';
      this.stateCount = 2; // Default, but can be higher depending on user code
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Computes the next state of a face based on its neighbors.
   * 
   * @param {Face} face - The current face
   * @param {Array} neighbors - The list of neighbors: { id, weight, type }
   * @param {Map} faceMap - Map of all faces in the complex to access their states
   */
  evaluateNextState(face, neighbors, faceMap) {
    if (this.type === 'custom-js' && this.customJsFunction) {
      try {
        const neighborFaces = neighbors.map(n => {
          const nf = faceMap.get(n.id);
          return nf ? { id: nf.id, state: nf.state, weight: n.weight, type: n.type } : null;
        }).filter(Boolean);

        const context = {
          stateCount: this.stateCount,
          correctionMode: this.correctionMode
        };

        const next = this.customJsFunction(
          { id: face.id, state: face.state, sheet: face.sheet },
          neighborFaces,
          context
        );
        
        return Math.max(0, Math.floor(Number(next))) || 0;
      } catch (err) {
        // Fallback to current state on error
        return face.state;
      }
    }

    // Standard B/S or Generations evaluation
    // 1. Calculate active neighbor count
    let aliveSum = 0;
    let maxPossibleNeighbors = 0;

    neighbors.forEach(n => {
      const nf = faceMap.get(n.id);
      if (nf) {
        maxPossibleNeighbors += n.weight;
        // Count only state 1 (alive) cells as active neighbors
        if (nf.state === 1) {
          aliveSum += n.weight;
        }
      }
    });

    // 2. Apply Neighborhood Count Correction
    let evaluatedCount = aliveSum;
    if (this.correctionMode === 'ratio' && maxPossibleNeighbors > 0) {
      // Normalize to standard 8-neighbor equivalents
      const ratio = aliveSum / maxPossibleNeighbors;
      evaluatedCount = Math.round(ratio * 8);
    } else {
      // Absolute count: round down for fractional weights
      evaluatedCount = Math.floor(aliveSum);
    }

    // 3. Apply state transition rules
    const currentState = face.state;

    if (this.type === 'generations') {
      // Generations rules:
      // State 0 (Dead) -> State 1 (Alive) if Birth rule matched
      if (currentState === 0) {
        return this.birthSet.has(evaluatedCount) ? 1 : 0;
      }
      // State 1 (Alive) -> State 1 (Survive) if Survival matched, else State 2 (Dying)
      else if (currentState === 1) {
        return this.survivalSet.has(evaluatedCount) ? 1 : 2;
      }
      // State s >= 2 (Dying / Fading) -> increments state, or wraps to 0
      else {
        const next = currentState + 1;
        return next >= this.stateCount ? 0 : next;
      }
    } else {
      // Standard 2-state Conway-like rule
      if (currentState === 0) {
        return this.birthSet.has(evaluatedCount) ? 1 : 0;
      } else {
        return this.survivalSet.has(evaluatedCount) ? 1 : 0;
      }
    }
  }
}

// Rule Preset Definitions
export const RULE_PRESETS = {
  conway: { name: "Conway's Life", rule: "B3/S23", type: "conway", states: 2 },
  highlife: { name: "HighLife", rule: "B36/S23", type: "conway", states: 2 },
  seeds: { name: "Seeds", rule: "B2/S", type: "conway", states: 2 },
  daynight: { name: "Day & Night", rule: "B3678/S34678", type: "conway", states: 2 },
  morley: { name: "Morley", rule: "B368/S245", type: "conway", states: 2 },
  'brians-brain': { name: "Brian's Brain", rule: "B2/S/C3", type: "generations", states: 3 },
  starwars: { name: "Star Wars", rule: "B2/S345/C4", type: "generations", states: 4 },
  rainboy: { name: "RainBoy", rule: "B2/S3/C8", type: "generations", states: 8 }
};
