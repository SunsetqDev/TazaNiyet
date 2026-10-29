import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Chip } from "../components/ui/chip";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color, space } from "../lib/theme";

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
  { key: "city", label: "Город" },
  { key: "town", label: "Посёлок городского типа" },
  { key: "village", label: "Аул / село" },
];

export default function PlaceScreen() {
  const router = useRouter();
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [saving, setSaving] = useState(false);

  // при смене места подставляем то, что уже сохранено в профиле
  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) return;
      const { data } = await supabase.from("profiles").select("region, place_type, place_name").eq("id", user.id).single();
      if (!data) return;
      if (data.region) setRegion(data.region);
      if (data.place_type) setType(data.place_type);
      if (data.place_name) setPlaceName(data.place_name);
    };
    load();
  }, []);

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
    <Screen bottomInset footer={<Button label="Продолжить" onPress={save} loading={saving} />}>
      {/* при первом входе истории нет — кнопка «назад» нужна только при смене места с главной */}
      {router.canGoBack() && <BackButton />}
      <AppText variant="h1">Где вы живёте?</AppText>
      <AppText variant="body" color={color.muted} style={{ marginTop: space.x1 }}>
        Мы покажем задания, которые можно выполнить рядом с вами.
      </AppText>

      <SectionHeader title="1. Область" />
      <View style={s.wrap}>
        {REGIONS.map((r) => (
          <Chip key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
        ))}
      </View>

      <SectionHeader title="2. Тип места" />
      <View style={s.wrap}>
        {TYPES.map((t) => (
          <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(t.key)} />
        ))}
      </View>

      <SectionHeader title="3. Название" hint="по желанию" />
      <TextField placeholder="Например: Актобе, аул Жайсан" value={placeName} onChangeText={setPlaceName} />
    </Screen>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", rowGap: space.x2 },
});
