const uploadForm = document.getElementById("uploadForm")
const filesInput = document.getElementById("filesInput")
const selectionText = document.getElementById("selectionText")
const sendButton = document.getElementById("sendButton")

sendButton.disabled = true
filesInput.addEventListener("change", onSelectFiles)
uploadForm.addEventListener("submit", onSubmitFiles)

async function onSubmitFiles(e) {
    e.preventDefault()

    const formData = new FormData(uploadForm)

    try {
        const response = await fetch(
            "/upload",
            { method: "POST", body: formData }
        )
        if (!response.ok) {
            throw new Error(response.statusText)
        }
        alert("Upload successful")
        filesInput.value = ""
        onSelectFiles()
    } catch (err) {
        alert(`Upload failed: ${err.message}`)
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