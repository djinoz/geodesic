import * as THREE from 'three';
import { GeodesicData } from '../methods/types';

// Use window-based singleton to prevent module duplication issues with Vite
interface GeometryStateGlobal {
    geodesicData: GeodesicData | null;
    completeGeometry: THREE.BufferGeometry | null;
    logicalNumberingCache: {
        logicalNumbers: number[],
        originalToLogicalMap: Map<number, number>,
        logicalToOriginalMap: Map<number, number>
    } | null;
}

// Initialize global state if not present
if (typeof window !== 'undefined') {
    if (!(window as any).__geometryState) {
        (window as any).__geometryState = {
            geodesicData: null,
            completeGeometry: null,
            logicalNumberingCache: null
        } as GeometryStateGlobal;
    }
}

// Accessor function for state
function getState(): GeometryStateGlobal {
    if (typeof window !== 'undefined' && (window as any).__geometryState) {
        return (window as any).__geometryState;
    }
    // Fallback for SSR or non-browser environments
    return {
        geodesicData: null,
        completeGeometry: null,
        logicalNumberingCache: null
    };
}

// Set the geometry state
export function setGeometryState(data: GeodesicData, geometry: THREE.BufferGeometry) {
    const state = getState();
    state.geodesicData = data;
    state.completeGeometry = geometry;
    clearLogicalNumberingCache();
    console.log(`setGeometryState: geodesicData=${!!state.geodesicData}, completeGeometry=${!!state.completeGeometry}, faces=${state.geodesicData?.faces?.length}`);
}

// Debug function to check state
export function debugGeometryState(): { hasGeodesicData: boolean; hasCompleteGeometry: boolean; faceCount: number | null } {
    const state = getState();
    console.log(`debugGeometryState: geodesicData=${!!state.geodesicData}, completeGeometry=${!!state.completeGeometry}`);
    return {
        hasGeodesicData: !!state.geodesicData,
        hasCompleteGeometry: !!state.completeGeometry,
        faceCount: state.geodesicData?.faces?.length ?? null
    };
}

// Clear the cache
export function clearLogicalNumberingCache(): void {
    const state = getState();
    state.logicalNumberingCache = null;
    console.log('Cleared logical numbering cache');
}

