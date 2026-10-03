export class Ring {
  constructor(options) {
    this.type = options.type;
  }

  getZero() { throw new Error("Not implemented"); }
  getUnit() { throw new Error("Not implemented"); }
  isZero(a) { throw new Error("Not implemented"); }
  isUnit(a) { throw new Error("Not implemented"); }

  normalizeElement(a) { throw new Error("Not implemented"); }
  gcd(a, b) { throw new Error("Not implemented"); }
  lcm(a, b) { throw new Error("Not implemented"); }
  multiply(a, b) { throw new Error("Not implemented"); }
  factor(a) { throw new Error("Not implemented"); }

  formatElement(a) { throw new Error("Not implemented"); }
  formatTex(a) { return this.formatElement(a); } // fallback
}
