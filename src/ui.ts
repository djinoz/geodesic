export interface ModalElements {
    modal: HTMLDivElement;
    closeButton: HTMLSpanElement;
    modalTitle: HTMLHeadingElement;
    existingTextElement: HTMLParagraphElement;
    nameInput: HTMLInputElement;
    descInput: HTMLTextAreaElement;
    saveButton: HTMLButtonElement;
    resetButton: HTMLButtonElement;
    clearButton: HTMLButtonElement;
}


export interface FaceData {
    name?: string;
    description?: string;
}

let currentFaceIndex: number | null = null;
// Ensure callbacks are properly typed
let onSaveCallback: (faceIndex: number, data: FaceData) => void = () => {};
let onResetCallback: (faceIndex: number) => void = () => {};
let onClearCallback: (faceIndex: number) => void = () => {};


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
        currentFaceIndex = null; // Reset current face index
    };

    elements.saveButton.onclick = () => {
        console.log("Save button clicked. Current face index:", currentFaceIndex);
        if (currentFaceIndex !== null) {
            try {
                const faceData: FaceData = {
                    name: elements.nameInput.value.trim() || undefined,
                    description: elements.descInput.value.trim() || undefined
                };
                onSaveCallback(currentFaceIndex, faceData);
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
            try {
                onClearCallback(currentFaceIndex);
            } catch (error)
            {
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
    console.log("Showing modal for faceIndex:", faceIndex);

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

    // Populate fields with existing data
    elements.nameInput.value = existingData?.name || '';
    elements.descInput.value = existingData?.description || '';

    elements.modal.style.display = 'flex';
    elements.nameInput.focus();
}
