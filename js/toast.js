let timer;

/** Aviso discreto e não bloqueante. A região role="status" já existe no HTML. */
export function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.textContent = ""), 250);
  }, 2200);
}
