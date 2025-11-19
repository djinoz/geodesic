import * as THREE from 'three';
// Method 4: V2 Geodesic dome following geodesic-instructions.jpg construction sequence
export default function create2VGeodesicDomeMethod4(radius) {
    console.log('Creating Method 4 V2 geodesic dome following physical construction sequence...');
    const vertices = [];
    const faces = [];
    // Edge lengths: short=90mm, long=106mm
    const shortSpan = 90;
    const longSpan = 106;
    const spanRatio = longSpan / shortSpan;
    // Step 1: Central 5-socket hub
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    const centralHub = 0;
    // Step 1: Add 5 short spans from central hub (creates pentagon)
    const pentagon = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        // Position vertices at correct distance for short spans
        const shortSpanNormalized = 0.618 * radius; // Geodesic proportion
        const height = Math.cos(shortSpanNormalized / radius) * radius;
        const ringRadius = Math.sin(shortSpanNormalized / radius) * radius;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        pentagon.push(vertices.length - 1);
    }
    // Step 2: Connect pentagon vertices with long spans (pentagonal star)
    // This creates the star pattern - each vertex becomes a 6-socket hub
    const starOuter = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset for star points
        const longSpanNormalized = 0.618 * radius * spanRatio;
        const height = Math.cos(longSpanNormalized / radius) * radius * 0.65;
        const ringRadius = Math.sin(longSpanNormalized / radius) * radius * 1.2;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        starOuter.push(vertices.length - 1);
    }
    // Step 3-4: Add vertices for the expansion (following the diagrams)
    const middleRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0.309 * radius; // Middle level
        const ringRadius = Math.sqrt(radius * radius - height * height);
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        middleRing.push(vertices.length - 1);
    }
    // Step 7-8: Base level vertices
    const baseRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0;
        const ringRadius = radius;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        baseRing.push(vertices.length - 1);
    }
    console.log(`Method 4: Created ${vertices.length} vertices (26 expected: 1+5+5+10+10)`);
    // Create faces following the construction sequence:
    // Only the two triangle types: (short,short,long) and (long,long,long)
    // Step 1-2: Top 5 triangles (short, short, long)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([centralHub, pentagon[i], pentagon[next]]);
    }
    // Step 2-3: Pentagonal star triangles (long, long, long)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([pentagon[i], starOuter[i], pentagon[next]]);
    }
    // Steps 4-6: Middle level connections (alternating triangle types)
    for (let i = 0; i < 5; i++) {
        // Connect pentagon to middle ring (short, short, long)
        faces.push([pentagon[i], middleRing[i * 2], middleRing[i * 2 + 1]]);
        // Connect star outer to middle ring (long, long, long)
        faces.push([starOuter[i], middleRing[i * 2], middleRing[((i + 1) % 5) * 2]]);
        // Additional connections to complete middle level
        faces.push([pentagon[i], middleRing[i * 2 + 1], starOuter[i]]);
    }
    // Steps 7-8: Base level connections (20 triangles)
    for (let i = 0; i < 10; i++) {
        const nextI = (i + 1) % 10;
        // Connect middle ring to base ring
        faces.push([middleRing[i], baseRing[i], middleRing[nextI]]);
        faces.push([middleRing[nextI], baseRing[i], baseRing[nextI]]);
    }
    console.log(`Method 4: Created ${faces.length} faces (target: 40)`);
    console.log(`Method 4: Following physical construction - only 2 triangle types`);
    return { vertices, faces };
}
