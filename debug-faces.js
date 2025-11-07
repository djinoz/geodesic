// Debug what faces we're creating and find duplicates

const middlePentagon = [11, 12, 13, 14, 15];
const starOuter = [6, 7, 8, 9, 10];
const lowerRing = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

const faces = [];

console.log('===== FIRST LOOP (original connections) =====\n');
for (let i = 0; i < 5; i++) {
    const lower1 = lowerRing[i * 2];
    const lower2 = lowerRing[i * 2 + 1];
    const nextMiddle = middlePentagon[(i + 1) % 5];
    const nextStar = starOuter[(i + 1) % 5];

    console.log(`Iteration ${i}:`);
    console.log(`  lower1=${lower1}, lower2=${lower2}`);
    console.log(`  nextMiddle=${nextMiddle}, nextStar=${nextStar}`);

    const f1 = [middlePentagon[i], lower1, lower2];
    const f2 = [middlePentagon[i], lower2, nextMiddle];
    const f3 = [starOuter[i], lower1, nextStar];
    const f4 = [nextStar, lower1, lowerRing[((i + 1) * 2) % 10]];

    console.log(`  Face 1: [${f1}] - middle[${i}] to lower1 to lower2`);
    console.log(`  Face 2: [${f2}] - middle[${i}] to lower2 to nextMiddle`);
    console.log(`  Face 3: [${f3}] - star[${i}] to lower1 to nextStar`);
    console.log(`  Face 4: [${f4}] - nextStar to lower1 to lower1+2`);

    faces.push(f1, f2, f3, f4);
    console.log();
}

console.log(`Total faces after first loop: ${faces.length}\n`);

console.log('===== SECOND LOOP (new base ring connections) =====\n');
const newFaces = [];
for (let i = 0; i < 10; i++) {
    const current = lowerRing[i];
    const next = lowerRing[(i + 1) % 10];

    if (i % 2 === 0) {
        const middleIdx = Math.floor(i / 2);
        const f = [current, next, middlePentagon[middleIdx]];
        console.log(`i=${i} (even): [${f}] - lower[${i}] to lower[${(i+1)%10}] to middle[${middleIdx}]`);
        newFaces.push(f);
    } else {
        const starIdx = Math.floor(i / 2);
        const f = [current, next, starOuter[starIdx]];
        console.log(`i=${i} (odd): [${f}] - lower[${i}] to lower[${(i+1)%10}] to star[${starIdx}]`);
        newFaces.push(f);
    }
}

console.log(`\nTotal faces in second loop: ${newFaces.length}\n`);

// Check for duplicates
console.log('===== CHECKING FOR DUPLICATE FACES =====\n');

function normalizeFace(face) {
    const sorted = face.slice().sort((a, b) => a - b);
    return sorted.join(',');
}

const faceSet = new Set();
const duplicates = [];

faces.forEach((face, i) => {
    const key = normalizeFace(face);
    if (faceSet.has(key)) {
        duplicates.push({ index: i, face, key });
    } else {
        faceSet.add(key);
    }
});

newFaces.forEach((face, i) => {
    const key = normalizeFace(face);
    if (faceSet.has(key)) {
        duplicates.push({ index: faces.length + i, face, key, isNew: true });
        console.log(`DUPLICATE FOUND: [${face}] from second loop already exists!`);
    } else {
        faceSet.add(key);
    }
});

if (duplicates.length > 0) {
    console.log(`\nFound ${duplicates.length} duplicate faces!`);
} else {
    console.log('\nNo duplicates found.');
}

console.log(`\nTotal unique faces: ${faceSet.size}`);
console.log(`Expected faces for complete dome: ~45-50`);
