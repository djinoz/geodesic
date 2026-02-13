import { marked } from 'marked';
import { trackReadMoreClick, trackFaceNoteSave, trackModalOpen, trackModalAction } from './services/analytics';
import { getCurrentUser } from './services/auth';
import type { FaceStatus } from './services/progress-storage';

// Configure marked options for security and link behavior
marked.use({
    breaks: true, // Enable line breaks
    gfm: true, // GitHub Flavored Markdown
    renderer: {
        link(token: any): string {
            const titleAttr = token.title ? ` title="${token.title}"` : '';
            return `<a href="${token.href}"${titleAttr} target="_blank" rel="noopener noreferrer">${token.text}</a>`;
        }
    }
});

export interface ModalElements {
    modal: HTMLDivElement;
    closeButton: HTMLSpanElement;
    modalTitle: HTMLHeadingElement;
    existingTextElement: HTMLParagraphElement;
    descriptionPreview: HTMLDivElement;
    faceNameDisplay: HTMLDivElement;
    viewMode: HTMLDivElement;
    editMode: HTMLDivElement;
    editButton: HTMLButtonElement;
    cancelEditButton: HTMLButtonElement;
    nameInput: HTMLInputElement;
    descInput: HTMLTextAreaElement;
    readMoreUrlInput: HTMLInputElement;
    readMoreLink: HTMLAnchorElement;
    readMoreContainer: HTMLDivElement;
    saveButton: HTMLButtonElement;
    resetButton: HTMLButtonElement;
    clearButton: HTMLButtonElement;
    // Progress tracking elements
    progressContainer: HTMLDivElement;
    progressNotDone: HTMLButtonElement;
    progressInProgress: HTMLButtonElement;
    progressCompleted: HTMLButtonElement;
    progressSaving: HTMLDivElement;
}


export interface FaceData {
    name?: string;
    description?: string;
    readMoreUrl?: string;
}

let currentFaceIndex: number | null = null;
// Ensure callbacks are properly typed
let onSaveCallback: (faceIndex: number, data: FaceData) => void = () => { };
let onResetCallback: (faceIndex: number) => void = () => { };
let onClearCallback: (faceIndex: number) => void = () => { };


export function initModal(
    elements: ModalElements,
    saveCallback: (faceIndex: number, data: FaceData) => void,
    resetCallback: (faceIndex: number) => void,
    clearCallback: (faceIndex: number) => void
): void {
    onSaveCallback = saveCallback;
    onResetCallback = resetCallback;
    onClearCallback = clearCallback;

    elements.closeButton.onclick = () => {
        elements.modal.style.display = 'none';
        // Reset to view mode when closing
        elements.viewMode.style.display = 'block';
        elements.editMode.style.display = 'none';
        currentFaceIndex = null; // Reset current face index
    };

    elements.editButton.onclick = () => {
        // Track edit button click
        const user = getCurrentUser();
        trackModalAction('edit_clicked', currentFaceIndex, user?.uid || null);

        // Switch to edit mode
        elements.viewMode.style.display = 'none';
        elements.editMode.style.display = 'block';
    };

    elements.cancelEditButton.onclick = () => {
        // Track cancel button click
        const user = getCurrentUser();
        trackModalAction('cancel_edit', currentFaceIndex, user?.uid || null);

        // Switch back to view mode without saving
        elements.viewMode.style.display = 'block';
        elements.editMode.style.display = 'none';
    };

    elements.saveButton.onclick = () => {
        console.log("Save button clicked. Current face index:", currentFaceIndex);
        if (currentFaceIndex !== null) {
            try {
                const faceData: FaceData = {
                    name: elements.nameInput.value.trim() || undefined,
                    description: elements.descInput.value.trim() || undefined,
                    readMoreUrl: elements.readMoreUrlInput.value.trim() || undefined
                };

                // Track face note save in analytics
                const user = getCurrentUser();
                trackFaceNoteSave(
                    currentFaceIndex,
                    !!faceData.name,
                    !!faceData.description,
                    !!faceData.readMoreUrl,
                    user?.uid || null
                );

                onSaveCallback(currentFaceIndex, faceData);
                // Switch back to view mode after saving
                elements.viewMode.style.display = 'block';
                elements.editMode.style.display = 'none';
            } catch (error) {
                console.error("Error during onSaveCallback:", error);
            }
            elements.modal.style.display = 'none'; // This should hide it
            // currentFaceIndex = null; // Reset after save
        } else {
            console.warn("Save button clicked but currentFaceIndex is null.");
            // Still hide the modal if it was somehow shown without a faceIndex
            elements.modal.style.display = 'none';
        }
    };

    elements.resetButton.onclick = () => {
        if (currentFaceIndex !== null) {
            // Track reset button click
            const user = getCurrentUser();
            trackModalAction('reset_to_default', currentFaceIndex, user?.uid || null);

            try {
                onResetCallback(currentFaceIndex);
            } catch (error) {
                console.error("Error during onResetCallback:", error);
            }
            // Modal will be closed by the callback which will trigger showModal again
            elements.modal.style.display = 'none';
        }
    };

    elements.clearButton.onclick = () => {
        if (currentFaceIndex !== null) {
            // Track clear button click
            const user = getCurrentUser();
            trackModalAction('clear_notes', currentFaceIndex, user?.uid || null);

            try {
                onClearCallback(currentFaceIndex);
            } catch (error) {
                console.error("Error during onClearCallback:", error);
            }
            elements.nameInput.value = '';
            elements.descInput.value = '';
            elements.existingTextElement.textContent = 'No notes yet.';
            // Optionally, keep modal open to save the cleared state, or close it:
            // elements.modal.style.display = 'none';
            // currentFaceIndex = null; // Reset if closing
        }
    };

    window.onclick = (event) => {
        if (event.target === elements.modal) {
            elements.modal.style.display = 'none';
            currentFaceIndex = null; // Reset current face index
        }
    };
}

