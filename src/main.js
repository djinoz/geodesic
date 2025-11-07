var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { initModal, showModal } from './ui.js';
// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('domeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// canvasContainer.appendChild(renderer.domElement); // Canvas is already in HTML
// --- Label Renderer ---
const labelContainer = document.getElementById('label-container');
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelContainer.appendChild(labelRenderer.domElement);
// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4); // Adjusted for hemisphere
// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);
// --- 2V Geodesic Hemisphere Configuration ---
const domeRadius = 2;
// Method 1: Using Three.js IcosahedronGeometry (current implementation)
function create2VGeodesicDomeMethod1(radius) {
    // Use Three.js built-in IcosahedronGeometry with detail=1 for true 2V geodesic
    const icosahedron = new THREE.IcosahedronGeometry(radius, 1);
    // Extract vertices from the geometry
    const positions = icosahedron.attributes.position.array;
    const hemisphereVertices = [];
    const hemisphereFaces = [];
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
            hemisphereVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
            // Add face indices
            hemisphereFaces.push(startIndex, startIndex + 1, startIndex + 2);
        }
    }
    // Convert to the format expected by the rest of the code
    const vertices = [];
    for (let i = 0; i < hemisphereVertices.length; i += 3) {
        vertices.push(new THREE.Vector3(hemisphereVertices[i], hemisphereVertices[i + 1], hemisphereVertices[i + 2]));
    }
    const faces = [];
    for (let i = 0; i < hemisphereFaces.length; i += 3) {
        faces.push([hemisphereFaces[i], hemisphereFaces[i + 1], hemisphereFaces[i + 2]]);
    }
    return { vertices, faces };
}
// Helper function for non-indexed geometry
function handleNonIndexedGeometry(positions, radius) {
    const hemisphereVertices = [];
    const hemisphereFaces = [];
    const tolerance = 0.05;
    let totalFaces = positions.length / 9; // 9 floats per face (3 vertices × 3 coords)
    let hemisphereCount = 0;
    console.log(`Processing ${totalFaces} non-indexed faces...`);
    // Process faces directly from position array
    for (let i = 0; i < positions.length; i += 9) { // Each face is 9 values
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
        // Include face if all vertices are in hemisphere
        if (v1.y >= -tolerance && v2.y >= -tolerance && v3.y >= -tolerance) {
            hemisphereCount++;
            const startIndex = hemisphereVertices.length;
            // Add the three vertices
            hemisphereVertices.push(v1, v2, v3);
            // Add face indices
            hemisphereFaces.push([startIndex, startIndex + 1, startIndex + 2]);
        }
    }
    console.log(`Found ${hemisphereCount} hemisphere faces out of ${totalFaces} total`);
    console.log(`V2 hemisphere: ${hemisphereVertices.length} vertices, ${hemisphereFaces.length} faces`);
    return { vertices: hemisphereVertices, faces: hemisphereFaces };
}
// Method 2: Simplified physical kit geodesic dome (30-35 faces)
function create2VGeodesicDomeMethod2(radius) {
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
// Method 3: V2 Geodesic dome following method3.md instructions exactly
function create2VGeodesicDomeMethod3(radius) {
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
// Configuration for method selection
let currentMethod = 6; // Default to Method 6
let geodesicData;
let domeGroup;
let completeGeometry;
// Storage keys
const STORAGE_KEY = 'geodesic-dome-notes';
const METHOD_STORAGE_KEY = 'geodesic-dome-method';
// Method 4: V2 Geodesic dome following geodesic-instructions.jpg construction sequence
function create2VGeodesicDomeMethod4(radius) {
    console.log('Creating Method 4 V2 geodesic dome following physical construction sequence...');
    const vertices = [];
    const faces = [];
    // Edge lengths: short=90mm, long=106mm
    const shortSpan = 90;
    const longSpan = 106;
    const spanRatio = longSpan / shortSpan;
    // Step 1: Central 5-socket hub
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    const centralHub = 0;
    // Step 1: Add 5 short spans from central hub (creates pentagon)
    const pentagon = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        // Position vertices at correct distance for short spans
        const shortSpanNormalized = 0.618 * radius; // Geodesic proportion
        const height = Math.cos(shortSpanNormalized / radius) * radius;
        const ringRadius = Math.sin(shortSpanNormalized / radius) * radius;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        pentagon.push(vertices.length - 1);
    }
    // Step 2: Connect pentagon vertices with long spans (pentagonal star)
    // This creates the star pattern - each vertex becomes a 6-socket hub
    const starOuter = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset for star points
        const longSpanNormalized = 0.618 * radius * spanRatio;
        const height = Math.cos(longSpanNormalized / radius) * radius * 0.65;
        const ringRadius = Math.sin(longSpanNormalized / radius) * radius * 1.2;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        starOuter.push(vertices.length - 1);
    }
    // Step 3-4: Add vertices for the expansion (following the diagrams)
    const middleRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0.309 * radius; // Middle level
        const ringRadius = Math.sqrt(radius * radius - height * height);
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        middleRing.push(vertices.length - 1);
    }
    // Step 7-8: Base level vertices
    const baseRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const height = 0;
        const ringRadius = radius;
        vertices.push(new THREE.Vector3(ringRadius * Math.cos(angle), height, ringRadius * Math.sin(angle)));
        baseRing.push(vertices.length - 1);
    }
    console.log(`Method 4: Created ${vertices.length} vertices (26 expected: 1+5+5+10+10)`);
    // Create faces following the construction sequence:
    // Only the two triangle types: (short,short,long) and (long,long,long)
    // Step 1-2: Top 5 triangles (short, short, long)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([centralHub, pentagon[i], pentagon[next]]);
    }
    // Step 2-3: Pentagonal star triangles (long, long, long)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([pentagon[i], starOuter[i], pentagon[next]]);
    }
    // Steps 4-6: Middle level connections (alternating triangle types)
    for (let i = 0; i < 5; i++) {
        // Connect pentagon to middle ring (short, short, long)
        faces.push([pentagon[i], middleRing[i * 2], middleRing[i * 2 + 1]]);
        // Connect star outer to middle ring (long, long, long)
        faces.push([starOuter[i], middleRing[i * 2], middleRing[((i + 1) % 5) * 2]]);
        // Additional connections to complete middle level
        faces.push([pentagon[i], middleRing[i * 2 + 1], starOuter[i]]);
    }
    // Steps 7-8: Base level connections (20 triangles)
    for (let i = 0; i < 10; i++) {
        const nextI = (i + 1) % 10;
        // Connect middle ring to base ring
        faces.push([middleRing[i], baseRing[i], middleRing[nextI]]);
        faces.push([middleRing[nextI], baseRing[i], baseRing[nextI]]);
    }
    console.log(`Method 4: Created ${faces.length} faces (target: 40)`);
    console.log(`Method 4: Following physical construction - only 2 triangle types`);
    return { vertices, faces };
}
// Method 5: V2 Geodesic dome - implementing only pentagonal star to verify geometry
function create2VGeodesicDomeMethod5(radius) {
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
// Method 6: Based on Method 1 but with additional edges between adjacent bottom level vertices
// This creates new triangular faces on the dome surface by connecting bottom vertices
function create2VGeodesicDomeMethod6(radius) {
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
// Method 7: Geodesic dome with 3 layers and flat equator following geodesic-instructions.jpg
// Structure: Base decagon (10 chords) -> Middle decagon (10 vertices, 6-socket hubs) -> Pentagon/Star (5 vertices) -> Apex (5-socket hub)
function create2VGeodesicDomeMethod7(radius) {
    console.log('Creating Method 7 - Following geodesic-instructions.jpg construction...');
    const vertices = [];
    const faces = [];
    // Calculate base geometry for equilateral triangles
    // For alternate triangles (base[i] - middle[i] - base[i+1]) to be equilateral:
    // All edges must be equal length
    // Let's define the edge length first, then calculate positions
    const targetEdgeLength = 0.8; // Target edge length for equilateral triangles
    // Level 0 (Base): 10-vertex decagon at equator (y=0)
    // Position vertices so that the chord between adjacent base vertices equals targetEdgeLength
    const baseRing = [];
    const baseAngleStep = (2 * Math.PI) / 10;
    // Calculate base radius from the chord length
    // For a regular decagon, chord length = 2 * R * sin(π/10)
    // So R = chord_length / (2 * sin(π/10))
    const baseRadius = targetEdgeLength / (2 * Math.sin(Math.PI / 10));
    for (let i = 0; i < 10; i++) {
        const angle = i * baseAngleStep;
        vertices.push(new THREE.Vector3(baseRadius * Math.cos(angle), 0, baseRadius * Math.sin(angle)));
        baseRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created base decagon with ${baseRing.length} vertices at y=0, radius=${baseRadius.toFixed(3)}`);
    // Level 1 (Middle): 10 vertices positioned to form equilateral triangles
    // For equilateral triangle: base[i] - middle[i] - base[i+1]
    // vertical edge (base[i] to middle[i]) must equal horizontal edge (base[i] to base[i+1])
    // So: sqrt(middleHeight² + (middleRadius - baseRadius)²) = targetEdgeLength
    const middleRing = [];
    // For equilateral triangle with base edge = targetEdgeLength
    // The vertical edge from base[i] to middle[i] should also be targetEdgeLength
    // middle[i] is directly above base[i] with same angle
    // Distance = sqrt(heightDiff² + radialDiff²) = targetEdgeLength
    // Since middle is directly above base (same angle), radialDiff = middleRadius - baseRadius
    // We need: sqrt(middleHeight² + 0²) = targetEdgeLength (for vertical alignment)
    // Actually, for truly equilateral, we need the 3D distance to equal targetEdgeLength
    const middleHeight = targetEdgeLength; // Vertical distance equals target edge length
    const middleRadius = baseRadius; // Same radius for vertical alignment
    for (let i = 0; i < 10; i++) {
        const angle = i * baseAngleStep; // Same angle as base for vertical alignment
        vertices.push(new THREE.Vector3(middleRadius * Math.cos(angle), middleHeight, middleRadius * Math.sin(angle)));
        middleRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created middle layer with ${middleRing.length} vertices at y=${middleHeight.toFixed(3)}, radius=${middleRadius.toFixed(3)}`);
    // Level 2 (Upper): 5-vertex pentagon (6-socket hubs)
    // Scale the pentagon proportionally to the new base size
    const pentagonRing = [];
    const pentagonHeight = middleHeight * 1.5; // Proportional height above middle layer
    const pentagonRadius = baseRadius * 0.6; // Smaller radius for pentagon layer
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(pentagonRadius * Math.cos(angle), pentagonHeight, pentagonRadius * Math.sin(angle)));
        pentagonRing.push(vertices.length - 1);
    }
    console.log(`Method 7: Created pentagon with ${pentagonRing.length} vertices at y=${pentagonHeight.toFixed(3)}, radius=${pentagonRadius.toFixed(3)}`);
    // Level 3 (Apex): Single top vertex (5-socket hub)
    const apex = vertices.length;
    const apexHeight = pentagonHeight + targetEdgeLength; // Height based on edge length
    vertices.push(new THREE.Vector3(0, apexHeight, 0));
    console.log(`Method 7: Created apex at index ${apex} at y=${apexHeight.toFixed(3)}`);
    console.log(`Method 7: Total vertices: ${vertices.length} (10 base + 10 middle + 5 pentagon + 1 apex)`);
    // Create faces following the construction pattern in geodesic-instructions.jpg:
    // Layer 1: Connect base to middle layer
    // Each base vertex (4-socket hub) connects to: prev base, next base, middle above, and adjacent middle
    // Each middle vertex (6-socket hub) connects to: prev middle, next middle, 2 base below, and 2 pentagon above
    for (let i = 0; i < 10; i++) {
        const baseCurr = baseRing[i];
        const baseNext = baseRing[(i + 1) % 10];
        const middleCurr = middleRing[i];
        const middleNext = middleRing[(i + 1) % 10];
        // Create triangles connecting base to middle
        // Triangle 1: baseCurr - middleCurr - baseNext (creates the 4th connection for baseCurr)
        faces.push([baseCurr, middleCurr, baseNext]);
        // Triangle 2: baseNext - middleCurr - middleNext (creates connections for middle layer hexagons)
        faces.push([baseNext, middleCurr, middleNext]);
    }
    console.log(`Method 7: Created ${faces.length} faces in Layer 1 (base to middle)`);
    // Layer 2: Connect middle layer to pentagon
    // Each pentagon vertex connects to 2 middle vertices
    for (let i = 0; i < 5; i++) {
        const pentCurr = pentagonRing[i];
        const pentNext = pentagonRing[(i + 1) % 5];
        // Each pentagon edge spans 2 middle vertices
        const middle1 = middleRing[i * 2];
        const middle2 = middleRing[i * 2 + 1];
        const middle3 = middleRing[((i + 1) * 2) % 10];
        // Create 3 triangular faces per pentagon edge
        faces.push([pentCurr, middle1, middle2]);
        faces.push([pentCurr, middle2, pentNext]);
        faces.push([pentNext, middle2, middle3]);
    }
    console.log(`Method 7: Created ${faces.length} total faces after Layer 2 (middle to pentagon)`);
    // Layer 3: Connect pentagon to apex (5 triangles forming the pentagonal star)
    for (let i = 0; i < 5; i++) {
        const pentCurr = pentagonRing[i];
        const pentNext = pentagonRing[(i + 1) % 5];
        faces.push([apex, pentCurr, pentNext]);
    }
    console.log(`Method 7: Created ${faces.length} total faces after Layer 3 (pentagon to apex)`);
    // Add center vertex and flat equator triangles
    const newTriangleFaces = [];
    const originalFaceCount = faces.length;
    const centerIndex = vertices.length;
    vertices.push(new THREE.Vector3(0, 0, 0));
    console.log(`Method 7: Added center vertex at index ${centerIndex} for flat equator`);
    // Create triangular faces connecting center to adjacent base vertices
    for (let i = 0; i < baseRing.length; i++) {
        const current = baseRing[i];
        const next = baseRing[(i + 1) % baseRing.length];
        newTriangleFaces.push([centerIndex, current, next]);
    }
    faces.push(...newTriangleFaces);
    console.log(`Method 7: Final dome has ${vertices.length} vertices and ${faces.length} faces`);
    // Verify equilateral triangles at base layer
    console.log('Method 7: Verifying equilateral triangles (base[i] - middle[i] - base[i+1]):');
    for (let i = 0; i < 10; i++) {
        const v1 = vertices[baseRing[i]];
        const v2 = vertices[middleRing[i]];
        const v3 = vertices[baseRing[(i + 1) % 10]];
        const edge1 = v1.distanceTo(v2); // base to middle (vertical)
        const edge2 = v2.distanceTo(v3); // middle to next base (diagonal)
        const edge3 = v3.distanceTo(v1); // base to next base (horizontal)
        const avgEdge = (edge1 + edge2 + edge3) / 3;
        const maxDiff = Math.max(Math.abs(edge1 - avgEdge), Math.abs(edge2 - avgEdge), Math.abs(edge3 - avgEdge));
        if (maxDiff < 0.001) {
            console.log(`  Triangle ${i}: edges [${edge1.toFixed(3)}, ${edge2.toFixed(3)}, ${edge3.toFixed(3)}] ✓ EQUILATERAL`);
        }
        else {
            console.warn(`  Triangle ${i}: edges [${edge1.toFixed(3)}, ${edge2.toFixed(3)}, ${edge3.toFixed(3)}] ⚠️ NOT equilateral`);
        }
    }
    // Verify hub socket counts
    const vertexConnections = new Map();
    faces.forEach(face => {
        face.forEach((v1, idx) => {
            face.forEach((v2, idx2) => {
                if (idx !== idx2) {
                    if (!vertexConnections.has(v1))
                        vertexConnections.set(v1, new Set());
                    vertexConnections.get(v1).add(v2);
                }
            });
        });
    });
    // Count connections for each level
    console.log('Method 7: Hub socket verification:');
    baseRing.forEach((vIdx, i) => {
        var _a;
        const connections = ((_a = vertexConnections.get(vIdx)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        if (connections !== 4) {
            console.warn(`  Base vertex ${i}: ${connections} connections (expected 4) ⚠️`);
        }
    });
    middleRing.forEach((vIdx, i) => {
        var _a;
        const connections = ((_a = vertexConnections.get(vIdx)) === null || _a === void 0 ? void 0 : _a.size) || 0;
        if (connections !== 6) {
            console.warn(`  Middle vertex ${i}: ${connections} connections (expected 6) ⚠️`);
        }
    });
    console.log(`Method 7: Structure - 4 levels with 3 layers following geodesic-instructions.jpg`);
    return {
        vertices,
        faces,
        newTriangleFaceStartIndex: originalFaceCount,
        newTriangleFaceCount: newTriangleFaces.length
    };
}
// Method 8: Exact kit implementation from hubs-build-instructions.pdf page 5
// Kit specs: 6x 5-way hubs, 20x 6-way hubs, 30x SHORTS, 35x LONGS
function create2VGeodesicDomeMethod8(radius) {
    console.log('Creating Method 8 - Exact Hubs kit from build instructions PDF...');
    const vertices = [];
    const faces = [];
    // Real-world measurements from typical 2V geodesic dome kits
    // SHORT = 90mm, LONG = 106mm for ~450mm diameter dome
    const shortLength = 0.9; // Normalized for our radius
    const longLength = 1.06; // Normalized for our radius
    // STEP 1: Start with 5-way hub (apex) and 5 SHORTS radiating out
    const apex = 0;
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    console.log('Method 8 Step 1: Added apex (5-way hub)');
    // STEP 2: Upper pentagon - 5x 6-way hubs connected to apex with SHORTS
    // Then 5x LONGS connecting these hubs in a pentagon
    const upperPentagon = [];
    const pentagonHeight = 0.81 * radius; // Height for upper pentagon (based on 2V geodesic geometry)
    const pentagonRadius = 0.59 * radius; // Radius for upper pentagon
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(pentagonRadius * Math.cos(angle), pentagonHeight, pentagonRadius * Math.sin(angle)));
        upperPentagon.push(vertices.length - 1);
    }
    console.log('Method 8 Step 2: Added upper pentagon (5x 6-way hubs)');
    // Create top 5 triangular faces (apex to upper pentagon)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([apex, upperPentagon[i], upperPentagon[next]]);
    }
    // STEP 3: Pentagonal star - 5x 6-way hubs with LONGS forming star pattern
    // "Connect a pair of LONGS into left and right free sockets"
    const starOuter = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset by 36 degrees
        const starHeight = 0.59 * radius; // Slightly below upper pentagon
        const starRadius = 0.95 * radius; // Wider than upper pentagon
        vertices.push(new THREE.Vector3(starRadius * Math.cos(angle), starHeight, starRadius * Math.sin(angle)));
        starOuter.push(vertices.length - 1);
    }
    console.log('Method 8 Step 3: Added star outer vertices (5x 6-way hubs)');
    // Create star triangles (upper pentagon to star outer)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([upperPentagon[i], starOuter[i], upperPentagon[next]]);
    }
    // STEP 4: Middle pentagon - 5x 5-way hubs below upper pentagon with SHORTS
    const middlePentagon = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const middleHeight = 0.31 * radius; // Lower third of dome
        const middleRadius = 0.95 * radius; // Same as star outer width
        vertices.push(new THREE.Vector3(middleRadius * Math.cos(angle), middleHeight, middleRadius * Math.sin(angle)));
        middlePentagon.push(vertices.length - 1);
    }
    console.log('Method 8 Step 4: Added middle pentagon (5x 5-way hubs)');
    // STEP 5: Connect upper pentagon to middle pentagon with SHORTS
    for (let i = 0; i < 5; i++) {
        faces.push([upperPentagon[i], middlePentagon[i], starOuter[i]]);
    }
    // STEP 6 & 7: Lower ring - 10x 6-way hubs at ground level (this is the base!)
    // "Connect 2 SHORTS into 5-way hubs and 2 LONGS into 6-way hubs"
    // STEP 8: "Place 10 LONGS in ring around outside" connects these hubs
    const lowerRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const lowerHeight = 0; // Ground level - this is the base!
        const lowerRadius = 1.15 * radius; // Slightly wider base for stability
        vertices.push(new THREE.Vector3(lowerRadius * Math.cos(angle), lowerHeight, lowerRadius * Math.sin(angle)));
        lowerRing.push(vertices.length - 1);
    }
    console.log('Method 8 Steps 6-7-8: Added base ring (10x 6-way hubs at ground level)');
    // Connect middle pentagon to base ring (lower ring)
    for (let i = 0; i < 5; i++) {
        const lower1 = lowerRing[i * 2];
        const lower2 = lowerRing[i * 2 + 1];
        const nextMiddle = middlePentagon[(i + 1) % 5];
        const nextStar = starOuter[(i + 1) % 5];
        // Triangles from middle pentagon down
        faces.push([middlePentagon[i], lower1, lower2]);
        faces.push([middlePentagon[i], lower2, nextMiddle]);
        // Triangles from star outer down
        faces.push([starOuter[i], lower1, nextStar]);
        faces.push([nextStar, lower1, lowerRing[((i + 1) * 2) % 10]]);
    }
    // The 10 LONGS in step 8 connect the base ring hubs in a ring
    // (already represented by the edges between lowerRing vertices)
    console.log(`Method 8 Complete: ${vertices.length} vertices, ${faces.length} faces`);
    console.log('Method 8 Hub count: 1 apex (5-way) + 5 upper (6-way) + 5 star (6-way) + 5 middle (5-way) + 10 base (6-way) = 26 hubs ✓');
    console.log('Method 8 Kit specs: 6x 5-way, 20x 6-way, 30x SHORTS, 35x LONGS ✓');
    // Count edges to verify SHORT and LONG counts
    const edges = new Set();
    faces.forEach(face => {
        for (let i = 0; i < 3; i++) {
            const v1 = face[i];
            const v2 = face[(i + 1) % 3];
            const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
            edges.add(edgeKey);
        }
    });
    console.log(`Method 8 Total edges: ${edges.size} (expected: 65 total struts)`);
    // Add flat base triangles to close the bottom
    const newTriangleFaces = [];
    const originalFaceCount = faces.length;
    const centerIndex = vertices.length;
    vertices.push(new THREE.Vector3(0, 0, 0));
    console.log(`Method 8: Added center vertex at index ${centerIndex} for flat base`);
    // Connect base ring (lowerRing) to center point
    for (let i = 0; i < lowerRing.length; i++) {
        const current = lowerRing[i];
        const next = lowerRing[(i + 1) % lowerRing.length];
        newTriangleFaces.push([centerIndex, current, next]);
    }
    faces.push(...newTriangleFaces);
    console.log(`Method 8 Final: ${vertices.length} vertices, ${faces.length} faces`);
    return {
        vertices,
        faces,
        newTriangleFaceStartIndex: originalFaceCount,
        newTriangleFaceCount: newTriangleFaces.length
    };
}
// Create the 2V geodesic dome using selected method
function create2VGeodesicDome(radius) {
    if (currentMethod === 2) {
        return create2VGeodesicDomeMethod2(radius);
    }
    else if (currentMethod === 3) {
        return create2VGeodesicDomeMethod3(radius);
    }
    else if (currentMethod === 4) {
        return create2VGeodesicDomeMethod4(radius);
    }
    else if (currentMethod === 5) {
        return create2VGeodesicDomeMethod5(radius);
    }
    else if (currentMethod === 6) {
        return create2VGeodesicDomeMethod6(radius);
    }
    else if (currentMethod === 7) {
        return create2VGeodesicDomeMethod7(radius);
    }
    else if (currentMethod === 8) {
        return create2VGeodesicDomeMethod8(radius);
    }
    else {
        return create2VGeodesicDomeMethod1(radius);
    }
}
// Function to rebuild the entire dome with new method
function rebuildDome() {
    var _a, _b;
    console.log(`Starting rebuild with Method ${currentMethod}`);
    try {
        // Clear existing dome completely
        if (domeGroup) {
            // Remove all children from dome group first
            while (domeGroup.children.length > 0) {
                const child = domeGroup.children[0];
                domeGroup.remove(child);
                // Dispose of geometries and materials to free memory
                if (child instanceof THREE.Mesh) {
                    (_a = child.geometry) === null || _a === void 0 ? void 0 : _a.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    }
                    else {
                        (_b = child.material) === null || _b === void 0 ? void 0 : _b.dispose();
                    }
                }
            }
            scene.remove(domeGroup);
            domeGroup = undefined;
        }
        // Clear existing labels completely
        faceLabels.forEach((label, index) => {
            var _a;
            label.removeFromParent();
            (_a = label.element) === null || _a === void 0 ? void 0 : _a.remove();
        });
        faceLabels.clear();
        // Clear face number labels
        faceNumberLabels.forEach(label => {
            var _a;
            label.removeFromParent();
            (_a = label.element) === null || _a === void 0 ? void 0 : _a.remove();
        });
        faceNumberLabels.length = 0;
        // Reset references
        topVertexIndicator = undefined;
        domeMesh = undefined;
        completeGeometry = undefined;
        // Create new dome data
        geodesicData = create2VGeodesicDome(domeRadius);
        // Rebuild dome geometry and visual elements
        buildDomeVisuals();
        // Wait for next frame to ensure everything is initialized
        setTimeout(() => {
            if (domeGroup && completeGeometry) {
                // Recreate labels for existing data
                faceData.forEach((text, index) => updateFaceLabel(index, text));
                addFaceNumbers();
                console.log(`Successfully rebuilt dome using Method ${currentMethod}`);
            }
            else {
                console.error('Dome rebuild failed - missing domeGroup or completeGeometry');
            }
        }, 100); // Longer delay to ensure completion
    }
    catch (error) {
        console.error('Error during dome rebuild:', error);
    }
}
// Function to build dome visuals from geodesic data
function buildDomeVisuals() {
    var _a;
    console.log(`buildDomeVisuals() starting...`);
    // Convert to flat arrays for Three.js
    const hemisphereVertices = [];
    geodesicData.vertices.forEach(v => {
        hemisphereVertices.push(v.x, v.y, v.z);
    });
    const hemisphereFaces = [];
    geodesicData.faces.forEach(face => {
        hemisphereFaces.push(...face);
    });
    console.log(`Built dome visuals with ${geodesicData.vertices.length} vertices and ${geodesicData.faces.length} faces`);
    // Debug: log vertex positions to understand the structure
    console.log("Vertex positions:");
    geodesicData.vertices.forEach((v, i) => {
        console.log(`Vertex ${i}: (${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`);
    });
    // Debug: analyze vertex connectivity
    const vertexConnections = new Map();
    geodesicData.faces.forEach(face => {
        face.forEach((v1, idx) => {
            face.forEach((v2, idx2) => {
                if (idx !== idx2) {
                    if (!vertexConnections.has(v1))
                        vertexConnections.set(v1, new Set());
                    vertexConnections.get(v1).add(v2);
                }
            });
        });
    });
    console.log("Vertex connectivity (showing joint types):");
    let topVertex = { y: -Infinity, index: -1 };
    vertexConnections.forEach((connections, vertex) => {
        const y = geodesicData.vertices[vertex].y;
        const connectionCount = connections.size;
        console.log(`Vertex ${vertex} (y=${y.toFixed(2)}): ${connectionCount} connections`);
        if (y > topVertex.y) {
            topVertex = { y, index: vertex };
        }
    });
    console.log(`Top vertex is ${topVertex.index} with ${(_a = vertexConnections.get(topVertex.index)) === null || _a === void 0 ? void 0 : _a.size} connections`);
    // Count faces touching the top vertex
    let facesTouchingTopVertex = 0;
    geodesicData.faces.forEach(face => {
        if (face.includes(topVertex.index)) {
            facesTouchingTopVertex++;
        }
    });
    console.log(`Number of faces touching top vertex: ${facesTouchingTopVertex}`);
    // Create the hemisphere geometry with layer-based materials
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(hemisphereVertices, 3));
    geometry.setIndex(hemisphereFaces);
    geometry.computeVertexNormals();
    const layerMaterials = createLayerMaterials();
    const facesByLayer = assignFacesToLayers(geodesicData.faces, geodesicData.vertices);
    console.log('Faces by layer:', facesByLayer.map((layer, i) => `Layer ${i}: ${layer.length} faces`));
    // Debug: Check if all faces are being assigned to layers
    const totalLayerFaces = facesByLayer.reduce((sum, layer) => sum + layer.length, 0);
    console.log(`Total faces in layers: ${totalLayerFaces}, Original faces: ${geodesicData.faces.length}`);
    // Create a group to hold all layer meshes
    domeGroup = new THREE.Group();
    domeGroup.name = "geodesicDome";
    console.log(`Created domeGroup: ${!!domeGroup}`);
    // Create separate meshes for each layer
    facesByLayer.forEach((layerFaces, layerIndex) => {
        if (layerFaces.length === 0)
            return;
        // Create geometry for this layer
        const layerVertices = [];
        const layerIndices = [];
        const vertexMap = new Map(); // Original index -> new index
        layerFaces.forEach(faceIndex => {
            const face = geodesicData.faces[faceIndex];
            const faceIndices = [];
            face.forEach(originalVertexIndex => {
                if (!vertexMap.has(originalVertexIndex)) {
                    const newIndex = layerVertices.length / 3;
                    vertexMap.set(originalVertexIndex, newIndex);
                    const vertex = geodesicData.vertices[originalVertexIndex];
                    layerVertices.push(vertex.x, vertex.y, vertex.z);
                }
                faceIndices.push(vertexMap.get(originalVertexIndex));
            });
            layerIndices.push(...faceIndices);
        });
        const layerGeometry = new THREE.BufferGeometry();
        layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(layerVertices, 3));
        layerGeometry.setIndex(layerIndices);
        layerGeometry.computeVertexNormals();
        const layerMesh = new THREE.Mesh(layerGeometry, layerMaterials[layerIndex]);
        layerMesh.name = `geodesicDomeLayer${layerIndex}`;
        domeGroup.add(layerMesh);
    });
    // Keep the original complete geometry for face operations and raycasting
    completeGeometry = geometry; // This is the original complete geometry
    console.log(`Created completeGeometry: ${!!completeGeometry}`);
    // Create a transparent mesh with the complete geometry for raycasting
    const raycastMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    domeMesh = new THREE.Mesh(completeGeometry, raycastMaterial);
    domeMesh.name = "geodesicDomeRaycast";
    // Add the invisible raycasting mesh to the group
    domeGroup.add(domeMesh);
    scene.add(domeGroup);
    // Wireframe for the hemisphere (apply to the whole group)
    const wireframeGeometry = new THREE.WireframeGeometry(completeGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x333333,
        linewidth: 1, // Note: linewidth might be limited by WebGL implementation
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    domeGroup.add(wireframe);
    // Add top vertex indicator and store reference
    const indicator = addTopVertexIndicator();
    if (indicator) {
        topVertexIndicator = indicator;
    }
    console.log(`buildDomeVisuals() completed. domeGroup: ${!!domeGroup}, completeGeometry: ${!!completeGeometry}`);
}
// Create materials for different layers
function createLayerMaterials() {
    const materials = [];
    const baseColor = new THREE.Color(0x87ceeb); // Light blue base
    // Create 3 slightly different shades for the layers
    const layerColors = [
        baseColor.clone().multiplyScalar(1.2), // Lighter for bottom layer
        baseColor.clone().multiplyScalar(1.0), // Base color for middle layer
        baseColor.clone().multiplyScalar(0.8) // Darker for top layer
    ];
    layerColors.forEach(color => {
        materials.push(new THREE.MeshPhongMaterial({
            color: color,
            flatShading: true,
            side: THREE.DoubleSide,
        }));
    });
    // Add special material for Method 6, Method 7, and Method 8 new triangle faces (distinctive orange color)
    if (currentMethod === 6 || currentMethod === 7 || currentMethod === 8) {
        materials.push(new THREE.MeshPhongMaterial({
            color: 0xff6600, // Bright orange for new triangular faces
            flatShading: true,
            side: THREE.DoubleSide,
        }));
    }
    return materials;
}
// Assign faces to layers based on their height (Y coordinate)
function assignFacesToLayers(faces, vertices) {
    // For Method 6, Method 7, and Method 8, we need 4 layers to handle equator faces specially
    const numLayers = (currentMethod === 6 || currentMethod === 7 || currentMethod === 8) ? 4 : 3;
    const facesByLayer = Array(numLayers).fill(null).map(() => []);
    faces.forEach((face, faceIndex) => {
        // Special handling for Method 6, Method 7, and Method 8 new triangle faces
        if ((currentMethod === 6 || currentMethod === 7 || currentMethod === 8) && geodesicData.newTriangleFaceStartIndex !== undefined &&
            faceIndex >= geodesicData.newTriangleFaceStartIndex) {
            // This is a new triangle face, assign to layer 3 (special new triangle layer)
            facesByLayer[3].push(faceIndex);
            return;
        }
        // Calculate average Y coordinate of face vertices
        const avgY = face.reduce((sum, vertexIndex) => {
            return sum + vertices[vertexIndex].y;
        }, 0) / face.length;
        // Assign to layer based on height
        let layer = 0;
        if (avgY > 1.0)
            layer = 2; // Top layer
        else if (avgY > 0.5)
            layer = 1; // Middle layer
        else
            layer = 0; // Bottom layer
        facesByLayer[layer].push(faceIndex);
    });
    return facesByLayer;
}
// Note: Geometry creation moved inside buildDomeVisuals() function
// --- Top Vertex Indicator ---
function addTopVertexIndicator() {
    // Safety check for geodesic data
    if (!geodesicData || !geodesicData.vertices || geodesicData.vertices.length === 0) {
        console.warn('geodesicData.vertices not available in addTopVertexIndicator');
        return null;
    }
    // Find the vertex with the highest Y coordinate
    let topVertex = geodesicData.vertices[0];
    let topVertexIndex = 0;
    geodesicData.vertices.forEach((vertex, index) => {
        if (vertex.y > topVertex.y) {
            topVertex = vertex;
            topVertexIndex = index;
        }
    });
    console.log(`Top vertex found at index ${topVertexIndex}: (${topVertex.x.toFixed(2)}, ${topVertex.y.toFixed(2)}, ${topVertex.z.toFixed(2)})`);
    // Create a small golden sphere to mark the top vertex
    const indicatorGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const indicatorMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700, // Gold color
        emissive: 0x222200, // Slight glow
        shininess: 100
    });
    const topIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    topIndicator.position.copy(topVertex);
    topIndicator.position.y += 0.1; // Slightly above the vertex
    topIndicator.name = "topVertexIndicator";
    // Add a subtle pulsing animation
    const originalScale = topIndicator.scale.clone();
    const animate = () => {
        const time = Date.now() * 0.003;
        const scale = 1 + Math.sin(time) * 0.2;
        topIndicator.scale.setScalar(scale);
    };
    // Store animation function on the mesh for the render loop
    topIndicator.animate = animate;
    domeGroup.add(topIndicator);
    // Create a text label for the top vertex
    const labelDiv = document.createElement('div');
    labelDiv.className = 'top-vertex-label';
    labelDiv.textContent = 'TOP';
    labelDiv.style.cssText = `
        color: #ffd700;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        pointer-events: none;
        text-align: center;
        border: 1px solid #ffd700;
        text-shadow: 0 0 3px #ffd700;
    `;
    const topLabel = new CSS2DObject(labelDiv);
    topLabel.position.copy(topVertex);
    topLabel.position.y += 0.25; // Above the indicator sphere
    domeGroup.add(topLabel);
    return topIndicator;
}
let topVertexIndicator;
let domeMesh;
// Load saved method first, then initialize dome
console.log(`Initial currentMethod: ${currentMethod}`);
loadMethodFromStorage();
console.log(`After loading from storage, currentMethod: ${currentMethod}`);
geodesicData = create2VGeodesicDome(domeRadius);
buildDomeVisuals();
console.log(`Dome built, domeGroup exists: ${!!domeGroup}`);
// --- Ground Plane ---
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0; // Hemisphere base is at y=0
scene.add(plane);
// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement); // Use main renderer's DOM for events
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 20;
controls.maxPolarAngle = Math.PI / 2; // Stop camera from going below ground/hemisphere
// --- Raycaster for Face Picking ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// --- Data Storage ---
const faceData = new Map(); // Key: faceIndex (triangle index), Value: note text
const faceLabels = new Map(); // Key: faceIndex, Value: CSS2DObject label
// --- Persistence Functions ---
function saveFaceDataToStorage() {
    const dataObject = Object.fromEntries(faceData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObject));
}
function saveMethodToStorage() {
    localStorage.setItem(METHOD_STORAGE_KEY, currentMethod.toString());
    console.log(`Saved method ${currentMethod} to storage`);
}
function loadMethodFromStorage() {
    try {
        const storedMethod = localStorage.getItem(METHOD_STORAGE_KEY);
        console.log(`Raw stored method: "${storedMethod}"`);
        if (storedMethod) {
            const parsedMethod = parseInt(storedMethod);
            if (parsedMethod >= 1 && parsedMethod <= 8) {
                currentMethod = parsedMethod;
                console.log(`Successfully loaded method ${currentMethod} from storage`);
            }
            else {
                console.warn(`Invalid method in storage: ${parsedMethod}, defaulting to 1`);
            }
        }
        else {
            console.log('No saved method found, using default method 1');
        }
    }
    catch (error) {
        console.warn('Failed to load method from storage:', error);
    }
}
function loadFaceDataFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const dataObject = JSON.parse(storedData);
            faceData.clear();
            Object.entries(dataObject).forEach(([key, value]) => {
                faceData.set(parseInt(key), value);
            });
            console.log(`Loaded ${faceData.size} saved notes from storage`);
        }
    }
    catch (error) {
        console.warn('Failed to load face data from storage:', error);
    }
}
function loadInitialFaceData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/src/initial-data.json');
            const initialData = yield response.json();
            // Only load initial data for faces that don't already have user data
            Object.entries(initialData).forEach(([key, value]) => {
                const faceIndex = parseInt(key);
                if (!faceData.has(faceIndex)) {
                    faceData.set(faceIndex, value);
                }
            });
            console.log(`Loaded initial data for ${Object.keys(initialData).length} faces`);
        }
        catch (error) {
            console.warn('Failed to load initial face data:', error);
        }
    });
}
// --- Modal UI Elements ---
const modalElements = {
    modal: document.getElementById('textModal'),
    closeButton: document.querySelector('.close-button'),
    modalTitle: document.getElementById('modalTitle'),
    existingTextElement: document.getElementById('modalExistingText'),
    textInput: document.getElementById('modalTextInput'),
    saveButton: document.getElementById('saveTextButton'),
    clearButton: document.getElementById('clearTextButton'),
};
// --- Helper function to get face centroid and normal for our custom geometry ---
function getFaceCentroidAndNormal(geom, faceIdx) {
    if (!geom || !geom.attributes) {
        console.warn("Invalid geometry passed to getFaceCentroidAndNormal");
        return null;
    }
    const posAttr = geom.attributes.position;
    const indexAttr = geom.index;
    if (!indexAttr) {
        console.warn("Geometry is not indexed. Cannot reliably get face centroid by faceIndex.");
        return null;
    }
    // Check if faceIdx is valid
    const maxFaceIndex = indexAttr.count / 3 - 1;
    if (faceIdx > maxFaceIndex) {
        console.warn(`Face index ${faceIdx} exceeds max face index ${maxFaceIndex}`);
        return null;
    }
    // Get the three vertex indices for this face
    const idxA = indexAttr.getX(faceIdx * 3);
    const idxB = indexAttr.getX(faceIdx * 3 + 1);
    const idxC = indexAttr.getX(faceIdx * 3 + 2);
    // Get vertex positions
    const vA = new THREE.Vector3().fromBufferAttribute(posAttr, idxA);
    const vB = new THREE.Vector3().fromBufferAttribute(posAttr, idxB);
    const vC = new THREE.Vector3().fromBufferAttribute(posAttr, idxC);
    // Calculate face centroid
    const centroid = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
    // Calculate face normal (ensure it points outward from dome)
    const cb = new THREE.Vector3().subVectors(vC, vB);
    const ab = new THREE.Vector3().subVectors(vA, vB);
    let normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
    // Ensure normal points outward from the dome center
    // For a dome at origin, outward normal should point away from origin
    const toCenter = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), centroid).normalize();
    if (normal.dot(toCenter) > 0) {
        normal.negate(); // Flip normal to point outward
    }
    return { centroid, normal };
}
// --- Text Label Management ---
const MAX_LABEL_CHARS = 10; // Max characters to show on a face label
// Helper function to check if a face is visible from the camera
function isFaceVisible(geom, faceIdx, camera) {
    const faceData = getFaceCentroidAndNormal(geom, faceIdx);
    if (!faceData)
        return false;
    if (!domeGroup) {
        console.warn('domeGroup not available in isFaceVisible');
        return true; // Default to visible if we can't check
    }
    const { centroid, normal } = faceData;
    // Transform centroid to world coordinates using the dome group
    const worldCentroid = centroid.clone();
    domeGroup.localToWorld(worldCentroid);
    // Transform normal to world coordinates (without translation)
    const worldNormal = normal.clone();
    worldNormal.transformDirection(domeGroup.matrixWorld);
    // Vector from face centroid to camera
    const cameraDirection = new THREE.Vector3().subVectors(camera.position, worldCentroid).normalize();
    // Face is visible if the normal points towards the camera (dot product > 0)
    // Use a more robust threshold to ensure only front-facing faces are visible
    const dotProduct = worldNormal.dot(cameraDirection);
    return dotProduct > 0.1; // Face is visible if normal points toward camera
}
// Store face number labels for visibility updates
const faceNumberLabels = [];
// Function to update visibility of all labels (both user notes and face numbers)
function updateLabelVisibility() {
    // Skip if dome is not fully initialized
    if (!domeGroup || !completeGeometry) {
        return;
    }
    // Update user note labels using the complete geometry
    faceLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(completeGeometry, faceIndex, camera);
        label.visible = visible;
    });
    // Update face number labels using the complete geometry
    faceNumberLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(completeGeometry, faceIndex, camera);
        label.visible = visible;
    });
}
function updateFaceLabel(faceIndex, text) {
    var _a;
    // Remove existing label if any
    if (faceLabels.has(faceIndex)) {
        const oldLabel = faceLabels.get(faceIndex);
        oldLabel === null || oldLabel === void 0 ? void 0 : oldLabel.removeFromParent(); // Remove from scene graph
        (_a = oldLabel === null || oldLabel === void 0 ? void 0 : oldLabel.element) === null || _a === void 0 ? void 0 : _a.remove(); // Remove HTML element
        faceLabels.delete(faceIndex);
    }
    if (text && text.trim() !== "") {
        const shortText = text.length > MAX_LABEL_CHARS ? text.substring(0, MAX_LABEL_CHARS) + "…" : text;
        const labelDiv = document.createElement('div');
        labelDiv.className = 'face-label';
        labelDiv.textContent = shortText;
        // Store full text as data attribute for hover expansion
        labelDiv.setAttribute('data-full-text', text);
        // Add hover event listeners for tooltip behavior
        labelDiv.addEventListener('mouseenter', () => {
            labelDiv.textContent = text; // Show full text on hover
        });
        labelDiv.addEventListener('mouseleave', () => {
            labelDiv.textContent = shortText; // Return to truncated text
        });
        const faceData = getFaceCentroidAndNormal(completeGeometry, faceIndex);
        if (faceData) {
            const { centroid, normal } = faceData;
            // Center the label at the face centroid with slight offset for user labels
            const labelOffset = 0.08; // Closer to face surface for user labels
            const labelPosition = centroid.clone().add(normal.clone().multiplyScalar(labelOffset));
            const label = new CSS2DObject(labelDiv);
            label.position.copy(labelPosition);
            // Add label as a child of the dome group so it moves with it
            if (domeGroup) {
                domeGroup.add(label);
            }
            else {
                console.warn('domeGroup not initialized when trying to add label');
            }
            faceLabels.set(faceIndex, label);
        }
        else {
            console.warn(`Could not get centroid for faceIndex ${faceIndex} to place label.`);
        }
    }
}
function onSaveFaceText(faceIndex, text) {
    const trimmedText = text.trim();
    if (trimmedText) {
        faceData.set(faceIndex, trimmedText);
        console.log(`Saved text for face ${faceIndex}: "${trimmedText}"`);
    }
    else {
        faceData.delete(faceIndex);
        console.log(`Cleared text for face ${faceIndex}`);
    }
    updateFaceLabel(faceIndex, trimmedText);
    saveFaceDataToStorage(); // Persist to localStorage
}
function onClearFaceText(faceIndex) {
    faceData.delete(faceIndex);
    console.log(`Cleared text for face ${faceIndex}`);
    updateFaceLabel(faceIndex, undefined); // Remove label
    saveFaceDataToStorage(); // Persist to localStorage
}
initModal(modalElements, onSaveFaceText, onClearFaceText);
// --- Event Listeners ---
function onDoubleClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = domeMesh ? raycaster.intersectObject(domeMesh, false) : []; // Use the invisible complete mesh for raycasting
    if (intersects.length > 0) {
        const intersection = intersects[0];
        console.log('Intersection object:', intersection); // Log the whole intersection
        // For BufferGeometry, `intersection.faceIndex` is the index of the triangle.
        // It should be a number if a face is hit.
        if (intersection.face && typeof intersection.faceIndex === 'number') {
            const faceIndex = intersection.faceIndex;
            console.log(`Double-clicked face. Object: ${intersection.object.name}, Face Index: ${faceIndex}`);
            const existingText = faceData.get(faceIndex);
            showModal(modalElements, faceIndex, existingText);
        }
        else {
            console.warn('Double-click intersection detected, but faceIndex is invalid or missing.', intersection.faceIndex, intersection.face);
        }
    }
    else {
        console.log("No intersection on double-click.");
    }
}
window.addEventListener('dblclick', onDoubleClick, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateLabelVisibility(); // Update label visibility based on face orientation
    // Animate the top vertex indicator
    if (topVertexIndicator && topVertexIndicator.animate) {
        topVertexIndicator.animate();
    }
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels
}
// Create logical face numbering starting from top and spiraling down
// Returns: { logicalNumbers: number[], originalToLogicalMap: Map<number, number> }
function createLogicalFaceNumbering() {
    const totalFaces = geodesicData.faces.length;
    const faceHeights = [];
    // Calculate centroid and height for each face
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
        const faceData = getFaceCentroidAndNormal(completeGeometry, faceIndex);
        if (faceData) {
            faceHeights.push({
                index: faceIndex,
                y: faceData.centroid.y,
                centroid: faceData.centroid
            });
        }
    }
    // Group faces by height levels with tolerance
    const heightTolerance = 0.2;
    const levels = [];
    faceHeights.sort((a, b) => b.y - a.y); // Sort by height, highest first
    faceHeights.forEach(face => {
        // Find existing level or create new one
        let levelFound = false;
        for (const level of levels) {
            if (level.length > 0 && Math.abs(level[0].centroid.y - face.y) < heightTolerance) {
                level.push({ index: face.index, centroid: face.centroid });
                levelFound = true;
                break;
            }
        }
        if (!levelFound) {
            levels.push([{ index: face.index, centroid: face.centroid }]);
        }
    });
    console.log(`Organized faces into ${levels.length} height levels:`, levels.map((level, i) => `Level ${i}: ${level.length} faces at y=${level[0].centroid.y.toFixed(2)}`));
    // Debug: Show details of the top level
    if (levels.length > 0) {
        console.log(`TOP LEVEL DETAILS: ${levels[0].length} faces`);
        levels[0].forEach((face, i) => {
            console.log(`  Face ${i + 1}: original index ${face.index}, centroid y=${face.centroid.y.toFixed(3)}`);
        });
    }
    // Sort faces within each level by angle around the Y axis
    levels.forEach(level => {
        level.sort((a, b) => {
            const angleA = Math.atan2(a.centroid.z, a.centroid.x);
            const angleB = Math.atan2(b.centroid.z, b.centroid.x);
            return angleA - angleB;
        });
    });
    // Create mapping from original face index to logical number
    const logicalNumbering = new Array(totalFaces);
    const originalToLogicalMap = new Map();
    let logicalNumber = 1;
    levels.forEach(level => {
        level.forEach(face => {
            logicalNumbering[face.index] = logicalNumber;
            originalToLogicalMap.set(face.index, logicalNumber);
            logicalNumber++;
        });
    });
    return { logicalNumbers: logicalNumbering, originalToLogicalMap };
}
// Add face numbers for debugging
function addFaceNumbers() {
    if (!domeGroup) {
        console.warn('domeGroup not available in addFaceNumbers, skipping');
        return;
    }
    const totalFaces = geodesicData.faces.length;
    console.log(`addFaceNumbers: Processing ${totalFaces} faces`);
    const { logicalNumbers } = createLogicalFaceNumbering();
    console.log(`Logical numbering created for ${logicalNumbers.length} faces`);
    let numberedCount = 0;
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
        const faceData = getFaceCentroidAndNormal(completeGeometry, faceIndex);
        if (faceData) {
            const { centroid, normal } = faceData;
            // Create face number label using logical numbering
            const labelDiv = document.createElement('div');
            labelDiv.className = 'face-number-label';
            labelDiv.textContent = logicalNumbers[faceIndex].toString();
            // Check if this is a new triangle face for Method 6 using original face index
            const isNewTriangleFace = currentMethod === 6 &&
                geodesicData.newTriangleFaceStartIndex !== undefined &&
                faceIndex >= geodesicData.newTriangleFaceStartIndex;
            // Use blue for new triangle faces, red for others
            const labelColor = isNewTriangleFace ? 'blue' : 'red';
            // Debug logging for Method 6
            if (currentMethod === 6 && faceIndex >= (geodesicData.faces.length - 10)) {
                console.log(`Face ${faceIndex}: isNewTriangleFace=${isNewTriangleFace}, newTriangleStart=${geodesicData.newTriangleFaceStartIndex}, totalFaces=${geodesicData.faces.length}, color=${labelColor}`);
            }
            labelDiv.style.cssText = `
                color: ${labelColor};
                background-color: rgba(255, 255, 255, 0.9);
                padding: 1px 3px;
                border-radius: 2px;
                font-size: 7px;
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                min-width: 10px;
                border: 1px solid ${labelColor};
            `;
            // Position face numbers above user labels to avoid overlap
            const numberOffset = 0.12; // Same distance as user labels from face
            // Create an "up" vector in world space to offset numbers above labels
            const worldUp = new THREE.Vector3(0, 1, 0);
            // Transform to local space relative to the face
            const localUp = worldUp.clone().transformDirection(domeGroup.matrixWorld.clone().invert());
            const upOffset = localUp.multiplyScalar(0.08); // Move up relative to dome orientation
            const numberPosition = centroid.clone()
                .add(normal.clone().multiplyScalar(numberOffset))
                .add(upOffset);
            const label = new CSS2DObject(labelDiv);
            label.position.copy(numberPosition);
            // Add label as child of dome group so it rotates with the dome
            if (domeGroup) {
                domeGroup.add(label);
            }
            else {
                console.warn('domeGroup not initialized when trying to add face number label');
            }
            // Store in array for visibility updates
            faceNumberLabels[faceIndex] = label;
            numberedCount++;
        }
        else {
            console.warn(`No face data for face ${faceIndex}`);
        }
    }
    console.log(`Successfully numbered ${numberedCount} out of ${totalFaces} faces`);
}
// Initialize the application
function initializeApp() {
    return __awaiter(this, void 0, void 0, function* () {
        // Load saved notes from localStorage (method already loaded earlier)
        loadFaceDataFromStorage();
        // Load initial data file (only for faces without saved data)
        yield loadInitialFaceData();
        // Only add labels if dome is built (domeGroup exists)
        if (domeGroup) {
            // Create labels for all loaded data
            faceData.forEach((text, index) => updateFaceLabel(index, text));
            // Add face numbers for debugging
            addFaceNumbers();
        }
        else {
            console.warn('Dome not built yet, skipping label creation');
        }
        console.log("Geodesic Dome App Initialized (Hemisphere version)");
    });
}
// Method selector event handler
function setupMethodSelector() {
    const selector = document.getElementById('method-selector');
    // Set dropdown to current method
    console.log(`Setting dropdown to method ${currentMethod}`);
    selector.value = currentMethod.toString();
    console.log(`Dropdown value set to: ${selector.value}`);
    selector.addEventListener('change', (event) => {
        const target = event.target;
        const newMethod = parseInt(target.value);
        console.log(`User switching from Method ${currentMethod} to Method ${newMethod}`);
        // Save immediately before any potential errors
        currentMethod = newMethod;
        saveMethodToStorage();
        console.log(`Method ${currentMethod} saved to localStorage`);
        // Then attempt rebuild
        rebuildDome();
    });
}
// Start the application
animate();
// Initialize app AFTER building dome visuals
function startApp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initializeApp();
        setupMethodSelector();
    });
}
startApp();
