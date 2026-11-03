import { Icon, IconBlob, type IconName } from "../../components/icon";
import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressScale } from "../../components/anim";
import { color, font } from "../../lib/theme";
import { tr } from "../../lib/i18n";

// коробка иконки; библиотека по умолчанию даёт 24×24 — расширяем через tabBarIconStyle
const BOX = { width: 40, height: 34 };

// тёмная панель: активная вкладка — тёмная иконка на лаймовой капле-листке
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={{ ...BOX, alignItems: "center", justifyContent: "center" }}>
      {focused ? (
        <IconBlob size={36} tint={color.lime}>
          <Icon name={name} size={22} color={color.onLime} />
        </IconBlob>
      ) : (
        <Icon name={name} size={22} color={color.onForestMuted} />
      )}
    </View>
  );
}

// центральная кнопка «Сообщить о загрязнении» — главное действие, открывает форму поверх вкладок
function ReportButton() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <PressScale
        onPress={() => router.push("/report")}
        scaleTo={0.9}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          marginTop: -18,
          backgroundColor: color.lime,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: color.forest,
        }}
      >
        <Icon name="add" size={30} color={color.onLime} />
      </PressScale>
    </View>
  );
}

const tab = (title: string, icon: IconName, iconOn: IconName) => ({
  title,
  tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name={focused ? iconOn : icon} focused={focused} />,
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    // Вузы и Портфолио — обычные экраны (src/app/universities.tsx, portfolio.tsx), а не скрытые вкладки:
    // в Expo Router 58 вкладка с href: null перенаправляет на первую вкладку, и открыть её нельзя
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // на Android иначе панель поднимается над клавиатурой (поиск во «Вузах»)
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: color.lime,
        tabBarInactiveTintColor: color.onForestMuted,
        tabBarIconStyle: BOX,
        tabBarStyle: {
          backgroundColor: color.forest,
          borderTopWidth: 0,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={tab(tr("Задания"), "leaf-outline", "leaf")} />
      <Tabs.Screen name="map" options={tab(tr("Карта"), "map-outline", "map")} />
      <Tabs.Screen name="new" options={{ title: tr("Сообщить"), tabBarButton: () => <ReportButton /> }} />
      <Tabs.Screen name="leaderboard" options={tab(tr("Рейтинг"), "trophy-outline", "trophy")} />
      <Tabs.Screen name="profile" options={tab(tr("Профиль"), "person-outline", "person")} />
    </Tabs>
  );
}
