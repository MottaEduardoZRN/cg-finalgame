// js/main.js
import { vsSource, fsSource } from './shaders.js';
import { loadObjFile } from './loader.js';
import { createTunnelData } from './tunnel.js';
import { createAsteroidData } from './asteroid.js';
import { createLaserData } from './laser.js'; // NOVO: Importa o laser

let gl;
let shipRotation = 0.0;

// Variáveis de Estado
let shipPosition = [0.0, 0.0, -6.0];
let keys = {};
let cameraMode = 0; 

// VARIÁVEIS DO JOGO
let obstacles = []; 
let shots = []; // NOVO: Lista de tiros
let score = 0;
let timeSinceLastSpawn = 0;
let isGameOver = false;
let lastShotTime = 0; // Para limitar a velocidade do tiro (Cooldown)

// Cache UI
const scoreElement = document.getElementById("score");
const gameOverElement = document.getElementById("game-over");

async function main() {
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) { alert("Sem WebGL"); return; }

    // --- INPUTS ---
    document.addEventListener('keydown', (event) => {
        handleKeyDown(event);
        if (event.key === 'c' || event.key === 'C') cameraMode = (cameraMode + 1) % 2;
        if (isGameOver && event.key === 'Enter') resetGame();
    });
    document.addEventListener('keyup', handleKeyUp);

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            // ... (seus atributos iguais) ...
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        },
        uniformLocations: {
            // ... (seus uniforms iguais) ...
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            
            // --- NOVO: Variável do Flash ---
            flash: gl.getUniformLocation(shaderProgram, 'uFlash'), 
        },
    }

    console.log("Carregando assets...");
    const shipData = await loadObjFile('assets/nave.obj');
    const shipBuffers = initBuffers(gl, shipData);

    const tunnelData = createTunnelData(8.0, 100.0, 8, 20);
    const tunnelBuffers = initBuffers(gl, tunnelData);

    const asteroidData = createAsteroidData(0.8, 4);
    const asteroidBuffers = initBuffers(gl, asteroidData);

    // CARREGA O LASER
    const laserData = createLaserData();
    const laserBuffers = initBuffers(gl, laserData);

    console.log("Jogo Pronto!");

    let tunnelOffset = 0;
    let then = 0;

    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        resizeCanvas(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!isGameOver) {
            updateGame(deltaTime, now);
        }

        const speed = 5.0 * deltaTime;
        tunnelOffset += speed * 5.0;
        if (tunnelOffset > 5.0) tunnelOffset = 0;

        const viewMatrix = mat4.create();
        if (cameraMode === 0) {
            mat4.lookAt(viewMatrix, [0, 1, 0], [0, 0, -10], [0, 1, 0]);
        } else {
            mat4.lookAt(viewMatrix, shipPosition, [shipPosition[0], shipPosition[1], -20], [0, 1, 0]);
        }

        // DESENHO
        
        // 1. Nave
        if (cameraMode === 0) {
            const rot = isGameOver ? now * 5 : shipRotation;
            drawObject(gl, programInfo, shipBuffers, shipData.vertexCount,
                shipPosition, [0, Math.PI, rot], [1, 1, 1], viewMatrix);
        }

        // 2. Túnel
        drawObject(gl, programInfo, tunnelBuffers, tunnelData.vertexCount,
            [0, 0, 10 + tunnelOffset], [0, 0, now * 0.2], [1, 1, 1], viewMatrix);

        // 3. Obstáculos
        for (const obs of obstacles) {
            const seed = obs.position[2];
            
            // Lógica do Flash: Se hitFlash > 0, manda 1.0 (Ligar), senão 0.0 (Desligar)
            // Também mantemos a escala tremendo um pouco
            if(obs.hitFlash > 0) obs.hitFlash -= deltaTime;
            const isFlashing = obs.hitFlash > 0 ? 1.0 : 0.0;
            const scale = obs.hitFlash > 0 ? 0.9 : 1.0; 

            drawObject(gl, programInfo, asteroidBuffers, asteroidData.vertexCount,
                obs.position,
                [now + seed, now * 0.7 + seed, now * 0.2], 
                [scale, scale, scale], 
                viewMatrix,
                isFlashing // <--- Passamos o flash aqui no final!
            );
        }

        // 4. TIROS (NOVO)
        for (const shot of shots) {
            drawObject(gl, programInfo, laserBuffers, laserData.vertexCount,
                shot.position, [0, 0, 0], [1, 1, 1], viewMatrix);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function updateGame(deltaTime, now) {
    const speed = 8.0 * deltaTime;

    // Movimento Nave
    if (keys['ArrowLeft'] || keys['a']) { shipPosition[0] -= speed; shipRotation = 0.5; }
    else if (keys['ArrowRight'] || keys['d']) { shipPosition[0] += speed; shipRotation = -0.5; }
    else { shipRotation = 0.0; }
    
    if (keys['ArrowUp'] || keys['w']) shipPosition[1] += speed;
    if (keys['ArrowDown'] || keys['s']) shipPosition[1] -= speed;

    // Limites
    const limit = 3.5;
    if (shipPosition[0] > limit) shipPosition[0] = limit;
    if (shipPosition[0] < -limit) shipPosition[0] = -limit;
    if (shipPosition[1] > limit) shipPosition[1] = limit;
    if (shipPosition[1] < -limit) shipPosition[1] = -limit;

    // ATIRAR (Spacebar)
    if (keys[' '] && now - lastShotTime > 0.2) { // Cooldown de 0.2s
        spawnShot();
        lastShotTime = now;
    }

    // Gerar Obstáculos
    timeSinceLastSpawn += deltaTime;
    if (timeSinceLastSpawn > 1.5) { // Um pouco mais devagar para dar tempo de atirar
        spawnObstacle();
        timeSinceLastSpawn = 0;
        score += 1; // Ponto pequeno por sobrevivência
        scoreElement.innerText = "Pontos: " + score;
    }

    // ATUALIZAR TIROS
    for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];
        shot.position[2] -= 30.0 * deltaTime; // Tiro viaja rápido para o fundo

        // Remove tiro se for muito longe
        if (shot.position[2] < -100) {
            shots.splice(i, 1);
            continue; // Vai para o próximo loop
        }

        // Checar colisão com todos os asteroides
        let hit = false;
        for (const obs of obstacles) {
            const dist = Math.sqrt(
                Math.pow(shot.position[0] - obs.position[0], 2) +
                Math.pow(shot.position[1] - obs.position[1], 2) +
                Math.pow(shot.position[2] - obs.position[2], 2)
            );

            if (dist < 1.0) { // Acertou o asteroide (raio + margem)
                obs.hp -= 1;
                obs.hitFlash = 0.1; // Efeito visual
                hit = true;
                if (obs.hp <= 0) {
                    // Asteroide Destruído!
                    // Lógica será tratada no loop de obstáculos para não quebrar array
                }
                break; // Tiro some ao bater
            }
        }

        if (hit) {
            shots.splice(i, 1);
        }
    }

    // ATUALIZAR OBSTÁCULOS
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        
        // Verifica se morreu
        if (obs.hp <= 0) {
            obstacles.splice(i, 1);
            score += 50; // MUITOS PONTOS POR DESTRUIR!
            scoreElement.innerText = "Pontos: " + score;
            continue;
        }

        obs.position[2] += 15.0 * deltaTime; // Velocidade do asteroide

        // Colisão com a NAVE
        const dist = Math.sqrt(
            Math.pow(shipPosition[0] - obs.position[0], 2) +
            Math.pow(shipPosition[1] - obs.position[1], 2) +
            Math.pow(shipPosition[2] - obs.position[2], 2)
        );

        if (dist < 1.3) {
            gameOver();
        }

        if (obs.position[2] > 2.0) {
            obstacles.splice(i, 1);
        }
    }
}

