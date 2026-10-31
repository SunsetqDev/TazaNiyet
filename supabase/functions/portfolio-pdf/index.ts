// Функция Supabase: собирает PDF-портфолио текущего пользователя и отдаёт временную ссылку на файл.
// PDF делается на сервере — в приложении не нужны новые нативные библиотеки (обновление без нового APK).
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import QRCode from "npm:qrcode@1.5.4";
import { buildPortfolioPdf, type Fonts } from "./pdf.ts";

const FONT_URLS = {
  regular: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/400Regular/Inter_400Regular.ttf",
  semibold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/600SemiBold/Inter_600SemiBold.ttf",
  bold: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/700Bold/Inter_700Bold.ttf",
  display: "https://cdn.jsdelivr.net/npm/@expo-google-fonts/literata@0.4.3/600SemiBold/Literata_600SemiBold.ttf",
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// шрифты скачиваются один раз на запуск функции
let fontsCache: Promise<Fonts> | null = null;
const loadFonts = () =>
  (fontsCache ??= (async () => {
    const entries = await Promise.all(
      Object.entries(FONT_URLS).map(async ([k, url]) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`font ${k}: ${r.status}`);
        return [k, new Uint8Array(await r.arrayBuffer())] as const;
      })
    );
    return Object.fromEntries(entries) as Fonts;
  })().catch((e) => {
    fontsCache = null;
    throw e;
  }));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const auth = req.headers.get("Authorization") ?? "";
    const userDb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userDb.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
    const user = u?.user;
    if (!user) return json({ error: "Войдите в аккаунт" }, 401);

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link } = await admin.from("portfolio_links").select("code").eq("user_id", user.id).maybeSingle();
    if (!link?.code) return json({ error: "Сначала создайте код портфолио" }, 400);

    const [{ data: profile }, { data: pf }] = await Promise.all([
      admin.from("profiles").select("name, place_name, region, points").eq("id", user.id).single(),
      admin.rpc("get_portfolio", { p_code: link.code }),
    ]);
    const place = [profile?.place_name, profile?.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
    const tasks = ((pf?.tasks ?? []) as any[]).map((t) => ({
      title: String(t.title ?? ""),
      points: Number(t.points ?? 0),
      date: String(t.date),
      cleanup: t.emoji === "📍",
    }));

    const pdf = await buildPortfolioPdf({ PDFDocument, rgb, fontkit, QRCode }, await loadFonts(), {
      fullName: profile?.name ?? "",
      place,
      points: profile?.points ?? 0,
      tasks,
      code: link.code,
      issued: new Date(),
    });

    const path = `${user.id}/portfolio.pdf`;
    const up = await admin.storage.from("portfolios").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (up.error) throw up.error;
    const { data: signed, error } = await admin.storage
      .from("portfolios")
      .createSignedUrl(path, 600, { download: "TazaNiyet-portfolio.pdf" });
    if (error) throw error;
    return json({ url: signed.signedUrl });
  } catch (e) {
    console.error("portfolio-pdf", e instanceof Error ? e.message : e);
    return json({ error: "Не удалось собрать PDF. Попробуйте позже." }, 500);
  }
});
