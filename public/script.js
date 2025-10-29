////////////////////////////////////////////////////////////////////////////////
// Upload files
////////////////////////////////////////////////////////////////////////////////
{
    const DRAG_CLASSNAME = "drag";

    const uploadForm = document.getElementById("uploadForm");
    const filesInput = document.getElementById("filesInput");
    const selectionText = document.getElementById("selectionText");
    const sendButton = document.getElementById("sendButton");
    const selectButton = document.getElementById("selectButton");

    sendButton.disabled = true;

    function onSelectFiles() {
        const fileCount = filesInput.files.length;
        switch (fileCount) {
            case 0:
                selectionText.textContent = "No files selected";
                sendButton.disabled = true;
                break;
            case 1:
                selectionText.textContent = "1 file selected";
                sendButton.disabled = false;
                break;
            default:
                selectionText.textContent = `${fileCount} files selected`;
                sendButton.disabled = false;
        }
    }

    filesInput.addEventListener("change", onSelectFiles);

    uploadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        const zip = formData.get("zip");
        const url = `/uploads?zip=${encodeURIComponent(zip)}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            alert("Upload successful");
            filesInput.value = "";
            onSelectFiles();
        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        }
    });

    selectButton.addEventListener("dragenter", () =>
        selectButton.classList.add(DRAG_CLASSNAME)
    );
    selectButton.addEventListener("dragover", (e) => e.preventDefault());
    selectButton.addEventListener("dragleave", (e) => {
        // do nothing if cursor moves to a child element
        if (selectButton.contains(e.relatedTarget)) {
            return;
        }
        selectButton.classList.remove(DRAG_CLASSNAME);
    });
    selectButton.addEventListener("drop", (e) => {
        e.preventDefault();
        filesInput.files = e.dataTransfer.files;
        onSelectFiles();
        selectButton.classList.remove(DRAG_CLASSNAME);
    });
}

////////////////////////////////////////////////////////////////////////////////
// Download files
////////////////////////////////////////////////////////////////////////////////
{
    const downloadForm = document.getElementById("downloadForm");
    const selectAllCheckbox = document.getElementById("selectAllCheckbox");
    const filesTableBody = document.getElementById("filesTableBody");
    const filesTableItemTemplate = document.getElementById(
        "filesTableItemTemplate"
    );

    selectAllCheckbox.checked = false;

    async function getFiles() {
        const response = await fetch("/shared");
        const files = await response.json();

        files.forEach(({ file, size }) => {
            const itemNode = filesTableItemTemplate.content.cloneNode(true);
            itemNode.querySelector(".file-checkbox").name = file;
            itemNode.querySelector(".file-name").textContent = file;

            function formatSize(size) {
                const KB = 2 ** 10;
                const MB = KB ** 2;

                if (size < MB) {
                    return `${(size / KB).toFixed(0)} KB`;
                } else {
                    return `${(size / MB).toFixed(2)} MB`;
                }
            }

            itemNode.querySelector(".file-size").textContent = formatSize(size);
            filesTableBody.appendChild(itemNode);
        });
    }
    let checkboxes;
    getFiles().then(() => {
        checkboxes = Array.from(document.querySelectorAll(".file-checkbox"));
        checkboxes.forEach((cb) =>
            cb.addEventListener("click", () => {
                if (checkboxes.every((cb) => !cb.checked)) {
                    selectAllCheckbox.checked = false;
                } else {
                    selectAllCheckbox.checked = true;
                }
            })
        );
    });

    selectAllCheckbox.addEventListener("click", () => {
        if (selectAllCheckbox.checked) {
            checkboxes.forEach((cb) => (cb.checked = true));
        } else {
            checkboxes.forEach((cb) => (cb.checked = false));
        }
    });

    downloadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(downloadForm);
        const fileNames = Array.from(formData.keys());
        const res = await fetch("/shared", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fileNames),
        });

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.headers
            .get("Content-Disposition")
            .match(/filename="(.+?)"/)[1];
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    });
}
