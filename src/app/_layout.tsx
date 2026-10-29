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
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Literata_500Medium,
    Literata_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // если шрифты не загрузились — показываем приложение на системном шрифте, а не пустой экран
  if (!loaded && !error) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
