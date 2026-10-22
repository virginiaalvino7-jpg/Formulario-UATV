
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAdvO6FHpb1ZVdqPJ7Pz1DybzHinfJmajQ",
    authDomain: "mibasededatos-b5366.firebaseapp.com",
    projectId: "mibasededatos-b5366",
    storageBucket: "mibasededatos-b5366.firebasestorage.app",
    messagingSenderId: "799541022178",
    appId: "1:799541022178:web:8b0d826ff904579fd87dbb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const alumnosRef = collection(db, "alumnos");

const loginScreen = document.getElementById("loginScreen");
const appLayout = document.getElementById("appLayout");
const studentForm = document.getElementById("studentForm");
const loginForm = document.getElementById("loginForm");

const records = [];

const titles = {
    inicio: "Panel de seguimiento",
    entrevista: "Registrar alumno",
    alumnos: "Alumnos registrados",
    riesgo: "Evaluación de riesgo"
};

function showApp() {
    loginScreen.style.display = "none";
    appLayout.style.display = "flex";
    document.getElementById("today").textContent =
        new Date().toLocaleDateString("es-MX");
    render();
}

loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    await loadRecords();
    showApp();
});

document.getElementById("logoutBtn").addEventListener("click", function() {
    appLayout.style.display = "none";
    loginScreen.style.display = "flex";
    loginForm.reset();
});

function navigate(view) {
    document.querySelectorAll(".view").forEach(section => {
        section.classList.toggle("active", section.id === view);
    });

    document.querySelectorAll(".nav").forEach(button => {
        button.classList.toggle("active", button.dataset.view === view);
    });

    document.getElementById("pageTitle").textContent = titles[view];
}

document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.go));
});

const limits = {
    nombre: 100,
    matricula: 12,
    telefono: 10,
    correo: 100,
    plantel: 100,
    entrevistador: 100,
    edad: 3,
    promedio: 10
};

Object.keys(limits).forEach(name => {
    const field = studentForm.elements.namedItem(name);
    if (field) field.maxLength = limits[name];
});

const phone = studentForm.elements.namedItem("telefono");

phone.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

studentForm.elements.namedItem("matricula").addEventListener("input", function() {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
});

studentForm.elements.namedItem("edad").addEventListener("input", function() {
    if (this.value.length > 3) this.value = this.value.slice(0, 3);
});

studentForm.elements.namedItem("promedio").addEventListener("input", function() {
    if (Number(this.value) > 10) this.value = "10";
    if (this.value !== "" && Number(this.value) < 0) this.value = "0";
});

function getFormData() {
    const data = {};

    new FormData(studentForm).forEach((value, key) => {
        if (key !== "factores" && key !== "id") {
            data[key] = value;
        }
    });

    data.factores = Array.from(
        studentForm.querySelectorAll('input[name="factores"]:checked')
    ).map(input => input.value);

    return data;
}

function validateData(data) {
    const email = (data.correo || "").trim();
    const edad = Number(data.edad);
    const promedio = Number(data.promedio);

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Escribe un correo electrónico válido.");
        return false;
    }

    if (data.telefono && data.telefono.length !== 10) {
        alert("El teléfono debe tener 10 dígitos.");
        return false;
    }

    if (data.edad && (edad < 1 || edad > 100)) {
        alert("La edad debe estar entre 1 y 100 años.");
        return false;
    }

    if (data.promedio !== "" && (promedio < 0 || promedio > 10)) {
        alert("El promedio debe estar entre 0 y 10.");
        return false;
    }

    return true;
}

studentForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const data = getFormData();

    if (!validateData(data)) return;

    const id = studentForm.elements.namedItem("id").value;
    const submitButton = studentForm.querySelector('[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
        if (id) {
            await updateDoc(doc(db, "alumnos", id), {
                ...data,
                actualizadoEn: serverTimestamp()
            });
        } else {
            await addDoc(alumnosRef, {
                ...data,
                creadoEn: serverTimestamp()
            });
        }

        await loadRecords();

        studentForm.reset();
        studentForm.elements.namedItem("id").value = "";

        navigate("alumnos");
        alert(id ? "Registro actualizado correctamente." : "Alumno guardado correctamente.");
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("No se pudo guardar el registro. Verifica la conexión y las reglas de seguridad de Firebase.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

document.getElementById("clearButton").addEventListener("click", function() {
    studentForm.reset();
    studentForm.elements.namedItem("id").value = "";
});

async function loadRecords() {
    try {
        const snapshot = await getDocs(alumnosRef);

        records.length = 0;

        snapshot.forEach(documentSnapshot => {
            records.push({
                ...documentSnapshot.data(),
                id: documentSnapshot.id
            });
        });

        render();
    } catch (error) {
        console.error("Error al consultar Firebase:", error);
        alert("No se pudieron cargar los registros. Verifica las reglas de seguridad de Firestore.");
    }
}

function safe(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

function render() {
    document.getElementById("total").textContent = records.length;
    document.getElementById("interviews").textContent = records.length;
    document.getElementById("high").textContent =
        records.filter(r => r.riesgo === "Alto").length;

    const recent = document.getElementById("recent");

    recent.innerHTML = records.length
        ? records.slice(-5).reverse().map(r => `
            <div class="risk-item">
                <strong>${safe(r.nombre || "Sin nombre")}</strong>
                <p>Matrícula: ${safe(r.matricula || "Sin matrícula")}</p>
                <p>Programa: ${safe(r.carrera || "Sin programa")}</p>
                <p>Riesgo: ${safe(r.riesgo || "Bajo")}</p>
            </div>
        `).join("")
        : "Todavía no hay registros.";

    renderTable();
    renderRisks();
}

function renderTable() {
    const query = document.getElementById("search").value.toLowerCase();
    const filter = document.getElementById("filter").value;

    const filtered = records.filter(r =>
        (
            (r.nombre || "").toLowerCase().includes(query) ||
            (r.matricula || "").toLowerCase().includes(query)
        ) &&
        (!filter || r.riesgo === filter)
    );

    document.getElementById("tableBody").innerHTML = filtered.map(r => `
        <tr>
            <td>${safe(r.nombre || "Sin nombre")}</td>
            <td>${safe(r.matricula || "—")}</td>
            <td>${safe(r.carrera || "—")}</td>
            <td>${safe(r.fecha || "—")}</td>
            <td><span class="risk ${safe(r.riesgo || "Bajo")}">${safe(r.riesgo || "Bajo")}</span></td>
            <td>
                <button class="btn" onclick="editRecord('${safe(r.id)}')">Editar</button>
                <button class="btn danger" onclick="deleteRecord('${safe(r.id)}')">Eliminar</button>
            </td>
        </tr>
    `).join("");

    document.getElementById("count").textContent =
        filtered.length + " registro(s)";
}

function renderRisks() {
    const list = document.getElementById("riskList");
    const highRisk = records.filter(r => r.riesgo === "Alto");

    list.innerHTML = highRisk.length
        ? highRisk.map(r => `
            <div class="risk-item">
                <strong>${safe(r.nombre || "Sin nombre")}</strong>
                <p>Matrícula: ${safe(r.matricula || "Sin matrícula")}</p>
                <p>Prioridad: ${safe(r.prioridad || "No especificada")}</p>
                <p>Seguimiento: ${safe(r.seguimiento || "Sin observaciones")}</p>
            </div>
        `).join("")
        : "No hay casos de riesgo alto registrados.";
}

function editRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;

    studentForm.reset();

    Object.keys(record).forEach(key => {
        const field = studentForm.elements.namedItem(key);

        if (!field || key === "factores" || key === "id") return;

        if (typeof field.value !== "undefined") {
            field.value = record[key] || "";
        }
    });

    studentForm.querySelectorAll('input[name="factores"]').forEach(input => {
        input.checked = (record.factores || []).includes(input.value);
    });

    studentForm.elements.namedItem("id").value = record.id;
    navigate("entrevista");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;

    if (!confirm(`¿Deseas eliminar el registro de ${record.nombre || "este alumno"}?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "alumnos", id));
        await loadRecords();
        alert("Registro eliminado correctamente.");
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar el registro. Verifica las reglas de seguridad de Firebase.");
    }
}

window.editRecord = editRecord;
window.deleteRecord = deleteRecord;

document.getElementById("search").addEventListener("input", renderTable);
document.getElementById("filter").addEventListener("change", renderTable);

render();
