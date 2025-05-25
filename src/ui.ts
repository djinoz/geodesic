export interface ModalElements {
    modal: HTMLDivElement;
    closeButton: HTMLSpanElement;
    modalTitle: HTMLHeadingElement;
    existingTextElement: HTMLParagraphElement;
    textInput: HTMLTextAreaElement;
    saveButton: HTMLButtonElement;
    clearButton: HTMLButtonElement;
}

let currentFaceIndex: number | null = null;
// Ensure callbacks are properly typed
let onSaveCallback: (faceIndex: number, text: string) => void = () => {};
let onClearCallback: (faceIndex: number) => void = () => {};


export function initModal(
    elements: ModalElements,
    saveCallback: (faceIndex: number, text: string) => void,
    clearCallback: (faceIndex: number) => void
): void {
    onSaveCallback = saveCallback;
    onClearCallback = clearCallback;

    elements.closeButton.onclick = () => {
        elements.modal.style.display = 'none';
        currentFaceIndex = null; // Reset current face index
    };

    elements.saveButton.onclick = () => {
        console.log("Save button clicked. Current face index:", currentFaceIndex);
        if (currentFaceIndex !== null) {
            try {
                onSaveCallback(currentFaceIndex, elements.textInput.value);
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

    elements.clearButton.onclick = () => {
        if (currentFaceIndex !== null) {
            try {
                onClearCallback(currentFaceIndex);
            } catch (error)
            {
                console.error("Error during onClearCallback:", error);
            }
            elements.textInput.value = '';
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
    existingText: string | undefined
): void {
    currentFaceIndex = faceIndex; // Set the current face index
    console.log("Showing modal for faceIndex:", faceIndex);
    elements.modalTitle.textContent = `Notes for Face ${faceIndex + 1}`; // User-friendly 1-based index
    elements.existingTextElement.textContent = existingText || 'No notes yet.';
    elements.textInput.value = existingText || '';
    elements.modal.style.display = 'flex';
    elements.textInput.focus();
}
