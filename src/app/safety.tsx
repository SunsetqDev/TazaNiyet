import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, radius, space } from "../lib/theme";

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
    <Screen bottomInset footer={<Button label="Продолжить" onPress={save} loading={saving} />}>
      <View style={s.icon}>
        <Ionicons name="shield-checkmark-outline" size={28} color={color.forest} />
      </View>
      <AppText variant="h1">Безопасность</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1, marginBottom: space.x6 }}>
        Нам нужно знать возраст, чтобы защитить школьников. Эти данные видят только проверяющие.
      </AppText>

      <TextField label="Год рождения" placeholder="Например: 2010" keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear} />

      {minor && (
        <View style={s.box}>
          <AppText variant="h3" color={color.warn}>
            Нужно согласие родителей
          </AppText>
          <AppText variant="body" color={color.warn} style={{ marginTop: space.x1, marginBottom: space.x4 }}>
            Вам 14 лет или меньше. Укажите родителя или законного представителя. Проверяющий свяжется с ним, и после
            подтверждения вы сможете отправлять задания.
          </AppText>
          <TextField label="Имя родителя" placeholder="Например: Айгуль Серикова" value={parentName} onChangeText={setParentName} />
          <TextField
            label="Телефон или почта родителя"
            placeholder="+7 700 000 00 00"
            autoCapitalize="none"
            value={parentContact}
            onChangeText={setParentContact}
          />
        </View>
      )}

      <Pressable style={s.agreeRow} onPress={() => setAgree(!agree)} hitSlop={6}>
        <View style={[s.check, agree && s.checkOn]}>{agree && <Ionicons name="checkmark" size={18} color={color.lime} />}</View>
        <AppText variant="body" style={{ flex: 1 }}>
          Я принимаю политику конфиденциальности
        </AppText>
      </Pressable>
      <Button label="Читать политику" variant="ghost" onPress={() => router.push("/privacy")} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: color.limeSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.x4,
  },
  box: { backgroundColor: color.warnSoft, borderRadius: radius.card, padding: space.x4, marginBottom: space.x4 },
  agreeRow: { flexDirection: "row", alignItems: "center", gap: space.x3, minHeight: 48 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.faint,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: color.forest, borderColor: color.forest },
});
