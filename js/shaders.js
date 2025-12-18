// js/shaders.js

export const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uNormalMatrix; 

    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;

        // --- CÁLCULO DE LUZ ---
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

        // Normais são vetores de direção, não posições. O 0.0 ignora a translação.
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 0.0);

        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
    }
`;

export const fsSource = `
    precision mediump float; // Necessário definir precisão
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    uniform float uFlash; // 0.0 = Normal, 1.0 = Flash Branco

    void main(void) {
        vec3 finalColor = vColor.rgb * vLighting;
        
        // Se uFlash for maior que 0, misturamos com branco
        if(uFlash > 0.5) {
            // R=1.0 (Vermelho), G=0.3, B=0.3 
            finalColor = vec3(1.0, 0.3, 0.3); 
        }

        gl_FragColor = vec4(finalColor, vColor.a);
    }
`;