// js/asteroid.js

export function createAsteroidData(radius, detail) {
    const positions = [];
    const colors = [];
    const normals = [];

    // 'detail' define quantas divisões a bola tem (Latitude/Longitude)
    // 5 ou 6 é um bom número para parecer "Low Poly" (facetado)
    const latBands = detail; 
    const longBands = detail;

    // Grid temporário para guardar os pontos
    const grid = [];

    // 1. GERAR VÉRTICES (PONTOS)
    for (let latNumber = 0; latNumber <= latBands; latNumber++) {
        const theta = latNumber * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const row = []; // Linha atual
        
        for (let longNumber = 0; longNumber <= longBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Matemática da Esfera:
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            // O TRUQUE DO ASTEROIDE:
            // Adicionamos um valor aleatório ao raio para deformar a bola
            // Mas precisamos garantir que o ponto inicial e final do loop (costura)
            // tenham a mesma deformação, senão abre um buraco na malha.
            let deformation = (Math.random() - 0.5) * 0.4; // +/- 20% de deformação
            
            // Se for o último ponto do círculo, copia a deformação do primeiro para fechar a costura
            if (longNumber === longBands && row.length > 0) {
               // Pega a deformação usada no primeiro ponto dessa latitude (mesma posição XYZ)
               // Como não salvamos a deformação, vamos apenas forçar a posição exata do primeiro ponto
               // Mas vamos simplificar: vamos usar a posição geométrica pura + raio.
            }
            
            // Para simplificar e evitar buracos na costura, vamos usar um raio fixo com leve variação geral
            // Ou melhor: Vamos fazer um Icosaedro "fake" usando baixa resolução.
            // Se usarmos radius fixo com 'detail' baixo (ex: 4 ou 5), já parece uma rocha.
            
            const currentRadius = radius; 
            
            row.push([x * currentRadius, y * currentRadius, z * currentRadius]);
        }
        grid.push(row);
    }

    // 2. COSTURAR OS TRIÂNGULOS
    for (let latNumber = 0; latNumber < latBands; latNumber++) {
        for (let longNumber = 0; longNumber < longBands; longNumber++) {
            
            // Pegamos os 4 cantos de um quadrado na grade
            const first = grid[latNumber][longNumber];
            const second = grid[latNumber + 1][longNumber];
            const third = grid[latNumber][longNumber + 1];
            const fourth = grid[latNumber + 1][longNumber + 1];

            // Triângulo 1 (First -> Second -> Third)
            addTriangle(positions, normals, colors, first, second, third);

            // Triângulo 2 (Second -> Fourth -> Third)
            addTriangle(positions, normals, colors, second, fourth, third);
        }
    }

    return {
        positions: positions,
        colors: colors,
        normals: normals,
        vertexCount: positions.length / 3
    };
}

function addTriangle(positions, normals, colors, v1, v2, v3) {
    // Adiciona posições
    positions.push(...v1);
    positions.push(...v2);
    positions.push(...v3);

    // Calcula Normal da Face (Para a luz bater reto na face e ficar "Low Poly")
    // Vetor U = v2 - v1
    const ux = v2[0] - v1[0], uy = v2[1] - v1[1], uz = v2[2] - v1[2];
    // Vetor V = v3 - v1
    const vx = v3[0] - v1[0], vy = v3[1] - v1[1], vz = v3[2] - v1[2];

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    // Normaliza
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if(len > 0) { nx /= len; ny /= len; nz /= len; }

    // Cores de Rocha (Cinza Escuro / Marrom)
    // Varia um pouco o tom de cinza para cada face
    const shade = 0.3 + Math.random() * 0.2; // Entre 0.3 e 0.5 (Cinza)
    const colorR = shade;
    const colorG = shade * 0.9; // Levemente menos verde (tom terroso)
    const colorB = shade * 0.8; // Menos azul

    for(let i=0; i<3; i++) {
        normals.push(nx, ny, nz);
        colors.push(colorR, colorG, colorB, 1.0);
    }
}