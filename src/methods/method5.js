import * as THREE from 'three';
// Method 5: V2 Geodesic dome - implementing only pentagonal star to verify geometry
export default function create2VGeodesicDomeMethod5(radius) {
    console.log('Creating Method 5 - Pentagonal star only with correct geometry...');
    const vertices = [];
    const faces = [];
    // Edge lengths from your example: short=124mm, long=140mm
    const spokeLength = 124; // short spans (apex to pentagon vertices)
    const edgeLength = 140; // long spans (between pentagon vertices)
    // Step 1: Calculate pentagon radius from edge constraint
    // For regular pentagon: radius = edge_length / (2 × sin(36°))
    const pentagonRadius = edgeLength / (2 * Math.sin(Math.PI / 5));
    console.log(`Pentagon radius: ${pentagonRadius.toFixed(1)}mm (expected: 119.0mm)`);
    // Step 2: Calculate apex height using Pythagorean theorem
    // h² + R² = spoke_length²
    const apexHeight = Math.sqrt(spokeLength * spokeLength - pentagonRadius * pentagonRadius);
    console.log(`Apex height: ${apexHeight.toFixed(1)}mm (expected: 34.9mm)`);
    // Normalize to our coordinate system (scale to radius)
    const scale = radius / 200; // Normalize 200mm span to our radius
    const pentRadiusNorm = pentagonRadius * scale;
    const apexHeightNorm = apexHeight * scale;
    // Step 3: Create pentagon vertices on the ground (y=0)
    const pentagon = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(pentRadiusNorm * Math.cos(angle), 0, // On the ground
        pentRadiusNorm * Math.sin(angle)));
        pentagon.push(vertices.length - 1);
    }
    // Step 4: Create apex vertex at calculated height
    vertices.push(new THREE.Vector3(0, apexHeightNorm, 0));
    const apex = vertices.length - 1;
    console.log(`Created ${vertices.length} vertices: 5 pentagon + 1 apex`);
    // Verify the geometry
    const v1 = vertices[pentagon[0]];
    const v2 = vertices[pentagon[1]];
    const apexVertex = vertices[apex];
    const actualEdge = v1.distanceTo(v2);
    const expectedEdge = edgeLength * scale;
    const actualSpoke = v1.distanceTo(apexVertex);
    const expectedSpoke = spokeLength * scale;
    console.log(`Pentagon edge - Expected: ${expectedEdge.toFixed(3)}, Actual: ${actualEdge.toFixed(3)}`);
    console.log(`Spoke length - Expected: ${expectedSpoke.toFixed(3)}, Actual: ${actualSpoke.toFixed(3)}`);
    // Step 3: Create outer vertices for triangular extensions from pentagon edges
    // "using 10 long spans make 5 triangles from outer edge of the pentagonal star"
    // Each triangle extends outward from a pentagon edge using 2 long spans to a new outer vertex
    const starOuter = [];
    for (let i = 0; i < 5; i++) {
        // Get the pentagon edge vertices
        const pentV1 = vertices[pentagon[i]];
        const pentV2 = vertices[pentagon[(i + 1) % 5]];
        // Calculate midpoint of pentagon edge
        const edgeMidpoint = new THREE.Vector3().addVectors(pentV1, pentV2).multiplyScalar(0.5);
        // Calculate direction pointing outward from pentagon center through edge midpoint
        const centerToPentagon = new THREE.Vector3(0, 0, 0); // Pentagon center at origin in XZ plane
        const outwardDirection = new THREE.Vector3().subVectors(edgeMidpoint, centerToPentagon).normalize();
        // For an equilateral triangle with base = edgeLength, the height extends outward
        // Height of equilateral triangle = edge * √3/2
        const triangleHeight = (edgeLength * scale) * Math.sqrt(3) / 2;
        // Position the outer vertex at triangle height distance outward from edge midpoint
        // Lower the height to ensure Step 3 triangles are clearly below pentagon triangles in logical numbering
        const outerVertex = edgeMidpoint.clone().add(outwardDirection.multiplyScalar(triangleHeight));
        outerVertex.y = outerVertex.y - 0.3 * apexHeightNorm; // Lower Step 3 vertices significantly
        vertices.push(outerVertex);
        starOuter.push(vertices.length - 1);
        // Verify the triangle edge lengths - should be equilateral (long, long, long)
        const dist1 = pentV1.distanceTo(outerVertex); // Pentagon vertex to outer vertex
        const dist2 = pentV2.distanceTo(outerVertex); // Pentagon vertex to outer vertex
        const dist3 = pentV1.distanceTo(pentV2); // Pentagon edge (already verified above)
        const expectedLong = edgeLength * scale;
        // Step 3 triangles will be face numbers 6-10 (after the 5 pentagon triangles)
        const step3FaceNumber = i + 6;
        console.log(`Step 3 face ${step3FaceNumber}: edges ${dist1.toFixed(3)}, ${dist2.toFixed(3)}, ${dist3.toFixed(3)} (expected: ${expectedLong.toFixed(3)})`);
        // Check if truly equilateral
        const tolerance = 0.001;
        const isEquilateral = Math.abs(dist1 - expectedLong) < tolerance &&
            Math.abs(dist2 - expectedLong) < tolerance &&
            Math.abs(dist3 - expectedLong) < tolerance;
        console.log(`Step 3 face ${step3FaceNumber}: ${isEquilateral ? 'EQUILATERAL ✓' : 'NOT EQUILATERAL ✗'}`);
    }
    console.log(`Step 3: Added ${starOuter.length} outer vertices extending from pentagon edges`);
    // Create faces for Steps 1&2 (pentagonal star - 5 triangles)
    // These should be faces 1,2,3,4,5
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        const pentagonFaceNumber = i + 1;
        console.log(`Pentagon face ${pentagonFaceNumber}: apex to pentagon vertices ${pentagon[i]} and ${pentagon[next]}`);
        // Triangle: apex to two adjacent pentagon vertices (short, short, long)
        faces.push([apex, pentagon[i], pentagon[next]]);
    }
    // Create faces for Step 3 (outer triangles - 5 triangles)
    // These should be faces 6,7,8,9,10
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        const step3FaceNumber = i + 6;
        console.log(`Step 3 face ${step3FaceNumber}: pentagon vertices ${pentagon[i]}, ${pentagon[next]} to outer vertex ${starOuter[i]}`);
        // Triangle: two adjacent pentagon vertices to outer vertex (long, long, long)
        faces.push([pentagon[i], pentagon[next], starOuter[i]]);
    }
    // Step 4: Add new vertices below pentagon level using short spans from Step 3 triangle edges
    // Step 5: Create isosceles triangles with 2 short edges and 1 long edge (from Step 3)
    console.log(`Step 4-5: Adding middle level vertices using Pythagorean theorem...`);
    const middleLevelVertices = [];
    for (let i = 0; i < 5; i++) {
        // Get the edge from Step 3 triangles (long edge between pentagon vertices)
        const pentV1 = vertices[pentagon[i]];
        const pentV2 = vertices[pentagon[(i + 1) % 5]];
        const edgeMidpoint = new THREE.Vector3().addVectors(pentV1, pentV2).multiplyScalar(0.5);
        // For isosceles triangle: 2 short spans from pentagon vertices to new vertex
        // The long edge is the existing pentagon edge
        // Use Pythagorean theorem to find the height below the edge midpoint
        const longEdgeLength = edgeLength * scale; // Pentagon edge length
        const shortSpanLength = spokeLength * scale; // Short span length
        // For isosceles triangle with base = longEdgeLength and equal sides = shortSpanLength
        // Height from base to apex: h = sqrt(shortSpan² - (longEdge/2)²)
        const halfBase = longEdgeLength / 2;
        const triangleHeight = Math.sqrt(shortSpanLength * shortSpanLength - halfBase * halfBase);
        console.log(`Step 4-5 triangle ${i + 1}: short spans = ${shortSpanLength.toFixed(3)}, long base = ${longEdgeLength.toFixed(3)}, calculated height = ${triangleHeight.toFixed(3)}`);
        // Position new vertex BELOW the pentagon edge midpoint to form dome shape
        // Calculate outward direction from pentagon center through edge midpoint
        const centerToPentagon = new THREE.Vector3(0, 0, 0); // Pentagon center at origin in XZ plane
        const outwardDirection = new THREE.Vector3().subVectors(edgeMidpoint, centerToPentagon).normalize();
        // Move outward by triangle height and DOWN to create dome curvature
        const newVertex = edgeMidpoint.clone().add(outwardDirection.multiplyScalar(triangleHeight));
        newVertex.y = edgeMidpoint.y - triangleHeight * 0.8; // Lower the vertex to create dome curvature
        vertices.push(newVertex);
        middleLevelVertices.push(vertices.length - 1);
        console.log(`Step 4-5: Added middle vertex ${vertices.length - 1} below pentagon edge ${i}-${(i + 1) % 5}`);
        // Verify the isosceles triangle edge lengths
        const dist1 = pentV1.distanceTo(newVertex); // Should be short span
        const dist2 = pentV2.distanceTo(newVertex); // Should be short span
        const dist3 = pentV1.distanceTo(pentV2); // Long edge (already verified)
        console.log(`Step 4-5 triangle ${i + 1}: edges ${dist1.toFixed(3)}, ${dist2.toFixed(3)}, ${dist3.toFixed(3)} (expected: ${shortSpanLength.toFixed(3)}, ${shortSpanLength.toFixed(3)}, ${longEdgeLength.toFixed(3)})`);
        // Check if isosceles
        const tolerance = 0.001;
        const isIsosceles = Math.abs(dist1 - shortSpanLength) < tolerance &&
            Math.abs(dist2 - shortSpanLength) < tolerance &&
            Math.abs(dist3 - longEdgeLength) < tolerance;
        console.log(`Step 4-5 triangle ${i + 1}: ${isIsosceles ? 'ISOSCELES (short,short,long) ✓' : 'NOT ISOSCELES ✗'}`);
    }
    // Create the isosceles triangles from Steps 4-5
    for (let i = 0; i < 5; i++) {
        const pentV1 = pentagon[i];
        const pentV2 = pentagon[(i + 1) % 5];
        const middleVertex = middleLevelVertices[i];
        // Create isosceles triangle: pentagon vertex 1 - pentagon vertex 2 - middle vertex
        // This triangle has 2 short edges and 1 long edge (the pentagon edge)
        faces.push([pentV1, pentV2, middleVertex]);
        console.log(`Step 4-5: Created isosceles triangle face with vertices ${pentV1}, ${pentV2}, ${middleVertex}`);
    }
    console.log(`Method 5: Created ${faces.length} faces (Steps 1-5 complete)`);
    console.log(`Method 5: Steps 1-5 complete - pentagon star + middle level isosceles triangles`);
    console.log(`Method 5: Total vertices: ${vertices.length} (1 apex + 5 pentagon + 5 star outer + 5 middle = 16)`);
    return { vertices, faces };
}
