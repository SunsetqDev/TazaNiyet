import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const TASKS = [
  { id: 1, emoji: "🧹", title: "Уборка во дворе", city: "Актобе", points: 20 },
  { id: 2, emoji: "🌳", title: "Посади дерево", city: "Актобе", points: 80 },
  { id: 3, emoji: "♻️", title: "Сдай пластик на переработку", city: "Актобе", points: 40 },
  { id: 4, emoji: "💧", title: "Очисти берег реки Илек", city: "Актобе", points: 150 },
];

export default function HomeScreen() {
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
        <Text style={styles.small}>До ранга «Побег»: 100 TZ</Text>
      </View>

      <Text style={styles.section}>Задания в Актобе</Text>

      {TASKS.map((t) => (
        <Pressable key={t.id} style={styles.task}>
          <Text style={styles.emoji}>{t.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{t.title}</Text>
            <Text style={styles.small}>{t.city}</Text>
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
  small: { color: "#7C8A82", fontSize: 12 },
  section: { fontSize: 20, fontWeight: "700", color: "#1C2B23", marginBottom: 12 },
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