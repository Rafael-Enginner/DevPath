/** Constantes compartilhadas da aplicação. */
export const STORAGE = {
  progress: "devpath:v1",
  module: "devpath:mod",
  theme: "devpath:theme",
  prefs: "devpath:prefs",
  ratings: "devpath:ratings",
  cards: "devpath:cards",
  content: "devpath:content",
  schema: "devpath:schema",
};

/** Repositório que recebe os feedbacks (Issues do GitHub). */
export const REPO = "rafael-enginner/DevPath";

export const TABS = ["Conceito", "Prática", "Projetos", "Fixar"];

export const LEVELS = [
  { key: "ini", label: "Iniciante", color: "#54b894" },
  { key: "mid", label: "Intermediário", color: "#d7a94a" },
  { key: "sen", label: "Sênior", color: "#d77fae" },
];


/** Configuração pública do Supabase. A chave anon é pública; nunca coloque service_role ou chave de IA aqui. */
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
