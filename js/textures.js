// js/textures.js

// =====================================================================
// GERADOR DE TEXTURAS PROCEDURAIS
// Em vez de carregar imagens externas (que podem dar erro de CORS),
// nós "pintamos" as texturas na memória usando a Canvas API 2D.
// =====================================================================

// Requisito 7: Texturas Procedurais para todos os objetos

export function initTextures(gl) {
    // Retorna um objeto contendo todas as texturas necessárias para o jogo
    return {
        tunnel: createTexture(gl, 'tunnel'),
        asteroid: createTexture(gl, 'asteroid'),
        ship: createTexture(gl, 'ship'),
        laser: createTexture(gl, 'laser')
    };
}

function createTexture(gl, type) {
    // 1. Cria o objeto de textura no WebGL
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 2. Cria um Canvas HTML temporário (invisível) para desenhar
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // -----------------------------------------------------------------
    // LÓGICA DE DESENHO (PINTURA) BASEADA NO TIPO
    // -----------------------------------------------------------------
    
    if (type === 'tunnel') {
        // --- ESTILO TRON / RETROWAVE ---
        // Fundo Preto
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 256, 256);
        
        // Grades Neon Azul/Roxo
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        // Desenha linhas verticais e horizontais (Grid)
        for(let i=0; i<=256; i+=32) {
            ctx.moveTo(i, 0); ctx.lineTo(i, 256);
            ctx.moveTo(0, i); ctx.lineTo(256, i);
        }
        ctx.stroke();
        
        // Brilho leve
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, 256, 256);

    } else if (type === 'asteroid') {
        // --- ESTILO ROCHOSO / ORGÂNICO ---
        
        // Base: Cinza Rochoso Médio (Claro para refletir luz)
        ctx.fillStyle = '#887766'; 
        ctx.fillRect(0, 0, 256, 256);
        
        // Ruído (Manchas): Gera crateras aleatórias
        for(let i=0; i<500; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 20 + 5;
            
            // Alterna entre tons claros e escuros para dar relevo 3D
            ctx.fillStyle = Math.random() > 0.5 ? '#aa9988' : '#665544';
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
        }

    } else if (type === 'ship') {
        // --- ESTILO METAL / TECH ---
        
        // Base: Cinza azulado (Metal)
        ctx.fillStyle = '#8899aa'; 
        ctx.fillRect(0, 0, 256, 256);
        
        // Detalhes: Placas de metal (Retângulos)
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 100, 100);
        ctx.strokeRect(120, 10, 100, 100);
        ctx.strokeRect(10, 120, 230, 100);
        
        // Detalhes: Rebites (Parafusos)
        ctx.fillStyle = '#334455';
        for(let i=20; i<240; i+=40) {
            ctx.fillRect(i, 20, 4, 4);
            ctx.fillRect(i, 230, 4, 4);
        }

    } else if (type === 'laser') {
        // --- ESTILO PLASMA / ENERGIA ---
        // Vermelho Puro nas bordas
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 256, 256);
        // Faixa branca no meio (núcleo de energia)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(100, 0, 56, 256);
    }

    // 3. Envia os pixels do Canvas para a GPU (Placa de Vídeo)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    // 4. Configuração de Mipmaps e Filtros
    // (Mipmaps são cópias menores da textura para quando o objeto está longe)
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // Suavização distante
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // Suavização próxima
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Repetir textura horizontalmente
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); // Repetir textura verticalmente

    return texture;
}