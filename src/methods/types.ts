import * as THREE from 'three';

export interface GeodesicData {
    vertices: THREE.Vector3[];
    faces: number[][];
    newTriangleFaceStartIndex?: number;
    newTriangleFaceCount?: number;
}
