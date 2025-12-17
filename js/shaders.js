// js/shaders.js

// VERTEX SHADER: Cuida da posição dos pontos no espaço 3D
export const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
        // Multiplica a posição do vértice pelas matrizes de câmera e perspectiva
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        
        // Passa a cor para o Fragment Shader
        vColor = aVertexColor;
    }
`;

// FRAGMENT SHADER: Cuida da cor de cada pixel desenhado
export const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
        // Pinta o pixel com a cor recebida do vértice (interpolada)
        gl_FragColor = vColor;
    }
`;