// Helper function to get face centroid and normal
export function getFaceCentroidAndNormal(geom: THREE.BufferGeometry, faceIdx: number): { centroid: THREE.Vector3; normal: THREE.Vector3 } | null {
    if (!geom || !geom.attributes) {
        console.warn("Invalid geometry passed to getFaceCentroidAndNormal");
        return null;
    }

    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const indexAttr = geom.index;

    if (!indexAttr) {
        console.warn("Geometry is not indexed. Cannot reliably get face centroid by faceIndex.");
        return null;
    }

    // Check if faceIdx is valid
    const maxFaceIndex = indexAttr.count / 3 - 1;
    if (faceIdx > maxFaceIndex) {
        console.warn(`Face index ${faceIdx} exceeds max face index ${maxFaceIndex}`);
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

// Create logical face numbering starting from top and spiraling down
export function createLogicalFaceNumbering(): {
    logicalNumbers: number[],
    originalToLogicalMap: Map<number, number>,
    logicalToOriginalMap: Map<number, number>
} {
    const state = getState();

    // Return cached result if available
    if (state.logicalNumberingCache !== null) {
        return state.logicalNumberingCache;
    }

    console.log('Creating NEW logical face numbering (not cached)');

    // Safety check: ensure geometry is ready before creating cache
    if (!state.completeGeometry || !state.geodesicData || !state.geodesicData.faces) {
        console.error('Cannot create logical numbering - geometry not ready');
        // Return empty maps as fallback
        return {
            logicalNumbers: [],
            originalToLogicalMap: new Map(),
            logicalToOriginalMap: new Map()
        };
    }

    const totalFaces = state.geodesicData.faces.length;
    const faceHeights: { index: number; y: number; centroid: THREE.Vector3 }[] = [];

    // Calculate centroid and height for each face
    for (let faceIndex = 0; faceIndex < totalFaces; faceIndex++) {
        const faceData = getFaceCentroidAndNormal(state.completeGeometry, faceIndex);
        if (faceData) {
            faceHeights.push({
                index: faceIndex,
                y: faceData.centroid.y,
                centroid: faceData.centroid
            });
        }
    }

    // Group faces by height levels with tolerance
    const heightTolerance = 0.2;
    const levels: { index: number; centroid: THREE.Vector3 }[][] = [];

    faceHeights.sort((a, b) => b.y - a.y); // Sort by height, highest first

    faceHeights.forEach(face => {
        // Find existing level or create new one
        let levelFound = false;
        for (const level of levels) {
            if (level.length > 0 && Math.abs(level[0].centroid.y - face.y) < heightTolerance) {
                level.push({ index: face.index, centroid: face.centroid });
                levelFound = true;
                break;
            }
        }
        if (!levelFound) {
            levels.push([{ index: face.index, centroid: face.centroid }]);
        }
    });

    // Sort faces within each level by angle around the Y axis
    levels.forEach(level => {
        level.sort((a, b) => {
            const angleA = Math.atan2(a.centroid.z, a.centroid.x);
            const angleB = Math.atan2(b.centroid.z, b.centroid.x);
            const angleDiff = angleA - angleB;

            // If angles are very close (within floating-point precision), use index as tiebreaker
            if (Math.abs(angleDiff) < 0.000001) {
                return a.index - b.index; // Deterministic tiebreaker
            }
            return angleDiff;
        });
    });

    // Create bidirectional mappings between original face index and logical number
    const logicalNumbering: number[] = new Array(totalFaces);
    const originalToLogicalMap = new Map<number, number>();
    const logicalToOriginalMap = new Map<number, number>();
    let logicalNumber = 1;

    levels.forEach(level => {
        level.forEach(face => {
            logicalNumbering[face.index] = logicalNumber;
            originalToLogicalMap.set(face.index, logicalNumber);
            logicalToOriginalMap.set(logicalNumber, face.index);
            logicalNumber++;
        });
    });

    // Cache the result for consistency
    state.logicalNumberingCache = { logicalNumbers: logicalNumbering, originalToLogicalMap, logicalToOriginalMap };

    return state.logicalNumberingCache;
}

// Helper function: Convert from geometry index (0-based) to logical face number (1-based position-based)
export function getLogicalNumberFromGeometryIndex(geometryIndex: number): number | null {
    const state = getState();

    try {
        // Check if dome is initialized
        if (!state.completeGeometry || !state.geodesicData || !state.geodesicData.faces) {
            console.error(`CONVERSION ERROR: Cannot convert geometry index ${geometryIndex} - dome not initialized.`);
            return null;
        }

        // Check if geometry index is valid
        if (geometryIndex < 0 || geometryIndex >= state.geodesicData.faces.length) {
            console.error(`CONVERSION ERROR: Geometry index ${geometryIndex} out of range (0-${state.geodesicData.faces.length - 1})`);
            return null;
        }

        const { originalToLogicalMap } = createLogicalFaceNumbering();
        const result = originalToLogicalMap.get(geometryIndex) ?? null;

        if (result === null) {
            console.error(`CONVERSION ERROR: No logical number found for geometry index ${geometryIndex}.`);
        }

        return result;
    } catch (error) {
        console.error(`CONVERSION ERROR: Exception converting geometry index ${geometryIndex}:`, error);
        return null;
    }
}

// Helper function: Convert from logical face number (1-based position-based) to geometry index (0-based)
export function getGeometryIndexFromLogicalNumber(logicalNumber: number): number | null {
    const state = getState();

    try {
        // Check if dome is initialized
        if (!state.completeGeometry || !state.geodesicData || !state.geodesicData.faces) {
            console.error(`CONVERSION ERROR: Cannot convert logical number ${logicalNumber} - dome not initialized.`);
            return null;
        }

        // Check if logical number is reasonable
        if (logicalNumber < 1 || logicalNumber > state.geodesicData.faces.length) {
            console.error(`CONVERSION ERROR: Logical number ${logicalNumber} out of range (1-${state.geodesicData.faces.length}).`);
            return null;
        }

        const { logicalToOriginalMap } = createLogicalFaceNumbering();
        const result = logicalToOriginalMap.get(logicalNumber) ?? null;

        if (result === null) {
            console.error(`CONVERSION ERROR: No geometry index found for logical number ${logicalNumber}.`);
        }

        return result;
    } catch (error) {
        console.error(`CONVERSION ERROR: Exception converting logical number ${logicalNumber}:`, error);
        return null;
    }
}
