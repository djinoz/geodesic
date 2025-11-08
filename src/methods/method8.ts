import * as THREE from 'three';
import { GeodesicData } from './types';

// Method 8: Exact kit build from hubs-build-instructions.pdf page 5
// Kit specs: 30x SHORTS (190mm), 35x LONGS (218mm) = 65 total edges
// 6x 5-way hubs, 20x 6-way hubs = 26 total hubs
// Building edge-by-edge following PDF instructions to get exactly 65 edges
export default function create2VGeodesicDomeMethod8(radius: number): GeodesicData {
    console.log('Creating Method 8 - Edge-by-edge from PDF instructions...');

    const vertices: THREE.Vector3[] = [];
    const edges: [number, number, 'SHORT' | 'LONG'][] = [];

    // Helper to add edge (avoiding duplicates)
    const addEdge = (v1: number, v2: number, type: 'SHORT' | 'LONG') => {
        const key1 = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
        if (!edges.some(([a, b]) => {
            const key2 = `${Math.min(a, b)}-${Math.max(a, b)}`;
            return key1 === key2;
        })) {
            edges.push([v1, v2, type]);
        }
    };

    // STEP 1: Start with 5-way hub + 5 SHORTS radiating + 5 6-way hubs + 5 LONGS around outside
    const apex = 0;
    vertices.push(new THREE.Vector3(0, radius, 0));

    const ring1: number[] = [];
    const r1Height = radius * 0.81;
    const r1Radius = radius * 0.59;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(
            r1Radius * Math.cos(angle),
            r1Height,
            r1Radius * Math.sin(angle)
        ));
        ring1.push(vertices.length - 1);
        addEdge(apex, ring1[i], 'SHORT');  // 5 SHORTS from apex
    }

    for (let i = 0; i < 5; i++) {
        addEdge(ring1[i], ring1[(i + 1) % 5], 'LONG');  // 5 LONGS around pentagon
    }

    // STEP 2-3: Pair of LONGS into left/right free sockets, 6-way hubs connect to create triangles
    const ring2: number[] = [];
    const r2Height = radius * 0.59;
    const r2Radius = radius * 0.95;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5;  // Offset 36°
        vertices.push(new THREE.Vector3(
            r2Radius * Math.cos(angle),
            r2Height,
            r2Radius * Math.sin(angle)
        ));
        ring2.push(vertices.length - 1);
        addEdge(ring1[i], ring2[i], 'LONG');  // LEFT LONG
        addEdge(ring1[(i + 1) % 5], ring2[i], 'LONG');  // RIGHT LONG  (total: 10 LONGS)
    }

    // STEP 4-5: 10 SHORTS in a ring, connecting to 6-way and 5-way hubs
    const ring3: number[] = [];
    const r3Height = radius * 0.31;
    const r3Radius = radius * 0.95;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(
            r3Radius * Math.cos(angle),
            r3Height,
            r3Radius * Math.sin(angle)
        ));
        ring3.push(vertices.length - 1);
        addEdge(ring1[i], ring3[i], 'SHORT');  // 5 SHORTS down from ring1
        addEdge(ring2[i], ring3[i], 'SHORT');  // 5 SHORTS from ring2 (total: 10 SHORTS)
    }

    // Ring3 vertices form a pentagon with SHORT edges (5 SHORTS)
    for (let i = 0; i < 5; i++) {
        addEdge(ring3[i], ring3[(i + 1) % 5], 'SHORT');  // 5 SHORTS forming pentagon
    }

    // STEP 6-7: 2 SHORTS into 5-ways, 2 LONGS into 6-ways, 10 6-way hubs connect into triangles
    const ring4: number[] = [];
    const r4Height = 0;
    const r4Radius = radius * 1.15;

    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        vertices.push(new THREE.Vector3(
            r4Radius * Math.cos(angle),
            r4Height,
            r4Radius * Math.sin(angle)
        ));
        ring4.push(vertices.length - 1);
    }

    // Connect ring3 (5-way hubs) and ring2 (6-way hubs) to ring4 (base)
    for (let i = 0; i < 5; i++) {
        const base1 = ring4[i * 2];
        const base2 = ring4[i * 2 + 1];

        addEdge(ring3[i], base1, 'SHORT');  // SHORT from 5-way to base (5 SHORTS)
        addEdge(ring3[i], base2, 'SHORT');  // Another SHORT from 5-way (5 SHORTS, total: 10 SHORTS)

        addEdge(ring2[i], base1, 'LONG');  // LONG from 6-way to base (5 LONGS)
        addEdge(ring2[i], base2, 'LONG');  // Another LONG from 6-way (5 LONGS, total: 10 LONGS)
    }

    // STEP 8: 10 LONGS in ring around outside (base perimeter)
    for (let i = 0; i < 10; i++) {
        addEdge(ring4[i], ring4[(i + 1) % 10], 'LONG');  // 10 LONGS around base
    }

    // Count edges
    const shortCount = edges.filter(([, , type]) => type === 'SHORT').length;
    const longCount = edges.filter(([, , type]) => type === 'LONG').length;

    console.log(`Method 8: ${vertices.length} vertices, ${edges.length} edges`);
    console.log(`Method 8 Edges: ${shortCount} SHORT, ${longCount} LONG (target: 30 SHORT + 35 LONG = 65 total)`);

    // Build faces from edges for visualization
    // Create triangular faces by finding closed triangles in the edge graph
    const faces: number[][] = [];
    const edgeSet = new Set(edges.map(([v1, v2]) => `${Math.min(v1, v2)}-${Math.max(v1, v2)}`));

    const hasEdge = (v1: number, v2: number) => {
        return edgeSet.has(`${Math.min(v1, v2)}-${Math.max(v1, v2)}`);
    };

    // Find all triangular faces
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            if (!hasEdge(i, j)) continue;
            for (let k = j + 1; k < vertices.length; k++) {
                if (hasEdge(i, k) && hasEdge(j, k)) {
                    faces.push([i, j, k]);
                }
            }
        }
    }

    console.log(`Method 8: Generated ${faces.length} triangular faces from edges`);

    return { vertices, faces };
}
