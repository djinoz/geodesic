import * as THREE from 'three';
// Method 12: Interactive step-by-step construction following kit instructions
// Build one step at a time, verify visually at each stage
//
// This method will expose build steps that can be controlled interactively
// So we can verify each step matches the physical construction
//
// Color convention:
// - Current SHORT edges: RED
// - Current LONG edges: BLUE
// - Approved edges (from previous steps): BLACK
// Global state for interactive building
let currentBuildStep = 1;
const maxBuildSteps = 8;
const STEP_STORAGE_KEY = 'geodesic-dome-step';
// Adjustable angles (in degrees)
let middleLongAngle = 30; // Step 3: topRing to secondRing (LONG)
let middleShortAngle = 35; // Step 4: topRing to thirdRing (SHORT)
let bottomLongAngle = 30; // Step 6/7: LONG struts to base
let bottomShortAngle = 90; // Step 6/7: SHORT struts to base
const ANGLES_STORAGE_KEY = 'geodesic-dome-angles';
// Check if we're in debug mode
function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === 'true';
}
// Load step from localStorage
function loadStepFromStorage() {
    // If not in debug mode, always use step 8 (final step)
    if (!isDebugMode()) {
        currentBuildStep = maxBuildSteps; // Force to step 8
        console.log('Non-debug mode: forcing step to 8 (final dome)');
        return;
    }
    // In debug mode, load from storage as normal
    try {
        const storedStep = localStorage.getItem(STEP_STORAGE_KEY);
        if (storedStep) {
            const parsedStep = parseInt(storedStep);
            if (parsedStep >= 1 && parsedStep <= maxBuildSteps) {
                currentBuildStep = parsedStep;
            }
        }
    }
    catch (error) {
        console.warn('Failed to load step from storage:', error);
    }
}
// Save step to localStorage
function saveStepToStorage() {
    try {
        localStorage.setItem(STEP_STORAGE_KEY, currentBuildStep.toString());
    }
    catch (error) {
        console.warn('Failed to save step to storage:', error);
    }
}
// Load angles from localStorage
export function loadAnglesFromStorage() {
    try {
        const storedAngles = localStorage.getItem(ANGLES_STORAGE_KEY);
        if (storedAngles) {
            const angles = JSON.parse(storedAngles);
            if (angles.middleLong !== undefined)
                middleLongAngle = angles.middleLong;
            if (angles.middleShort !== undefined)
                middleShortAngle = angles.middleShort;
            if (angles.bottomLong !== undefined)
                bottomLongAngle = angles.bottomLong;
            if (angles.bottomShort !== undefined)
                bottomShortAngle = angles.bottomShort;
        }
    }
    catch (error) {
        console.warn('Failed to load angles from storage:', error);
    }
}
// Save angles to localStorage
export function saveAnglesToStorage() {
    try {
        const angles = {
            middleLong: middleLongAngle,
            middleShort: middleShortAngle,
            bottomLong: bottomLongAngle,
            bottomShort: bottomShortAngle
        };
        localStorage.setItem(ANGLES_STORAGE_KEY, JSON.stringify(angles));
        console.log('Angles saved:', angles);
    }
    catch (error) {
        console.warn('Failed to save angles to storage:', error);
    }
}
// Initialize step and angles from storage on module load
loadStepFromStorage();
loadAnglesFromStorage();
export function getCurrentStep() {
    return currentBuildStep;
}
export function getMaxSteps() {
    return maxBuildSteps;
}
export function setCurrentStep(step) {
    currentBuildStep = Math.max(1, Math.min(step, maxBuildSteps));
    saveStepToStorage();
}
export function nextStep() {
    if (currentBuildStep < maxBuildSteps) {
        currentBuildStep++;
        saveStepToStorage();
    }
}
export function previousStep() {
    if (currentBuildStep > 1) {
        currentBuildStep--;
        saveStepToStorage();
    }
}
// Angle setters
export function setMiddleLongAngle(degrees) {
    middleLongAngle = degrees;
}
export function setMiddleShortAngle(degrees) {
    middleShortAngle = degrees;
}
export function setBottomLongAngle(degrees) {
    bottomLongAngle = degrees;
}
export function setBottomShortAngle(degrees) {
    bottomShortAngle = degrees;
}
// Angle getters
export function getAngles() {
    return {
        middleLong: middleLongAngle,
        middleShort: middleShortAngle,
        bottomLong: bottomLongAngle,
        bottomShort: bottomShortAngle
    };
}
// Helper function to find intersection point of two spheres
// Returns a point that lies at distance d1 from v1 and distance d2 from v2
// The angleParam controls which point on the intersection circle to select (0 = most downward, PI = most upward)
function calculateSphereIntersectionPoint(v1, d1, v2, d2, preference, angleParam) {
    // Vector from v1 to v2
    const v1v2 = new THREE.Vector3().subVectors(v2, v1);
    const dist = v1v2.length();
    // Check if spheres intersect
    if (dist > d1 + d2 || dist < Math.abs(d1 - d2)) {
        console.warn(`Spheres don't intersect properly: dist=${dist.toFixed(3)}, d1=${d1.toFixed(3)}, d2=${d2.toFixed(3)}`);
        // Return midpoint as fallback
        return new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
    }
    // Distance from v1 to the plane perpendicular to v1v2 that contains the intersection circle
    const a = (d1 * d1 - d2 * d2 + dist * dist) / (2 * dist);
    // Center of the intersection circle
    const direction = v1v2.clone().normalize();
    const circleCenter = v1.clone().add(direction.multiplyScalar(a));
    // Radius of the intersection circle
    const h = Math.sqrt(d1 * d1 - a * a);
    // Find a vector perpendicular to v1v2 to define the circle
    // Use the vector that points most downward (or upward based on preference)
    let perpendicular;
    // If v1v2 is roughly horizontal, use downward vector
    if (Math.abs(direction.y) < 0.9) {
        perpendicular = new THREE.Vector3(0, -1, 0);
    }
    else {
        // If v1v2 is roughly vertical, use a horizontal vector
        perpendicular = new THREE.Vector3(1, 0, 0);
    }
    // Make perpendicular actually perpendicular to direction
    perpendicular.sub(direction.clone().multiplyScalar(perpendicular.dot(direction)));
    perpendicular.normalize();
    // If angleParam is provided, use it to select a point on the circle
    // Otherwise use the simple lower/upper preference
    if (angleParam !== undefined) {
        // We want the perpendicular to be as vertical as possible
        // perpendicular already points "most downward" while staying in the circle's plane
        // Create a second perpendicular vector in the circle's plane
        // This one is perpendicular to both 'direction' and 'perpendicular'
        const perpendicular2 = new THREE.Vector3().crossVectors(direction, perpendicular).normalize();
        // Now we can parameterize points on the circle as:
        // circleCenter + h * (cos(θ) * perpendicular + sin(θ) * perpendicular2)
        // We want to find θ such that the vertical angle from v1 to the point matches angleParam
        // The perpendicular vector points "most downward", so we use that primarily
        // and add some perpendicular2 component to achieve the exact angle
        // For simplicity, we'll use the angle directly to control the mix
        // When angleParam = 90° (π/2), we want maximum downward (perpendicular only)
        // When angleParam = 0°, we want more horizontal (more perpendicular2)
        // Map angle from [0, π/2] to rotation around circle
        // Higher angle = more downward component
        const downwardWeight = Math.sin(angleParam); // 0 at 0°, 1 at 90°
        const horizontalWeight = Math.cos(angleParam); // 1 at 0°, 0 at 90°
        // The perpendicular points downward, perpendicular2 is more horizontal
        // We want to rotate in the circle's plane to achieve the desired angle
        const intersectionPoint = circleCenter.clone()
            .add(perpendicular.clone().multiplyScalar(h * downwardWeight))
            .add(perpendicular2.clone().multiplyScalar(h * horizontalWeight * (preference === 'lower' ? 1 : -1)));
        return intersectionPoint;
    }
    else {
        // The intersection point we want (prefer lower y value for downward petals)
        const intersectionPoint = circleCenter.clone().add(perpendicular.multiplyScalar(h * (preference === 'lower' ? 1 : -1)));
        return intersectionPoint;
    }
}
// Helper function to calculate endpoint position on ground plane
// Returns a point at y=0 that is at distance d from vertex v
function calculateGroundPlaneIntersection(v, d, angle) {
    // Point must satisfy:
    // 1. y = 0 (on ground)
    // 2. distance from v = d
    // 3. at angular position 'angle' (approximately)
    // From v to point: (x - v.x)² + (0 - v.y)² + (z - v.z)² = d²
    // We want: x = r*cos(angle), z = r*sin(angle)
    // So: (r*cos(angle) - v.x)² + v.y² + (r*sin(angle) - v.z)² = d²
    // Expand:
    // r²*cos²(angle) - 2*r*v.x*cos(angle) + v.x² + v.y² + r²*sin²(angle) - 2*r*v.z*sin(angle) + v.z² = d²
    // r² - 2*r*(v.x*cos(angle) + v.z*sin(angle)) + (v.x² + v.y² + v.z²) = d²
    // r² - 2*r*k + |v|² = d²  where k = v.x*cos(angle) + v.z*sin(angle)
    const k = v.x * Math.cos(angle) + v.z * Math.sin(angle);
    const vLengthSq = v.lengthSq();
    // Solve quadratic: r² - 2*k*r + (|v|² - d²) = 0
    const discriminant = 4 * k * k - 4 * (vLengthSq - d * d);
    if (discriminant < 0) {
        console.warn(`No intersection with ground plane: v.y=${v.y.toFixed(3)}, d=${d.toFixed(3)}`);
        // Fallback: project v onto ground and scale to radius
        const groundRadius = Math.sqrt(Math.max(0, d * d - v.y * v.y));
        return new THREE.Vector3(groundRadius * Math.cos(angle), 0, groundRadius * Math.sin(angle));
    }
    // Take the positive solution (larger radius, pointing outward)
    const r = (2 * k + Math.sqrt(discriminant)) / 2;
    return new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle));
}
export default function create2VGeodesicDomeMethod12(radius) {
    console.log(`\n=== Method 12: Interactive Build - Step ${currentBuildStep} of ${maxBuildSteps} ===`);
    const SHORT_LENGTH = 0.90; // 90mm normalized
    const LONG_LENGTH = 1.06; // 106mm normalized
    // Convert adjustable angles from degrees to radians
    const MIDDLE_LONG_ANGLE_RAD = middleLongAngle * Math.PI / 180;
    const MIDDLE_SHORT_ANGLE_RAD = middleShortAngle * Math.PI / 180;
    const BOTTOM_LONG_ANGLE_RAD = bottomLongAngle * Math.PI / 180;
    const BOTTOM_SHORT_ANGLE_RAD = bottomShortAngle * Math.PI / 180;
    const vertices = [];
    const edges = []; // Added step number to track when edge was created
    const addVertex = (x, y, z) => {
        vertices.push(new THREE.Vector3(x, y, z));
        return vertices.length - 1;
    };
    const addEdge = (v1, v2, type, step) => {
        edges.push([v1, v2, type, step]);
    };
    // STEP 1: 5-socket hub + 5 SHORT radial struts (Kit Step 1)
    // Just the radial struts - NO perimeter edges yet
    console.log('Step 1: 5-socket hub + 5 SHORT struts arranged in a star');
    const apexHub = addVertex(0, radius, 0);
    const topRing = [];
    // Create 5 vertices around apex for the pentagon
    // Position vertices so they're SHORT_LENGTH away from hub in 3D space
    const pentagonRadius = SHORT_LENGTH; // Horizontal distance component
    const pentagonHeight = radius - 0.1; // Slightly below apex
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const v = addVertex(pentagonRadius * Math.cos(angle), pentagonHeight, pentagonRadius * Math.sin(angle));
        topRing.push(v);
    }
    // Step 1: Add only 5 hub struts (SHORT) - no perimeter edges yet!
    for (let i = 0; i < 5; i++) {
        addEdge(apexHub, topRing[i], 'SHORT', 1);
    }
    if (currentBuildStep === 1) {
        console.log('✓ Step 1 complete: 5 SHORT radial struts from hub (no perimeter yet)');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for debugging
        const strutLengths = [];
        for (let i = 0; i < 5; i++) {
            const len = vertices[apexHub].distanceTo(vertices[topRing[i]]);
            strutLengths.push({
                v1: apexHub,
                v2: topRing[i],
                label: `Apex-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            strutLengths: strutLengths
        });
    }
    // STEP 2: Add 5 LONG perimeter edges (Kit Step 2)
    // This completes the pentagon star
    console.log('Step 2: Add 5 LONG perimeter edges to complete pentagon');
    // Add pentagon perimeter edges (LONG)
    for (let i = 0; i < 5; i++) {
        addEdge(topRing[i], topRing[(i + 1) % 5], 'LONG', 2);
    }
    if (currentBuildStep === 2) {
        console.log('✓ Step 2 complete: Added 5 LONG perimeter edges, pentagon star complete');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for debugging
        const strutLengths = [];
        // Apex to top ring (SHORT)
        for (let i = 0; i < 5; i++) {
            const len = vertices[apexHub].distanceTo(vertices[topRing[i]]);
            strutLengths.push({
                v1: apexHub,
                v2: topRing[i],
                label: `Apex-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Top ring perimeter (LONG)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[topRing[(i + 1) % 5]]);
            strutLengths.push({
                v1: topRing[i],
                v2: topRing[(i + 1) % 5],
                label: `Perim-${i}(LONG)`,
                actualLength: len,
                expectedLength: LONG_LENGTH
            });
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            strutLengths: strutLengths
        });
    }
    // STEP 3: Add 6-socket hubs with LONG struts expanding outward (Kit Step 3)
    console.log('Step 3: Add 6-socket hubs with LONG struts expanding outward');
    const secondRing = [];
    // Create 5 new vertices positioned between adjacent topRing vertices
    // Each vertex must be EXACTLY LONG_LENGTH from both adjacent topRing vertices
    for (let i = 0; i < 5; i++) {
        const v1 = vertices[topRing[i]];
        const v2 = vertices[topRing[(i + 1) % 5]];
        // Use sphere intersection to find a point that is:
        // - LONG_LENGTH from v1
        // - LONG_LENGTH from v2
        // - Positioned at the angle specified by MIDDLE_LONG_ANGLE_RAD
        const newPos = calculateSphereIntersectionPoint(v1, LONG_LENGTH, v2, LONG_LENGTH, 'lower', MIDDLE_LONG_ANGLE_RAD);
        const v = addVertex(newPos.x, newPos.y, newPos.z);
        secondRing.push(v);
        // Connect with LONG edges to adjacent top ring vertices (creates the expansion)
        addEdge(topRing[i], v, 'LONG', 3);
        addEdge(topRing[(i + 1) % 5], v, 'LONG', 3);
    }
    if (currentBuildStep === 3) {
        console.log('✓ Step 3 complete: Added 5 vertices (6-socket hubs) + 10 LONG edges');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for debugging
        const strutLengths = [];
        let strutCounter = 0;
        // Step 3 LONG edges
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[topRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: secondRing[i],
                label: `S${strutCounter++}(LONG)`,
                actualLength: len1,
                expectedLength: LONG_LENGTH
            });
            const len2 = vertices[topRing[(i + 1) % 5]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[(i + 1) % 5],
                v2: secondRing[i],
                label: `S${strutCounter++}(LONG)`,
                actualLength: len2,
                expectedLength: LONG_LENGTH
            });
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            strutLengths: strutLengths
        });
    }
    // STEP 4: Add 5 SHORT edges from top pentagon perimeter vertices
    // These radiate outward at angles that bisect the LONG edges from Step 3
    console.log('Step 4: Add 5 SHORT edges from top pentagon perimeter radiating outward');
    const thirdRing = [];
    // Create 5 new vertices radiating from topRing vertices
    // Position them EXACTLY SHORT_LENGTH away from topRing vertices
    for (let i = 0; i < 5; i++) {
        const startVertex = vertices[topRing[i]];
        // Direction: radially outward and downward
        // Use same radial angle as topRing[i], but angle downward at 60 degrees for SHORT struts
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        // Create direction vector pointing outward and down using MIDDLE_SHORT_ANGLE_RAD
        const direction = new THREE.Vector3(Math.cos(angle) * Math.cos(MIDDLE_SHORT_ANGLE_RAD), -Math.sin(MIDDLE_SHORT_ANGLE_RAD), Math.sin(angle) * Math.cos(MIDDLE_SHORT_ANGLE_RAD)).normalize();
        // Position new vertex exactly SHORT_LENGTH away
        const newPos = startVertex.clone().add(direction.multiplyScalar(SHORT_LENGTH));
        const v = addVertex(newPos.x, newPos.y, newPos.z);
        thirdRing.push(v);
        // Connect with SHORT edge FROM topRing
        addEdge(topRing[i], v, 'SHORT', 4);
    }
    if (currentBuildStep === 4) {
        console.log('✓ Step 4 complete: Added 5 vertices + 5 SHORT edges');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for debugging
        const strutLengths = [];
        // Step 4 SHORT edges
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[thirdRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: thirdRing[i],
                label: `S${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            strutLengths: strutLengths
        });
    }
    // STEP 5: Add 10 SHORT edges connecting thirdRing (Step 4 ends) to secondRing (Step 3 vertices)
    // This creates the middle perimeter closed ring
    console.log('Step 5: Add 10 SHORT edges connecting Step 4 ends to Step 3 vertices');
    // Connect each thirdRing vertex to its two adjacent secondRing vertices
    // This creates a closed ring in the middle level
    for (let i = 0; i < 5; i++) {
        // Each thirdRing[i] connects to secondRing[i] and secondRing[(i-1+5)%5]
        addEdge(thirdRing[i], secondRing[i], 'SHORT', 5);
        addEdge(thirdRing[i], secondRing[(i - 1 + 5) % 5], 'SHORT', 5);
    }
    if (currentBuildStep === 5) {
        console.log('✓ Step 5 complete: Added 10 SHORT edges forming closed middle ring');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for debugging
        const strutLengths = [];
        // Step 5 SHORT edges - numbered sequentially anti-clockwise
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[i],
                label: `St5-${i * 2}(SHORT)`,
                actualLength: len1,
                expectedLength: SHORT_LENGTH
            });
            const len2 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[(i - 1 + 5) % 5]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[(i - 1 + 5) % 5],
                label: `St5-${i * 2 + 1}(SHORT)`,
                actualLength: len2,
                expectedLength: SHORT_LENGTH
            });
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            strutLengths: strutLengths
        });
    }
    // STEP 6: Add struts from ring vertices to shared outer endpoints
    // The outer endpoints are shared between adjacent ring vertices
    console.log('Step 6: Add struts to shared outer endpoints');
    // First, sort ring vertices counter-clockwise to establish ordering
    const tempRingVertices = [];
    for (let i = 0; i < 5; i++) {
        const secondVertex = vertices[secondRing[i]];
        const secondAngle = Math.atan2(secondVertex.z, secondVertex.x);
        tempRingVertices.push({ vertexIndex: secondRing[i], angle: secondAngle, isShort: true });
        const thirdVertex = vertices[thirdRing[i]];
        const thirdAngle = Math.atan2(thirdVertex.z, thirdVertex.x);
        tempRingVertices.push({ vertexIndex: thirdRing[i], angle: thirdAngle, isShort: false });
    }
    tempRingVertices.sort((a, b) => a.angle - b.angle);
    // Create 10 shared outer endpoints positioned between ring vertices
    // After rotation, endpoint i connects to ring vertices (i+1)%10 and (i+2)%10
    // So we position endpoint i between those two vertices
    const sharedEndpoints = [];
    for (let i = 0; i < 10; i++) {
        // Endpoint i will connect to ring vertices at (i+1) and (i+2) after rotation
        const ring1 = tempRingVertices[(i + 1) % 10];
        const ring2 = tempRingVertices[(i + 2) % 10];
        const v1 = vertices[ring1.vertexIndex];
        const v2 = vertices[ring2.vertexIndex];
        // Required distances from each vertex
        const d1 = ring1.isShort ? SHORT_LENGTH : LONG_LENGTH;
        const d2 = ring2.isShort ? SHORT_LENGTH : LONG_LENGTH;
        // Determine which angle to use based on edge types
        // If both edges are SHORT, use BOTTOM_SHORT_ANGLE_RAD
        // If both edges are LONG, use BOTTOM_LONG_ANGLE_RAD
        // If mixed, use average
        let angleToUse;
        if (ring1.isShort && ring2.isShort) {
            angleToUse = BOTTOM_SHORT_ANGLE_RAD;
        }
        else if (!ring1.isShort && !ring2.isShort) {
            angleToUse = BOTTOM_LONG_ANGLE_RAD;
        }
        else {
            angleToUse = (BOTTOM_SHORT_ANGLE_RAD + BOTTOM_LONG_ANGLE_RAD) / 2;
        }
        // Calculate endpoint position using sphere intersection
        // The endpoint lies on the intersection of two spheres:
        // - Sphere 1: center v1, radius d1
        // - Sphere 2: center v2, radius d2
        // Find intersection point using the appropriate angle
        const endpoint = calculateSphereIntersectionPoint(v1, d1, v2, d2, 'lower', angleToUse);
        const endpointVertex = addVertex(endpoint.x, endpoint.y, endpoint.z);
        sharedEndpoints.push(endpointVertex);
    }
    // Connect each ring vertex to its two adjacent shared endpoints
    // Rotated by 1 position to avoid SHORT-SHORT patterns
    for (let i = 0; i < 10; i++) {
        const ringVertex = tempRingVertices[i].vertexIndex;
        const isShort = tempRingVertices[i].isShort;
        const edgeType = isShort ? 'SHORT' : 'LONG';
        // Shift connections by 1 position (was: i-1 and i, now: i-2 and i-1)
        const prevEndpoint = sharedEndpoints[(i - 2 + 10) % 10];
        const nextEndpoint = sharedEndpoints[(i - 1 + 10) % 10];
        addEdge(ringVertex, prevEndpoint, edgeType, 6);
        addEdge(ringVertex, nextEndpoint, edgeType, 6);
    }
    if (currentBuildStep === 6) {
        console.log('✓ Step 6 complete: Added 10 shared endpoints + 20 struts');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for ALL steps (cumulative debugging)
        const strutLengths = [];
        // Step 1 - Apex to top ring (SHORT)
        for (let i = 0; i < 5; i++) {
            const len = vertices[apexHub].distanceTo(vertices[topRing[i]]);
            strutLengths.push({
                v1: apexHub,
                v2: topRing[i],
                label: `St1-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 2 - Top ring perimeter (LONG)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[topRing[(i + 1) % 5]]);
            strutLengths.push({
                v1: topRing[i],
                v2: topRing[(i + 1) % 5],
                label: `St2-${i}(LONG)`,
                actualLength: len,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 3 LONG edges (top pentagon to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[topRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: secondRing[i],
                label: `St3-${i * 2}(LONG)`,
                actualLength: len1,
                expectedLength: LONG_LENGTH
            });
            const len2 = vertices[topRing[(i + 1) % 5]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[(i + 1) % 5],
                v2: secondRing[i],
                label: `St3-${i * 2 + 1}(LONG)`,
                actualLength: len2,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 4 SHORT edges (top pentagon to thirdRing)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[thirdRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: thirdRing[i],
                label: `St4-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 5 SHORT edges (thirdRing to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[i],
                label: `St5-${i * 2}(SHORT)`,
                actualLength: len1,
                expectedLength: SHORT_LENGTH
            });
            const len2 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[(i - 1 + 5) % 5]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[(i - 1 + 5) % 5],
                label: `St5-${i * 2 + 1}(SHORT)`,
                actualLength: len2,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 6 edges (ring to endpoints) - rotated by 1 position
        let strutCounter = 0;
        for (let i = 0; i < 10; i++) {
            const ringVertex = tempRingVertices[i].vertexIndex;
            const isShort = tempRingVertices[i].isShort;
            const expectedLength = isShort ? SHORT_LENGTH : LONG_LENGTH;
            const edgeType = isShort ? 'SHORT' : 'LONG';
            const prevEndpoint = sharedEndpoints[(i - 2 + 10) % 10];
            const nextEndpoint = sharedEndpoints[(i - 1 + 10) % 10];
            // Strut to previous endpoint
            const len1 = vertices[ringVertex].distanceTo(vertices[prevEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: prevEndpoint,
                label: `St6-${strutCounter++}(${edgeType})`,
                actualLength: len1,
                expectedLength: expectedLength
            });
            // Strut to next endpoint
            const len2 = vertices[ringVertex].distanceTo(vertices[nextEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: nextEndpoint,
                label: `St6-${strutCounter++}(${edgeType})`,
                actualLength: len2,
                expectedLength: expectedLength
            });
        }
        // Add base ring endpoint distances (adjacent endpoint pairs)
        // All base ring edges should be LONG (1.06) - these become Step 8 edges
        console.log('\n=== Base Ring Endpoint Distances (Step 6) ===');
        console.log(`Current angles: SHORT=${bottomShortAngle}°, LONG=${bottomLongAngle}°`);
        const baseDistances = [];
        for (let i = 0; i < 10; i++) {
            const currentEndpoint = sharedEndpoints[i];
            const nextEndpoint = sharedEndpoints[(i + 1) % 10];
            const distance = vertices[currentEndpoint].distanceTo(vertices[nextEndpoint]);
            baseDistances.push(distance);
            console.log(`Endpoint ${i} <--> Endpoint ${(i + 1) % 10}: ${distance.toFixed(3)}`);
            // Add to strutLengths for display - all should be LONG
            strutLengths.push({
                v1: currentEndpoint,
                v2: nextEndpoint,
                label: `Base-${i}-${(i + 1) % 10}`,
                actualLength: distance,
                expectedLength: LONG_LENGTH // All base ring edges should be LONG (1.06)
            });
        }
        // Calculate statistics to help find optimal angles
        const avgDistance = baseDistances.reduce((a, b) => a + b, 0) / baseDistances.length;
        const minDistance = Math.min(...baseDistances);
        const maxDistance = Math.max(...baseDistances);
        const avgError = baseDistances.reduce((sum, d) => sum + Math.abs(d - LONG_LENGTH), 0) / baseDistances.length;
        const maxError = Math.max(...baseDistances.map(d => Math.abs(d - LONG_LENGTH)));
        console.log(`Base ring stats: min=${minDistance.toFixed(3)}, max=${maxDistance.toFixed(3)}, avg=${avgDistance.toFixed(3)}`);
        console.log(`Target: ALL should be ~1.06 (LONG)`);
        console.log(`Error from target: avg=${avgError.toFixed(3)}, max=${maxError.toFixed(3)}`);
        const ringVerticesOrdered = tempRingVertices.map(v => v.vertexIndex);
        const ringEndpoints = [];
        for (let i = 0; i < 10; i++) {
            ringEndpoints.push([sharedEndpoints[(i - 2 + 10) % 10], sharedEndpoints[(i - 1 + 10) % 10]]);
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            ringVertices: ringVerticesOrdered,
            ringEndpoints: ringEndpoints,
            strutLengths: strutLengths
        });
    }
    // STEP 7: Adjust shared endpoint positions to flat base
    // Petals angle downward so dome sits flat on surface
    console.log('Step 7: Adjust endpoints to form flat base');
    // Recreate endpoints using the same sphere intersection approach as Step 6
    // but the angle parameters will determine their position (they may not be exactly at y=0)
    // This ensures the angle sliders still work in Step 7
    for (let i = 0; i < 10; i++) {
        // Endpoint i connects to ring vertices at (i+1) and (i+2) after rotation
        const ring1 = tempRingVertices[(i + 1) % 10];
        const ring2 = tempRingVertices[(i + 2) % 10];
        const v1 = vertices[ring1.vertexIndex];
        const v2 = vertices[ring2.vertexIndex];
        // Required distances from each vertex
        const d1 = ring1.isShort ? SHORT_LENGTH : LONG_LENGTH;
        const d2 = ring2.isShort ? SHORT_LENGTH : LONG_LENGTH;
        // Determine which angle to use (same logic as Step 6)
        let angleToUse;
        if (ring1.isShort && ring2.isShort) {
            angleToUse = BOTTOM_SHORT_ANGLE_RAD;
        }
        else if (!ring1.isShort && !ring2.isShort) {
            angleToUse = BOTTOM_LONG_ANGLE_RAD;
        }
        else {
            angleToUse = (BOTTOM_SHORT_ANGLE_RAD + BOTTOM_LONG_ANGLE_RAD) / 2;
        }
        // Recreate endpoint position using sphere intersection with angle
        const endpoint = calculateSphereIntersectionPoint(v1, d1, v2, d2, 'lower', angleToUse);
        // Update the existing endpoint vertex
        const endpointVertex = vertices[sharedEndpoints[i]];
        endpointVertex.x = endpoint.x;
        endpointVertex.y = endpoint.y;
        endpointVertex.z = endpoint.z;
    }
    // Note: Old Step 7 code that forced endpoints to y=0 has been removed
    // We now use the same sphere intersection approach as Step 6 to ensure angle sliders work
    if (currentBuildStep === 7) {
        console.log('✓ Step 7 complete: Endpoints adjusted to flat base, petals angled downward');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for ALL steps (cumulative debugging)
        const strutLengths = [];
        // Step 1 - Apex to top ring (SHORT)
        for (let i = 0; i < 5; i++) {
            const len = vertices[apexHub].distanceTo(vertices[topRing[i]]);
            strutLengths.push({
                v1: apexHub,
                v2: topRing[i],
                label: `St1-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 2 - Top ring perimeter (LONG)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[topRing[(i + 1) % 5]]);
            strutLengths.push({
                v1: topRing[i],
                v2: topRing[(i + 1) % 5],
                label: `St2-${i}(LONG)`,
                actualLength: len,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 3 LONG edges (top pentagon to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[topRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: secondRing[i],
                label: `St3-${i * 2}(LONG)`,
                actualLength: len1,
                expectedLength: LONG_LENGTH
            });
            const len2 = vertices[topRing[(i + 1) % 5]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[(i + 1) % 5],
                v2: secondRing[i],
                label: `St3-${i * 2 + 1}(LONG)`,
                actualLength: len2,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 4 SHORT edges (top pentagon to thirdRing)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[thirdRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: thirdRing[i],
                label: `St4-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 5 SHORT edges (thirdRing to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[i],
                label: `St5-${i * 2}(SHORT)`,
                actualLength: len1,
                expectedLength: SHORT_LENGTH
            });
            const len2 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[(i - 1 + 5) % 5]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[(i - 1 + 5) % 5],
                label: `St5-${i * 2 + 1}(SHORT)`,
                actualLength: len2,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 7 edges (ring to endpoints, after adjustment to ground) - rotated by 1 position
        let strutCounter = 0;
        for (let i = 0; i < 10; i++) {
            const ringVertex = tempRingVertices[i].vertexIndex;
            const isShort = tempRingVertices[i].isShort;
            const expectedLength = isShort ? SHORT_LENGTH : LONG_LENGTH;
            const edgeType = isShort ? 'SHORT' : 'LONG';
            const prevEndpoint = sharedEndpoints[(i - 2 + 10) % 10];
            const nextEndpoint = sharedEndpoints[(i - 1 + 10) % 10];
            // Strut to previous endpoint
            const len1 = vertices[ringVertex].distanceTo(vertices[prevEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: prevEndpoint,
                label: `St7-${strutCounter++}(${edgeType})`,
                actualLength: len1,
                expectedLength: expectedLength
            });
            // Strut to next endpoint
            const len2 = vertices[ringVertex].distanceTo(vertices[nextEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: nextEndpoint,
                label: `St7-${strutCounter++}(${edgeType})`,
                actualLength: len2,
                expectedLength: expectedLength
            });
        }
        // Add base ring endpoint distances (adjacent endpoint pairs)
        // All base ring edges should be LONG (1.06) - these become Step 8 edges
        console.log('\n=== Base Ring Endpoint Distances (Step 7) ===');
        console.log(`Current angles: SHORT=${bottomShortAngle}°, LONG=${bottomLongAngle}°`);
        const baseDistances = [];
        for (let i = 0; i < 10; i++) {
            const currentEndpoint = sharedEndpoints[i];
            const nextEndpoint = sharedEndpoints[(i + 1) % 10];
            const distance = vertices[currentEndpoint].distanceTo(vertices[nextEndpoint]);
            baseDistances.push(distance);
            console.log(`Endpoint ${i} <--> Endpoint ${(i + 1) % 10}: ${distance.toFixed(3)}`);
            // Add to strutLengths for display - all should be LONG
            strutLengths.push({
                v1: currentEndpoint,
                v2: nextEndpoint,
                label: `Base-${i}-${(i + 1) % 10}`,
                actualLength: distance,
                expectedLength: LONG_LENGTH // All base ring edges should be LONG (1.06)
            });
        }
        // Calculate statistics to help find optimal angles
        const avgDistance = baseDistances.reduce((a, b) => a + b, 0) / baseDistances.length;
        const minDistance = Math.min(...baseDistances);
        const maxDistance = Math.max(...baseDistances);
        const avgError = baseDistances.reduce((sum, d) => sum + Math.abs(d - LONG_LENGTH), 0) / baseDistances.length;
        const maxError = Math.max(...baseDistances.map(d => Math.abs(d - LONG_LENGTH)));
        console.log(`Base ring stats: min=${minDistance.toFixed(3)}, max=${maxDistance.toFixed(3)}, avg=${avgDistance.toFixed(3)}`);
        console.log(`Target: ALL should be ~1.06 (LONG)`);
        console.log(`Error from target: avg=${avgError.toFixed(3)}, max=${maxError.toFixed(3)}`);
        const ringVerticesOrdered = tempRingVertices.map(v => v.vertexIndex);
        const ringEndpoints = [];
        for (let i = 0; i < 10; i++) {
            ringEndpoints.push([sharedEndpoints[(i - 2 + 10) % 10], sharedEndpoints[(i - 1 + 10) % 10]]);
        }
        return buildFacesFromEdges(vertices, edges, currentBuildStep, {
            ringVertices: ringVerticesOrdered,
            ringEndpoints: ringEndpoints,
            strutLengths: strutLengths
        });
    }
    // STEP 8: Complete dome base with 10 LONG edges forming the base ring (Kit Step 8)
    console.log('Step 8: Add 10 LONG edges to complete the base ring');
    // Connect the shared endpoints in a ring pattern
    for (let i = 0; i < 10; i++) {
        addEdge(sharedEndpoints[i], sharedEndpoints[(i + 1) % 10], 'LONG', 8);
    }
    if (currentBuildStep === 8) {
        console.log('✓ Step 8 complete: Added 10 LONG edges, dome base complete!');
        console.log(`  Vertices: ${vertices.length}, Edges: ${edges.length}`);
        // Calculate actual strut lengths for ALL steps (cumulative debugging)
        const strutLengths = [];
        // ... (keeping existing strut length calculation code if needed, but for brevity in this tool call I'll omit the repetitive parts if they are not changing, 
        // actually I should include them to be safe or just generate the faces and return)
        // To avoid massive code duplication in this tool call, I will focus on the return statement.
        // But I need to make sure I don't delete the strut length calculations if they are useful.
        // The user wants the mapping fixed. The strut lengths are for debugging.
        // I'll reconstruct the strut lengths briefly or just assume they are fine.
        // Actually, I'll just use the explicit face generation and pass the debug info if I can.
        // But the previous code block had a lot of strut length logic.
        // I will preserve the strut length logic by reading it again or just appending the face generation.
        // Let's re-implement the strut length collection for Step 8 to be safe and complete.
        // Step 1 - Apex to top ring (SHORT)
        for (let i = 0; i < 5; i++) {
            const len = vertices[apexHub].distanceTo(vertices[topRing[i]]);
            strutLengths.push({
                v1: apexHub,
                v2: topRing[i],
                label: `St1-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 2 - Top ring perimeter (LONG)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[topRing[(i + 1) % 5]]);
            strutLengths.push({
                v1: topRing[i],
                v2: topRing[(i + 1) % 5],
                label: `St2-${i}(LONG)`,
                actualLength: len,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 3 LONG edges (top pentagon to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[topRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: secondRing[i],
                label: `St3-${i * 2}(LONG)`,
                actualLength: len1,
                expectedLength: LONG_LENGTH
            });
            const len2 = vertices[topRing[(i + 1) % 5]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: topRing[(i + 1) % 5],
                v2: secondRing[i],
                label: `St3-${i * 2 + 1}(LONG)`,
                actualLength: len2,
                expectedLength: LONG_LENGTH
            });
        }
        // Step 4 SHORT edges (top pentagon to thirdRing)
        for (let i = 0; i < 5; i++) {
            const len = vertices[topRing[i]].distanceTo(vertices[thirdRing[i]]);
            strutLengths.push({
                v1: topRing[i],
                v2: thirdRing[i],
                label: `St4-${i}(SHORT)`,
                actualLength: len,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 5 SHORT edges (thirdRing to secondRing)
        for (let i = 0; i < 5; i++) {
            const len1 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[i]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[i],
                label: `St5-${i * 2}(SHORT)`,
                actualLength: len1,
                expectedLength: SHORT_LENGTH
            });
            const len2 = vertices[thirdRing[i]].distanceTo(vertices[secondRing[(i - 1 + 5) % 5]]);
            strutLengths.push({
                v1: thirdRing[i],
                v2: secondRing[(i - 1 + 5) % 5],
                label: `St5-${i * 2 + 1}(SHORT)`,
                actualLength: len2,
                expectedLength: SHORT_LENGTH
            });
        }
        // Step 6/7 edges (ring to endpoints)
        let strutCounter = 0;
        for (let i = 0; i < 10; i++) {
            const ringVertex = tempRingVertices[i].vertexIndex;
            const isShort = tempRingVertices[i].isShort;
            const expectedLength = isShort ? SHORT_LENGTH : LONG_LENGTH;
            const edgeType = isShort ? 'SHORT' : 'LONG';
            const prevEndpoint = sharedEndpoints[(i - 2 + 10) % 10];
            const nextEndpoint = sharedEndpoints[(i - 1 + 10) % 10];
            const len1 = vertices[ringVertex].distanceTo(vertices[prevEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: prevEndpoint,
                label: `St6-${strutCounter++}(${edgeType})`,
                actualLength: len1,
                expectedLength: expectedLength
            });
            const len2 = vertices[ringVertex].distanceTo(vertices[nextEndpoint]);
            strutLengths.push({
                v1: ringVertex,
                v2: nextEndpoint,
                label: `St6-${strutCounter++}(${edgeType})`,
                actualLength: len2,
                expectedLength: expectedLength
            });
        }
        // Step 8 - Base ring edges (LONG)
        const baseDistances = [];
        for (let i = 0; i < 10; i++) {
            const currentEndpoint = sharedEndpoints[i];
            const nextEndpoint = sharedEndpoints[(i + 1) % 10];
            const distance = vertices[currentEndpoint].distanceTo(vertices[nextEndpoint]);
            baseDistances.push(distance);
            strutLengths.push({
                v1: currentEndpoint,
                v2: nextEndpoint,
                label: `Base-${i}-${(i + 1) % 10}`,
                actualLength: distance,
                expectedLength: LONG_LENGTH
            });
        }
        // EXPLICIT FACE GENERATION FOR DETERMINISTIC MAPPING (1-40)
        const faces = [];
        // CALCULATED ORDER: [0, 1, 4, 3, 2]
        // Visual Mapping from Baseline (0,1,2,3,4):
        // 0->Top-Right, 1->Top-Left, 2->Mid-Right, 3->Bottom, 4->Mid-Left
        // Desired Anticlockwise: Top-Right(1) -> Top-Left(2) -> Mid-Left(3) -> Bottom(4) -> Mid-Right(5)
        // Mapping: 1->0, 2->1, 3->4, 4->3, 5->2
        const customOrder = [0, 1, 4, 3, 2];
        // Band 1: Top (Faces 1-5)
        for (let i = 0; i < 5; i++) {
            const idx = customOrder[i];
            faces.push([apexHub, topRing[idx], topRing[(idx + 1) % 5]]);
        }
        // Band 2: Upper Middle (Faces 6-10)
        for (let i = 0; i < 5; i++) {
            const idx = customOrder[i];
            faces.push([topRing[idx], topRing[(idx + 1) % 5], secondRing[idx]]);
        }
        // Band 3: Lower Middle (Faces 11-20)
        for (let i = 0; i < 5; i++) {
            const idx = customOrder[i];
            faces.push([topRing[idx], secondRing[idx], thirdRing[idx]]);
            faces.push([topRing[(idx + 1) % 5], secondRing[idx], thirdRing[(idx + 1) % 5]]);
        }
        // Band 4: Upper Bottom (Faces 21-30)
        for (let i = 0; i < 5; i++) {
            const idx = customOrder[i];
            const b1 = sharedEndpoints[(2 * idx + 1) % 10];
            const b2 = sharedEndpoints[(2 * idx + 2) % 10];
            faces.push([secondRing[idx], thirdRing[idx], b1]);
            faces.push([secondRing[idx], thirdRing[(idx + 1) % 5], b2]);
        }
        // Band 5: Lower Bottom (Faces 31-40)
        for (let i = 0; i < 5; i++) {
            const idx = customOrder[i];
            const b0 = sharedEndpoints[(2 * idx) % 10];
            const b1 = sharedEndpoints[(2 * idx + 1) % 10];
            const b2 = sharedEndpoints[(2 * idx + 2) % 10];
            faces.push([thirdRing[idx], b0, b1]);
            faces.push([secondRing[idx], b1, b2]);
        }
        console.log(`Explicitly generated ${faces.length} faces for Step 8`);
        return {
            vertices,
            faces,
            edges,
            debugLabels: {
                strutLengths: strutLengths
            }
        };
    }
    // Fallback - should never reach here
    console.warn('Unexpected build step:', currentBuildStep);
    return buildFacesFromEdges(vertices, edges, currentBuildStep);
}
// Helper function to build triangular faces from edges
function buildFacesFromEdges(vertices, edges, currentStep, debugInfo) {
    const faces = [];
    const edgeSet = new Set(edges.map(([v1, v2]) => `${Math.min(v1, v2)}-${Math.max(v1, v2)}`));
    const hasEdge = (v1, v2) => edgeSet.has(`${Math.min(v1, v2)}-${Math.max(v1, v2)}`);
    // Find all triangular faces
    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            if (!hasEdge(i, j))
                continue;
            for (let k = j + 1; k < vertices.length; k++) {
                if (hasEdge(i, k) && hasEdge(j, k)) {
                    faces.push([i, j, k]);
                }
            }
        }
    }
    const shortCount = edges.filter(([, , type]) => type === 'SHORT').length;
    const longCount = edges.filter(([, , type]) => type === 'LONG').length;
    console.log(`Generated ${faces.length} faces from ${edges.length} edges (${shortCount} SHORT, ${longCount} LONG)`);
    // Build debug labels if we have debug info
    let debugLabels = undefined;
    if (debugInfo) {
        debugLabels = {
            ringVertices: debugInfo.ringVertices,
            strutEndpoints: undefined,
            strutLengths: debugInfo.strutLengths
        };
        // Build strut endpoint labels if we have the data
        if (debugInfo.ringVertices && debugInfo.ringEndpoints) {
            const strutEndpoints = [];
            debugInfo.ringEndpoints.forEach((endpoints, i) => {
                strutEndpoints.push({ vertexIndex: endpoints[0], label: `S${i}-A` });
                strutEndpoints.push({ vertexIndex: endpoints[1], label: `S${i}-B` });
            });
            debugLabels.strutEndpoints = strutEndpoints;
        }
    }
    return { vertices, faces, edges, debugLabels };
}
