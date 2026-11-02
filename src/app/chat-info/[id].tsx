import { Icon } from "../../components/icon";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Avatar } from "../../components/avatar";
import { AppText } from "../../components/ui/app-text";
import { BackButton } from "../../components/ui/back-button";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ErrorState } from "../../components/ui/empty-state";
import { Screen } from "../../components/ui/screen";
import { SectionHeader } from "../../components/ui/section-header";
import { SkeletonCard } from "../../components/ui/skeleton";
import { TextField } from "../../components/ui/text-field";
import { chatError, type ChatInfo, type ChatMember } from "../../lib/chat";
import { supabase } from "../../lib/supabase";
import { color, radius, space } from "../../lib/theme";

/** Настройки чата: для группы — участники, название, выход; для личного — блокировка и удаление чата у себя. */
export default function ChatInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conv = Number(id);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_conversation", { p_conv: conv });
    setError(!!error || !data);
    if (data) {
      setInfo(data as ChatInfo);
      setTitle((data as ChatInfo).title ?? "");
    }
    setLoading(false);
  }, [conv]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (fn: string, args: Record<string, unknown>, after?: () => void) => {
    setBusy(true);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) {
      Alert.alert("Не получилось", chatError(error));
      return;
    }
    if (after) after();
    else load();
  };

  const toChats = () => router.dismissTo("/chats");

  const leave = () =>
    Alert.alert(
      info?.kind === "group" ? "Выйти из группы?" : "Удалить чат?",
      info?.kind === "group"
        ? "Вы больше не будете видеть сообщения группы. Вернуть может администратор."
        : "Чат исчезнет только у вас. Если собеседник напишет снова, чат вернётся.",
      [
        { text: "Отмена", style: "cancel" },
        { text: info?.kind === "group" ? "Выйти" : "Удалить", style: "destructive", onPress: () => run("leave_conversation", { p_conv: conv }, toChats) },
      ]
    );

  const removeMember = (m: ChatMember) =>
    Alert.alert("Убрать из группы?", `${m.name} больше не увидит сообщения группы.`, [
      { text: "Отмена", style: "cancel" },
      { text: "Убрать", style: "destructive", onPress: () => run("remove_group_member", { p_conv: conv, p_user: m.id }) },
    ]);

  const block = () =>
    Alert.alert("Заблокировать?", "Этот участник не сможет писать вам, звать в группы и находить вас в поиске.", [
      { text: "Отмена", style: "cancel" },
      { text: "Заблокировать", style: "destructive", onPress: () => run("block_user", { p_user: info?.other_id }) },
    ]);

  if (loading) {
    return (
      <Screen bottomInset>
        <BackButton />
        <SkeletonCard height={300} style={{ marginTop: space.x5 }} />
      </Screen>
    );
  }
  if (error || !info) {
    return (
      <Screen bottomInset>
        <BackButton />
        <ErrorState onRetry={load} />
      </Screen>
    );
  }

  const admin = info.my_role === "admin";
  const group = info.kind === "group";
  const other = info.members.find((m) => !m.is_me);

  return (
    <Screen bottomInset>
      <BackButton />
      <View style={s.hero}>
        {group ? (
          <View style={s.groupAva}>
            <Icon name="people" size={36} color={color.forest} />
          </View>
        ) : (
          <Avatar name={info.title} emoji={other?.emoji} color={other?.color} size={88} />
        )}
        <AppText variant="h2" style={{ marginTop: space.x3, textAlign: "center" }}>
          {info.title}
        </AppText>
        <AppText variant="caption">{group ? `Группа · ${info.members.length} участн.` : "Личный чат"}</AppText>
      </View>

      {group && admin && (
        <View style={s.rename}>
          <View style={{ flex: 1 }}>
            <TextField label="Название группы" maxLength={60} value={title} onChangeText={setTitle} />
          </View>
          <Button
            label="Сохранить"
            variant="secondary"
            disabled={busy || !title.trim() || title.trim() === info.title}
            onPress={() => run("rename_group", { p_conv: conv, p_title: title })}
            style={{ marginBottom: space.x4 }}
          />
        </View>
      )}

      {group && (
        <>
          <SectionHeader
            title="Участники"
            action={admin && info.members.length < 50 ? "Добавить" : undefined}
            onAction={() => router.push({ pathname: "/new-chat", params: { add: String(conv) } })}
          />
          <Card style={{ paddingVertical: 0 }}>
            {info.members.map((m, i) => (
              <View key={m.id} style={[s.row, i > 0 && s.line]}>
                <Avatar name={m.name} emoji={m.emoji} color={m.color} size={40} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {m.is_me ? `${m.name} (вы)` : m.name}
                  </AppText>
                  {m.role === "admin" ? <AppText variant="caption">администратор</AppText> : null}
                </View>
                {admin && !m.is_me ? (
                  <Pressable onPress={() => removeMember(m)} hitSlop={10} disabled={busy}>
                    <Icon name="remove-circle-outline" size={22} color={color.danger} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </Card>
        </>
      )}

      {!group && info.other_id && (
        <View style={{ marginTop: space.x5 }}>
          {info.blocked_by_me ? (
            <Button label="Разблокировать" variant="secondary" icon="lock-open-outline" onPress={() => run("unblock_user", { p_user: info.other_id })} loading={busy} />
          ) : (
            <Button label="Заблокировать" variant="secondary" icon="ban-outline" onPress={block} loading={busy} />
          )}
        </View>
      )}

      <View style={s.tip}>
        <Icon name="shield-checkmark-outline" size={18} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Если вам пишут грубости, просят фото, адрес или встречу — зажмите сообщение и нажмите «Пожаловаться», и расскажите взрослым.
        </AppText>
      </View>

      <Button
        label={group ? "Выйти из группы" : "Удалить чат"}
        variant="danger"
        icon={group ? "exit-outline" : "trash-outline"}
        onPress={leave}
        disabled={busy}
        style={{ marginTop: space.x4 }}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { alignItems: "center", marginTop: space.x4, marginBottom: space.x4 },
  groupAva: { width: 88, height: 88, borderRadius: 44, backgroundColor: color.limeSoft, alignItems: "center", justifyContent: "center" },
  rename: { flexDirection: "row", alignItems: "flex-end", gap: space.x2 },
  row: { flexDirection: "row", alignItems: "center", gap: space.x3, paddingVertical: space.x3 },
  line: { borderTopWidth: 1, borderTopColor: color.line },
  tip: { flexDirection: "row", gap: space.x2, backgroundColor: color.sand, borderRadius: radius.field, padding: space.x3, marginTop: space.x5 },
});
