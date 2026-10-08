import { MODULES } from "./data.js";

/** Enriquece os dados sem alterar o original (sem efeitos colaterais). */
export const catalog = MODULES.map((mod) => ({
  ...mod,
  topics: mod.topics.map((topic, index) => ({
    ...topic,
    id: `${mod.id}-${index}`,
    color: mod.color,
    moduleName: mod.name,
  })),
}));

export const allTopics = catalog.flatMap((mod) => mod.topics);
export const topicById = new Map(allTopics.map((topic) => [topic.id, topic]));

const haystack = (topic) =>
  [topic.name, topic.kw, topic.what, topic.tools.join(" "), Object.values(topic.projects).join(" ")]
    .join(" ")
    .toLowerCase();

export const searchTopics = (term) => {
  const query = term.trim().toLowerCase();
  return query ? allTopics.filter((topic) => haystack(topic).includes(query)) : [];
};
