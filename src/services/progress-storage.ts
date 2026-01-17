// Progress Storage Service
// Handles user progress tracking for dome faces in Firestore

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import app from '../firebase-config';
import { getCurrentUser } from './auth';

const db = getFirestore(app);
const PROGRESS_COLLECTION = 'progress';

// Types
export type FaceStatus = 'not-done' | 'in-progress' | 'completed';

export interface FaceProgressEntry {
    status: FaceStatus;
    inProgressAt: Timestamp | null;
    completedAt: Timestamp | null;
    auditTrail: string;
}

export interface ProgressData {
    id: string;                              // {userId}_{domeId}
    userId: string;                          // Firebase UID
    domeId: string;                          // Dome document ID
    faceProgress: Record<number, FaceProgressEntry>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Generate composite document ID
function getProgressDocId(userId: string, domeId: string): string {
    return `${userId}_${domeId}`;
}

// Load user's progress for a dome
export async function loadProgress(domeId: string): Promise<ProgressData | null> {
    const user = getCurrentUser();
    if (!user) {
        console.log('loadProgress: No authenticated user');
        return null;
    }

    try {
        const docId = getProgressDocId(user.uid, domeId);
        const docRef = doc(db, PROGRESS_COLLECTION, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as ProgressData;
            console.log(`Loaded progress for dome ${domeId}: ${Object.keys(data.faceProgress || {}).length} faces tracked`);
            return data;
        } else {
            console.log(`No progress found for dome ${domeId}`);
            return null;
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        return null;
    }
}

// Update face progress (auto-save)
export async function updateFaceProgress(
    domeId: string,
    faceIndex: number,
    newStatus: FaceStatus
): Promise<{ success: boolean; error?: string }> {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        const docId = getProgressDocId(user.uid, domeId);
        const docRef = doc(db, PROGRESS_COLLECTION, docId);
        const docSnap = await getDoc(docRef);

        const now = Timestamp.now();
        const nowIso = new Date().toISOString();

        let progressData: ProgressData;
        let previousStatus: FaceStatus = 'not-done';

        if (docSnap.exists()) {
            progressData = docSnap.data() as ProgressData;
            const existingEntry = progressData.faceProgress[faceIndex + 1];
            if (existingEntry) {
                previousStatus = existingEntry.status;
            }
        } else {
            // Create new progress document
            progressData = {
                id: docId,
                userId: user.uid,
                domeId: domeId,
                faceProgress: {},
                createdAt: now,
                updatedAt: now
            };
        }

        // Build the updated face entry
        const existingEntry = progressData.faceProgress[faceIndex + 1] || {
            status: 'not-done',
            inProgressAt: null,
            completedAt: null,
            auditTrail: ''
        };

        const updatedEntry: FaceProgressEntry = {
            status: newStatus,
            inProgressAt: existingEntry.inProgressAt,
            completedAt: existingEntry.completedAt,
            auditTrail: existingEntry.auditTrail
        };

        // Update timestamps based on status change
        if (newStatus === 'in-progress') {
            // Set inProgressAt on first time becoming in-progress
            if (!updatedEntry.inProgressAt) {
                updatedEntry.inProgressAt = now;
            }
            // Clear completedAt when going back to in-progress
            updatedEntry.completedAt = null;
        } else if (newStatus === 'completed') {
            // Set completedAt when completed
            updatedEntry.completedAt = now;
        } else if (newStatus === 'not-done') {
            // Clear both timestamps when resetting
            updatedEntry.inProgressAt = null;
            updatedEntry.completedAt = null;
        }

        // Append to audit trail
        const auditEntry = `${nowIso}|${previousStatus}|${newStatus}`;
        updatedEntry.auditTrail = existingEntry.auditTrail
            ? `${existingEntry.auditTrail}\n${auditEntry}`
            : auditEntry;

        // Update the progress data
        progressData.faceProgress[faceIndex + 1] = updatedEntry;
        progressData.updatedAt = now;

        // Save to Firestore
        await setDoc(docRef, progressData);

        console.log(`Updated progress for face ${faceIndex + 1}: ${previousStatus} -> ${newStatus}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating progress:', error);
        return { success: false, error: String(error) };
    }
}

// Helper to get face status from progress data
export function getFaceStatus(progress: ProgressData | null, faceIndex: number): FaceStatus {
    if (!progress || !progress.faceProgress || !progress.faceProgress[faceIndex + 1]) {
        return 'not-done';
    }
    return progress.faceProgress[faceIndex + 1].status;
}

// Helper to get progress statistics
export function getProgressStats(progress: ProgressData | null): {
    totalFaces: number;
    notDoneCount: number;
    inProgressCount: number;
    completedCount: number;
} {
    if (!progress || !progress.faceProgress) {
        return { totalFaces: 0, notDoneCount: 0, inProgressCount: 0, completedCount: 0 };
    }

    let notDoneCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    Object.values(progress.faceProgress).forEach(entry => {
        switch (entry.status) {
            case 'not-done':
                notDoneCount++;
                break;
            case 'in-progress':
                inProgressCount++;
                break;
            case 'completed':
                completedCount++;
                break;
        }
    });

    return {
        totalFaces: Object.keys(progress.faceProgress).length,
        notDoneCount,
        inProgressCount,
        completedCount
    };
}
