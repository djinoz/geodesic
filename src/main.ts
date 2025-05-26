import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { initModal, showModal, ModalElements } from './ui';

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

// Create true 2V geodesic dome with correct 4-layer structure
function create2VGeodesicDome(radius: number) {
    const vertices: THREE.Vector3[] = [];
    const faces: number[][] = [];
    
    // True 2V geodesic dome has 4 layers:
    // Layer 1: 1 top vertex
    // Layer 2: 5 vertices 
    // Layer 3: 10 vertices
    // Layer 4: 10 base vertices (4 connections each)
    
    // Layer 1: Top vertex (apex)
    vertices.push(new THREE.Vector3(0, radius, 0)); // 0
    
    // Layer 2: First ring - 5 vertices
    const layer2Y = radius * 0.809; // Higher up for 4-layer structure
    const layer2Radius = radius * 0.588;
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(
            layer2Radius * Math.cos(angle),
            layer2Y,
            layer2Radius * Math.sin(angle)
        )); // 1-5
    }
    
    // Layer 3: Second ring - 10 vertices (intermediate)
    const layer3Y = radius * 0.309; // Mid-height
    const layer3Radius = radius * 0.951;
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        vertices.push(new THREE.Vector3(
            layer3Radius * Math.cos(angle),
            layer3Y,
            layer3Radius * Math.sin(angle)
        )); // 6-15
    }
    
    // Layer 4: Base ring - 10 vertices (only 4 connections each)
    const baseY = 0;
    const baseRadius = radius;
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        vertices.push(new THREE.Vector3(
            baseRadius * Math.cos(angle),
            baseY,
            baseRadius * Math.sin(angle)
        )); // 16-25
    }
    
    // Create faces for proper 2V geodesic pattern
    
    // Top cap: 5 triangles from apex to layer 2
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([0, i + 1, next + 1]);
    }
    
    // Connect layer 2 (5 vertices) to layer 3 (10 vertices)
    for (let i = 0; i < 5; i++) {
        const layer2Vertex = i + 1;
        const nextLayer2 = ((i + 1) % 5) + 1;
        
        // Each layer 2 vertex connects to 2 layer 3 vertices
        const layer3Vertex1 = i * 2 + 6;
        const layer3Vertex2 = (i * 2 + 1) % 10 + 6;
        const nextLayer3 = ((i + 1) * 2) % 10 + 6;
        
        faces.push([layer2Vertex, layer3Vertex1, layer3Vertex2]);
        faces.push([layer2Vertex, layer3Vertex2, nextLayer2]);
        faces.push([nextLayer2, layer3Vertex2, nextLayer3]);
    }
    
    // Connect layer 3 (10 vertices) to layer 4/base (10 vertices)
    // This creates the base vertices with only 4 connections each
    for (let i = 0; i < 10; i++) {
        const layer3Vertex = i + 6;
        const nextLayer3 = ((i + 1) % 10) + 6;
        const baseVertex = i + 16;
        const nextBaseVertex = ((i + 1) % 10) + 16;
        
        // Create 2 triangles per segment
        faces.push([layer3Vertex, baseVertex, nextBaseVertex]);
        faces.push([layer3Vertex, nextBaseVertex, nextLayer3]);
    }
    
    return { vertices, faces };
}

// Create the 2V geodesic dome
const geodesicData = create2VGeodesicDome(domeRadius);

// Convert to flat arrays for Three.js
const hemisphereVertices: number[] = [];
geodesicData.vertices.forEach(v => {
    hemisphereVertices.push(v.x, v.y, v.z);
});

const hemisphereFaces: number[] = [];
geodesicData.faces.forEach(face => {
    hemisphereFaces.push(...face);
});

console.log(`Created 2V geodesic dome with ${geodesicData.vertices.length} vertices and ${geodesicData.faces.length} faces`);

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
vertexConnections.forEach((connections, vertex) => {
    const y = geodesicData.vertices[vertex].y;
    const connectionCount = connections.size;
    console.log(`Vertex ${vertex} (y=${y.toFixed(2)}): ${connectionCount} connections`);
});

// Create the hemisphere geometry
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(hemisphereVertices, 3));
geometry.setIndex(hemisphereFaces);
geometry.computeVertexNormals();

