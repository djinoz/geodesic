import * as THREE from 'three';
// Method 7: Geodesic dome with 3 layers and flat equator following geodesic-instructions.jpg
// Structure: Base decagon (10 chords) -> Middle decagon (10 vertices, 6-socket hubs) -> Pentagon/Star (5 vertices) -> Apex (5-socket hub)
export default function create2VGeodesicDomeMethod7(radius) {
    console.log('Creating Method 7 - Following geodesic-instructions.jpg construction...');
    const vertices = [];
    const faces = [];
    // Calculate base geometry for equilateral triangles
    // For alternate triangles (base[i] - middle[i] - base[i+1]) to be equilateral:
    // All edges must be equal length
    // Let's define the edge length first, then calculate positions
    const targetEdgeLength = 0.8; // Target edge length for equilateral triangles
    // Level 0 (Base): 10-vertex decagon at equator (y=0)
    // Position vertices so that the chord between adjacent base vertices equals targetEdgeLength
    const baseRing = [];
    const baseAngleStep = (2 * Math.PI) / 10;
    // Calculate base radius from the chord length
    // For a regular decagon, chord length = 2 * R * sin(π/10)
    // So R = chord_length / (2 * sin(π/10))
    const baseRadius = targetEdgeLength / (2 * Math.sin(Math.PI / 10));
    for (let i = 0; i < 10; i++) {
        const angle = i * baseAngleStep;
        vertices.push(new THREE.Vector3(baseRadius * Math.cos(angle), 0, baseRadius * Math.sin(angle)));
        baseRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created base decagon with ${baseRing.length} vertices at y=0, radius=${baseRadius.toFixed(3)}`);
    // Level 1 (Middle): 10 vertices positioned to form equilateral triangles
    // For equilateral triangle: base[i] - middle[i] - base[i+1]
    // vertical edge (base[i] to middle[i]) must equal horizontal edge (base[i] to base[i+1])
    // So: sqrt(middleHeight² + (middleRadius - baseRadius)²) = targetEdgeLength
    const middleRing = [];
    // For equilateral triangle with base edge = targetEdgeLength
    // The vertical edge from base[i] to middle[i] should also be targetEdgeLength
    // middle[i] is directly above base[i] with same angle
    // Distance = sqrt(heightDiff² + radialDiff²) = targetEdgeLength
    // Since middle is directly above base (same angle), radialDiff = middleRadius - baseRadius
    // We need: sqrt(middleHeight² + 0²) = targetEdgeLength (for vertical alignment)
    // Actually, for truly equilateral, we need the 3D distance to equal targetEdgeLength
    const middleHeight = targetEdgeLength; // Vertical distance equals target edge length
    const middleRadius = baseRadius; // Same radius for vertical alignment
    for (let i = 0; i < 10; i++) {
        const angle = i * baseAngleStep; // Same angle as base for vertical alignment
        vertices.push(new THREE.Vector3(middleRadius * Math.cos(angle), middleHeight, middleRadius * Math.sin(angle)));
        middleRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created middle layer with ${middleRing.length} vertices at y=${middleHeight.toFixed(3)}, radius=${middleRadius.toFixed(3)}`);
    // Level 2 (Upper): 5-vertex pentagon (6-socket hubs)
    // Scale the pentagon proportionally to the new base size
    const pentagonRing = [];
    const pentagonHeight = middleHeight * 1.5; // Proportional height above middle layer
    const pentagonRadius = baseRadius * 0.6; // Smaller radius for pentagon layer
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(pentagonRadius * Math.cos(angle), pentagonHeight, pentagonRadius * Math.sin(angle)));
        pentagonRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created pentagon with ${pentagonRing.length} vertices at y=${pentagonHeight.toFixed(3)}, radius=${pentagonRadius.toFixed(3)}`);
    // Level 3 (Apex): Single top vertex (5-socket hub)
    const apex = vertices.length;
    const apexHeight = pentagonHeight + targetEdgeLength; // Height based on edge length
    vertices.push(new THREE.Vector3(0, apexHeight, 0));
    console.log(`Method 7: Created apex at index ${apex} at y=${apexHeight.toFixed(3)}`);
    console.log(`Method 7: Total vertices: ${vertices.length} (10 base + 10 middle + 5 pentagon + 1 apex)`);
    // Create faces following the construction pattern in geodesic-instructions.jpg:
    // Layer 1: Connect base to middle layer
    // Each base vertex (4-socket hub) connects to: prev base, next base, middle above, and adjacent middle
    // Each middle vertex (6-socket hub) connects to: prev middle, next middle, 2 base below, and 2 pentagon above
    for (let i = 0; i < 10; i++) {
        const baseCurr = baseRing[i];
        const baseNext = baseRing[(i + 1) % 10];
        const middleCurr = middleRing[i];
        const middleNext = middleRing[(i + 1) % 10];
        // Create triangles connecting base to middle
        // Triangle 1: baseCurr - middleCurr - baseNext (creates the 4th connection for baseCurr)
        faces.push([baseCurr, middleCurr, baseNext]);
        // Triangle 2: baseNext - middleCurr - middleNext (creates connections for middle layer hexagons)
        faces.push([baseNext, middleCurr, middleNext]);
    }
    console.log(`Method 7: Created ${faces.length} faces in Layer 1 (base to middle)`);
    // Layer 2: Connect middle layer to pentagon
    // Each pentagon vertex connects to 2 middle vertices
    for (let i = 0; i < 5; i++) {
        const pentCurr = pentagonRing[i];
        const pentNext = pentagonRing[(i + 1) % 5];
        // Each pentagon edge spans 2 middle vertices
        const middle1 = middleRing[i * 2];
        const middle2 = middleRing[i * 2 + 1];
        const middle3 = middleRing[((i + 1) * 2) % 10];
        // Create 3 triangular faces per pentagon edge
        faces.push([pentCurr, middle1, middle2]);
        faces.push([pentCurr, middle2, pentNext]);
        faces.push([pentNext, middle2, middle3]);
    }
    console.log(`Method 7: Created ${faces.length} total faces after Layer 2 (middle to pentagon)`);
    // Layer 3: Connect pentagon to apex (5 triangles forming the pentagonal star)
    for (let i = 0; i < 5; i++) {
        const pentCurr = pentagonRing[i];
        const pentNext = pentagonRing[(i + 1) % 5];
        faces.push([apex, pentCurr, pentNext]);
    }
    console.log(`Method 7: Created ${faces.length} total faces after Layer 3 (pentagon to apex)`);
    // Add center vertex and flat equator triangles
    const newTriangleFaces = [];
    const originalFaceCount = faces.length;
    const centerIndex = vertices.length;
    vertices.push(new THREE.Vector3(0, 0, 0));
    console.log(`Method 7: Added center vertex at index ${centerIndex} for flat equator`);
    // Create triangular faces connecting center to adjacent base vertices
    for (let i = 0; i < baseRing.length; i++) {
        const current = baseRing[i];
        const next = baseRing[(i + 1) % baseRing.length];
        newTriangleFaces.push([centerIndex, current, next]);
    }
    faces.push(...newTriangleFaces);
    console.log(`Method 7: Final dome has ${vertices.length} vertices and ${faces.length} faces`);
    // Verify equilateral triangles at base layer
    console.log('Method 7: Verifying equilateral triangles (base[i] - middle[i] - base[i+1]):');
    for (let i = 0; i < 10; i++) {
        const v1 = vertices[baseRing[i]];
        const v2 = vertices[middleRing[i]];
        const v3 = vertices[baseRing[(i + 1) % 10]];
        const edge1 = v1.distanceTo(v2); // base to middle (vertical)
        const edge2 = v2.distanceTo(v3); // middle to next base (diagonal)
        const edge3 = v3.distanceTo(v1); // base to next base (horizontal)
        const avgEdge = (edge1 + edge2 + edge3) / 3;
        const maxDiff = Math.max(Math.abs(edge1 - avgEdge), Math.abs(edge2 - avgEdge), Math.abs(edge3 - avgEdge));
        if (maxDiff < 0.001) {
            console.log(`  Triangle ${i}: edges [${edge1.toFixed(3)}, ${edge2.toFixed(3)}, ${edge3.toFixed(3)}] ✓ EQUILATERAL`);
        }
        else {
            console.warn(`  Triangle ${i}: edges [${edge1.toFixed(3)}, ${edge2.toFixed(3)}, ${edge3.toFixed(3)}] ⚠️ NOT equilateral`);
        }
    }
    // Verify hub socket counts
    const vertexConnections = new Map();
    faces.forEach(face => {
        face.forEach((v1, idx) => {
            face.forEach((v2, idx2) => {
                if (idx !== idx2) {
                    if (!vertexConnections.has(v1))
                        vertexConnections.set(v1, new Set());
                    vertexConnections.get(v1).add(v2);
                }
            });
        });
    });
    // Count connections for each level
    console.log('Method 7: Hub socket verification:');
    baseRing.forEach((vIdx, i) => {
        var _a;
        const connections = ((_a = vertexConnections.get(vIdx)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        if (connections !== 4) {
            console.warn(`  Base vertex ${i}: ${connections} connections (expected 4) ⚠️`);
        }
    });
    middleRing.forEach((vIdx, i) => {
        var _a;
        const connections = ((_a = vertexConnections.get(vIdx)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        if (connections !== 6) {
            console.warn(`  Middle vertex ${i}: ${connections} connections (expected 6) ⚠️`);
        }
    });
    console.log(`Method 7: Structure - 4 levels with 3 layers following geodesic-instructions.jpg`);
    return {
        vertices,
        faces,
        newTriangleFaceStartIndex: originalFaceCount,
        newTriangleFaceCount: newTriangleFaces.length
    };
}
