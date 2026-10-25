import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

type Row = {
  id: number;
  status: string;
  created_at: string;
  tasks: { emoji: string; title: string; points: number } | null;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "⏳ На проверке", color: "#8A6D00", bg: "#FFF6D6" },
  approved: { label: "✓ Принято", color: GREEN, bg: "#EAF6EF" },
  rejected: { label: "✕ Отклонено", color: "#B3261E", bg: "#FCE8E6" },
};

export default function MyScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
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
      .select("id, status, created_at, tasks(emoji, title, points)")
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

  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>

      <Text style={styles.title}>Мои задания</Text>

      <View style={styles.summary}>
        <View style={styles.sumBox}>
          <Text style={styles.sumNum}>{points}</Text>
          <Text style={styles.sumLabel}>очков TZ</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={styles.sumNum}>{approved}</Text>
          <Text style={styles.sumLabel}>выполнено</Text>
        </View>
        <View style={styles.sumBox}>
          <Text style={styles.sumNum}>{rows.length}</Text>
          <Text style={styles.sumLabel}>отправлено</Text>
        </View>
      </View>

      {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && rows.length === 0 && (
        <Text style={styles.empty}>Пока нет заявок. Выполните первое задание!</Text>
      )}

      {rows.map((r) => {
        const st = STATUS[r.status] ?? STATUS.pending;
        return (
          <View key={r.id} style={styles.item}>
            <Text style={styles.emoji}>{r.tasks?.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{r.tasks?.title ?? "Задание"}</Text>
              <Text style={styles.date}>{new Date(r.created_at).toLocaleDateString("ru-RU")}</Text>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <Text style={[styles.pts, r.status !== "approved" && { opacity: 0.35 }]}>
              +{r.tasks?.points ?? 0}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23", marginBottom: 16 },
  summary: { flexDirection: "row", gap: 10, marginBottom: 20 },
  sumBox: { flex: 1, backgroundColor: GREEN, borderRadius: 16, padding: 14, alignItems: "center" },
  sumNum: { color: "white", fontSize: 24, fontWeight: "800" },
  sumLabel: { color: "#D8F0E2", fontSize: 12, marginTop: 2 },
  error: { color: "#B3261E", marginTop: 8 },
  empty: { color: "#7C8A82", marginTop: 12 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 10, gap: 12 },
  emoji: { fontSize: 28 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#1C2B23" },
  date: { fontSize: 12, color: "#7C8A82", marginTop: 2 },
  badge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  pts: { color: GREEN, fontWeight: "800", fontSize: 16 },
});