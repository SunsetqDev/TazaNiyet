import { Icon } from "../components/icon";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Avatar } from "../components/avatar";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Screen } from "../components/ui/screen";
import { TextField } from "../components/ui/text-field";
import { chatError, type FoundUser } from "../lib/chat";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";
import { tr } from "../lib/i18n";

/** Новый чат: поиск по нику. ?group=1 — создать группу из нескольких человек, ?add=<id> — добавить в группу. */
export default function NewChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ group?: string; add?: string }>();
  const addTo = params.add ? Number(params.add) : null;
  const multi = params.group === "1" || addTo !== null;

  const [query, setQuery] = useState("");
  const [found, setFound] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<FoundUser[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  // поиск через полсекунды после ввода
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setFound([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc("search_users", { p_query: q });
      setFound((data ?? []) as FoundUser[]);
      setSearching(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const openDirect = async (u: FoundUser) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("open_direct", { p_user: u.id });
    setBusy(false);
    if (error) {
      Alert.alert(tr("Не получилось"), chatError(error));
      return;
    }
    router.replace({ pathname: "/chat/[id]", params: { id: String(data) } });
  };

  const toggle = (u: FoundUser) =>
    setPicked((list) => (list.some((x) => x.id === u.id) ? list.filter((x) => x.id !== u.id) : [...list, u]));

  const submit = async () => {
    setBusy(true);
    const ids = picked.map((u) => u.id);
    const { data, error } =
      addTo !== null
        ? await supabase.rpc("add_group_members", { p_conv: addTo, p_members: ids })
        : await supabase.rpc("create_group", { p_title: title, p_members: ids });
    setBusy(false);
    if (error) {
      Alert.alert(tr("Не получилось"), chatError(error));
      return;
    }
    if (addTo !== null) router.back();
    else router.replace({ pathname: "/chat/[id]", params: { id: String(data) } });
  };

  const footer = multi ? (
    <Button
      label={addTo !== null ? tr("Добавить ({0})", picked.length) : tr("Создать группу ({0})", picked.length + 1)}
      onPress={submit}
      loading={busy}
      disabled={picked.length === 0 || (addTo === null && !title.trim())}
    />
  ) : undefined;

  return (
    <Screen bottomInset footer={footer}>
      <BackButton />
      <AppText variant="h1" style={{ marginTop: space.x4 }}>
        {addTo !== null ? tr("Добавить участников") : multi ? tr("Новая группа") : tr("Новый чат")}
      </AppText>

      {multi && addTo === null && (
        <View style={{ marginTop: space.x4 }}>
          <TextField label={tr("Название группы")} placeholder={tr("Например: Уборка парка")} maxLength={60} value={title} onChangeText={setTitle} />
        </View>
      )}

      {multi && picked.length > 0 && (
        <View style={s.picked}>
          {picked.map((u) => (
            <Pressable key={u.id} onPress={() => toggle(u)} style={s.pill}>
              <AppText style={s.pillText} numberOfLines={1}>
                {u.name}
              </AppText>
              <Icon name="close" size={14} color={color.forest} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ marginTop: space.x4 }}>
        <TextField
          label={multi ? tr("Участники") : undefined}
          placeholder={tr("Ник участника")}
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={setQuery}
          hint={searching ? tr("Ищем…") : tr("Введите хотя бы 2 буквы ника")}
        />
      </View>

      {query.trim().length >= 2 && !searching && found.length === 0 && (
        <EmptyState icon="search-outline" title={tr("Никого не нашли")} text={tr("Проверьте ник. Найти можно только тех, у кого в профиле указан ник.")} />
      )}

      {found.length > 0 && (
        <Card style={{ paddingVertical: 0, marginTop: space.x2 }}>
          {found.map((u, i) => {
            const on = picked.some((x) => x.id === u.id);
            return (
              <Pressable
                key={u.id}
                disabled={busy}
                onPress={() => (multi ? toggle(u) : openDirect(u))}
                style={({ pressed }) => [s.row, i > 0 && s.line, pressed && { opacity: 0.6 }]}
              >
                <Avatar name={u.name} emoji={u.avatar_emoji} color={u.avatar_color} size={40} />
                <AppText variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {u.name}
                </AppText>
                {multi ? (
                  <Icon name={on ? "checkmark-circle" : "ellipse-outline"} size={24} color={on ? color.forest : color.faint} />
                ) : (
                  <Icon name="chatbubble-outline" size={20} color={color.forest} />
                )}
              </Pressable>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  picked: { flexDirection: "row", flexWrap: "wrap", gap: space.x2, marginTop: space.x4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 180,
    paddingHorizontal: space.x3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.limeSoft,
  },
  pillText: { fontFamily: font.semibold, fontSize: 13, color: color.forest, flexShrink: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, paddingVertical: space.x3 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
});
