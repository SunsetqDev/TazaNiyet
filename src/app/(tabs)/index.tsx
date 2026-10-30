import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { CountUp, PressScale } from "../../components/anim";
import { Avatar } from "../../components/avatar";
import { Celebration } from "../../components/celebration";
import { PetCard } from "../../components/pet-card";
import { AppText } from "../../components/ui/app-text";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Chip } from "../../components/ui/chip";
import { EmptyState, ErrorState } from "../../components/ui/empty-state";
import { ListRow, RowIcon } from "../../components/ui/list-row";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton, SkeletonCard } from "../../components/ui/skeleton";
import { getRank, getRankIndex } from "../../lib/ranks";
import { supabase } from "../../lib/supabase";
import { categoryTint, color, font, radius, space } from "../../lib/theme";

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
  { k: "all", label: "Все" },
  { k: "clean", label: "Чистота" },
  { k: "trees", label: "Деревья" },
  { k: "recycle", label: "Переработка" },
  { k: "water", label: "Вода" },
  { k: "edu", label: "Просвещение" },
  { k: "animals", label: "Животные" },
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

// появление блоков — только при первом показе экрана, не больше 5 шагов
const enter = (i: number) => FadeInDown.delay(Math.min(i, 4) * 60).duration(320);

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

const catLabel = (k: string) => CATS.find((c) => c.k === k)?.label ?? "";

