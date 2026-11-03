// шрифты импортируем по одному начертанию, иначе в сборку попадут все 34 файла (~10 МБ)
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Literata_500Medium } from "@expo-google-fonts/literata/500Medium";
import { Literata_600SemiBold } from "@expo-google-fonts/literata/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { loadPrefs, saveLang, type Prefs } from "../lib/prefs";
import { color, isDark } from "../lib/theme";

SplashScreen.preventAutoHideAsync();

// первый запуск: выбор языка (потом — в настройках). Тексты на обоих языках, без t().
function LanguagePick({ onPick }: { onPick: (l: "kk" | "ru") => void }) {
  return (
    <View style={s.pick}>
      <Text style={s.brand}>TazaNiyet</Text>
      <Text style={s.ask}>Тілді таңдаңыз · Выберите язык</Text>
      <Pressable style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }]} onPress={() => onPick("kk")}>
        <Text style={s.btnText}>Қазақша</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [s.btn, s.btnAlt, pressed && { opacity: 0.8 }]} onPress={() => onPick("ru")}>
        <Text style={[s.btnText, s.btnAltText]}>Русский</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Literata_500Medium,
    Literata_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // язык и тема применяются до того, как загрузятся экраны (их стили берут цвета темы)
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  const ready = (loaded || !!error) && prefs !== null;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // если шрифты не загрузились — показываем приложение на системном шрифте, а не пустой экран
  if (!ready) return null;

  if (!prefs.lang) {
    return (
      <LanguagePick
        onPick={async (l) => {
          await saveLang(l, false);
          setPrefs({ ...prefs, lang: l });
        }}
      />
    );
  }

  return (
    <>
      <StatusBar style={isDark() ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />
    </>
  );
}

const s = StyleSheet.create({
  pick: { flex: 1, backgroundColor: "#153D2C", alignItems: "stretch", justifyContent: "center", padding: 28, gap: 14 },
  brand: { fontFamily: "Literata_600SemiBold", fontSize: 40, color: "#F6F4EC", textAlign: "center" },
  ask: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#CFE3D6", textAlign: "center", marginBottom: 18 },
  btn: { minHeight: 56, borderRadius: 999, backgroundColor: "#C9F36A", alignItems: "center", justifyContent: "center" },
  btnAlt: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#CFE3D6" },
  btnText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: "#153D2C" },
  btnAltText: { color: "#F6F4EC" },
});
