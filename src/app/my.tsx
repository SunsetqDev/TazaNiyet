import { Icon } from "../components/icon";
import { TaskArt } from "../components/task-art";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { EmptyState, ErrorState } from "../components/ui/empty-state";
import { ListRow, RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { Skeleton } from "../components/ui/skeleton";
import { StatusPill } from "../components/ui/status-pill";
import { reportCategory } from "../lib/reports";
import { SPOT_STATUS, timeLeft } from "../lib/spot-tasks";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";
import { tr, locale, lang } from "../lib/i18n";

type Row = {
  id: number;
  status: string;
  created_at: string;
  reject_reason: string | null;
  tasks: { emoji: string; title: string; title_kk?: string | null; points: number; category: string | null } | null;
};

/** Уборка места с карты (RPC get_my_spot_tasks). */
type Spot = {
  id: number;
  title: string;
  category: string;
  points: number;
  status: string;
  claim_expires_at: string | null;
  completed_at: string | null;
  last_reject_reason: string | null;
  address: string | null;
};

function Sum({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.sum}>
      <AppText style={s.sumNum}>{value}</AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export default function MyScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data: p } = await supabase.from("profiles").select("points").eq("id", user.id).single();
    setPoints(p?.points ?? 0);

    const { data, error } = await supabase
      .from("submissions")
      .select("id, status, created_at, reject_reason, tasks(emoji, title, title_kk, points, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else
      setRows(
        (data as unknown as Row[]).map((r) =>
          lang() === "kk" && r.tasks?.title_kk ? { ...r, tasks: { ...r.tasks, title: r.tasks.title_kk } } : r
        )
      );

    const { data: st } = await supabase.rpc("get_my_spot_tasks");
    setSpots((st ?? []) as Spot[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const approved = rows.filter((r) => r.status === "approved").length;
  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <Screen
      bottomInset
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.forest]} tintColor={color.forest} />}
    >
      <BackButton />
      <AppText variant="h1">{tr("Мои задания")}</AppText>

      <View style={s.summary}>
        <Sum value={points} label={tr("очков TZ")} />
        <Sum value={approved} label={tr("принято")} />
        <Sum value={pending} label={tr("на проверке")} />
      </View>

      {loading && (
        <View style={{ gap: space.x3 }}>
          <Skeleton height={76} round={radius.card} />
          <Skeleton height={76} round={radius.card} />
          <Skeleton height={76} round={radius.card} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && spots.length > 0 && (
        <>
          <SectionHeader title={tr("Уборка мест с карты")} />
          <View style={s.group}>
            {spots.map((t, i) => (
              <ListRow
                key={t.id}
                first={i === 0}
                title={t.title}
                subtitle={
                  t.status === "in_progress"
                    ? t.last_reject_reason
                      ? tr("Вернули: {0}", t.last_reject_reason)
                      : tr("Осталось {0}", timeLeft(t.claim_expires_at))
                    : t.status === "completed" && t.completed_at
                    ? tr("Выполнено {0}", new Date(t.completed_at).toLocaleDateString(locale()))
                    : SPOT_STATUS[t.status] ?? t.status
                }
                onPress={() => router.push({ pathname: "/spot/[id]", params: { id: String(t.id) } })}
                leading={
                  <RowIcon>
                    <Icon name={reportCategory(t.category).icon} size={20} color={color.forest} />
                  </RowIcon>
                }
                trailing={<StatusPill status={t.status} />}
              />
            ))}
          </View>
          {rows.length > 0 && <SectionHeader title={tr("Повседневные задания")} />}
        </>
      )}

      {!loading && !error && rows.length === 0 && spots.length === 0 && (
        <EmptyState
          icon="leaf-outline"
          title={tr("Пока нет заявок")}
          text={tr("Выполните первое задание — здесь появится его статус.")}
          action={tr("К заданиям")}
          onAction={() => router.replace("/")}
        />
      )}

      {!loading &&
        !error &&
        rows.map((r) => (
          <View key={r.id} style={s.item}>
            <View style={s.itemTop}>
              <RowIcon>
                <TaskArt category={r.tasks?.category} emoji={r.tasks?.emoji} size={28} />
              </RowIcon>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyStrong">{r.tasks?.title ?? tr("Задание")}</AppText>
                <AppText variant="caption">{new Date(r.created_at).toLocaleDateString(locale())}</AppText>
                <StatusPill status={r.status} />
              </View>
              <AppText style={[s.pts, r.status !== "approved" && { color: color.faint }]}>+{r.tasks?.points ?? 0}</AppText>
            </View>

            {r.status === "rejected" && r.reject_reason ? (
              <View style={s.reason}>
                <Icon name="information-circle-outline" size={18} color={color.danger} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" color={color.danger}>{tr("Почему отклонено")}</AppText>
                  <AppText variant="body" color={color.ink}>
                    {r.reject_reason}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { flexDirection: "row", gap: space.x2, marginTop: space.x5, marginBottom: space.x6 },
  group: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderRadius: radius.card, paddingHorizontal: space.x4, marginBottom: space.x2 },
  sum: { flex: 1, backgroundColor: color.sand, borderRadius: 18, padding: space.x3 },
  sumNum: { fontFamily: font.display, fontSize: 26, lineHeight: 32, color: color.ink },
  item: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x4,
    marginBottom: space.x3,
  },
  itemTop: { flexDirection: "row", alignItems: "flex-start", gap: space.x3 },
  pts: { fontFamily: font.bold, fontSize: 15, color: color.forest },
  reason: {
    flexDirection: "row",
    gap: space.x2,
    backgroundColor: color.dangerSoft,
    borderRadius: 16,
    padding: space.x3,
    marginTop: space.x3,
  },
});
