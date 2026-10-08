/** Abas acessíveis (padrão WAI-ARIA): setas, Home e End. */
export function selectTab(tab) {
  const list = tab.parentElement;
  const card = list.parentElement;
  list.querySelectorAll('[role="tab"]').forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  card.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  });
  tab.focus();
}

const STEP = { ArrowRight: 1, ArrowLeft: -1 };

export function onTabKeydown(event) {
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const tabs = [...tab.parentElement.children];
  const index = tabs.indexOf(tab);
  let next = null;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else if (event.key in STEP) next = (index + STEP[event.key] + tabs.length) % tabs.length;
  if (next === null) return;
  event.preventDefault();
  selectTab(tabs[next]);
}
