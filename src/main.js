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

    // 🔥 NUEVO: usar stats del backend
    const stats = result?.stats || {};

    const total = stats.total ?? 0;
    const valid = stats.valid ?? 0;
    const invalid = stats.invalid ?? 0;
    const duplicates = stats.duplicates_removed ?? 0;
    const final = stats.final ?? 0;

    let message = "";

    // 🚨 CASO: usuario NO existe
    if (validation && validation.exists === false) {

      message = `⚠️ El usuario ${validation.mail} no existe en EquusID.\n`;
      message += `📦 Los caballos fueron guardados en nuestra base interna\n\n`;

    } else {

      message = `📊 Resultado de importación:\n\n`;

    }

    // 📊 SIEMPRE mostrar stats (clave UX)
    message += `• Filas procesadas: ${total}\n`;
    message += `• Caballos válidos: ${valid}\n`;
    message += `• Caballos con errores: ${invalid}\n`;
    message += `• Duplicados eliminados: ${duplicates}\n`;
    message += `• Total final: ${final}\n`;

    // 🚨 CASO CRÍTICO: todo eliminado
    if (valid > 0 && final === 0) {
      message += `\n⚠️ Posible problema: todos los caballos fueron detectados como duplicados`;
    }

    // 🚨 CASO: todo inválido
    if (valid === 0) {
      message += `\n❌ No se pudo importar ningún caballo válido`;
    }

    // 🔍 Mostrar ejemplos de errores (muy importante)
    if (result?.errors?.length) {

      message += `\n\n⚠️ Ejemplos de errores:\n`;

      result.errors.slice(0, 3).forEach((err, i) => {

        if (err.errors) {
          message += `- ${err.errors.join(", ")}\n`;
        } else if (err.reason) {
          message += `- ${err.reason}\n`;
        }

      });

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
    }, 20000);

  } catch (err) {

    console.error(err);
    output.textContent = "Error procesando archivo";

  } finally {
    // 👉 Estado loading OFF (SIEMPRE)
    spinner.classList.add("hidden");
  }

}