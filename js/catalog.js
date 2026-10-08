import { MODULES } from "./data.js";

/** Gera o baralho do tópico: 1 cartão autoral + 6 derivados do próprio conteúdo. */
const buildCards = (t) => [
  { q: t.q, a: t.a },
  { q: `O que é ${t.name}?`, a: t.what },
  { q: `Por que ${t.name} importa?`, a: t.why },
  { q: `Quais os passos práticos de ${t.name}?`, a: t.how.join(" → ") },
  { q: `Que ferramentas usar em ${t.name}?`, a: t.tools.join(", ") },
  { q: `Cite um projeto intermediário de ${t.name}.`, a: t.projects.mid[0] },
  { q: `Cite um projeto sênior de ${t.name}.`, a: t.projects.sen[0] },
];

const haystack = (t) =>
  [t.name, t.kw, t.what, t.tools.join(" "), Object.values(t.projects).flat().join(" ")]
    .join(" ")
    .toLowerCase();

/** Monta o catálogo a partir de uma lista de módulos, sem alterar os dados originais. */
export function createCatalog(modules) {
  const catalog = modules.map((mod) => ({
    ...mod,
    topics: mod.topics.map((topic, index) => {
      const t = { ...topic, id: `${mod.id}-${index}`, color: mod.color, moduleName: mod.name };
      return { ...t, cards: buildCards(t) };
    }),
  }));
  const allTopics = catalog.flatMap((mod) => mod.topics);
  const topicById = new Map(allTopics.map((topic) => [topic.id, topic]));
  const search = (term) => {
    const query = term.trim().toLowerCase();
    return query ? allTopics.filter((topic) => haystack(topic).includes(query)) : [];
  };
  return { catalog, allTopics, topicById, search };
}

const defaults = createCatalog(MODULES);
export const { catalog, allTopics, topicById } = defaults;
export const searchTopics = defaults.search;
