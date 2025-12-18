// js/laser.js

// =====================================================================
// FUNÇÃO: GERAÇÃO DA GEOMETRIA DO LASER (TIRO)
// Cria um paralelepípedo (cubo alongado) simples para representar o plasma
// =====================================================================
export function createLaserData() {
    // Arrays para armazenar dados brutos para o WebGL
    const positions = [];
    const normals = [];
    const textureCoords = []; 

    // Dimensões do Laser (w = largura/espessura, l = comprimento)
    const w = 0.1; 
    const l = 0.8; 
    
    // -----------------------------------------------------------------
    // DEFINIÇÃO DOS 8 VÉRTICES DO CUBO
    // As coordenadas (x, y, z) dos cantos do objeto
    // -----------------------------------------------------------------
    const vertices = [
        [-w, -w,  l], [ w, -w,  l], [ w,  w,  l], [-w,  w,  l], // Frente
        [-w, -w, -l], [-w,  w, -l], [ w,  w, -l], [ w, -w, -l], // Trás
    ];

    // -----------------------------------------------------------------
    // DEFINIÇÃO DAS FACES E NORMAIS
    // Faces: Grupos de 4 índices que formam um lado do cubo
    // Norms: A direção para onde cada face aponta (para iluminação)
    // -----------------------------------------------------------------
    const faces = [
        [0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 5], // Frente, Trás, Topo
        [0, 4, 7, 1], [1, 7, 6, 2], [0, 3, 5, 4]  // Baixo, Direita, Esquerda
    ];
    const norms = [
        [0, 0, 1], [0, 0, -1], [0, 1, 0], // Normais correspondentes
        [0, -1, 0], [1, 0, 0], [-1, 0, 0]
    ];

    // -----------------------------------------------------------------
    // LOOP DE CONSTRUÇÃO (TRIANGULAÇÃO)
    // Converte os quadrados (faces) em triângulos para o WebGL
    // -----------------------------------------------------------------
    for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        const normal = norms[i];
        
        // Triângulo 1 da face
        addVertex(face[0], 0, 0); 
        addVertex(face[1], 1, 0); 
        addVertex(face[2], 1, 1);
        
        // Triângulo 2 da face
        addVertex(face[0], 0, 0); 
        addVertex(face[2], 1, 1); 
        addVertex(face[3], 0, 1);

        // --- Função Auxiliar Interna ---
        // Empurra os dados para os arrays principais
        function addVertex(idx, u, v) {
            positions.push(...vertices[idx]); 
            normals.push(...normal);
            textureCoords.push(u, v); // Mapeia a textura completa (0 a 1) na face
        }
    }

    // Retorno dos dados formatados
    return {
        positions: positions,
        textureCoords: textureCoords,
        normals: normals,
        vertexCount: positions.length / 3
    };
}