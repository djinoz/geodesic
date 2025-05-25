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

// Create true 2V geodesic dome with correct structure
function create2VGeodesicDome(radius: number) {
    const vertices: THREE.Vector3[] = [];
    const faces: number[][] = [];
    
    // True 2V geodesic dome has specific vertex pattern:
    // 1 top vertex + 5 ring vertices + 10 base vertices = 16 total
    
    // Top vertex (apex)
    vertices.push(new THREE.Vector3(0, radius, 0)); // 0
    
    // First ring: 5 vertices at upper level
    const firstRingY = radius * 0.618; // Golden ratio height
    const firstRingRadius = radius * 0.786;
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new THREE.Vector3(
            firstRingRadius * Math.cos(angle),
            firstRingY,
            firstRingRadius * Math.sin(angle)
        )); // 1-5
    }
    
    // Second ring: 10 vertices at base level
    const baseY = 0;
    const baseRadius = radius;
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        vertices.push(new THREE.Vector3(
            baseRadius * Math.cos(angle),
            baseY,
            baseRadius * Math.sin(angle)
        )); // 6-15
    }
    
    // Create faces for 2V geodesic pattern
    
    // Top cap: 5 triangles from apex to first ring
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([0, i + 1, next + 1]);
    }
    
    // Middle band: connect first ring to base ring
    // Each first ring vertex connects to 2 base vertices
    for (let i = 0; i < 5; i++) {
        const firstVertex = i + 1;
        const nextFirst = ((i + 1) % 5) + 1;
        
        // Each first ring vertex connects to 2 base vertices
        const baseStart = i * 2 + 6;
        const baseMid = ((i * 2 + 1) % 10) + 6;
        const baseEnd = ((i * 2 + 2) % 10) + 6;
        
        // Create 2 triangles per segment
        faces.push([firstVertex, baseStart, baseMid]);
        faces.push([firstVertex, baseMid, nextFirst]);
        faces.push([nextFirst, baseMid, baseEnd]);
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

// --- Helper function to get face centroid and normal for BufferGeometry ---
function getFaceCentroidAndNormal(geom: THREE.BufferGeometry, faceIdx: number): { centroid: THREE.Vector3; normal: THREE.Vector3 } | null {
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const indexAttr = geom.index;

    if (!indexAttr) {
        console.warn("Geometry is not indexed. Cannot reliably get face centroid by faceIndex.");
        return null;
    }

    const idxA = indexAttr.getX(faceIdx * 3);
    const idxB = indexAttr.getX(faceIdx * 3 + 1);
    const idxC = indexAttr.getX(faceIdx * 3 + 2);

    const vA = new THREE.Vector3().fromBufferAttribute(posAttr, idxA);
    const vB = new THREE.Vector3().fromBufferAttribute(posAttr, idxB);
    const vC = new THREE.Vector3().fromBufferAttribute(posAttr, idxC);

    const centroid = new THREE.Vector3().add(vA).add(vB).add(vC).divideScalar(3);
    
    // Calculate face normal
    const cb = new THREE.Vector3().subVectors(vC, vB);
    const ab = new THREE.Vector3().subVectors(vA, vB);
    const normal = new THREE.Vector3().crossVectors(cb, ab).normalize();
    
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
    return worldNormal.dot(cameraDirection) > 0;
}

// Function to update visibility of all labels
function updateLabelVisibility() {
    faceLabels.forEach((label, faceIndex) => {
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

        const faceData = getFaceCentroidAndNormal(domeMesh.geometry as THREE.BufferGeometry, faceIndex);
        if (faceData) {
            const { centroid, normal } = faceData;
            
            // Offset the label slightly away from the face surface along the normal
            const labelOffset = 0.1; // Distance to offset the label from the face
            const labelPosition = centroid.clone().add(normal.multiplyScalar(labelOffset));
            
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

// Initialize the application
async function initializeApp() {
    // Load saved notes from localStorage
    loadFaceDataFromStorage();
    
    // Load initial data file (only for faces without saved data)
    await loadInitialFaceData();
    
    // Create labels for all loaded data
    faceData.forEach((text, index) => updateFaceLabel(index, text));
    
    console.log("Geodesic Dome App Initialized (Hemisphere version)");
}

// Start the application
animate();
initializeApp();
