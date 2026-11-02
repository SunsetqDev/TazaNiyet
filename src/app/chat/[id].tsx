import { Icon } from "../../components/icon";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Avatar } from "../../components/avatar";
import { AppText } from "../../components/ui/app-text";
import { BackButton } from "../../components/ui/back-button";
import { ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { MAX_MESSAGE, chatError, messageTime, type ChatInfo, type ChatMessage } from "../../lib/chat";
import { supabase } from "../../lib/supabase";
import { color, font, radius, space } from "../../lib/theme";

const REPORT_REASONS = ["Оскорбления или угрозы", "Неприличное содержание", "Спам или реклама", "Просит личные данные или встречу"];

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conv = Number(id);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [older, setOlder] = useState<"idle" | "loading" | "end">("idle");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const names = useRef<Record<string, string>>({});
  const me = useRef<string | null>(null);

  const loadInfo = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_conversation", { p_conv: conv });
    if (error || !data) return null;
    const c = data as ChatInfo;
    for (const m of c.members) names.current[m.id] = m.name;
    setInfo(c);
    return c;
  }, [conv]);

  const load = useCallback(async () => {
    setError(false);
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      router.replace("/login");
      return;
    }
    me.current = s.session.user.id;
    const [c, { data, error }] = await Promise.all([loadInfo(), supabase.rpc("get_messages", { p_conv: conv })]);
    if (!c || error) {
      setError(true);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as ChatMessage[];
    setMessages(list);
    setOlder(list.length < 50 ? "end" : "idle");
    setLoading(false);
    supabase.rpc("mark_read", { p_conv: conv });
  }, [conv, loadInfo]);

  useEffect(() => {
    load();
  }, [load]);

  // новые сообщения и удаления модератором — сразу на экране
  useEffect(() => {
    const ch = supabase
      .channel(`chat-${conv}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conv}` }, (p) => {
        const row = p.new as { id: number; sender_id: string | null; body: string; deleted_at: string | null; created_at: string };
        if (!row?.id) return;
        const msg: ChatMessage = {
          id: row.id,
          sender_id: row.sender_id,
          sender_name: (row.sender_id && names.current[row.sender_id]) || "Участник",
          body: row.deleted_at ? null : row.body,
          deleted: !!row.deleted_at,
          created_at: row.created_at,
          is_mine: row.sender_id === me.current,
        };
        setMessages((list) => (list.some((m) => m.id === msg.id) ? list.map((m) => (m.id === msg.id ? msg : m)) : [msg, ...list]));
        if (row.sender_id && !names.current[row.sender_id]) loadInfo(); // новый участник группы
        if (p.eventType === "INSERT" && !msg.is_mine) supabase.rpc("mark_read", { p_conv: conv });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conv, loadInfo]);

  const loadOlder = async () => {
    if (older !== "idle" || messages.length === 0) return;
    setOlder("loading");
    const { data } = await supabase.rpc("get_messages", { p_conv: conv, p_before: messages[messages.length - 1].id });
    const list = (data ?? []) as ChatMessage[];
    setMessages((cur) => [...cur, ...list.filter((m) => !cur.some((x) => x.id === m.id))]);
    setOlder(list.length < 50 ? "end" : "idle");
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const { data, error } = await supabase.rpc("send_message", { p_conv: conv, p_body: body });
    setSending(false);
    if (error) {
      Alert.alert("Не отправлено", chatError(error));
      return;
    }
    setText("");
    // если Realtime не успел — добавляем сами
    const mine: ChatMessage = {
      id: Number(data),
      sender_id: me.current,
      sender_name: "",
      body,
      deleted: false,
      created_at: new Date().toISOString(),
      is_mine: true,
    };
    setMessages((list) => (list.some((m) => m.id === mine.id) ? list : [mine, ...list]));
  };

  const report = (m: ChatMessage) => {
    if (m.is_mine || m.deleted) return;
    Alert.alert("Пожаловаться на сообщение?", "Модератор посмотрит его и несколько соседних сообщений.", [
      ...REPORT_REASONS.map((r) => ({
        text: r,
        onPress: async () => {
          const { error } = await supabase.rpc("report_message", { p_message: m.id, p_reason: r });
          Alert.alert(error ? "Не получилось" : "Жалоба отправлена", error ? chatError(error) : "Спасибо! Модератор проверит сообщение.");
        },
      })),
      { text: "Отмена", style: "cancel" as const },
    ]);
  };

  const blocked = info?.blocked_by_me || info?.blocked_me;
  const group = info?.kind === "group";
  const other = info?.members.find((m) => !m.is_me);
  const subtitle = group ? `${info?.members.length ?? 0} участн.` : info?.blocked_by_me ? "Вы заблокировали" : "Личный чат";

  const footer = blocked ? (
    <AppText variant="caption" style={{ textAlign: "center", paddingVertical: space.x2 }}>
      {info?.blocked_by_me ? "Вы заблокировали этого участника. Разблокировать можно в настройках чата." : "Этому участнику нельзя написать."}
    </AppText>
  ) : (
    <View style={s.inputRow}>
      <TextInput
        style={s.input}
        placeholder="Сообщение"
        placeholderTextColor={color.faint}
        cursorColor={color.forest}
        selectionColor={color.limeSoft}
        multiline
        maxLength={MAX_MESSAGE}
        value={text}
        onChangeText={setText}
      />
      <Pressable onPress={send} disabled={!text.trim() || sending} style={[s.send, (!text.trim() || sending) && { opacity: 0.4 }]} hitSlop={6}>
        {sending ? <ActivityIndicator color={color.lime} size="small" /> : <Icon name="arrow-up" size={22} color={color.lime} />}
      </Pressable>
    </View>
  );

  return (
    <Screen scroll={false} bottomInset footer={info ? footer : undefined} contentStyle={{ paddingBottom: 0 }}>
      <View style={s.head}>
        <BackButton />
        <Pressable
          style={s.headInfo}
          disabled={!info}
          onPress={() => router.push({ pathname: "/chat-info/[id]", params: { id: String(conv) } })}
        >
          {group ? (
            <View style={s.groupAva}>
              <Icon name="people" size={20} color={color.forest} />
            </View>
          ) : (
            <Avatar name={info?.title} emoji={other?.emoji} color={other?.color} size={40} />
          )}
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {info?.title ?? " "}
            </AppText>
            <AppText variant="caption" numberOfLines={1}>
              {info ? subtitle : " "}
            </AppText>
          </View>
          <Icon name="ellipsis-vertical" size={20} color={color.muted} />
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={color.forest} style={{ marginTop: space.x8 }} />}
      {!loading && error && <ErrorState onRetry={load} />}
      {!loading && !error && messages.length === 0 && (
        <AppText variant="caption" style={s.empty}>
          Напишите первое сообщение. Будьте вежливы: модератор видит сообщения, на которые пожаловались.
        </AppText>
      )}
      {!loading && !error && messages.length > 0 && (
        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => String(m.id)}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: space.x3 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadOlder}
          onEndReachedThreshold={0.3}
          ListFooterComponent={older === "loading" ? <ActivityIndicator color={color.forest} style={{ margin: space.x3 }} /> : undefined}
          renderItem={({ item: m, index }) => {
            const prev = messages[index + 1]; // более раннее сообщение
            const showName = group && !m.is_mine && prev?.sender_id !== m.sender_id;
            return (
              <View style={[s.msgRow, m.is_mine && { justifyContent: "flex-end" }]}>
                <Pressable
                  onLongPress={() => report(m)}
                  delayLongPress={350}
                  style={[s.bubble, m.is_mine ? s.mine : s.theirs, m.deleted && s.deleted]}
                >
                  {showName ? <AppText style={s.sender}>{m.sender_name}</AppText> : null}
                  <AppText style={[s.body, m.is_mine && { color: color.onForest }, m.deleted && s.deletedText]}>
                    {m.deleted ? "Сообщение удалено модератором" : m.body}
                  </AppText>
                  <AppText style={[s.time, m.is_mine && { color: color.onForestMuted }]}>{messageTime(m.created_at)}</AppText>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: space.x3, paddingBottom: space.x3, borderBottomWidth: 1, borderBottomColor: color.line },
  headInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.x3 },
  groupAva: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.limeSoft, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, textAlign: "center", marginTop: space.x8, paddingHorizontal: space.x5 },
  msgRow: { flexDirection: "row", marginVertical: 3 },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: space.x3, paddingTop: 8, paddingBottom: 6 },
  mine: { backgroundColor: color.forest, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, borderBottomLeftRadius: 6 },
  deleted: { backgroundColor: color.sand, borderColor: color.sand },
  sender: { fontFamily: font.semibold, fontSize: 12, color: color.forest, marginBottom: 2 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, color: color.ink },
  deletedText: { color: color.muted },
  time: { fontFamily: font.regular, fontSize: 11, color: color.faint, alignSelf: "flex-end", marginTop: 2 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: space.x2 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    paddingHorizontal: space.x4,
    paddingVertical: 10,
    fontFamily: font.regular,
    fontSize: 15,
    color: color.ink,
  },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.forest, alignItems: "center", justifyContent: "center" },
});
