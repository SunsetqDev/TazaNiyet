import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Card } from "../components/ui/card";
import { EmptyState, ErrorState } from "../components/ui/empty-state";
import { Screen } from "../components/ui/screen";
import { SkeletonCard } from "../components/ui/skeleton";
import { chatError } from "../lib/chat";
import { supabase } from "../lib/supabase";
import { color, font, space } from "../lib/theme";

type Blocked = { id: string; name: string };

/** Заблокированные в мессенджере: они не могут писать, звать в группы и находить вас в поиске. */
export default function BlockedScreen() {
  const [list, setList] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_blocked_users");
    setError(!!error);
    setList((data ?? []) as Blocked[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const unblock = (b: Blocked) =>
    Alert.alert("Разблокировать?", `${b.name} снова сможет писать вам.`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Разблокировать",
        onPress: async () => {
          const { error } = await supabase.rpc("unblock_user", { p_user: b.id });
          if (error) Alert.alert("Не получилось", chatError(error));
          load();
        },
      },
    ]);

  return (
    <Screen bottomInset>
      <BackButton />
      <AppText variant="h1" style={{ marginTop: space.x4, marginBottom: space.x4 }}>
        Заблокированные
      </AppText>
      {loading && <SkeletonCard height={160} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && list.length === 0 && (
        <EmptyState icon="ban-outline" title="Никого нет" text="Заблокировать участника можно в настройках личного чата." />
      )}
      {!loading && !error && list.length > 0 && (
        <Card style={{ paddingVertical: 0 }}>
          {list.map((b, i) => (
            <View key={b.id} style={[s.row, i > 0 && s.line]}>
              <Ionicons name="ban-outline" size={20} color={color.muted} />
              <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                {b.name}
              </AppText>
              <Pressable onPress={() => unblock(b)} hitSlop={10}>
                <AppText style={s.action}>Разблокировать</AppText>
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, minHeight: 56, paddingVertical: space.x3 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
  action: { fontFamily: font.semibold, fontSize: 13, color: color.forest },
});
