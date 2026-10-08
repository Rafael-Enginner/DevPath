import { html } from "./html.js";
import { LEVELS, REPO, TABS } from "./config.js";

export const doneLabel = (isDone) => (isDone ? "Concluído" : "Marcar como concluído");

/* ---------- Navegação e cabeçalhos ---------- */
export const NavItem = (mod, current, doneCount) => html`
  <button class="stop" style="--c:${mod.color}" data-mod="${mod.id}" aria-current="${mod.id === current}">
    <i></i>
    <span>${mod.name}<small>${doneCount} de ${mod.topics.length} concluídos</small></span>
  </button>`;

export const ModuleHeader = (mod) => html`
  <section class="mod" style="--c:${mod.color}">
    <h2>${mod.name}</h2>
    <p>${mod.tip}</p>
  </section>`;

export const SearchSummary = (term, count) => html`
  <section class="mod">
    <h2>${count} ${count === 1 ? "resultado" : "resultados"}</h2>
    <p>${count ? `Busca por "${term.trim()}".` : `Nada encontrado para "${term.trim()}". Tente Docker, Figma ou Scrum.`}</p>
  </section>`;

/* ---------- Painéis do tópico ---------- */
const Concept = (t) => html`
  <dl><dt>O que é</dt><dd>${t.what}</dd><dt>Por que importa</dt><dd>${t.why}</dd></dl>`;

const Practice = (t) => html`
  <ol>${t.how.map((step) => html`<li>${step}</li>`)}</ol>
  <div class="tools">${t.tools.map((tool) => html`<span>${tool}</span>`)}</div>`;

const Projects = (t) => html`
  <div class="levels">
    ${LEVELS.map(({ key, label, color }) => html`<div class="lv" data-lv="${key}" style="--l:${color}"><b>${label}</b><ul>${t.projects[key].map((p) => html`<li>${p}</li>`)}</ul></div>`)}
  </div>`;

const Flash = (t, view) => html`
  <div class="deck">
    <button class="flash" aria-pressed="false" data-flash="${t.id}" data-i="0">${t.cards[0].q}</button>
    <div class="deck-nav">
      <button type="button" data-step="${t.id}:-1">Anterior</button>
      <span class="counter" aria-live="polite">1 de ${t.cards.length}</span>
      <button type="button" data-step="${t.id}:1">Próximo</button>
      <button type="button" class="know" data-know="${t.id}" aria-pressed="${view.known(t.id, 0)}">Dominei</button>
    </div>
  </div>
  <p class="hint">Pense na resposta, vire o cartão e marque “Dominei” quando acertar.</p>`;

const PANELS = [Concept, Practice, Projects, Flash];

/* ---------- Tópico ---------- */
const feedbackUrl = (t) =>
  `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(`Feedback: ${t.name}`)}&body=${encodeURIComponent("O que posso melhorar neste tópico?")}`;

const Stars = (t, rating) => html`
  <div class="rate" role="group" aria-label="Avaliar ${t.name}">
    ${[1, 2, 3, 4, 5].map((n) => html`<button type="button" data-rate="${t.id}:${n}" aria-pressed="${n <= rating}" aria-label="${n} ${n === 1 ? "estrela" : "estrelas"}">${n <= rating ? "★" : "☆"}</button>`)}
    <a href="${feedbackUrl(t)}" target="_blank" rel="noopener">Sugerir melhoria</a>
  </div>`;

const TopicHeader = (t, view) => html`
  <div class="head">
    <div>
      <h3>${t.name}</h3>
      <p class="kw">${view.showModule ? `${t.moduleName}: ` : ""}${t.kw}</p>
      ${Stars(t, view.rating)}
    </div>
    <button class="done" data-done="${t.id}" aria-pressed="${view.done}">${doneLabel(view.done)}</button>
  </div>`;

const TabList = (t) => html`
  <div role="tablist" aria-label="Seções de ${t.name}">
    ${TABS.map((label, i) => html`<button role="tab" id="${t.id}-t${i}" aria-controls="${t.id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`)}
  </div>`;

export const Topic = (t, { done = false, rating = 0, showModule = false, known = () => false } = {}) => {
  const view = { done, rating, showModule, known };
  return html`
  <article class="topic" style="--c:${t.color}" id="${t.id}">
    ${TopicHeader(t, view)}
    ${TabList(t)}
    ${PANELS.map((Panel, i) => html`<div role="tabpanel" id="${t.id}-p${i}" aria-labelledby="${t.id}-t${i}" ${i === 0 ? "" : "hidden"}>${Panel(t, view)}</div>`)}
  </article>`;
};
