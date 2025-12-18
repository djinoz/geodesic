import { marked } from 'marked';
// Configure marked options for security and link behavior
marked.setOptions({
    breaks: true, // Enable line breaks
    gfm: true, // GitHub Flavored Markdown
});
// Configure renderer to open links in new tabs
const renderer = {
    link(token) {
        const href = token.href;
        const title = token.title ? ` title="${token.title}"` : '';
        const text = token.text;
        return `<a href="${href}"${title} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
};
marked.use({ renderer });
let currentFaceIndex = null;
// Ensure callbacks are properly typed
let onSaveCallback = () => { };
let onResetCallback = () => { };
let onClearCallback = () => { };
export function initModal(elements, saveCallback, resetCallback, clearCallback) {
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
        // Switch to edit mode
        elements.viewMode.style.display = 'none';
        elements.editMode.style.display = 'block';
    };
    elements.cancelEditButton.onclick = () => {
        // Switch back to view mode without saving
        elements.viewMode.style.display = 'block';
        elements.editMode.style.display = 'none';
    };
    elements.saveButton.onclick = () => {
        console.log("Save button clicked. Current face index:", currentFaceIndex);
        if (currentFaceIndex !== null) {
            try {
                const faceData = {
                    name: elements.nameInput.value.trim() || undefined,
                    description: elements.descInput.value.trim() || undefined,
                    readMoreUrl: elements.readMoreUrlInput.value.trim() || undefined
                };
                onSaveCallback(currentFaceIndex, faceData);
                // Switch back to view mode after saving
                elements.viewMode.style.display = 'block';
                elements.editMode.style.display = 'none';
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
    elements.resetButton.onclick = () => {
        if (currentFaceIndex !== null) {
            try {
                onResetCallback(currentFaceIndex);
            }
            catch (error) {
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
            }
            catch (error) {
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
export function showModal(elements, faceIndex, existingData) {
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
    // Ensure we start in view mode
    elements.viewMode.style.display = 'block';
    elements.editMode.style.display = 'none';
    // Populate VIEW MODE fields
    // Display face name
    const nameDisplay = elements.faceNameDisplay.querySelector('strong');
    if (nameDisplay) {
        if ((existingData === null || existingData === void 0 ? void 0 : existingData.name) && existingData.name.trim() !== '') {
            nameDisplay.textContent = existingData.name;
            elements.faceNameDisplay.style.display = 'block';
        }
        else {
            elements.faceNameDisplay.style.display = 'none';
        }
    }
    // Render description as markdown in preview area
    if ((existingData === null || existingData === void 0 ? void 0 : existingData.description) && existingData.description.trim() !== '') {
        const markdownHtml = marked.parse(existingData.description);
        elements.descriptionPreview.innerHTML = markdownHtml;
        elements.descriptionPreview.style.display = 'block';
    }
    else {
        elements.descriptionPreview.innerHTML = '<em style="color: #999;">No description yet.</em>';
        elements.descriptionPreview.style.display = 'block';
    }
    // Show/hide Read More link based on whether URL exists
    if ((existingData === null || existingData === void 0 ? void 0 : existingData.readMoreUrl) && existingData.readMoreUrl.trim() !== '') {
        elements.readMoreContainer.style.display = 'block';
        elements.readMoreLink.href = existingData.readMoreUrl;
    }
    else {
        elements.readMoreContainer.style.display = 'none';
        elements.readMoreLink.href = '';
    }
    // Populate EDIT MODE fields (for when user clicks Edit)
    elements.nameInput.value = (existingData === null || existingData === void 0 ? void 0 : existingData.name) || '';
    elements.descInput.value = (existingData === null || existingData === void 0 ? void 0 : existingData.description) || '';
    elements.readMoreUrlInput.value = (existingData === null || existingData === void 0 ? void 0 : existingData.readMoreUrl) || '';
    elements.modal.style.display = 'flex';
}
