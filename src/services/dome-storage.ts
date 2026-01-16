// Firestore Dome Storage Service
// Handles CRUD operations for dome data

import { db } from '../firebase-config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { FaceData } from '../ui';
import { getCurrentUser } from './auth';
import { getLogicalNumberFromGeometryIndex } from '../main';

// Helper function to remove undefined values from FaceData
// Firestore doesn't accept undefined, only null or omitted fields
function cleanFaceData(data: FaceData): FaceData {
    const cleaned: FaceData = {};

    if (data.name !== undefined && data.name !== '') {
        cleaned.name = data.name;
    }
    if (data.description !== undefined && data.description !== '') {
        cleaned.description = data.description;
    }
    if (data.readMoreUrl !== undefined && data.readMoreUrl !== '') {
        cleaned.readMoreUrl = data.readMoreUrl;
    }

    return cleaned;
}

// Dome interface
export interface DomeData {
    id: string; // GUID for the dome
    name: string; // User-provided name for the dome
    ownerEmail: string;
    ownerId: string; // Firebase UID
    faceData: Record<number, FaceData>; // Face index to FaceData mapping
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isPublic: boolean; // Whether dome can be shared via URL
    forkedFromDomeId?: string; // ID of the dome this was forked from (if any)
    forkedFromOwnerId?: string; // Owner ID of the original dome (if forked)
}

// Special constant for initial data identifier
export const INITIAL_DATA_DOME_ID = 'initial-data-v1';
export const INITIAL_DATA_OWNER_ID = 'system';

// Generate a unique GUID for a dome
export function generateDomeId(): string {
    return crypto.randomUUID();
}

// Save a dome (create or update - ONLY if you own it)
export async function saveDome(
    domeId: string,
    domeName: string,
    faceData: Map<number, FaceData>,
    isPublic: boolean = true,
    forkedFromDomeId?: string,
    forkedFromOwnerId?: string
): Promise<{ success: boolean; error?: string; domeId?: string; wasForked?: boolean }> {
    try {
        const user = getCurrentUser();
        console.log('saveDome: Current user:', user ? { uid: user.uid, email: user.email } : 'NULL');

        if (!user || !user.email) {
            console.error('saveDome: User not authenticated or email missing');
            return { success: false, error: 'User not authenticated' };
        }

        // Convert Map to plain object for Firestore
        // Convert from 0-based geometry indexing to logical face numbering (position-based)
        const faceDataObject: Record<number, FaceData> = {};
        faceData.forEach((value, geometryIndex) => {
            const logicalNumber = getLogicalNumberFromGeometryIndex(geometryIndex);
            if (logicalNumber !== null) {
                // Clean the face data to remove undefined values (Firestore doesn't accept them)
                faceDataObject[logicalNumber] = cleanFaceData(value);
            } else {
                console.error(`SAVE ERROR: Could not convert geometry index ${geometryIndex} to logical number. Total faces in map: ${faceData.size}`);
            }
        });

        // Validate that we have data to save
        if (Object.keys(faceDataObject).length === 0 && faceData.size > 0) {
            console.error('CRITICAL: All face data was lost during conversion! Original size:', faceData.size);
            return {
                success: false,
                error: 'Failed to convert face data for storage. Please reload the page and try again.'
            };
        }

        console.log(`saveDome: Converting ${faceData.size} faces from geometry indices to ${Object.keys(faceDataObject).length} logical numbers for storage`);

        const domeRef = doc(db, 'domes', domeId);

        // Check if dome exists
        const existingDome = await getDoc(domeRef);

        if (existingDome.exists()) {
            const existingData = existingDome.data() as DomeData;

            // SECURITY: Check if current user is the owner
            if (existingData.ownerId !== user.uid) {
                // User doesn't own this dome - create a fork instead
                const newDomeId = generateDomeId();
                return await saveDomeAs(
                    newDomeId,
                    domeName + ' (fork)',
                    faceData,
                    isPublic,
                    domeId, // forked from this dome
                    existingData.ownerId // original owner
                );
            }

            // User owns this dome - update it
            await updateDoc(domeRef, {
                name: domeName,
                faceData: faceDataObject,
                updatedAt: serverTimestamp(),
                isPublic
            });

            return { success: true, domeId, wasForked: false };
        } else {
            // Create new dome
            const domeData: any = {
                id: domeId,
                name: domeName,
                ownerEmail: user.email,
                ownerId: user.uid,
                faceData: faceDataObject,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isPublic
            };

            // Add fork tracking if provided
            if (forkedFromDomeId) {
                domeData.forkedFromDomeId = forkedFromDomeId;
                domeData.forkedFromOwnerId = forkedFromOwnerId || INITIAL_DATA_OWNER_ID;
            }

            console.log('saveDome: Creating new dome with data:', {
                id: domeData.id,
                name: domeData.name,
                ownerId: domeData.ownerId,
                ownerEmail: domeData.ownerEmail,
                isPublic: domeData.isPublic,
                faceDataKeys: Object.keys(domeData.faceData).length,
                hasForkedFrom: !!domeData.forkedFromDomeId
            });

            await setDoc(domeRef, domeData);

            return { success: true, domeId, wasForked: !!forkedFromDomeId };
        }
    } catch (error: any) {
        console.error('Error saving dome:', error);
        console.error('Error details:', error.code, error.message);
        return {
            success: false,
            error: error.message || 'Failed to save dome'
        };
    }
}

