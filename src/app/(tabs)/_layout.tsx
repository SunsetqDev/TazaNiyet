import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressScale } from "../../components/anim";
import { color, font, radius } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// размер «пилюли»; библиотека по умолчанию даёт иконке коробку 24×24 — расширяем её через tabBarIconStyle
const PILL = { width: 56, height: 32 };

// активная вкладка — иконка на лаймовой «пилюле»
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View
      style={{
        ...PILL,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? color.lime : "transparent",
      }}
    >
      <Ionicons name={name} size={22} color={focused ? color.forest : color.muted} />
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
          backgroundColor: color.forest,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 4,
          borderColor: color.cream,
        }}
      >
        <Ionicons name="add" size={30} color={color.lime} />
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
    <Tabs
      // «назад» из Вузов и Портфолио возвращает туда, откуда их открыли (профиль, главная)
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // на Android иначе панель поднимается над клавиатурой (поиск во «Вузах»)
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: color.forest,
        tabBarInactiveTintColor: color.muted,
        tabBarIconStyle: PILL,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.line,
          borderTopWidth: 1,
          height: 68 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11, marginTop: 4 },
      }}
    >
      <Tabs.Screen name="index" options={tab("Задания", "leaf-outline", "leaf")} />
      <Tabs.Screen name="map" options={tab("Карта", "map-outline", "map")} />
      <Tabs.Screen name="new" options={{ title: "Сообщить", tabBarButton: () => <ReportButton /> }} />
      <Tabs.Screen name="leaderboard" options={tab("Рейтинг", "trophy-outline", "trophy")} />
      <Tabs.Screen name="profile" options={tab("Профиль", "person-outline", "person")} />
      {/* Вузы и Портфолио — не в панели, вход из профиля и с главной */}
      <Tabs.Screen name="universities" options={{ href: null }} />
      <Tabs.Screen name="portfolio" options={{ href: null }} />
    </Tabs>
  );
}
