import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const CITIES = ["Актобе", "Астана", "Алматы", "Шымкент"];

const TASKS = [
  { id: 1, emoji: "🧹", title: "Уборка во дворе", city: "Актобе", points: 20 },
  { id: 2, emoji: "🌳", title: "Посади дерево", city: "Актобе", points: 80 },
  { id: 3, emoji: "♻️", title: "Сдай пластик на переработку", city: "Актобе", points: 40 },
  { id: 4, emoji: "💧", title: "Очисти берег реки Илек", city: "Актобе", points: 150 },
  { id: 5, emoji: "🧹", title: "Уборка в парке", city: "Астана", points: 30 },
  { id: 6, emoji: "🌳", title: "Озеленение школьного двора", city: "Астана", points: 90 },
  { id: 7, emoji: "🏔", title: "Уборка тропы в горах", city: "Алматы", points: 120 },
  { id: 8, emoji: "♻️", title: "Сбор макулатуры в школе", city: "Алматы", points: 50 },
  { id: 9, emoji: "🌳", title: "Посади саженец", city: "Шымкент", points: 80 },
  { id: 10, emoji: "🧹", title: "Уборка двора", city: "Шымкент", points: 20 },
];

export default function HomeScreen() {
  const [city, setCity] = useState("Актобе");
  const router = useRouter();

  const tasks = TASKS.filter((t) => t.city === city);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>TazaNiyet</Text>
        <Text style={styles.subtitle}>Делай добро для города — получай опыт для будущего</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rank}>🌱 Росток</Text>
        <Text style={styles.points}>0 TZ</Text>
        <View style={styles.bar}>
          <View style={styles.barFill} />
        </View>
        <Text style={styles.cardSmall}>До ранга «Побег»: 100 TZ</Text>
      </View>

      <Text style={styles.section}>Ваш город</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {CITIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCity(c)}
            style={[styles.chip, city === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Задания: {city}</Text>

      {tasks.map((t) => (
        <Pressable
          key={t.id}
          style={styles.task}
          onPress={() =>
            router.push({
              pathname: "/task",
              params: { title: t.title, points: String(t.points), emoji: t.emoji },
            })
          }
        >
          <Text style={styles.emoji}>{t.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{t.title}</Text>
            <Text style={styles.small}>Нажми, чтобы открыть</Text>
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
  header: { marginBottom: 20 },
  logo: { fontSize: 32, fontWeight: "800", color: GREEN },
  subtitle: { fontSize: 14, color: "#5B6B62", marginTop: 4 },
  card: { backgroundColor: GREEN, borderRadius: 20, padding: 20, marginBottom: 24 },
  rank: { color: "#D8F0E2", fontSize: 16 },
  points: { color: "white", fontSize: 40, fontWeight: "800", marginVertical: 6 },
  bar: { height: 8, backgroundColor: "#3E9468", borderRadius: 4, marginBottom: 8 },
  barFill: { width: "5%", height: 8, backgroundColor: "#F2C94C", borderRadius: 4 },
  cardSmall: { color: "#D8F0E2", fontSize: 12 },
  small: { color: "#7C8A82", fontSize: 12 },
  section: { fontSize: 20, fontWeight: "700", color: "#1C2B23", marginBottom: 12 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DDE5DF",
  },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: "#1C2B23", fontWeight: "600" },
  chipTextActive: { color: "white" },
  task: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  emoji: { fontSize: 28 },
  taskTitle: { fontSize: 16, fontWeight: "600", color: "#1C2B23" },
  taskPoints: { color: GREEN, fontWeight: "800", fontSize: 16 },
});