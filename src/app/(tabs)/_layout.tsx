import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const tab = (title: string, icon: IconName, iconOn: IconName) => ({
  title,
  tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name={focused ? iconOn : icon} focused={focused} />,
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
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
      <Tabs.Screen name="universities" options={tab("Вузы", "school-outline", "school")} />
      <Tabs.Screen name="leaderboard" options={tab("Рейтинг", "trophy-outline", "trophy")} />
      <Tabs.Screen name="portfolio" options={tab("Портфолио", "qr-code-outline", "qr-code")} />
      <Tabs.Screen name="profile" options={tab("Профиль", "person-outline", "person")} />
    </Tabs>
  );
}
