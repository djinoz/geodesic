// Count edge types and check against kit specs

class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
}

// Recreate dome structure (simplified)
const radius = 2;
const vertices = [];
const faces = [];

// Apex
vertices.push(new Vector3(0, radius, 0));

// Upper pentagon
const pentagonHeight = 0.81 * radius;
const pentagonRadius = 0.59 * radius;
const upperPentagon = [];
for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    vertices.push(new Vector3(
        pentagonRadius * Math.cos(angle),
        pentagonHeight,
        pentagonRadius * Math.sin(angle)
    ));
    upperPentagon.push(vertices.length - 1);
}

// Star outer
const starOuter = [];
for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 + Math.PI / 5;
    vertices.push(new Vector3(
        0.95 * radius * Math.cos(angle),
        0.59 * radius,
        0.95 * radius * Math.sin(angle)
    ));
    starOuter.push(vertices.length - 1);
}

// Middle pentagon
const middlePentagon = [];
for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5;
    vertices.push(new Vector3(
        0.95 * radius * Math.cos(angle),
        0.31 * radius,
        0.95 * radius * Math.sin(angle)
    ));
    middlePentagon.push(vertices.length - 1);
}

// Lower ring
const lowerRing = [];
for (let i = 0; i < 10; i++) {
    const angle = (i * 2 * Math.PI) / 10;
    vertices.push(new Vector3(
        1.15 * radius * Math.cos(angle),
        0,
        1.15 * radius * Math.sin(angle)
    ));
    lowerRing.push(vertices.length - 1);
}

// Build face list
const apex = 0;

// Top pentagon faces
for (let i = 0; i < 5; i++) {
    faces.push([apex, upperPentagon[i], upperPentagon[(i + 1) % 5]]);
}

// Star faces
for (let i = 0; i < 5; i++) {
    faces.push([upperPentagon[i], starOuter[i], upperPentagon[(i + 1) % 5]]);
}

// Upper to middle connections
for (let i = 0; i < 5; i++) {
    faces.push([upperPentagon[i], middlePentagon[i], starOuter[i]]);
}

// Middle to lower connections
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

// Base ring completion
for (let i = 1; i < 10; i += 2) {
    const current = lowerRing[i];
    const next = lowerRing[(i + 1) % 10];
    const starIdx = Math.ceil(i / 2) % 5;
    faces.push([current, next, starOuter[starIdx]]);
}

console.log(`Total faces: ${faces.length}`);
console.log(`Total vertices: ${vertices.length}\n`);

// Count edges and measure their lengths
const edgeMap = new Map();

faces.forEach(face => {
    for (let i = 0; i < 3; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % 3];
        const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;

        if (!edgeMap.has(edgeKey)) {
            const p1 = vertices[v1];
            const p2 = vertices[v2];
            const length = new Vector3(
                p2.x - p1.x,
                p2.y - p1.y,
                p2.z - p1.z
            ).length();
            edgeMap.set(edgeKey, { length, count: 1 });
        } else {
            edgeMap.get(edgeKey).count++;
        }
    }
});

console.log(`Total unique edges: ${edgeMap.size}\n`);

// Classify edges by length
const edges = Array.from(edgeMap.entries()).map(([key, data]) => ({
    key,
    length: data.length,
    count: data.count
}));

edges.sort((a, b) => a.length - b.length);

// Group by similar lengths (tolerance 0.01)
const groups = [];
let currentGroup = [edges[0]];

for (let i = 1; i < edges.length; i++) {
    if (Math.abs(edges[i].length - currentGroup[0].length) < 0.1) {
        currentGroup.push(edges[i]);
    } else {
        groups.push(currentGroup);
        currentGroup = [edges[i]];
    }
}
groups.push(currentGroup);

console.log(`Edge length groups:\n`);
groups.forEach((group, idx) => {
    const avgLength = group.reduce((sum, e) => sum + e.length, 0) / group.length;
    console.log(`Group ${idx + 1}: ${group.length} edges, avg length = ${avgLength.toFixed(3)}`);

    // Determine if SHORT or LONG
    const type = avgLength < 1.3 ? 'SHORT' : 'LONG';
    console.log(`  Type: ${type}`);
    console.log();
});

console.log('\nExpected from kit:');
console.log('  30x SHORTS');
console.log('  35x LONGS');
console.log('  Total: 65 struts');
console.log('\nUser counted: 70 edges');
console.log(`\nActual mesh edges: ${edgeMap.size}`);
