const fileInput = document.getElementById("file");
const fileLabel = document.querySelector(".custom-file-label");
const fileName = document.querySelector(".file-name");

const emailInput = document.getElementById("usermail");
const validateBtn = document.getElementById("validateBtn");
const emailLabel = document.querySelector(".email-validation-label");

const importButton = document.getElementById("importButton");
const form = document.getElementById("uploadForm");
const output = document.getElementById("output");

const spinner = document.getElementById("spinner-container");

let emailExists = null;

const backendUrl = import.meta.env.VITE_API_URL;

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

    const res = await fetch(`${backendUrl}/validate-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    console.log('validateBtn fetch - data: ', data);

    if (data.exists) {

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

  // 👉 Estado loading ON
  spinner.classList.remove("hidden");
  output.textContent = "Procesando archivo...";

  try {

    const res = await fetch(`${backendUrl}/import`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    console.log('upload | fetch - data: ', data);

    const { success, result, validation } = data;

    if (!success) {
      output.textContent = "❌ Error en la importación";
      return;
    }

    const ok = result?.success ?? 0;
    const failed = result?.failed ?? 0;

    let message = "";

    // 🚨 CASO: usuario NO existe
    if (validation && validation.exists === false) {

      message = `⚠️ El usuario ${validation.mail} no existe en EquusID.\n`;
      message += `📦 Los caballos fueron guardados en nuestra base interna`;

      if (ok) {
        message += `\n✅ ${ok} procesados correctamente`;
      }

      if (failed) {
        message += `\n❌ ${failed} fallaron`;
      }

    // ✅ CASO: usuario existe (flujo normal)
    } else {

      message = `✅ ${ok} caballos importados correctamente`;

      if (failed) {
        message += `\n⚠️ ${failed} fallaron`;
      }

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

  } finally {
    // 👉 Estado loading OFF (SIEMPRE)
    spinner.classList.add("hidden");
  }

}