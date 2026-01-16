// Firestore Dome Storage Service
// Handles CRUD operations for dome data
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from '../firebase-config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from './auth';
import { getLogicalNumberFromGeometryIndex } from '../main';
// Helper function to remove undefined values from FaceData
// Firestore doesn't accept undefined, only null or omitted fields
function cleanFaceData(data) {
    const cleaned = {};
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
// Special constant for initial data identifier
export const INITIAL_DATA_DOME_ID = 'initial-data-v1';
export const INITIAL_DATA_OWNER_ID = 'system';
// Generate a unique GUID for a dome
export function generateDomeId() {
    return crypto.randomUUID();
}
// Save a dome (create or update - ONLY if you own it)
export function saveDome(domeId_1, domeName_1, faceData_1) {
    return __awaiter(this, arguments, void 0, function* (domeId, domeName, faceData, isPublic = true, forkedFromDomeId, forkedFromOwnerId) {
        try {
            const user = getCurrentUser();
            if (!user || !user.email) {
                return { success: false, error: 'User not authenticated' };
            }
            // Convert Map to plain object for Firestore
            // Convert from 0-based geometry indexing to logical face numbering (position-based)
            const faceDataObject = {};
            faceData.forEach((value, geometryIndex) => {
                const logicalNumber = getLogicalNumberFromGeometryIndex(geometryIndex);
                if (logicalNumber !== null) {
                    // Clean the face data to remove undefined values (Firestore doesn't accept them)
                    faceDataObject[logicalNumber] = cleanFaceData(value);
                }
                else {
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
            const existingDome = yield getDoc(domeRef);
            if (existingDome.exists()) {
                const existingData = existingDome.data();
                // SECURITY: Check if current user is the owner
                if (existingData.ownerId !== user.uid) {
                    // User doesn't own this dome - create a fork instead
                    const newDomeId = generateDomeId();
                    return yield saveDomeAs(newDomeId, domeName + ' (fork)', faceData, isPublic, domeId, // forked from this dome
                    existingData.ownerId // original owner
                    );
                }
                // User owns this dome - update it
                yield updateDoc(domeRef, {
                    name: domeName,
                    faceData: faceDataObject,
                    updatedAt: serverTimestamp(),
                    isPublic
                });
                return { success: true, domeId, wasForked: false };
            }
            else {
                // Create new dome
                const domeData = {
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
                yield setDoc(domeRef, domeData);
                return { success: true, domeId, wasForked: !!forkedFromDomeId };
            }
        }
        catch (error) {
            console.error('Error saving dome:', error);
            return {
                success: false,
                error: error.message || 'Failed to save dome'
            };
        }
    });
}
// Save dome as a new copy (explicit fork)
export function saveDomeAs(newDomeId_1, domeName_1, faceData_1) {
    return __awaiter(this, arguments, void 0, function* (newDomeId, domeName, faceData, isPublic = true, forkedFromDomeId, forkedFromOwnerId) {
        try {
            const user = getCurrentUser();
            if (!user || !user.email) {
                return { success: false, error: 'User not authenticated' };
            }
            // Convert Map to plain object for Firestore
            // Convert from 0-based geometry indexing to logical face numbering (position-based)
            const faceDataObject = {};
            faceData.forEach((value, geometryIndex) => {
                const logicalNumber = getLogicalNumberFromGeometryIndex(geometryIndex);
                if (logicalNumber !== null) {
                    // Clean the face data to remove undefined values (Firestore doesn't accept them)
                    faceDataObject[logicalNumber] = cleanFaceData(value);
                }
                else {
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
            const domeData = {
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
            yield setDoc(domeRef, domeData);
            return { success: true, domeId: newDomeId, wasForked: !!forkedFromDomeId };
        }
        catch (error) {
            console.error('Error saving dome as new:', error);
            return {
                success: false,
                error: error.message || 'Failed to save dome as new'
            };
        }
    });
}
// Load a dome by ID (for sharing via URL)
export function loadDomeById(domeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const domeRef = doc(db, 'domes', domeId);
            const domeSnap = yield getDoc(domeRef);
            if (!domeSnap.exists()) {
                return { success: false, error: 'Dome not found' };
            }
            const dome = domeSnap.data();
            // Check if dome is public or if user is the owner
            const user = getCurrentUser();
            if (!dome.isPublic && (!user || user.uid !== dome.ownerId)) {
                return { success: false, error: 'Dome is private and you are not the owner' };
            }
            return { success: true, dome };
        }
        catch (error) {
            console.error('Error loading dome:', error);
            return {
                success: false,
                error: error.message || 'Failed to load dome'
            };
        }
    });
}
// Get all domes for the current user
export function getUserDomes() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }
            const domesRef = collection(db, 'domes');
            const q = query(domesRef, where('ownerId', '==', user.uid), orderBy('updatedAt', 'desc'));
            const querySnapshot = yield getDocs(q);
            const domes = [];
            querySnapshot.forEach((docSnapshot) => {
                domes.push(docSnapshot.data());
            });
            return { success: true, domes };
        }
        catch (error) {
            console.error('Error getting user domes:', error);
            return {
                success: false,
                error: error.message || 'Failed to get user domes'
            };
        }
    });
}
// Delete a dome
export function deleteDome(domeId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }
            // Verify ownership
            const { success, dome, error } = yield loadDomeById(domeId);
            if (!success || !dome) {
                return { success: false, error: error || 'Dome not found' };
            }
            if (dome.ownerId !== user.uid) {
                return { success: false, error: 'You are not the owner of this dome' };
            }
            const domeRef = doc(db, 'domes', domeId);
            yield deleteDoc(domeRef);
            return { success: true };
        }
        catch (error) {
            console.error('Error deleting dome:', error);
            return {
                success: false,
                error: error.message || 'Failed to delete dome'
            };
        }
    });
}
// Get share URL for a dome
export function getShareUrl(domeId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?dome=${domeId}`;
}
