import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, font, radius } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// активная вкладка — иконка на лаймовой «пилюле»
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  if (!focused) {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        <Ionicons name={name} size={22} color={color.muted} />
      </View>
    );
  }
  return (
    <Animated.View
      entering={ZoomIn.duration(180)}
      style={{ backgroundColor: color.lime, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 4 }}
    >
      <Ionicons name={name} size={22} color={color.forest} />
    </Animated.View>
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
        tabBarActiveTintColor: color.forest,
        tabBarInactiveTintColor: color.muted,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopColor: color.line,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11, marginTop: 2 },
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
