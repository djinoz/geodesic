"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = __importStar(require("three"));
const OrbitControls_js_1 = require("three/examples/jsm/controls/OrbitControls.js");
const CSS2DRenderer_js_1 = require("three/examples/jsm/renderers/CSS2DRenderer.js");
const ui_js_1 = require("./ui.js");
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
const labelRenderer = new CSS2DRenderer_js_1.CSS2DRenderer();
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
// Method 3: V2 Geodesic dome following method3.md instructions
function create2VGeodesicDomeMethod3(radius) {
    console.log('Creating Method 3 V2 geodesic dome with 2 chord lengths (90mm and 106mm)...');
    const vertices = [];
    const faces = [];
    // Chord length ratios for a V2 geodesic (normalized to radius)
    const shortSpan = 0.45; // Represents 90mm normalized to dome scale
    const longSpan = 0.53; // Represents 106mm normalized to dome scale
    // Step 1: Central hub vertex (apex)
    vertices.push(new THREE.Vector3(0, 1, 0).multiplyScalar(radius));
    // Step 2: Pentagonal star - 5 vertices using short spans from center
    const pentStarVertices = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        // Position these at the right distance for short spans from center
        const y = 0.85; // High up to form the pentagonal star
        const radiusAtY = Math.sqrt(1 - y * y) * 0.7; // Scaled for short spans
        vertices.push(new THREE.Vector3(radiusAtY * Math.cos(angle), y, radiusAtY * Math.sin(angle)).multiplyScalar(radius));
        pentStarVertices.push(vertices.length - 1);
    }
    // Step 3: Outer vertices of pentagonal star triangles using long spans
    const outerTriangleVertices = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5; // Offset by 36 degrees
        const y = 0.65; // Lower than pentagonal star
        const radiusAtY = Math.sqrt(1 - y * y) * 1.1; // Scaled for long spans
        vertices.push(new THREE.Vector3(radiusAtY * Math.cos(angle), y, radiusAtY * Math.sin(angle)).multiplyScalar(radius));
        outerTriangleVertices.push(vertices.length - 1);
    }
    // Step 4: Second ring vertices using short spans from pentagonal star
    const secondRingVertices = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const y = 0.45; // Lower level
        const radiusAtY = Math.sqrt(1 - y * y) * 1.3; // Further out
        vertices.push(new THREE.Vector3(radiusAtY * Math.cos(angle), y, radiusAtY * Math.sin(angle)).multiplyScalar(radius));
        secondRingVertices.push(vertices.length - 1);
    }
    // Step 5: Base level vertices - alternating connections
    const baseLevelVertices = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const y = 0.15; // Near the base
        const radiusAtY = Math.sqrt(1 - y * y) * 1.5; // At the base ring
        vertices.push(new THREE.Vector3(radiusAtY * Math.cos(angle), y, radiusAtY * Math.sin(angle)).multiplyScalar(radius));
        baseLevelVertices.push(vertices.length - 1);
    }
    // Base edge vertices at the equator
    const baseEdgeVertices = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10 + Math.PI / 10; // Offset for alternating pattern
        vertices.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(radius));
        baseEdgeVertices.push(vertices.length - 1);
    }
    console.log(`Created ${vertices.length} vertices for Method 3 dome`);
    // Face creation following the construction steps:
    // Step 1-2: Top pentagonal faces (5 short spans from center)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([0, pentStarVertices[i], pentStarVertices[next]]);
    }
    // Step 3: Pentagonal star outer triangles (using long spans)
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([pentStarVertices[i], outerTriangleVertices[i], pentStarVertices[next]]);
        faces.push([pentStarVertices[next], outerTriangleVertices[i], outerTriangleVertices[next]]);
    }
    // Step 4: Connect to second ring with short spans
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([pentStarVertices[i], secondRingVertices[i], outerTriangleVertices[i]]);
        faces.push([outerTriangleVertices[i], secondRingVertices[i], secondRingVertices[next]]);
        faces.push([outerTriangleVertices[i], secondRingVertices[next], outerTriangleVertices[next]]);
    }
    // Steps 7-9: Base level connections following alternating pattern
    for (let i = 0; i < 5; i++) {
        const nextI = (i + 1) % 5;
        const baseIdx1 = i * 2;
        const baseIdx2 = i * 2 + 1;
        const nextBaseIdx1 = (nextI * 2) % 10;
        // Connect second ring to base level
        faces.push([secondRingVertices[i], baseLevelVertices[baseIdx1], baseLevelVertices[baseIdx2]]);
        faces.push([secondRingVertices[i], baseLevelVertices[baseIdx2], secondRingVertices[nextI]]);
        // Connect base level to edge
        faces.push([baseLevelVertices[baseIdx1], baseEdgeVertices[baseIdx1], baseEdgeVertices[baseIdx2]]);
        faces.push([baseLevelVertices[baseIdx1], baseEdgeVertices[baseIdx2], baseLevelVertices[baseIdx2]]);
        faces.push([baseLevelVertices[baseIdx2], baseEdgeVertices[baseIdx2], baseEdgeVertices[nextBaseIdx1]]);
        faces.push([baseLevelVertices[baseIdx2], baseEdgeVertices[nextBaseIdx1], baseLevelVertices[nextBaseIdx1]]);
    }
    console.log(`Created ${faces.length} faces for Method 3 dome`);
    console.log(`Method 3: Using chord lengths - Short: ${(shortSpan * radius * 2).toFixed(2)}, Long: ${(longSpan * radius * 2).toFixed(2)}`);
    return { vertices, faces };
}
// Configuration for method selection
let currentMethod = 1; // Default to Method 1
let geodesicData;
let domeGroup;
let completeGeometry;
// Storage keys
const STORAGE_KEY = 'geodesic-dome-notes';
const METHOD_STORAGE_KEY = 'geodesic-dome-method';
// Create the 2V geodesic dome using selected method
function create2VGeodesicDome(radius) {
    if (currentMethod === 2) {
        return create2VGeodesicDomeMethod2(radius);
    }
    else if (currentMethod === 3) {
        return create2VGeodesicDomeMethod3(radius);
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
        return materials;
    }
    // Assign faces to layers based on their height (Y coordinate)
    function assignFacesToLayers(faces, vertices) {
        const facesByLayer = [[], [], []]; // 3 layers
        faces.forEach((face, faceIndex) => {
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
    const topLabel = new CSS2DRenderer_js_1.CSS2DObject(labelDiv);
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
const controls = new OrbitControls_js_1.OrbitControls(camera, renderer.domElement); // Use main renderer's DOM for events
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
            if (parsedMethod === 1 || parsedMethod === 2 || parsedMethod === 3) {
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
            const label = new CSS2DRenderer_js_1.CSS2DObject(labelDiv);
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
(0, ui_js_1.initModal)(modalElements, onSaveFaceText, onClearFaceText);
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
            (0, ui_js_1.showModal)(modalElements, faceIndex, existingText);
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
    let logicalNumber = 1;
    levels.forEach(level => {
        level.forEach(face => {
            logicalNumbering[face.index] = logicalNumber++;
        });
    });
    return logicalNumbering;
}
// Add face numbers for debugging
function addFaceNumbers() {
    if (!domeGroup) {
        console.warn('domeGroup not available in addFaceNumbers, skipping');
        return;
    }
    const totalFaces = geodesicData.faces.length;
    console.log(`addFaceNumbers: Processing ${totalFaces} faces`);
    const logicalNumbers = createLogicalFaceNumbering();
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
            labelDiv.style.cssText = `
                color: red;
                background-color: rgba(255, 255, 255, 0.9);
                padding: 1px 3px;
                border-radius: 2px;
                font-size: 7px;
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                min-width: 10px;
                border: 1px solid red;
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
            const label = new CSS2DRenderer_js_1.CSS2DObject(labelDiv);
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
