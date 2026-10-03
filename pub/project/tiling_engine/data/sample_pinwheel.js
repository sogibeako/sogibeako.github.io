// Sample Definition: Pinwheel Tiling
// A Pinwheel tile is a right triangle with side lengths 1, 2, and sqrt(5).
// It subdivides into 5 smaller similar right triangles.

const tilingDefPinwheel = {
    metadata: {
        id: "pinwheel",
        name: "Pinwheel Tiling",
        version: "1.0"
    },

    geometry: {
        prototiles: {
            // Type 0 = Pinwheel Right Triangle
            // Vertices are ordered: [Right Angle, Long Leg End, Short Leg End]
            0: {
                kind: "triangle",
                points: [[0, 0], [2, 0], [0, 1]]
            }
        },

        inflation: {
            value: "sqrt(5)",
            numeric: Math.sqrt(5)
        },

        subdivisionRules: {
            0: [
                // We define 5 children based on the linear combination of the parent's Right(R), Long(L), Short(S)
                // A point (x,y) in local space maps to: R + (x/2)*(L - R) + y*(S - R)
                ...(() => {
                    const localToWorld = (R, L, S, x, y) => [
                        R[0] + (x / 2) * (L[0] - R[0]) + y * (S[0] - R[0]),
                        R[1] + (x / 2) * (L[1] - R[1]) + y * (S[1] - R[1])
                    ];

                    const childrenLocalCoords = [
                        // [Right, Long, Short] in local coordinates of the 2x1 triangle
                        [[0.4, 0.8], [0, 0], [0, 1]],
                        [[0.4, 0.8], [1.2, 0.4], [0.2, 0.4]],
                        [[0.2, 0.4], [1, 0], [0, 0]],
                        [[1.2, 0.4], [2, 0], [1, 0]],
                        [[1, 0], [0.2, 0.4], [1.2, 0.4]]
                    ];

                    return childrenLocalCoords.map(coords => ({
                        childType: 0,
                        calcPoints: (pts) => {
                            const [R, L, S] = pts;
                            return [
                                localToWorld(R, L, S, coords[0][0], coords[0][1]), // Right
                                localToWorld(R, L, S, coords[1][0], coords[1][1]), // Long
                                localToWorld(R, L, S, coords[2][0], coords[2][1])  // Short
                            ];
                        }
                    }));
                })()
            ]
        },

        seed: (() => {
            // A wheel of pinwheel triangles to start
            let tris = [];
            const scale = 200;
            const cx = 400, cy = 400;

            // Just a square made of 4 pinwheel triangles
            tris.push({
                tileType: 0,
                // Right, Long, Short
                points: [[cx, cy], [cx + scale * 2, cy], [cx, cy + scale]]
            });
            tris.push({
                tileType: 0,
                points: [[cx + scale * 2, cy + scale], [cx, cy + scale], [cx + scale * 2, cy]]
            });
            tris.push({
                tileType: 0,
                points: [[cx, cy], [cx - scale * 2, cy], [cx, cy - scale]]
            });
            tris.push({
                tileType: 0,
                points: [[cx - scale * 2, cy - scale], [cx, cy - scale], [cx - scale * 2, cy]]
            });

            return tris;
        })()
    },

    styles: {
        presets: {
            pinwheelFill: {
                mode: "sharedTexture",
                imageId: "flower",
                uvMap: "tri0",
                zoom: 2.0,
                offsetX: 0,
                offsetY: 0,
                rotationPolicy: "followTile",
                strokeColor: "#4cc9f0",
                strokeWidth: 1.5
            }
        },
        tileStyleMap: {
            0: "pinwheelFill"
        }
    },

    uvMaps: {
        tri0: {
            kind: "triangle",
            points: [[0, 0], [1, 0], [0, 0.5]]
        }
    },

    images: {
        flower: {
            src: "images/flower.png",
            smoothing: true
        }
    },

    render: {
        generations: 4,
        backgroundColor: "#111822",
        showStroke: true,

        textureGlobal: {
            enabled: true,
            size: 1.0,
            zoom: 1.0,
            offsetX: 0,
            offsetY: 0
        },

        viewport: {
            fitMode: "contain",
            padding: 40
        }
    }
};

window.tilingDefPinwheel = tilingDefPinwheel;
