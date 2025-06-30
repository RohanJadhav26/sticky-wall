const board=document.getElementById("board");
const newNoteBtn=document.getElementById("new-note");
const themeToggle=document.getElementById("toggle-theme");
const exportBtn=document.getElementById("export");
const importInput=document.getElementById("import-file");

let state = {
  notes: [],
  topZ: 6,
  theme: "light"
};

const COLORS = ["#FFA596", "#FA8A55", "#C5E6B7", "#4FC3F7", "#AA68A8", "#E1BEE7"];

function saveState() {
  localStorage.setItem("stickyWall", JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("stickyWall"));
    if (saved && Array.isArray(saved.notes)) {
      state = saved;
      document.documentElement.setAttribute("data-theme", state.theme || "light");
      board.innerHTML="";
      state.notes.forEach(note => createNote(note));
    }
  } catch (err) {
    console.error("Failed to load state:", err);
  }
}



function createNote(noteData = {}) {
    
  const id = noteData.id || crypto.randomUUID();
  const x = noteData.x !== undefined ? noteData.x : window.innerWidth / 2 - 100;
  const y = noteData.y !== undefined ? noteData.y : window.innerHeight / 2 - 75;
  const z = noteData.z !== undefined ? noteData.z : state.topZ++;
  const color = noteData.color || COLORS[0];
  const text = noteData.text || "New Note";
  const width = noteData.width || 200;
  const height = noteData.height || 150;

  const note = document.createElement("div");
  note.className = "note";
  note.dataset.id=id;
  note.style.left = `${x}px`;
  note.style.top = `${y}px`;
  note.style.zIndex = z;
  note.style.background = color;
  note.style.width = `${width}px`;
  note.style.height = `${height}px`;
  note.setAttribute("role", "note");
  note.setAttribute("tabindex", "0");

  const header = document.createElement("div");
  header.className = "note-header";
  header.innerHTML = `<strong>Note</strong>`;
  note.appendChild(header);

  const body = document.createElement("div");
  body.className = "note-body";
  body.contentEditable = true;
  body.innerText = text;
  note.appendChild(body);

  const colorPicker = document.createElement("div");
  colorPicker.className = "color-picker";
  COLORS.forEach(c => {
    const swatch = document.createElement("div");
    swatch.className = "color-swatch";
    swatch.style.background = c;
    swatch.onclick = () => {
      note.style.background = c;
      updateNote(id, { color: c });
      saveState();
    };
    colorPicker.appendChild(swatch);
  });
  note.appendChild(colorPicker);

  makeDraggable(note, header);

  board.appendChild(note);
//   if(!state.notes.some(n=>n.id===id)){
//     state.notes.push({id, x, y, z, text, color, width, height });
//   }
  updateNote(id, { id, x, y, z, text, color, width, height });
  body.addEventListener("input", () => {
    updateNote(id, { text: body.innerText });
    saveState();
  });
}

function updateNote(id, updates) {
  let existing = state.notes.find(n => n.id === id);
  if (existing) Object.assign(existing, updates);
  else state.notes.push({ id, ...updates });
}

function makeDraggable(note, handle) {
  let shiftX = 0, shiftY = 0;

  handle.addEventListener("pointerdown", (e) => {
    if(e.target.closest('[contenteditable]') || e.target.closest('.color-picker'))
        return;
    e.preventDefault();
    shiftX = e.clientX - note.getBoundingClientRect().left;
    shiftY = e.clientY - note.getBoundingClientRect().top;
    note.setPointerCapture(e.pointerId);
    note.style.zIndex = ++state.topZ;

    function onMove(ev) {
      const newX = ev.clientX - shiftX;
      const newY = ev.clientY - shiftY;
      note.style.left = `${newX}px`;
      note.style.top = `${newY}px`;

      const currentNote = state.notes.find(n => n.id === note.dataset.id);
      if (currentNote) {
        currentNote.x = newX;
        currentNote.y = newY;
        currentNote.z = parseInt(note.style.zIndex);
      }
    }

    function onUp(ev) {
      note.removeEventListener("pointermove", onMove);
      note.removeEventListener("pointerup", onUp);
      saveState();
    }

    note.addEventListener("pointermove", onMove);
    note.addEventListener("pointerup", onUp);
  });
}

// Event Listeners
newNoteBtn.addEventListener("click", () => createNote());
themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", state.theme);
  saveState();
});
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sticky-wall.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported.notes)) throw new Error("Invalid data");
      state = imported;
      board.innerHTML = "";
      state.notes.forEach(createNote);
      document.documentElement.setAttribute("data-theme", state.theme || "light");
      saveState();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
  reader.readAsText(file);
});

loadState();