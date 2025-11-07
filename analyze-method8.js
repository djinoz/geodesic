// Diagnostic tool to analyze Method 8 dome structure

class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    multiplyScalar(s) {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
}

function create2VGeodesicDomeMethod8(radius) {
    console.log('Creating Method 8 - Exact Hubs kit from build instructions PDF...');

    const vertices = [];
    const faces = [];

    // STEP 1: Start with 5-way hub (apex) and 5 SHORTS radiating out
    const apex = 0;
    vertices.push(new Vector3(0, 1, 0).multiplyScalar(radius));
    console.log('Method 8 Step 1: Added apex (5-way hub)');

    // STEP 2: Upper pentagon - 5x 6-way hubs connected to apex with SHORTS
    const upperPentagon = [];
    const pentagonHeight = 0.81 * radius;
    const pentagonRadius = 0.59 * radius;

    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        vertices.push(new Vector3(
            pentagonRadius * Math.cos(angle),
            pentagonHeight,
            pentagonRadius * Math.sin(angle)
        ));
        upperPentagon.push(vertices.length - 1);
    }
    console.log('Method 8 Step 2: Added upper pentagon (5x 6-way hubs)');

    // Create top 5 triangular faces
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([apex, upperPentagon[i], upperPentagon[next]]);
    }

    // STEP 3: Pentagonal star - 5x 6-way hubs
    const starOuter = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5;
        const starHeight = 0.59 * radius;
        const starRadius = 0.95 * radius;

        vertices.push(new Vector3(
            starRadius * Math.cos(angle),
            starHeight,
            starRadius * Math.sin(angle)
        ));
        starOuter.push(vertices.length - 1);
    }
    console.log('Method 8 Step 3: Added star outer vertices (5x 6-way hubs)');

    // Create star triangles
    for (let i = 0; i < 5; i++) {
        const next = (i + 1) % 5;
        faces.push([upperPentagon[i], starOuter[i], upperPentagon[next]]);
    }

    // STEP 4: Middle pentagon - 5x 5-way hubs
    const middlePentagon = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5;
        const middleHeight = 0.31 * radius;
        const middleRadius = 0.95 * radius;

        vertices.push(new Vector3(
            middleRadius * Math.cos(angle),
            middleHeight,
            middleRadius * Math.sin(angle)
        ));
        middlePentagon.push(vertices.length - 1);
    }
    console.log('Method 8 Step 4: Added middle pentagon (5x 5-way hubs)');

    // STEP 5: Connect upper to middle
    for (let i = 0; i < 5; i++) {
        faces.push([upperPentagon[i], middlePentagon[i], starOuter[i]]);
    }

    // STEP 6-8: Base ring - 10x 6-way hubs at ground level
    const lowerRing = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10;
        const lowerHeight = 0;
        const lowerRadius = 1.15 * radius;

        vertices.push(new Vector3(
            lowerRadius * Math.cos(angle),
            lowerHeight,
            lowerRadius * Math.sin(angle)
        ));
        lowerRing.push(vertices.length - 1);
    }
    console.log('Method 8 Steps 6-7-8: Added base ring (10x 6-way hubs at ground level)');

    // Connect middle pentagon to base ring
    for (let i = 0; i < 5; i++) {
        const lower1 = lowerRing[i * 2];
        const lower2 = lowerRing[i * 2 + 1];
        const nextMiddle = middlePentagon[(i + 1) % 5];
        const nextStar = starOuter[(i + 1) % 5];

        faces.push([middlePentagon[i], lower1, lower2]);
        faces.push([middlePentagon[i], lower2, nextMiddle]);
        faces.push([starOuter[i], lower1, nextStar]);
        faces.push([nextStar, lower1, lowerRing[((i + 1) * 2) % 10]]);
    }

    // STEP 8: "Place 10 LONGS in ring around outside"
    // Complete the base ring by adding missing edge connections
    // Only add ODD-indexed faces (even ones already exist from previous loop)
    for (let i = 1; i < 10; i += 2) {  // Only odd indices: 1, 3, 5, 7, 9
        const current = lowerRing[i];
        const next = lowerRing[(i + 1) % 10];

        // Odd indices connect to star outer hubs
        const starIdx = Math.ceil(i / 2) % 5;
        faces.push([current, next, starOuter[starIdx]]);
    }

    return {
        vertices,
        faces,
        apex,
        upperPentagon,
        starOuter,
        middlePentagon,
        lowerRing
    };
}

// Analyze the structure
const radius = 2;
const dome = create2VGeodesicDomeMethod8(radius);

console.log('\n========== STRUCTURE ANALYSIS ==========\n');

console.log(`Total vertices: ${dome.vertices.length}`);
console.log(`Total faces: ${dome.faces.length}`);

