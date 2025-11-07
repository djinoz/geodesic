// Check which star vertices connect to which base ring vertices

const starOuter = [6, 7, 8, 9, 10];
const lowerRing = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

console.log('From first loop Face 3 and Face 4, star connections are:\n');

for (let i = 0; i < 5; i++) {
    const lower1 = lowerRing[i * 2];
    const nextStar = starOuter[(i + 1) % 5];
    const lower1plus2 = lowerRing[((i + 1) * 2) % 10];

    console.log(`star[${i}]=${starOuter[i]} connects to lower[${i*2}]=${lower1}`);
    console.log(`star[${(i+1)%5}]=${nextStar} connects to lower[${i*2}]=${lower1} and lower[${((i+1)*2)%10}]=${lower1plus2}`);
    console.log();
}

console.log('\nMissing base ring edges and which star vertex should bridge them:\n');

const missing = [
    {edge: '17-18', between: [17, 18], lowerIndices: [1, 2]},
    {edge: '19-20', between: [19, 20], lowerIndices: [3, 4]},
    {edge: '21-22', between: [21, 22], lowerIndices: [5, 6]},
    {edge: '23-24', between: [23, 24], lowerIndices: [7, 8]},
    {edge: '25-16', between: [25, 16], lowerIndices: [9, 0]}
];

missing.forEach(m => {
    // Find which star vertex connects to both endpoints
    const [v1, v2] = m.between;

    // From the pattern: star[i] connects to lower[i*2]
    // nextStar (star[(i+1)%5]) connects to lower[i*2] and lower[((i+1)*2)%10]

    // v1 index in lowerRing
    const idx1 = m.lowerIndices[0];
    const idx2 = m.lowerIndices[1];

    console.log(`Edge ${m.edge}:`);
    console.log(`  Between lower[${idx1}]=${v1} and lower[${idx2}]=${v2}`);

    // Which star vertices connect to these?
    // From Face 3: star[i] connects to lower[i*2]
    // From Face 4: star[(i+1)%5] connects to lower[i*2] and lower[((i+1)*2)%10]

    // For lower[1]=17 (odd index), it's between lower[0] and lower[2]
    // star[(0+1)%5]=star[1] connects to lower[0] and lower[2]
    // So star[1] should connect 17-18!

    const starForThisEdge = Math.ceil(idx1 / 2) % 5;
    console.log(`  Should connect to star[${starForThisEdge}]=${starOuter[starForThisEdge]}`);
    console.log();
});
