import * as THREE from 'three';
import { GeodesicData } from './types';

// Method 9: Build from design plan view - 30 pentagons with raised centers
// Based on design-plan-view.png: flattened pentagon layout with raised centers forming hemisphere
// 30 pentagons, 65 edges (30 SHORT, 35 LONG)
export default function create2VGeodesicDomeMethod9(radius: number): GeodesicData {
    console.log('Creating Method 9 - Pentagon layout from design plan view...');

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

    // Pentagon structure: center vertex + 5 perimeter vertices
    // When center is raised, forms a pyramid-like shape
    interface Pentagon {
        center: number;      // Center vertex (raised)
        perimeter: number[]; // 5 vertices around the edge
    }

    const pentagons: Pentagon[] = [];

    // From design plan view, we have:
    // - 1 pentagon at top (apex)
    // - 5 pentagons in ring 1
    // - 10 pentagons in ring 2
    // - 14 pentagons at base ring 3
    // Total: 30 pentagons

    // TOP PENTAGON (1 pentagon at apex)
    const apexCenter = addVertex(0, radius, 0);
    const apexPerimeter: number[] = [];
    const apexRingRadius = radius * 0.35;
    const apexRingHeight = radius * 0.93;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const v = addVertex(
            apexRingRadius * Math.cos(angle),
            apexRingHeight,
            apexRingRadius * Math.sin(angle)
        );
        apexPerimeter.push(v);
        addEdge(apexCenter, v, 'SHORT'); // 5 edges from center to perimeter
    }

    // Pentagon perimeter edges (5 SHORT edges around the pentagon)
    for (let i = 0; i < 5; i++) {
        addEdge(apexPerimeter[i], apexPerimeter[(i + 1) % 5], 'SHORT');
    }

    pentagons.push({ center: apexCenter, perimeter: apexPerimeter });

    // RING 1: 5 pentagons surrounding the apex
    const ring1Pentagons: Pentagon[] = [];
    const ring1Height = radius * 0.75;
    const ring1Radius = radius * 0.65;
    const ring1CenterHeight = radius * 0.82; // Centers raised above ring

    for (let i = 0; i < 5; i++) {
        const baseAngle = (i * 2 * Math.PI) / 5;
        const center = addVertex(
            ring1Radius * Math.cos(baseAngle),
            ring1CenterHeight,
            ring1Radius * Math.sin(baseAngle)
        );

        const perimeter: number[] = [];

        // Pentagon vertices: share edges with apex pentagon and adjacent ring1 pentagons
        // Vertex 0: shared with apex perimeter
        perimeter[0] = apexPerimeter[i];

        // Vertex 1: shared with next apex perimeter vertex
        perimeter[1] = apexPerimeter[(i + 1) % 5];

        // Vertices 2, 3, 4: new vertices forming the outer edge
        const outerRadius = radius * 0.90;
        const outerHeight = radius * 0.60;

        for (let j = 0; j < 3; j++) {
            const vertexAngle = baseAngle + (j - 1) * Math.PI / 7;
            const v = addVertex(
                outerRadius * Math.cos(vertexAngle),
                outerHeight,
                outerRadius * Math.sin(vertexAngle)
            );
            perimeter[2 + j] = v;
        }

        // Edges from center to perimeter
        for (let j = 0; j < 5; j++) {
            addEdge(center, perimeter[j], 'SHORT');
        }

        // Pentagon perimeter edges
        for (let j = 0; j < 5; j++) {
            const edgeType: 'SHORT' | 'LONG' = (j < 2) ? 'LONG' : 'SHORT';
            addEdge(perimeter[j], perimeter[(j + 1) % 5], edgeType);
        }

        ring1Pentagons.push({ center, perimeter });
    }
    pentagons.push(...ring1Pentagons);

    // RING 2: 10 pentagons in middle ring
    const ring2Pentagons: Pentagon[] = [];
    const ring2Height = radius * 0.45;
    const ring2Radius = radius * 1.0;
    const ring2CenterHeight = radius * 0.52;

    for (let i = 0; i < 10; i++) {
        const baseAngle = (i * 2 * Math.PI) / 10;
        const center = addVertex(
            ring2Radius * Math.cos(baseAngle),
            ring2CenterHeight,
            ring2Radius * Math.sin(baseAngle)
        );

        const perimeter: number[] = [];

        // Share vertices with ring1 pentagons where applicable
        const ring1Index = Math.floor(i / 2);
        const isEven = i % 2 === 0;

        if (isEven) {
            perimeter[0] = ring1Pentagons[ring1Index].perimeter[3];
            perimeter[1] = ring1Pentagons[ring1Index].perimeter[4];
        } else {
            perimeter[0] = ring1Pentagons[ring1Index].perimeter[4];
            perimeter[1] = ring1Pentagons[(ring1Index + 1) % 5].perimeter[2];
        }

        // Create remaining vertices
        for (let j = 0; j < 3; j++) {
            const vertexAngle = baseAngle + (j - 1) * Math.PI / 12;
            const outerRadius = radius * 1.05;
            const outerHeight = radius * 0.30;
            const v = addVertex(
                outerRadius * Math.cos(vertexAngle),
                outerHeight,
                outerRadius * Math.sin(vertexAngle)
            );
            perimeter[2 + j] = v;
        }

        // Edges from center to perimeter
        for (let j = 0; j < 5; j++) {
            addEdge(center, perimeter[j], 'SHORT');
        }

        // Pentagon perimeter edges
        for (let j = 0; j < 5; j++) {
            addEdge(perimeter[j], perimeter[(j + 1) % 5], 'SHORT');
        }

        ring2Pentagons.push({ center, perimeter });
    }
    pentagons.push(...ring2Pentagons);

    // RING 3 (BASE): 14 pentagons at base
    const ring3Pentagons: Pentagon[] = [];
    const ring3Height = radius * 0.15;
    const ring3Radius = radius * 1.10;
    const ring3CenterHeight = radius * 0.22;

    for (let i = 0; i < 14; i++) {
        const baseAngle = (i * 2 * Math.PI) / 14;
        const center = addVertex(
            ring3Radius * Math.cos(baseAngle),
            ring3CenterHeight,
            ring3Radius * Math.sin(baseAngle)
        );

        const perimeter: number[] = [];

        // Share vertices with ring2 pentagons
        const ring2Index = Math.floor(i * 10 / 14);

        // Simplified vertex sharing
        if (i % 2 === 0) {
            const r2idx = Math.floor(i * 5 / 7);
            if (r2idx < 10) {
                perimeter[0] = ring2Pentagons[r2idx].perimeter[3];
                perimeter[1] = ring2Pentagons[r2idx].perimeter[4];
            }
        }

        // Create new vertices for the rest
        for (let j = (perimeter[0] !== undefined && perimeter[1] !== undefined ? 2 : 0); j < 5; j++) {
            const vertexAngle = baseAngle + (j - 2) * Math.PI / 16;
            const baseRadius = radius * 1.15;
            const baseHeight = 0;
            const v = addVertex(
                baseRadius * Math.cos(vertexAngle),
                baseHeight,
                baseRadius * Math.sin(vertexAngle)
            );
            perimeter[j] = v;
        }

        // Fill in any undefined vertices
        for (let j = 0; j < 5; j++) {
            if (perimeter[j] === undefined) {
                const vertexAngle = baseAngle + (j - 2) * Math.PI / 16;
                const baseRadius = radius * 1.15;
                const baseHeight = 0;
                perimeter[j] = addVertex(
                    baseRadius * Math.cos(vertexAngle),
                    baseHeight,
                    baseRadius * Math.sin(vertexAngle)
                );
            }
        }

        // Edges from center to perimeter
        for (let j = 0; j < 5; j++) {
            addEdge(center, perimeter[j], 'SHORT');
        }

        // Pentagon perimeter edges - use LONG edges at base
        for (let j = 0; j < 5; j++) {
            const edgeType: 'SHORT' | 'LONG' = (j >= 3) ? 'LONG' : 'SHORT';
            addEdge(perimeter[j], perimeter[(j + 1) % 5], edgeType);
        }

        ring3Pentagons.push({ center, perimeter });
    }
    pentagons.push(...ring3Pentagons);

    // Count edges
    const shortCount = edges.filter(([, , type]) => type === 'SHORT').length;
    const longCount = edges.filter(([, , type]) => type === 'LONG').length;

    console.log(`Method 9: ${pentagons.length} pentagons, ${vertices.length} vertices, ${edges.length} edges`);
    console.log(`Method 9 Edges: ${shortCount} SHORT, ${longCount} LONG (target: 30 SHORT + 35 LONG = 65 total)`);

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

    console.log(`Method 9: Generated ${faces.length} triangular faces from edges`);

    return { vertices, faces };
}
