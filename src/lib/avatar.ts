import { supabase } from "./supabase";

// Фото-аватары лежат в закрытом бакете avatars (каждый видит только свою папку) — нужна временная ссылка.
// Кэш на сессию приложения, чтобы не запрашивать ссылку при каждом показе экрана.
const cache = new Map<string, { url: string; until: number }>();

export async function avatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const hit = cache.get(path);
  if (hit && hit.until > Date.now()) return hit.url;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, until: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}
