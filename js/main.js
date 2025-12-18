// js/main.js

// =====================================================================
// IMPORTAÇÕES
// Traz as funcionalidades dos outros módulos (Shaders, Loader, Geradores)
// =====================================================================
import { vsSource, fsSource } from './shaders.js';
import { loadObjFile } from './loader.js';
import { createTunnelData } from './tunnel.js';
import { createAsteroidData } from './asteroid.js';
import { createLaserData } from './laser.js'; 
import { initTextures } from './textures.js'; 

// Variáveis do Contexto WebGL
let gl;
let shipRotation = 0.0;

// Variáveis de Estado da Nave e Câmera
let shipPosition = [0.0, 0.0, -6.0]; // Requisito 2: Jogo em 3D
let keys = {};
// Requisito 4: Sistema de Câmera com 2 Modos
let cameraMode = 0; // 0 = 3ª Pessoa, 1 = 1ª Pessoa

// =====================================================================
// VARIÁVEIS GLOBAIS DO JOGO
// =====================================================================
let obstacles = []; 
let shots = []; 
let score = 0; // Requisito 9: Sistema de Pontuação
let playerHP = 5;
let playerHitFlash = 0; // Efeito visual quando leva dano
let timeSinceLastSpawn = 0;
let isGameOver = false;
let isGameWon = false; 
let lastShotTime = 0; 

let isGameStarted = false; 

// Sistema de Níveis
let currentLevel = 1;
let spawnInterval = 1.5; 
let levelTargetScore = 300; 
let isLevelUpPaused = false; 

// Elementos da Interface (HUD)
const scoreElement = document.getElementById("score");
const hpElement = document.getElementById("hp"); 
const levelElement = document.getElementById("level");
const gameOverElement = document.getElementById("game-over");
const levelUpElement = document.getElementById("level-up");
const levelMsgElement = document.getElementById("level-msg");
const gameWonElement = document.getElementById("game-won");
const startScreenElement = document.getElementById("start-screen");

