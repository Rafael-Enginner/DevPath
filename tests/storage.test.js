import { test } from "node:test";
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = {
  getItem: (key) => mem.get(key) ?? null,
  setItem: (key, value) => mem.set(key, String(value)),
  removeItem: (key) => mem.delete(key),
};
const { storage } = await import("../js/storage.js");
const { MIGRATIONS, SCHEMA_VERSION } = await import("../js/migrations.js");
const { STORAGE } = await import("../js/config.js");

test("migração 0→1 converte textos antigos em JSON e grava a versão", () => {
  mem.clear();
  mem.set(STORAGE.module, "ux");
  storage.migrate(STORAGE.schema, SCHEMA_VERSION, MIGRATIONS);
  assert.equal(storage.read(STORAGE.module, null), "ux");
  assert.equal(storage.read(STORAGE.schema, 0), SCHEMA_VERSION);
});

test("migração não roda de novo quando a versão já é a atual", () => {
  mem.clear();
  mem.set(STORAGE.schema, JSON.stringify(SCHEMA_VERSION));
  mem.set(STORAGE.module, "ux");
  storage.migrate(STORAGE.schema, SCHEMA_VERSION, MIGRATIONS);
  assert.equal(mem.get(STORAGE.module), "ux");
});

test("read devolve o padrão quando o JSON é inválido", () => {
  mem.set("k", "{quebrado");
  assert.equal(storage.read("k", "padrão"), "padrão");
});
