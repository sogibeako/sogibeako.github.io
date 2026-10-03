// Sample Definition: Penrose Tiling (From User Reference)
const PHI = (1 + Math.sqrt(5)) / 2;

const tilingDefPenrose = {
    metadata: {
        id: "penrose",
        name: "Penrose Tiling",
        version: "0.1"
    },

    geometry: {
        prototiles: {
            // Type 0 = Red (36 degree), Type 1 = Blue (108 degree)
            // Points are placeholders for geometric structure;
            // The actual subdivision relies on calcPoints directly.
            0: {
                kind: "triangle",
                points: [[0, 0], [1, 0], [0.5, 0.8]]
            },
            1: {
                kind: "triangle",
                points: [[0, 0], [1, 0], [0.5, 0.3]]
            }
        },

        inflation: {
            value: "PHI",
            numeric: PHI
        },

        subdivisionRules: {
            0: [
                {
                    childType: 0,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const P = [A[0] + (B[0] - A[0]) / PHI, A[1] + (B[1] - A[1]) / PHI];
                        // next.push(new Tri(0, C, P, B)) => Points are C, P, B
                        return [C, P, B];
                    }
                },
                {
                    childType: 1,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const P = [A[0] + (B[0] - A[0]) / PHI, A[1] + (B[1] - A[1]) / PHI];
                        // next.push(new Tri(1, P, C, A)) => Points are P, C, A
                        return [P, C, A];
                    }
                }
            ],
            1: [
                {
                    childType: 1,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const R = [B[0] + (C[0] - B[0]) / PHI, B[1] + (C[1] - B[1]) / PHI];
                        // next.push(new Tri(1, R, C, A)) => Points are R, C, A
                        return [R, C, A];
                    }
                },
                {
                    childType: 1,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const Q = [B[0] + (A[0] - B[0]) / PHI, B[1] + (A[1] - B[1]) / PHI];
                        const R = [B[0] + (C[0] - B[0]) / PHI, B[1] + (C[1] - B[1]) / PHI];
                        // next.push(new Tri(1, Q, R, B)) => Points are Q, R, B
                        return [Q, R, B];
                    }
                },
                {
                    childType: 0,
                    calcPoints: (pts) => {
                        const [A, B, C] = pts;
                        const Q = [B[0] + (A[0] - B[0]) / PHI, B[1] + (A[1] - B[1]) / PHI];
                        const R = [B[0] + (C[0] - B[0]) / PHI, B[1] + (C[1] - B[1]) / PHI];
                        // next.push(new Tri(0, R, Q, A)) => Points are R, Q, A
                        return [R, Q, A];
                    }
                }
            ]
        },

        seed: (() => {
            // 中心に 10 個の赤三角(0)を放射状に並べた“車輪”を初期形とする (from user reference)
            let tris = [];
            const scale = 250; // Visual scale for seed starting points
            const cx = 400, cy = 400; // Center
            for (let i = 0; i < 10; i++) {
                const a1 = (2 * i - 1) * Math.PI / 10;
                const a2 = (2 * i + 1) * Math.PI / 10;
                let B = [cx + Math.cos(a1) * scale, cy + Math.sin(a1) * scale];
                let C = [cx + Math.cos(a2) * scale, cy + Math.sin(a2) * scale];
                if (i % 2 === 0) {
                    const temp = B;
                    B = C;
                    C = temp;
                }
                tris.push({
                    tileType: 0,
                    points: [[cx, cy], B, C]
                });
            }
            return tris;
        })()
    },

    styles: {
        presets: {
            redFill: {
                mode: "sharedTexture",
                imageId: "flower", // We can use the flower image for the shared texture
                uvMap: "tri0",
                zoom: 1.0,
                offsetX: 0,
                offsetY: 0,
                rotationPolicy: "followTile", // The user draws the shared texture using rotation from center of canvas. We'll use followTile to keep it simple but working.
                strokeColor: "#ffffff",
                strokeWidth: 1
            },
            blueFill: {
                mode: "sharedTexture",
                imageId: "flower",
                uvMap: "tri1",
                zoom: 1.2,
                offsetX: 0,
                offsetY: 0,
                rotationPolicy: "followTile",
                strokeColor: "#ffffff",
                strokeWidth: 1
            }
        },

        tileStyleMap: {
            0: "redFill",
            1: "blueFill",
        }
    },

    uvMaps: {
        tri0: {
            kind: "triangle",
            points: [[0.5, 0], [1, 1], [0, 1]]
        },
        tri1: {
            kind: "triangle",
            points: [[0, 0], [1, 0], [0.5, 0.5]]
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
            padding: 24
        }
    }
};

window.tilingDefPenrose = tilingDefPenrose;