// =====================================================================
// FUNÇÃO MAIN (PONTO DE PARTIDA)
// Inicializa o WebGL, carrega assets e inicia o loop de renderização
// =====================================================================
async function main() {
    // Requisito 1: WebGL Puro
    const canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) { alert("Sem WebGL"); return; }

    // 1. Configuração Inicial da UI (Esconde HUD, Mostra Menu)
    if(scoreElement) scoreElement.classList.add("hidden");
    if(levelElement) levelElement.classList.add("hidden");
    if(hpElement) hpElement.classList.add("hidden");
    if(startScreenElement) startScreenElement.classList.remove("hidden");

    // 2. Configuração de Inputs (Teclado)
    document.addEventListener('keydown', (event) => {
        handleKeyDown(event);
        if (event.key === 'c' || event.key === 'C') cameraMode = (cameraMode + 1) % 2;
        
        if (!isGameStarted && event.key === 'Enter') {
            startGame();
            return;
        }

        if (isGameOver && event.key === 'Enter') resetGame();
        if (isGameWon && event.key === 'Enter') resetGame();
        if (isLevelUpPaused && event.key === 'Enter') nextLevel();
    });
    document.addEventListener('keyup', handleKeyUp);

    // 3. Compilação dos Shaders
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // 4. Mapeamento de Variáveis (Attributes e Uniforms)
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
            flash: gl.getUniformLocation(shaderProgram, 'uFlash'), 
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            useLighting: gl.getUniformLocation(shaderProgram, 'uUseLighting'), // Controle de Luz
        },
    }

    // 5. Geração das Texturas Procedurais
    const textures = initTextures(gl);

    console.log("Carregando assets...");
    
    // 6. Carregamento e Geração de Geometria
    const shipData = await loadObjFile('assets/nave.obj'); // Carrega arquivo externo
    const shipBuffers = initBuffers(gl, shipData);

    const tunnelData = createTunnelData(8.0, 100.0, 8, 20); // Gera túnel
    const tunnelBuffers = initBuffers(gl, tunnelData);

    const asteroidData = createAsteroidData(0.8, 4); // Gera asteroide
    const asteroidBuffers = initBuffers(gl, asteroidData);

    const laserData = createLaserData(); // Gera laser
    const laserBuffers = initBuffers(gl, laserData);

    console.log("Jogo Pronto!");

    let tunnelOffset = 0;
    let then = 0;

    // =================================================================
    // LOOP DE RENDERIZAÇÃO (FRAME A FRAME)
    // =================================================================
    function render(now) {
        now *= 0.001; // Converte para segundos
        const deltaTime = now - then;
        then = now;

        // Limpeza e Configuração da Tela
        resizeCanvas(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Atualiza Lógica do Jogo (se não estiver pausado/menu)
        if (isGameStarted && !isGameOver && !isLevelUpPaused && !isGameWon) {
            updateGame(deltaTime, now);
        }

        // Animação do Túnel (Velocidade depende se o jogo começou)
        const speed = 5.0 * deltaTime;
        const tunnelSpeed = isGameStarted ? 5.0 : 1.0; 
        tunnelOffset += speed * tunnelSpeed;
        if (tunnelOffset > 5.0) tunnelOffset = 0;

        // Configuração da Câmera (View Matrix)
        const viewMatrix = mat4.create();
        if (cameraMode === 0) {
            // Requisito 4: Câmera em 3ª Pessoa (Câmera fixa atrás)
            mat4.lookAt(viewMatrix, [0, 1, 0], [0, 0, -10], [0, 1, 0]);
        } else {
            // Requisito 4: Câmera em 1ª Pessoa (Câmera segue a nave)
            mat4.lookAt(viewMatrix, shipPosition, [shipPosition[0], shipPosition[1], -20], [0, 1, 0]);
        }

        // --- DESENHO DOS OBJETOS ---
        
        // 1. Nave (Com Iluminação)
        if (cameraMode === 0) {
            const rot = isGameOver ? now * 5 : shipRotation;
            if(playerHitFlash > 0) playerHitFlash -= deltaTime;
            const isShipFlashing = playerHitFlash > 0 ? 1.0 : 0.0;
            const finalRot = isGameWon ? now * 2 : rot; 
            const menuRot = isGameStarted ? finalRot : now * 0.5;

            drawObject(gl, programInfo, shipBuffers, shipData.vertexCount, textures.ship, 
                shipPosition, [0, Math.PI, menuRot], [1, 1, 1], viewMatrix, isShipFlashing, 1.0);
        }

        // 2. Túnel (Sem Iluminação - Efeito Neon)
        drawObject(gl, programInfo, tunnelBuffers, tunnelData.vertexCount, textures.tunnel,
            [0, 0, 10 + tunnelOffset], [0, 0, now * 0.2], [1, 1, 1], viewMatrix, 0.0, 0.0);

        // 3. Obstáculos (Com Iluminação)
        for (const obs of obstacles) {
            const seed = obs.position[2];
            if(obs.hitFlash > 0) obs.hitFlash -= deltaTime;
            const isFlashing = obs.hitFlash > 0 ? 1.0 : 0.0;
            const scale = obs.hitFlash > 0 ? 0.9 : 1.0; 
            
            drawObject(gl, programInfo, asteroidBuffers, asteroidData.vertexCount, textures.asteroid,
                obs.position, [now + seed, now * 0.7 + seed, now * 0.2], [scale, scale, scale], viewMatrix, isFlashing, 1.0);
        }

        // 4. Tiros (Sem Iluminação - Efeito Plasma)
        for (const shot of shots) {
            drawObject(gl, programInfo, laserBuffers, laserData.vertexCount, textures.laser,
                shot.position, [0, 0, 0], [1, 1, 1], viewMatrix, 0.0, 0.0);
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

// =====================================================================
// FUNÇÕES DE CONTROLE DE ESTADO DO JOGO
// =====================================================================

function startGame() {
    isGameStarted = true;
    startScreenElement.classList.add("hidden");
    scoreElement.classList.remove("hidden");
    levelElement.classList.remove("hidden");
    hpElement.classList.remove("hidden");
}

// Requisito 8: Jogabilidade
function updateGame(deltaTime, now) {
    const speed = 8.0 * deltaTime;

    // Movimentação da Nave (WASD / Setas)
    if (keys['ArrowLeft'] || keys['a']) { shipPosition[0] -= speed; shipRotation = 0.5; }
    else if (keys['ArrowRight'] || keys['d']) { shipPosition[0] += speed; shipRotation = -0.5; }
    else { shipRotation = 0.0; }
    
    if (keys['ArrowUp'] || keys['w']) shipPosition[1] += speed;
    if (keys['ArrowDown'] || keys['s']) shipPosition[1] -= speed;

    // Limites de Movimento (Parede invisível)
    const limit = 3.5;
    if (shipPosition[0] > limit) shipPosition[0] = limit;
    if (shipPosition[0] < -limit) shipPosition[0] = -limit;
    if (shipPosition[1] > limit) shipPosition[1] = limit;
    if (shipPosition[1] < -limit) shipPosition[1] = -limit;

    // Disparo (Espaço)
    if (keys[' '] && now - lastShotTime > 0.2) { 
        spawnShot();
        lastShotTime = now;
    }

    // Requisito 10: Conclusão do Jogo
    // Checagem de Level Up / Vitória
    if (score >= levelTargetScore) {
        if (currentLevel >= 10) {
            gameWon();
        } else {
            showLevelUpScreen();
        }
        return; 
    }

    // Spawn de Inimigos
    timeSinceLastSpawn += deltaTime;
    if (timeSinceLastSpawn > spawnInterval) { 
        spawnObstacle();
        timeSinceLastSpawn = 0;
        score += 1; 
        scoreElement.innerText = "Pontos: " + score;
    }

    // Atualização dos Tiros (Movimento e Colisão)
    for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];
        shot.position[2] -= 30.0 * deltaTime; // Tiro vai para o fundo
        if (shot.position[2] < -100) { shots.splice(i, 1); continue; }

        let hit = false;
        for (const obs of obstacles) {
            // Colisão Esfera-Esfera simples
            const dist = Math.sqrt(Math.pow(shot.position[0] - obs.position[0], 2) + Math.pow(shot.position[1] - obs.position[1], 2) + Math.pow(shot.position[2] - obs.position[2], 2));
            if (dist < 1.0) { 
                obs.hp -= 1;
                obs.hitFlash = 0.1; 
                hit = true;
                break; 
            }
        }
        if (hit) shots.splice(i, 1);
    }

    // Atualização dos Obstáculos (Movimento e Colisão com Nave)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs.hp <= 0) {
            obstacles.splice(i, 1);
            score += 300; 
            scoreElement.innerText = "Pontos: " + score;
            continue;
        }

        obs.position[2] += 15.0 * deltaTime; // Asteroide vem em direção à câmera

        // Colisão com a Nave
        // Distância Euclidiana
        const dist = Math.sqrt(Math.pow(shipPosition[0] - obs.position[0], 2) + Math.pow(shipPosition[1] - obs.position[1], 2) + Math.pow(shipPosition[2] - obs.position[2], 2));
        if (dist < 1.3) {
            playerHP -= 1;
            playerHitFlash = 0.5; 
            hpElement.innerText = "HP: " + playerHP;
            obstacles.splice(i, 1);
            if (playerHP <= 0) gameOver();
            continue; 
        }
        if (obs.position[2] > 2.0) obstacles.splice(i, 1); // Remove se passou da câmera
    }
}

