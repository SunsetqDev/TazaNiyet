import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../components/avatar";
import { PetCard } from "../../components/pet-card";
import { supabase } from "../../lib/supabase";
import { C, R, S } from "../../lib/theme";

type Task = {
  id: number;
  emoji: string;
  title: string;
  description: string;
  place_type: string;
  points: number;
  category: string;
};

const TYPES_FOR: Record<string, string[]> = {
  city: ["any", "city"],
  town: ["any", "city", "village"],
  village: ["any", "village"],
};

const CATS = [
  { k: "all", label: "Все", color: C.sageSoft },
  { k: "clean", label: "🧹 Чистота", color: "#E3EEDC" },
  { k: "trees", label: "🌳 Деревья", color: "#DDEBD3" },
  { k: "recycle", label: "♻️ Переработка", color: "#E4EBF2" },
  { k: "water", label: "💧 Вода", color: "#DCEBF0" },
  { k: "edu", label: "📚 Просвещение", color: "#F1E8D2" },
  { k: "animals", label: "🐦 Животные", color: "#F3E4D9" },
];

const TIPS = [
  "Одна пластиковая бутылка разлагается более 400 лет. Многоразовая бутылка экономит сотни одноразовых.",
  "Закрытый кран при чистке зубов экономит несколько литров воды за раз.",
  "Одно взрослое дерево за год поглощает заметное количество углекислого газа и даёт тень в жару.",
  "Бумагу можно переработать несколько раз. Сдавайте макулатуру, а не выбрасывайте.",
  "Батарейки нельзя выбрасывать в обычный мусор: в них тяжёлые металлы. Сдавайте их в пункты приёма.",
  "Сжигание пластика выделяет вредные вещества. Лучше сдать его на переработку.",
  "Кормушка для птиц зимой помогает им пережить холода, но корм нужно подсыпать регулярно.",
];

