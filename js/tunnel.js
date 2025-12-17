// js/tunnel.js

export function createTunnelData(radius, length, segments, rings) {
    const positions = [];
    const colors = [];
    const normals = [];

    // Para cada anel ao longo do túnel...
    for (let i = 0; i < rings; i++) {
        const z1 = - (i * length / rings);       // Z do anel atual
        const z2 = - ((i + 1) * length / rings); // Z do próximo anel

        // Cor baseada na profundidade (efeito fade in/out)
        // Azul neon: R=0.2, G=0.0, B=1.0
        const colorR = 0.1;
        const colorG = 0.8; // Esverdeado tipo Matrix/Wormhole
        const colorB = 0.9; 

        // Para cada segmento do círculo (ex: 8 para octógono)...
        for (let j = 0; j < segments; j++) {
            // Ângulo atual e próximo
            const theta1 = (j / segments) * 2 * Math.PI;
            const theta2 = ((j + 1) / segments) * 2 * Math.PI;

            // Coordenadas X, Y do círculo (Anel Atual)
            const x1 = Math.cos(theta1) * radius;
            const y1 = Math.sin(theta1) * radius;
            const x2 = Math.cos(theta2) * radius;
            const y2 = Math.sin(theta2) * radius;

            // Como é um tubo, o X e Y são iguais no anel seguinte (z2)
            // Vamos criar 2 triângulos para fechar a parede entre os anéis (Quad)
            
            // Vértices do QUAD (Parede do túnel)
            // v1 (top-left), v2 (top-right), v3 (bottom-left), v4 (bottom-right)
            
            // Triângulo 1
            positions.push(x1, y1, z1); // v1
            positions.push(x2, y2, z1); // v2
            positions.push(x1, y1, z2); // v3

            // Triângulo 2
            positions.push(x2, y2, z1); // v2
            positions.push(x2, y2, z2); // v4
            positions.push(x1, y1, z2); // v3

            // Normais (Apontando para DENTRO do tubo)
            // Simplificação: Normal aponta para o centro (inverso da posição)
            for(let k=0; k<6; k++) {
                normals.push(-x1, -y1, 0); // Aponta pro centro em XY
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