# cg-finalgame

# 🚀 Wormhole Runner

> Trabalho Acadêmico Final da disciplina de Computação Gráfica.
> Desenvolvido utilizando **WebGL Puro** (Sem engines ou bibliotecas de alto nível).

![Status](https://img.shields.io/badge/Status-Concluído-brightgreen)
![Tech](https://img.shields.io/badge/Tech-WebGL%20%7C%20JS%20%7C%20GLSL-blue)

## 👥 Integrantes do Grupo

| Nome Completo | RA / Matrícula |
| :--- | :--- |
| **Eduardo Motta** | 148881 |
| **João Pedro Mariano** | 148212 |

---

## 📋 Requisitos do Projeto

Abaixo, detalhamos como cada requisito obrigatório da disciplina foi implementado neste projeto:

- [x] **Utilizar WebGL puro:** O projeto foi construído do zero utilizando a API nativa `WebGLRenderingContext`, sem uso de Three.js, Babylon ou similares. A matemática matricial foi auxiliada apenas pela biblioteca leve `gl-matrix` para operações algébricas.
- [x] **Jogo 3D:** O jogo é um *Infinite Runner* tubular espacial em 3D real.
- [x] **2 ou mais personagens/objetos complexos:**
    1. **Nave do Jogador:** Modelo 3D complexo carregado via arquivo `.obj` com mapeamento UV.
    2. **Asteroides:** Gerados proceduralmente via código (esferas deformadas) com texturas aplicadas.
- [x] **Utilizar múltiplas posições da câmera:** Implementado sistema de troca de câmera (Tecla `C`) alternando entre:
    - **TPS (Third Person):** Visão atrás da nave.
    - **FPS (First Person):** Visão do "bico" da nave/cockpit.
- [x] **Utilizar projeção perspectiva:** Matriz de projeção perspectiva configurada (`mat4.perspective`) para garantir profundidade e distorção correta dos objetos ao se afastarem (efeito de túnel).
- [x] **Utilizar múltiplas fontes de luz:** Implementado no Vertex Shader um sistema de iluminação híbrido:
    - Luz Ambiente (Base).
    - Luz Direcional A ("Sol" - Luz quente lateral).
    - Luz Direcional B ("Fill Light" - Luz fria traseira para dar volume à nave).
- [x] **Utilizar múltiplas texturas:** Sistema de carregamento e mapeamento UV implementado para:
    - Nave (Metal/Tech).
    - Asteroides (Rocha).
    - Túnel (Grade Neon).
    - Laser (Plasma).
- [x] **Jogabilidade:** Controle total da nave (WASD), sistema de colisão (bounding box esférico), sistema de tiro (lasers) e destruição de inimigos.
- [x] **Pontuação e Vidas:** HUD implementada via HTML/CSS sobreposto, contabilizando Score e HP do jogador.
- [x] **Objetivo/Conclusão:** O jogo possui dificuldade progressiva. Ao completar o **Nível 10**, o jogador vence e recebe a tela de "Aprovação".

---

## 🌌 Lore: A Missão Exodus

**Ano:** 2175  
**Local:** Órbita de Saturno

A humanidade está pronta para colonizar o exoplaneta **Teegarden b**. A nave **UNS Pathfinder** deve atravessar um Buraco de Minhoca artificial recém-aberto.

No entanto, durante a travessia, uma instabilidade quântica nocauteou o Piloto Automático e o Comandante. O túnel está colapsando e sugando detritos cósmicos de outros sistemas.

Você, o Especialista de Voo, assumiu o controle manual de emergência. Sua missão é guiar a nave para fora do vórtice instável.

---

## 🎮 Controles

| Tecla | Ação |
| :--- | :--- |
| **W / Seta Cima** | Mover para Cima |
| **S / Seta Baixo** | Mover para Baixo |
| **A / Seta Esquerda** | Mover para Esquerda |
| **D / Seta Direita** | Mover para Direita |
| **Espaço** | Atirar Laser |
| **C** | Trocar Câmera (1ª / 3ª Pessoa) |
| **Enter** | Iniciar Jogo / Reiniciar / Avançar Nível |

---

## ⚙️ Como Rodar o Projeto

⚠️ **IMPORTANTE:** Devido às políticas de segurança dos navegadores modernos (CORS), **texturas e modelos 3D não carregam** se você abrir o arquivo `index.html` diretamente (via duplo clique).

Você precisa de um **Servidor Local (Localhost)**. Escolha uma das opções abaixo:

### Opção 1: VS Code (Recomendado)
1. Instale a extensão **Live Server** no VS Code.
2. Clique com o botão direito no `index.html`.
3. Selecione **"Open with Live Server"**.

### Opção 2: Python
Se tiver Python instalado, abra o terminal na pasta do projeto e rode:
```bash
python -m http.server