function spawnObstacle() {
    const x = (Math.random() * 6) - 3;
    const y = (Math.random() * 6) - 3;
    obstacles.push({ 
        position: [x, y, -100.0],
        hp: 5,         // AGUENTA 5 TIROS
        hitFlash: 0    // Para efeito visual
    });
}

function spawnShot() {
    // Cria o tiro na posição atual da nave
    shots.push({
        position: [shipPosition[0], shipPosition[1], shipPosition[2]]
    });
}

function gameOver() {
    isGameOver = true;
    gameOverElement.classList.remove("hidden");
}

function resetGame() {
    obstacles = [];
    shots = [];
    score = 0;
    shipPosition = [0.0, 0.0, -6.0];
    scoreElement.innerText = "Pontos: 0";
    isGameOver = false;
    gameOverElement.classList.add("hidden");
}

// --- boilerplate ---
function initBuffers(gl, objectData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.colors), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.normals), gl.STATIC_DRAW);

    return { position: positionBuffer, color: colorBuffer, normal: normalBuffer };
}

function drawObject(gl, programInfo, buffers, vertexCount, position, rotation, scale, viewMatrix, flash = 0.0) {
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, position);
    if(rotation) {
         mat4.rotate(modelMatrix, modelMatrix, rotation[0], [1, 0, 0]); 
         mat4.rotate(modelMatrix, modelMatrix, rotation[1], [0, 1, 0]); 
         mat4.rotate(modelMatrix, modelMatrix, rotation[2], [0, 0, 1]); 
    }
    if(scale) mat4.scale(modelMatrix, modelMatrix, scale);

    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);

    const normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    gl.useProgram(programInfo.program);
    
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 200.0); 

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    // AGORA SIM: A variável 'flash' existe porque foi passada nos argumentos
    gl.uniform1f(programInfo.uniformLocations.flash, flash);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
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
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function resizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}

function handleKeyDown(event) { keys[event.key] = true; }
function handleKeyUp(event) { keys[event.key] = false; }

window.onload = main;