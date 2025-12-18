// js/loader.js

export async function loadObjFile(url) {
    const response = await fetch(url);
    const text = await response.text();

    const positions = [];
    const normals = [];
    const textureCoords = []; // NOVO

    const objVertex = [];
    
    // Arrays finais para o WebGL
    const finalPositions = [];
    const finalNormals = [];
    const finalTexCoords = [];

    const lines = text.split('\n');
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            objVertex.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
        } else if (type === 'f') {
            // Face: f v1 v2 v3
            // Vamos converter para triângulos
            // Simplesmente pegamos os vértices e calculamos normais/uvs na hora
            
            // Triângulo básico (assumindo que o obj já é triangulado ou pegando os 3 primeiros)
            const vIndices = [
                parseInt(parts[1].split('/')[0]) - 1,
                parseInt(parts[2].split('/')[0]) - 1,
                parseInt(parts[3].split('/')[0]) - 1
            ];

            // Pega as posições reais
            const v1 = objVertex[vIndices[0]];
            const v2 = objVertex[vIndices[1]];
            const v3 = objVertex[vIndices[2]];

            // Calcula Normal da Face (Facetado)
            const ux = v2[0] - v1[0], uy = v2[1] - v1[1], uz = v2[2] - v1[2];
            const vx = v3[0] - v1[0], vy = v3[1] - v1[1], vz = v3[2] - v1[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            if(len > 0) { nx /= len; ny /= len; nz /= len; }

            // Adiciona aos arrays finais
            addVert(v1, nx);
            addVert(v2, nx);
            addVert(v3, nx);
        }
    }

    function addVert(v, n) {
        finalPositions.push(v[0], v[1], v[2]);
        finalNormals.push(n[0], n[1], n[2]);
        
        // TRUQUE DE TEXTURA:
        // Usa a posição X e Z para mapear a textura (Planar Mapping de cima)
        // Normalizamos um pouco para caber na textura
        finalTexCoords.push((v[0] + 1.0) * 0.5, (v[2] + 1.0) * 0.5);
    }

    return {
        positions: finalPositions,
        textureCoords: finalTexCoords, // Retorna UVs
        normals: finalNormals,
        vertexCount: finalPositions.length / 3
    };
}