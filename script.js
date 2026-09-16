const DB_KEY = "secureQuestionPaperDB";
const SESSION_KEY = "secureQuestionPaperSession";

let db = JSON.parse(localStorage.getItem(DB_KEY) || '{"papers":[],"audit":[]}');

const $ = id => document.getElementById(id);

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function logAction(action) {
  const role = sessionStorage.getItem(SESSION_KEY) || "Unknown";
  db.audit.unshift({
    time: new Date().toLocaleString(),
    role,
    action
  });
  saveDB();
  renderAudit();
}

function getStatusClass(status) {
  if (status === "Approved") return "approved";
  if (status === "Under Review") return "review";
  if (status === "Released") return "released";
  return "";
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function encryptText(text) {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // This is a demonstration: the key is kept in localStorage.
  // A real cloud system must store keys in a secure KMS/HSM, not in browser storage.
  const rawKey = await crypto.subtle.exportKey("raw", key);

  return {
    ciphertext: arrayToBase64(new Uint8Array(encrypted)),
    iv: arrayToBase64(iv),
    key: arrayToBase64(new Uint8Array(rawKey))
  };
}

function arrayToBase64(arr) {
  let binary = "";
  arr.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary);
}

function sessionRole() {
  return sessionStorage.getItem(SESSION_KEY);
}

function showApp() {
  $("loginPage").classList.add("hidden");
  $("appPage").classList.remove("hidden");
  $("userRole").textContent = sessionRole();
  applyRolePermissions();
  renderAll();
}

function applyRolePermissions() {
  const role = sessionRole();
  $("createCard").style.display = role === "Question Setter" ? "block" : "none";
  $("releaseBtn").disabled = role !== "Approving Authority";
}

function renderAll() {
  renderPapers();
  renderReleaseSelect();
  renderAudit();
}

function renderPapers() {
  const box = $("paperList");
  box.innerHTML = "";

  if (!db.papers.length) {
    box.innerHTML = '<p class="muted">No question papers created yet.</p>';
    return;
  }

  db.papers.forEach(paper => {
    const div = document.createElement("div");
    div.className = "paper";
    div.innerHTML = `
      <h3>${escapeHTML(paper.subject)}</h3>
      <p><b>Exam:</b> ${escapeHTML(paper.exam)}</p>
      <p><b>Created:</b> ${paper.created}</p>
      <p><b>Integrity:</b> ${paper.hash.slice(0, 18)}...</p>
      <span class="badge ${getStatusClass(paper.status)}">${paper.status}</span>
      ${paper.releaseTime ? `<p><b>Release:</b> ${new Date(paper.releaseTime).toLocaleString()}</p>` : ""}
      <div class="actions">
        ${actionButtons(paper)}
      </div>
    `;
    box.appendChild(div);
  });
}

function actionButtons(paper) {
  const role = sessionRole();
  let html = "";

  if (role === "Reviewer" && paper.status === "Created") {
    html += `<button onclick="reviewPaper('${paper.id}')">Review</button>`;
  }

  if (role === "Approving Authority" && paper.status === "Under Review") {
    html += `<button onclick="approvePaper('${paper.id}')">Approve</button>`;
  }

  if (role === "Approving Authority" && paper.status === "Approved") {
    html += `<button onclick="prepareRelease('${paper.id}')">Select for Release</button>`;
  }

  if (role === "Question Setter" && paper.status === "Created") {
    html += `<button class="danger" onclick="deletePaper('${paper.id}')">Delete</button>`;
  }

  return html;
}

function renderReleaseSelect() {
  const select = $("releasePaper");
  select.innerHTML = "";

  db.papers
    .filter(p => p.status === "Approved")
    .forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.subject} - ${p.exam}`;
      select.appendChild(option);
    });
}

function renderAudit() {
  const box = $("auditList");
  box.innerHTML = db.audit.length
    ? db.audit.slice(0, 12).map(a =>
      `<div class="audit"><b>${escapeHTML(a.action)}</b><br>${escapeHTML(a.role)} · ${escapeHTML(a.time)}</div>`
    ).join("")
    : '<p class="muted">No audit events yet.</p>';
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

$("loginBtn").addEventListener("click", () => {
  if (!$("password").value) {
    $("loginMsg").textContent = "Enter a password.";
    return;
  }

  sessionStorage.setItem(SESSION_KEY, $("role").value);
  logAction("Logged in using MFA simulation");
  showApp();
});

$("logoutBtn").addEventListener("click", () => {
  logAction("Logged out");
  sessionStorage.removeItem(SESSION_KEY);
  $("appPage").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
});

$("createBtn").addEventListener("click", async () => {
  const subject = $("subject").value.trim();
  const exam = $("exam").value.trim();
  const questions = $("questions").value.trim();

  if (!subject || !exam || !questions) {
    $("createMsg").textContent = "Please fill all fields.";
    return;
  }

  const encrypted = await encryptText(questions);
  const hash = await sha256(questions);

  db.papers.push({
    id: Date.now().toString(),
    subject,
    exam,
    created: new Date().toLocaleString(),
    encrypted,
    hash,
    status: "Created",
    releaseTime: ""
  });

  saveDB();
  logAction(`Created and encrypted paper: ${subject}`);
  $("createMsg").textContent = "Question paper encrypted and saved.";
  $("subject").value = "";
  $("exam").value = "";
  $("questions").value = "";
  renderPapers();
  renderReleaseSelect();
});

window.reviewPaper = function(id) {
  const paper = db.papers.find(p => p.id === id);
  if (!paper) return;

  paper.status = "Under Review";
  saveDB();
  logAction(`Reviewed paper: ${paper.subject}`);
  renderAll();
};

window.approvePaper = function(id) {
  const paper = db.papers.find(p => p.id === id);
  if (!paper) return;

  paper.status = "Approved";
  saveDB();
  logAction(`Approved paper: ${paper.subject}`);
  renderAll();
};

window.prepareRelease = function(id) {
  $("releasePaper").value = id;
  $("releaseTime").focus();
};

window.deletePaper = function(id) {
  const paper = db.papers.find(p => p.id === id);
  if (!paper) return;

  db.papers = db.papers.filter(p => p.id !== id);
  saveDB();
  logAction(`Deleted paper: ${paper.subject}`);
  renderAll();
};

$("releaseBtn").addEventListener("click", () => {
  const id = $("releasePaper").value;
  const time = $("releaseTime").value;

  if (!id || !time) {
    $("releaseMsg").textContent = "Select a paper and release time.";
    return;
  }

  const paper = db.papers.find(p => p.id === id);
  if (!paper) return;

  if (new Date(time) <= new Date()) {
    $("releaseMsg").textContent = "Choose a future release time.";
    return;
  }

  paper.releaseTime = time;
  saveDB();
  logAction(`Set time lock for paper: ${paper.subject}`);
  $("releaseMsg").textContent = "Controlled release time saved.";
  renderAll();
});

$("clearBtn").addEventListener("click", () => {
  if (confirm("Delete all demo papers and audit logs?")) {
    db = { papers: [], audit: [] };
    saveDB();
    renderAll();
  }
});

if (sessionRole()) {
  showApp();
}
