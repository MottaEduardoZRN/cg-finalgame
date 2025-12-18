// js/loader.js

export async function loadObjFile(url) {
    const response = await fetch(url);
    const text = await response.text();

    const objVertex = [];
    
    const finalPositions = [];
    const finalNormals = [];
    const finalTexCoords = []; 

    const lines = text.split('\n');
    for (const line of lines) {
        // Usa Regex para evitar erros com espaços duplos no arquivo .obj
        const parts = line.trim().split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            objVertex.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
        } 
        else if (type === 'f') {
            // Garante que pegamos índices válidos
            const idx1 = parseInt(parts[1].split('/')[0]) - 1;
            const idx2 = parseInt(parts[2].split('/')[0]) - 1;
            const idx3 = parseInt(parts[3].split('/')[0]) - 1;

            const v1 = objVertex[idx1];
            const v2 = objVertex[idx2];
            const v3 = objVertex[idx3];

            // --- CÁLCULO DA NORMAL (FÍSICA) ---
            // Vetor U = v2 - v1
            const ux = v2[0] - v1[0];
            const uy = v2[1] - v1[1];
            const uz = v2[2] - v1[2];

            // Vetor V = v3 - v1
            const vx = v3[0] - v1[0];
            const vy = v3[1] - v1[1];
            const vz = v3[2] - v1[2];

            // Produto Vetorial (Cross Product) = Normal
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;

            // Normalização (Transformar tamanho em 1.0)
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            
            if (len > 0.00001) {
                nx /= len; ny /= len; nz /= len;
            } else {
                // Se der erro matemático, aponta para cima para não ficar preto
                nx = 0; ny = 1; nz = 0; 
            }

            // Adiciona os 3 vértices do triângulo
            addVert(v1, nx, ny, nz);
            addVert(v2, nx, ny, nz);
            addVert(v3, nx, ny, nz);
        }
    }

    function addVert(v, nx, ny, nz) {
        finalPositions.push(v[0], v[1], v[2]);
        finalNormals.push(nx, ny, nz);
        
        // Mapeamento Planar (Usa X e Z para "embrulhar" a textura)
        // O * 0.5 + 0.5 centraliza a textura na nave
        finalTexCoords.push(v[0] * 0.5 + 0.5, v[2] * 0.5 + 0.5);
    }

    return {
        positions: finalPositions,
        textureCoords: finalTexCoords, 
        normals: finalNormals,
        vertexCount: finalPositions.length / 3
    };
}