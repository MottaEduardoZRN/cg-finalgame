// js/asteroid.js

// =====================================================================
// FUNÇÃO PRINCIPAL: GERAÇÃO PROCEDURAL DO ASTEROIDE (ESFERA)
// =====================================================================
export function createAsteroidData(radius, detail) {
    // Inicialização dos Arrays que irão para o Buffer do WebGL
    const positions = [];
    const textureCoords = []; // Coordenadas UV para a textura
    const normals = [];

    // Definição da resolução da esfera (detalhes horizontais e verticais)
    const latBands = detail; 
    const longBands = detail;
    const grid = [];

    // -----------------------------------------------------------------
    // ETAPA 1: GERAÇÃO DOS VÉRTICES (CÁLCULO MATEMÁTICO)
    // Cria os pontos matemáticos de uma esfera baseada em latitude/longitude
    // -----------------------------------------------------------------
    for (let latNumber = 0; latNumber <= latBands; latNumber++) {
        const theta = latNumber * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const row = [];
        for (let longNumber = 0; longNumber <= longBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Conversão de Coordenadas Esféricas para Cartesianas (X, Y, Z)
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            // Cálculo das Coordenadas de Textura (UV)
            // Mapeia a imagem retangular para envolver a esfera
            const u = 1 - (longNumber / longBands);
            const v = 1 - (latNumber / latBands);

            const currentRadius = radius; // Aqui poderia haver variação para deformar o asteroide
            
            // Guarda os dados temporariamente na grid para costurar depois
            row.push({
                pos: [x * currentRadius, y * currentRadius, z * currentRadius],
                uv: [u, v] 
            });
        }
        grid.push(row);
    }

    // -----------------------------------------------------------------
    // ETAPA 2: COSTURA DA MALHA (TRIANGULAÇÃO)
    // Conecta os pontos gerados acima para formar triângulos sólidos
    // -----------------------------------------------------------------
    for (let latNumber = 0; latNumber < latBands; latNumber++) {
        for (let longNumber = 0; longNumber < longBands; longNumber++) {
            // Pega os 4 cantos de um "quadrado" da grade
            const p1 = grid[latNumber][longNumber];
            const p2 = grid[latNumber + 1][longNumber];
            const p3 = grid[latNumber][longNumber + 1];
            const p4 = grid[latNumber + 1][longNumber + 1];

            // Divide o quadrado em 2 triângulos e adiciona aos buffers
            addTriangle(positions, normals, textureCoords, p1, p2, p3);
            addTriangle(positions, normals, textureCoords, p2, p4, p3);
        }
    }

    // Retorna o objeto pronto para ser consumido pelo main.js
    return {
        positions: positions,
        textureCoords: textureCoords,
        normals: normals,
        vertexCount: positions.length / 3
    };
}

// =====================================================================
// FUNÇÃO AUXILIAR: MONTAGEM DE TRIÂNGULOS E NORMAIS
// =====================================================================
function addTriangle(positions, normals, textureCoords, v1, v2, v3) {
    // Adiciona as posições e texturas aos arrays principais
    positions.push(...v1.pos); textureCoords.push(...v1.uv);
    positions.push(...v2.pos); textureCoords.push(...v2.uv);
    positions.push(...v3.pos); textureCoords.push(...v3.uv);

    // -----------------------------------------------------------------
    // CÁLCULO DE NORMAL FACETADA (FLAT SHADING)
    // Calcula a direção que a face aponta para a luz refletir de forma "dura"
    // (Isso dá o visual Low Poly / Rochoso)
    // -----------------------------------------------------------------
    const ux = v2.pos[0] - v1.pos[0], uy = v2.pos[1] - v1.pos[1], uz = v2.pos[2] - v1.pos[2];
    const vx = v3.pos[0] - v1.pos[0], vy = v3.pos[1] - v1.pos[1], vz = v3.pos[2] - v1.pos[2];
    
    // Produto Vetorial (Cross Product) para achar a perpendicular
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    
    // Normalização do vetor
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if(len > 0) { nx /= len; ny /= len; nz /= len; }

    // Aplica a mesma normal para os 3 vértices (para a face ficar plana)
    for(let i=0; i<3; i++) normals.push(nx, ny, nz);
}