// js/shaders.js

export const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix; 
    
    uniform float uUseLighting; 

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;

        if (uUseLighting > 0.5) {
            // 1. LUZ AMBIENTE
            highp vec3 ambientLight = vec3(0.2, 0.2, 0.2);

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
            highp vec3 normal = normalize(transformedNormal.xyz);

            // 2. LUZ PRINCIPAL (Sol - Vem de Cima/Direita)
            // Ilumina o topo e o lado da nave
            highp vec3 lightADir = normalize(vec3(0.5, 1.0, 0.5));
            highp vec3 lightAColor = vec3(1.0, 0.9, 0.8); // Luz Quente
            highp float directionalA = max(dot(normal, lightADir), 0.0);

            // 3. LUZ DE PREENCHIMENTO (Flash da Câmera - Vem de Trás/Z+)
            // ESSENCIAL: Ilumina a traseira da nave que a gente vê!
            highp vec3 lightBDir = normalize(vec3(-0.5, 0.2, 1.0));
            highp vec3 lightBColor = vec3(0.4, 0.4, 0.5); // Luz Fria/Metálica
            highp float directionalB = max(dot(normal, lightBDir), 0.0);

            // Soma tudo
            vLighting = ambientLight + (lightAColor * directionalA) + (lightBColor * directionalB);
        } 
        else {
            // Sem luz (Túnel/Laser) = Brilho máximo
            vLighting = vec3(1.0, 1.0, 1.0);
        }
    }
`;

export const fsSource = `
    precision mediump float;
    
    varying highp vec2 vTextureCoord; // Recebe do Vertex
    varying highp vec3 vLighting;

    uniform sampler2D uSampler; // A Imagem (Textura)
    uniform float uFlash; 

    void main(void) {
        // Pega a cor do pixel da imagem na coordenada UV
        vec4 texelColor = texture2D(uSampler, vTextureCoord);

        // Aplica a luz na textura
        vec3 finalColor = texelColor.rgb * vLighting;
        
        // Efeito Flash de Dano (Vermelho)
        if(uFlash > 0.5) {
            finalColor = vec3(1.0, 0.3, 0.3); 
        }

        gl_FragColor = vec4(finalColor, texelColor.a);
    }
`;