// =====================================================================
// HELPERS DO JOGO (SPAWN, UI, RESET)
// =====================================================================

function spawnObstacle() {
    const x = (Math.random() * 6) - 3;
    const y = (Math.random() * 6) - 3;
    obstacles.push({ position: [x, y, -100.0], hp: 5, hitFlash: 0 }); // Requisito 2: Jogo em 3D
}

function spawnShot() {
    shots.push({ position: [shipPosition[0], shipPosition[1], shipPosition[2]] });
}

function showLevelUpScreen() {
    isLevelUpPaused = true;
    if (levelUpElement) {
        const nextLvl = currentLevel + 1;
        if (nextLvl % 5 === 0) {
            levelMsgElement.innerText = "PARABÉNS PILOTO! BÔNUS: +1 VIDA!";
            levelMsgElement.style.color = "#33ff33"; 
        } else {
            levelMsgElement.innerText = "Prepare-se para mais asteroides...";
            levelMsgElement.style.color = "white";
        }
        levelUpElement.classList.remove("hidden");
    }
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > 10) { gameWon(); return; }
    
    score = 0;
    scoreElement.innerText = "Pontos: 0";
    spawnInterval = Math.max(0.3, spawnInterval - 0.2); 
    
    if (currentLevel % 5 === 0) {
        playerHP++;
        hpElement.innerText = "HP: " + playerHP;
    }

    if (levelElement) levelElement.innerText = "NÍVEL " + currentLevel;
    if (levelUpElement) levelUpElement.classList.add("hidden");
    isLevelUpPaused = false;
    obstacles = [];
    shots = [];
}

function gameWon() {
    isGameWon = true;
    isLevelUpPaused = false; 
    levelUpElement.classList.add("hidden"); 
    gameWonElement.classList.remove("hidden"); 
}

function gameOver() {
    isGameOver = true;
    if(gameOverElement) gameOverElement.classList.remove("hidden");
}

