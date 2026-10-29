import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { AVATAR_COLORS, AVATAR_EMOJIS, Avatar } from "../components/avatar";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { Skeleton } from "../components/ui/skeleton";
import { TextField } from "../components/ui/text-field";
import { supabase } from "../lib/supabase";
import { color as palette, font, radius, space } from "../lib/theme";

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
      <Screen bottomInset>
        <BackButton />
        <View style={{ alignItems: "center", gap: space.x3 }}>
          <Skeleton width={104} height={104} round={52} />
          <Skeleton width={160} height={22} />
        </View>
        <Skeleton height={52} round={radius.field} style={{ marginTop: space.x8 }} />
      </Screen>
    );
  }

  return (
    <Screen bottomInset footer={<Button label="Сохранить" onPress={save} loading={saving} />}>
      <BackButton />
      <AppText variant="h1">Мой профиль</AppText>

      <View style={s.preview}>
        <Avatar name={nick || realName} emoji={emoji} color={color} size={104} />
        <AppText variant="h2" style={{ marginTop: space.x3 }}>
          {nick || realName || "Без имени"}
        </AppText>
      </View>

      <TextField
        label="Никнейм"
        placeholder="Например: eco_hero"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        value={nickname}
        onChangeText={setNickname}
        error={nickError}
        hint="Его будут видеть другие участники в рейтинге. Настоящее имя остаётся скрытым."
      />

      <SectionHeader title="Аватар" />
      <View style={s.grid}>
        <Pressable style={[s.cell, emoji === null && s.cellOn]} onPress={() => setEmoji(null)}>
          <AppText style={s.cellLetter}>{(nick || realName || "?").charAt(0).toUpperCase()}</AppText>
        </Pressable>
        {AVATAR_EMOJIS.map((e) => (
          <Pressable key={e} style={[s.cell, emoji === e && s.cellOn]} onPress={() => setEmoji(e)}>
            <Text style={s.cellEmoji}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Цвет фона" />
      <View style={s.grid}>
        {AVATAR_COLORS.map((c) => (
          <Pressable key={c} onPress={() => setColor(c)} style={[s.colorRing, color === c && s.colorRingOn]}>
            <View style={[s.colorDot, { backgroundColor: c }]}>
              {color === c && <Ionicons name="checkmark" size={18} color={palette.ink} />}
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  preview: { alignItems: "center", marginTop: space.x5, marginBottom: space.x6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.x2 },
  cell: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: "center",
    justifyContent: "center",
  },
  cellOn: { borderWidth: 2, borderColor: palette.forest, backgroundColor: palette.limeSoft },
  cellLetter: { fontFamily: font.semibold, fontSize: 22, color: palette.ink },
  cellEmoji: { fontSize: 28 },
  colorRing: { padding: 3, borderRadius: 28, borderWidth: 2, borderColor: "transparent" },
  colorRingOn: { borderColor: palette.forest },
  colorDot: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
