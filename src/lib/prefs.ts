import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";
import { Appearance, DevSettings } from "react-native";
import { setLangNow, type Lang } from "./i18n";
import { applyTheme, type ThemeMode } from "./theme";

// Настройки устройства: язык и тема. Применяются при запуске до загрузки экранов (src/app/_layout.tsx);
// после смены приложение перезапускается, чтобы все экраны собрались заново.

const LANG_KEY = "tz:lang";
const THEME_KEY = "tz:theme";

export type Prefs = { lang: Lang | null; theme: ThemeMode };

export async function loadPrefs(): Promise<Prefs> {
  let l: string | null = null;
  let th: string | null = null;
  try {
    [l, th] = await Promise.all([AsyncStorage.getItem(LANG_KEY), AsyncStorage.getItem(THEME_KEY)]);
  } catch {}
  const lang = l === "kk" || l === "ru" ? l : null;
  const theme: ThemeMode = th === "light" || th === "dark" ? th : "system";
  setLangNow(lang ?? "ru");
  applyTheme(theme === "system" ? (Appearance.getColorScheme() === "dark" ? "dark" : "light") : theme);
  return { lang, theme };
}

async function restart() {
  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload(); // в режиме разработки
  }
}

export async function saveLang(l: Lang, reload = true) {
  await AsyncStorage.setItem(LANG_KEY, l);
  if (reload) await restart();
  else setLangNow(l);
}

export async function saveTheme(m: ThemeMode) {
  await AsyncStorage.setItem(THEME_KEY, m);
  await restart();
}

export async function getThemeMode(): Promise<ThemeMode> {
  const th = await AsyncStorage.getItem(THEME_KEY).catch(() => null);
  return th === "light" || th === "dark" ? th : "system";
}
