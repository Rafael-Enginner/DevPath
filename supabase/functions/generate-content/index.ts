import { corsHeaders, json, requireAdmin } from "../_shared.ts";

const ALLOWED_KINDS = new Set(["summary", "lesson", "flashcards", "quiz"]);
const schemaInstruction = `Responda apenas JSON válido, sem markdown. Crie conteúdo didático original em português do Brasil, adequado para estudantes de Engenharia de Software. Não invente fatos além das fontes; se as fontes forem insuficientes, sinalize isso. Inclua um array source_refs com páginas e trechos citados.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  let admin;
  let user;
  try { ({ admin, user } = await requireAdmin(request)); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Não autorizado." }, 401); }
  try {
    const { book_id: bookId, kind = "flashcards" } = await request.json();
    if (typeof bookId !== "string" || !ALLOWED_KINDS.has(kind)) return json({ error: "Informe um livro e um tipo válido de conteúdo." }, 400);
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "GEMINI_API_KEY não foi configurada nos segredos do Supabase." }, 503);
    const { data: book, error: bookError } = await admin.from("books").select("id,title,status").eq("id", bookId).maybeSingle();
    if (bookError || !book) return json({ error: "Livro não encontrado." }, 404);
    if (book.status !== "processed") return json({ error: "Extraia o texto do PDF antes de gerar conteúdo." }, 409);
    const { data: chunks, error: chunksError } = await admin.from("book_chunks").select("page_start,page_end,chunk_index,content").eq("book_id", bookId).order("chunk_index").limit(12);
    if (chunksError || !chunks?.length) return json({ error: "Nenhum trecho extraído encontrado." }, 422);
    const source = chunks.map((chunk) => `[Páginas ${chunk.page_start}-${chunk.page_end}] ${chunk.content}`).join("\n\n").slice(0, 60000);
    const prompts: Record<string, string> = {
      summary: 'Produza um resumo didático. JSON: {"title":"...","summary":"...","key_points":["..."],"source_refs":[{"pages":"...","excerpt":"..."}]}.',
      lesson: 'Produza uma aula curta com objetivos, explicação, exemplos e revisão. JSON: {"title":"...","objectives":["..."],"sections":[{"heading":"...","body":"..."}],"review_questions":[{"question":"...","answer":"..."}],"source_refs":[{"pages":"...","excerpt":"..."}]}.',
      flashcards: 'Produza 8 flashcards de pergunta e resposta, úteis para recuperação ativa. JSON: {"title":"...","cards":[{"q":"...","a":"...","source_pages":"..."}],"source_refs":[{"pages":"...","excerpt":"..."}]}.',
      quiz: 'Produza 5 questões de múltipla escolha com quatro opções, resposta correta e explicação. JSON: {"title":"...","questions":[{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"...","source_pages":"..."}],"source_refs":[{"pages":"...","excerpt":"..."}]}.',
    };
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${schemaInstruction}\nTipo solicitado: ${kind}.\n${prompts[kind]}\nLivro: ${book.title}\n\nFONTES:\n${source}` }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || `Erro na API de IA (${response.status}).`);
    const output = payload.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (!output) throw new Error("A IA não retornou conteúdo.");
    let content;
    try { content = JSON.parse(output); } catch { throw new Error("A IA retornou JSON inválido. Tente novamente."); }
    if (!content.title || !Array.isArray(content.source_refs)) throw new Error("O conteúdo retornado não passou na validação mínima.");
    const { data: saved, error: saveError } = await admin.from("generated_content").insert({ book_id: bookId, owner_id: user.id, kind, title: content.title, content, source_refs: content.source_refs, status: "draft" }).select("id,title,kind,status,content,source_refs").single();
    if (saveError) throw new Error(`Falha ao salvar conteúdo: ${saveError.message}`);
    return json({ ok: true, item: saved, note: "Conteúdo salvo como rascunho; revise antes de publicar." });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Falha ao gerar conteúdo." }, 500); }
});
