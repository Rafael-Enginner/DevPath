import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PDF_BYTES, createLibraryClient } from "../js/library.js";

test("limite inicial de PDF é 20 MB", () => {
  assert.equal(MAX_PDF_BYTES, 20 * 1024 * 1024);
});

test("cliente da biblioteca exige configuração antes de chamar a API", async () => {
  const client = createLibraryClient({ baseUrl: "", anonKey: "", fetcher: async () => { throw new Error("não deveria chamar a rede"); } });
  await assert.rejects(client.listBooks(), /Configure SUPABASE_URL/);
});
