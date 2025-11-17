import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { initModal, showModal, ModalElements, FaceData } from './ui';
import create2VGeodesicDomeMethod1 from './methods/method1';
import create2VGeodesicDomeMethod2 from './methods/method2';
import create2VGeodesicDomeMethod3 from './methods/method3';
import create2VGeodesicDomeMethod4 from './methods/method4';
import create2VGeodesicDomeMethod5 from './methods/method5';
import create2VGeodesicDomeMethod6 from './methods/method6';
import create2VGeodesicDomeMethod7 from './methods/method7';
import create2VGeodesicDomeMethod8 from './methods/method8';
import create2VGeodesicDomeMethod9 from './methods/method9';
import create2VGeodesicDomeMethod10 from './methods/method10';
import create2VGeodesicDomeMethod11 from './methods/method11';
import create2VGeodesicDomeMethod12, {
    getCurrentStep,
    getMaxSteps,
    nextStep,
    previousStep,
    setCurrentStep,
    setMiddleLongAngle,
    setMiddleShortAngle,
    setBottomLongAngle,
    setBottomShortAngle,
    getAngles,
    loadAnglesFromStorage,
    saveAnglesToStorage
} from './methods/method12';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const canvasContainer = document.getElementById('canvas-container') as HTMLDivElement;
const canvas = document.getElementById('domeCanvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// canvasContainer.appendChild(renderer.domElement); // Canvas is already in HTML

// --- Label Renderer ---
const labelContainer = document.getElementById('label-container') as HTMLDivElement;
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

// Debug mode - controlled by URL parameter ?debug=true
const debugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
console.log(`Debug mode: ${debugMode}`);

// Configuration for method selection
let currentMethod = 12; // Default to Method 12
let geodesicData: {
    vertices: THREE.Vector3[],
    faces: number[][],
    newTriangleFaceStartIndex?: number,
    newTriangleFaceCount?: number
};
let domeGroup: THREE.Group | undefined;
let completeGeometry: THREE.BufferGeometry;

// Storage keys
const STORAGE_KEY_PREFIX = 'geodesic-dome-data-';
const EMAIL_STORAGE_KEY = 'geodesic-dome-user-email';
const METHOD_STORAGE_KEY = 'geodesic-dome-method';

// Store debug labels for visibility updates (Method 12)
const debugLabelObjects: CSS2DObject[] = [];

function create2VGeodesicDome(radius: number) {
    if (currentMethod === 2) {
        return create2VGeodesicDomeMethod2(radius);
    } else if (currentMethod === 3) {
        return create2VGeodesicDomeMethod3(radius);
    } else if (currentMethod === 4) {
        return create2VGeodesicDomeMethod4(radius);
    } else if (currentMethod === 5) {
        return create2VGeodesicDomeMethod5(radius);
    } else if (currentMethod === 6) {
        return create2VGeodesicDomeMethod6(radius);
    } else if (currentMethod === 7) {
        return create2VGeodesicDomeMethod7(radius);
    } else if (currentMethod === 8) {
        return create2VGeodesicDomeMethod8(radius);
    } else if (currentMethod === 9) {
        return create2VGeodesicDomeMethod9(radius);
    } else if (currentMethod === 10) {
        return create2VGeodesicDomeMethod10(radius);
    } else if (currentMethod === 11) {
        return create2VGeodesicDomeMethod11(radius);
    } else if (currentMethod === 12) {
        return create2VGeodesicDomeMethod12(radius);
    } else {
        return create2VGeodesicDomeMethod1(radius);
    }
}

// Function to rebuild the entire dome with new method
function rebuildDome() {
    console.log(`Starting rebuild with Method ${currentMethod}`);
    
    try {
        // Clear existing dome completely
        if (domeGroup) {
            // Remove all children from dome group first
            while(domeGroup.children.length > 0) {
                const child = domeGroup.children[0];
                domeGroup.remove(child);
                // Dispose of geometries and materials to free memory
                if (child instanceof THREE.Mesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            }
            scene.remove(domeGroup);
            domeGroup = undefined;
        }
        
        // Clear existing labels completely
        faceLabels.forEach((label, index) => {
            label.removeFromParent();
            label.element?.remove();
        });
        faceLabels.clear();
        
        // Clear face number labels
        faceNumberLabels.forEach(label => {
            label.removeFromParent();
            label.element?.remove();
        });
        faceNumberLabels.length = 0;

        // Clear debug labels
        debugLabelObjects.forEach(label => {
            label.removeFromParent();
            label.element?.remove();
        });
        debugLabelObjects.length = 0;
        
        // Reset references
        topVertexIndicator = undefined;
        domeMesh = undefined;
        completeGeometry = undefined as any;
        
        // Create new dome data
        geodesicData = create2VGeodesicDome(domeRadius);
        
        // Rebuild dome geometry and visual elements
        buildDomeVisuals();
        
        // Wait for next frame to ensure everything is initialized
        setTimeout(() => {
            if (domeGroup && completeGeometry) {
                // Recreate labels for existing data
                faceData.forEach((text, index) => updateFaceLabel(index, text));

                // Only add face numbers in debug mode
                if (debugMode) {
                    addFaceNumbers();
                }

                updateDebugInfo(); // Update face count display
                console.log(`Successfully rebuilt dome using Method ${currentMethod}`);
            } else {
                console.error('Dome rebuild failed - missing domeGroup or completeGeometry');
            }
        }, 100); // Longer delay to ensure completion
        
    } catch (error) {
        console.error('Error during dome rebuild:', error);
    }
}

// Function to render debug labels for Method 12
function renderDebugLabels(
    group: THREE.Group,
    vertices: THREE.Vector3[],
    debugLabels: {
        ringVertices?: number[];
        strutEndpoints?: { vertexIndex: number; label: string }[];
        strutLengths?: { v1: number; v2: number; label: string; actualLength: number; expectedLength: number }[];
    }
) {
    // Render ring vertex labels (V0, V1, ..., V9)
    if (debugLabels.ringVertices) {
        debugLabels.ringVertices.forEach((vertexIndex, i) => {
            const vertex = vertices[vertexIndex];
            const labelDiv = document.createElement('div');
            labelDiv.textContent = `V${i}`;
            labelDiv.style.cssText = `
                color: white;
                background-color: rgba(0, 128, 0, 0.9);
                padding: 2px 5px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                border: 1px solid green;
            `;

            const label = new CSS2DObject(labelDiv);
            label.position.copy(vertex);
            label.position.y += 0.15; // Offset above vertex
            group.add(label);
            debugLabelObjects.push(label); // Store for visibility updates
        });
    }

    // Render strut endpoint labels (S0-A, S0-B, etc.)
    if (debugLabels.strutEndpoints) {
        debugLabels.strutEndpoints.forEach(({ vertexIndex, label: labelText }) => {
            const vertex = vertices[vertexIndex];
            const labelDiv = document.createElement('div');
            labelDiv.textContent = labelText;
            labelDiv.style.cssText = `
                color: white;
                background-color: rgba(128, 0, 128, 0.9);
                padding: 2px 5px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                border: 1px solid purple;
            `;

            const label = new CSS2DObject(labelDiv);
            label.position.copy(vertex);
            label.position.y += 0.1; // Slightly above vertex
            group.add(label);
            debugLabelObjects.push(label); // Store for visibility updates
        });
    }

    // Render strut length labels on edge midpoints
    if (debugLabels.strutLengths) {
        debugLabels.strutLengths.forEach(({ v1, v2, label: strutLabel, actualLength, expectedLength }) => {
            const vertex1 = vertices[v1];
            const vertex2 = vertices[v2];

            // Calculate midpoint
            const midpoint = new THREE.Vector3(
                (vertex1.x + vertex2.x) / 2,
                (vertex1.y + vertex2.y) / 2,
                (vertex1.z + vertex2.z) / 2
            );

            // Check if length matches expected (within tolerance)
            const tolerance = 0.05;
            const isCorrect = Math.abs(actualLength - expectedLength) < tolerance;
            const bgColor = isCorrect ? 'rgba(0, 128, 0, 0.95)' : 'rgba(255, 0, 0, 0.95)';
            const borderColor = isCorrect ? 'green' : 'red';

            const labelDiv = document.createElement('div');
            labelDiv.textContent = `${strutLabel}: ${actualLength.toFixed(2)}`;
            labelDiv.style.cssText = `
                color: white;
                background-color: ${bgColor};
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 8px;
                font-weight: bold;
                pointer-events: none;
                text-align: center;
                border: 1px solid ${borderColor};
            `;

            const label = new CSS2DObject(labelDiv);
            label.position.copy(midpoint);
            group.add(label);
            debugLabelObjects.push(label); // Store for visibility updates
        });
    }

    console.log(`Rendered ${debugLabels.ringVertices?.length || 0} ring vertex labels, ${debugLabels.strutEndpoints?.length || 0} strut endpoint labels, and ${debugLabels.strutLengths?.length || 0} strut length labels`);
}

// Function to render colored edges for Method 12
function renderColoredEdges(
    group: THREE.Group,
    vertices: THREE.Vector3[],
    edges: [number, number, 'SHORT' | 'LONG', number][]
) {
    const currentStep = getCurrentStep();

    edges.forEach(([v1Index, v2Index, edgeType, edgeStep]) => {
        const v1 = vertices[v1Index];
        const v2 = vertices[v2Index];

        // Determine color based on step and type
        let color: number;
        if (edgeStep < currentStep) {
            // Approved edge from previous step
            color = 0x000000; // BLACK
        } else if (edgeStep === currentStep) {
            // Current step edge - color by type
            if (edgeType === 'SHORT') {
                color = 0xff0000; // RED for SHORT
            } else {
                color = 0x0000ff; // BLUE for LONG
            }
        } else {
            // Future step edge - shouldn't exist but handle gracefully
            return; // Don't render future edges
        }

        // Create line geometry for this edge
        const points = [v1, v2];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 2,
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
    });

    console.log(`Rendered ${edges.length} edges with colors (current step: ${currentStep})`);
}

// Function to build dome visuals from geodesic data
function buildDomeVisuals() {
    console.log(`buildDomeVisuals() starting...`);
    
    // Convert to flat arrays for Three.js
    const hemisphereVertices: number[] = [];
    geodesicData.vertices.forEach(v => {
        hemisphereVertices.push(v.x, v.y, v.z);
    });

    const hemisphereFaces: number[] = [];
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
    const vertexConnections = new Map<number, Set<number>>();
    geodesicData.faces.forEach(face => {
        face.forEach((v1, idx) => {
            face.forEach((v2, idx2) => {
                if (idx !== idx2) {
                    if (!vertexConnections.has(v1)) vertexConnections.set(v1, new Set());
                    vertexConnections.get(v1)!.add(v2);
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

    console.log(`Top vertex is ${topVertex.index} with ${vertexConnections.get(topVertex.index)?.size} connections`);

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
        if (layerFaces.length === 0) return;
        
        // Create geometry for this layer
        const layerVertices: number[] = [];
        const layerIndices: number[] = [];
        const vertexMap = new Map<number, number>(); // Original index -> new index
        
        layerFaces.forEach(faceIndex => {
            const face = geodesicData.faces[faceIndex];
            const faceIndices: number[] = [];
            
            face.forEach(originalVertexIndex => {
                if (!vertexMap.has(originalVertexIndex)) {
                    const newIndex = layerVertices.length / 3;
                    vertexMap.set(originalVertexIndex, newIndex);
                    
                    const vertex = geodesicData.vertices[originalVertexIndex];
                    layerVertices.push(vertex.x, vertex.y, vertex.z);
                }
                faceIndices.push(vertexMap.get(originalVertexIndex)!);
            });
            
            layerIndices.push(...faceIndices);
        });
        
        const layerGeometry = new THREE.BufferGeometry();
        layerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(layerVertices, 3));
        layerGeometry.setIndex(layerIndices);
        layerGeometry.computeVertexNormals();
        
        const layerMesh = new THREE.Mesh(layerGeometry, layerMaterials[layerIndex]);
        layerMesh.name = `geodesicDomeLayer${layerIndex}`;
        domeGroup!.add(layerMesh);
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

    // Wireframe rendering - use colored edges for Method 12, standard wireframe for others
    if (currentMethod === 12 && geodesicData.edges) {
        // Method 12: Render colored edges based on type and step
        renderColoredEdges(domeGroup, geodesicData.vertices, geodesicData.edges);

        // Add debug labels if available and in debug mode
        if (debugMode && geodesicData.debugLabels) {
            renderDebugLabels(domeGroup, geodesicData.vertices, geodesicData.debugLabels);
        }
    } else {
        // Standard wireframe for other methods
        const wireframeGeometry = new THREE.WireframeGeometry(completeGeometry);
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x333333,
            linewidth: 1,
        });
        const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        domeGroup.add(wireframe);
    }

    // Add top vertex indicator and store reference
    const indicator = addTopVertexIndicator();
    if (indicator) {
        topVertexIndicator = indicator;
    }
    
    console.log(`buildDomeVisuals() completed. domeGroup: ${!!domeGroup}, completeGeometry: ${!!completeGeometry}`);
}

    // Create materials for different layers
function createLayerMaterials() {
    const materials: THREE.MeshPhongMaterial[] = [];

    // Progressively lighter shades of gray from bottom to top
    const layerColors = [
        new THREE.Color(0x909090), // Medium-light gray for bottom layer
        new THREE.Color(0xc0c0c0), // Light gray for middle layer
        new THREE.Color(0xf0f0f0)  // Very light gray for top layer
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
function assignFacesToLayers(faces: number[][], vertices: THREE.Vector3[]) {
    // For Method 6, Method 7, and Method 8, we need 4 layers to handle equator faces specially
    const numLayers = (currentMethod === 6 || currentMethod === 7 || currentMethod === 8) ? 4 : 3;
    const facesByLayer: number[][] = Array(numLayers).fill(null).map(() => []);

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

        // Assign to layer based on height (dome radius is 2)
        // Distribute faces more evenly across three layers
        let layer = 0;
        if (avgY > 1.75) layer = 2; // Top layer (BLUE - only the very top pentagon)
        else if (avgY > 1.4) layer = 1; // Middle layer (GREEN - Step 3 petals)
        else layer = 0; // Bottom layer (RED - Step 6/7 petals and bottom)

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
    (topIndicator as any).animate = animate;
    
    domeGroup!.add(topIndicator);
    
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
    
    domeGroup!.add(topLabel);
    
    return topIndicator;
}

let topVertexIndicator: THREE.Mesh | undefined;
let domeMesh: THREE.Mesh | undefined;

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
const faceData = new Map<number, FaceData>(); // Key: faceIndex (triangle index), Value: {name, description}
const faceLabels = new Map<number, CSS2DObject>(); // Key: faceIndex, Value: CSS2DObject label for hover
const initialFaceData = new Map<number, FaceData>(); // Store initial data for reset functionality

// User email for personalized storage
let userEmail: string = '';

// --- Persistence Functions ---
function getStorageKey(): string {
    // Use email-specific key if email is set, otherwise use generic key
    if (userEmail) {
        return STORAGE_KEY_PREFIX + userEmail;
    }
    return STORAGE_KEY_PREFIX + 'anonymous';
}

function saveFaceDataToStorage(): void {
    const dataObject = Object.fromEntries(faceData);
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(dataObject));
    console.log(`Saved face data to ${storageKey}`);
}

function saveMethodToStorage(): void {
    localStorage.setItem(METHOD_STORAGE_KEY, currentMethod.toString());
    console.log(`Saved method ${currentMethod} to storage`);
}

function loadMethodFromStorage(): void {
    // If not in debug mode, always use Method 12
    if (!debugMode) {
        currentMethod = 12;
        console.log('Non-debug mode: forcing Method 12');
        return;
    }

    // In debug mode, load from storage as normal
    try {
        const storedMethod = localStorage.getItem(METHOD_STORAGE_KEY);
        console.log(`Raw stored method: "${storedMethod}"`);
        if (storedMethod) {
            const parsedMethod = parseInt(storedMethod);
            if (parsedMethod >= 1 && parsedMethod <= 12) {
                currentMethod = parsedMethod;
                console.log(`Successfully loaded method ${currentMethod} from storage`);
            } else {
                console.warn(`Invalid method in storage: ${parsedMethod}, defaulting to 12`);
                currentMethod = 12;
            }
        } else {
            console.log('No saved method found, using default method 12');
            currentMethod = 12;
        }
    } catch (error) {
        console.warn('Failed to load method from storage:', error);
        currentMethod = 12;
    }
}

function loadFaceDataFromStorage(): void {
    try {
        const storageKey = getStorageKey();
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            const dataObject = JSON.parse(storedData);
            faceData.clear();
            Object.entries(dataObject).forEach(([key, value]) => {
                faceData.set(parseInt(key), value as FaceData);
            });
            console.log(`Loaded ${faceData.size} saved faces from ${storageKey}`);
        }
    } catch (error) {
        console.warn('Failed to load face data from storage:', error);
    }
}

// Save user email to localStorage
function saveEmailToStorage(): void {
    if (userEmail) {
        localStorage.setItem(EMAIL_STORAGE_KEY, userEmail);
        console.log(`Saved email: ${userEmail}`);
    }
}

// Load user email from localStorage
function loadEmailFromStorage(): void {
    try {
        const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
        if (storedEmail) {
            userEmail = storedEmail;
            console.log(`Loaded email: ${userEmail}`);

            // Update UI
            const emailInput = document.getElementById('user-email') as HTMLInputElement;
            if (emailInput) {
                emailInput.value = userEmail;
            }
        }
    } catch (error) {
        console.warn('Failed to load email from storage:', error);
    }
}

async function loadInitialFaceData(): Promise<void> {
    try {
        const response = await fetch('/src/initial-data.json');
        const initialData = await response.json();

        // Store initial data and load into faceData if not already set by user
        Object.entries(initialData).forEach(([key, value]) => {
            const faceIndex = parseInt(key);

            // Store in initialFaceData for reset functionality
            if (typeof value === 'string') {
                initialFaceData.set(faceIndex, {
                    name: undefined,
                    description: value
                });
            } else {
                initialFaceData.set(faceIndex, value as FaceData);
            }

            // Only load into faceData if user hasn't set their own data
            if (!faceData.has(faceIndex)) {
                faceData.set(faceIndex, initialFaceData.get(faceIndex)!);
            }
        });
        console.log(`Loaded initial data for ${Object.keys(initialData).length} faces`);
    } catch (error) {
        console.warn('Failed to load initial face data:', error);
    }
}

// --- Modal UI Elements ---
console.log('Initializing modal elements...');
const modalElements: ModalElements = {
    modal: document.getElementById('textModal') as HTMLDivElement,
    closeButton: document.querySelector('.close-button') as HTMLSpanElement,
    modalTitle: document.getElementById('modalTitle') as HTMLHeadingElement,
    existingTextElement: document.getElementById('modalExistingText') as HTMLParagraphElement,
    nameInput: document.getElementById('faceNameInput') as HTMLInputElement,
    descInput: document.getElementById('faceDescInput') as HTMLTextAreaElement,
    saveButton: document.getElementById('saveTextButton') as HTMLButtonElement,
    resetButton: document.getElementById('resetToDefaultButton') as HTMLButtonElement,
    clearButton: document.getElementById('clearTextButton') as HTMLButtonElement,
};

// Debug logging to find which element is undefined
console.log('Modal elements initialized:', {
    modal: !!modalElements.modal,
    closeButton: !!modalElements.closeButton,
    modalTitle: !!modalElements.modalTitle,
    existingTextElement: !!modalElements.existingTextElement,
    nameInput: !!modalElements.nameInput,
    descInput: !!modalElements.descInput,
    saveButton: !!modalElements.saveButton,
    resetButton: !!modalElements.resetButton,
    clearButton: !!modalElements.clearButton,
});

// --- Helper function to get face centroid and normal for our custom geometry ---
function getFaceCentroidAndNormal(geom: THREE.BufferGeometry, faceIdx: number): { centroid: THREE.Vector3; normal: THREE.Vector3 } | null {
    if (!geom || !geom.attributes) {
        console.warn("Invalid geometry passed to getFaceCentroidAndNormal");
        return null;
    }
    
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
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
function isFaceVisible(geom: THREE.BufferGeometry, faceIdx: number, camera: THREE.Camera): boolean {
    const faceData = getFaceCentroidAndNormal(geom, faceIdx);
    if (!faceData) return false;
    
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
const faceNumberLabels: CSS2DObject[] = [];

// Helper function to check if a point on the dome surface is visible from the camera
function isPointVisible(worldPosition: THREE.Vector3, camera: THREE.Camera): boolean {
    // Calculate surface normal (direction from dome center to point)
    const domeCenter = new THREE.Vector3(0, 0, 0);
    if (domeGroup) {
        domeGroup.localToWorld(domeCenter);
    }

    const surfaceNormal = new THREE.Vector3().subVectors(worldPosition, domeCenter).normalize();

    // Vector from point to camera
    const toCamera = new THREE.Vector3().subVectors(camera.position, worldPosition).normalize();

    // Point is visible if surface normal points toward camera
    const dotProduct = surfaceNormal.dot(toCamera);
    return dotProduct > 0.1;
}

// Function to update visibility of all labels (both user notes and face numbers)
function updateLabelVisibility() {
    // Skip if dome is not fully initialized
    if (!domeGroup || !completeGeometry) {
        return;
    }

    // Update user note labels - always show if front-facing
    faceLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(completeGeometry, faceIndex, camera);
        label.visible = visible;
    });

    // Update face number labels using the complete geometry (only in debug mode)
    faceNumberLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(completeGeometry, faceIndex, camera);
        label.visible = visible;
    });

    // Update debug labels (for Method 12)
    debugLabelObjects.forEach(label => {
        if (domeGroup) {
            // Get world position of the label
            const worldPos = new THREE.Vector3();
            label.getWorldPosition(worldPos);

            // Check if this position is visible from camera
            const visible = isPointVisible(worldPos, camera);
            label.visible = visible;
        }
    });
}

function updateFaceLabel(faceIndex: number, data?: FaceData) {
    // Remove existing label if any
    if (faceLabels.has(faceIndex)) {
        const oldLabel = faceLabels.get(faceIndex);
        oldLabel?.removeFromParent(); // Remove from scene graph
        oldLabel?.element?.remove(); // Remove HTML element
        faceLabels.delete(faceIndex);
    }

    // Create label if there's a name (prioritize name over description for display)
    const labelText = data?.name;
    if (labelText && labelText.trim() !== "") {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'face-label';

        // Truncate to MAX_LABEL_CHARS for display
        const truncatedText = labelText.length > MAX_LABEL_CHARS
            ? labelText.substring(0, MAX_LABEL_CHARS) + '...'
            : labelText;

        labelDiv.textContent = truncatedText;
        labelDiv.style.cssText = `
            color: white;
            background-color: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            pointer-events: auto;
            text-align: center;
            white-space: nowrap;
            border: 1px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
        `;

        // Store full name for hover (without description)
        const fullText = data?.name || '';

        // Add hover event to show full text
        labelDiv.addEventListener('mouseenter', () => {
            labelDiv.textContent = fullText;
            labelDiv.style.whiteSpace = 'pre-wrap';
            labelDiv.style.maxWidth = '200px';
        });

        labelDiv.addEventListener('mouseleave', () => {
            labelDiv.textContent = truncatedText;
            labelDiv.style.whiteSpace = 'nowrap';
            labelDiv.style.maxWidth = 'none';
        });

        const faceCentroid = getFaceCentroidAndNormal(completeGeometry, faceIndex);
        if (faceCentroid) {
            const { centroid, normal } = faceCentroid;

            // Center the label at the face centroid with slight offset for user labels
            const labelOffset = 0.08; // Closer to face surface for user labels
            const labelPosition = centroid.clone().add(normal.clone().multiplyScalar(labelOffset));

            const label = new CSS2DObject(labelDiv);
            label.position.copy(labelPosition);
            label.visible = true; // Always visible now

            // Add label as a child of the dome group so it moves with it
            if (domeGroup) {
                domeGroup.add(label);
            } else {
                console.warn('domeGroup not initialized when trying to add label');
            }
            faceLabels.set(faceIndex, label);
        } else {
            console.warn(`Could not get centroid for faceIndex ${faceIndex} to place label.`);
        }
    }
}


function onSaveFaceText(faceIndex: number, data: FaceData): void {
    if (data.name || data.description) {
        faceData.set(faceIndex, data);
        console.log(`Saved data for face ${faceIndex}:`, data);
    } else {
        faceData.delete(faceIndex);
        console.log(`Cleared data for face ${faceIndex}`);
    }
    updateFaceLabel(faceIndex, data);
    saveFaceDataToStorage(); // Persist to localStorage
}

function onResetToDefault(faceIndex: number): void {
    // Get the default data from initialFaceData
    const defaultData = initialFaceData.get(faceIndex);

    if (defaultData) {
        // Set to default values
        faceData.set(faceIndex, { ...defaultData });
        console.log(`Reset face ${faceIndex} to default:`, defaultData);
    } else {
        // No default data, clear it
        faceData.delete(faceIndex);
        console.log(`No default data for face ${faceIndex}, cleared`);
    }

    updateFaceLabel(faceIndex, faceData.get(faceIndex));
    saveFaceDataToStorage(); // Persist to localStorage

    // Reopen modal with updated default values
    showModal(modalElements, faceIndex, faceData.get(faceIndex));
}

function onClearFaceText(faceIndex: number): void {
    faceData.delete(faceIndex);
    console.log(`Cleared data for face ${faceIndex}`);
    updateFaceLabel(faceIndex, undefined); // Remove label
    saveFaceDataToStorage(); // Persist to localStorage
}

initModal(modalElements, onSaveFaceText, onResetToDefault, onClearFaceText);

// --- Event Listeners ---

function onDoubleClick(event: MouseEvent) {
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

            const existingData = faceData.get(faceIndex);
            showModal(modalElements, faceIndex, existingData);
        } else {
            console.warn('Double-click intersection detected, but faceIndex is invalid or missing.', intersection.faceIndex, intersection.face);
        }
    } else {
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
    if (topVertexIndicator && (topVertexIndicator as any).animate) {
        (topVertexIndicator as any).animate();
    }
    
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels
}

// Create logical face numbering starting from top and spiraling down
// Returns: { logicalNumbers: number[], originalToLogicalMap: Map<number, number> }
function createLogicalFaceNumbering(): { logicalNumbers: number[], originalToLogicalMap: Map<number, number> } {
    const totalFaces = geodesicData.faces.length;
    const faceHeights: { index: number; y: number; centroid: THREE.Vector3 }[] = [];
    
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
    const levels: { index: number; centroid: THREE.Vector3 }[][] = [];
    
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
    
    console.log(`Organized faces into ${levels.length} height levels:`, 
        levels.map((level, i) => `Level ${i}: ${level.length} faces at y=${level[0].centroid.y.toFixed(2)}`));
    
    // Debug: Show details of the top level
    if (levels.length > 0) {
        console.log(`TOP LEVEL DETAILS: ${levels[0].length} faces`);
        levels[0].forEach((face, i) => {
            console.log(`  Face ${i+1}: original index ${face.index}, centroid y=${face.centroid.y.toFixed(3)}`);
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
    const logicalNumbering: number[] = new Array(totalFaces);
    const originalToLogicalMap = new Map<number, number>();
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
            } else {
                console.warn('domeGroup not initialized when trying to add face number label');
            }
            
            // Store in array for visibility updates
            faceNumberLabels[faceIndex] = label;
            numberedCount++;
        } else {
            console.warn(`No face data for face ${faceIndex}`);
        }
    }
    
    console.log(`Successfully numbered ${numberedCount} out of ${totalFaces} faces`);
}

// Initialize the application
async function initializeApp() {
    // Load user email first (affects which data we load)
    loadEmailFromStorage();

    // Load saved notes from localStorage (method already loaded earlier)
    loadFaceDataFromStorage();

    // Load initial data file (only for faces without saved data)
    await loadInitialFaceData();

    // Only add labels if dome is built (domeGroup exists)
    if (domeGroup) {
        // Create labels for all loaded data
        faceData.forEach((data, index) => updateFaceLabel(index, data));

        // Add face numbers for debugging - only in debug mode
        if (debugMode) {
            addFaceNumbers();
        }
    } else {
        console.warn('Dome not built yet, skipping label creation');
    }

    console.log("Geodesic Dome App Initialized (Hemisphere version)");
}

// Setup email-based save/load controls
function setupEmailControls() {
    const emailInput = document.getElementById('user-email') as HTMLInputElement;
    const fetchButton = document.getElementById('fetch-settings') as HTMLButtonElement;
    const saveButton = document.getElementById('save-settings') as HTMLButtonElement;

    if (!emailInput || !fetchButton || !saveButton) {
        console.warn('Email controls not found in DOM');
        return;
    }

    // Update email when input changes
    emailInput.addEventListener('change', () => {
        const newEmail = emailInput.value.trim();
        if (newEmail) {
            userEmail = newEmail;
            saveEmailToStorage();
            console.log(`Email updated to: ${userEmail}`);
        }
    });

    // Fetch/Load button - load data for this email
    fetchButton.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter your email address first');
            return;
        }

        userEmail = email;
        saveEmailToStorage();

        // Reload face data for this email
        loadFaceDataFromStorage();

        // Rebuild labels
        if (domeGroup && completeGeometry) {
            // Clear existing labels
            faceLabels.forEach((label) => {
                label.removeFromParent();
                label.element?.remove();
            });
            faceLabels.clear();

            // Recreate labels for loaded data
            faceData.forEach((data, index) => updateFaceLabel(index, data));
        }

        alert(`Loaded data for ${userEmail}\n${faceData.size} faces with notes`);
    });

    // Save button - save current data for this email
    saveButton.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (!email) {
            alert('Please enter your email address first');
            return;
        }

        userEmail = email;
        saveEmailToStorage();
        saveFaceDataToStorage();

        alert(`Saved ${faceData.size} face notes for ${userEmail}`);
    });
}

