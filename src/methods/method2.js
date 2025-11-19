import * as THREE from 'three';
// Method 2: Simplified physical kit geodesic dome (30-35 faces)
export default function create2VGeodesicDomeMethod2(radius) {
    console.log('Creating simplified physical kit geodesic dome...');
    const vertices = [];
    const faces = [];
    // Simpler structure: 3 levels only
    // Top vertex (apex) - Level 1
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    // Upper ring - 5 vertices around the top - Level 2
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const y = 0.7; // Higher up for fewer levels
        const radiusAtY = Math.sqrt(1 - y * y);
        vertices.push(new THREE.Vector3(radiusAtY * Math.cos(angle), y, radiusAtY * Math.sin(angle)).multiplyScalar(radius));
    }
    // Base ring - 10 vertices at equator - Level 3
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        vertices.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(radius));
    }
    console.log(`Created ${vertices.length} vertices for simplified dome`);
    // Level 1: 5 triangles around the top vertex
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([0, i + 1, next + 1]); // Top vertex to upper ring
    }
    // Level 2 & 3: Connect upper ring directly to base ring
    for (let i = 0; i < 5; i++) {
        const upperCurrent = i + 1;
        const upperNext = ((i + 1) % 5) + 1;
        const baseCurrent = i * 2 + 6;
        const baseNext = (i * 2 + 1) + 6;
        const baseAfterNext = ((i + 1) * 2) % 10 + 6;
        // Create 4 triangular faces per upper vertex section
        faces.push([upperCurrent, baseCurrent, baseNext]);
        faces.push([upperCurrent, baseNext, upperNext]);
        faces.push([upperNext, baseNext, baseAfterNext]);
        faces.push([upperNext, baseAfterNext, baseCurrent]);
    }
    console.log(`Created ${faces.length} faces for simplified dome`);
    // Verify structure
    const topVertexFaces = faces.filter(face => face.includes(0)).length;
    console.log(`Simplified kit: Top vertex connects to ${topVertexFaces} faces`);
    console.log(`Total faces: ${faces.length} (target: 30-35)`);
    return { vertices, faces };
}