function resetGame() {
    obstacles = [];
    shots = [];
    score = 0;
    playerHP = 5;
    playerHitFlash = 0;
    currentLevel = 1;
    spawnInterval = 1.5;
    isLevelUpPaused = false;
    isGameOver = false;
    isGameWon = false; 
    isGameStarted = false; 
    
    shipPosition = [0.0, 0.0, -6.0];
    scoreElement.innerText = "Pontos: 0";
    hpElement.innerText = "HP: 5";
    levelElement.innerText = "NÍVEL 1";
    
    if(gameOverElement) gameOverElement.classList.add("hidden");
    if(levelUpElement) levelUpElement.classList.add("hidden");
    if(gameWonElement) gameWonElement.classList.add("hidden"); 
    
    // Mostra Menu Inicial
    if (!isGameStarted) {
        startScreenElement.classList.remove("hidden");
        scoreElement.classList.add("hidden");
        levelElement.classList.add("hidden");
        hpElement.classList.add("hidden");
    }
}

// =====================================================================
// FUNÇÕES AUXILIARES DE WEBGL (BUFFERS E DRAW)
// =====================================================================


// Buffers Gerados Manualmente
function initBuffers(gl, objectData) {
    // Buffer de Posição
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.positions), gl.STATIC_DRAW);

    // Buffer de Textura
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.textureCoords), gl.STATIC_DRAW);

    // Buffer de Normais
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objectData.normals), gl.STATIC_DRAW);

    return { 
        position: positionBuffer, 
        textureCoord: textureCoordBuffer, 
        normal: normalBuffer 
    };
}

// Função Genérica para Desenhar qualquer objeto
// Aceita parâmetro 'useLighting' para ligar/desligar luz
function drawObject(gl, programInfo, buffers, vertexCount, texture, position, rotation, scale, viewMatrix, flash = 0.0, useLighting = 1.0) {
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

    // Configura os atributos (Vértices, Textura, Normais)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

    gl.useProgram(programInfo.program);
    
    // Bind da Textura
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    // Matriz de Projeção (Perspectiva)
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, 0.1, 200.0); // Requisito 5: Projeção Perspectiva

    // Envio dos Uniforms para o Shader
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix);

    gl.uniform1f(programInfo.uniformLocations.flash, flash);
    gl.uniform1f(programInfo.uniformLocations.useLighting, useLighting); // Flag de Luz

    // Chamada de Desenho
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

// Boilerplate de Shaders e Canvas (Padrão WebGL)
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    return shaderProgram;
}

// =====================================================================
// FUNÇÃO AUXILIAR: COMPILAÇÃO DE SHADER INDIVIDUAL
// Cria, anexa o código fonte e compila um shader (Vertex ou Fragment)
// =====================================================================
function loadShader(gl, type, source) {
    // 1. Cria o objeto shader vazio no contexto WebGL
    const shader = gl.createShader(type);

    // 2. Envia o código fonte (texto GLSL) para o objeto shader
    gl.shaderSource(shader, source);

    // 3. Compila o shader na GPU
    gl.compileShader(shader);

    // 4. Verificação de Erros de Compilação
    // Se houver erro de sintaxe no GLSL, ele loga no console e deleta o shader
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// =====================================================================
// FUNÇÃO AUXILIAR: REDIMENSIONAMENTO DO CANVAS (RESPONSIVO)
// Ajusta a resolução interna do Canvas para bater com o tamanho da tela,
// corrigindo borrões em telas de alta densidade (Retina/High-DPI).
// =====================================================================
function resizeCanvas(canvas) {
    // Pega a densidade de pixels da tela (1 = padrão, 2 = Retina/Celulares modernos)
    const dpr = window.devicePixelRatio || 1;

    // Calcula quantos pixels reais existem na área ocupada pelo canvas
    const displayWidth = Math.round(canvas.clientWidth * dpr);
    const displayHeight = Math.round(canvas.clientHeight * dpr);

    // Se o tamanho interno (buffer) for diferente do tamanho de exibição (CSS), ajusta.
    // Isso evita que a imagem fique esticada ou pixelada.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }
}


// EVENT LISTENERS E INICIALIZAÇÃO
// Marca a tecla como "pressionada" (true) no objeto de controle
function handleKeyDown(event) { keys[event.key] = true; }

// Marca a tecla como "solta" (false) no objeto de controle
function handleKeyUp(event) { keys[event.key] = false; }

// Garante que o jogo só comece quando todo o HTML estiver carregado
window.onload = main;