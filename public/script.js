const uploadForm = document.getElementById("uploadForm")
const filesInput = document.getElementById("filesInput")
const selectionText = document.getElementById("selectionText")

filesInput.addEventListener("change", updateSelectionText)
uploadForm.addEventListener("submit", uploadFiles)

async function uploadFiles(e) {
    e.preventDefault()

    const formData = new FormData(uploadForm)
    const response = await fetch(
        "/upload",
        { method: "POST", body: formData }
    )

    if (!response.ok) {
        alert(`Upload failed: ${response.statusText}`)
    } else {
        alert("Upload successful")
        filesInput.value = ""
        updateSelectionText()
    }
}

function updateSelectionText() {
    const fileCount = filesInput.files.length
    selectionText.textContent = fileCount === 0
        ? "No files selected"
        : `${fileCount} file(s) selected`
}