export function showModal(
    elements: ModalElements,
    faceIndex: number,
    existingData: FaceData | undefined
): void {
    currentFaceIndex = faceIndex; // Set the current face index
    console.log("Showing modal for Face #", faceIndex + 1, "(Geo Index:", faceIndex, ")");

    // Track modal open in analytics
    const user = getCurrentUser();
    trackModalOpen(faceIndex, user?.uid || null);

    // Defensive checks
    if (!elements.nameInput) {
        console.error('nameInput element is undefined');
        return;
    }
    if (!elements.descInput) {
        console.error('descInput element is undefined');
        return;
    }

    elements.modalTitle.textContent = `Face ${faceIndex + 1}`; // User-friendly 1-based index

    // Ensure we start in view mode
    elements.viewMode.style.display = 'block';
    elements.editMode.style.display = 'none';

    // Populate VIEW MODE fields
    // Display face name
    const nameDisplay = elements.faceNameDisplay.querySelector('strong');
    if (nameDisplay) {
        if (existingData?.name && existingData.name.trim() !== '') {
            nameDisplay.textContent = existingData.name;
            elements.faceNameDisplay.style.display = 'block';
        } else {
            elements.faceNameDisplay.style.display = 'none';
        }
    }

    // Render description as markdown in preview area
    if (existingData?.description && existingData.description.trim() !== '') {
        // Use parse() synchronously - it returns a string when no async extensions are used
        const parseResult = marked.parse(existingData.description);
        const markdownHtml = typeof parseResult === 'string' ? parseResult : '';
        elements.descriptionPreview.innerHTML = markdownHtml;
        elements.descriptionPreview.style.display = 'block';
    } else {
        elements.descriptionPreview.innerHTML = '<em style="color: #999;">No description yet.</em>';
        elements.descriptionPreview.style.display = 'block';
    }

    // Show/hide Read More link based on whether URL exists
    if (existingData?.readMoreUrl && existingData.readMoreUrl.trim() !== '') {
        elements.readMoreContainer.style.display = 'block';
        elements.readMoreLink.href = existingData.readMoreUrl;

        // Add click tracking to Read More link (onclick overwrites previous handler)
        elements.readMoreLink.onclick = (e) => {
            const user = getCurrentUser();
            trackReadMoreClick(currentFaceIndex!, existingData.readMoreUrl!, user?.uid || null);
            // Allow default behavior (link opens in new tab)
        };
    } else {
        elements.readMoreContainer.style.display = 'none';
        elements.readMoreLink.href = '';
        elements.readMoreLink.onclick = null;
    }

    // Populate EDIT MODE fields (for when user clicks Edit)
    elements.nameInput.value = existingData?.name || '';
    elements.descInput.value = existingData?.description || '';
    elements.readMoreUrlInput.value = existingData?.readMoreUrl || '';

    elements.modal.style.display = 'flex';
}

// --- Progress UI Functions ---

// Update the progress UI to reflect the current status
export function updateProgressUI(elements: ModalElements, status: FaceStatus): void {
    // Remove active class from all buttons
    elements.progressNotDone.classList.remove('active');
    elements.progressInProgress.classList.remove('active');
    elements.progressCompleted.classList.remove('active');

    // Add active class to the current status button
    switch (status) {
        case 'not-done':
            elements.progressNotDone.classList.add('active');
            break;
        case 'in-progress':
            elements.progressInProgress.classList.add('active');
            break;
        case 'completed':
            elements.progressCompleted.classList.add('active');
            break;
    }
}

// Show the progress loading/saving indicator
export function showProgressSaving(elements: ModalElements): void {
    if (elements.progressSaving) {
        elements.progressSaving.style.display = 'block';
    }
}

// Hide the progress loading/saving indicator
export function hideProgressSaving(elements: ModalElements): void {
    if (elements.progressSaving) {
        elements.progressSaving.style.display = 'none';
    }
}

// Show the progress container (only for authenticated users)
export function showProgressContainer(elements: ModalElements): void {
    if (elements.progressContainer) {
        elements.progressContainer.style.display = 'block';
    }
}

// Hide the progress container
export function hideProgressContainer(elements: ModalElements): void {
    if (elements.progressContainer) {
        elements.progressContainer.style.display = 'none';
    }
}

// Get current face index (for use by progress tracking)
export function getCurrentFaceIndex(): number | null {
    return currentFaceIndex;
}
