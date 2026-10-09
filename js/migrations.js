import { STORAGE } from "./config.js";

/** Aumente ao mudar o formato dos dados salvos e adicione o passo correspondente em MIGRATIONS. */
export const SCHEMA_VERSION = 1;

/** 0 → 1: módulo e tema passam a ser gravados como JSON (antes eram texto puro). */
const wrapLegacyStrings = () => {
  try {
    for (const key of [STORAGE.module, STORAGE.theme]) {
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        JSON.parse(raw);
      } catch {
        localStorage.setItem(key, JSON.stringify(raw));
      }
    }
  } catch {
    /* sem armazenamento */
  }
};

export const MIGRATIONS = { 0: wrapLegacyStrings };
