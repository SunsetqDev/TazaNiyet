import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { C, R, S } from "../../lib/theme";

type Uni = {
  id: number;
  name: string;
  city: string;
  type: string;
  website: string | null;
  description: string | null;
  programs: string | null;
  photo_url: string | null;
  checked_at: string | null;
};

export default function UniversitiesScreen() {
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

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.chipText, active && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Вузы и колледжи</Text>
      <Text style={s.sub}>Куда можно поступить в Казахстане</Text>

      <TextInput style={s.search} placeholder="🔍  Поиск по названию" placeholderTextColor={C.muted} value={query} onChangeText={setQuery} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: S.sm }}>
        <Chip label="Все" active={type === "all"} onPress={() => setType("all")} />
        <Chip label="🎓 Вузы" active={type === "university"} onPress={() => setType("university")} />
        <Chip label="🏫 Колледжи" active={type === "college"} onPress={() => setType("college")} />
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: S.lg }}>
        {cities.map((c) => (
          <Chip key={c} label={c} active={city === c} onPress={() => setCity(c)} />
        ))}
      </ScrollView>

      {loading && <ActivityIndicator color={C.sageDark} />}
      {error && <Text style={{ color: C.danger }}>{error}</Text>}
      {!loading && !error && filtered.length === 0 && <Text style={{ color: C.muted }}>Ничего не найдено.</Text>}

      {filtered.map((u) => (
        <View key={u.id} style={s.card}>
          {u.photo_url ? (
            <Image source={{ uri: u.photo_url }} style={s.photo} resizeMode="cover" />
          ) : (
            <View style={[s.photo, s.placeholder]}>
              <Text style={{ fontSize: 44 }}>{u.type === "college" ? "🏫" : "🎓"}</Text>
            </View>
          )}
          <View style={s.badge}>
            <Text style={s.badgeText}>{u.type === "college" ? "Колледж" : "Университет"}</Text>
          </View>

          <View style={s.body}>
            <Text style={s.name}>{u.name}</Text>
            <Text style={s.city}>📍 {u.city}</Text>
            {u.description ? <Text style={s.desc}>{u.description}</Text> : null}

            {u.programs ? (
              <View style={s.tags}>
                {u.programs.split(",").map((p) => (
                  <View key={p} style={s.tag}>
                    <Text style={s.tagText}>{p.trim()}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={s.checked}>
              {u.checked_at
                ? `Данные проверены: ${new Date(u.checked_at).toLocaleDateString("ru-RU")}`
                : "Актуальные данные уточняйте на официальном сайте"}
            </Text>

            {u.website ? (
              <Pressable style={s.btn} onPress={() => Linking.openURL(u.website!)}>
                <Text style={s.btnText}>Открыть сайт</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 70, paddingBottom: S.xl + 30 },
  title: { fontSize: 30, fontWeight: "700", color: C.text },
  sub: { color: C.muted, marginTop: 6, marginBottom: S.lg },
  search: { backgroundColor: C.card, borderRadius: R.btn, paddingHorizontal: S.md, paddingVertical: 14, fontSize: 16, color: C.text, marginBottom: S.md },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: R.chip, backgroundColor: C.card, marginRight: S.sm },
  chipOn: { backgroundColor: C.sage },
  chipText: { color: C.muted, fontWeight: "600" },
  chipTextOn: { color: C.text },
  card: { backgroundColor: C.card, borderRadius: 28, marginBottom: S.lg, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  photo: { width: "100%", height: 190, backgroundColor: C.sageLight },
  placeholder: { alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: S.sm + 4, left: S.sm + 4, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: R.chip, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: "700", color: C.sageDark },
  body: { padding: S.md },
  name: { fontSize: 19, fontWeight: "700", color: C.text, lineHeight: 25 },
  city: { color: C.muted, marginTop: 6 },
  desc: { color: C.text, opacity: 0.8, lineHeight: 22, marginTop: S.sm + 2 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: S.sm + 4 },
  tag: { backgroundColor: C.sageSoft, borderRadius: R.chip, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, color: C.sageDark, fontWeight: "600" },
  checked: { fontSize: 11, color: C.muted, marginTop: S.sm + 4 },
  btn: { backgroundColor: C.sageSoft, borderRadius: R.btn, paddingVertical: 14, alignItems: "center", marginTop: S.md },
  btnText: { color: C.sageDark, fontWeight: "700" },
});