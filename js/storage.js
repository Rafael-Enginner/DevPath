/** Acesso seguro ao localStorage: nunca lança erro. Os valores são serializados em JSON. */
export const storage = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* armazenamento indisponível: o app segue funcionando sem persistência */
    }
  },
};