const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    flatShading: true,
    side: THREE.DoubleSide, // Render inside for hemisphere effect if camera goes low
});

const domeMesh = new THREE.Mesh(geometry, material);
domeMesh.name = "geodesicDome"; // For debugging raycaster
scene.add(domeMesh);

// Wireframe for the hemisphere
const wireframeGeometry = new THREE.WireframeGeometry(geometry);
const wireframeMaterial = new THREE.LineBasicMaterial({
    color: 0x333333,
    linewidth: 1, // Note: linewidth might be limited by WebGL implementation
});
const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
domeMesh.add(wireframe);

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
const STORAGE_KEY = 'geodesic-dome-notes';
const faceData = new Map<number, string>(); // Key: faceIndex (triangle index), Value: note text
const faceLabels = new Map<number, CSS2DObject>(); // Key: faceIndex, Value: CSS2DObject label

// --- Persistence Functions ---
function saveFaceDataToStorage(): void {
    const dataObject = Object.fromEntries(faceData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataObject));
}

function loadFaceDataFromStorage(): void {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const dataObject = JSON.parse(storedData);
            faceData.clear();
            Object.entries(dataObject).forEach(([key, value]) => {
                faceData.set(parseInt(key), value as string);
            });
            console.log(`Loaded ${faceData.size} saved notes from storage`);
        }
    } catch (error) {
        console.warn('Failed to load face data from storage:', error);
    }
}

async function loadInitialFaceData(): Promise<void> {
    try {
        const response = await fetch('/src/initial-data.json');
        const initialData = await response.json();
        
        // Only load initial data for faces that don't already have user data
        Object.entries(initialData).forEach(([key, value]) => {
            const faceIndex = parseInt(key);
            if (!faceData.has(faceIndex)) {
                faceData.set(faceIndex, value as string);
            }
        });
        console.log(`Loaded initial data for ${Object.keys(initialData).length} faces`);
    } catch (error) {
        console.warn('Failed to load initial face data:', error);
    }
}

// --- Modal UI Elements ---
const modalElements: ModalElements = {
    modal: document.getElementById('textModal') as HTMLDivElement,
    closeButton: document.querySelector('.close-button') as HTMLSpanElement,
    modalTitle: document.getElementById('modalTitle') as HTMLHeadingElement,
    existingTextElement: document.getElementById('modalExistingText') as HTMLParagraphElement,
    textInput: document.getElementById('modalTextInput') as HTMLTextAreaElement,
    saveButton: document.getElementById('saveTextButton') as HTMLButtonElement,
    clearButton: document.getElementById('clearTextButton') as HTMLButtonElement,
};

// --- Helper function to get face centroid and normal for our custom geometry ---
function getFaceCentroidAndNormal(geom: THREE.BufferGeometry, faceIdx: number): { centroid: THREE.Vector3; normal: THREE.Vector3 } | null {
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const indexAttr = geom.index;

    if (!indexAttr) {
        console.warn("Geometry is not indexed. Cannot reliably get face centroid by faceIndex.");
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
    
    const { centroid, normal } = faceData;
    
    // Transform centroid to world coordinates
    const worldCentroid = centroid.clone();
    domeMesh.localToWorld(worldCentroid);
    
    // Transform normal to world coordinates (without translation)
    const worldNormal = normal.clone();
    worldNormal.transformDirection(domeMesh.matrixWorld);
    
    // Vector from face centroid to camera
    const cameraDirection = new THREE.Vector3().subVectors(camera.position, worldCentroid).normalize();
    
    // Face is visible if the normal points towards the camera (dot product > 0)
    // Use a more robust threshold to ensure only front-facing faces are visible
    const dotProduct = worldNormal.dot(cameraDirection);
    
    // Debug log for troubleshooting
    // if (faceIdx >= 12 && faceIdx <= 16) {
    //    console.log(`Face ${faceIdx}: dot=${dotProduct.toFixed(3)}, visible=${dotProduct > 0.1}`);
    // }
    
    return dotProduct > 0.1; // Face is visible if normal points toward camera
}

// Store face number labels for visibility updates
const faceNumberLabels: CSS2DObject[] = [];

// Function to update visibility of all labels (both user notes and face numbers)
function updateLabelVisibility() {
    // Update user note labels
    faceLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(domeMesh.geometry as THREE.BufferGeometry, faceIndex, camera);
        label.visible = visible;
    });
    
    // Update face number labels
    faceNumberLabels.forEach((label, faceIndex) => {
        const visible = isFaceVisible(domeMesh.geometry as THREE.BufferGeometry, faceIndex, camera);
        label.visible = visible;
    });
}