// Save dome as a new copy (explicit fork)
export async function saveDomeAs(
    newDomeId: string,
    domeName: string,
    faceData: Map<number, FaceData>,
    isPublic: boolean = true,
    forkedFromDomeId?: string,
    forkedFromOwnerId?: string
): Promise<{ success: boolean; error?: string; domeId?: string; wasForked?: boolean }> {
    try {
        const user = getCurrentUser();
        if (!user || !user.email) {
            return { success: false, error: 'User not authenticated' };
        }

        // Convert Map to plain object for Firestore
        // Convert from 0-based geometry indexing to logical face numbering (position-based)
        const faceDataObject: Record<number, FaceData> = {};
        faceData.forEach((value, geometryIndex) => {
            const logicalNumber = getLogicalNumberFromGeometryIndex(geometryIndex);
            if (logicalNumber !== null) {
                // Clean the face data to remove undefined values (Firestore doesn't accept them)
                faceDataObject[logicalNumber] = cleanFaceData(value);
            } else {
                console.error(`SAVE AS ERROR: Could not convert geometry index ${geometryIndex} to logical number. Total faces in map: ${faceData.size}`);
            }
        });

        // Validate that we have data to save
        if (Object.keys(faceDataObject).length === 0 && faceData.size > 0) {
            console.error('CRITICAL: All face data was lost during conversion! Original size:', faceData.size);
            return {
                success: false,
                error: 'Failed to convert face data for storage. Please reload the page and try again.'
            };
        }

        console.log(`saveDomeAs: Converting ${faceData.size} faces from geometry indices to ${Object.keys(faceDataObject).length} logical numbers for storage`);

        const domeRef = doc(db, 'domes', newDomeId);

        // Create new dome (always create, never update)
        const domeData: any = {
            id: newDomeId,
            name: domeName,
            ownerEmail: user.email,
            ownerId: user.uid,
            faceData: faceDataObject,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isPublic
        };

        // Add fork tracking if provided
        if (forkedFromDomeId) {
            domeData.forkedFromDomeId = forkedFromDomeId;
            domeData.forkedFromOwnerId = forkedFromOwnerId || INITIAL_DATA_OWNER_ID;
        }

        await setDoc(domeRef, domeData);

        return { success: true, domeId: newDomeId, wasForked: !!forkedFromDomeId };
    } catch (error: any) {
        console.error('Error saving dome as new:', error);
        return {
            success: false,
            error: error.message || 'Failed to save dome as new'
        };
    }
}

// Load a dome by ID (for sharing via URL)
export async function loadDomeById(domeId: string): Promise<{ success: boolean; dome?: DomeData; error?: string }> {
    try {
        const domeRef = doc(db, 'domes', domeId);
        const domeSnap = await getDoc(domeRef);

        if (!domeSnap.exists()) {
            return { success: false, error: 'Dome not found' };
        }

        const dome = domeSnap.data() as DomeData;

        // Check if dome is public or if user is the owner
        const user = getCurrentUser();
        if (!dome.isPublic && (!user || user.uid !== dome.ownerId)) {
            return { success: false, error: 'Dome is private and you are not the owner' };
        }

        return { success: true, dome };
    } catch (error: any) {
        console.error('Error loading dome:', error);
        return {
            success: false,
            error: error.message || 'Failed to load dome'
        };
    }
}

// Get all domes for the current user
export async function getUserDomes(): Promise<{ success: boolean; domes?: DomeData[]; error?: string }> {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const domesRef = collection(db, 'domes');
        const q = query(
            domesRef,
            where('ownerId', '==', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const domes: DomeData[] = [];

        querySnapshot.forEach((docSnapshot) => {
            domes.push(docSnapshot.data() as DomeData);
        });

        return { success: true, domes };
    } catch (error: any) {
        console.error('Error getting user domes:', error);
        return {
            success: false,
            error: error.message || 'Failed to get user domes'
        };
    }
}

// Delete a dome
export async function deleteDome(domeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        // Verify ownership
        const { success, dome, error } = await loadDomeById(domeId);
        if (!success || !dome) {
            return { success: false, error: error || 'Dome not found' };
        }

        if (dome.ownerId !== user.uid) {
            return { success: false, error: 'You are not the owner of this dome' };
        }

        const domeRef = doc(db, 'domes', domeId);
        await deleteDoc(domeRef);

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting dome:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete dome'
        };
    }
}

// Get share URL for a dome
export function getShareUrl(domeId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?dome=${domeId}`;
}
