// Build dome from actual strut lengths
// For a real 2V geodesic dome, calculate proper vertex positions

// Standard 2V geodesic dome geometry
// Based on frequency-2 subdivision of icosahedron face

class Vector3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        return new Vector3(this.x / len, this.y / len, this.z / len);
    }

    multiplyScalar(s) {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}

// For a 2V geodesic dome (half-sphere), we need to know:
// - Radius of the dome
// - Two edge lengths: SHORT and LONG

// In a proper 2V geodesic dome:
// - SHORT length / radius ratio ≈ 0.546
// - LONG length / radius ratio ≈ 0.618

const radius = 2;
const SHORT_LENGTH = 0.546 * radius;  // ≈ 1.092
const LONG_LENGTH = 0.618 * radius;    // ≈ 1.236

console.log('2V Geodesic Dome Parameters:');
console.log(`Radius: ${radius}`);
console.log(`SHORT length: ${SHORT_LENGTH.toFixed(3)}`);
console.log(`LONG length: ${LONG_LENGTH.toFixed(3)}`);
console.log(`SHORT/LONG ratio: ${(SHORT_LENGTH / LONG_LENGTH).toFixed(3)}`);
console.log();

// A 2V geodesic dome has specific vertex coordinates
// For a half-dome (hemisphere), starting from icosahedron geometry:

const phi = (1 + Math.sqrt(5)) / 2;  // Golden ratio

// Create vertices for 2V geodesic dome
// Using standard icosahedron subdivision

console.log('Building proper 2V geodesic dome structure...\n');

// For the hubs kit with 26 hubs (6 five-way + 20 six-way),
// the structure should follow a specific pattern.

// Let me verify the vertex count for a 2V geodesic hemisphere:
// A full 2V icosahedron has 42 vertices
// A hemisphere (half) would have roughly 26-27 vertices
// This matches our kit!

console.log('Kit has 26 hubs - this matches a 2V geodesic hemisphere!');
console.log('Expected edge ratio for 2V: SHORT ≈ 0.88 × LONG');
console.log(`For radius ${radius}:`);
console.log(`  SHORT should be: ${SHORT_LENGTH.toFixed(3)}`);
console.log(`  LONG should be: ${LONG_LENGTH.toFixed(3)}`);
