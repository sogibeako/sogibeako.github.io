export class Ideal {
  constructor(ring, generators) {
    this.ring = ring;
    this.generators = generators;
    this.generator = this.normalizeGenerators(generators);
  }

  normalizeGenerators(generators) {
    if (generators.length === 0) return this.ring.getZero();
    return generators.reduce((acc, g) => {
      if (acc === null) return this.ring.normalizeElement(g);
      return this.ring.gcd(acc, g);
    }, null);
  }

  add(other) {
    return new Ideal(this.ring, [
      this.ring.gcd(this.generator, other.generator)
    ]);
  }

  multiply(other) {
    return new Ideal(this.ring, [
      this.ring.multiply(this.generator, other.generator)
    ]);
  }

  intersect(other) {
    return new Ideal(this.ring, [
      this.ring.lcm(this.generator, other.generator)
    ]);
  }

  factor() {
    return this.ring.factor(this.generator);
  }

  isZero() {
    return this.ring.isZero(this.generator);
  }

  isUnit() {
    return this.ring.isUnit(this.generator);
  }

  toString() {
    return `(${this.ring.formatElement(this.generator)})`;
  }
  
  toTex() {
    return `(${this.ring.formatTex(this.generator)})`;
  }
}
