// js/asteroid.js

export function createAsteroidData(radius, detail) {
    const positions = [];
    const textureCoords = []; // NOVO
    const normals = [];

    const latBands = detail; 
    const longBands = detail;
    const grid = [];

    // Gera Vértices
    for (let latNumber = 0; latNumber <= latBands; latNumber++) {
        const theta = latNumber * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        const row = [];
        for (let longNumber = 0; longNumber <= longBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            // Coordenadas UV baseadas na latitude/longitude
            const u = 1 - (longNumber / longBands);
            const v = 1 - (latNumber / latBands);

            const currentRadius = radius; 
            row.push({
                pos: [x * currentRadius, y * currentRadius, z * currentRadius],
                uv: [u, v] // Guarda UV temporariamente
            });
        }
        grid.push(row);
    }

    // Costura
    for (let latNumber = 0; latNumber < latBands; latNumber++) {
        for (let longNumber = 0; longNumber < longBands; longNumber++) {
            const p1 = grid[latNumber][longNumber];
            const p2 = grid[latNumber + 1][longNumber];
            const p3 = grid[latNumber][longNumber + 1];
            const p4 = grid[latNumber + 1][longNumber + 1];

            addTriangle(positions, normals, textureCoords, p1, p2, p3);
            addTriangle(positions, normals, textureCoords, p2, p4, p3);
        }
    }

    return {
        positions: positions,
        textureCoords: textureCoords,
        normals: normals,
        vertexCount: positions.length / 3
    };
}

function addTriangle(positions, normals, textureCoords, v1, v2, v3) {
    positions.push(...v1.pos); textureCoords.push(...v1.uv);
    positions.push(...v2.pos); textureCoords.push(...v2.uv);
    positions.push(...v3.pos); textureCoords.push(...v3.uv);

    // Normal Facetada
    const ux = v2.pos[0] - v1.pos[0], uy = v2.pos[1] - v1.pos[1], uz = v2.pos[2] - v1.pos[2];
    const vx = v3.pos[0] - v1.pos[0], vy = v3.pos[1] - v1.pos[1], vz = v3.pos[2] - v1.pos[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if(len > 0) { nx /= len; ny /= len; nz /= len; }

    for(let i=0; i<3; i++) normals.push(nx, ny, nz);
}