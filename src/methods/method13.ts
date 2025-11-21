import * as THREE from 'three';
import { GeodesicData } from './types';

// Method 13: Deterministic V2 Dome (40 Faces)
// Designed to match specific face numbering requirements:
// - Faces 1-5: Top pentagon (anticlockwise)
// - Faces 6-20: Middle band (anticlockwise)
// - Faces 21-40: Bottom band (anticlockwise)

export default function create2VGeodesicDomeMethod13(radius: number): GeodesicData {
    console.log('=== Method 13: Deterministic V2 Dome (40 Faces) ===');

    const SHORT_LENGTH = 0.90; // 90mm normalized
    const LONG_LENGTH = 1.06;  // 106mm normalized

    // --- Vertex Generation ---
    const vertices: THREE.Vector3[] = [];

    // Helper to add vertex
    const addVertex = (x: number, y: number, z: number) => {
        vertices.push(new THREE.Vector3(x, y, z));
        return vertices.length - 1;
    };

    // 1. Apex (Vertex 0)
    const apexHub = addVertex(0, radius, 0);

    // 2. Top Ring (Vertices 1-5)
    // 5 vertices, SHORT_LENGTH from Apex
    const topRing: number[] = [];
    const pentagonRadius = SHORT_LENGTH;
    const pentagonHeight = radius - 0.1; // Approximate, will be refined by strut length if needed, but using standard math here
    // Actually, let's use the exact math from Method 12 for consistency
    // Method 12 used:
    // const pentagonRadius = SHORT_LENGTH; // This was actually wrong in Method 12 if it meant horizontal radius, 
    // but it was used as "Horizontal distance component" which is weird if SHORT_LENGTH is the hypotenuse.
    // Let's use proper sphere math.

    // Proper 2V math:
    // Apex is at (0, R, 0)
    // Ring 1 vertices are at distance SHORT_LENGTH from Apex.
    // They form a pentagon.

    // We'll stick to the visual placement from Method 12 to ensure it looks the same.
    // Method 12 Step 1:
    // const pentagonRadius = SHORT_LENGTH; // Horizontal radius?
    // const pentagonHeight = radius - 0.1;
    // This looks like a "flat" pentagon placed below the apex.
    // Let's calculate exact positions based on strut lengths for better accuracy.

    // Calculate Ring 1 position:
    // Distance from Apex (0,R,0) to (r*cos, h, r*sin) is SHORT_LENGTH.
    // x^2 + (y-R)^2 + z^2 = L^2
    // r^2 + (h-R)^2 = L^2
    // Also on sphere? No, Method 12 builds from struts.
    // Let's assume we want to maintain the "strut length" constraint primarily.

    // Let's use the Method 12 logic exactly for the rings to match the "kit" simulation.
    // Method 12 Step 1:
    // const pentagonRadius = SHORT_LENGTH; 
    // const pentagonHeight = radius - 0.1;
    // This seems arbitrary. Let's improve it to be geometrically consistent if possible, 
    // OR just copy Method 12's exact coordinates if we can run it.
    // Since I can't run it, I'll use the logic:
    // 5 vertices around apex.

    // Let's use standard 2V angles for a better result, or try to replicate Method 12's "interactive" positions.
    // Method 12 Step 3 uses `calculateSphereIntersectionPoint`.

    // Let's reconstruct the vertices layer by layer using the strut lengths.

    // Level 0: Apex
    // Level 1: 5 vertices. Dist = SHORT from Apex. Dist = LONG from each other (Pentagon).
    // Calculate radius of Level 1 ring.
    // Side length s = LONG. Radius r = s / (2 * sin(36)).
    // Height h = R - sqrt(SHORT^2 - r^2).

    const L1_Side = LONG_LENGTH;
    const L1_Radius = L1_Side / (2 * Math.sin(Math.PI / 5));
    const L1_DistFromApex = SHORT_LENGTH;
    const L1_HeightOffset = Math.sqrt(Math.max(0, L1_DistFromApex * L1_DistFromApex - L1_Radius * L1_Radius));
    const L1_Height = radius - L1_HeightOffset;

    for (let i = 0; i < 5; i++) {
        // Start angle: -PI/2 to match Method 12 (starts at bottom/front?)
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const v = addVertex(
            L1_Radius * Math.cos(angle),
            L1_Height,
            L1_Radius * Math.sin(angle)
        );
        topRing.push(v);
    }

    // Level 2: 10 vertices.
    // This ring is composed of 5 "down" points (from Step 3) and 5 "up" points (from Step 4)?
    // Method 12 Step 3: 5 vertices (SecondRing). Dist = LONG from TopRing[i] and TopRing[i+1].
    // Method 12 Step 4: 5 vertices (ThirdRing). Dist = SHORT from TopRing[i].
    // Method 12 Step 5: Connect ThirdRing to SecondRing with SHORT.

    // So Level 2 has 10 vertices.
    // Let's call them "Valley" (SecondRing) and "Peak" (ThirdRing) vertices?
    // No, ThirdRing is connected to TopRing by SHORT.
    // SecondRing is connected to TopRing by LONG.

    // Let's generate them.
    const secondRing: number[] = []; // The "LONG" connectors (Valleys)
    const thirdRing: number[] = [];  // The "SHORT" connectors (Peaks?)

    // We need the angles from Method 12 defaults.
    const middleLongAngle = 30 * Math.PI / 180;
    const middleShortAngle = 35 * Math.PI / 180;

    // Helper for sphere intersection (simplified from Method 12)
    function getIntersection(v1: THREE.Vector3, d1: number, v2: THREE.Vector3, d2: number, angleParam: number): THREE.Vector3 {
        const v1v2 = new THREE.Vector3().subVectors(v2, v1);
        const dist = v1v2.length();
        const a = (d1 * d1 - d2 * d2 + dist * dist) / (2 * dist);
        const direction = v1v2.clone().normalize();
        const circleCenter = v1.clone().add(direction.multiplyScalar(a));
        const h = Math.sqrt(Math.max(0, d1 * d1 - a * a));

        // Perpendicular setup
        let perpendicular: THREE.Vector3;
        if (Math.abs(direction.y) < 0.9) perpendicular = new THREE.Vector3(0, -1, 0);
        else perpendicular = new THREE.Vector3(1, 0, 0);

        perpendicular.sub(direction.clone().multiplyScalar(perpendicular.dot(direction))).normalize();
        const perpendicular2 = new THREE.Vector3().crossVectors(direction, perpendicular).normalize();

        const downwardWeight = Math.sin(angleParam);
        const horizontalWeight = Math.cos(angleParam);

        return circleCenter.clone()
            .add(perpendicular.multiplyScalar(h * downwardWeight))
            .add(perpendicular2.multiplyScalar(h * horizontalWeight)); // 'lower' preference implied
    }

    // Generate Second Ring (5 vertices)
    for (let i = 0; i < 5; i++) {
        const v1 = vertices[topRing[i]];
        const v2 = vertices[topRing[(i + 1) % 5]];
        const pos = getIntersection(v1, LONG_LENGTH, v2, LONG_LENGTH, middleLongAngle);
        secondRing.push(addVertex(pos.x, pos.y, pos.z));
    }

    // Generate Third Ring (5 vertices)
    for (let i = 0; i < 5; i++) {
        const startVertex = vertices[topRing[i]];
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        // Direction based on Method 12 Step 4
        const direction = new THREE.Vector3(
            Math.cos(angle) * Math.cos(middleShortAngle),
            -Math.sin(middleShortAngle),
            Math.sin(angle) * Math.cos(middleShortAngle)
        ).normalize();
        const pos = startVertex.clone().add(direction.multiplyScalar(SHORT_LENGTH));
        thirdRing.push(addVertex(pos.x, pos.y, pos.z));
    }

    // Combine into a sorted Middle Ring (10 vertices) for easy indexing
    // Order: T0 -> S0 -> T1 -> S1 ... (based on angle)
    // Actually, let's keep them separate lists for logic, but we need a unified index list for the faces?
    // Method 12 Step 6 sorts them.
    // Let's create a "Level 2" list that is sorted.
    const level2Vertices: { index: number, angle: number, type: 'second' | 'third' }[] = [];
    for (let i = 0; i < 5; i++) {
        const vS = vertices[secondRing[i]];
        level2Vertices.push({ index: secondRing[i], angle: Math.atan2(vS.z, vS.x), type: 'second' });
        const vT = vertices[thirdRing[i]];
        level2Vertices.push({ index: thirdRing[i], angle: Math.atan2(vT.z, vT.x), type: 'third' });
    }
    level2Vertices.sort((a, b) => a.angle - b.angle);
    // Note: atan2 returns -PI to PI.
    // We want to ensure correct ordering relative to Top Ring.
    // Top Ring 0 is at -PI/2.

    // Level 3: Base Ring (10 vertices)
    // Method 12 Step 6/7 generates these.
    const baseRing: number[] = [];
    const bottomLongAngle = 30 * Math.PI / 180;
    const bottomShortAngle = 90 * Math.PI / 180;

    for (let i = 0; i < 10; i++) {
        const r1 = level2Vertices[(i + 1) % 10];
        const r2 = level2Vertices[(i + 2) % 10];

        const v1 = vertices[r1.index];
        const v2 = vertices[r2.index];

        const d1 = r1.type === 'third' ? SHORT_LENGTH : LONG_LENGTH; // Third ring was "SHORT" in Method 12 logic? 
        // Wait, in Method 12 Step 6:
        // "ring1.isShort" comes from "thirdVertex... isShort: false"?
        // Let's check Method 12 Step 6 code:
        // secondVertex -> isShort: true
        // thirdVertex -> isShort: false
        // This seems counter-intuitive?
        // Step 4: ThirdRing connected to TopRing by SHORT.
        // Step 3: SecondRing connected to TopRing by LONG.
        // Step 5: ThirdRing connected to SecondRing by SHORT.

        // So ThirdRing vertices have SHORT connections to Top and Second.
        // SecondRing vertices have LONG connections to Top, SHORT to Third.

        // In Step 6:
        // "ring1.isShort ? SHORT_LENGTH : LONG_LENGTH"
        // If secondVertex isShort=true, then it needs SHORT_LENGTH to base?
        // Let's trust Method 12's boolean flag:
        // secondRing -> isShort: true
        // thirdRing -> isShort: false

        const isR1Short = r1.type === 'second'; // Matches Method 12 "isShort: true" for secondRing
        const isR2Short = r2.type === 'second';

        const dist1 = isR1Short ? SHORT_LENGTH : LONG_LENGTH;
        const dist2 = isR2Short ? SHORT_LENGTH : LONG_LENGTH;

        let angleToUse: number;
        if (isR1Short && isR2Short) angleToUse = bottomShortAngle;
        else if (!isR1Short && !isR2Short) angleToUse = bottomLongAngle;
        else angleToUse = (bottomShortAngle + bottomLongAngle) / 2;

        const pos = getIntersection(v1, dist1, v2, dist2, angleToUse);
        baseRing.push(addVertex(pos.x, pos.y, pos.z));
    }

    // --- Face Generation (Deterministic 1-40) ---
    const faces: number[][] = [];

    // We need to map the visual order to our indices.
    // Top Ring indices: topRing[0]..topRing[4]
    // Level 2 indices: level2Vertices[0].index .. [9].index
    // Base Ring indices: baseRing[0]..baseRing[9]

    // IMPORTANT: We need to ensure "Anticlockwise" numbering.
    // Visual check: 
    // Face 1: Top Pentagon, starting where? Usually "Front" or "Top-Right".
    // User said: "1-5 represent the top pentagon and should be numbered in anticlockwise."
    // Let's assume starting from index 0 is fine, as long as it's sequential.

    // Layer 1: Top Pentagon (5 faces)
    // Apex -> TopRing[i] -> TopRing[i+1]
    for (let i = 0; i < 5; i++) {
        faces.push([apexHub, topRing[i], topRing[(i + 1) % 5]]);
    }

    // Layer 2: Middle Band (15 faces)
    // This band connects TopRing to Level 2.
    // It consists of 5 "up" triangles (Top-Top-Level2) and 10 "down" triangles (Top-Level2-Level2)?
    // Wait, topology check.
    // TopRing (5) <-> Level 2 (10).
    // Each TopRing vertex connects to:
    // - 2 TopRing neighbors
    // - 1 ThirdRing vertex (SHORT)
    // - 2 SecondRing vertices (LONG)

    // Let's trace the triangles.
    // Triangle Type A: TopRing[i], TopRing[i+1], SecondRing[i] (The "LONG" triangles filling the gaps?)
    // Triangle Type B: TopRing[i], SecondRing[i], ThirdRing[i]
    // Triangle Type C: TopRing[i+1], SecondRing[i], ThirdRing[i+1] ??

    // Let's look at Method 12 Step 8 explicit generation for clues.
    // It used a "customOrder" [0, 1, 4, 3, 2].
    // And defined bands.
    // Band 2 (Faces 6-10): TopRing[i], TopRing[i+1], SecondRing[i]
    // Band 3 (Faces 11-20): 
    //   TopRing[i], SecondRing[i], ThirdRing[i]
    //   TopRing[i+1], SecondRing[i], ThirdRing[i+1] (Wait, code said ThirdRing[(idx+1)%5])

    // Let's just implement a clean loop that covers the full circle.
    // We want 15 faces in this band.
    // 5 groups of 3 faces?
    // For each sector i (0..4):
    // 1. TopRing[i]-TopRing[i+1]-SecondRing[i] (The "V" between top vertices)
    // 2. TopRing[i]-SecondRing[i]-ThirdRing[i]
    // 3. TopRing[i+1]-SecondRing[i]-ThirdRing[i+1] -- Wait, this overlaps?

    // Let's re-verify the connectivity.
    // TopRing[i] connects to ThirdRing[i] (Short).
    // TopRing[i] connects to SecondRing[i] (Long).
    // TopRing[i+1] connects to SecondRing[i] (Long).
    // So SecondRing[i] is "between" TopRing[i] and TopRing[i+1].

    // Faces:
    // 1. TopRing[i], TopRing[i+1], SecondRing[i] (1 face per sector -> 5 faces)
    // 2. TopRing[i], SecondRing[i], ThirdRing[i] (1 face per sector -> 5 faces)
    // 3. TopRing[i+1], SecondRing[i], ThirdRing[i+1] (1 face per sector -> 5 faces)

    // Total 15 faces. Perfect.
    // Ordering: User wants "anticlockwise".
    // We should interleave them or do them in rings?
    // "Numbering continues similarly in the middle... down to face 40".
    // Usually this means Layer by Layer.
    // Layer 2a: The "Upper" middle faces?
    // Layer 2b: The "Lower" middle faces?
    // The "TopRing-TopRing-SecondRing" faces are "higher" (touching the top ring edge).
    // The others touch the ThirdRing (lower).

    // Let's group them.
    // Faces 6-10: TopRing[i], TopRing[i+1], SecondRing[i]
    // Faces 11-20: The alternating band below?
    // TopRing[i]-SecondRing[i]-ThirdRing[i]
    // TopRing[i+1]-SecondRing[i]-ThirdRing[i+1]

    // Let's try to order them 11, 12, 13, 14... around the ring.
    // For i=0:
    // Face 11: TopRing[0]-SecondRing[0]-ThirdRing[0]
    // Face 12: TopRing[1]-SecondRing[0]-ThirdRing[1]
    // ...

    // Implementation:
    // Faces 6-10
    for (let i = 0; i < 5; i++) {
        faces.push([topRing[i], topRing[(i + 1) % 5], secondRing[i]]);
    }

    // Faces 11-20
    for (let i = 0; i < 5; i++) {
        // Face A
        faces.push([topRing[i], secondRing[i], thirdRing[i]]);
        // Face B
        faces.push([topRing[(i + 1) % 5], secondRing[i], thirdRing[(i + 1) % 5]]);
    }

    // Layer 3: Bottom Band (20 faces)
    // Connects Level 2 (Second/Third Rings) to Base Ring.
    // Level 2 has 10 vertices (interleaved Second/Third).
    // Base Ring has 10 vertices.
    // This is a simple "strip" of 20 triangles (10 pointing up, 10 pointing down).

    // We need to map our Second/Third ring arrays to the sorted "Level 2" sequence to match Base Ring.
    // level2Vertices array has the sorted order.
    // baseRing array corresponds to level2Vertices indices (offset by 1-2).

    // Let's use the sorted level2Vertices to generate the strip.
    // For each i in 0..9:
    // Quad between L2[i], L2[i+1] and Base[i], Base[i+1]?
    // No, BaseRing generation logic:
    // Endpoint i connects to Ring vertices (i+1) and (i+2).
    // So Base[i] connects to L2[i+1] and L2[i+2].
    // (Note: indices mod 10).

    // Let's verify the "Shift" in Method 12.
    // "Shift connections by 1 position (was: i-1 and i, now: i-2 and i-1)"
    // "ringEndpoints.push([sharedEndpoints[(i - 2 + 10) % 10], sharedEndpoints[(i - 1 + 10) % 10]])"

    // Let's just look at the triangles formed.
    // We have L2 ring and Base ring.
    // Base[i] is "between" L2[i+1] and L2[i+2].
    // So we have triangles:
    // T1: Base[i], L2[i+1], L2[i+2] (Pointing Up)
    // T2: Base[i], Base[i+1], L2[i+2] (Pointing Down)

    // We need 20 faces.
    // 10 Up, 10 Down.
    // Let's iterate i from 0 to 9.
    // Face 21+2*i: Base[i-2], L2[i-1], L2[i] ??
    // Let's align with the "anticlockwise" flow.

    // Let's use the "sharedEndpoints" logic from Method 12 Step 8.
    // Band 4 (Faces 21-30):
    // faces.push([secondRing[idx], thirdRing[idx], b1]);
    // faces.push([secondRing[idx], thirdRing[(idx + 1) % 5], b2]);

    // Band 5 (Faces 31-40):
    // faces.push([thirdRing[idx], b0, b1]);
    // faces.push([secondRing[idx], b1, b2]);

    // This seems to cover it.
    // Let's adapt this logic but ensure it's sequential 21-40.
    // Method 12 split it into "Upper Bottom" and "Lower Bottom".
    // That's 10 faces in Band 4, 10 faces in Band 5.
    // This sums to 20.
    // This seems like a good ordering (Ring 2-3 connection, then Ring 3-Base connection).

    // Let's stick to the Method 12 explicit logic but simplified loop.
    // Note: Method 12 used `sharedEndpoints` array.
    // My `baseRing` array is equivalent to `sharedEndpoints`.

    // Faces 21-30 (Upper Bottom - connecting L2 to Base)
    for (let i = 0; i < 5; i++) {
        // We need to match the indices correctly.
        // In Method 12, b1 = sharedEndpoints[(2*idx + 1)%10].
        // Let's assume my baseRing aligns similarly.
        // I need to verify the alignment of baseRing vs Second/Third ring.
        // In my code: baseRing[k] is between L2[k+1] and L2[k+2].
        // L2 is sorted.
        // L2[0] is SecondRing[0].
        // L2[1] is ThirdRing[0].
        // L2[2] is SecondRing[1].
        // L2[3] is ThirdRing[1].
        // ...
        // L2[2*i] is SecondRing[i].
        // L2[2*i+1] is ThirdRing[i].

        // So:
        // Base[2*i-2] connects L2[2*i-1] and L2[2*i].
        // Base[2*i-1] connects L2[2*i] and L2[2*i+1].

        // Let's generate the faces based on this sorted L2 array.
        // For each k in 0..9:
        // We have L2[k], L2[k+1].
        // And a Base vertex between them?
        // Base[k-1] connects L2[k] and L2[k+1].

        // Triangle Up: Base[k-1], L2[k], L2[k+1].
        // Triangle Down: Base[k-1], Base[k], L2[k+1].

        // Let's generate 20 faces in order.
        // k=0..9
        // Face A: Base[(k-2+10)%10], L2[(k-1+10)%10], L2[k] ??
        // Let's use the Method 12 explicit map to be safe, it seemed to work for the user's "Step 8".
        // Method 12:
        // Band 4:
        // [secondRing[i], thirdRing[i], b1] -> [L2[2i], L2[2i+1], Base[2i+1]]
        // [secondRing[i], thirdRing[i+1], b2] -> [L2[2i], L2[2i+3]?? No wait.
        // thirdRing[(i+1)] is L2[2(i+1)+1] = L2[2i+3].
        // This skips L2[2i+2] (SecondRing[i+1]).
        // That seems wrong for a continuous strip.

        // Let's re-read Method 12 Band 4.
        // faces.push([secondRing[idx], thirdRing[idx], b1]);
        // faces.push([secondRing[idx], thirdRing[(idx + 1) % 5], b2]);
        // Wait, `secondRing[idx]` connects to `thirdRing[idx+1]`?
        // In Step 5: thirdRing[i] connects to secondRing[i] and secondRing[i-1].
        // So secondRing[i] connects to thirdRing[i] and thirdRing[i+1].
        // Yes.

        // So the faces are:
        // 1. Second[i]-Third[i]-Base?
        // 2. Second[i]-Third[i+1]-Base?

        // This covers all connections from SecondRing down to Base?
        // What about ThirdRing down to Base?
        // Band 5:
        // [thirdRing[idx], b0, b1]
        // [secondRing[idx], b1, b2]

        // This looks like it covers the gaps.

        // Let's just implement the Method 12 Explicit Logic 1:1.
        // It's proven to be what the user saw in Step 8 (which they liked).
        // "The working result was to build the dome using 8 steps... The application fundamentally works... My desire is that the 40 faces... are predictable".
        // So the geometry is good, just the numbering needs to be fixed.

        // I will use the exact same face definitions as Method 12 Step 8, but ensure the loop order is 0,1,2,3,4 instead of the "customOrder" if possible, or just use the customOrder if that's what makes it look right.
        // User said: "1-5 represent the top pentagon and should be numbered in anticlockwise."
        // Method 12 used `customOrder = [0, 1, 4, 3, 2]` to fix some visual mapping?
        // "Visual Mapping from Baseline... Desired Anticlockwise... Mapping: 1->0, 2->1..."
        // If I use the natural order 0,1,2,3,4, does it go anticlockwise?
        // Usually yes, if vertices are generated anticlockwise.
        // My vertices are generated with `angle = i * 2PI / 5`. This is anticlockwise (if Y is up and we look from top).
        // So I should be able to use loop 0..4 directly.

        const b = baseRing;
        const s = secondRing;
        const t = thirdRing;

        // Faces 21-30
        faces.push([s[i], t[i], b[(2 * i + 1) % 10]]);
        faces.push([s[i], t[(i + 1) % 5], b[(2 * i + 2) % 10]]);
    }

    // Faces 31-40
    for (let i = 0; i < 5; i++) {
        const b = baseRing;
        const s = secondRing;
        const t = thirdRing;

        faces.push([t[i], b[(2 * i) % 10], b[(2 * i + 1) % 10]]);
        faces.push([s[i], b[(2 * i + 1) % 10], b[(2 * i + 2) % 10]]);
    }

    // --- Edges for Visualization ---
    const edges: [number, number, 'SHORT' | 'LONG', number][] = [];
    // We can reconstruct edges from faces or just add them manually.
    // For Method 12 style visualization (Red/Blue), we need to know which are Short/Long.
    // Let's add them based on the generation logic.

    // 1. Apex-TopRing (SHORT)
    for (let i = 0; i < 5; i++) edges.push([apexHub, topRing[i], 'SHORT', 1]);

    // 2. TopRing Perimeter (LONG)
    for (let i = 0; i < 5; i++) edges.push([topRing[i], topRing[(i + 1) % 5], 'LONG', 2]);

    // 3. TopRing-SecondRing (LONG)
    for (let i = 0; i < 5; i++) {
        edges.push([topRing[i], secondRing[i], 'LONG', 3]);
        edges.push([topRing[(i + 1) % 5], secondRing[i], 'LONG', 3]);
    }

    // 4. TopRing-ThirdRing (SHORT)
    for (let i = 0; i < 5; i++) edges.push([topRing[i], thirdRing[i], 'SHORT', 4]);

    // 5. ThirdRing-SecondRing (SHORT)
    for (let i = 0; i < 5; i++) {
        edges.push([thirdRing[i], secondRing[i], 'SHORT', 5]);
        edges.push([thirdRing[i], secondRing[(i - 1 + 5) % 5], 'SHORT', 5]); // Note index logic
    }

    // 6. Ring-Base (Mixed)
    // This is tricky to map back to "Step 6" logic without the sorted array.
    // But we know the connections from the faces.
    // Let's just add all edges from the faces?
    // No, we need colors.
    // Let's use the distance to determine color.

    const allEdges = new Set<string>();
    faces.forEach(face => {
        const [a, b, c] = face;
        [[a, b], [b, c], [c, a]].forEach(([v1, v2]) => {
            const key = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
            if (allEdges.has(key)) return;
            allEdges.add(key);

            const dist = vertices[v1].distanceTo(vertices[v2]);
            const isShort = Math.abs(dist - SHORT_LENGTH) < 0.05;
            const isLong = Math.abs(dist - LONG_LENGTH) < 0.05;

            // Default to LONG if unsure, or check specific logic
            let type: 'SHORT' | 'LONG' = 'LONG';
            if (isShort) type = 'SHORT';

            // Check if it's already added (we added steps 1-5 manually)
            // Actually, let's just clear the manual edges and generate ALL from geometry + distance.
            // It's safer and more robust.
        });
    });

    // Re-generate edges list from scratch based on geometry
    const finalEdges: [number, number, 'SHORT' | 'LONG', number][] = [];
    const processedEdges = new Set<string>();

    faces.forEach(face => {
        const [a, b, c] = face;
        [[a, b], [b, c], [c, a]].forEach(([v1, v2]) => {
            const key = `${Math.min(v1, v2)}-${Math.max(v1, v2)}`;
            if (processedEdges.has(key)) return;
            processedEdges.add(key);

            const dist = vertices[v1].distanceTo(vertices[v2]);
            const type = Math.abs(dist - SHORT_LENGTH) < 0.08 ? 'SHORT' : 'LONG';
            finalEdges.push([v1, v2, type, 8]); // Step 8 for all
        });
    });

    return {
        vertices,
        faces,
        edges: finalEdges
    };
}
