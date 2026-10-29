import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { EmptyState, ErrorState } from "../components/ui/empty-state";
import { RowIcon } from "../components/ui/list-row";
import { Screen } from "../components/ui/screen";
import { Skeleton } from "../components/ui/skeleton";
import { StatusPill } from "../components/ui/status-pill";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

type Row = {
  id: number;
  status: string;
  created_at: string;
  reject_reason: string | null;
  tasks: { emoji: string; title: string; points: number } | null;
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
      .select("id, status, created_at, reject_reason, tasks(emoji, title, points)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as unknown as Row[]);
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
      <AppText variant="h1">Мои задания</AppText>

      <View style={s.summary}>
        <Sum value={points} label="очков TZ" />
        <Sum value={approved} label="принято" />
        <Sum value={pending} label="на проверке" />
      </View>

      {loading && (
        <View style={{ gap: space.x3 }}>
          <Skeleton height={76} round={radius.card} />
          <Skeleton height={76} round={radius.card} />
          <Skeleton height={76} round={radius.card} />
        </View>
      )}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="leaf-outline"
          title="Пока нет заявок"
          text="Выполните первое задание — здесь появится его статус."
          action="К заданиям"
          onAction={() => router.replace("/")}
        />
      )}

      {!loading &&
        !error &&
        rows.map((r) => (
          <View key={r.id} style={s.item}>
            <View style={s.itemTop}>
              <RowIcon>
                <Text style={{ fontSize: 20 }}>{r.tasks?.emoji}</Text>
              </RowIcon>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="bodyStrong">{r.tasks?.title ?? "Задание"}</AppText>
                <AppText variant="caption">{new Date(r.created_at).toLocaleDateString("ru-RU")}</AppText>
                <StatusPill status={r.status} />
              </View>
              <AppText style={[s.pts, r.status !== "approved" && { color: color.faint }]}>+{r.tasks?.points ?? 0}</AppText>
            </View>

            {r.status === "rejected" && r.reject_reason ? (
              <View style={s.reason}>
                <Ionicons name="information-circle-outline" size={18} color={color.danger} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" color={color.danger}>
                    Почему отклонено
                  </AppText>
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
