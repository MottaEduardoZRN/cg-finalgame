// js/textures.js

export function initTextures(gl) {
    return {
        tunnel: createTexture(gl, 'tunnel'),
        asteroid: createTexture(gl, 'asteroid'),
        ship: createTexture(gl, 'ship'),
        laser: createTexture(gl, 'laser')
    };
}

function createTexture(gl, type) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (type === 'tunnel') {
        // Fundo Preto
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 256, 256);
        
        // Grades Neon Azul/Roxo
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for(let i=0; i<=256; i+=32) {
            ctx.moveTo(i, 0); ctx.lineTo(i, 256);
            ctx.moveTo(0, i); ctx.lineTo(256, i);
        }
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, 256, 256);

    } else if (type === 'asteroid') {
        // --- MUDANÇA AQUI: CORES MAIS CLARAS ---
        
        // Base: Cinza Rochoso Médio (Antes era marrom escuro)
        ctx.fillStyle = '#887766'; 
        ctx.fillRect(0, 0, 256, 256);
        
        // Ruído (Manchas): Tons mais claros para dar relevo
        for(let i=0; i<500; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 20 + 5;
            
            // Mistura manchas claras (destaques) e médias
            ctx.fillStyle = Math.random() > 0.5 ? '#aa9988' : '#665544';
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI*2);
            ctx.fill();
        }

    } else if (type === 'ship') {
        // Metal Tecnológico
        ctx.fillStyle = '#8899aa'; // Cinza azulado
        ctx.fillRect(0, 0, 256, 256);
        
        // Detalhes
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 100, 100);
        ctx.strokeRect(120, 10, 100, 100);
        ctx.strokeRect(10, 120, 230, 100);
        
        // Rebites
        ctx.fillStyle = '#334455';
        for(let i=20; i<240; i+=40) {
            ctx.fillRect(i, 20, 4, 4);
            ctx.fillRect(i, 230, 4, 4);
        }

    } else if (type === 'laser') {
        // Vermelho Puro
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(100, 0, 56, 256);
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture;
}