// js/loader.js

// Função que baixa o arquivo de texto
export async function loadObjFile(url) {
    const response = await fetch(url);
    const text = await response.text();
    return parseObj(text);
}

// Função que "traduz" o texto OBJ para Arrays do WebGL
export function parseObj(text) {
    const positions = [];
    const colors = []; // Vamos gerar cores aleatórias para ver as faces
    
    // Arrays temporários para guardar os dados brutos do arquivo
    const objPositions = [];

    const lines = text.split('\n');

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            // Guarda a posição (v x y z)
            objPositions.push([
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
            ]);
        } else if (type === 'f') {
            // Processa a Face (f v1 v2 v3)
            // Para cada vértice da face, buscamos a posição correspondente
            // IMPORTANTE: OBJ começa contagem em 1, arrays em 0.
            const v1Index = parseInt(parts[1]) - 1;
            const v2Index = parseInt(parts[2]) - 1;
            const v3Index = parseInt(parts[3]) - 1;

            // Adiciona as posições no array final
            positions.push(...objPositions[v1Index]);
            positions.push(...objPositions[v2Index]);
            positions.push(...objPositions[v3Index]);

            // Gera uma cor aleatória para cada triângulo para dar efeito 3D
            const r = Math.random();
            const g = Math.random();
            const b = Math.random();
            // Repete a mesma cor para os 3 vértices do triângulo
            for (let i = 0; i < 3; i++) {
                colors.push(r, g, b, 1.0);
            }
        }
    }

    return {
        positions: positions,
        colors: colors,
        vertexCount: positions.length / 3 // 3 floats por vértice
    };
}