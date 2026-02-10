let state = {
  folders: {},
  selectedFolderId: null,
  selectedNoteId: null,
  searchQuery: null,
};

const saveState = () => {
  chrome.storage.local.set({ state });
};

const loadState = () => {
  chrome.storage.local.get(["state"], (result) => {
    if (result.state) {
      state = result.state;
    } else {
      // initial data
      const folderId = crypto.randomUUID();
      const noteId = crypto.randomUUID();

      state = {
        folders: {
          [folderId]: {
            name: "Inbox",
            notes: {
              [noteId]: {
                id: noteId,
                title: "Welcome",
                content: "Your first note",
                updatedAt: Date.now(),
              },
            },
          },
        },
        selectedFolderId: folderId,
        selectedNoteId: noteId,
      };
      saveState();
    }
    render();
  });
};

const folderList = document.getElementById("folder-list");
const noteList = document.getElementById("note-list");
const titleInput = document.getElementById("note-title");
const contentTextarea = document.getElementById("note-content");
const noteSearch = document.getElementById("note-search");

function render() {
  renderFolders();
  renderNotes();
  renderEditor();
}

function renderFolders() {
  folderList.innerHTML = "";

  Object.entries(state.folders).forEach(([id, folder]) => {
    const li = document.createElement("li");
    li.textContent = folder.name;
    if (id === state.selectedFolderId) li.classList.add("active");

    // Select folder on click
    li.onclick = () => {
      state.selectedFolderId = id;
      state.selectedNoteId = null;
      saveState();
      render();
    };

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.style.marginLeft = "6px";
    delBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent selecting folder
      if (
        confirm(
          `Delete folder "${folder.name}"? All notes inside will be lost.`,
        )
      ) {
        delete state.folders[id];

        // Reset selection
        state.selectedFolderId = Object.keys(state.folders)[0] || null;
        state.selectedNoteId = null;

        saveState();
        render();
      }
    };

    li.appendChild(delBtn);
    folderList.appendChild(li);
  });
}

function renderNotes() {
  noteList.innerHTML = "";
  const folder = state.folders[state.selectedFolderId];
  if (!folder) return;

  let notes = Object.values(folder.notes);

  notes.sort((a, b) => b.updatedAt - a.updatedAt);

  if (state.searchQuery) {
    noteSearch.value = state.searchQuery;
    // Simple fuzzy filter: all query letters appear in order in title or content
    notes = notes.filter((note) =>
      note.title.toLowerCase().includes(state.searchQuery.toLowerCase().trim()),
    );
  }

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note.title || "Untitled";
    if (note.id === state.selectedNoteId) li.classList.add("active");

    // Select note on click
    li.onclick = () => {
      state.selectedNoteId = note.id;
      saveState();
      render();
    };

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.style.marginLeft = "6px";
    delBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent selecting note
      if (confirm(`Delete note "${note.title}"?`)) {
        delete folder.notes[note.id];

        // Reset selection if deleted note was active
        if (state.selectedNoteId === note.id) {
          state.selectedNoteId = Object.keys(folder.notes)[0] || null;
        }

        saveState();
        render();
      }
    };

    li.appendChild(delBtn);
    noteList.appendChild(li);
  });
}

function renderEditor() {
  const folder = state.folders[state.selectedFolderId];
  const note = folder?.notes[state.selectedNoteId];

  titleInput.value = note?.title || "";
  contentTextarea.value = note?.content || "";

  titleInput.disabled = !note;
  contentTextarea.disabled = !note;

  if (folder && !note) {
    titleInput.disabled = false;
    titleInput.value = folder?.name;
  }
}

document.getElementById("new-folder").onclick = () => {
  const name = prompt("Folder name");
  if (!name) return;

  const id = crypto.randomUUID();
  state.folders[id] = { name, notes: {} };
  state.selectedFolderId = id;
  state.selectedNoteId = null;

  saveState();
  render();
};

document.getElementById("new-note").onclick = () => {
  const folder = state.folders[state.selectedFolderId];
  if (!folder) return;

  const id = crypto.randomUUID();
  folder.notes[id] = {
    id,
    title: "New note",
    content: "",
    updatedAt: Date.now(),
  };

  state.selectedNoteId = id;
  saveState();
  render();
};

titleInput.addEventListener("input", () => {
  const note = getCurrentNote();
  const folder = getCurrentFolder();
  if (!note) {
    if (!folder) {
      return;
    } else {
      folder.name = titleInput.value;
      saveState();
      renderFolders();
      return;
    }
  }

  note.title = titleInput.value;
  note.updatedAt = Date.now();
  saveState();
  renderNotes();
});

contentTextarea.addEventListener("input", () => {
  const note = getCurrentNote();
  if (!note) return;

  note.content = contentTextarea.value;
  note.updatedAt = Date.now();
  saveState();
});

noteSearch.addEventListener("input", () => {
  const query = noteSearch.value;
  state.searchQuery = query;
  saveState();
  renderNotes();
});

function getCurrentNote() {
  const folder = state.folders[state.selectedFolderId];
  return folder?.notes[state.selectedNoteId];
}

function getCurrentFolder() {
  const folder = state.folders[state.selectedFolderId];
  if (folder) {
    return folder;
  }
  return undefined;
}

const foldersContainer = document.querySelector(".folders");

document.getElementById("menu-btn").onclick = () => {
  foldersContainer.classList.toggle("active");
  document.getElementById("menu-btn").classList.toggle("active");
};

document.getElementById("menu-btn-2").onclick = () => {
  foldersContainer.classList.toggle("active");
  document.getElementById("menu-btn").classList.toggle("active");
};

loadState();
