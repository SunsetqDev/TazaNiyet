import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

type Uni = {
  id: number;
  name: string;
  city: string;
  type: string;
  website: string | null;
  description: string | null;
  programs: string | null;
  checked_at: string | null;
};

export default function UniversitiesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Uni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState("Все");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("universities").select("*").order("name");
      if (error) setError("Ошибка: " + error.message);
      else setItems(data as Uni[]);
      setLoading(false);
    };
    load();
  }, []);

  const cities = ["Все", ...Array.from(new Set(items.map((i) => i.city)))];

  const filtered = items.filter(
    (i) =>
      (city === "Все" || i.city === city) &&
      (type === "all" || i.type === type) &&
      i.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Назад</Text>
      </Pressable>
      <Text style={styles.title}>Вузы и колледжи</Text>

      <TextInput style={styles.input} placeholder="Поиск по названию" value={query} onChangeText={setQuery} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {[
          { k: "all", l: "Все типы" },
          { k: "university", l: "🎓 Вузы" },
          { k: "college", l: "🏫 Колледжи" },
        ].map((t) => (
          <Pressable key={t.k} onPress={() => setType(t.k)} style={[styles.chip, type === t.k && styles.chipActive]}>
            <Text style={[styles.chipText, type === t.k && styles.chipTextActive]}>{t.l}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {cities.map((c) => (
          <Pressable key={c} onPress={() => setCity(c)} style={[styles.chip, city === c && styles.chipActive]}>
            <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && <ActivityIndicator color={GREEN} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && filtered.length === 0 && <Text style={styles.empty}>Ничего не найдено.</Text>}

      {filtered.map((u) => (
        <View key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.type === "college" ? "🏫" : "🎓"} {u.name}</Text>
          <Text style={styles.city}>📍 {u.city}</Text>
          {u.description ? <Text style={styles.desc}>{u.description}</Text> : null}
          {u.programs ? <Text style={styles.desc}>Направления: {u.programs}</Text> : null}
          <Text style={styles.checked}>
            {u.checked_at
              ? `Данные проверены: ${new Date(u.checked_at).toLocaleDateString("ru-RU")}`
              : "Уточняйте актуальные данные на официальном сайте"}
          </Text>
          {u.website ? (
            <Pressable style={styles.btn} onPress={() => Linking.openURL(u.website!)}>
              <Text style={styles.btnText}>Открыть сайт</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  back: { color: GREEN, fontSize: 16, fontWeight: "600", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1C2B23", marginBottom: 14 },
  input: { backgroundColor: "white", borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#DDE5DF", marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "white", marginRight: 8, borderWidth: 1, borderColor: "#DDE5DF" },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: "#1C2B23", fontWeight: "600" },
  chipTextActive: { color: "white" },
  error: { color: "#B3261E" },
  empty: { color: "#7C8A82" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, marginBottom: 12 },
  name: { fontSize: 17, fontWeight: "700", color: "#1C2B23" },
  city: { color: "#5B6B62", marginTop: 4 },
  desc: { color: "#3F4F46", marginTop: 8, lineHeight: 20 },
  checked: { fontSize: 11, color: "#7C8A82", marginTop: 8 },
  btn: { backgroundColor: GREEN, borderRadius: 12, padding: 12, alignItems: "center", marginTop: 12 },
  btnText: { color: "white", fontWeight: "700" },
});