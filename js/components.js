import { html } from "./html.js";
import { LEVELS, TABS } from "./config.js";

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

const Flash = (t) => html`
  <button class="flash" aria-pressed="false" data-flash="${t.id}">${t.q}</button>
  <p class="hint">Responda mentalmente e toque no cartão para conferir.</p>`;

const PANELS = [Concept, Practice, Projects, Flash];

/* ---------- Tópico ---------- */
const TopicHeader = (t, isDone, showModule) => html`
  <div class="head">
    <div>
      <h3>${t.name}</h3>
      <p class="kw">${showModule ? `${t.moduleName}: ` : ""}${t.kw}</p>
    </div>
    <button class="done" data-done="${t.id}" aria-pressed="${isDone}">${doneLabel(isDone)}</button>
  </div>`;

const TabList = (t) => html`
  <div role="tablist" aria-label="Seções de ${t.name}">
    ${TABS.map((label, i) => html`<button role="tab" id="${t.id}-t${i}" aria-controls="${t.id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${label}</button>`)}
  </div>`;

export const Topic = (t, isDone, showModule = false) => html`
  <article class="topic" style="--c:${t.color}" id="${t.id}">
    ${TopicHeader(t, isDone, showModule)}
    ${TabList(t)}
    ${PANELS.map((Panel, i) => html`<div role="tabpanel" id="${t.id}-p${i}" aria-labelledby="${t.id}-t${i}" ${i === 0 ? "" : "hidden"}>${Panel(t)}</div>`)}
  </article>`;
