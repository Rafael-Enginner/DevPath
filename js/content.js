import { LEVELS, STORAGE } from "./config.js";
import { storage } from "./storage.js";

const MAX_BYTES = 1_000_000;
const REQUIRED = ["name", "kw", "what", "why", "q", "a"];

/** Retorna uma mensagem de erro em português, ou null se o conteúdo for válido. */
export function validateModules(data) {
  if (!Array.isArray(data) || data.length === 0) return "O arquivo precisa conter uma lista de módulos.";
  for (const mod of data) {
    const ok = mod.id && mod.name && /^#[0-9a-f]{6}$/i.test(mod.color) && Array.isArray(mod.topics) && mod.topics.length;
    if (!ok) return `Módulo inválido: ${mod.name ?? "sem nome"}.`;
    for (const t of mod.topics) {
      const missing = REQUIRED.some((field) => !String(t[field] ?? "").trim());
      const levels = LEVELS.every(({ key }) => Array.isArray(t.projects?.[key]) && t.projects[key].length);
      if (missing || !Array.isArray(t.how) || !Array.isArray(t.tools) || !levels) {
        return `Tópico inválido em ${mod.name}: ${t.name ?? "sem nome"}.`;
      }
    }
  }
  return null;
}

/** Exporta e importa o conteúdo como JSON. Tudo acontece no navegador, sem envio de dados. */
export function initContentTools({ fileInput, exportButton, resetButton, message, modules }) {
  const say = (text) => {
    message.textContent = text;
  };
  exportButton.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(modules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "devpath-conteudo.json" }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  fileInput.addEventListener("change", async () => {
    const [file] = fileInput.files;
    if (!file) return;
    if (file.size > MAX_BYTES) return say("Arquivo grande demais (máximo de 1 MB).");
    try {
      const data = JSON.parse(await file.text());
      const problem = validateModules(data);
      if (problem) return say(problem);
      storage.write(STORAGE.content, data);
      location.reload();
    } catch {
      say("Não foi possível ler o arquivo. Use um JSON exportado pelo próprio DevPath.");
    }
  });
  resetButton.addEventListener("click", () => {
    storage.remove(STORAGE.content);
    location.reload();
  });
}
