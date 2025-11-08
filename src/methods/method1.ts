import * as THREE from 'three';
import { GeodesicData } from './types';

export default function create2VGeodesicDomeMethod1(radius: number): GeodesicData {
    // Use Three.js built-in IcosahedronGeometry with detail=1 for true 2V geodesic
    const icosahedron = new THREE.IcosahedronGeometry(radius, 1);

    // Extract vertices from the geometry
    const positions = icosahedron.attributes.position.array as Float32Array;

    const hemisphereVertices: number[] = [];
    const hemisphereFaces: number[] = [];

    // Process faces directly from position array (non-indexed geometry)
    const tolerance = 0.05;
    for (let i = 0; i < positions.length; i += 9) { // Each face is 9 values (3 vertices × 3 coordinates)
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

        // Include face if all vertices are in hemisphere or very close to equator
        if (v1.y >= -tolerance && v2.y >= -tolerance && v3.y >= -tolerance) {
            const startIndex = hemisphereVertices.length / 3;

            // Add the three vertices
            hemisphereVertices.push(
                v1.x, v1.y, v1.z,
                v2.x, v2.y, v2.z,
                v3.x, v3.y, v3.z
            );

            // Add face indices
            hemisphereFaces.push(
                startIndex,
                startIndex + 1,
                startIndex + 2
            );
        }
    }

    // Convert to the format expected by the rest of the code
    const vertices: THREE.Vector3[] = [];
    for (let i = 0; i < hemisphereVertices.length; i += 3) {
        vertices.push(new THREE.Vector3(hemisphereVertices[i], hemisphereVertices[i + 1], hemisphereVertices[i + 2]));
    }

    const faces: number[][] = [];
    for (let i = 0; i < hemisphereFaces.length; i += 3) {
        faces.push([hemisphereFaces[i], hemisphereFaces[i + 1], hemisphereFaces[i + 2]]);
    }

    return { vertices, faces };
}
