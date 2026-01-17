import { FaceData } from '../ui';

const TEMP_UNSAVED_CHANGES_KEY = 'geodesic-temp-unsaved-changes';

// Save temp unsaved changes (for non-authenticated users)
export function saveTempUnsavedChanges(faceData: Map<number, FaceData>): void {
    const dataObject = Object.fromEntries(faceData);
    localStorage.setItem(TEMP_UNSAVED_CHANGES_KEY, JSON.stringify(dataObject));
    console.log('Auto-saved temp changes to localStorage');
}

// Load temp unsaved changes
export function loadTempUnsavedChanges(faceData: Map<number, FaceData>): boolean {
    try {
        const storedData = localStorage.getItem(TEMP_UNSAVED_CHANGES_KEY);
        if (storedData) {
            const dataObject = JSON.parse(storedData);

            // Check if this is old incompatible data by looking at the keys
            const keys = Object.keys(dataObject).map(k => parseInt(k));
            const maxKey = Math.max(...keys);

            // If the max key is suspiciously high (> 100), this is likely old geometry index data
            // Modern data should have at most 40 keys for the 40 logical face numbers
            if (maxKey > 100) {
                console.warn('Detected old incompatible localStorage format, clearing temp data');
                clearTempUnsavedChanges();
                return false;
            }

            faceData.clear();
            Object.entries(dataObject).forEach(([key, value]) => {
                faceData.set(parseInt(key), value as FaceData);
            });
            console.log(`Loaded ${faceData.size} faces from temp storage`);
            return true;
        }
    } catch (error) {
        console.warn('Failed to load temp changes from storage:', error);
        // Clear corrupted data
        clearTempUnsavedChanges();
    }
    return false;
}

// Clear temp unsaved changes (after successful Firebase save)
export function clearTempUnsavedChanges(): void {
    localStorage.removeItem(TEMP_UNSAVED_CHANGES_KEY);
    console.log('Cleared temp unsaved changes');
}

// Check if there are temp unsaved changes
export function hasTempUnsavedChanges(): boolean {
    return localStorage.getItem(TEMP_UNSAVED_CHANGES_KEY) !== null;
}
