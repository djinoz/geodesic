import * as THREE from 'three';
import { GeodesicData } from './types';

// Method 10: Pentagon structure - 1 apex pentagon + 5 bottom ring pentagons
// RULES:
// 1. No center vertex of any pentagon touches any other point of any other pentagon
// 2. All SHORT edges are exactly the same length (90mm)
// 3. All LONG edges are exactly the same length (106mm)
// 4. Each bottom pentagon's uppermost vertex connects to one and only one vertex of the top pentagon
//    (one bottom pentagon for each of the top pentagon's 5 vertices)
// 5. Each pentagon's center vertex is further from the hemisphere's nominal center point than any of its perimeter vertices
//    (prevents distortion/inversion)
// 6. All SHORT edges have equal angle relative to the z-plane (horizontal) - ensures uniform pentagon cone shape
export default function create2VGeodesicDomeMethod10(radius: number): GeodesicData {
    console.log('Creating Method 10 - 1 apex pentagon + 5 bottom ring pentagons...');

    // Edge length constraints (from kit specifications)
    const SHORT_LENGTH = 0.90; // 90mm normalized
    const LONG_LENGTH = 1.06;  // 106mm normalized

    // Hemisphere nominal center point (ground level center)
    const hemisphereCenter = new THREE.Vector3(0, 0, 0);

    // Helper function to calculate angle of edge relative to z-plane (horizontal)
    const getZPlaneAngle = (v1: THREE.Vector3, v2: THREE.Vector3): number => {
        const dx = v2.x - v1.x;
        const dy = v2.y - v1.y;
        const dz = v2.z - v1.z;
        const horizontalDist = Math.sqrt(dx * dx + dz * dz);
        return Math.atan2(dy, horizontalDist); // Angle in radians
    };

    const vertices: THREE.Vector3[] = [];
    const edges: [number, number, 'SHORT' | 'LONG'][] = [];

    // Helper to add vertex and return index
    const addVertex = (x: number, y: number, z: number) => {
        vertices.push(new THREE.Vector3(x, y, z));
        return vertices.length - 1;
    };

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

    // Pentagon structure with center vertex + 5 perimeter vertices
    interface Pentagon {
        center: number;
        perimeter: number[];
    }

    const pentagons: Pentagon[] = [];

    // TOP PENTAGON (apex)
    const topCenter = addVertex(0, radius, 0);
    const topPerimeter: number[] = [];

    // Create 5 perimeter vertices around the top center
    const topRingRadius = radius * 0.4;
    const topRingHeight = radius * 0.85;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const v = addVertex(
            topRingRadius * Math.cos(angle),
            topRingHeight,
            topRingRadius * Math.sin(angle)
        );
        topPerimeter.push(v);
    }

    // Top pentagon edges
    // Shorts: center to perimeter (forming the hub) - only within this pentagon
    for (let i = 0; i < 5; i++) {
        addEdge(topCenter, topPerimeter[i], 'SHORT');
    }

    // Shorts: perimeter edges of top pentagon
    for (let i = 0; i < 5; i++) {
        addEdge(topPerimeter[i], topPerimeter[(i + 1) % 5], 'SHORT');
    }

    pentagons.push({ center: topCenter, perimeter: topPerimeter });

    // BOTTOM RING: 5 pentagons
    // Each bottom pentagon has its own center vertex that ONLY connects to its own perimeter
    // Pentagons share perimeter vertices where they meet

    const bottomCenters: number[] = [];
    const bottomPerimeters: number[][] = [];

    // SIMPLIFIED APPROACH: Start with known structure and adjust to fit constraints
    // Build ring of shared vertices first, then position centers

    // Ring 1: Upper ring (connects to top pentagon) - 5 vertices
    const upperRingIndices: number[] = [];
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;
        const topV = vertices[topPerimeter[i]];

        // Position below top pentagon vertices
        const v = topV.clone();
        v.y *= 0.85;
        v.x *= 1.05;
        v.z *= 1.05;

        upperRingIndices.push(addVertex(v.x, v.y, v.z));
    }

    // Ring 2: Mid ring (between adjacent bottom pentagons) - 5 vertices
    const midRingIndices: number[] = [];
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset by 36 degrees
        const h = radius * 0.50;
        const r = radius * 0.75;

        midRingIndices.push(addVertex(
            r * Math.cos(baseAngle),
            h,
            r * Math.sin(baseAngle)
        ));
    }

    // Ring 3: Base ring - 5 vertices at ground level
    const baseRingIndices: number[] = [];
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;
        const h = 0; // Ground level
        const r = radius * 0.85;

        baseRingIndices.push(addVertex(
            r * Math.cos(baseAngle),
            h,
            r * Math.sin(baseAngle)
        ));
    }

    // Now create bottom pentagons with centers and assign perimeter vertices
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;

        // Calculate center position (should be further from origin than all perimeter vertices)
        const centerH = radius * 0.40;
        const centerR = radius * 0.80;
        const center = addVertex(
            centerR * Math.cos(baseAngle),
            centerH,
            centerR * Math.sin(baseAngle)
        );
        bottomCenters.push(center);

        // Assign perimeter vertices for this pentagon
        const perimeter: number[] = [];

        // Vertex 0: from upper ring
        perimeter[0] = upperRingIndices[i];

        // Vertex 1: from mid ring (clockwise)
        perimeter[1] = midRingIndices[i];

        // Vertex 2: from base ring
        perimeter[2] = baseRingIndices[i];

        // Vertex 3: from mid ring (counter-clockwise)
        perimeter[3] = midRingIndices[(i - 1 + 5) % 5];

        // Vertex 4: from upper ring (counter-clockwise) - NO, this would share with neighbor
        // Instead, create a unique vertex between upper[i] and upper[i-1]
        const upperPrev = (i - 1 + 5) % 5;
        const avgAngle = (baseAngle + ((i - 1 + 5) % 5) * 2 * Math.PI / 5) / 2;
        const v4h = radius * 0.70;
        const v4r = radius * 0.65;
        perimeter[4] = addVertex(
            v4r * Math.cos(avgAngle),
            v4h,
            v4r * Math.sin(avgAngle)
        );

        bottomPerimeters.push(perimeter);
    }

    // Add edges for bottom pentagons
    for (let i = 0; i < 5; i++) {
        const center = bottomCenters[i];
        const perimeter = bottomPerimeters[i];

        // CRITICAL: Center only connects to its own perimeter vertices (SHORT edges)
        // This ensures no center touches any point of any other pentagon
        for (let j = 0; j < 5; j++) {
            addEdge(center, perimeter[j], 'SHORT');
        }

        // Pentagon perimeter edges (connecting the 5 perimeter vertices)
        for (let j = 0; j < 5; j++) {
            addEdge(perimeter[j], perimeter[(j + 1) % 5], 'LONG');
        }

        pentagons.push({ center, perimeter });
    }

    // Add LONG edges connecting pentagons to each other (but NOT their centers)
    // These connect perimeter to perimeter only
    for (let i = 0; i < 5; i++) {
        // RULE: Each bottom pentagon's Vertex 0 (uppermost) connects to one and only one vertex of the top pentagon
        // Top pentagon vertex i connects to bottom pentagon i's vertex 0
        addEdge(topPerimeter[i], bottomPerimeters[i][0], 'LONG');

        // RULE: Each bottom pentagon's Vertex 1 connects to Vertex 4 of its counter-clockwise neighbor
        // Counter-clockwise neighbor in the ring is (i - 1 + 5) % 5
        const counterClockwiseNeighbor = (i - 1 + 5) % 5;
        addEdge(bottomPerimeters[i][1], bottomPerimeters[counterClockwiseNeighbor][4], 'LONG');
    }

    // Count edges
    const shortCount = edges.filter(([, , type]) => type === 'SHORT').length;
    const longCount = edges.filter(([, , type]) => type === 'LONG').length;

    // Validate edge lengths
    const tolerance = 0.01;
    const shortEdges = edges.filter(([v1, v2, type]) => type === 'SHORT');
    const longEdges = edges.filter(([v1, v2, type]) => type === 'LONG');

    const shortLengths = shortEdges.map(([v1, v2]) => vertices[v1].distanceTo(vertices[v2]));
    const longLengths = longEdges.map(([v1, v2]) => vertices[v1].distanceTo(vertices[v2]));

    const allShortsEqual = shortLengths.every(len => Math.abs(len - SHORT_LENGTH) < tolerance);
    const allLongsEqual = longLengths.every(len => Math.abs(len - LONG_LENGTH) < tolerance);

    // Validate z-plane angle constraint: all SHORT edges have equal angle
    const shortAngles = shortEdges.map(([v1, v2]) => getZPlaneAngle(vertices[v1], vertices[v2]));
    const avgShortAngle = shortAngles.reduce((a, b) => a + b, 0) / shortAngles.length;
    const angleTolerance = 0.1; // radians (~5.7 degrees)
    const allShortAnglesEqual = shortAngles.every(angle => Math.abs(angle - avgShortAngle) < angleTolerance);

    if (!allShortAnglesEqual) {
        console.warn('SHORT edge angles (degrees):', shortAngles.map(a => (a * 180 / Math.PI).toFixed(2)));
        console.warn('Average angle:', (avgShortAngle * 180 / Math.PI).toFixed(2), 'degrees');
    }

    // Validate shape constraint: pentagon centers further from origin than perimeter vertices
    let shapeConstraintValid = true;
    pentagons.forEach((pentagon, idx) => {
        const centerDist = vertices[pentagon.center].distanceTo(hemisphereCenter);
        pentagon.perimeter.forEach((vIdx, pIdx) => {
            const perimDist = vertices[vIdx].distanceTo(hemisphereCenter);
            if (centerDist <= perimDist) {
                console.warn(`Pentagon ${idx} fails shape constraint: center dist ${centerDist.toFixed(3)} <= perimeter[${pIdx}] dist ${perimDist.toFixed(3)}`);
                shapeConstraintValid = false;
            }
        });
    });

    console.log(`Method 10: ${pentagons.length} pentagons (1 apex + 5 bottom ring)`);
    console.log(`Method 10: ${vertices.length} vertices, ${edges.length} edges`);
    console.log(`Method 10 Edges: ${shortCount} SHORT (90mm), ${longCount} LONG (106mm)`);
    console.log(`Method 10: All SHORT edges equal length: ${allShortsEqual ? '✓' : '✗'}`);
    console.log(`Method 10: All LONG edges equal length: ${allLongsEqual ? '✓' : '✗'}`);
    console.log(`Method 10: All SHORT edges equal z-plane angle: ${allShortAnglesEqual ? '✓' : '✗'} (avg: ${(avgShortAngle * 180 / Math.PI).toFixed(1)}°)`);
    console.log(`Method 10: Shape constraint (center further from origin): ${shapeConstraintValid ? '✓' : '✗'}`);
    console.log(`Method 10: Each pentagon center only connects to its own perimeter (rule enforced)`);
    console.log(`Method 10: Each bottom pentagon's Vertex 0 (uppermost) connects to exactly one top pentagon vertex`);
    console.log(`Method 10: Each bottom pentagon's Vertex 1 connects to Vertex 4 of counter-clockwise neighbor (ring closure rule enforced)`);

    // Build faces from edges for visualization
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

    console.log(`Method 10: Generated ${faces.length} triangular faces from edges`);

    return { vertices, faces };
}
