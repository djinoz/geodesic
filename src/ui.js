let currentFaceIndex = null;
// Ensure callbacks are properly typed
let onSaveCallback = () => { };
let onClearCallback = () => { };
export function initModal(elements, saveCallback, clearCallback) {
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
            }
            catch (error) {
                console.error("Error during onSaveCallback:", error);
            }
            elements.modal.style.display = 'none'; // This should hide it
            // currentFaceIndex = null; // Reset after save
        }
        else {
            console.warn("Save button clicked but currentFaceIndex is null.");
            // Still hide the modal if it was somehow shown without a faceIndex
            elements.modal.style.display = 'none';
        }
    };
    elements.clearButton.onclick = () => {
        if (currentFaceIndex !== null) {
            try {
                onClearCallback(currentFaceIndex);
            }
            catch (error) {
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
export function showModal(elements, faceIndex, existingText) {
    currentFaceIndex = faceIndex; // Set the current face index
    console.log("Showing modal for faceIndex:", faceIndex);
    elements.modalTitle.textContent = `Notes for Face ${faceIndex + 1}`; // User-friendly 1-based index
    elements.existingTextElement.textContent = existingText || 'No notes yet.';
    elements.textInput.value = existingText || '';
    elements.modal.style.display = 'flex';
    elements.textInput.focus();
}
