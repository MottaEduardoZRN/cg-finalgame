// js/tunnel.js

export function createTunnelData(radius, length, segments, rings) {
    const positions = [];
    const colors = [];
    const normals = [];

    for (let i = 0; i < rings; i++) {
        const z1 = - (i * length / rings);
        const z2 = - ((i + 1) * length / rings);

        for (let j = 0; j < segments; j++) {
            const theta1 = (j / segments) * 2 * Math.PI;
            const theta2 = ((j + 1) / segments) * 2 * Math.PI;

            const x1 = Math.cos(theta1) * radius;
            const y1 = Math.sin(theta1) * radius;
            const x2 = Math.cos(theta2) * radius;
            const y2 = Math.sin(theta2) * radius;

            // --- Lógica de Cor Alternada (Efeito Zebra) ---
            // Se o segmento for par, usa cor A. Se ímpar, cor B.
            let colorR, colorG, colorB;
            
            if (j % 2 === 0) {
                // Cor 1: Azul Petróleo Escuro
                colorR = 0.1; colorG = 0.4; colorB = 0.6;
            } else {
                // Cor 2: Azul Neon Mais Claro
                colorR = 0.1; colorG = 0.6; colorB = 0.9;
            }
            // ----------------------------------------------

            // Cálculo da Normal (Manteve-se igual ao anterior corrigido)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            let nx = -midX;
            let ny = -midY;
            let nz = 0;
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            nx /= len; ny /= len; nz /= len;

            // Triângulos
            positions.push(x1, y1, z1); positions.push(x2, y2, z1); positions.push(x1, y1, z2);
            positions.push(x2, y2, z1); positions.push(x2, y2, z2); positions.push(x1, y1, z2);

            for(let k=0; k<6; k++) {
                normals.push(nx, ny, nz);
                colors.push(colorR, colorG, colorB, 1.0);
            }
        }
    }

    return {
        positions: positions,
        colors: colors,
        normals: normals,
        vertexCount: positions.length / 3
    };
}