// js/laser.js
export function createLaserData() {
    const positions = [];
    const normals = [];
    const textureCoords = []; // NOVO

    const w = 0.1; 
    const l = 0.8; 
    
    const v = [
        [-w, -w,  l], [ w, -w,  l], [ w,  w,  l], [-w,  w,  l], 
        [-w, -w, -l], [-w,  w, -l], [ w,  w, -l], [ w, -w, -l], 
    ];

    const faces = [
        [0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 5], 
        [0, 4, 7, 1], [1, 7, 6, 2], [0, 3, 5, 4]  
    ];
    const norms = [
        [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]
    ];

    for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        const normal = norms[i];
        
        // Face inteira usa a textura toda (0 a 1)
        addVertex(face[0], 0, 0); addVertex(face[1], 1, 0); addVertex(face[2], 1, 1);
        addVertex(face[0], 0, 0); addVertex(face[2], 1, 1); addVertex(face[3], 0, 1);

        function addVertex(idx, u, v) {
            positions.push(...v[idx]);
            normals.push(...normal);
            textureCoords.push(u, v);
        }
    }

    return {
        positions: positions,
        textureCoords: textureCoords,
        normals: normals,
        vertexCount: positions.length / 3
    };
}