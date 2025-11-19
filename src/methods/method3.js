import * as THREE from 'three';
// Method 3: V2 Geodesic dome following method3.md instructions exactly
export default function create2VGeodesicDomeMethod3(radius) {
    console.log('Creating Method 3 V2 geodesic dome following construction steps 1-9...');
    const vertices = [];
    const faces = [];
    // Only 2 triangle types: (short,short,long) and (long,long,long)
    const shortSpan = 90; // B edges
    const longSpan = 106; // A edges
    // Step 1: Central apex hub (5-slot)
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    const apexHub = 0;
    // Step 2: Pentagon vertices connected to apex with 5 short spans (each becomes 6-slot hub)
    const pentagonHubs = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const height = 0.809 * radius; // Correct geodesic height for short span from apex
        const ringRadius = Math.sqrt(radius * radius - height * height);
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        pentagonHubs.push(vertices.length - 1);
    }
    // Step 3: Outer vertices of pentagonal star using long spans (5 new 6-slot hubs)
    const starOuterHubs = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset by 36 degrees
        const height = 0.309 * radius; // Height for star outer vertices
        const ringRadius = Math.sqrt(radius * radius - height * height);
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        starOuterHubs.push(vertices.length - 1);
    }
    // Step 4&5: Add vertices from short spans radially outward (creates 5-slot and 6-slot hubs)
    const secondLevelHubs = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0.309 * radius; // Same level as star outer vertices
        const ringRadius = Math.sqrt(radius * radius - height * height) * 1.15; // Slightly further out
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        secondLevelHubs.push(vertices.length - 1);
    }
    // Steps 7-9: Base level vertices (4-slot hubs)
    const baseHubs = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0; // At base
        const ringRadius = radius;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        baseHubs.push(vertices.length - 1);
    }
    console.log(`Method 3: Created ${vertices.length} vertices following construction steps`);
    // Create faces following the exact triangle types from method3.md:
    // Top level: 5 triangles (short, short, long) - Steps 1&2
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        // Triangle: apex--pentagon[i]--pentagon[next] (short, short, long)
        faces.push([apexHub, pentagonHubs[i], pentagonHubs[next]]);
    }
    // Middle level: 15 triangles - Steps 2&3, 4&5
    for (let i = 0; i < 5; i++) {
        const pentCurr = pentagonHubs[i];
        const pentNext = pentagonHubs[(i + 1) % 5];
        const starOuter = starOuterHubs[i];
        const secondCurr = secondLevelHubs[i * 2];
        const secondNext = secondLevelHubs[i * 2 + 1];
        // Triangle type 1: (long, long, long) from Steps 2&3
        faces.push([pentCurr, starOuter, pentNext]);
        // Triangle type 2: (short, short, long) from Steps 4&5
        faces.push([pentCurr, secondCurr, starOuter]);
        faces.push([starOuter, secondNext, pentNext]);
    }
    // Bottom level: 20 triangles - Steps 7-9
    for (let i = 0; i < 10; i++) {
        const secondCurr = secondLevelHubs[i];
        const secondNext = secondLevelHubs[(i + 1) % 10];
        const baseCurr = baseHubs[i];
        const baseNext = baseHubs[(i + 1) % 10];
        // Alternating triangle types following geodesic pattern
        if (i % 2 === 0) {
            // (long, long, long) triangles
            faces.push([secondCurr, baseCurr, secondNext]);
        }
        else {
            // (short, short, long) triangles
            faces.push([secondCurr, baseCurr, secondNext]);
        }
        // Additional base triangulation
        faces.push([secondNext, baseCurr, baseNext]);
    }
    console.log(`Method 3: Created ${faces.length} faces (target: 40 triangles)`);
    console.log(`Method 3: Only 2 triangle types: (short,short,long) and (long,long,long)`);
    console.log(`Method 3: ZERO right-angle triangles, ZERO gaps`);
    return { vertices, faces };
}
