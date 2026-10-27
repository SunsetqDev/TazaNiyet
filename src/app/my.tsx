import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { C, R, S } from "../lib/theme";

type Row = {
  id: number;
  status: string;
  created_at: string;
  reject_reason: string | null;
  tasks: { emoji: string; title: string; points: number } | null;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "⏳ На проверке", color: C.warn, bg: C.warnSoft },
  approved: { label: "✓ Принято", color: C.sageDark, bg: C.sageSoft },
  rejected: { label: "✕ Отклонено", color: C.danger, bg: C.dangerSoft },
};

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
    if (error) setError("Ошибка: " + error.message);
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
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sageDark} />}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>← Назад</Text>
      </Pressable>

      <Text style={s.title}>Мои задания</Text>

      <View style={s.summary}>
        <View style={s.sumBox}>
          <Text style={s.sumNum}>{points}</Text>
          <Text style={s.sumLabel}>очков TZ</Text>
        </View>
        <View style={s.sumBox}>
          <Text style={s.sumNum}>{approved}</Text>
          <Text style={s.sumLabel}>выполнено</Text>
        </View>
        <View style={s.sumBox}>
          <Text style={s.sumNum}>{pending}</Text>
          <Text style={s.sumLabel}>на проверке</Text>
        </View>
      </View>

      {loading && <ActivityIndicator color={C.sageDark} style={{ marginTop: S.md }} />}
      {error && <Text style={s.error}>{error}</Text>}
      {!loading && !error && rows.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={{ fontSize: 44 }}>🌱</Text>
          <Text style={s.empty}>Пока нет заявок. Выполните первое задание!</Text>
        </View>
      )}

      {rows.map((r) => {
        const st = STATUS[r.status] ?? STATUS.pending;
        return (
          <View key={r.id} style={s.item}>
            <View style={s.itemTop}>
              <Text style={s.emoji}>{r.tasks?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle}>{r.tasks?.title ?? "Задание"}</Text>
                <Text style={s.date}>{new Date(r.created_at).toLocaleDateString("ru-RU")}</Text>
                <View style={[s.badge, { backgroundColor: st.bg }]}>
                  <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={[s.pts, r.status !== "approved" && { opacity: 0.35 }]}>+{r.tasks?.points ?? 0}</Text>
            </View>

            {r.status === "rejected" && r.reject_reason ? (
              <View style={s.reason}>
                <Text style={s.reasonTitle}>Почему отклонено</Text>
                <Text style={s.reasonText}>{r.reject_reason}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 60, paddingBottom: S.xl + 10 },
  back: { color: C.sageDark, fontSize: 16, fontWeight: "600", marginBottom: S.md },
  title: { fontSize: 30, fontWeight: "700", color: C.text, marginBottom: S.md },
  summary: { flexDirection: "row", gap: S.sm, marginBottom: S.lg },
  sumBox: { flex: 1, backgroundColor: C.sage, borderRadius: R.card, padding: S.md - 4, alignItems: "center" },
  sumNum: { color: C.text, fontSize: 24, fontWeight: "800" },
  sumLabel: { color: C.text, opacity: 0.65, fontSize: 12, marginTop: 2 },
  error: { color: C.danger, marginTop: S.sm },
  emptyBox: { alignItems: "center", backgroundColor: C.card, borderRadius: R.card, padding: S.lg },
  empty: { color: C.muted, marginTop: S.sm, textAlign: "center" },
  item: { backgroundColor: C.card, borderRadius: R.card, padding: S.md - 4, marginBottom: S.sm },
  itemTop: { flexDirection: "row", alignItems: "center", gap: S.sm + 4 },
  emoji: { fontSize: 30 },
  itemTitle: { fontSize: 16, fontWeight: "700", color: C.text },
  date: { fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { alignSelf: "flex-start", borderRadius: R.chip, paddingHorizontal: 12, paddingVertical: 5, marginTop: S.sm },
  badgeText: { fontSize: 12, fontWeight: "700" },
  pts: { color: C.sageDark, fontWeight: "800", fontSize: 17 },
  reason: { backgroundColor: C.dangerSoft, borderRadius: 16, padding: S.sm + 4, marginTop: S.sm + 2 },
  reasonTitle: { color: C.danger, fontWeight: "700", fontSize: 13, marginBottom: 4 },
  reasonText: { color: C.text, lineHeight: 20 },
});