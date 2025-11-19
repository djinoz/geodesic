import * as THREE from 'three';
import create2VGeodesicDomeMethod1 from './method1';
// Method 6: Based on Method 1 but with additional edges between adjacent bottom level vertices
// This creates new triangular faces on the dome surface by connecting bottom vertices
export default function create2VGeodesicDomeMethod6(radius) {
    console.log('Creating Method 6 - Method 1 with additional triangular faces from bottom vertex connections...');
    // Start with Method 1 as base
    const baseData = create2VGeodesicDomeMethod1(radius);
    const vertices = [...baseData.vertices]; // Copy vertices
    const faces = [...baseData.faces]; // Copy faces
    console.log(`Method 6: Base dome has ${vertices.length} vertices and ${faces.length} faces`);
    // Find bottom level vertices (those very close to y=0)
    const equatorTolerance = 0.1;
    const bottomVertices = [];
    vertices.forEach((vertex, index) => {
        if (Math.abs(vertex.y) < equatorTolerance) {
            bottomVertices.push({ index, vertex });
        }
    });
    console.log(`Method 6: Found ${bottomVertices.length} bottom level vertices`);
    // Debug: show all bottom vertices
    bottomVertices.forEach((bv, i) => {
        console.log(`Method 6: Bottom vertex ${i}: index=${bv.index}, pos=(${bv.vertex.x.toFixed(2)}, ${bv.vertex.y.toFixed(2)}, ${bv.vertex.z.toFixed(2)})`);
    });
    // Sort bottom vertices by angle around Y axis to create proper ring order
    bottomVertices.sort((a, b) => {
        const angleA = Math.atan2(a.vertex.z, a.vertex.x);
        const angleB = Math.atan2(b.vertex.z, b.vertex.x);
        return angleA - angleB;
    });
    // Create new triangular faces by connecting adjacent bottom vertices to create a flat equator
    // Instead of searching for existing vertices, create new vertices at y=0 between bottom vertices
    const newTriangleFaces = [];
    const originalFaceCount = faces.length;
    // Add a center vertex at the origin for triangulation
    const centerIndex = vertices.length;
    vertices.push(new THREE.Vector3(0, 0, 0));
    console.log(`Method 6: Added center vertex at index ${centerIndex}`);
    // Create triangular faces connecting center to adjacent bottom vertices
    // This creates the flat equator you requested
    for (let i = 0; i < bottomVertices.length; i++) {
        const current = bottomVertices[i];
        const next = bottomVertices[(i + 1) % bottomVertices.length];
        // Create triangle: center -> current -> next
        newTriangleFaces.push([centerIndex, current.index, next.index]);
        console.log(`Method 6: Created triangle ${i}: center(${centerIndex}) -> bottom(${current.index}) -> bottom(${next.index})`);
    }
    console.log(`Method 6: Created ${newTriangleFaces.length} new triangular faces from bottom vertex connections`);
    // Add the new triangle faces to the main face list
    faces.push(...newTriangleFaces);
    console.log(`Method 6: Final dome has ${vertices.length} vertices and ${faces.length} faces`);
    console.log(`Method 6: New triangle faces are indices ${originalFaceCount} to ${faces.length - 1}`);
    // Return additional metadata for Method 6
    return {
        vertices,
        faces,
        newTriangleFaceStartIndex: originalFaceCount,
        newTriangleFaceCount: newTriangleFaces.length
    };
}
