/** Template tag que escapa automaticamente qualquer valor interpolado. */
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

const toHTML = (value) => {
  if (Array.isArray(value)) return value.map(toHTML).join("");
  if (value && value.safe !== undefined) return value.safe;
  return escape(value ?? "");
};

/** Retorna { safe }: HTML já seguro, que pode ser aninhado em outros templates. */
export const html = (strings, ...values) => ({
  safe: strings.reduce((out, text, i) => out + text + (i < values.length ? toHTML(values[i]) : ""), ""),
});

export const render = (element, node) => {
  element.innerHTML = node.safe;
};
