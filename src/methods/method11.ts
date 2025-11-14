import * as THREE from 'three';
import { GeodesicData } from './types';

// Method 11: Build dome following physical kit pentagon structure
// Use Method 8's correct pentagon identification + Method 10's constraints for verification
//
// Structure: 1 apex pentagon (5-way hub) + 5 bottom ring pentagons (6-way hubs)
// Build Step 1 from instructions: Create top pentagon (hub + 5 struts)
// Build remaining steps following pentagon connectivity
// THEN verify all Method 10 constraints are satisfied

export default function create2VGeodesicDomeMethod11(radius: number): GeodesicData {
    console.log('Creating Method 11 - Pentagon construction following physical instructions...');

    const SHORT_LENGTH = 0.90; // 90mm normalized
    const LONG_LENGTH = 1.06;  // 106mm normalized
    const tolerance = 0.01;

    const vertices: THREE.Vector3[] = [];

    // Helper to add vertex
    const addVertex = (x: number, y: number, z: number) => {
        vertices.push(new THREE.Vector3(x, y, z));
        return vertices.length - 1;
    };

    // Pentagon structure: center + 5 perimeter vertices
    interface Pentagon {
        center: number;
        perimeter: number[]; // 5 vertices numbered 0-4 clockwise from uppermost
    }

    const pentagons: Pentagon[] = [];

    console.log('\n=== STEP 1: Build Top Pentagon (Apex) ===');
    // Instructions Step 1: 5-way hub + 5 SHORT struts forming pentagon star

    // Top pentagon center at apex
    const topCenter = addVertex(0, radius, 0);
    const topPerimeter: number[] = [];

    // Create 5 perimeter vertices around apex using SHORT_LENGTH distance
    // Position them in a pentagon shape
    const topRingAngle = Math.asin(SHORT_LENGTH / (2 * radius)); // Geometric calculation
    const topRingRadius = radius * Math.sin(topRingAngle * 5 / 2);
    const topRingHeight = radius * Math.cos(topRingAngle * 5 / 2);

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const v = addVertex(
            topRingRadius * Math.cos(angle),
            topRingHeight,
            topRingRadius * Math.sin(angle)
        );
        topPerimeter.push(v);
    }

    pentagons.push({ center: topCenter, perimeter: topPerimeter });
    console.log(`Top pentagon: center=${topCenter}, perimeter=${topPerimeter.join(',')}`);

    console.log('\n=== STEPS 2-8: Build Bottom Ring (5 Pentagons with SHARED vertices) ===');
    // Each bottom pentagon is a 6-way hub + 5 perimeter vertices
    // CRITICAL: Adjacent pentagons SHARE vertices where they connect

    const bottomPentagons: Pentagon[] = [];

    // First, create shared vertex pools that will be reused
    // Shared V0 vertices: Connect to top pentagon (one per bottom pentagon, but positioned at LONG distance)
    const sharedV0Vertices: number[] = [];
    for (let i = 0; i < 5; i++) {
        const topV = vertices[topPerimeter[i]];
        const baseAngle = (i * 2 * Math.PI) / 5;

        // Position V0 at LONG_LENGTH distance below top pentagon vertex
        const v0Dist = radius * 0.85;
        const v0Height = topV.y - LONG_LENGTH * 0.5;
        const v0Idx = addVertex(
            v0Dist * Math.cos(baseAngle),
            v0Height,
            v0Dist * Math.sin(baseAngle)
        );
        sharedV0Vertices.push(v0Idx);
    }

    // Shared V1/V4 vertices: Between adjacent pentagons in the ring
    // Pentagon i's V1 = Pentagon (i-1)'s V4
    const sharedRingVertices: number[] = [];
    for (let i = 0; i < 5; i++) {
        const angleOffset = (i * 2 * Math.PI / 5) - (2 * Math.PI / 10); // Between pentagons
        const ringDist = radius * 0.95;
        const ringHeight = radius * 0.35;
        const vIdx = addVertex(
            ringDist * Math.cos(angleOffset),
            ringHeight,
            ringDist * Math.sin(angleOffset)
        );
        sharedRingVertices.push(vIdx);
    }

    // Now create bottom pentagons using shared vertices
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;

        // Position center vertex: 6-way hub in the bottom ring
        const centerDist = radius * 0.80;
        const centerHeight = radius * 0.50;
        const centerIdx = addVertex(
            centerDist * Math.cos(baseAngle),
            centerHeight,
            centerDist * Math.sin(baseAngle)
        );

        // Build perimeter using SHARED vertices where appropriate
        const perimeter: number[] = [];

        // V0: SHARED - connects to top pentagon
        perimeter[0] = sharedV0Vertices[i];

        // V1: SHARED with next pentagon's V4
        perimeter[1] = sharedRingVertices[i];

        // V2: Unique vertex at ground level
        const v2Angle = baseAngle - (2 * Math.PI / 5) * 0.8;
        perimeter[2] = addVertex(
            radius * Math.cos(v2Angle),
            0, // Ground level
            radius * Math.sin(v2Angle)
        );

        // V3: Unique vertex
        const v3Angle = baseAngle - (2 * Math.PI / 5) * 1.2;
        perimeter[3] = addVertex(
            radius * 0.95 * Math.cos(v3Angle),
            radius * 0.25,
            radius * 0.95 * Math.sin(v3Angle)
        );

        // V4: SHARED with previous pentagon's V1
        const prevIdx = (i - 1 + 5) % 5;
        perimeter[4] = sharedRingVertices[prevIdx];

        bottomPentagons.push({ center: centerIdx, perimeter });
        pentagons.push({ center: centerIdx, perimeter });
    }

    console.log(`Created ${pentagons.length} pentagons total (1 apex + 5 bottom ring)`);

    // Build edges from pentagon structure
    const edges: [number, number, 'SHORT' | 'LONG'][] = [];

    const addEdge = (v1: number, v2: number, type: 'SHORT' | 'LONG') => {
        const key = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
        if (!edges.some(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}` === key)) {
            edges.push([v1, v2, type]);
        }
    };

    // Top pentagon edges (all SHORT)
    const topPent = pentagons[0];
    for (let i = 0; i < 5; i++) {
        addEdge(topPent.center, topPent.perimeter[i], 'SHORT');
        addEdge(topPent.perimeter[i], topPent.perimeter[(i + 1) % 5], 'SHORT');
    }

    // Bottom pentagon edges
    for (let i = 1; i < pentagons.length; i++) {
        const pent = pentagons[i];
        // Hub to perimeter (SHORT)
        for (let j = 0; j < 5; j++) {
            addEdge(pent.center, pent.perimeter[j], 'SHORT');
        }
        // Perimeter edges (mix of SHORT and LONG)
        for (let j = 0; j < 5; j++) {
            addEdge(pent.perimeter[j], pent.perimeter[(j + 1) % 5], 'SHORT');
        }
    }

    // Connect bottom pentagons to top pentagon (LONG edges)
    for (let i = 0; i < 5; i++) {
        addEdge(topPerimeter[i], bottomPentagons[i].perimeter[0], 'LONG');
    }

    // Connect adjacent bottom pentagons (V1 to neighbor's V4)
    for (let i = 0; i < 5; i++) {
        const counterClockwise = (i - 1 + 5) % 5;
        addEdge(
            bottomPentagons[i].perimeter[1],
            bottomPentagons[counterClockwise].perimeter[4],
            'LONG'
        );
    }

    console.log('\n=== VERIFICATION: Checking Method 10 Constraints ===');

    // Constraint 1: No pentagon center touches any other pentagon's points
    let constraint1Pass = true;
    for (let i = 0; i < pentagons.length; i++) {
        const centerIdx = pentagons[i].center;
        for (let j = 0; j < pentagons.length; j++) {
            if (i === j) continue;
            // Check if this center is in another pentagon's perimeter
            if (pentagons[j].perimeter.includes(centerIdx)) {
                console.error(`❌ Pentagon ${i} center (vertex ${centerIdx}) is in Pentagon ${j}'s perimeter!`);
                constraint1Pass = false;
            }
        }
    }
    console.log(`Constraint 1 (isolated centers): ${constraint1Pass ? '✓ PASS' : '✗ FAIL'}`);

    // Constraint 2 & 3: Edge lengths
    const shortEdges = edges.filter(([, , type]) => type === 'SHORT');
    const longEdges = edges.filter(([, , type]) => type === 'LONG');

    const shortLengths = shortEdges.map(([v1, v2]) =>
        vertices[v1].distanceTo(vertices[v2]));
    const longLengths = longEdges.map(([v1, v2]) =>
        vertices[v1].distanceTo(vertices[v2]));

    const constraint2Pass = shortLengths.every(len =>
        Math.abs(len - SHORT_LENGTH) < tolerance);
    const constraint3Pass = longLengths.every(len =>
        Math.abs(len - LONG_LENGTH) < tolerance);

    if (!constraint2Pass) {
        console.error(`❌ SHORT edge lengths: min=${Math.min(...shortLengths).toFixed(3)}, max=${Math.max(...shortLengths).toFixed(3)}, target=${SHORT_LENGTH}`);
    }
    if (!constraint3Pass) {
        console.error(`❌ LONG edge lengths: min=${Math.min(...longLengths).toFixed(3)}, max=${Math.max(...longLengths).toFixed(3)}, target=${LONG_LENGTH}`);
    }

    console.log(`Constraint 2 (SHORT edges = ${SHORT_LENGTH}): ${constraint2Pass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Constraint 3 (LONG edges = ${LONG_LENGTH}): ${constraint3Pass ? '✓ PASS' : '✗ FAIL'}`);

    // Constraint 5: Pentagon centers further from origin than perimeter
    let constraint5Pass = true;
    const origin = new THREE.Vector3(0, 0, 0);
    pentagons.forEach((pent, idx) => {
        const centerDist = vertices[pent.center].distanceTo(origin);
        pent.perimeter.forEach((vIdx, pIdx) => {
            const perimDist = vertices[vIdx].distanceTo(origin);
            if (centerDist <= perimDist) {
                console.error(`❌ Pentagon ${idx} center dist ${centerDist.toFixed(3)} <= perimeter[${pIdx}] dist ${perimDist.toFixed(3)}`);
                constraint5Pass = false;
            }
        });
    });
    console.log(`Constraint 5 (center further than perimeter): ${constraint5Pass ? '✓ PASS' : '✗ FAIL'}`);

    // Build faces from edges
    const faces: number[][] = [];
    const edgeSet = new Set(edges.map(([v1, v2]) => `${Math.min(v1, v2)}-${Math.max(v1, v2)}`));

    const hasEdge = (v1: number, v2: number) =>
        edgeSet.has(`${Math.min(v1, v2)}-${Math.max(v1, v2)}`);

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

    console.log(`Method 11: ${vertices.length} vertices, ${edges.length} edges, ${faces.length} faces`);
    console.log(`Edge counts: ${shortEdges.length} SHORT (target: 30), ${longEdges.length} LONG (target: 35)`);

    return { vertices, faces };
}
