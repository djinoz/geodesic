// Authentication UI Controller
// Handles all UI interactions for authentication, saving, and loading domes
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { sendVerificationEmail, completeSignIn, signOut, onAuthStateChange, isAuthenticated } from './services/auth';
import { saveDome, loadDomeById, getUserDomes, deleteDome, generateDomeId, getShareUrl } from './services/dome-storage';
import { getCurrentUser } from './services/auth';
import { hasTempUnsavedChanges, loadTempUnsavedChanges, clearTempUnsavedChanges, getGeometryIndexFromLogicalNumber } from './main';
// Import constants lazily to avoid initialization issues
import * as domeStorage from './services/dome-storage';
// Current dome state
let currentDomeId = null;
let currentDomeName = 'Untitled Dome';
let currentDomeOwnerId = null; // Track owner for fork detection
let currentDomeOwnerEmail = null; // Track owner email for display
// Session storage keys
const SESSION_DOME_ID_KEY = 'geodesic-current-dome-id';
const SESSION_DOME_NAME_KEY = 'geodesic-current-dome-name';
// Initialize authentication UI
export function initAuthUI(faceDataGetter, faceDataSetter) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if we're completing sign-in from email link
        checkEmailLink();
        // Listen to auth state changes
        onAuthStateChange((user) => {
            updateAuthUI(user);
        });
        // Set up event listeners
        setupLoginModal();
        setupSaveModal(faceDataGetter);
        setupLoadModal(faceDataSetter);
        setupAuthButtons();
        // Priority 1: Check for shared dome in URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlDomeId = urlParams.get('dome');
        if (urlDomeId) {
            console.log('Loading dome from URL parameter');
            yield checkSharedDomeURL(faceDataSetter);
            return true; // Data loaded from URL
        }
        // Priority 2: Check for last loaded dome in session storage
        const sessionDomeId = sessionStorage.getItem(SESSION_DOME_ID_KEY);
        if (sessionDomeId) {
            console.log('Restoring dome from session storage');
            const success = yield loadDomeData(sessionDomeId, faceDataSetter);
            if (success) {
                return true; // Data loaded from session
            }
        }
        // Priority 2.5: Check for temp unsaved changes (non-authenticated users)
        if (hasTempUnsavedChanges()) {
            console.log('Found temp unsaved changes, loading from localStorage');
            // Actually load the temp data into faceData
            loadTempUnsavedChanges();
            // Get the loaded data and trigger UI update via setter
            const tempData = faceDataGetter();
            faceDataSetter(tempData); // Trigger label creation
            // Set as temp data (user can save it after signing in)
            currentDomeId = domeStorage.INITIAL_DATA_DOME_ID;
            currentDomeName = 'Unsaved Dome';
            currentDomeOwnerId = domeStorage.INITIAL_DATA_OWNER_ID;
            return true; // Data loaded from temp storage
        }
        // Priority 3: Fall back to initial data (will be loaded by caller)
        console.log('No dome in URL or session, will load initial data');
        // Set initial data as the "fork source"
        currentDomeId = domeStorage.INITIAL_DATA_DOME_ID;
        currentDomeName = 'My Dome';
        currentDomeOwnerId = domeStorage.INITIAL_DATA_OWNER_ID;
        // Update dome info display
        updateDomeInfoDisplay();
        return false; // Caller should load initial data
    });
}
// Set current dome state (for tracking fork sources)
export function setCurrentDome(domeId, domeName, domeOwnerId) {
    currentDomeId = domeId;
    currentDomeName = domeName;
    currentDomeOwnerId = domeOwnerId;
}
// Update UI based on authentication state
function updateAuthUI(user) {
    const notAuthState = document.getElementById('not-authenticated-state');
    const authState = document.getElementById('authenticated-state');
    const emailDisplay = document.getElementById('user-email-display');
    if (user && user.email) {
        // User is authenticated
        if (notAuthState)
            notAuthState.style.display = 'none';
        if (authState)
            authState.style.display = 'block';
        if (emailDisplay)
            emailDisplay.textContent = user.email;
    }
    else {
        // User is not authenticated
        if (notAuthState)
            notAuthState.style.display = 'block';
        if (authState)
            authState.style.display = 'none';
    }
    // Always update dome info display (regardless of auth state)
    updateDomeInfoDisplay();
    // Setup hover functionality for dome info (only once)
    setupDomeInfoHover();
}
// Update the dome info display
function updateDomeInfoDisplay() {
    const domeNameEl = document.getElementById('current-dome-name');
    const domeOwnerEl = document.getElementById('current-dome-owner');
    if (!domeNameEl || !domeOwnerEl)
        return;
    // Update dome name
    domeNameEl.textContent = currentDomeName || 'Untitled Dome';
    // Update owner info
    const currentUser = getCurrentUser();
    if (currentDomeOwnerId) {
        if (currentUser && currentDomeOwnerId === currentUser.uid) {
            domeOwnerEl.textContent = 'Owner: You!';
        }
        else if (currentDomeOwnerId === domeStorage.INITIAL_DATA_OWNER_ID) {
            domeOwnerEl.textContent = 'Owner: System (Initial Data)';
        }
        else if (currentDomeOwnerEmail) {
            // Show the owner's email for shared domes
            domeOwnerEl.textContent = `Owner: ${currentDomeOwnerEmail}`;
        }
        else {
            // Fallback if we don't have email
            domeOwnerEl.textContent = 'Owner: Another User';
        }
    }
    else {
        domeOwnerEl.textContent = 'Owner: Unknown';
    }
}
// Setup hover functionality for dome info display (only once)
let domeInfoHoverSetup = false;
function setupDomeInfoHover() {
    if (domeInfoHoverSetup)
        return; // Already set up
    const domeInfoEl = document.getElementById('current-dome-info');
    const domeOwnerEl = document.getElementById('current-dome-owner');
    if (!domeInfoEl || !domeOwnerEl)
        return;
    domeInfoEl.addEventListener('mouseenter', () => {
        domeOwnerEl.style.display = 'block';
    });
    domeInfoEl.addEventListener('mouseleave', () => {
        domeOwnerEl.style.display = 'none';
    });
    domeInfoHoverSetup = true;
}
// Check if we're completing sign-in from email link
function checkEmailLink() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = window.location.href;
        // Check if this is a sign-in link
        if (url.includes('apiKey') && url.includes('oobCode')) {
            const result = yield completeSignIn(url);
            if (result.success) {
                showStatus('login-status', 'Successfully signed in! Redirecting...', 'success');
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
            else {
                showStatus('login-status', `Sign-in failed: ${result.error}`, 'error');
            }
        }
    });
}
// Setup login modal
function setupLoginModal() {
    const loginButton = document.getElementById('login-button');
    const loginModal = document.getElementById('loginModal');
    const closeButton = document.querySelector('.close-login-modal');
    const sendLinkButton = document.getElementById('sendLoginLinkButton');
    const emailInput = document.getElementById('loginEmail');
    // Open modal
    loginButton === null || loginButton === void 0 ? void 0 : loginButton.addEventListener('click', () => {
        // Check for unsaved changes and warn user
        if (hasTempUnsavedChanges()) {
            const proceed = confirm('You have unsaved changes that will be preserved while you sign in. ' +
                'After signing in, you can save your changes to your account.\n\n' +
                'Continue to sign in?');
            if (!proceed) {
                return;
            }
        }
        if (loginModal)
            loginModal.style.display = 'flex';
    });
    // Close modal
    closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener('click', () => {
        if (loginModal)
            loginModal.style.display = 'none';
    });
    // Send login link
    sendLinkButton === null || sendLinkButton === void 0 ? void 0 : sendLinkButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        const email = emailInput === null || emailInput === void 0 ? void 0 : emailInput.value.trim();
        if (!email) {
            showStatus('login-status', 'Please enter your email', 'error');
            return;
        }
        if (sendLinkButton) {
            sendLinkButton.textContent = 'Sending...';
            sendLinkButton.disabled = true;
        }
        const result = yield sendVerificationEmail(email);
        if (result.success) {
            showStatus('login-status', `Sign-in link sent to ${email}! Check your email and click the link to sign in.`, 'success');
            if (emailInput)
                emailInput.value = '';
        }
        else {
            showStatus('login-status', `Error: ${result.error}`, 'error');
        }
        if (sendLinkButton) {
            sendLinkButton.textContent = 'Send Sign-In Link';
            sendLinkButton.disabled = false;
        }
    }));
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            if (loginModal)
                loginModal.style.display = 'none';
        }
    });
}
// Setup save dome modal
function setupSaveModal(faceDataGetter) {
    const saveDomeButton = document.getElementById('save-dome-button');
    const saveDomeModal = document.getElementById('saveDomeModal');
    const closeButton = document.querySelector('.close-save-modal');
    const confirmButton = document.getElementById('saveDomeConfirmButton');
    const domeNameInput = document.getElementById('domeNameInput');
    const publicCheckbox = document.getElementById('domePublicCheckbox');
    const shareUrlContainer = document.getElementById('share-url-container');
    const shareUrlInput = document.getElementById('shareUrlInput');
    const copyButton = document.getElementById('copyShareUrlButton');
    // Open modal
    saveDomeButton === null || saveDomeButton === void 0 ? void 0 : saveDomeButton.addEventListener('click', () => {
        if (!isAuthenticated()) {
            alert('Please sign in first');
            return;
        }
        if (domeNameInput)
            domeNameInput.value = currentDomeName;
        if (saveDomeModal)
            saveDomeModal.style.display = 'flex';
        if (shareUrlContainer)
            shareUrlContainer.style.display = 'none';
    });
    // Close modal
    closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener('click', () => {
        if (saveDomeModal)
            saveDomeModal.style.display = 'none';
    });
    // Save dome
    confirmButton === null || confirmButton === void 0 ? void 0 : confirmButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const domeName = domeNameInput === null || domeNameInput === void 0 ? void 0 : domeNameInput.value.trim();
        if (!domeName) {
            showStatus('save-status', 'Please enter a dome name', 'error');
            return;
        }
        const isPublic = (_a = publicCheckbox === null || publicCheckbox === void 0 ? void 0 : publicCheckbox.checked) !== null && _a !== void 0 ? _a : true;
        const faceData = faceDataGetter();
        const user = getCurrentUser();
        // Determine if this will be a fork
        let forkedFromDomeId;
        let forkedFromOwnerId;
        // If currentDomeId is set and user doesn't own it, OR if currentDomeId is initial data
        if (currentDomeId && currentDomeOwnerId) {
            if (user && currentDomeOwnerId !== user.uid) {
                // User doesn't own this dome - it will be forked
                forkedFromDomeId = currentDomeId;
                forkedFromOwnerId = currentDomeOwnerId;
            }
        }
        // Generate new ID for new domes, or use existing
        const domeId = (user && currentDomeOwnerId === user.uid && currentDomeId) ? currentDomeId : generateDomeId();
        if (confirmButton) {
            confirmButton.textContent = 'Saving...';
            confirmButton.disabled = true;
        }
        const result = yield saveDome(domeId, domeName, faceData, isPublic, forkedFromDomeId, forkedFromOwnerId);
        if (result.success && result.domeId) {
            currentDomeId = result.domeId;
            currentDomeName = domeName;
            if (user) {
                currentDomeOwnerId = user.uid; // User now owns this dome
            }
            // Save to session storage for restoration on refresh
            sessionStorage.setItem(SESSION_DOME_ID_KEY, result.domeId);
            sessionStorage.setItem(SESSION_DOME_NAME_KEY, domeName);
            // Clear old localStorage data (migration from old system)
            clearOldLocalStorage();
            // Clear temp unsaved changes (now saved to Firebase)
            clearTempUnsavedChanges();
            // Update dome info display
            updateDomeInfoDisplay();
            // Show appropriate message
            if (result.wasForked) {
                showStatus('save-status', 'Dome forked and saved successfully! This is now your copy.', 'success');
            }
            else {
                showStatus('save-status', 'Dome saved successfully!', 'success');
            }
            // Show share URL if public
            if (isPublic && shareUrlContainer && shareUrlInput) {
                const shareUrl = getShareUrl(result.domeId);
                shareUrlInput.value = shareUrl;
                shareUrlContainer.style.display = 'block';
            }
        }
        else {
            showStatus('save-status', `Error: ${result.error}`, 'error');
        }
        if (confirmButton) {
            confirmButton.textContent = 'Save Dome';
            confirmButton.disabled = false;
        }
    }));
    // Copy share URL
    copyButton === null || copyButton === void 0 ? void 0 : copyButton.addEventListener('click', () => {
        if (shareUrlInput) {
            shareUrlInput.select();
            document.execCommand('copy');
            if (copyButton) {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 2000);
            }
        }
    });
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === saveDomeModal) {
            if (saveDomeModal)
                saveDomeModal.style.display = 'none';
        }
    });
}
// Setup load dome modal
function setupLoadModal(faceDataSetter) {
    const loadDomeButton = document.getElementById('load-dome-button');
    const loadDomeModal = document.getElementById('loadDomeModal');
    const closeButton = document.querySelector('.close-load-modal');
    const domeList = document.getElementById('domeList');
    // Open modal and load user's domes
    loadDomeButton === null || loadDomeButton === void 0 ? void 0 : loadDomeButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (!isAuthenticated()) {
            alert('Please sign in first');
            return;
        }
        if (loadDomeModal)
            loadDomeModal.style.display = 'flex';
        if (domeList)
            domeList.innerHTML = '<p style="text-align: center; color: #666;">Loading your domes...</p>';
        const result = yield getUserDomes();
        if (result.success && result.domes) {
            displayDomeList(result.domes, faceDataSetter);
        }
        else {
            if (domeList)
                domeList.innerHTML = `<p style="text-align: center; color: #f44336;">Error: ${result.error}</p>`;
        }
    }));
    // Close modal
    closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener('click', () => {
        if (loadDomeModal)
            loadDomeModal.style.display = 'none';
    });
    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === loadDomeModal) {
            if (loadDomeModal)
                loadDomeModal.style.display = 'none';
        }
    });
}
// Load initial/system default data
function loadInitialData(faceDataSetter) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('/src/initial-data.json');
            const initialData = yield response.json();
            // Convert to Map with geometry indices
            const faceDataMap = new Map();
            Object.entries(initialData).forEach(([key, value]) => {
                // Convert from logical face numbering (position-based) to geometry indexing
                const logicalNumber = parseInt(key);
                const geometryIndex = getGeometryIndexFromLogicalNumber(logicalNumber);
                if (geometryIndex !== null) {
                    if (typeof value === 'string') {
                        faceDataMap.set(geometryIndex, {
                            name: undefined,
                            description: value
                        });
                    }
                    else {
                        faceDataMap.set(geometryIndex, value);
                    }
                }
                else {
                    console.warn(`Could not convert logical number ${logicalNumber} to geometry index, skipping`);
                }
            });
            // Set the face data
            faceDataSetter(faceDataMap);
            // Update current dome state
            currentDomeId = domeStorage.INITIAL_DATA_DOME_ID;
            currentDomeName = 'System Default';
            currentDomeOwnerId = domeStorage.INITIAL_DATA_OWNER_ID;
            // Clear session storage (not a saved dome)
            sessionStorage.removeItem(SESSION_DOME_ID_KEY);
            sessionStorage.removeItem(SESSION_DOME_NAME_KEY);
            // Update dome info display
            updateDomeInfoDisplay();
            console.log(`Loaded initial data for ${faceDataMap.size} faces`);
            return true;
        }
        catch (error) {
            console.error('Failed to load initial data:', error);
            return false;
        }
    });
}
// Display list of domes
function displayDomeList(domes, faceDataSetter) {
    const domeList = document.getElementById('domeList');
    if (!domeList)
        return;
    domeList.innerHTML = '';
    // Add "System Default" option at the top
    const defaultItem = document.createElement('div');
    defaultItem.style.cssText = 'padding: 12px; margin-bottom: 12px; border: 2px solid #2196F3; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; background-color: rgba(33, 150, 243, 0.05);';
    defaultItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 4px; color: #2196F3;">🏠 System Default</div>
                <div style="font-size: 0.85em; color: #666;">
                    Reset to the original initial data
                </div>
            </div>
        </div>
    `;
    // Load initial data on click
    defaultItem.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        const success = yield loadInitialData(faceDataSetter);
        if (success) {
            alert('Loaded System Default dome');
        }
        else {
            alert('Failed to load System Default');
        }
        const loadDomeModal = document.getElementById('loadDomeModal');
        if (loadDomeModal)
            loadDomeModal.style.display = 'none';
    }));
    // Hover effect
    defaultItem.addEventListener('mouseenter', () => {
        defaultItem.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
    });
    defaultItem.addEventListener('mouseleave', () => {
        defaultItem.style.backgroundColor = 'rgba(33, 150, 243, 0.05)';
    });
    domeList.appendChild(defaultItem);
    // Show message if no saved domes
    if (domes.length === 0) {
        const noDomesMsg = document.createElement('p');
        noDomesMsg.style.cssText = 'text-align: center; color: #666; margin-top: 16px;';
        noDomesMsg.textContent = "You haven't saved any domes yet.";
        domeList.appendChild(noDomesMsg);
        return;
    }
    domes.forEach((dome) => {
        const domeItem = document.createElement('div');
        domeItem.style.cssText = 'padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; transition: background-color 0.2s;';
        domeItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${escapeHtml(dome.name)}</div>
                    <div style="font-size: 0.85em; color: #666;">
                        Updated: ${formatDate(dome.updatedAt)}
                        ${dome.isPublic ? '<span style="margin-left: 10px; color: #4CAF50;">● Public</span>' : '<span style="margin-left: 10px; color: #999;">● Private</span>'}
                    </div>
                </div>
                <button class="delete-dome-btn" data-dome-id="${dome.id}" style="padding: 6px 12px; background-color: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8em; margin-left: 10px;">Delete</button>
            </div>
        `;
        // Load dome on click
        domeItem.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            // Don't load if delete button was clicked
            if (e.target.classList.contains('delete-dome-btn')) {
                return;
            }
            const success = yield loadDomeData(dome.id, faceDataSetter);
            if (success) {
                alert(`Loaded dome: ${dome.name}`);
            }
            const loadDomeModal = document.getElementById('loadDomeModal');
            if (loadDomeModal)
                loadDomeModal.style.display = 'none';
        }));
        // Delete dome
        const deleteBtn = domeItem.querySelector('.delete-dome-btn');
        deleteBtn === null || deleteBtn === void 0 ? void 0 : deleteBtn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            e.stopPropagation();
            if (!confirm(`Are you sure you want to delete "${dome.name}"?`)) {
                return;
            }
            const result = yield deleteDome(dome.id);
            if (result.success) {
                domeItem.remove();
                showStatus('load-status', 'Dome deleted successfully', 'success');
            }
            else {
                showStatus('load-status', `Error deleting dome: ${result.error}`, 'error');
            }
        }));
        // Hover effect
        domeItem.addEventListener('mouseenter', () => {
            domeItem.style.backgroundColor = '#f5f5f5';
        });
        domeItem.addEventListener('mouseleave', () => {
            domeItem.style.backgroundColor = 'transparent';
        });
        domeList.appendChild(domeItem);
    });
}
// Load dome data
function loadDomeData(domeId, faceDataSetter) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield loadDomeById(domeId);
        if (result.success && result.dome) {
            const dome = result.dome;
            currentDomeId = dome.id;
            currentDomeName = dome.name;
            currentDomeOwnerId = dome.ownerId; // Track owner for fork detection
            currentDomeOwnerEmail = dome.ownerEmail; // Track owner email for display
            // Save to session storage for restoration on refresh
            sessionStorage.setItem(SESSION_DOME_ID_KEY, dome.id);
            sessionStorage.setItem(SESSION_DOME_NAME_KEY, dome.name);
            // Convert object to Map
            // Convert from logical face numbering (position-based) to geometry indexing
            const faceDataMap = new Map();
            const totalKeys = Object.keys(dome.faceData).length;
            let convertedCount = 0;
            let failedCount = 0;
            Object.entries(dome.faceData).forEach(([key, value]) => {
                const logicalNumber = parseInt(key);
                const geometryIndex = getGeometryIndexFromLogicalNumber(logicalNumber);
                if (geometryIndex !== null) {
                    faceDataMap.set(geometryIndex, value);
                    convertedCount++;
                }
                else {
                    console.error(`LOAD ERROR: Could not convert logical number ${logicalNumber} to geometry index. This may be old data.`);
                    failedCount++;
                }
            });
            console.log(`loadDomeData: Loaded ${totalKeys} keys from Firestore, converted ${convertedCount} to geometry indices (${failedCount} failed)`);
            faceDataSetter(faceDataMap);
            // Update dome info display
            updateDomeInfoDisplay();
            console.log(`Loaded dome: ${dome.name} (${dome.id}) by owner ${dome.ownerId}`);
            return true;
        }
        else {
            console.error(`Error loading dome: ${result.error}`);
            return false;
        }
    });
}
// Setup auth buttons
function setupAuthButtons() {
    const logoutButton = document.getElementById('logout-button');
    logoutButton === null || logoutButton === void 0 ? void 0 : logoutButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
        if (confirm('Are you sure you want to sign out?')) {
            yield signOut();
            currentDomeId = null;
            currentDomeName = 'Untitled Dome';
            // Clear session storage
            sessionStorage.removeItem(SESSION_DOME_ID_KEY);
            sessionStorage.removeItem(SESSION_DOME_NAME_KEY);
        }
    }));
}
// Check for shared dome in URL parameter
function checkSharedDomeURL(faceDataSetter) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlParams = new URLSearchParams(window.location.search);
        const domeId = urlParams.get('dome');
        if (domeId) {
            console.log(`Loading shared dome: ${domeId}`);
            yield loadDomeData(domeId, faceDataSetter);
            // Clean up URL (remove dome parameter)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    });
}
// Helper: Show status message
function showStatus(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (!element)
        return;
    element.textContent = message;
    element.style.display = 'block';
    element.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    element.style.color = type === 'success' ? '#155724' : '#721c24';
    element.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
}
// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Helper: Format date
function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) {
        return 'Unknown';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
// Helper: Clear old localStorage data from pre-Firebase system
function clearOldLocalStorage() {
    // Find all localStorage keys that start with the old prefix
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('geodesic-dome-data-')) {
            keysToRemove.push(key);
        }
    }
    // Remove the old data
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared old localStorage key: ${key}`);
    });
    if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} old localStorage entries`);
    }
}
