import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { PressScale } from "../components/anim";
import { Avatar } from "../components/avatar";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Card } from "../components/ui/card";
import { EmptyState, ErrorState } from "../components/ui/empty-state";
import { Screen } from "../components/ui/screen";
import { SkeletonCard } from "../components/ui/skeleton";
import { chatTime, subscribeMessages, type ChatListItem } from "../lib/chat";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      router.replace("/login");
      return;
    }
    const { data, error } = await supabase.rpc("get_conversations");
    setError(!!error);
    if (!error) setChats((data ?? []) as ChatListItem[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // новые сообщения в любом чате — обновляем список
  useEffect(() => subscribeMessages("chats-list", () => load()), [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen bottomInset refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[color.forest]} />}>
      <View style={s.top}>
        <BackButton />
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push("/blocked")} hitSlop={10}>
          <AppText variant="caption">Заблокированные</AppText>
        </Pressable>
      </View>
      <AppText variant="h1">Сообщения</AppText>

      <View style={s.actions}>
        <PressScale onPress={() => router.push("/new-chat")} scaleTo={0.97} style={[s.action, s.actionMain]}>
          <Ionicons name="create-outline" size={20} color={color.lime} />
          <AppText style={s.actionMainText}>Новый чат</AppText>
        </PressScale>
        <PressScale onPress={() => router.push({ pathname: "/new-chat", params: { group: "1" } })} scaleTo={0.97} style={s.action}>
          <Ionicons name="people-outline" size={20} color={color.forest} />
          <AppText style={s.actionText}>Создать группу</AppText>
        </PressScale>
      </View>

      {loading && <SkeletonCard height={260} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && chats.length === 0 && (
        <EmptyState
          icon="chatbubbles-outline"
          title="Пока нет чатов"
          text="Найдите участника по нику или соберите группу друзей для общей уборки."
        />
      )}
      {!loading && !error && chats.length > 0 && (
        <Card style={{ paddingVertical: 0 }}>
          {chats.map((c, i) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: String(c.id) } })}
              style={({ pressed }) => [s.row, i > 0 && s.line, pressed && { opacity: 0.6 }]}
            >
              {c.kind === "group" ? (
                <View style={s.groupAva}>
                  <Ionicons name="people" size={22} color={color.forest} />
                </View>
              ) : (
                <Avatar name={c.title} emoji={c.avatar_emoji} color={c.avatar_color} size={48} />
              )}
              <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                  <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {c.title}
                  </AppText>
                  <AppText variant="caption">{chatTime(c.last_at)}</AppText>
                </View>
                <View style={s.rowTop}>
                  <AppText variant="caption" numberOfLines={1} style={{ flex: 1 }}>
                    {c.last_body ? `${c.last_is_mine ? "Вы: " : ""}${c.last_body}` : c.kind === "group" ? `${c.members} участн.` : "Нет сообщений"}
                  </AppText>
                  {c.unread > 0 && (
                    <View style={s.badge}>
                      <AppText style={s.badgeText}>{c.unread > 99 ? "99+" : c.unread}</AppText>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", marginBottom: space.x4 },
  actions: { flexDirection: "row", gap: space.x2, marginTop: space.x4, marginBottom: space.x4 },
  action: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.x2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  actionMain: { backgroundColor: color.forest, borderColor: color.forest },
  actionMainText: { fontFamily: font.semibold, fontSize: 14, color: color.onForest },
  actionText: { fontFamily: font.semibold, fontSize: 14, color: color.forest },
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, paddingVertical: space.x3 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
  rowTop: { flexDirection: "row", alignItems: "center", gap: space.x2 },
  groupAva: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.limeSoft, alignItems: "center", justifyContent: "center" },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: color.forest, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: font.bold, fontSize: 11, color: color.lime },
});
