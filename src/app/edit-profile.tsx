import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { AVATAR_COLORS, AVATAR_EMOJIS, Avatar } from "../components/avatar";
import { supabase } from "../lib/supabase";
import { C, R, S } from "../lib/theme";

const NICK_RE = /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9_.-]+$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("name, nickname, avatar_emoji, avatar_color")
        .eq("id", user.id)
        .single();
      setRealName(data?.name ?? "");
      setNickname(data?.nickname ?? "");
      setEmoji(data?.avatar_emoji ?? null);
      setColor(data?.avatar_color ?? AVATAR_COLORS[0]);
      setLoading(false);
    };
    load();
  }, []);

  const nick = nickname.trim();
  const nickError =
    nick.length === 0
      ? null
      : nick.length < 3
      ? "Минимум 3 символа"
      : nick.length > 20
      ? "Максимум 20 символов"
      : !NICK_RE.test(nick)
      ? "Только буквы, цифры и символы _ . -"
      : null;

  const save = async () => {
    if (nickError) {
      Alert.alert("Проверьте ник", nickError);
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc("update_appearance", {
      p_nickname: nick || null,
      p_emoji: emoji,
      p_color: color,
    });
    setSaving(false);
    if (error) {
      Alert.alert("Ошибка", error.message);
      return;
    }
    if (data !== "ok") {
      Alert.alert("Не получилось", String(data));
      return;
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={C.sageDark} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>← Назад</Text>
      </Pressable>
      <Text style={s.title}>Мой профиль</Text>

      <View style={s.preview}>
        <Avatar name={nick || realName} emoji={emoji} color={color} size={104} />
        <Text style={s.previewName}>{nick || realName || "Без имени"}</Text>
      </View>

      <Text style={s.label}>Никнейм</Text>
      <TextInput
        style={[s.input, nickError ? { borderColor: C.danger } : null]}
        placeholder="Например: eco_hero"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        value={nickname}
        onChangeText={setNickname}
      />
      {nickError ? (
        <Text style={s.error}>{nickError}</Text>
      ) : (
        <Text style={s.hint}>Его будут видеть другие участники в рейтинге. Настоящее имя остаётся скрытым.</Text>
      )}

      <Text style={s.label}>Аватар</Text>
      <View style={s.grid}>
        <Pressable style={[s.cell, emoji === null && s.cellOn]} onPress={() => setEmoji(null)}>
          <Text style={s.cellLetter}>{(nick || realName || "?").charAt(0).toUpperCase()}</Text>
        </Pressable>
        {AVATAR_EMOJIS.map((e) => (
          <Pressable key={e} style={[s.cell, emoji === e && s.cellOn]} onPress={() => setEmoji(e)}>
            <Text style={s.cellEmoji}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Цвет</Text>
      <View style={s.grid}>
        {AVATAR_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[s.colorDot, { backgroundColor: c }, color === c && s.colorOn]}
          />
        ))}
      </View>

      <Pressable style={[s.button, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={s.buttonText}>Сохранить</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: S.md + 4, paddingTop: 60, paddingBottom: S.xl + 20 },
  back: { color: C.sageDark, fontSize: 16, fontWeight: "600", marginBottom: S.md },
  title: { fontSize: 30, fontWeight: "700", color: C.text, marginBottom: S.md },
  preview: { alignItems: "center", backgroundColor: C.sageSoft, borderRadius: 30, padding: S.lg, marginBottom: S.lg },
  previewName: { fontSize: 22, fontWeight: "800", color: C.text, marginTop: S.sm },
  label: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: S.sm, marginTop: S.sm },
  input: { backgroundColor: C.card, borderRadius: R.card, padding: 16, fontSize: 16, borderWidth: 1.5, borderColor: C.line, color: C.text },
  hint: { color: C.muted, fontSize: 12, marginTop: 6, marginBottom: S.sm, lineHeight: 18 },
  error: { color: C.danger, fontSize: 12, marginTop: 6, marginBottom: S.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: S.sm },
  cell: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  cellOn: { borderColor: C.sageDark, backgroundColor: C.sageSoft },
  cellEmoji: { fontSize: 28 },
  cellLetter: { fontSize: 22, fontWeight: "700", color: C.text },
  colorDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: "transparent" },
  colorOn: { borderColor: C.text },
  button: { backgroundColor: C.sageDark, borderRadius: R.btn, padding: 18, alignItems: "center", marginTop: S.lg },
  buttonText: { color: "white", fontSize: 17, fontWeight: "700" },
});