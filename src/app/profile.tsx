import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

type Board = { display_name: string; place: string | null; total: number; is_me: boolean };

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

export default function ProfileScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [approved, setApproved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [board, setBoard] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data: p } = await supabase.from("profiles").select("name, points").eq("id", user.id).single();
    setName(p?.name ?? "");
    setPoints(p?.points ?? 0);

    const { data: subs } = await supabase
      .from("submissions")
      .select("created_at")
      .eq("status", "approved");
    const list = (subs ?? []).map((x: any) => x.created_at as string);
    setApproved(list.length);
    setStreak(calcStreak(list));

    const { data: lb } = await supabase.rpc("get_leaderboard");
    setBoard((lb as Board[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const badges = [
    { icon: "🌱", title: "Первый шаг", desc: "1 задание", got: approved >= 1 },
    { icon: "🌿", title: "Пять заданий", desc: "5 заданий", got: approved >= 5 },
    { icon: "🌳", title: "Десять заданий", desc: "10 заданий", got: approved >= 10 },
    { icon: "🔥", title: "3 дня подряд", desc: "серия 3 дня", got: streak >= 3 },
    { icon: "🏆", title: "Неделя подряд", desc: "серия 7 дней", got: streak >= 7 },
    { icon: "⭐", title: "100 TZ", desc: "100 очков", got: points >= 100 },
    { icon: "💎", title: "500 TZ", desc: "500 очков", got: points >= 500 },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>

      <Text style={styles.title}>{name || "Мой профиль"}</Text>

      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{points}</Text>
          <Text style={styles.statLabel}>очков TZ</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{approved}</Text>
          <Text style={styles.statLabel}>выполнено</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>дней подряд</Text>
        </View>
      </View>

      <Text style={styles.section}>Значки</Text>
      <View style={styles.badges}>
        {badges.map((b) => (
          <View key={b.title} style={[styles.badge, !b.got && styles.badgeOff]}>
            <Text style={styles.badgeIcon}>{b.got ? b.icon : "🔒"}</Text>
            <Text style={styles.badgeTitle}>{b.title}</Text>
            <Text style={styles.badgeDesc}>{b.desc}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Рейтинг</Text>
      {loading && <ActivityIndicator color={GREEN} />}
      {!loading && board.length === 0 && <Text style={styles.empty}>Пока никого. Станьте первым!</Text>}
      {board.map((r, i) => (
        <View key={i} style={[styles.row, r.is_me && styles.rowMe]}>
          <Text style={styles.pos}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowName}>{r.display_name}{r.is_me ? " (вы)" : ""}</Text>
            {r.place ? <Text style={styles.rowPlace}>{r.place}</Text> : null}
          </View>
          <Text style={styles.rowPts}>{r.total} TZ</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23", marginBottom: 16 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: GREEN, borderRadius: 16, padding: 14, alignItems: "center" },
  statNum: { color: "white", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "#D8F0E2", fontSize: 12, marginTop: 2 },
  section: { fontSize: 20, fontWeight: "700", color: "#1C2B23", marginBottom: 12 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  badge: { width: "31%", backgroundColor: "white", borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 2, borderColor: GREEN },
  badgeOff: { opacity: 0.4, borderColor: "#DDE5DF" },
  badgeIcon: { fontSize: 30 },
  badgeTitle: { fontSize: 12, fontWeight: "700", color: "#1C2B23", marginTop: 4, textAlign: "center" },
  badgeDesc: { fontSize: 10, color: "#7C8A82", textAlign: "center" },
  empty: { color: "#7C8A82" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 14, padding: 14, marginBottom: 8, gap: 12 },
  rowMe: { borderWidth: 2, borderColor: GREEN, backgroundColor: "#EAF6EF" },
  pos: { fontSize: 18, fontWeight: "800", color: GREEN, width: 28 },
  rowName: { fontSize: 16, fontWeight: "600", color: "#1C2B23" },
  rowPlace: { fontSize: 12, color: "#7C8A82" },
  rowPts: { fontWeight: "800", color: GREEN },
});