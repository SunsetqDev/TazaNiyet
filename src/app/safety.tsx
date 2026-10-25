import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

const GREEN = "#1F7A4D";

export default function SafetyScreen() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentContact, setParentContact] = useState("");
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);

  const thisYear = new Date().getFullYear();
  const y = parseInt(year, 10);
  const valid = !isNaN(y) && y >= 1950 && y <= thisYear - 5;
  const minor = valid && thisYear - y <= 14;

  const save = async () => {
    if (!valid) {
      Alert.alert("Укажите год рождения", "Например: 2010");
      return;
    }
    if (minor && (!parentName.trim() || !parentContact.trim())) {
      Alert.alert("Нужны данные родителя", "Укажите имя и телефон или почту родителя.");
      return;
    }
    if (!agree) {
      Alert.alert("Нужно согласие", "Примите политику конфиденциальности.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("save_safety_info", {
      p_birth_year: y,
      p_parent_name: minor ? parentName.trim() : null,
      p_parent_contact: minor ? parentContact.trim() : null,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    router.replace("/");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Безопасность</Text>
      <Text style={styles.sub}>
        Нам нужно знать возраст, чтобы защитить школьников. Эти данные видят только проверяющие.
      </Text>

      <Text style={styles.label}>Год рождения</Text>
      <TextInput
        style={styles.input}
        placeholder="Например: 2010"
        keyboardType="number-pad"
        maxLength={4}
        value={year}
        onChangeText={setYear}
      />

      {minor && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Нужно согласие родителей</Text>
          <Text style={styles.boxText}>
            Вам 14 лет или меньше. Укажите родителя или законного представителя. Проверяющий свяжется с ним, и после подтверждения вы сможете отправлять задания.
          </Text>
          <TextInput style={styles.input} placeholder="Имя родителя" value={parentName} onChangeText={setParentName} />
          <TextInput
            style={styles.input}
            placeholder="Телефон или почта родителя"
            autoCapitalize="none"
            value={parentContact}
            onChangeText={setParentContact}
          />
        </View>
      )}

      <Pressable style={styles.agreeRow} onPress={() => setAgree(!agree)}>
        <View style={[styles.check, agree && styles.checkOn]}>
          {agree && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.agreeText}>Я принимаю политику конфиденциальности</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/privacy")}>
        <Text style={styles.link}>Читать политику</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Продолжить</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F3EA" },
  content: { padding: 24, paddingTop: 70, paddingBottom: 50 },
  title: { fontSize: 30, fontWeight: "800", color: GREEN },
  sub: { color: "#5B6B62", marginTop: 6, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 16, fontWeight: "700", color: "#1C2B23", marginBottom: 8 },
  input: { backgroundColor: "white", borderRadius: 14, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#DDE5DF", marginBottom: 12 },
  box: { backgroundColor: "#FFF6D6", borderRadius: 16, padding: 16, marginVertical: 12 },
  boxTitle: { fontSize: 16, fontWeight: "800", color: "#8A6D00", marginBottom: 6 },
  boxText: { color: "#5B4A00", marginBottom: 12, lineHeight: 20 },
  agreeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: GREEN, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  checkOn: { backgroundColor: GREEN },
  checkMark: { color: "white", fontWeight: "800" },
  agreeText: { flex: 1, color: "#1C2B23", fontSize: 15 },
  link: { color: GREEN, fontWeight: "600", marginTop: 8, marginLeft: 38 },
  button: { backgroundColor: GREEN, borderRadius: 14, padding: 18, alignItems: "center", marginTop: 24 },
  buttonText: { color: "white", fontSize: 17, fontWeight: "700" },
});