// js/tunnel.js

export function createTunnelData(radius, length, segments, rings) {
    const positions = [];
    const textureCoords = []; // NOVO: Substitui colors
    const normals = [];

    for (let i = 0; i < rings; i++) {
        const z1 = - (i * length / rings);
        const z2 = - ((i + 1) * length / rings);
        
        // V calcula quanto andamos no fundo (repete a textura a cada anel para ficar denso)
        const v1 = i; 
        const v2 = i + 1;

        for (let j = 0; j < segments; j++) {
            const theta1 = (j / segments) * 2 * Math.PI;
            const theta2 = ((j + 1) / segments) * 2 * Math.PI;

            const x1 = Math.cos(theta1) * radius;
            const y1 = Math.sin(theta1) * radius;
            const x2 = Math.cos(theta2) * radius;
            const y2 = Math.sin(theta2) * radius;

            // U calcula a volta completa (0 a 1)
            const u1 = (j / segments);
            const u2 = ((j + 1) / segments);

            // Normais (Apontando para dentro)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            let nx = -midX, ny = -midY, nz = 0;
            const len = Math.sqrt(nx*nx + ny*ny);
            nx /= len; ny /= len;

            // Triângulo 1
            positions.push(x1, y1, z1); textureCoords.push(u1, v1);
            positions.push(x2, y2, z1); textureCoords.push(u2, v1);
            positions.push(x1, y1, z2); textureCoords.push(u1, v2);

            // Triângulo 2
            positions.push(x2, y2, z1); textureCoords.push(u2, v1);
            positions.push(x2, y2, z2); textureCoords.push(u2, v2);
            positions.push(x1, y1, z2); textureCoords.push(u1, v2);

            // Normais (6x)
            for(let k=0; k<6; k++) normals.push(nx, ny, nz);
        }
    }

    return {
        positions: positions,
        textureCoords: textureCoords, // Retorna UVs
        normals: normals,
        vertexCount: positions.length / 3
    };
}