export default function TasksScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
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
  const [reloadKey, setReloadKey] = useState(0);
  const [needConsent, setNeedConsent] = useState(false);
  const [cat, setCat] = useState("all");
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(0);
  const [pending, setPending] = useState(0);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState<{ gained: number; rank: { name: string; icon: string } | null } | null>(null);
  const [stats, setStats] = useState<{ done: number; people: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
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
        const nowPts: number = data.points ?? 0;
        setPoints(nowPts);

        // праздник, если с прошлого раза очков стало больше (задание одобрили)
        const key = `tz:lastPoints:${user.id}`;
        const prevRaw = await AsyncStorage.getItem(key);
        if (prevRaw !== null) {
          const prev = parseInt(prevRaw, 10);
          if (!Number.isNaN(prev) && nowPts > prev) {
            const rankUp = getRankIndex(nowPts) > getRankIndex(prev);
            const r = getRank(nowPts);
            setCelebrate({ gained: nowPts - prev, rank: rankUp ? { name: r.name, icon: r.icon } : null });
          }
        }
        await AsyncStorage.setItem(key, String(nowPts));

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
        setPending(all.filter((x) => x.status === "pending").length);
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
        setReady(true);

        const { data: st } = await supabase.rpc("get_community_stats");
        if (st) setStats(st as { done: number; people: number });
      };
      loadProfile();
    }, [])
  );

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
        setError(error.message);
        setTasks([]);
      } else {
        setTasks(data as Task[]);
      }
      setLoading(false);
    };
    load();
  }, [placeType, reloadKey]);

  const open = (t: Task) =>
    router.push({
      pathname: "/task",
      params: { id: String(t.id), title: t.title, points: String(t.points), emoji: t.emoji, description: t.description },
    });

  const dayIndex = Math.floor(Date.now() / 86400000);
  const taskOfDay = tasks.length > 0 ? tasks[dayIndex % tasks.length] : null;
  const tip = TIPS[dayIndex % TIPS.length];
  const shown = tasks.filter((t) => cat === "all" || t.category === cat);
  const tint = (k: string) => categoryTint[k] ?? color.limeSoft;

  return (
    <>
      <Screen>
        <Animated.View entering={enter(0)} style={s.top}>
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => router.push("/place")} hitSlop={8} style={s.placeRow}>
              <Ionicons name="location-outline" size={14} color={color.muted} />
              {ready ? (
                <AppText variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {placeName || region} · <Text style={s.change}>изменить</Text>
                </AppText>
              ) : (
                <Skeleton width={140} height={12} />
              )}
            </Pressable>
            <AppText
              variant="h1"
              numberOfLines={2}
              style={{ marginTop: space.x1 }}
              onLongPress={__DEV__ ? () => setCelebrate({ gained: 50, rank: { name: "Побег", icon: "🌿" } }) : undefined}
            >
              Привет, {look.nickname || name || "друг"}
            </AppText>
          </View>
          <PressScale onPress={() => router.push("/edit-profile")}>
            <Avatar name={look.nickname || name} emoji={look.emoji} color={look.color} size={48} />
          </PressScale>
        </Animated.View>

        {needConsent && (
          <Animated.View entering={enter(1)} style={s.warn}>
            <Ionicons name="shield-checkmark-outline" size={22} color={color.warn} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong" color={color.warn}>
                Ждём согласие родителей
              </AppText>
              <AppText variant="body" color={color.warn}>
                Пока проверяющий не подтвердит согласие, отправлять задания нельзя.
              </AppText>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={enter(1)}>
          {ready ? (
            <PetCard points={points} streak={streak} daysSince={daysSince} approved={done} pending={pending} />
          ) : (
            <SkeletonCard height={420} style={{ borderRadius: radius.hero }} />
          )}
        </Animated.View>

        <Animated.View entering={enter(2)}>
          <PressScale onPress={() => router.push("/report")} scaleTo={0.98} style={s.report}>
            <View style={s.reportIcon}>
              <Ionicons name="camera-outline" size={24} color={color.forest} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">Сообщить о загрязнении</AppText>
              <AppText variant="caption">Фото и место — после проверки станет заданием на карте</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={color.faint} />
          </PressScale>
        </Animated.View>

        {(taskOfDay || (loading && ready)) && (
          <Animated.View entering={enter(2)}>
            <SectionHeader title="Задание дня" hint="обновится завтра" />
            {taskOfDay ? (
              <Card onPress={() => open(taskOfDay)}>
                <View style={s.dayTop}>
                  <View style={[s.dayIcon, { backgroundColor: tint(taskOfDay.category) }]}>
                    <Text style={{ fontSize: 28 }}>{taskOfDay.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {catLabel(taskOfDay.category) ? <AppText variant="overline">{catLabel(taskOfDay.category)}</AppText> : null}
                    <AppText variant="h3" style={{ marginTop: 2 }}>
                      {taskOfDay.title}
                    </AppText>
                  </View>
                </View>
                <View style={s.dayBottom}>
                  <View style={s.dayHint}>
                    <Ionicons name="camera-outline" size={16} color={color.muted} />
                    <AppText variant="caption">фото до и после</AppText>
                  </View>
                  <Button label={`+${taskOfDay.points} TZ · Начать`} onPress={() => open(taskOfDay)} style={s.dayBtn} />
                </View>
              </Card>
            ) : (
              <SkeletonCard height={150} />
            )}
          </Animated.View>
        )}

        <Animated.View entering={enter(3)}>
          <SectionHeader title="Все задания" hint={!loading && !error ? `${shown.length}` : undefined} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chips}
            contentContainerStyle={{ paddingHorizontal: space.gutter }}
          >
            {CATS.map((c) => (
              <Chip key={c.k} label={c.label} active={cat === c.k} onPress={() => setCat(c.k)} />
            ))}
          </ScrollView>

          {loading && (
            <View style={{ gap: space.x3, marginTop: space.x3 }}>
              <Skeleton height={48} round={12} />
              <Skeleton height={48} round={12} />
              <Skeleton height={48} round={12} />
            </View>
          )}
          {!loading && error && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
          {!loading && !error && tasks.length === 0 && (
            <EmptyState
              icon="leaf-outline"
              title="Задания скоро появятся"
              text="Для вашего места пока нет заданий. Загляните позже или выберите другое место."
              action="Изменить место"
              onAction={() => router.push("/place")}
            />
          )}
          {!loading && !error && tasks.length > 0 && shown.length === 0 && (
            <EmptyState icon="search-outline" title="В этой категории пусто" text="Выберите другую категорию." />
          )}

          {!loading && !error && shown.length > 0 && (
            <Animated.View key={cat} entering={FadeIn.duration(200)} style={{ marginTop: space.x2 }}>
              {shown.map((t, i) => (
                <ListRow
                  key={t.id}
                  first={i === 0}
                  title={t.title}
                  subtitle={catLabel(t.category)}
                  onPress={() => open(t)}
                  leading={
                    <RowIcon tint={tint(t.category)}>
                      <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
                    </RowIcon>
                  }
                  trailing={<AppText style={s.rowPts}>+{t.points}</AppText>}
                />
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {stats && (
          <Card variant="sand" style={s.impact}>
            <AppText variant="overline" color={color.ink}>
              Вместе мы
            </AppText>
            <View style={s.impactRow}>
              <View style={{ flex: 1 }}>
                <CountUp value={stats.done} style={s.impactNum} />
                <AppText variant="caption" color={color.ink}>
                  заданий выполнено
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <CountUp value={stats.people} style={s.impactNum} />
                <AppText variant="caption" color={color.ink}>
                  участников
                </AppText>
              </View>
            </View>
          </Card>
        )}

        <View style={s.tip}>
          <View style={s.tipHead}>
            <Ionicons name="bulb-outline" size={16} color={color.forest} />
            <AppText variant="overline" color={color.forest}>
              Эко-факт дня
            </AppText>
          </View>
          <AppText variant="body">{tip}</AppText>
        </View>
      </Screen>

      <Celebration
        visible={celebrate !== null}
        gained={celebrate?.gained ?? 0}
        rank={celebrate?.rank ?? null}
        onClose={() => setCelebrate(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: space.x3, marginBottom: space.x5 },
  placeRow: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  change: { textDecorationLine: "underline" },
  warn: {
    flexDirection: "row",
    gap: space.x3,
    backgroundColor: color.warnSoft,
    borderRadius: radius.card,
    padding: space.x4,
    marginBottom: space.x4,
  },
  report: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.x3,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x4,
    marginTop: space.x4,
  },
  reportIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: color.lime, alignItems: "center", justifyContent: "center" },
  dayTop: { flexDirection: "row", gap: space.x3, alignItems: "flex-start" },
  dayIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.x2, marginTop: space.x4 },
  dayHint: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  dayBtn: { minHeight: 44, paddingHorizontal: space.x4 },
  chips: { marginHorizontal: -space.gutter, flexGrow: 0 },
  rowPts: { fontFamily: font.bold, fontSize: 14, color: color.forest },
  impact: { marginTop: space.x6 },
  impactRow: { flexDirection: "row", marginTop: space.x3 },
  impactNum: { fontFamily: font.display, fontSize: 30, lineHeight: 36, color: color.ink },
  tip: { backgroundColor: color.limeSoft, borderRadius: radius.card, padding: space.x4, marginTop: space.x3 },
  tipHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.x2 },
});