console.log('\n--- Hub Count ---');
console.log(`Apex (5-way): 1`);
console.log(`Upper pentagon (6-way): ${dome.upperPentagon.length}`);
console.log(`Star outer (6-way): ${dome.starOuter.length}`);
console.log(`Middle pentagon (5-way): ${dome.middlePentagon.length}`);
console.log(`Base ring (6-way): ${dome.lowerRing.length}`);
console.log(`TOTAL 5-way hubs: 1 + ${dome.middlePentagon.length} = ${1 + dome.middlePentagon.length}`);
console.log(`TOTAL 6-way hubs: ${dome.upperPentagon.length} + ${dome.starOuter.length} + ${dome.lowerRing.length} = ${dome.upperPentagon.length + dome.starOuter.length + dome.lowerRing.length}`);
console.log(`TOTAL hubs: ${1 + dome.middlePentagon.length + dome.upperPentagon.length + dome.starOuter.length + dome.lowerRing.length}`);

console.log('\n--- Vertex Heights by Layer ---');
console.log(`Apex: y = ${dome.vertices[dome.apex].y.toFixed(3)}`);
console.log(`Upper pentagon: y = ${dome.vertices[dome.upperPentagon[0]].y.toFixed(3)}`);
console.log(`Star outer: y = ${dome.vertices[dome.starOuter[0]].y.toFixed(3)}`);
console.log(`Middle pentagon: y = ${dome.vertices[dome.middlePentagon[0]].y.toFixed(3)}`);
console.log(`Base ring: y = ${dome.vertices[dome.lowerRing[0]].y.toFixed(3)}`);

console.log('\n--- Edge Lengths (sample) ---');
// Apex to upper pentagon (should be SHORT)
const apexToUpper = new Vector3(
    dome.vertices[dome.upperPentagon[0]].x - dome.vertices[dome.apex].x,
    dome.vertices[dome.upperPentagon[0]].y - dome.vertices[dome.apex].y,
    dome.vertices[dome.upperPentagon[0]].z - dome.vertices[dome.apex].z
).length();
console.log(`Apex to upper pentagon: ${apexToUpper.toFixed(3)} (should be SHORT)`);

// Upper pentagon to star (should be LONG)
const upperToStar = new Vector3(
    dome.vertices[dome.starOuter[0]].x - dome.vertices[dome.upperPentagon[0]].x,
    dome.vertices[dome.starOuter[0]].y - dome.vertices[dome.upperPentagon[0]].y,
    dome.vertices[dome.starOuter[0]].z - dome.vertices[dome.upperPentagon[0]].z
).length();
console.log(`Upper pentagon to star outer: ${upperToStar.toFixed(3)} (should be LONG)`);

// Upper pentagon edge (should be LONG)
const upperEdge = new Vector3(
    dome.vertices[dome.upperPentagon[1]].x - dome.vertices[dome.upperPentagon[0]].x,
    dome.vertices[dome.upperPentagon[1]].y - dome.vertices[dome.upperPentagon[0]].y,
    dome.vertices[dome.upperPentagon[1]].z - dome.vertices[dome.upperPentagon[0]].z
).length();
console.log(`Upper pentagon edge: ${upperEdge.toFixed(3)} (should be LONG)`);

console.log('\n--- Visual Layer Structure ---');
console.log('Layer 1: Apex (1 vertex)');
console.log('Layer 2: Upper Pentagon (5 vertices in circle)');
console.log('Layer 3: Star Outer (5 vertices, offset by 36°)');
console.log('Layer 4: Middle Pentagon (5 vertices in circle)');
console.log('Layer 5: Base Ring (10 vertices in circle)');

console.log('\n========== VERIFICATION ==========\n');
console.log('Expected from kit:');
console.log('  6x 5-way hubs');
console.log('  20x 6-way hubs');
console.log('  30x SHORTS');
console.log('  35x LONGS');
console.log('  Total: 26 hubs\n');

const actual5way = 1 + dome.middlePentagon.length;
const actual6way = dome.upperPentagon.length + dome.starOuter.length + dome.lowerRing.length;
console.log(`Actual implementation:`);
console.log(`  ${actual5way}x 5-way hubs ${actual5way === 6 ? '✓' : '✗'}`);
console.log(`  ${actual6way}x 6-way hubs ${actual6way === 20 ? '✓' : '✗'}`);
console.log(`  Total: ${actual5way + actual6way} hubs ${actual5way + actual6way === 26 ? '✓' : '✗'}`);

// Count edges
const edges = new Set();
dome.faces.forEach(face => {
    for (let i = 0; i < 3; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % 3];
        const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
        edges.add(edgeKey);
    }
});
console.log(`\nTotal edges: ${edges.size} (expected: 65)`);
