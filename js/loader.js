// js/loader.js

// 1. FUNÇÃO DE DOWNLOAD (Estava faltando esta!)
export async function loadObjFile(url) {
    const response = await fetch(url);
    const text = await response.text();
    return parseObj(text);
}

// 2. FUNÇÃO MATEMÁTICA (Calcula posições e luzes)
export function parseObj(text) {
    const positions = [];
    const colors = [];
    const normals = []; 

    const objPositions = [];
    const lines = text.split('\n');

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            objPositions.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        } else if (type === 'f') {
            const v1Index = parseInt(parts[1]) - 1;
            const v2Index = parseInt(parts[2]) - 1;
            const v3Index = parseInt(parts[3]) - 1;

            const p1 = objPositions[v1Index];
            const p2 = objPositions[v2Index];
            const p3 = objPositions[v3Index];

            // Posições
            positions.push(...p1, ...p2, ...p3);

            // Cores (Cinza Metálico)
            for (let i = 0; i < 3; i++) {
                colors.push(0.7, 0.7, 0.7, 1.0); 
            }

            // Normais (Cálculo da Luz)
            // Vetor U = p2 - p1
            const ux = p2[0] - p1[0], uy = p2[1] - p1[1], uz = p2[2] - p1[2];
            // Vetor V = p3 - p1
            const vx = p3[0] - p1[0], vy = p3[1] - p1[1], vz = p3[2] - p1[2];

            // Produto Vetorial (Cross Product)
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;

            // Normalizar
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            if (len > 0) {
                nx /= len; ny /= len; nz /= len;
            }

            normals.push(nx, ny, nz); 
            normals.push(nx, ny, nz); 
            normals.push(nx, ny, nz); 
        }
    }

    return {
        positions: positions,
        colors: colors,
        normals: normals,
        vertexCount: positions.length / 3
    };
}