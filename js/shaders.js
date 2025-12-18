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
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) {
        gl_FragColor = vec4(vColor.rgb * vLighting, vColor.a);
    }
`;