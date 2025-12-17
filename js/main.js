// js/main.js
import { vsSource, fsSource } from './shaders.js';

let gl;
// Variáveis para guardar a rotação (para animar depois)
let squareRotation = 0.0; 

function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Navegador sem suporte a WebGL.");
        return;
    }

    // 1. Compilar os Shaders
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // 2. Guardar as localizações das variáveis do Shader (para usar depois)
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    // 3. Criar os Buffers (os dados do quadrado)
    const buffers = initBuffers(gl);

    // 4. Loop de renderização (desenha repetidamente)
    let then = 0;
    function render(now) {
        now *= 0.001;  // converte para segundos
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, deltaTime);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// --- FUNÇÕES AUXILIARES ---

function initBuffers(gl) {
    // A. Buffer de Posição (Onde estão os vértices do quadrado?)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        1.0,  1.0,
       -1.0,  1.0,
        1.0, -1.0,
       -1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // B. Buffer de Cor (Qual a cor de cada vértice?)
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    const colors = [
        1.0, 1.0, 1.0, 1.0,    // Branco
        1.0, 0.0, 0.0, 1.0,    // Vermelho
        0.0, 1.0, 0.0, 1.0,    // Verde
        0.0, 0.0, 1.0, 1.0,    // Azul
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return { position: positionBuffer, color: colorBuffer };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    resizeCanvas(gl.canvas); // Garante tamanho correto
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0); 
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // --- CÁLCULO DAS MATRIZES (A MÁGICA 3D) ---
    
    // 1. Matriz de Projeção (Lente da câmera: 45 graus, 0.1 perto, 100 longe)
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // 2. Matriz ModelView (Onde o objeto está no mundo)
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]); // Move 6 unidades para o fundo
    
    // Rotação opcional (descomente para girar)
    // mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 0, 1]); 

    // --- CONFIGURAR O SHADER PARA DESENHAR ---
    
    // Diz ao WebGL como tirar os dados do buffer de POSIÇÃO
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Diz ao WebGL como tirar os dados do buffer de COR
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    // Usa nosso programa
    gl.useProgram(programInfo.program);

    // Envia as matrizes
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    // Desenha (4 vértices = 2 triângulos = 1 quadrado)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Atualiza rotação para o próximo frame
    squareRotation += deltaTime;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Erro no shader: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function resizeCanvas(canvas) {
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}

// Inicia
window.onload = main;