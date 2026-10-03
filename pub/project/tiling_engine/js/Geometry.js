/**
 * Geometry Module
 * Includes math for calculating points and affine transformations for triangles.
 */
class Geometry {
    /**
     * Solves the affine transformation matrix from one triangle to another.
     * Maps `src` triangle points to `dst` triangle points.
     * Points are arrays like: [[x1, y1], [x2, y2], [x3, y3]]
     * Returns an array [a, b, c, d, e, f] representing the transformation:
     * x' = ax + cy + e
     * y' = bx + dy + f
     */
    static getAffineTransform(src, dst) {
        // Source points
        const x0 = src[0][0], y0 = src[0][1];
        const x1 = src[1][0], y1 = src[1][1];
        const x2 = src[2][0], y2 = src[2][1];

        // Destination points
        const u0 = dst[0][0], v0 = dst[0][1];
        const u1 = dst[1][0], v1 = dst[1][1];
        const u2 = dst[2][0], v2 = dst[2][1];

        // Denominator
        const den = x0 * (y1 - y2) - y0 * (x1 - x2) + (x1 * y2 - x2 * y1);

        if (den === 0) {
            console.warn("Collinear points in affine transform calculation.");
            return [1, 0, 0, 1, 0, 0]; // Identity as fallback
        }

        const a = (u0 * (y1 - y2) - u1 * (y0 - y2) + u2 * (y0 - y1)) / den;
        const b = (v0 * (y1 - y2) - v1 * (y0 - y2) + v2 * (y0 - y1)) / den;
        const c = -(u0 * (x1 - x2) - u1 * (x0 - x2) + u2 * (x0 - x1)) / den;
        const d = -(v0 * (x1 - x2) - v1 * (x0 - x2) + v2 * (x0 - x1)) / den;
        const e = (u0 * (x1 * y2 - x2 * y1) - u1 * (x0 * y2 - x2 * y0) + u2 * (x0 * y1 - x1 * y0)) / den;
        const f = (v0 * (x1 * y2 - x2 * y1) - v1 * (x0 * y2 - x2 * y0) + v2 * (x0 * y1 - x1 * y0)) / den;

        return [a, b, c, d, e, f];
    }

    /**
     * Applies an affine transformation matrix to a point.
     * matrix is [a, b, c, d, e, f]
     */
    static transformPoint(pt, matrix) {
        const [x, y] = pt;
        const [a, b, c, d, e, f] = matrix;
        return [
            a * x + c * y + e,
            b * x + d * y + f
        ];
    }

    /**
     * Applies an affine transformation matrix to an array of points (a triangle/polygon).
     */
    static transformPoints(points, matrix) {
        return points.map(p => this.transformPoint(p, matrix));
    }
}
