import { test } from "node:test";
import assert from "node:assert/strict";
import { catalog, allTopics, searchTopics } from "../js/catalog.js";
import { html } from "../js/html.js";
import { Topic } from "../js/components.js";
import { LEVELS } from "../js/config.js";
import { MODULES } from "../js/data.js";
import { validateModules } from "../js/content.js";

test("todo módulo tem tópicos e dica", () => {
  for (const mod of catalog) {
    assert.ok(mod.topics.length > 0, mod.id);
    assert.ok(mod.tip, mod.id);
  }
});

test("todo tópico tem os campos obrigatórios", () => {
  for (const topic of allTopics) {
    for (const field of ["name", "kw", "what", "why", "q", "a"]) {
      assert.ok(topic[field]?.trim(), `${topic.id}.${field}`);
    }
    assert.ok(topic.how.length >= 2, `${topic.id}.how`);
    assert.ok(topic.tools.length >= 2, `${topic.id}.tools`);
    for (const { key } of LEVELS) {
      const list = topic.projects[key];
      assert.ok(list.length >= 5, `${topic.id}.projects.${key}`);
      assert.equal(new Set(list).size, list.length, `${topic.id}.${key} repetido`);
    }
  }
});

test("ids de tópicos são únicos", () => {
  assert.equal(new Set(allTopics.map((t) => t.id)).size, allTopics.length);
});

test("html escapa valores interpolados", () => {
  assert.equal(html`<p>${"<b>"}</p>`.safe, "<p>&lt;b&gt;</p>");
});

test("Topic não injeta HTML vindo dos dados", () => {
  const out = Topic({ ...allTopics[0], name: "<script>x</script>" }).safe;
  assert.ok(!out.includes("<script>"));
});

test("todo tópico tem baralho com 7 cartões", () => {
  for (const topic of allTopics) assert.equal(topic.cards.length, 7, topic.id);
});

test("validateModules rejeita estrutura inválida", () => {
  assert.ok(validateModules([{ id: "x" }]));
  assert.equal(validateModules(MODULES), null);
});

test("busca encontra por ferramenta e ignora termo vazio", () => {
  assert.ok(searchTopics("docker").length > 0);
  assert.equal(searchTopics("   ").length, 0);
});
