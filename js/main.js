// js/main.js
import { vsSource, fsSource } from './shaders.js';
import { loadObjFile } from './loader.js'; // Importamos nosso carregador

let gl;
let shipRotation = 0.0; 

// A função main agora é ASYNC porque precisa esperar o download do arquivo
async function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");

    if (!gl) { alert("Sem WebGL"); return; }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

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

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Carregamos a nave do arquivo
    console.log("Carregando nave...");
    const shipData = await loadObjFile('assets/nave.obj');
    
    // Criamos os buffers com os dados da nave, não mais do quadrado
    const buffers = initBuffers(gl, shipData);
    console.log("Nave carregada!");

    // Loop de renderização
    let then = 0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        // Passamos o vertexCount da nave para saber quantos triângulos desenhar
        drawScene(gl, programInfo, buffers, deltaTime, shipData.vertexCount);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initBuffers(gl, objectData) {
    // Buffer de Posição
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.positions), gl.STATIC_DRAW);

    // Buffer de Cor
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.colors), gl.STATIC_DRAW);

    return { position: positionBuffer, color: colorBuffer };
}

function drawScene(gl, programInfo, buffers, deltaTime, vertexCount) {
    resizeCanvas(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Projeção
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 100.0);

    // Movimento da Câmera/Objeto
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]); // Afasta a câmera
    
    // Gira a nave para vermos ela em 3D
    mat4.rotate(modelViewMatrix, modelViewMatrix, shipRotation, [0, 1, 0]); // Gira no eixo Y
    mat4.rotate(modelViewMatrix, modelViewMatrix, shipRotation * 0.7, [1, 0, 0]); // Gira um pouco no X

    // Configura atributos
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0); // Note: 3 floats (xyz), não 2
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    // Desenha a quantidade de vértices que o parser contou (TRIANGLES, não STRIP)
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

    shipRotation += deltaTime;
}

// --- Funções boilerplate (initShaderProgram, loadShader, resizeCanvas) continuam as mesmas ---
// Copie elas do código anterior ou mantenha no arquivo se não apagou
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
        console.error(gl.getShaderInfoLog(shader));
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
    }
}

// Inicia
window.onload = main;