// Method selector event handler
function setupMethodSelector() {
    const selector = document.getElementById('method-selector') as HTMLSelectElement;

    // Set dropdown to current method
    console.log(`Setting dropdown to method ${currentMethod}`);
    selector.value = currentMethod.toString();
    console.log(`Dropdown value set to: ${selector.value}`);

    selector.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        const newMethod = parseInt(target.value);
        console.log(`User switching from Method ${currentMethod} to Method ${newMethod}`);

        // Save immediately before any potential errors
        currentMethod = newMethod;
        saveMethodToStorage();
        console.log(`Method ${currentMethod} saved to localStorage`);

        // Update step controls visibility
        updateStepControlsVisibility();

        // Update debug info
        updateDebugInfo();

        // Then attempt rebuild
        rebuildDome();
    });
}

// Step control event handlers for Method 12
function setupStepControls() {
    const prevButton = document.getElementById('prev-step') as HTMLButtonElement;
    const nextButton = document.getElementById('next-step') as HTMLButtonElement;
    const stepCounter = document.getElementById('step-counter') as HTMLSpanElement;
    const stepControls = document.getElementById('step-controls') as HTMLDivElement;

    // Update visibility based on current method
    updateStepControlsVisibility();

    function updateStepDisplay() {
        const currentStep = getCurrentStep();
        const maxSteps = getMaxSteps();
        stepCounter.textContent = `Step ${currentStep} of ${maxSteps}`;

        // Disable buttons at boundaries
        prevButton.disabled = currentStep === 1;
        nextButton.disabled = currentStep === maxSteps;
    }

    prevButton.addEventListener('click', () => {
        previousStep();
        updateStepDisplay();
        rebuildDome();
        // Note: updateDebugInfo() is called in rebuildDome() timeout
    });

    nextButton.addEventListener('click', () => {
        nextStep();
        updateStepDisplay();
        rebuildDome();
        // Note: updateDebugInfo() is called in rebuildDome() timeout
    });

    // Initialize display
    updateStepDisplay();
}

