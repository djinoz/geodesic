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
    // Pentagons SHARE perimeter vertices where they meet

    const bottomCenters: number[] = [];
    const bottomPerimeters: number[][] = [];

    // First, create shared vertex pool that will be used by adjacent pentagons
    // We need vertices for:
    // - V0 vertices (5 total, one per pentagon, connects to top)
    // - Shared vertices between adjacent pentagons (5 total, shared as V1/V4 pairs)

    const sharedV0Vertices: number[] = []; // Uppermost vertices, one per pentagon
    const sharedRingVertices: number[] = []; // Vertices between adjacent pentagons

    // Create V0 vertices (uppermost, connects to top pentagon)
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;
        const centerR = radius * 0.80;
        const centerH = radius * 0.40;

        // V0 is radially outward from center, elevated
        const v0R = (centerR + 0.4);
        const v0H = centerH + 0.5;
        sharedV0Vertices.push(addVertex(
            v0R * Math.cos(baseAngle),
            v0H,
            v0R * Math.sin(baseAngle)
        ));
    }

    // Create shared vertices between adjacent pentagons
    // These will be used as V1 of pentagon i and V4 of pentagon i-1
    for (let i = 0; i < 5; i++) {
        const angleClockwise = (i * 2 * Math.PI / 5) - (2 * Math.PI / 5) * 0.4; // Between pentagon i and i+1
        const centerR = radius * 0.80;
        const centerH = radius * 0.40;

        const vR = (centerR + 0.45);
        const vH = centerH;
        sharedRingVertices.push(addVertex(
            vR * Math.cos(angleClockwise),
            vH,
            vR * Math.sin(angleClockwise)
        ));
    }

    // Now create pentagons using shared vertices where appropriate
    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;

        // Calculate center position
        const centerH = radius * 0.40;
        const centerR = radius * 0.80;
        const centerX = centerR * Math.cos(baseAngle);
        const centerZ = centerR * Math.sin(baseAngle);
        const center = addVertex(centerX, centerH, centerZ);
        bottomCenters.push(center);

        // Create perimeter using shared vertices and unique vertices
        const perimeter: number[] = [];

        // V0: Shared uppermost vertex (connects to top pentagon)
        perimeter[0] = sharedV0Vertices[i];

        // V1: Shared with next clockwise neighbor's V4
        const clockwiseNeighborIdx = (i + 1) % 5;
        perimeter[1] = sharedRingVertices[i];

        // V2: Unique vertex at bottom (ground level)
        const v2Angle = baseAngle - (2 * Math.PI / 5) * 0.8;
        perimeter[2] = addVertex(
            (centerR + 0.5) * Math.cos(v2Angle),
            0, // Ground level
            (centerR + 0.5) * Math.sin(v2Angle)
        );

        // V3: Unique vertex
        const v3Angle = baseAngle - (2 * Math.PI / 5) * 1.2;
        perimeter[3] = addVertex(
            (centerR + 0.45) * Math.cos(v3Angle),
            centerH,
            (centerR + 0.45) * Math.sin(v3Angle)
        );

        // V4: Shared with previous counter-clockwise neighbor's V1
        const counterClockwiseNeighborIdx = (i - 1 + 5) % 5;
        perimeter[4] = sharedRingVertices[counterClockwiseNeighborIdx];

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
    console.log('\n=== VERIFICATION: Inter-Pentagon Connections ===');
    for (let i = 0; i < 5; i++) {
        // RULE: Each bottom pentagon's Vertex 0 (uppermost) connects to one and only one vertex of the top pentagon
        // Top pentagon vertex i connects to bottom pentagon i's vertex 0
        const topV = topPerimeter[i];
        const bottomV0 = bottomPerimeters[i][0];
        const distTopToBottom = vertices[topV].distanceTo(vertices[bottomV0]);
        console.log(`Bottom Pentagon ${i} V0 (vertex ${bottomV0}) -> Top Pentagon V${i} (vertex ${topV}) | distance=${distTopToBottom.toFixed(3)}`);
        addEdge(topV, bottomV0, 'LONG');

        // RULE: Each bottom pentagon's Vertex 1 connects to Vertex 4 of its counter-clockwise neighbor
        // Counter-clockwise neighbor in the ring is (i - 1 + 5) % 5
        const counterClockwiseNeighbor = (i - 1 + 5) % 5;
        const thisV1 = bottomPerimeters[i][1];
        const neighborV4 = bottomPerimeters[counterClockwiseNeighbor][4];
        const distV1ToV4 = vertices[thisV1].distanceTo(vertices[neighborV4]);
        console.log(`Bottom Pentagon ${i} V1 (vertex ${thisV1}) -> Pentagon ${counterClockwiseNeighbor} V4 (vertex ${neighborV4}) | distance=${distV1ToV4.toFixed(3)}`);
        addEdge(thisV1, neighborV4, 'LONG');
    }

    // Verify which pentagons share vertices
    console.log('\n=== VERIFICATION: Shared Vertices Between Pentagons ===');
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const vIdx = bottomPerimeters[i][j];
            // Check if this vertex appears in any other pentagon
            for (let k = 0; k < 5; k++) {
                if (k === i) continue;
                for (let m = 0; m < 5; m++) {
                    if (bottomPerimeters[k][m] === vIdx) {
                        console.log(`Pentagon ${i} V${j} (vertex ${vIdx}) is SHARED with Pentagon ${k} V${m}`);
                    }
                }
            }
        }
    }

    // Verify pentagon perimeter vertex assignments and clockwise ordering
    console.log('\n=== VERIFICATION: Pentagon Perimeter Vertices & Clockwise Order ===');
    for (let i = 0; i < 5; i++) {
        console.log(`Bottom Pentagon ${i} (center at baseAngle=${(i * 2 * Math.PI / 5 * 180 / Math.PI).toFixed(1)}°):`);

        // Get center position for angle calculations
        const centerPos = vertices[bottomCenters[i]];

        for (let j = 0; j < 5; j++) {
            const vIdx = bottomPerimeters[i][j];
            const vPos = vertices[vIdx];

            // Calculate angle from center to this vertex (in XZ plane)
            const dx = vPos.x - centerPos.x;
            const dz = vPos.z - centerPos.z;
            const angleFromCenter = Math.atan2(dz, dx) * 180 / Math.PI;

            // Calculate angle from origin (for reference)
            const angleFromOrigin = Math.atan2(vPos.z, vPos.x) * 180 / Math.PI;

            console.log(`  V${j}: vertex ${vIdx} | pos=(${vPos.x.toFixed(2)}, ${vPos.y.toFixed(2)}, ${vPos.z.toFixed(2)}) | angle from center=${angleFromCenter.toFixed(1)}° | angle from origin=${angleFromOrigin.toFixed(1)}°`);
        }

        // Check if vertices are in clockwise order (decreasing angle when viewed from above)
        const angles = [];
        for (let j = 0; j < 5; j++) {
            const vPos = vertices[bottomPerimeters[i][j]];
            const dx = vPos.x - centerPos.x;
            const dz = vPos.z - centerPos.z;
            angles.push(Math.atan2(dz, dx));
        }

        let isClockwise = true;
        for (let j = 0; j < 5; j++) {
            const nextJ = (j + 1) % 5;
            let angleDiff = angles[j] - angles[nextJ];

            // Normalize to [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Clockwise means angle decreases (negative diff), but we need to account for wrap-around
            if (angleDiff < 0 && Math.abs(angleDiff) < Math.PI) {
                // This is clockwise
            } else if (angleDiff > 0 && angleDiff < Math.PI) {
                isClockwise = false;
                break;
            }
        }

        console.log(`  Order check: ${isClockwise ? '✓ CLOCKWISE' : '✗ NOT CLOCKWISE (counter-clockwise or irregular)'}`);
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
