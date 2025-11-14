import * as THREE from 'three';

export interface GeodesicData {
    vertices: THREE.Vector3[];
    faces: number[][];
    newTriangleFaceStartIndex?: number;
    newTriangleFaceCount?: number;
    edges?: [number, number, 'SHORT' | 'LONG', number][]; // Optional: edges with type and step number for Method 12
    debugLabels?: {
        ringVertices?: number[]; // Indices of ring vertices for Step 7
        strutEndpoints?: { vertexIndex: number; label: string }[]; // Strut endpoint info
        strutLengths?: { v1: number; v2: number; label: string; actualLength: number; expectedLength: number }[]; // Strut length debug info
    };
}