function updateFaceLabel(faceIndex: number, text?: string) {
    // Remove existing label if any
    if (faceLabels.has(faceIndex)) {
        const oldLabel = faceLabels.get(faceIndex);
        oldLabel?.removeFromParent(); // Remove from scene graph
        oldLabel?.element?.remove(); // Remove HTML element
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

        const faceData = getFaceCentroidAndNormal(domeMesh.geometry as THREE.BufferGeometry, faceIndex);
        if (faceData) {
            const { centroid, normal } = faceData;
            
            // Center the label at the face centroid with slight offset for user labels
            const labelOffset = 0.08; // Closer to face surface for user labels
            const labelPosition = centroid.clone().add(normal.clone().multiplyScalar(labelOffset));
            
            const label = new CSS2DObject(labelDiv);
            label.position.copy(labelPosition);
            
            // Add label as a child of the dome mesh so it moves with it
            domeMesh.add(label);
            faceLabels.set(faceIndex, label);
        } else {
            console.warn(`Could not get centroid for faceIndex ${faceIndex} to place label.`);
        }
    }
}


function onSaveFaceText(faceIndex: number, text: string): void {
    const trimmedText = text.trim();
    if (trimmedText) {
        faceData.set(faceIndex, trimmedText);
        console.log(`Saved text for face ${faceIndex}: "${trimmedText}"`);
    } else {
        faceData.delete(faceIndex);
        console.log(`Cleared text for face ${faceIndex}`);
    }
    updateFaceLabel(faceIndex, trimmedText);
    saveFaceDataToStorage(); // Persist to localStorage
}

function onClearFaceText(faceIndex: number): void {
    faceData.delete(faceIndex);
    console.log(`Cleared text for face ${faceIndex}`);
    updateFaceLabel(faceIndex, undefined); // Remove label
    saveFaceDataToStorage(); // Persist to localStorage
}

initModal(modalElements, onSaveFaceText, onClearFaceText);

// --- Event Listeners ---
function onDoubleClick(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(domeMesh, false); // false for not recursive

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
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); // Render labels
}

// Add face numbers for debugging
function addFaceNumbers() {
    const totalFaces = geodesicData.faces.length;
    
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
        const faceData = getFaceCentroidAndNormal(geometry, faceIndex);
        if (faceData) {
            const { centroid, normal } = faceData;
            
            // Create face number label
            const labelDiv = document.createElement('div');
            labelDiv.className = 'face-number-label';
            labelDiv.textContent = faceIndex.toString();
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
            const localUp = worldUp.clone().transformDirection(domeMesh.matrixWorld.clone().invert());
            const upOffset = localUp.multiplyScalar(0.08); // Move up relative to dome orientation
            
            const numberPosition = centroid.clone()
                .add(normal.clone().multiplyScalar(numberOffset))
                .add(upOffset);
            
            const label = new CSS2DObject(labelDiv);
            label.position.copy(numberPosition);
            
            // Add label as child of dome mesh so it rotates with the dome
            domeMesh.add(label);
            
            // Store in array for visibility updates
            faceNumberLabels[faceIndex] = label;
        }
    }
}

// Initialize the application
async function initializeApp() {
    // Load saved notes from localStorage
    loadFaceDataFromStorage();
    
    // Load initial data file (only for faces without saved data)
    await loadInitialFaceData();
    
    // Create labels for all loaded data
    faceData.forEach((text, index) => updateFaceLabel(index, text));
    
    // Add face numbers for debugging
    addFaceNumbers();
    
    console.log("Geodesic Dome App Initialized (Hemisphere version)");
}

// Start the application
animate();
initializeApp();
