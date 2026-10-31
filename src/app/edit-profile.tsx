import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { PressScale } from "../components/anim";
import { AVATAR_COLORS, AVATAR_EMOJIS, Avatar } from "../components/avatar";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { Skeleton } from "../components/ui/skeleton";
import { TextField } from "../components/ui/text-field";
import { avatarUrl } from "../lib/avatar";
import { pickPhoto, takePhoto, uploadPhoto, type Photo } from "../lib/photos";
import { supabase } from "../lib/supabase";
import { color as palette, font, radius, space } from "../lib/theme";

const NICK_RE = /^[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9_.-]+$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [savedNick, setSavedNick] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(AVATAR_COLORS[0]);
  // фото: сохранённое (путь и ссылка), новое (ещё не загружено) или «убрать»
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<Photo | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [serverNickError, setServerNickError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
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
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("name, nickname, avatar_emoji, avatar_color, avatar_path")
        .eq("id", user.id)
        .single();
      setRealName(data?.name ?? "");
      setNickname(data?.nickname ?? "");
      setSavedNick(data?.nickname ?? "");
      setEmoji(data?.avatar_emoji ?? null);
      setColor(data?.avatar_color ?? AVATAR_COLORS[0]);
      setPhotoPath(data?.avatar_path ?? null);
      setPhotoUrl(await avatarUrl(data?.avatar_path));
      setLoading(false);
    };
    load();
  }, []);

  const nick = nickname.trim();
  const formatError =
    nick.length === 0
      ? null
      : nick.length < 3
      ? "Минимум 3 символа"
      : nick.length > 20
      ? "Максимум 20 символов"
      : !NICK_RE.test(nick)
      ? "Только буквы, цифры и символы _ . -"
      : null;

  // проверка на сервере (запрещённые слова, занятость) — через полсекунды после ввода
  useEffect(() => {
    setServerNickError(null);
    if (!nick || formatError || nick.toLowerCase() === savedNick.toLowerCase()) {
      setChecking(false);
      return;
    }
    setChecking(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc("check_nickname", { p_nick: nick });
      setServerNickError(typeof data === "string" && data ? data : null);
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [nick, formatError, savedNick]);

  const nickError = formatError ?? serverNickError;

  const choosePhoto = async (from: "camera" | "gallery") => {
    const p = from === "camera" ? await takePhoto({ square: true }) : await pickPhoto({ square: true });
    if (!p) return;
    setNewPhoto(p);
    setRemovePhoto(false);
  };

  const shownPhoto = newPhoto ? newPhoto.uri : removePhoto ? null : photoUrl;

  const save = async () => {
    if (nickError) {
      Alert.alert("Проверьте ник", nickError);
      return;
    }
    if (checking) return;
    setSaving(true);
    try {
      let avatarPath: string | null = null; // null — фото не менять
      if (newPhoto) avatarPath = await uploadPhoto("avatars", newPhoto, userId, "avatar");
      else if (removePhoto) avatarPath = "";
      const { data, error } = await supabase.rpc("update_appearance", {
        p_nickname: nick || null,
        p_emoji: emoji,
        p_color: color,
        p_avatar_path: avatarPath,
      });
      if (error) throw error;
      if (data !== "ok") {
        if (String(data).toLowerCase().includes("ник")) setServerNickError(String(data));
        Alert.alert("Не получилось", String(data));
        return;
      }
      // старое фото больше не нужно — удаляем из хранилища
      if (avatarPath !== null && photoPath) await supabase.storage.from("avatars").remove([photoPath]);
      router.back();
    } catch (e: any) {
      Alert.alert("Не удалось сохранить", e?.message ?? "Проверьте интернет и попробуйте снова.");
    } finally {
      setSaving(false);
    }
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
    <Screen bottomInset footer={<Button label="Сохранить" onPress={save} loading={saving} disabled={!!nickError} />}>
      <BackButton />
      <AppText variant="h1">Мой профиль</AppText>

      <View style={s.preview}>
        <Avatar name={nick || realName} emoji={emoji} color={color} photo={shownPhoto} size={112} />
        <AppText variant="h2" style={{ marginTop: space.x3 }}>
          {nick || realName || "Без имени"}
        </AppText>
      </View>

      <SectionHeader title="Фото профиля" hint="видно только вам" />
      <View style={s.photoRow}>
        <PressScale onPress={() => choosePhoto("camera")} scaleTo={0.96} style={s.photoBtn}>
          <Ionicons name="camera-outline" size={22} color={palette.forest} />
          <AppText style={s.photoBtnText}>Камера</AppText>
        </PressScale>
        <PressScale onPress={() => choosePhoto("gallery")} scaleTo={0.96} style={s.photoBtn}>
          <Ionicons name="images-outline" size={22} color={palette.forest} />
          <AppText style={s.photoBtnText}>Галерея</AppText>
        </PressScale>
      </View>
      {shownPhoto ? (
        <Button
          label="Убрать фото"
          variant="danger"
          onPress={() => {
            setNewPhoto(null);
            setRemovePhoto(true);
          }}
          style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
        />
      ) : null}

      <View style={{ marginTop: space.x5 }}>
        <TextField
          label="Никнейм"
          placeholder="Например: eco_hero"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          value={nickname}
          onChangeText={setNickname}
          error={nickError}
          hint={checking ? "Проверяем ник…" : "Его будут видеть другие участники в рейтинге. Настоящее имя остаётся скрытым."}
        />
      </View>

      <SectionHeader title={shownPhoto ? "Аватар без фото" : "Аватар"} hint={shownPhoto ? "если уберёте фото" : undefined} />
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
  preview: { alignItems: "center", marginTop: space.x5, marginBottom: space.x2 },
  photoRow: { flexDirection: "row", gap: space.x2 },
  photoBtn: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.x2,
    borderRadius: radius.field,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: palette.line,
    backgroundColor: palette.surface,
  },
  photoBtnText: { fontFamily: font.semibold, fontSize: 14, color: palette.forest },
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
