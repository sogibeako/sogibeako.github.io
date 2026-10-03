/**
 * catdiag-builder.js
 * JS側から図式を組み立てるAPIを提供します。
 */

class DiagramBuilder {
  constructor() {
    this.diagram = {
      version: "0.1",
      type: "category-diagram",
      layout: { mode: "manual", unit: 120, padding: 32 },
      nodes: [],
      edges: [],
      commutativity: []
    };
  }

  layout(options) {
    this.diagram.layout = { ...this.diagram.layout, ...options };
    return this;
  }

  object(id, label, x, y) {
    this.diagram.nodes.push({ id, label: label || id, x, y });
    return this;
  }

  node(nodeData) {
    this.diagram.nodes.push(nodeData);
    return this;
  }

  arrow(from, to, label, options = {}) {
    const id = options.id || `${from}->${to}`;
    this.diagram.edges.push({ id, from, to, label, ...options });
    return this;
  }

  dashed(from, to, label, options = {}) {
    return this.arrow(from, to, label, { ...options, style: "dashed" });
  }

  iso(from, to, label = "\\cong") {
    return this.arrow(from, to, label, { style: "iso" });
  }

  commutes(path1, path2, label) {
    const id = `commutes-${this.diagram.commutativity.length}`;
    this.diagram.commutativity.push({ id, paths: [path1, path2], label });
    return this;
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this.diagram));
  }
}

export const Diagram = {
  create() {
    return new DiagramBuilder();
  },

  square(opts) {
    const { A, B, C, D, top, left, right, bottom } = opts;
    return this.create()
      .object("A", A, 0, 0)
      .object("B", B, 1, 0)
      .object("C", C, 0, 1)
      .object("D", D, 1, 1)
      .arrow("A", "B", top)
      .arrow("A", "C", left)
      .arrow("B", "D", right)
      .arrow("C", "D", bottom)
      .toJSON();
  },

  pullback(opts) {
    const { P, A, B, C, p1, p2, f, g } = opts;
    return this.create()
      .object("P", P, 0, 0)
      .object("B", B, 1, 0)
      .object("A", A, 0, 1)
      .object("C", C, 1, 1)
      .arrow("P", "A", p1)
      .arrow("P", "B", p2)
      .arrow("A", "C", f)
      .arrow("B", "C", g)
      .toJSON();
  },

  naturalitySquare(opts) {
    const { X, Y, F, G, arrow, transformation } = opts;
    return this.create()
      .object("FX", `${F}(${X})`, 0, 0)
      .object("FY", `${F}(${Y})`, 1, 0)
      .object("GX", `${G}(${X})`, 0, 1)
      .object("GY", `${G}(${Y})`, 1, 1)
      .arrow("FX", "FY", `${F}${arrow}`)
      .arrow("GX", "GY", `${G}${arrow}`)
      .arrow("FX", "GX", `${transformation}_${X}`, { ascii: `${transformation.replace('\\', '')}_X` })
      .arrow("FY", "GY", `${transformation}_${Y}`, { ascii: `${transformation.replace('\\', '')}_Y` })
      .toJSON();
  }
};
