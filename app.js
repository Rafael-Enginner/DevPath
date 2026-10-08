(() => {
  const KEY = "devpath:v1";
  const $ = (s, r = document) => r.querySelector(s);
  const LEVELS = [["ini", "Iniciante", "#34d399"], ["mid", "Intermediário", "#fbbf24"], ["sen", "Sênior", "#f472b6"]];
  const TABS = ["Conceito", "Prática", "Projetos", "Fixar"];
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sem armazenamento */ } }
  };
  let done = store.get(), current = MODULES[0].id, query = "";
  MODULES.forEach(m => m.topics.forEach((t, i) => { t.id = `${m.id}-${i}`; t.color = m.color; t.mod = m.name; }));
  const all = MODULES.flatMap(m => m.topics);

  function renderNav() {
    $("#nav").innerHTML = MODULES.map(m => {
      const n = m.topics.filter(t => done[t.id]).length;
      return `<button class="stop" style="--c:${m.color}" data-mod="${m.id}" aria-current="${m.id === current && !query}"><i></i><span>${m.name}<small>${n} de ${m.topics.length} concluídos</small></span></button>`;
    }).join("");
    const n = all.filter(t => done[t.id]).length, p = Math.round(n / all.length * 100);
    $("#ring").style.strokeDashoffset = 113 - 113 * p / 100;
    $("#pct").textContent = p + "%";
    $("#count").textContent = `${n} de ${all.length} tópicos`;
  }

  const topicHTML = t => `
    <article class="topic" style="--c:${t.color}" id="${t.id}">
      <div class="head"><div><h3>${t.name}</h3><p class="kw">${t.kw}</p></div>
        <button class="done" data-done="${t.id}" aria-pressed="${!!done[t.id]}">${done[t.id] ? "Concluído" : "Marcar como concluído"}</button></div>
      <div role="tablist" aria-label="Seções de ${t.name}">${TABS.map((x, i) =>
        `<button role="tab" id="${t.id}-t${i}" aria-controls="${t.id}-p${i}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}">${x}</button>`).join("")}</div>
      <div role="tabpanel" id="${t.id}-p0" aria-labelledby="${t.id}-t0"><dl><dt>O que é</dt><dd>${t.what}</dd><dt>Por que importa</dt><dd>${t.why}</dd></dl></div>
      <div role="tabpanel" id="${t.id}-p1" aria-labelledby="${t.id}-t1" hidden><ol>${t.how.map(s => `<li>${s}</li>`).join("")}</ol><div class="tools">${t.tools.map(s => `<span>${s}</span>`).join("")}</div></div>
      <div role="tabpanel" id="${t.id}-p2" aria-labelledby="${t.id}-t2" hidden><div class="levels">${LEVELS.map(([k, n, c]) => `<div class="lv" style="--l:${c}"><b>${n}</b>${t.projects[k]}</div>`).join("")}</div></div>
      <div role="tabpanel" id="${t.id}-p3" aria-labelledby="${t.id}-t3" hidden><button class="flash" aria-pressed="false" data-flash="${t.id}">${t.q}</button><p class="hint">Responda mentalmente e toque no cartão para conferir.</p></div>
    </article>`;

  function renderContent() {
    const q = query.trim().toLowerCase();
    let html;
    if (q) {
      const hits = all.filter(t => [t.name, t.kw, t.what, t.tools.join(" "), Object.values(t.projects).join(" ")].join(" ").toLowerCase().includes(q));
      html = hits.length ? hits.map(topicHTML).join("") : `<p class="empty">Nada encontrado para "${q.replace(/[<>&]/g, "")}". Tente outro termo, como Docker ou Figma.</p>`;
    } else {
      const m = MODULES.find(x => x.id === current);
      html = `<section class="mod" style="--c:${m.color}"><h2>${m.name}</h2><p>${m.tip}</p></section>${m.topics.map(topicHTML).join("")}`;
    }
    $("#content").innerHTML = html;
  }

  function selectTab(tab) {
    const list = tab.parentElement, card = list.parentElement;
    list.querySelectorAll("[role=tab]").forEach(b => { const on = b === tab; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    card.querySelectorAll("[role=tabpanel]").forEach(p => p.hidden = p.id !== tab.getAttribute("aria-controls"));
    tab.focus();
  }

  document.addEventListener("click", e => {
    const stop = e.target.closest("[data-mod]"), tab = e.target.closest("[role=tab]"),
      dn = e.target.closest("[data-done]"), fl = e.target.closest("[data-flash]");
    if (stop) { current = stop.dataset.mod; query = ""; $("#search").value = ""; renderNav(); renderContent(); $("#content").focus({ preventScroll: true }); scrollTo({ top: 0 }); }
    if (tab) selectTab(tab);
    if (dn) {
      const id = dn.dataset.done; done[id] = !done[id]; store.set(done);
      dn.setAttribute("aria-pressed", !!done[id]); dn.textContent = done[id] ? "Concluído" : "Marcar como concluído"; renderNav();
    }
    if (fl) {
      const t = all.find(x => x.id === fl.dataset.flash), on = fl.getAttribute("aria-pressed") !== "true";
      fl.setAttribute("aria-pressed", on); fl.textContent = on ? t.a : t.q;
    }
  });

  document.addEventListener("keydown", e => {
    const tab = e.target.closest?.("[role=tab]");
    if (!tab || !["ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const tabs = [...tab.parentElement.children], i = tabs.indexOf(tab);
    selectTab(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]);
  });

  $("#search").addEventListener("input", e => { query = e.target.value; renderNav(); renderContent(); });
  $("#theme").addEventListener("click", () => {
    const r = document.documentElement, next = r.dataset.theme === "dark" ? "light" : "dark";
    r.dataset.theme = next; try { localStorage.setItem("devpath:theme", next); } catch { /* ignora */ }
  });
  try {
    const saved = localStorage.getItem("devpath:theme");
    if (saved) document.documentElement.dataset.theme = saved;
    else if (matchMedia("(prefers-color-scheme: light)").matches) document.documentElement.dataset.theme = "light";
  } catch { /* ignora */ }

  renderNav(); renderContent();
})();
