// js/shaders.js

export const vsSource = `
    attribute vec4 aVertexPosition;
    // NÃO TEM MAIS aVertexColor
    attribute vec2 aTextureCoord; // NOVO: Coordenada da textura (UV)
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix; 

    varying highp vec2 vTextureCoord; // Passa pro Fragment
    varying highp vec3 vLighting;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord; // Passa adiante

        // Luz
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
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