// Sample Definition: Sierpinski Triangle
// A simple inward fractal subdivision to prove the UI works with diverse content.

const tilingDefSierpinski = {
    metadata: {
        id: "sierpinski",
        name: "Sierpinski Triangle",
        version: "1.0"
    },

    geometry: {
        prototiles: {
            0: {
                kind: "triangle",
                points: [[0, 0], [1, 0], [0.5, 0.866]]
            }
        },

        inflation: {
            value: "2",
            numeric: 2.0
        },

        subdivisionRules: {
            0: [
                {
                    childType: 0,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const midAB = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
                        const midAC = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
                        return [A, midAB, midAC];
                    }
                },
                {
                    childType: 0,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const midAB = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
                        const midBC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
                        return [midAB, B, midBC];
                    }
                },
                {
                    childType: 0,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const midAC = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
                        const midBC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
                        return [midAC, midBC, C];
                    }
                }
            ]
        },

        seed: (() => {
            const h = 400 * 0.866;
            return [{
                tileType: 0,
                points: [[200, 600], [600, 600], [400, 600 - h]]
            }];
        })()
    },

    styles: {
        presets: {
            neonFill: {
                mode: "sharedTexture",
                imageId: "orangeTile",
                uvMap: "tri0",
                zoom: 1.0,
                rotationPolicy: "followTile",
                strokeColor: "#f72585",
                strokeWidth: 2
            }
        },
        tileStyleMap: {
            0: "neonFill"
        }
    },

    uvMaps: {
        tri0: {
            kind: "triangle",
            points: [[0, 0], [1, 0], [0.5, 0.866]]
        }
    },

    images: {
        orangeTile: {
            src: "images/orange.png",
            smoothing: true
        }
    },

    render: {
        generations: 4,
        backgroundColor: "#111822",
        showStroke: true,
        textureGlobal: { enabled: false },
        viewport: { fitMode: "contain", padding: 40 }
    }
};

window.tilingDefSierpinski = tilingDefSierpinski;
