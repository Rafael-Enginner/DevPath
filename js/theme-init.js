/* Roda antes da pintura (script clássico, não módulo) para evitar o flash de tema. A alternância fica em theme.js */
(() => {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("devpath:theme"));
  } catch {
    /* sem tema salvo */
  }
  const prefersLight = matchMedia("(prefers-color-scheme: light)").matches;
  document.documentElement.dataset.theme = saved === "light" || saved === "dark" ? saved : prefersLight ? "light" : "dark";
})();
