import { getDocument } from "npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs";
import { corsHeaders, json, requireAdmin } from "../_shared.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  let admin;
  let user;
  try { ({ admin, user } = await requireAdmin(request)); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Não autorizado." }, 401); }
  let bookId: string | undefined;
  try {
    ({ book_id: bookId } = await request.json());
    if (typeof bookId !== "string") return json({ error: "book_id é obrigatório." }, 400);
    const { data: book, error: bookError } = await admin.from("books").select("*").eq("id", bookId).maybeSingle();
    if (bookError || !book) return json({ error: "Livro não encontrado." }, 404);
    await admin.from("books").update({ status: "processing", error_message: null }).eq("id", bookId);
    const { data: file, error: downloadError } = await admin.storage.from("book-pdfs").download(book.file_path);
    if (downloadError || !file) throw new Error("Não foi possível baixar o PDF privado.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data: bytes, useWorkerFetch: false, isEvalSupported: false, disableFontFace: true, useSystemFonts: true }).promise;
    const chunks: { page_start: number; page_end: number; chunk_index: number; content: string }[] = [];
    let buffer = "";
    let startPage = 1;
    let index = 0;
    const flush = (endPage: number) => {
      const text = buffer.trim();
      if (text) chunks.push({ page_start: startPage, page_end: endPage, chunk_index: index++, content: text });
      buffer = "";
      startPage = endPage + 1;
    };
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
      if (buffer.length && buffer.length + pageText.length > 6000) flush(pageNumber - 1);
      if (pageText) buffer += `\n[Página ${pageNumber}] ${pageText}`;
    }
    flush(pdf.numPages);
    if (!chunks.length) throw new Error("Não foi possível extrair texto. O PDF pode ser digitalizado; esta versão ainda não inclui OCR.");
    await admin.from("book_chunks").delete().eq("book_id", bookId);
    const rows = chunks.map((chunk) => ({ ...chunk, book_id: bookId, owner_id: user.id }));
    for (let offset = 0; offset < rows.length; offset += 50) {
      const { error } = await admin.from("book_chunks").insert(rows.slice(offset, offset + 50));
      if (error) throw new Error(`Falha ao salvar os trechos: ${error.message}`);
    }
    await admin.from("books").update({ status: "processed", page_count: pdf.numPages, error_message: null, updated_at: new Date().toISOString() }).eq("id", bookId);
    return json({ ok: true, book_id: bookId, pages: pdf.numPages, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao processar PDF.";
    try { if (bookId) { const { admin } = await requireAdmin(request); await admin.from("books").update({ status: "failed", error_message: message.slice(0, 500) }).eq("id", bookId); } } catch { /* status best-effort */ }
    return json({ error: message }, 500);
  }
});
