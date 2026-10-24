import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

type Task = { id: number; emoji: string; title: string; description: string; place_type: string; points: number };

const RANKS = [
  { min: 0, name: "🌱 Росток", next: 100 },
  { min: 100, name: "🌿 Побег", next: 500 },
  { min: 500, name: "🌳 Дерево", next: 1500 },
  { min: 1500, name: "🏔 Страж природы", next: 5000 },
  { min: 5000, name: "🦅 Хранитель степи", next: null },
];

function getRank(points: number) {
  let rank = RANKS[0];
  for (const r of RANKS) if (points >= r.min) rank = r;
  return rank;
}

// Какие задания показывать для каждого типа места
const TYPES_FOR: Record<string, string[]> = {
  city: ["any", "city"],
  town: ["any", "city", "village"],
  village: ["any", "village"],
};

export default function HomeScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [points, setPoints] = useState(0);
  const [region, setRegion] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        .select("name, points, region, place_name, place_type")
        .eq("id", user.id)
        .single();
      if (!data || !data.region || !data.place_type) {
        router.replace("/place");
        return;
      }
      setName(data.name ?? "");
      setPoints(data.points ?? 0);
      setRegion(data.region);
      setPlaceName(data.place_name ?? "");
      setPlaceType(data.place_type);
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

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const rank = getRank(points);
  const progress = rank.next ? Math.min(100, ((points - rank.min) / (rank.next - rank.min)) * 100) : 100;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>TazaNiyet</Text>
          <Text style={styles.subtitle}>Привет, {name || "друг"}!</Text>
        </View>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Выйти</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.rank}>{rank.name}</Text>
        <Text style={styles.points}>{points} TZ</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.cardSmall}>
          {rank.next ? `До следующего ранга: ${rank.next - points} TZ` : "Максимальный ранг!"}
        </Text>
      </View>

      <Pressable style={styles.place} onPress={() => router.push("/place")}>
        <View style={{ flex: 1 }}>
          <Text style={styles.placeTitle}>📍 {placeName || region}</Text>
          <Text style={styles.small}>{placeName ? region : "Нажмите, чтобы указать название"}</Text>
        </View>
        <Text style={styles.change}>Изменить</Text>
      </Pressable>

      <Text style={styles.section}>Задания рядом с вами</Text>

      {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 20 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {tasks.map((t) => (
        <Pressable
          key={t.id}
          style={styles.task}
          onPress={() =>
            router.push({
              pathname: "/task",
              params: { title: t.title, points: String(t.points), emoji: t.emoji, description: t.description },
            })
          }
        >
          <Text style={styles.emoji}>{t.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{t.title}</Text>
            <Text style={styles.small}>
              {t.place_type === "village" ? "Для аула и села" : t.place_type === "city" ? "Для города" : "Для всех"}
            </Text>
          </View>
          <Text style={styles.taskPoints}>+{t.points} TZ</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const GREEN = "#1F7A4D";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: { fontSize: 32, fontWeight: "800", color: GREEN },
  subtitle: { fontSize: 14, color: "#5B6B62", marginTop: 4 },
  signOut: { color: "#B3261E", fontWeight: "600" },
  card: { backgroundColor: GREEN, borderRadius: 20, padding: 20, marginBottom: 16 },
  rank: { color: "#D8F0E2", fontSize: 16 },
  points: { color: "white", fontSize: 40, fontWeight: "800", marginVertical: 6 },
  bar: { height: 8, backgroundColor: "#3E9468", borderRadius: 4, marginBottom: 8 },
  barFill: { height: 8, backgroundColor: "#F2C94C", borderRadius: 4 },
  cardSmall: { color: "#D8F0E2", fontSize: 12 },
  place: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 14, marginBottom: 20 },
  placeTitle: { fontSize: 16, fontWeight: "700", color: "#1C2B23" },
  change: { color: GREEN, fontWeight: "700" },
  small: { color: "#7C8A82", fontSize: 12 },
  error: { color: "#B3261E", fontSize: 14, marginTop: 8 },
  section: { fontSize: 20, fontWeight: "700", color: "#1C2B23", marginBottom: 12 },
  task: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 10, gap: 12 },
  emoji: { fontSize: 28 },
  taskTitle: { fontSize: 16, fontWeight: "600", color: "#1C2B23" },
  taskPoints: { color: GREEN, fontWeight: "800", fontSize: 16 },
});