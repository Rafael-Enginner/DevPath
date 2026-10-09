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
  /** Executa as migrações pendentes, da versão salva até a atual. */
  migrate(key, current, steps) {
    const stored = this.read(key, 0);
    for (let version = stored; version < current; version += 1) steps[version]?.();
    if (stored !== current) this.write(key, current);
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* sem armazenamento */
    }
  },
};
