import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "../components/ui/app-text";
import { BackButton } from "../components/ui/back-button";
import { Button } from "../components/ui/button";
import { Screen } from "../components/ui/screen";
import { SectionHeader } from "../components/ui/section-header";
import { supabase } from "../lib/supabase";
import { color, font, radius, space } from "../lib/theme";

type Photo = { uri: string; base64: string };

function PhotoSlot({ label, photo, onPress, disabled }: { label: string; photo: Photo | null; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [s.slot, !photo && s.slotEmpty, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={disabled}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={s.photo} />
          <View style={s.slotTag}>
            <Ionicons name="checkmark" size={14} color={color.forest} />
            <AppText style={s.slotTagText}>{label}</AppText>
          </View>
          {!disabled && (
            <View style={s.retake}>
              <Ionicons name="camera-reverse-outline" size={16} color={color.onForest} />
            </View>
          )}
        </>
      ) : (
        <>
          <View style={s.slotIcon}>
            <Ionicons name="camera-outline" size={24} color={color.forest} />
          </View>
          <AppText variant="bodyStrong">Фото {label.toLowerCase()}</AppText>
          <AppText variant="caption">нажмите, чтобы снять</AppText>
        </>
      )}
    </Pressable>
  );
}

export default function TaskScreen() {
  const { id, title, points, emoji, description } = useLocalSearchParams<{
    id: string;
    title: string;
    points: string;
    emoji: string;
    description: string;
  }>();
  const router = useRouter();
  const [before, setBefore] = useState<Photo | null>(null);
  const [after, setAfter] = useState<Photo | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const takePhoto = async (setter: (p: Photo) => void) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Нужен доступ к камере", "Разрешите камеру в настройках телефона.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64 || asset.base64.length < 1000) {
      Alert.alert("Фото не получилось", "Сделайте фото ещё раз.");
      return;
    }
    setter({ uri: asset.uri, base64: asset.base64 });
  };

  const uploadPhoto = async (photo: Photo, userId: string, label: string) => {
    const path = `${userId}/${Date.now()}-${label}.jpg`;
    const bytes = decode(photo.base64);
    if (bytes.byteLength < 1000) {
      throw new Error("Фото пустое. Сделайте его заново.");
    }
    const { error } = await supabase.storage
      .from("submissions")
      .upload(path, bytes, { contentType: "image/jpeg" });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!before || !after) {
      Alert.alert("Нужны оба фото", "Сделайте фото «до» и «после».");
      return;
    }
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const user = s.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const beforePath = await uploadPhoto(before, user.id, "before");
      const afterPath = await uploadPhoto(after, user.id, "after");
      const { error } = await supabase.from("submissions").insert({
        task_id: Number(id),
        before_path: beforePath,
        after_path: afterPath,
      });
      if (error) {
        if (error.code === "23505") {
          Alert.alert("Уже отправлено", "Это задание уже на проверке. Дождитесь результата.");
          return;
        }
        throw error;
      }
      setSent(true);
    } catch (e: any) {
      Alert.alert("Не удалось отправить", e?.message ?? "Проверьте интернет и попробуйте снова.");
    } finally {
      setSending(false);
    }
  };

  const ready = before && after;

  return (
    <Screen
      bottomInset
      footer={
        sent ? undefined : (
          <View style={{ gap: space.x2 }}>
            {!ready && (
              <AppText variant="caption" style={{ textAlign: "center" }}>
                {before ? "Осталось фото после" : "Сначала сфотографируйте место до"}
              </AppText>
            )}
            <Button label="Отправить на проверку" icon="paper-plane-outline" onPress={submit} loading={sending} />
          </View>
        )
      }
    >
      <BackButton />

      <View style={s.head}>
        <View style={s.emojiBox}>
          <Text style={{ fontSize: 36 }}>{emoji}</Text>
        </View>
        <View style={s.ptsPill}>
          <AppText style={s.ptsText}>+{points} TZ</AppText>
        </View>
      </View>
      <AppText variant="h1" style={{ marginTop: space.x4 }}>
        {title}
      </AppText>

      <SectionHeader title="Как выполнить" />
      <AppText variant="body" color={color.ink}>
        {description}
      </AppText>

      <SectionHeader title="Фото" hint="до и после" />
      <View style={s.row}>
        <PhotoSlot label="До" photo={before} onPress={() => takePhoto(setBefore)} disabled={sent} />
        <PhotoSlot label="После" photo={after} onPress={() => takePhoto(setAfter)} disabled={sent} />
      </View>
      <View style={s.note}>
        <Ionicons name="lock-closed-outline" size={14} color={color.muted} />
        <AppText variant="caption" style={{ flex: 1 }}>
          Фото видят только проверяющие. В портфолио они не показываются.
        </AppText>
      </View>

      {sent && (
        <Animated.View entering={FadeInDown.duration(320)} style={s.success}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark" size={28} color={color.forest} />
          </View>
          <AppText variant="h2" style={{ textAlign: "center" }}>
            Отправлено на проверку
          </AppText>
          <AppText variant="body" color={color.muted} style={{ textAlign: "center" }}>
            Очки TZ появятся после проверки. Статус — в профиле, в «Моих заданиях».
          </AppText>
          <Button label="К заданиям" variant="secondary" onPress={() => router.replace("/")} style={{ marginTop: space.x2, alignSelf: "stretch" }} />
        </Animated.View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  emojiBox: { width: 72, height: 72, borderRadius: 22, backgroundColor: color.limeSoft, alignItems: "center", justifyContent: "center" },
  ptsPill: { backgroundColor: color.forest, borderRadius: radius.pill, paddingHorizontal: space.x4, paddingVertical: space.x2 },
  ptsText: { fontFamily: font.bold, fontSize: 15, color: color.lime },
  row: { flexDirection: "row", gap: space.x3 },
  slot: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  slotEmpty: { borderWidth: 1.5, borderColor: color.line, borderStyle: "dashed" },
  slotIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: color.limeSoft, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  slotTag: {
    position: "absolute",
    left: space.x2,
    top: space.x2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: color.lime,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotTagText: { fontFamily: font.semibold, fontSize: 12, color: color.forest },
  retake: {
    position: "absolute",
    right: space.x2,
    bottom: space.x2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(21,61,44,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.x3 },
  success: {
    alignItems: "center",
    gap: space.x2,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.card,
    padding: space.x5,
    marginTop: space.x6,
  },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.lime, alignItems: "center", justifyContent: "center", marginBottom: space.x1 },
});
