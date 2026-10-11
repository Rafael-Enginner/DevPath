import { corsHeaders, json, requireAdmin } from "../_shared.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  let admin;
  let user;
  try { ({ admin, user } = await requireAdmin(request)); }
  catch (error) { return json({ error: error instanceof Error ? error.message : "Não autorizado." }, 401); }
  try {
    const { content_id: contentId } = await request.json();
    if (typeof contentId !== "string") return json({ error: "content_id é obrigatório." }, 400);
    const { data, error } = await admin.from("generated_content").update({ status: "published", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", contentId).eq("status", "draft").select("id,title,status").maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Rascunho não encontrado ou já revisado." }, 404);
    return json({ ok: true, item: data });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Falha ao publicar." }, 500); }
});
