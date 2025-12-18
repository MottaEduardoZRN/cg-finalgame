// js/laser.js

export function createLaserData() {
    // Um paralelepípedo fino e comprido
    // Largura (X): 0.1, Altura (Y): 0.1, Comprimento (Z): 1.0
    const positions = [
        // Face Frontal
        -0.1, -0.1, 0.5,
        0.1, -0.1, 0.5,
        0.1, 0.1, 0.5,
        -0.1, 0.1, 0.5,
        // Face Traseira
        -0.1, -0.1, -0.5,
        -0.1, 0.1, -0.5,
        0.1, 0.1, -0.5,
        0.1, -0.1, -0.5,
        // ... (poderíamos definir todas as faces, mas para um tiro rápido
        // apenas frente, trás e laterais bastam. Vamos simplificar criando
        // um cubo achatado manualmente nas 6 faces para garantir a luz correta)
    ];

    // Vamos gerar as posições completas para um cubo esticado (Box)
    const w = 0.1; // largura
    const l = 0.8; // comprimento do laser

    // Vértices brutos
    const v = [
        [-w, -w, l], [w, -w, l], [w, w, l], [-w, w, l], // Frente
        [-w, -w, -l], [-w, w, -l], [w, w, -l], [w, -w, -l], // Trás
    ];

    const finalPositions = [];
    const finalNormals = [];
    const finalColors = [];

    // Definição das faces (Indices dos 2 triângulos de cada face)
    const faces = [
        [0, 1, 2, 3], // Frente
        [4, 5, 6, 7], // Trás
        [3, 2, 6, 5], // Topo
        [0, 4, 7, 1], // Baixo
        [1, 7, 6, 2], // Direita
        [0, 3, 5, 4]  // Esquerda
    ];

    const normals = [
        [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]
    ];

    for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        const normal = normals[i];

        // Triângulo 1
        addVertex(face[0]); addVertex(face[1]); addVertex(face[2]);
        // Triângulo 2
        addVertex(face[0]); addVertex(face[2]); addVertex(face[3]);

        function addVertex(idx) {
            finalPositions.push(...v[idx]);
            finalNormals.push(...normal);
            // Cor do Laser: Vermelho Neon
            // R=1.0 (Vermelho Total), G=0.0 (Sem verde), B=0.2 (Leve azul para parecer "plasma")
            finalColors.push(1.0, 0.0, 0.2, 1.0);
        }
    }

    return {
        positions: finalPositions,
        colors: finalColors,
        normals: finalNormals,
        vertexCount: finalPositions.length / 3
    };
}