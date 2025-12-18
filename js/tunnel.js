// js/tunnel.js

// =====================================================================
// FUNÇÃO: GERAÇÃO PROCEDURAL DO TÚNEL
// Cria um cilindro longo e oco, dividido em anéis e segmentos.
// =====================================================================
export function createTunnelData(radius, length, segments, rings) {
    // Arrays de dados para o WebGL
    const positions = [];
    const textureCoords = []; // Substitui as cores antigas por coordenadas UV
    const normals = [];

    // -----------------------------------------------------------------
    // LOOP EXTERNO: ANÉIS (PROFUNDIDADE Z)
    // Percorre o comprimento do túnel, criando "fatias" (rings)
    // -----------------------------------------------------------------
    for (let i = 0; i < rings; i++) {
        // Calcula a posição Z (profundidade) do início (z1) e fim (z2) deste anel
        const z1 = - (i * length / rings);
        const z2 = - ((i + 1) * length / rings);
        
        // Coordenada V (Vertical da textura):
        // Usamos o índice 'i' inteiro. Isso faz a textura repetir a cada anel,
        // evitando que ela fique esticada demais.
        const v1 = i; 
        const v2 = i + 1;

        // -----------------------------------------------------------------
        // LOOP INTERNO: SEGMENTOS (CIRCUNFERÊNCIA)
        // Percorre a volta do círculo, criando as paredes do anel
        // -----------------------------------------------------------------
        for (let j = 0; j < segments; j++) {
            // Calcula o ângulo (Theta) para o início e fim do segmento
            const theta1 = (j / segments) * 2 * Math.PI;
            const theta2 = ((j + 1) / segments) * 2 * Math.PI;

            // Matemática Básica de Círculo (Polar -> Cartesiano)
            // Requisito 2: Jogo em 3D
            const x1 = Math.cos(theta1) * radius;
            const y1 = Math.sin(theta1) * radius;
            const x2 = Math.cos(theta2) * radius;
            const y2 = Math.sin(theta2) * radius;

            // Coordenada U (Horizontal da textura):
            // Vai de 0 a 1 ao longo da volta completa.
            const u1 = (j / segments);
            const u2 = ((j + 1) / segments);

            // -------------------------------------------------------------
            // CÁLCULO DAS NORMAIS (PARA ILUMINAÇÃO)
            // Importante: Como estamos DENTRO do túnel, as normais devem
            // apontar para o centro (0,0), e não para fora.
            // -------------------------------------------------------------
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            // Invertemos o sinal (-midX, -midY) para apontar para dentro
            let nx = -midX, ny = -midY, nz = 0;
            
            // Normalização (tamanho 1)
            const len = Math.sqrt(nx*nx + ny*ny);
            nx /= len; ny /= len;

            // -------------------------------------------------------------
            // CONSTRUÇÃO DOS TRIÂNGULOS (QUAD)
            // Cada parede retangular é feita de 2 triângulos
            // -------------------------------------------------------------
            
            // Triângulo 1
            positions.push(x1, y1, z1); textureCoords.push(u1, v1);
            positions.push(x2, y2, z1); textureCoords.push(u2, v1);
            positions.push(x1, y1, z2); textureCoords.push(u1, v2);

            // Triângulo 2
            positions.push(x2, y2, z1); textureCoords.push(u2, v1);
            positions.push(x2, y2, z2); textureCoords.push(u2, v2);
            positions.push(x1, y1, z2); textureCoords.push(u1, v2);

            // Adiciona a mesma normal para os 6 vértices (Flat Shading no anel)
            for(let k=0; k<6; k++) normals.push(nx, ny, nz);
        }
    }

    return {
        positions: positions,
        textureCoords: textureCoords,
        normals: normals,
        vertexCount: positions.length / 3
    };
}