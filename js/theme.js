import { STORAGE } from "./config.js";
import { storage } from "./storage.js";

/** O tema inicial é definido pelo script inline do index.html (evita flash). Aqui só alterna. */
export function initTheme(button) {
  const root = document.documentElement;
  const sync = () => button.setAttribute("aria-pressed", String(root.dataset.theme === "dark"));
  button.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    storage.write(STORAGE.theme, root.dataset.theme);
    sync();
  });
  sync();
}
