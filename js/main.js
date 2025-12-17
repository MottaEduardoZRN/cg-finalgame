// js/main.js
import { vsSource, fsSource } from './shaders.js';
import { loadObjFile } from './loader.js'; // Importamos nosso carregador
import { createTunnelData } from './tunnel.js'; // Importamos o túnel

let gl;
let shipRotation = 0.0; 

// Variáveis de Estado do Jogo
let shipPosition = [0.0, 0.0, -6.0]; // X, Y, Z inicial
let keys = {}; // Guarda quais teclas estão pressionadas

// A função main agora é ASYNC porque precisa esperar o download do arquivo
async function main() {

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");

    if (!gl) { alert("Sem WebGL"); return; }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'), // NOVO
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'), // NOVO
        },
    };

    // --- MUDANÇA PRINCIPAL AQUI ---
    // Carregamos a nave do arquivo
    console.log("Carregando nave...");
    const shipData = await loadObjFile('assets/nave.obj');
    
    // Carregamento do Túnel
    const shipBuffers = initBuffers(gl, shipData); // Renomeie para shipBuffers

    // CRIA O TÚNEL: Raio 10, Comprimento 200, 8 lados (octógono), 20 anéis
    const tunnelData = createTunnelData(8.0, 100.0, 8, 20);
    const tunnelBuffers = initBuffers(gl, tunnelData);

    // Criamos os buffers com os dados da nave, não mais do quadrado
    const buffers = initBuffers(gl, shipData);
    console.log("Nave carregada!");

    // Loop de renderização
    let then = 0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        // --- LÓGICA DO JOGO (UPDATE) ---
        const speed = 5.0 * deltaTime; // Velocidade de movimento

        if (keys['ArrowLeft'] || keys['a']) {
            shipPosition[0] -= speed; // Move para esquerda
            shipRotation = 0.5; // Inclina a nave visualmente
        } else if (keys['ArrowRight'] || keys['d']) {
            shipPosition[0] += speed; // Move para direita
            shipRotation = -0.5; // Inclina para o outro lado
        } else {
            shipRotation = 0.0; // Volta ao normal
        }
        
        if (keys['ArrowUp'] || keys['w']) shipPosition[1] += speed;
        if (keys['ArrowDown'] || keys['s']) shipPosition[1] -= speed;

        // --- DESENHO (DRAW) ---
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

    // Buffer de Normais
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.normals), gl.STATIC_DRAW);

    return { 
        position: positionBuffer, 
        color: colorBuffer, 
        normal: normalBuffer // Retorne o novo buffer
    };
}

function drawScene(gl, programInfo, buffers, deltaTime, vertexCount) {
    resizeCanvas(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 1. Projeção
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 100.0);

    // 2. Movimento (ModelView)
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, shipPosition);
    mat4.rotate(modelViewMatrix, modelViewMatrix, shipRotation, [0, 0, 1]); // Inclinação Z
    mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI, [0, 1, 0]);      // Vira para frente

    // 3. Matriz Normal (Inversa Transposta da ModelView)
    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // 4. Configurar WebGL para usar nosso shader
    gl.useProgram(programInfo.program);

    // 5. Ligar os Buffers (Atributos)
    // Posição
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Cor
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    // Normais (Luz)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    // 6. Enviar as Matrizes (Uniforms)
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    // 7. Desenhar (Apenas UMA vez)
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
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

// Funções para gerenciar o teclado (coloque no final do arquivo)
function handleKeyDown(event) {
    keys[event.key] = true;
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

// Inicia
window.onload = main;