function updateStepControlsVisibility() {
    const stepControls = document.getElementById('step-controls') as HTMLDivElement;
    const angleControls = document.getElementById('angle-controls') as HTMLDivElement;
    const rulesSection = document.getElementById('method-rules') as HTMLDivElement;

    if (currentMethod === 12) {
        stepControls.style.display = 'block';
        angleControls.style.display = 'block';
        rulesSection.style.display = 'none'; // Hide rules for Method 12 (step-by-step interactive)
    } else {
        stepControls.style.display = 'none';
        angleControls.style.display = 'none';
        rulesSection.style.display = 'block'; // Show rules for other methods
    }
}

function updateDebugInfo() {
    const faceCountElement = document.getElementById('face-count') as HTMLSpanElement;
    if (faceCountElement && geodesicData) {
        const faceCount = geodesicData.faces.length;
        const vertexCount = geodesicData.vertices.length;
        faceCountElement.textContent = `${faceCount} faces, ${vertexCount} vertices`;
    }
}

// Angle control event handlers for Method 12
function setupAngleControls() {
    const middleLongSlider = document.getElementById('middle-long-angle') as HTMLInputElement;
    const middleLongValue = document.getElementById('middle-long-value') as HTMLSpanElement;

    const middleShortSlider = document.getElementById('middle-short-angle') as HTMLInputElement;
    const middleShortValue = document.getElementById('middle-short-value') as HTMLSpanElement;

    const bottomLongSlider = document.getElementById('bottom-long-angle') as HTMLInputElement;
    const bottomLongValue = document.getElementById('bottom-long-value') as HTMLSpanElement;

    const bottomShortSlider = document.getElementById('bottom-short-angle') as HTMLInputElement;
    const bottomShortValue = document.getElementById('bottom-short-value') as HTMLSpanElement;

    const resetButton = document.getElementById('reset-angles') as HTMLButtonElement;
    const loadButton = document.getElementById('load-angles') as HTMLButtonElement;
    const saveButton = document.getElementById('save-angles') as HTMLButtonElement;

    // Load current angles and update UI
    const angles = getAngles();
    middleLongSlider.value = angles.middleLong.toString();
    middleLongValue.textContent = `${angles.middleLong}°`;

    middleShortSlider.value = angles.middleShort.toString();
    middleShortValue.textContent = `${angles.middleShort}°`;

    bottomLongSlider.value = angles.bottomLong.toString();
    bottomLongValue.textContent = `${angles.bottomLong}°`;

    bottomShortSlider.value = angles.bottomShort.toString();
    bottomShortValue.textContent = `${angles.bottomShort}°`;

    // Middle LONG angle
    middleLongSlider.addEventListener('input', () => {
        const value = parseInt(middleLongSlider.value);
        middleLongValue.textContent = `${value}°`;
        setMiddleLongAngle(value);
        rebuildDome();
    });

    // Middle SHORT angle
    middleShortSlider.addEventListener('input', () => {
        const value = parseInt(middleShortSlider.value);
        middleShortValue.textContent = `${value}°`;
        setMiddleShortAngle(value);
        rebuildDome();
    });

    // Bottom LONG angle
    bottomLongSlider.addEventListener('input', () => {
        const value = parseInt(bottomLongSlider.value);
        bottomLongValue.textContent = `${value}°`;
        setBottomLongAngle(value);
        rebuildDome();
    });

    // Bottom SHORT angle
    bottomShortSlider.addEventListener('input', () => {
        const value = parseInt(bottomShortSlider.value);
        bottomShortValue.textContent = `${value}°`;
        setBottomShortAngle(value);
        rebuildDome();
    });

    // Reset button - restore to default values
    resetButton.addEventListener('click', () => {
        middleLongSlider.value = '30';
        middleLongValue.textContent = '30°';
        setMiddleLongAngle(30);

        middleShortSlider.value = '35';
        middleShortValue.textContent = '35°';
        setMiddleShortAngle(35);

        bottomLongSlider.value = '30';
        bottomLongValue.textContent = '30°';
        setBottomLongAngle(30);

        bottomShortSlider.value = '90';
        bottomShortValue.textContent = '90°';
        setBottomShortAngle(90);

        rebuildDome();
    });

    // Load button - reload saved angles from localStorage
    loadButton.addEventListener('click', () => {
        // First, reload angles from localStorage into the module
        loadAnglesFromStorage();

        // Then get the newly loaded angles
        const angles = getAngles();

        middleLongSlider.value = angles.middleLong.toString();
        middleLongValue.textContent = `${angles.middleLong}°`;
        setMiddleLongAngle(angles.middleLong);

        middleShortSlider.value = angles.middleShort.toString();
        middleShortValue.textContent = `${angles.middleShort}°`;
        setMiddleShortAngle(angles.middleShort);

        bottomLongSlider.value = angles.bottomLong.toString();
        bottomLongValue.textContent = `${angles.bottomLong}°`;
        setBottomLongAngle(angles.bottomLong);

        bottomShortSlider.value = angles.bottomShort.toString();
        bottomShortValue.textContent = `${angles.bottomShort}°`;
        setBottomShortAngle(angles.bottomShort);

        rebuildDome();
        alert('Saved angles loaded successfully!');
    });

    // Save button - save current angles to localStorage
    saveButton.addEventListener('click', () => {
        saveAnglesToStorage();
        alert('Angles saved successfully!');
    });
}

// Start the application
animate();

// Initialize app AFTER building dome visuals
async function startApp() {
    // Hide info panel unless in debug mode
    const infoPanel = document.getElementById('info') as HTMLDivElement;
    if (infoPanel) {
        if (!debugMode) {
            infoPanel.style.display = 'none';
            console.log('Info panel hidden (not in debug mode)');
        } else {
            infoPanel.style.display = 'block';
            console.log('Info panel visible (debug mode active)');
        }
    }

    await initializeApp();

    // Setup email controls (always visible)
    setupEmailControls();

    // Only setup controls in debug mode
    if (debugMode) {
        setupMethodSelector();
        setupStepControls();
        setupAngleControls();
        updateDebugInfo(); // Show initial face count
    }
}

startApp();
