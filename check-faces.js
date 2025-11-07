// Check if my face connections are creating the base ring properly

// Simulating the face creation from my code
const faces = [];

// Assuming indices based on my structure:
// middlePentagon: indices 11-15
// starOuter: indices 6-10
// lowerRing: indices 16-25

const middlePentagon = [11, 12, 13, 14, 15];
const starOuter = [6, 7, 8, 9, 10];
const lowerRing = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

// My current connection logic
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

console.log('Faces connecting to base ring:');
faces.forEach((face, i) => {
    console.log(`Face ${i}: [${face[0]}, ${face[1]}, ${face[2]}]`);
});

// Check if base ring edges are created
const baseRingEdges = new Set();
faces.forEach(face => {
    for (let i = 0; i < 3; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % 3];
        if (lowerRing.includes(v1) && lowerRing.includes(v2)) {
            const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
            baseRingEdges.add(edgeKey);
        }
    }
});

console.log(`\nBase ring edges created: ${baseRingEdges.size}`);
console.log('Base ring edges:');
Array.from(baseRingEdges).sort().forEach(edge => {
    console.log(`  ${edge}`);
});

console.log(`\nExpected: 10 LONGS connecting the 10 base ring vertices in a circle`);
console.log(`Actual: ${baseRingEdges.size} edges`);

// The base ring should form a complete circle
// Vertices 16-25 should be connected: 16-17, 17-18, ..., 25-16
const expectedBaseRingEdges = [];
for (let i = 0; i < 10; i++) {
    const v1 = lowerRing[i];
    const v2 = lowerRing[(i + 1) % 10];
    const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
    expectedBaseRingEdges.push(edgeKey);
}

console.log('\nExpected base ring edges:');
expectedBaseRingEdges.forEach(edge => {
    const has = baseRingEdges.has(edge);
    console.log(`  ${edge} ${has ? '✓' : '✗ MISSING'}`);
});
