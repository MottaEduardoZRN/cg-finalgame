// js/loader.js

// =====================================================================
// FUNÇÃO: CARREGADOR DE MODELOS OBJ (PARSER MANUAL)
// Lê um arquivo .obj (texto), interpreta as linhas e gera arrays para o WebGL.
// Nota: Esta versão calcula Normais e UVs automaticamente.
// =====================================================================
export async function loadObjFile(url) {
    // Faz o download do arquivo .obj
    const response = await fetch(url);
    const text = await response.text();

    // Array temporário para guardar os vértices crus lidos do arquivo
    const objVertex = [];
    
    // Arrays finais que serão enviados para a GPU
    const finalPositions = [];
    const finalNormals = [];
    const finalTexCoords = []; 

    // Divide o arquivo em linhas para ler uma por uma
    const lines = text.split('\n');
    
    for (const line of lines) {
        // Divide a linha em partes (usa Regex para ignorar espaços extras)
        const parts = line.trim().split(/\s+/);
        const type = parts[0];

        // -------------------------------------------------------------
        // LEITURA DE VÉRTICES (Linhas que começam com 'v')
        // Guarda a posição X, Y, Z na lista temporária
        // -------------------------------------------------------------
        if (type === 'v') {
            objVertex.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
        } 
        // -------------------------------------------------------------
        // LEITURA DE FACES (Linhas que começam com 'f')
        // Conecta 3 vértices para formar um triângulo
        // -------------------------------------------------------------
        else if (type === 'f') {
            // O formato OBJ usa índices começando em 1, mas Arrays usam 0.
            // Por isso subtraímos 1.
            const idx1 = parseInt(parts[1].split('/')[0]) - 1;
            const idx2 = parseInt(parts[2].split('/')[0]) - 1;
            const idx3 = parseInt(parts[3].split('/')[0]) - 1;

            // Recupera as posições reais dos 3 pontos do triângulo
            const v1 = objVertex[idx1];
            const v2 = objVertex[idx2];
            const v3 = objVertex[idx3];

            // ---------------------------------------------------------
            // CÁLCULO AUTOMÁTICO DE NORMAL (FLAT SHADING)
            // Como o arquivo OBJ simples não tem normais, calculamos na mão.
            // A Normal é a seta perpendicular à face (necessária para luz).
            // ---------------------------------------------------------
            
            // Passo 1: Cria dois vetores (arestas) do triângulo
            const ux = v2[0] - v1[0];
            const uy = v2[1] - v1[1];
            const uz = v2[2] - v1[2];

            const vx = v3[0] - v1[0];
            const vy = v3[1] - v1[1];
            const vz = v3[2] - v1[2];

            // Passo 2: Produto Vetorial (Cross Product) para achar a perpendicular
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;

            // Passo 3: Normalização (Garante que o vetor tenha tamanho 1)
            const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
            
            if (len > 0.00001) {
                nx /= len; ny /= len; nz /= len;
            } else {
                // Fallback: Se der erro matemático (triângulo degenerado), aponta para cima
                nx = 0; ny = 1; nz = 0; 
            }

            // Adiciona os 3 vértices processados aos arrays finais
            addVert(v1, nx, ny, nz);
            addVert(v2, nx, ny, nz);
            addVert(v3, nx, ny, nz);
        }
    }

    // =================================================================
    // FUNÇÃO AUXILIAR: FORMATAÇÃO FINAL
    // =================================================================
    function addVert(v, nx, ny, nz) {
        finalPositions.push(v[0], v[1], v[2]);
        finalNormals.push(nx, ny, nz);
        
        // -------------------------------------------------------------
        // GERAÇÃO DE UV (MAPEAMENTO PLANAR)
        // Como o OBJ não tem textura, "projetamos" a textura de cima pra baixo.
        // Usamos X e Z para definir onde a imagem cai na nave.
        // O cálculo (* 0.5 + 0.5) centraliza a textura.
        // -------------------------------------------------------------
        finalTexCoords.push(v[0] * 0.5 + 0.5, v[2] * 0.5 + 0.5);
    }

    // Retorna o objeto pronto
    return {
        positions: finalPositions,
        textureCoords: finalTexCoords, 
        normals: finalNormals,
        vertexCount: finalPositions.length / 3
    };
}