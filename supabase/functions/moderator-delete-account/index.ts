// Функция Supabase: модератор удаляет аккаунт нарушителя (3+ «Обмана» за 90 дней) или неактивного (6 месяцев).
// Правила проверяет база (check_account_deletion) от имени модератора; удаление — с ключом service role:
// файлы пользователя во всех бакетах, затем сам аккаунт (профиль, заявки и т. д. удаляются каскадом).
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKETS = ["submissions", "reports", "avatars", "portfolios"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { user_id, reason } = await req.json().catch(() => ({}));
    if (typeof user_id !== "string" || !user_id) return json({ error: "Не указан аккаунт" }, 400);

    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const asModerator = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: kind, error: checkError } = await asModerator.rpc("check_account_deletion", { p_user_id: user_id });
    if (checkError) return json({ error: "Нет доступа" }, 403);
    if (kind !== "fraud" && kind !== "inactive") return json({ error: String(kind) }, 403);
    const { data: me } = await asModerator.auth.getUser(auth.replace(/^Bearer\s+/i, ""));

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: profile }, { count: penalties }, { data: activeTasks }] = await Promise.all([
      admin.from("profiles").select("last_active_at").eq("id", user_id).single(),
      admin.from("penalties").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      // фото заявок, по которым есть живые задания на карте, оставляем — их видят другие участники
      admin.from("spot_tasks").select("photo_paths").eq("author_id", user_id).in("status", ["available", "in_progress", "under_review"]),
    ]);
    const keep = new Set((activeTasks ?? []).flatMap((t: { photo_paths: string[] | null }) => t.photo_paths ?? []));

    for (const bucket of BUCKETS) {
      for (;;) {
        const { data: files, error } = await admin.storage.from(bucket).list(user_id, { limit: 1000 });
        if (error) throw error;
        const paths = (files ?? []).map((f) => `${user_id}/${f.name}`).filter((p) => !(bucket === "reports" && keep.has(p)));
        if (paths.length === 0) break;
        const { error: rmError } = await admin.storage.from(bucket).remove(paths);
        if (rmError) throw rmError;
        if ((files ?? []).length < 1000 || paths.length < (files ?? []).length) break;
      }
    }

    const { error: delError } = await admin.auth.admin.deleteUser(user_id);
    if (delError) throw delError;
    await admin.from("account_deletions").insert({
      moderator_id: me?.user?.id ?? null,
      kind,
      reason: typeof reason === "string" ? reason.slice(0, 200) : null,
      penalties: penalties ?? 0,
      last_active_at: profile?.last_active_at ?? null,
    });
    return json({ ok: true, kind });
  } catch (e) {
    console.error("moderator-delete-account", e instanceof Error ? e.message : e);
    return json({ error: "Не удалось удалить аккаунт. Попробуйте позже." }, 500);
  }
});
