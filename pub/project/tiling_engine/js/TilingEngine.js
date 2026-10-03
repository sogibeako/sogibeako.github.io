/**
 * Tiling Engine
 * Handles the generation of tiling subdivisions.
 */
class TilingEngine {
    constructor(definition) {
        this.def = definition;
        this.prototiles = this.def.geometry.prototiles;
        this.rules = this.def.geometry.subdivisionRules;
        this.inflation = this.def.geometry.inflation.numeric || 1.0;

        // Parse the mathematical value if necessary
        this.phi = (1 + Math.sqrt(5)) / 2; // Hardcode PHI for Penrose tests, or we could parse from definition
    }

    /**
     * Generate tiling up to the specified number of generations.
     * Returns a flat array of all tiles in the final generation.
     */
    generate(generations) {
        let currentTiles = this.def.geometry.seed.map((s, index) => ({
            id: `seed-${index}`,
            type: s.tileType,
            points: s.points,
            generation: 0
        }));

        for (let g = 0; g < generations; g++) {
            currentTiles = this.subdivide(currentTiles, g);
        }

        return currentTiles;
    }

    /**
     * Helper to linear interpolate between two points
     */
    lerp(p1, p2, t) {
        return [
            p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t
        ];
    }

    /**
     * Subdivides an array of tiles according to the rules.
     */
    subdivide(tiles, currentGen) {
        const nextTiles = [];

        for (let i = 0; i < tiles.length; i++) {
            const parentTile = tiles[i];
            const ruleSet = this.rules[parentTile.type];

            if (!ruleSet || ruleSet.length === 0) {
                // If there are no subdivision rules, keep the tile as is
                nextTiles.push(parentTile);
                continue;
            }

            // A tiling rule can now define points as arrays of indices or fractions of the parent's A, B, C (0, 1, 2)
            // But to handle the specific Penrose example gracefully without breaking the general engine format:
            // We use the parent's actual points directly if rule indicates it.

            // Wait, the Penrose reference calculates points dynamically based on the CURRENT tile's vertices (A, B, C):
            // P = A + (B-A)/PHI
            // Q = B + (A-B)/PHI
            // R = B + (C-B)/PHI

            // To make this generic for our JSON engine, we could provide a way for points to be expressed as a combination 
            // of parent vertices or via affine transform.
            // Actually, affine transform *already does this completely mathematically*.
            // If the rule points are defined accurately within the reference [0,1] space,
            // the affine transform Maps them exactly like the Penrose `A + (B-A)/PHI` does.
            // Let's stick with the affine mapping in `TilingEngine.js` but ensure `Geometry.getAffineTransform` is used properly,
            // and maybe introduce a "Geometry.interpolatePoints" if needed.
            // For now, the previous Transform logic is completely correct for inward subdivision *if* the rule points are exactly right.

            // BUT, if the user's definition uses Penrose-style subdivision directly, maybe we should offer a "Function-based" rule option
            // or just use exactly what we had before (transform mapping) but adapt the sample data to use Penrose exactly.

            const proto = this.prototiles[parentTile.type];
            if (!proto || proto.kind !== "triangle") {
                console.warn(`Prototile for ${parentTile.type} is not defined or not a triangle.`);
                continue;
            }

            // Calculate the transform from the prototile directly to the parent tile instance on screen
            const transform = Geometry.getAffineTransform(proto.points, parentTile.points);

            // Subdivide based on rules
            for (let j = 0; j < ruleSet.length; j++) {
                const rule = ruleSet[j];

                // If the rule provides a function instead of points, use it (custom logic extension)
                if (typeof rule.calcPoints === "function") {
                    const childPoints = rule.calcPoints(parentTile.points, this.inflation);
                    nextTiles.push({
                        id: `${parentTile.id}/${j}`,
                        type: rule.childType,
                        points: childPoints,
                        generation: currentGen + 1
                    });
                } else {
                    // Standard affine mapping
                    const childPointsScreen = Geometry.transformPoints(rule.points, transform);
                    nextTiles.push({
                        id: `${parentTile.id}/${j}`,
                        type: rule.childType,
                        points: childPointsScreen,
                        generation: currentGen + 1
                    });
                }
            }
        }

        return nextTiles;
    }
}
