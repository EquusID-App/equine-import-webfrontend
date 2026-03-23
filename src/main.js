const fileInput = document.getElementById("file");
const fileLabel = document.querySelector(".custom-file-label");
const fileName = document.querySelector(".file-name");

const emailInput = document.getElementById("usermail");
const validateBtn = document.getElementById("validateBtn");
const emailLabel = document.querySelector(".email-validation-label");

const importButton = document.getElementById("importButton");
const form = document.getElementById("uploadForm");
const output = document.getElementById("output");

let emailExists = null;

// -------------------------
// EMAIL INPUT
// -------------------------

emailInput.addEventListener("input", () => {

  const hasEmail = emailInput.value.trim().length > 3;

  validateBtn.disabled = !hasEmail;

  emailLabel.classList.remove("has-file");
  emailExists = null;

  updateImportButton();

});

// -------------------------
// VALIDATE EMAIL
// -------------------------

validateBtn.addEventListener("click", async () => {
  console.log('cick on validateBtn');

  const email = emailInput.value;

  output.textContent = "Validando usuario...";

  try {

    const res = await fetch("http://localhost:3000/validate-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    console.log('validateBtn fetch - data: ', data);

    if (data.exists.exists) {

      emailExists = true;
      emailLabel.classList.add("has-file");

      output.textContent = `Usuario ${data.mail} validado correctamente`;

    } else {

      emailExists = false;
      emailLabel.classList.remove("has-file");

      output.textContent = `El usuario ${data.mail} no existe en la DB de EquusID`;

    }

  } catch (err) {

    console.error(err);
    output.textContent = "Error validando usuario";

    emailExists = false;

  }

  updateImportButton();

});

// -------------------------
// FILE INPUT
// -------------------------

fileInput.addEventListener("change", () => {

  if (fileInput.files.length > 0) {

    fileName.textContent = fileInput.files[0].name;
    fileLabel.classList.add("has-file");

  } else {

    fileName.textContent = "Ningún archivo seleccionado";
    fileLabel.classList.remove("has-file");

  }

  updateImportButton();

});

// -------------------------
// CONTROL BOTÓN IMPORT
// -------------------------

function updateImportButton() {

  const hasFile = fileInput.files.length > 0;
  const hasEmail = emailInput.value.trim().length > 3;

  importButton.disabled = !(hasFile && hasEmail);

}

// -------------------------
// UPLOAD
// -------------------------

form.addEventListener("submit", upload);

async function upload(e) {

  e.preventDefault();

  const file = fileInput.files[0];
  const email = emailInput.value;

  if (!file) {
    alert("Seleccioná un archivo");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("email", email);

  output.textContent = "Procesando archivo...";

  try {

    const res = await fetch("http://localhost:3000/import", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    const { success, result, validation } = data;

    if (!success) {
      output.textContent = "❌ Error en la importación";
      return;
    }

    const ok = result?.success ?? 0;
    const failed = result?.failed ?? 0;
    const total = ok + (failed || 0);

    let message = `✅ ${ok} caballos importados correctamente`;

    if (failed) {
      message += `\n⚠️ ${failed} fallaron`;
    }

    output.textContent = message;
    setTimeout(()=>{
      form.reset();
      output.textContent = "";
      fileInput.value = "";
      fileName.textContent = "Ningún archivo seleccionado";
      fileLabel.classList.remove("has-file");
      emailExists = false;
      emailLabel.classList.remove("has-file");
    }, 10000);

  } catch (err) {

    console.error(err);
    output.textContent = "Error procesando archivo";

  }

}