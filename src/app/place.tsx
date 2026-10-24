import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

const REGIONS = [
  "Астана", "Алматы", "Шымкент",
  "Абайская область", "Акмолинская область", "Актюбинская область",
  "Алматинская область", "Атырауская область", "Восточно-Казахстанская область",
  "Жамбылская область", "Жетісуская область", "Западно-Казахстанская область",
  "Карагандинская область", "Костанайская область", "Кызылординская область",
  "Мангистауская область", "Павлодарская область", "Северо-Казахстанская область",
  "Туркестанская область", "Ұлытауская область",
];

const TYPES = [
  { key: "city", label: "🏙 Город" },
  { key: "town", label: "🏘 Посёлок городского типа" },
  { key: "village", label: "🌾 Аул / село" },
];

export default function PlaceScreen() {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!region || !type) {
      Alert.alert("Выберите область и тип места");
      return;
    }
    setSaving(true);
    const { data: s } = await supabase.auth.getSession();
    const user = s.session?.user;
    if (!user) {
      router.replace("/login");
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .update({ region, place_type: type, place_name: placeName.trim() || null })
      .eq("id", user.id)
      .select();
    setSaving(false);
    if (error || !data || data.length === 0) {
      Alert.alert("Ошибка", error ? error.message : "Профиль не найден");
      return;
    }
    router.replace("/");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>Где вы живёте?</Text>
      <Text style={styles.subtitle}>Мы покажем задания, которые можно выполнить рядом с вами.</Text>

      <Text style={styles.section}>1. Область</Text>
      <View style={styles.wrap}>
        {REGIONS.map((r) => (
          <Pressable key={r} onPress={() => setRegion(r)} style={[styles.chip, region === r && styles.chipActive]}>
            <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>2. Тип места</Text>
      <View style={styles.wrap}>
        {TYPES.map((t) => (
          <Pressable key={t.key} onPress={() => setType(t.key)} style={[styles.chip, type === t.key && styles.chipActive]}>
            <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>3. Название (по желанию)</Text>
      <TextInput
        style={styles.input}
        placeholder="Например: Актобе, аул Жайсан"
        value={placeName}
        onChangeText={setPlaceName}
      />

      <Pressable style={styles.button} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Продолжить</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  logo: { fontSize: 30, fontWeight: "800", color: GREEN },
  subtitle: { fontSize: 14, color: "#5B6B62", marginTop: 4, marginBottom: 20 },
  section: { fontSize: 18, fontWeight: "700", color: "#1C2B23", marginBottom: 10, marginTop: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "white", borderWidth: 1, borderColor: "#DDE5DF" },
  chipActive: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: "#1C2B23", fontWeight: "600" },
  chipTextActive: { color: "white" },
  input: { backgroundColor: "white", borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#DDE5DF", marginBottom: 20 },
  button: { backgroundColor: GREEN, borderRadius: 14, padding: 18, alignItems: "center" },
  buttonText: { color: "white", fontSize: 17, fontWeight: "700" },
});