const uploadForm = document.getElementById("uploadForm")
const filesInput = document.getElementById("filesInput")
const selectionText = document.getElementById("selectionText")
const sendButton = document.getElementById("sendButton")

filesInput.addEventListener("change", onSelectFiles)
uploadForm.addEventListener("submit", onSubmitFiles)

async function onSubmitFiles(e) {
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
        changeFiles()
    }
}

function onSelectFiles() {
    const fileCount = filesInput.files.length
    if (fileCount === 0) {
        selectionText.textContent = "No files selected"
        sendButton.disabled = true
    } else {
        selectionText.textContent = `${fileCount} file(s) selected`
        sendButton.disabled = false
    }
}