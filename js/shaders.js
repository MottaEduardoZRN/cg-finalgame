// js/shaders.js

// VERTEX SHADER: Calcula a luz em cada vértice
export const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal; // NOVO: Recebemos a normal

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    // Matriz especial para rotacionar as normais corretamente
    uniform mat4 uNormalMatrix; 

    varying lowp vec4 vColor;
    varying highp vec3 vLighting; // NOVO: Passamos a luz calculada

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;

        // --- CÁLCULO DE LUZ (Requisito: Múltiplas fontes) ---
        
        // 1. Luz Ambiente (Base constante)
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);

        // 2. Luz Direcional (Vindo da direita/cima)
        highp vec3 directionalLightColor = vec3(1, 1, 1); // Luz Branca
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

        // Transforma a normal para acompanhar a rotação da nave
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

        // Produto Escalar: Quanto mais de frente pra luz, mais brilhante
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

        // Soma tudo
        vLighting = ambientLight + (directionalLightColor * directional);
    }
`;

// FRAGMENT SHADER: Multiplica a cor pela luz
export const fsSource = `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
        // Cor Final = Cor do Objeto * Quantidade de Luz
        gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
    }
`;