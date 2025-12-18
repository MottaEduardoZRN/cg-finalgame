// js/shaders.js

// =====================================================================
// VERTEX SHADER (PROCESSADOR DE VÉRTICES)
// Responsável por calcular a posição 3D dos pontos na tela e a iluminação.
// =====================================================================
export const vsSource = `
    // Atributos: Dados recebidos dos buffers (por vértice)
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec3 aVertexNormal;

    // Uniforms: Variáveis globais enviadas pelo Javascript
    uniform mat4 uModelViewMatrix;  // Posição da Câmera/Objeto
    uniform mat4 uProjectionMatrix; // Lente da Câmera (Perspectiva)
    uniform mat4 uNormalMatrix;     // Para rotacionar as normais corretamente
    
    uniform float uUseLighting;     // Interruptor: 1.0 = Com Luz, 0.0 = Sem Luz

    // Varyings: Dados que enviamos para o Fragment Shader
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
        // Calcula a posição final do vértice na tela
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;

        // --- SISTEMA DE ILUMINAÇÃO ---
        if (uUseLighting > 0.5) {
            // Requisito 6: 1. LUZ AMBIENTE (Base cinza para nada ficar preto total)
            highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);

            // Transforma a normal do objeto para o espaço do mundo
            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
            highp vec3 normal = normalize(transformedNormal.xyz);

            // Requisito 6: 2. LUZ PRINCIPAL ("Sol" - Luz quente vindo da Direita/Cima)
            // Dá volume e define o lado claro do objeto
            highp vec3 lightADir = normalize(vec3(0.5, 1.0, 0.5));
            highp vec3 lightAColor = vec3(1.0, 0.9, 0.8); 
            highp float directionalA = max(dot(normal, lightADir), 0.0);

            // Requisito 6: 3. LUZ DE PREENCHIMENTO ("Backlight" - Luz fria vindo de Trás)
            // Ilumina a traseira da nave e cria contraste nas sombras
            highp vec3 lightBDir = normalize(vec3(-0.5, 0.2, 1.0));
            highp vec3 lightBColor = vec3(0.4, 0.4, 0.5); 
            highp float directionalB = max(dot(normal, lightBDir), 0.0);

            // Soma todas as luzes
            vLighting = ambientLight + (lightAColor * directionalA) + (lightBColor * directionalB);
        } 
        else {
            // Se a iluminação estiver desligada (Túnel/Laser), usa brilho máximo
            vLighting = vec3(1.0, 1.0, 1.0);
        }
    }
`;

// =====================================================================
// FRAGMENT SHADER (PROCESSADOR DE PIXELS)
// Responsável por "pintar" cada pixel do objeto na tela.
// =====================================================================
export const fsSource = `
    precision mediump float;
    
    // Dados recebidos do Vertex Shader (interpolados)
    varying highp vec2 vTextureCoord; 
    varying highp vec3 vLighting;

    uniform sampler2D uSampler; // A Imagem (Textura) carregada
    uniform float uFlash;       // Variável para efeito de dano

    void main(void) {
        // 1. Busca a cor do pixel na imagem da textura
        vec4 texelColor = texture2D(uSampler, vTextureCoord);

        // 2. Multiplica a cor da textura pela luz calculada
        vec3 finalColor = texelColor.rgb * vLighting;
        
        // 3. Efeito Flash de Dano (Sobrescreve a cor se atingido)
        if(uFlash > 0.5) {
            finalColor = vec3(1.0, 0.3, 0.3); // Vermelho
        }

        // Define a cor final do pixel na tela
        gl_FragColor = vec4(finalColor, texelColor.a);
    }
`;