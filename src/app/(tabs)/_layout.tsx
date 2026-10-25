import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { C } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tab = (title: string, icon: IconName, iconOn: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? iconOn : icon} size={size} color={color} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.sageDark,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: C.line,
          height: 70,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
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