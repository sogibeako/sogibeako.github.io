/**
 * Linear Transform module for SpectroSampler
 * Applies affine transformations (rotate, scale, translate, shear) to magnitude arrays.
 *
 * Rules:
 *   - Y (freq / bin) overflow → clip (ignore out-of-range bins)
 *   - X (time / frame) overflow → extend the output array
 */

/**
 * Build a 3×3 affine matrix (row-major) for the given parameters.
 *
 * Pivots:
 *   - Scale/Shear: from origin (0, 0) — Y scales from 0 Hz, X from 0s
 *   - Rotation: from center (cx, cy)
 *
 * Composition order (right-to-left):
 *   1. Scale + Shear from origin
 *   2. Rotate around center (cx, cy)
 *   3. User translation
 */
export function buildAffineMatrix({
    rotation = 0,       // degrees
    scaleX = 1,
    scaleY = 1,
    translateX = 0,     // in frames
    translateY = 0,     // in bins
    shearX = 0,
    shearY = 0,
}, cx, cy) {
    const rad = (rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const sx = scaleX, sy = scaleY;

    // Step 1: Scale + Shear from origin
    //   M = [[sx, shearX*sy], [shearY*sx, sy]]
    //   (x, y) → (sx*x + shearX*sy*y, shearY*sx*x + sy*y)

    // Step 2: Rotate around (cx, cy)
    //   R·(p - c) + c, where R = [[cos, -sin], [sin, cos]]
    //   Let m = M·p (from step 1), then:
    //   out = R·(m - c) + c
    //
    // Expanding for output x:
    //   ox = cosR*(sx*x + shearX*sy*y - cx) - sinR*(shearY*sx*x + sy*y - cy) + cx + translateX
    //   oy = sinR*(sx*x + shearX*sy*y - cx) + cosR*(shearY*sx*x + sy*y - cy) + cy + translateY

    // Coefficients:
    const a = cosR * sx - sinR * shearY * sx;
    const b = cosR * shearX * sy - sinR * sy;
    const c = sinR * sx + cosR * shearY * sx;
    const d = sinR * shearX * sy + cosR * sy;

    // Translation:
    const tx = -cosR * cx + sinR * cy + cx + translateX;
    const ty = -sinR * cx - cosR * cy + cy + translateY;

    return { a, b, c, d, tx, ty };
}

/**
 * Apply the INVERSE of the affine transform to map output → input coords.
 * Returns (srcX, srcY) for the given (dstX, dstY).
 */
function invertAffine({ a, b, c, d, tx, ty }) {
    const det = a * d - b * c;
    if (Math.abs(det) < 1e-12) return null; // singular

    const ia = d / det;
    const ib = -b / det;
    const ic = -c / det;
    const id = a / det;
    const itx = -(ia * tx + ib * ty);
    const ity = -(ic * tx + id * ty);

    return { a: ia, b: ib, c: ic, d: id, tx: itx, ty: ity };
}

/**
 * Sample the source magnitude at (frame, bin) with bilinear interpolation.
 * Returns 0 for out-of-bounds (transparent / silence).
 */
function sampleBilinear(magnitude, frame, bin, numFrames, numBins) {
    if (frame < 0 || frame >= numFrames - 1 || bin < 0 || bin >= numBins - 1) {
        // Edge: nearest if partially in-bounds
        const fi = Math.round(frame);
        const bi = Math.round(bin);
        if (fi >= 0 && fi < numFrames && bi >= 0 && bi < numBins) {
            return magnitude[fi][bi];
        }
        return 0;
    }

    const fi = Math.floor(frame);
    const bi = Math.floor(bin);
    const fx = frame - fi;
    const fy = bin - bi;

    const v00 = magnitude[fi][bi];
    const v10 = magnitude[fi + 1][bi];
    const v01 = magnitude[fi][bi + 1];
    const v11 = magnitude[fi + 1][bi + 1];

    return v00 * (1 - fx) * (1 - fy)
        + v10 * fx * (1 - fy)
        + v01 * (1 - fx) * fy
        + v11 * fx * fy;
}

/**
 * Apply an affine transform to magnitude (and optionally phase) arrays.
 *
 * @param {Float64Array[]} magnitude - source magnitude[frame][bin]
 * @param {Object} params - { rotation, scaleX, scaleY, translateX, translateY, shearX, shearY }
 * @param {Float64Array[]|null} phase - optional phase array to transform in sync
 * @returns {{ magnitude: Float64Array[], phase: Float64Array[]|null }}
 */
export function applyAffineTransform(magnitude, params, phase) {
    const numFrames = magnitude.length;
    const numBins = magnitude[0] ? magnitude[0].length : 0;
    if (numFrames === 0 || numBins === 0) return { magnitude, phase };

    // Center of transform
    const cx = numFrames / 2;
    const cy = numBins / 2;

    let fwd = buildAffineMatrix(params, cx, cy);

    // Determine output extent by transforming all 4 corners
    const corners = [
        [0, 0], [numFrames - 1, 0],
        [0, numBins - 1], [numFrames - 1, numBins - 1]
    ];

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity;
    for (const [x, y] of corners) {
        const ox = fwd.a * x + fwd.b * y + fwd.tx;
        const oy = fwd.c * x + fwd.d * y + fwd.ty;
        minX = Math.min(minX, ox);
        maxX = Math.max(maxX, ox);
        minY = Math.min(minY, oy);
    }

    // If content goes into negative time (X < 0), shift right
    if (minX < 0) {
        fwd.tx += Math.ceil(-minX);
    }

    // If content goes into negative frequency (Y < 0), shift up
    if (minY < 0) {
        fwd.ty += Math.ceil(-minY);
    }

    // Recompute X extent after shifts
    maxX = -Infinity;
    for (const [x, y] of corners) {
        const ox = fwd.a * x + fwd.b * y + fwd.tx;
        maxX = Math.max(maxX, ox);
    }

    // Output X range: extend to cover all transformed corners
    const outMaxX = Math.ceil(maxX);
    const outFrames = Math.max(outMaxX + 1, 1);
    const outBins = numBins; // Y fixed (must match FFT); overflow above is clipped

    // Build inverse transform for sampling
    const inv = invertAffine(fwd);
    if (!inv) return { magnitude, phase }; // degenerate transform

    const resultMag = [];
    const resultPhase = phase ? [] : null;

    for (let f = 0; f < outFrames; f++) {
        const magRow = new Float64Array(outBins);
        const phRow = phase ? new Float64Array(outBins) : null;
        for (let b = 0; b < outBins; b++) {
            // Map output (f, b) back to source
            const srcF = inv.a * f + inv.b * b + inv.tx;
            const srcB = inv.c * f + inv.d * b + inv.ty;
            magRow[b] = sampleBilinear(magnitude, srcF, srcB, numFrames, numBins);
            // Phase: use nearest-neighbor (interpolating phase angles is incorrect)
            if (phase) {
                const fi = Math.round(srcF);
                const bi = Math.round(srcB);
                if (fi >= 0 && fi < numFrames && bi >= 0 && bi < numBins) {
                    phRow[b] = phase[fi][bi];
                }
                // else 0 (already initialized)
            }
        }
        resultMag.push(magRow);
        if (resultPhase) resultPhase.push(phRow);
    }

    return { magnitude: resultMag, phase: resultPhase };
}

/**
 * Check if transform params are non-identity
 */
export function isIdentityTransform(params) {
    return (params.rotation || 0) === 0
        && (params.scaleX || 1) === 1
        && (params.scaleY || 1) === 1
        && (params.translateX || 0) === 0
        && (params.translateY || 0) === 0
        && (params.shearX || 0) === 0
        && (params.shearY || 0) === 0;
}
