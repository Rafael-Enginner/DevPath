import { STORAGE } from "./config.js";
import { storage } from "./storage.js";

const A11Y = { scale: 100, contrast: false, font: false, spacing: false, motion: false, focus: false };
const DEFAULTS = { name: "", age: "", course: "", school: "", interests: "", ...A11Y };
/** Cada preferência vira um atributo data-* no <html>, usado pelo CSS. */
const FLAGS = { contrast: "high-contrast", font: "legible-font", spacing: "wide-spacing", motion: "reduced-motion", focus: "strong-focus" };

function apply(prefs) {
  const root = document.documentElement;
  root.style.setProperty("--scale", prefs.scale / 100);
  for (const [key, flag] of Object.entries(FLAGS)) root.toggleAttribute(`data-${flag}`, Boolean(prefs[key]));
}

/** Perfil opcional e opções de acessibilidade. Os dados ficam só neste navegador. */
export function initPreferences({ dialog, openButton, onChange }) {
  const form = dialog.querySelector("form");
  const output = form.querySelector("output");
  const prefs = { ...DEFAULTS, ...storage.read(STORAGE.prefs, {}) };

  const fill = () => {
    for (const [key, value] of Object.entries(prefs)) {
      const field = form.elements[key];
      if (!field) continue;
      if (field.type === "checkbox") field.checked = value;
      else field.value = value;
    }
    output.value = `${prefs.scale}%`;
  };
  const commit = () => {
    storage.write(STORAGE.prefs, prefs);
    apply(prefs);
    onChange(prefs);
  };

  form.addEventListener("input", ({ target: { name, type, checked, value } }) => {
    if (!name) return;
    prefs[name] = type === "checkbox" ? checked : type === "range" ? Number(value) : value;
    output.value = `${prefs.scale}%`;
    commit();
  });
  form.querySelector("[data-reset]").addEventListener("click", () => {
    Object.assign(prefs, A11Y);
    fill();
    commit();
  });
  form.querySelector("[data-erase]").addEventListener("click", () => {
    if (!confirm("Apagar progresso, avaliações, perfil e preferências deste navegador?")) return;
    Object.values(STORAGE).forEach((key) => storage.remove(key));
    location.reload();
  });
  openButton.addEventListener("click", () => dialog.showModal());

  fill();
  apply(prefs);
  onChange(prefs);
}