function calcStreak(dates: string[]) {
  const days = new Set(dates.map((d) => new Date(d).toDateString()));
  let streak = 0;
  const cur = new Date();
  if (!days.has(cur.toDateString())) cur.setDate(cur.getDate() - 1);
  while (days.has(cur.toDateString())) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export default function TasksScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [look, setLook] = useState<{ nickname: string | null; emoji: string | null; color: string | null }>({
    nickname: null,
    emoji: null,
    color: null,
  });
  const [points, setPoints] = useState(0);
  const [region, setRegion] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needConsent, setNeedConsent] = useState(false);
  const [cat, setCat] = useState("all");
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(0);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [stats, setStats] = useState<{ done: number; people: number } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("name, nickname, avatar_emoji, avatar_color, points, region, place_name, place_type, birth_year, parent_verified")
        .eq("id", user.id)
        .single();
      if (!data || !data.birth_year) {
        router.replace("/safety");
        return;
      }
      if (!data.region || !data.place_type) {
        router.replace("/place");
        return;
      }
      setName(data.name ?? "");
      setLook({
        nickname: data.nickname ?? null,
        emoji: data.avatar_emoji ?? null,
        color: data.avatar_color ?? null,
      });
      setPoints(data.points ?? 0);
      setRegion(data.region);
      setPlaceName(data.place_name ?? "");
      setPlaceType(data.place_type);
      const age = new Date().getFullYear() - data.birth_year;
      setNeedConsent(age <= 14 && !data.parent_verified);

      // approved и pending считаем активностью: баобаб оживает сразу после отправки задания
      const { data: subs } = await supabase
        .from("submissions")
        .select("created_at, status")
        .eq("user_id", user.id)
        .in("status", ["approved", "pending"]);
      const all = (subs ?? []) as { created_at: string; status: string }[];
      setDone(all.filter((x) => x.status === "approved").length);
      setStreak(calcStreak(all.map((x) => x.created_at)));
      if (all.length > 0) {
        const last = new Date(Math.max(...all.map((x) => new Date(x.created_at).getTime())));
        last.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDaysSince(Math.round((today.getTime() - last.getTime()) / 86400000));
      } else {
        setDaysSince(null);
      }

      const { data: st } = await supabase.rpc("get_community_stats");
      if (st) setStats(st as { done: number; people: number });
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!placeType) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .in("place_type", TYPES_FOR[placeType] ?? ["any"])
        .order("points", { ascending: true });
      if (error) {
        setError("Ошибка: " + error.message);
        setTasks([]);
      } else {
        setTasks(data as Task[]);
      }
      setLoading(false);
    };
    load();
  }, [placeType]);

  const open = (t: Task) =>
    router.push({
      pathname: "/task",
      params: { id: String(t.id), title: t.title, points: String(t.points), emoji: t.emoji, description: t.description },
    });

  const dayIndex = Math.floor(Date.now() / 86400000);
  const taskOfDay = tasks.length > 0 ? tasks[dayIndex % tasks.length] : null;
  const tip = TIPS[dayIndex % TIPS.length];
  const shown = tasks.filter((t) => cat === "all" || t.category === cat);
  const catColor = (k: string) => CATS.find((c) => c.k === k)?.color ?? C.sageSoft;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={s.hello}>Привет, {look.nickname || name || "друг"}!</Text>
          <Pressable onPress={() => router.push("/place")}>
            <Text style={s.place}>📍 {placeName || region}  ·  изменить</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push("/edit-profile")}>
          <Avatar name={look.nickname || name} emoji={look.emoji} color={look.color} size={52} />
        </Pressable>
      </View>

      {needConsent && (
        <View style={s.warn}>
          <Text style={s.warnTitle}>Ждём согласие родителей</Text>
          <Text style={s.warnText}>Пока проверяющий не подтвердит согласие, отправлять задания нельзя.</Text>
        </View>
      )}

      <PetCard points={points} streak={streak} daysSince={daysSince} />

      <View style={s.miniRow}>
        <View style={s.mini}>
          <Text style={s.miniNum}>🔥 {streak}</Text>
          <Text style={s.miniLabel}>дней подряд</Text>
        </View>
        <View style={s.mini}>
          <Text style={s.miniNum}>✅ {done}</Text>
          <Text style={s.miniLabel}>выполнено</Text>
        </View>
      </View>

      {taskOfDay && (
        <Pressable style={s.hero} onPress={() => open(taskOfDay)}>
          <Text style={s.heroLabel}>ЗАДАНИЕ ДНЯ</Text>
          <Text style={s.heroEmoji}>{taskOfDay.emoji}</Text>
          <Text style={s.heroTitle}>{taskOfDay.title}</Text>
          <View style={s.heroBottom}>
            <Text style={s.heroPts}>+{taskOfDay.points} TZ</Text>
            <View style={s.heroBtn}>
              <Text style={s.heroBtnText}>Начать</Text>
            </View>
          </View>
        </Pressable>
      )}

      {stats && (
        <View style={s.impact}>
          <Text style={s.impactTitle}>🌍 Вместе мы</Text>
          <View style={s.impactRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.impactNum}>{stats.done}</Text>
              <Text style={s.impactLabel}>заданий выполнено</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.impactNum}>{stats.people}</Text>
              <Text style={s.impactLabel}>участников</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={s.section}>Все задания</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: S.md }}>
        {CATS.map((c) => (
          <Pressable key={c.k} onPress={() => setCat(c.k)} style={[s.chip, cat === c.k && s.chipOn]}>
            <Text style={[s.chipText, cat === c.k && s.chipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator color={C.sageDark} style={{ marginTop: S.md }} />}
      {error && <Text style={{ color: C.danger }}>{error}</Text>}
      {!loading && shown.length === 0 && <Text style={{ color: C.muted }}>В этой категории пока нет заданий.</Text>}

      <View style={s.grid}>
        {shown.map((t) => (
          <Pressable key={t.id} style={[s.tile, { backgroundColor: catColor(t.category) }]} onPress={() => open(t)}>
            <Text style={s.tileEmoji}>{t.emoji}</Text>
            <Text style={s.tileTitle} numberOfLines={3}>
              {t.title}
            </Text>
            <View style={s.tilePts}>
              <Text style={s.tilePtsText}>+{t.points} TZ</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={s.tip}>
        <Text style={s.tipTitle}>💡 Эко-факт дня</Text>
        <Text style={s.tipText}>{tip}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 70, paddingBottom: S.xl + 30 },
  top: { flexDirection: "row", alignItems: "center", marginBottom: S.lg },
  hello: { fontSize: 28, fontWeight: "700", color: C.text },
  place: { color: C.muted, marginTop: 6 },
  warn: { backgroundColor: C.warnSoft, borderRadius: R.card, padding: S.md, marginBottom: S.md },
  warnTitle: { color: C.warn, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  warnText: { color: C.warn, lineHeight: 21 },
  miniRow: { flexDirection: "row", gap: S.sm + 2, marginBottom: S.lg },
  mini: { flex: 1, backgroundColor: C.card, borderRadius: R.card, padding: S.md - 4, alignItems: "center" },
  miniNum: { fontSize: 20, fontWeight: "800", color: C.text },
  miniLabel: { fontSize: 12, color: C.muted, marginTop: 4 },
  hero: { backgroundColor: C.sage, borderRadius: 30, padding: S.lg, marginBottom: S.lg },
  heroLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, color: C.text, opacity: 0.6 },
  heroEmoji: { fontSize: 56, marginTop: S.sm },
  heroTitle: { fontSize: 24, fontWeight: "700", color: C.text, marginTop: S.sm },
  heroBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: S.md },
  heroPts: { fontSize: 22, fontWeight: "800", color: C.text },
  heroBtn: { backgroundColor: "#FFFFFF", borderRadius: R.chip, paddingHorizontal: 22, paddingVertical: 12 },
  heroBtnText: { color: C.sageDark, fontWeight: "800" },
  impact: { backgroundColor: C.sand, borderRadius: R.card, padding: S.md + 4, marginBottom: S.xl },
  impactTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: S.sm },
  impactRow: { flexDirection: "row" },
  impactNum: { fontSize: 32, fontWeight: "800", color: C.text },
  impactLabel: { fontSize: 12, color: C.text, opacity: 0.7, marginTop: 2 },
  section: { fontSize: 22, fontWeight: "700", color: C.text, marginBottom: S.md },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: R.chip, backgroundColor: C.card, marginRight: S.sm },
  chipOn: { backgroundColor: C.sage },
  chipText: { color: C.muted, fontWeight: "600" },
  chipTextOn: { color: C.text },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { width: "48%", borderRadius: 26, padding: S.md, marginBottom: S.sm + 6, minHeight: 190, justifyContent: "space-between" },
  tileEmoji: { fontSize: 36 },
  tileTitle: { fontSize: 15, fontWeight: "700", color: C.text, lineHeight: 20, marginTop: S.sm },
  tilePts: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.75)", borderRadius: R.chip, paddingHorizontal: 12, paddingVertical: 6, marginTop: S.sm },
  tilePtsText: { fontWeight: "800", color: C.sageDark, fontSize: 13 },
  tip: { backgroundColor: C.sageSoft, borderRadius: R.card, padding: S.md + 4, marginTop: S.md },
  tipTitle: { fontWeight: "700", color: C.sageDark, marginBottom: 6 },
  tipText: { color: C.text, lineHeight: 22 },
});