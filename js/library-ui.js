import { createLibraryClient } from "./library.js";

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const statusLabel = (status) => ({ uploaded: "Enviado", processing: "Processando", processed: "Texto extraído", failed: "Falhou", ready: "Pronto" })[status] || status || "Desconhecido";

export function initLibraryUI({ openButton = $("#library-open"), dialog = $("#library-dialog") } = {}) {
  if (!openButton || !dialog) return;
  const client = createLibraryClient();
  const form = $("#library-login", dialog);
  const loginPanel = $("#library-login-panel", dialog);
  const adminPanel = $("#library-admin-panel", dialog);
  const status = $("#library-status", dialog);
  const booksList = $("#library-books", dialog);
  const generatedList = $("#library-generated", dialog);
  const publicList = $("#library-public-content", dialog);
  const say = (message, isError = false) => { status.textContent = message; status.dataset.error = String(isError); };

  const renderBooks = (books) => {
    booksList.innerHTML = books.length ? books.map((book) => `<article class="library-item"><div><strong>${escapeHtml(book.title)}</strong><p>${escapeHtml(statusLabel(book.status))}${book.error_message ? ` · ${escapeHtml(book.error_message)}` : ""}</p></div><div class="library-actions"><button type="button" data-process="${escapeHtml(book.id)}" ${book.status === "processing" ? "disabled" : ""}>Extrair texto</button><button type="button" data-generate="${escapeHtml(book.id)}">Gerar flashcards</button></div></article>`).join("") : "<p class=hint>Nenhum PDF importado ainda.</p>";
  };
  const renderGenerated = (items, target = generatedList, drafts = false) => {
    target.innerHTML = items.length ? items.map((item) => `<article class="library-item"><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.kind)} · ${drafts ? "rascunho aguardando revisão" : "publicado"}</p></div><div class="library-actions"><details><summary>Ver conteúdo</summary><pre>${escapeHtml(JSON.stringify(item.content, null, 2))}</pre></details>${drafts ? `<button type="button" data-publish="${escapeHtml(item.id)}">Revisar e publicar</button>` : ""}</div></article>`).join("") : `<p class=hint>${drafts ? "Nenhum rascunho aguardando revisão." : "Ainda não há materiais publicados."}</p>`;
  };
  const refresh = async () => {
    try {
      const [books, generated, drafts] = await Promise.all([client.listBooks(), client.listGenerated(), client.listDrafts()]);
      renderBooks(books); renderGenerated(drafts, generatedList, true); renderGenerated(generated, publicList);
    } catch (error) { say(error.message, true); }
  };
  const setSignedIn = (signedIn) => {
    loginPanel.hidden = signedIn;
    adminPanel.hidden = !signedIn;
    if (signedIn) refresh();
  };

  openButton.addEventListener("click", () => {
    dialog.showModal();
    if (!client.isConfigured()) say("Para ativar a biblioteca, configure a URL e a chave pública do Supabase em js/config.js e aplique as migrações descritas em docs/BIBLIOTECA-IA.md.", true);
    else if (client.isSignedIn()) setSignedIn(true);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("[name=email]", form).value.trim();
    const password = $("[name=password]", form).value;
    try { await client.signIn(email, password); say("Login realizado."); setSignedIn(true); }
    catch (error) { say(error.message, true); }
  });
  $("#library-logout", dialog).addEventListener("click", () => { client.signOut(); setSignedIn(false); say("Você saiu da biblioteca."); });
  $("#library-upload", dialog).addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#library-pdfs", dialog);
    const files = [...input.files];
    if (!files.length) return say("Selecione pelo menos um PDF.", true);
    let completed = 0;
    for (const file of files) {
      try { await client.uploadBook(file); completed += 1; say(`Enviando arquivos: ${completed} de ${files.length}.`); }
      catch (error) { say(`${file.name}: ${error.message}`, true); }
    }
    input.value = "";
    await refresh();
    if (completed) say(`${completed} arquivo(s) enviado(s). Selecione “Extrair texto” para processar cada livro.`);
  });
  dialog.addEventListener("click", async (event) => {
    const processButton = event.target.closest("[data-process]");
    const generateButton = event.target.closest("[data-generate]");
    if (processButton) {
      processButton.disabled = true;
      try { await client.processBook(processButton.dataset.process); say("Extração concluída. Atualizando biblioteca..."); await refresh(); }
      catch (error) { say(error.message, true); processButton.disabled = false; }
    }
    if (generateButton) {
      generateButton.disabled = true;
      try { await client.generateContent(generateButton.dataset.generate); say("Conteúdo gerado como rascunho. Revise antes de publicar."); await refresh(); }
      catch (error) { say(error.message, true); generateButton.disabled = false; }
    }
    const publishButton = event.target.closest("[data-publish]");
    if (publishButton) {
      publishButton.disabled = true;
      try { await client.publishContent(publishButton.dataset.publish); say("Conteúdo publicado para os estudantes."); await refresh(); }
      catch (error) { say(error.message, true); publishButton.disabled = false; }
    }
  });
  setSignedIn(client.isSignedIn());
  if (client.isConfigured()) client.listGenerated().then((items) => renderGenerated(items, publicList)).catch((error) => say(error.message, true));
}
