import { createCatalog } from "./catalog.js";
import { MODULES } from "./data.js";
import { STORAGE } from "./config.js";
import { storage } from "./storage.js";
import { html, render } from "./html.js";
import { NavItem, ModuleHeader, SearchSummary, Topic, doneLabel } from "./components.js";
import { selectTab, onTabKeydown } from "./tabs.js";
import { initTheme } from "./theme.js";
import { initPreferences } from "./preferences.js";
import { initContentTools, validateModules } from "./content.js";

const $ = (selector) => document.querySelector(selector);
const els = { nav: $("#nav"), content: $("#content"), search: $("#search"), status: $("#status"), ring: $("#ring") };

/* Conteúdo: usa o JSON importado pelo usuário, se for válido; senão, o conteúdo original. */
const imported = storage.read(STORAGE.content, null);
const modules = imported && !validateModules(imported) ? imported : MODULES;
const { catalog, allTopics, topicById, search } = createCatalog(modules);

const savedModule = storage.read(STORAGE.module, catalog[0].id);
const state = {
  done: storage.read(STORAGE.progress, {}),
  ratings: storage.read(STORAGE.ratings, {}),
  known: storage.read(STORAGE.cards, {}),
  module: catalog.some((mod) => mod.id === savedModule) ? savedModule : catalog[0].id,
  query: "",
};

const isDone = (id) => Boolean(state.done[id]);
const isKnown = (id, index) => Boolean(state.known[`${id}:${index}`]);
const viewOf = (t, showModule = false) => ({ done: isDone(t.id), rating: state.ratings[t.id] ?? 0, showModule, known: isKnown });
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
    const hits = search(state.query);
    render(els.content, html`${SearchSummary(state.query, hits.length)}${hits.map((t) => Topic(t, viewOf(t, true)))}`);
    els.status.textContent = `${hits.length} resultados encontrados`;
    return;
  }
  const mod = catalog.find((item) => item.id === state.module);
  render(els.content, html`${ModuleHeader(mod)}${mod.topics.map((t) => Topic(t, viewOf(t)))}`);
}

function showCard(deck, topic, index) {
  const card = deck.querySelector(".flash");
  card.dataset.i = index;
  card.setAttribute("aria-pressed", "false");
  card.textContent = topic.cards[index].q;
  deck.querySelector(".counter").textContent = `${index + 1} de ${topic.cards.length}`;
  deck.querySelector(".know").setAttribute("aria-pressed", String(isKnown(topic.id, index)));
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
  rate(el) {
    const [id, value] = el.dataset.rate.split(":");
    state.ratings[id] = Number(value) === state.ratings[id] ? 0 : Number(value);
    storage.write(STORAGE.ratings, state.ratings);
    el.parentElement.querySelectorAll("[data-rate]").forEach((star, i) => {
      const on = i < state.ratings[id];
      star.setAttribute("aria-pressed", String(on));
      star.textContent = on ? "★" : "☆";
    });
  },
  flash(el) {
    const topic = topicById.get(el.dataset.flash);
    const showingAnswer = el.getAttribute("aria-pressed") === "true";
    const card = topic.cards[Number(el.dataset.i)];
    el.setAttribute("aria-pressed", String(!showingAnswer));
    el.textContent = showingAnswer ? card.q : card.a;
  },
  step(el) {
    const [id, direction] = el.dataset.step.split(":");
    const topic = topicById.get(id);
    const deck = el.closest(".deck");
    const current = Number(deck.querySelector(".flash").dataset.i);
    showCard(deck, topic, (current + Number(direction) + topic.cards.length) % topic.cards.length);
  },
  know(el) {
    const index = el.closest(".deck").querySelector(".flash").dataset.i;
    const key = `${el.dataset.know}:${index}`;
    state.known[key] = !state.known[key];
    storage.write(STORAGE.cards, state.known);
    el.setAttribute("aria-pressed", String(state.known[key]));
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

/* ---------- Inicialização ---------- */
initTheme($("#theme"));
initPreferences({
  dialog: $("#prefs"),
  openButton: $("#prefs-open"),
  onChange: ({ name, course, school }) => {
    $("#greeting").textContent = name ? `Olá, ${name}! ${[course, school].filter(Boolean).join(" · ")}` : "";
  },
});
initContentTools({
  fileInput: $("#content-file"),
  exportButton: $("#content-export"),
  resetButton: $("#content-reset"),
  message: $("#content-msg"),
  modules,
});
renderNav();
renderContent();
