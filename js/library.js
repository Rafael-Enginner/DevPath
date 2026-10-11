import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPE = "application/pdf";
const SESSION_KEY = "devpath:library-session";

const configured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const safeJson = async (response) => {
  const body = await response.text();
  try { return body ? JSON.parse(body) : {}; } catch { return { message: body }; }
};

export function createLibraryClient({ baseUrl = SUPABASE_URL, anonKey = SUPABASE_ANON_KEY, fetcher = fetch } = {}) {
  const root = String(baseUrl || "").replace(/\/$/, "");
  let session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { session = null; }

  const headers = (extra = {}) => ({ apikey: anonKey, Authorization: `Bearer ${session?.access_token || anonKey}`, ...extra });
  const request = async (path, options = {}) => {
    if (!root || !anonKey) throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js.");
    const response = await fetcher(`${root}${path}`, { ...options, headers: headers(options.headers || {}) });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || `Falha na solicitação (${response.status}).`);
    return data;
  };

  return {
    isConfigured: configured,
    isSignedIn: () => Boolean(session?.access_token),
    currentUser: () => session?.user || null,
    async signIn(email, password) {
      const data = await request("/auth/v1/token?grant_type=password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      session = data;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return data.user;
    },
    signOut() { session = null; localStorage.removeItem(SESSION_KEY); },
    async listBooks() {
      return request("/rest/v1/books?select=id,title,author,status,error_message,created_at&order=created_at.desc", { headers: { Accept: "application/json" } });
    },
    async uploadBook(file) {
      if (!(file instanceof File) || file.type !== ACCEPTED_TYPE || !file.name.toLowerCase().endsWith(".pdf")) throw new Error("Selecione um arquivo PDF válido.");
      if (file.size > MAX_PDF_BYTES) throw new Error("O limite por PDF é 20 MB nesta versão.");
      if (file.size === 0) throw new Error("O arquivo está vazio.");
      if (!session?.access_token) throw new Error("Entre com uma conta autorizada para importar livros.");
      const id = crypto.randomUUID();
      const path = `${session.user.id}/${id}.pdf`;
      const uploadResponse = await fetcher(`${root}/storage/v1/object/book-pdfs/${path}`, {
        method: "POST", headers: headers({ "Content-Type": ACCEPTED_TYPE, "x-upsert": "false" }), body: file,
      });
      const uploadData = await safeJson(uploadResponse);
      if (!uploadResponse.ok) throw new Error(uploadData.message || uploadData.error || "Não foi possível enviar o PDF.");
      try {
        const rows = await request("/rest/v1/books", {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify([{ id, owner_id: session.user.id, title: file.name.replace(/\.pdf$/i, ""), file_path: path, file_size: file.size, status: "uploaded" }]),
        });
        return rows[0];
      } catch (error) {
        await fetcher(`${root}/storage/v1/object/book-pdfs/${path}`, { method: "DELETE", headers: headers() });
        throw error;
      }
    },
    async processBook(bookId) {
      return request("/functions/v1/process-book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ book_id: bookId }) });
    },
    async generateContent(bookId, kind = "flashcards") {
      return request("/functions/v1/generate-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ book_id: bookId, kind }) });
    },
    async publishContent(contentId) {
      return request("/functions/v1/publish-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content_id: contentId }) });
    },
    async listGenerated() {
      return request("/rest/v1/generated_content?select=id,title,kind,status,content,created_at&status=eq.published&order=created_at.desc", { headers: { Accept: "application/json" } });
    },
    async listDrafts() {
      return request("/rest/v1/generated_content?select=id,title,kind,status,content,created_at&status=eq.draft&order=created_at.desc", { headers: { Accept: "application/json" } });
    },
  };
}

export { MAX_PDF_BYTES };
