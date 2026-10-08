import { catalog, allTopics, topicById, searchTopics } from "./catalog.js";
import { STORAGE } from "./config.js";
import { storage } from "./storage.js";
import { html, render } from "./html.js";
import { NavItem, ModuleHeader, SearchSummary, Topic, doneLabel } from "./components.js";
import { selectTab, onTabKeydown } from "./tabs.js";
import { initTheme } from "./theme.js";

const $ = (selector) => document.querySelector(selector);
const els = { nav: $("#nav"), content: $("#content"), search: $("#search"), status: $("#status"), ring: $("#ring") };

const savedModule = storage.read(STORAGE.module, catalog[0].id);
const state = {
  done: storage.read(STORAGE.progress, {}),
  module: catalog.some((mod) => mod.id === savedModule) ? savedModule : catalog[0].id,
  query: "",
};

const isDone = (id) => Boolean(state.done[id]);
const circumference = 2 * Math.PI * els.ring.r.baseVal.value;
els.ring.style.strokeDasharray = circumference;

/* ---------- Renderização ---------- */
function renderProgress() {
  const count = allTopics.filter((topic) => isDone(topic.id)).length;
  const percent = Math.round((count / allTopics.length) * 100);
  els.ring.style.strokeDashoffset = circumference * (1 - percent / 100);
  $("#pct").textContent = `${percent}%`;
  $("#count").textContent = `${count} de ${allTopics.length} tópicos`;
}

function renderNav() {
  const current = state.query.trim() ? null : state.module;
  render(els.nav, html`${catalog.map((mod) => NavItem(mod, current, mod.topics.filter((t) => isDone(t.id)).length))}`);
  renderProgress();
}

function renderContent() {
  if (state.query.trim()) {
    const hits = searchTopics(state.query);
    render(els.content, html`${SearchSummary(state.query, hits.length)}${hits.map((t) => Topic(t, isDone(t.id), true))}`);
    els.status.textContent = `${hits.length} resultados encontrados`;
    return;
  }
  const mod = catalog.find((item) => item.id === state.module);
  render(els.content, html`${ModuleHeader(mod)}${mod.topics.map((t) => Topic(t, isDone(t.id)))}`);
}

/* ---------- Ações (delegação de eventos) ---------- */
const actions = {
  mod(el) {
    state.module = el.dataset.mod;
    state.query = "";
    els.search.value = "";
    storage.write(STORAGE.module, state.module);
    renderNav();
    renderContent();
    els.content.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  },
  done(el) {
    const id = el.dataset.done;
    state.done[id] = !state.done[id];
    storage.write(STORAGE.progress, state.done);
    el.setAttribute("aria-pressed", String(state.done[id]));
    el.textContent = doneLabel(state.done[id]);
    renderNav();
  },
  flash(el) {
    const topic = topicById.get(el.dataset.flash);
    const showingAnswer = el.getAttribute("aria-pressed") === "true";
    el.setAttribute("aria-pressed", String(!showingAnswer));
    el.textContent = showingAnswer ? topic.q : topic.a;
  },
  pick(el) {
    document.body.dataset.level = el.dataset.pick;
    document.querySelectorAll("[data-pick]").forEach((chip) => chip.setAttribute("aria-pressed", String(chip === el)));
  },
};

document.addEventListener("click", (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) return selectTab(tab);
  for (const name of Object.keys(actions)) {
    const el = event.target.closest(`[data-${name}]`);
    if (el) return actions[name](el);
  }
});
document.addEventListener("keydown", onTabKeydown);
els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderNav();
  renderContent();
});

initTheme($("#theme"));
renderNav();
renderContent();
